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
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    mr.start();
    if (sp.current !== null) {
      sp.current.addStream(stream);
    }
    setMediaRecorder(mr);
    setIsRecording(true);
  }

  const stopRecording = () => {
    mediaRecorder.stop();
    const senders = sp.current._pc.getSenders(); // Get all RTCRtpSenders
    senders.forEach(sender => {
      sp.current._pc.removeTrack(sender); // Remove each track
    });
    setMediaRecorder(null);
    setIsRecording(false);
  }

  return <div className="w-full p-2">
    <div className="w-full flex place-content-center mb-4">
      {
        isRecording 
        ?
        <Button className="px-1 bg-red-500 text-white rounded-full hover:bg-red-300 w-14 h-14 flex place-content-center" onClick={() => stopRecording()} >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-8 place-self-center">
            <path fillRule="evenodd" d="M15.22 3.22a.75.75 0 0 1 1.06 0L18 4.94l1.72-1.72a.75.75 0 1 1 1.06 1.06L19.06 6l1.72 1.72a.75.75 0 0 1-1.06 1.06L18 7.06l-1.72 1.72a.75.75 0 1 1-1.06-1.06L16.94 6l-1.72-1.72a.75.75 0 0 1 0-1.06ZM1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z" clipRule="evenodd" />
          </svg>
        </Button>
        :
        <Button className="px-1 bg-green-500 text-white rounded-full hover:bg-green-300 w-14 h-14 flex place-content-center" onClick={() => startRecording()} >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-8 place-self-center">
            <path fillRule="evenodd" d="M15 3.75a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0V5.56l-4.72 4.72a.75.75 0 1 1-1.06-1.06l4.72-4.72h-2.69a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z" clipRule="evenodd" />
          </svg>

        </Button>
      }
      {/* <div class="w-4/5 flex m-2 mr-4 border">
        {
          mediaRecorder === null 
          ?
          <div class="self-center border m-2 w-max">
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
