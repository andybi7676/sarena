import { Button } from '@headlessui/react';
import React, { useState, useEffect, useRef } from 'react';
import { LiveAudioVisualizer } from 'react-audio-visualize';
import SimplePeer from 'simple-peer';

export default function Recorder() {
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const ws = useRef(null);
  const sp = useRef(null);

  useEffect(() => {
    const establishPeerConnection = () => {
      ws.current = new WebSocket('ws://localhost:8080/ws');
  
      ws.current.onmessage = async (message) => {
        console.log('Received message:', message.data);
        const data = JSON.parse(message.data);
  
        if (data.type === 'answer' && sp.current) {
          sp.current.signal(data);
        }
      };
      ws.current.onopen = () => {
        console.log('Connected to ws server');
        console.log("Attempting to establish peer connection");
        const peer = new SimplePeer({ initiator: true, trickle: false });
        sp.current = peer;
  
        peer.on('error', err => console.log('error', err));
  
        peer.on('signal', (data) => {
          console.log("send signal: ", { type: 'offer', params: data })
          ws.current.send(JSON.stringify({ type: 'offer', params: data }));
        });
  
        peer.on('stream', (remoteStream) => {
          const audio = document.querySelector('audio');
          audio.srcObject = remoteStream;
          audio.play();
        });
  
        peer.on('connect', () => {
          console.log('Peer connection established');
        });
      };
      ws.current.onclose = () => {
        console.log('Disconnected from server');
      };
      ws.current.onerror = (error) => {
        console.error(`WebSocket error: ${error}`);
      };
    };
  
    establishPeerConnection();

    return () => {
      if (ws.current) {
        console.log('Disconnected from server');
        ws.current.close();
      }
      if (sp.current) {
        console.log('Destroyed peer connection');
        sp.current.destroy();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mr.start();
      if (sp.current !== null) {
        sp.current.addStream(stream);
      }
      setMediaRecorder(mr);
      setIsRecording(true);
    } catch (error) {
      console.error(error);
    }
  }

  const stopRecording = () => {
    mediaRecorder.stop();
    try {
      const senders = sp.current._pc.getSenders(); // Get all RTCRtpSenders
      senders.forEach(sender => {
        sp.current._pc.removeTrack(sender); // Remove each track
      });
    } catch (error) {
      console.error(error);
    }
    setMediaRecorder(null);
    setIsRecording(false);
  }

  return <div className="w-full p-2">
    <div className="w-full flex place-content-center mb-4">
      {
        isRecording 
        ?
        <Button className="px-1 bg-slate-500 text-white rounded-full hover:bg-slate-400 w-14 h-14 flex place-content-center" onClick={() => stopRecording()} >
          {/* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-8 place-self-center">
            </svg> */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-8 place-self-center">
            <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
            <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
          </svg>
        </Button>
        :
        <Button className="px-1 bg-red-500 text-white rounded-full hover:bg-red-300 w-14 h-14 flex place-content-center" onClick={() => startRecording()} >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-8 place-self-center">
            <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
            <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
            <path d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l18 18a.75.75 0 1 0 1.06-1.06l-18-18Z" />
          </svg>




          {/* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
          </svg> */}

          {/* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-8 place-self-center">
          </svg> */}
        </Button>
      }
      {/* <div className="w-4/5 flex m-2 mr-4 border">
        {
          mediaRecorder === null 
          ?
          <div className="self-center border m-2 w-max">
          </div>
          :
          <div className="!-z-10">
            <LiveAudioVisualizer
              mediaRecorder={mediaRecorder}
              height={60}
              gap={4}
              barWidth={4}
              className="!w-full"
            />
          </div>
        }
      </div> */}
    </div>
    <div className="w-full flex justify-between ">
      <audio className="w-full flex p-1 place-self-center" controls></audio>
    </div>
  </div>

}
