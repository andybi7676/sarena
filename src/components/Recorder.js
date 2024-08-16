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

  return <div class="w-full p-1 border">

    <div class="w-full flex border justify-between">
      {
        isRecording 
        ?
        <button class="border w-15 h-15 m-2 rounded-full hover:bg-slate-200 align-left" onClick={() => stopRecording()} >
          <svg xmlns="http://www.w3.org/2000/svg" fill="red" fillOpacity={0.5} viewBox="0 0 24 24" strokeWidth={0.8} stroke="red" className="size-8 m-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" />
          </svg>
        </button>
        :
        <button class="border w-15 m-2 rounded-full hover:bg-slate-200 align-left" onClick={() => startRecording()} >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={0.8} stroke="gray" className="size-12 m-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
          </svg>
        </button>
      }
      <div class="w-4/5 flex m-2 mr-4 border">
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
      </div>
    </div>
    <div class="w-full flex border justify-between">
      <audio class="w-full flex m-2 p-1 place-self-center" controls></audio>
    </div>
  </div>

}
