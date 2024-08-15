import React, { useState, useEffect, useRef } from 'react';
import SimplePeer from 'simple-peer';

const WebRTCTester = () => {
  const [stream, setStream] = useState(null);
  const [hasPeer, setHasPeer] = useState(false);
  const peer = useRef(null);
  const ws = useRef(null);

  const getMedia = async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setStream(mediaStream);
  };

  useEffect(() => {
    console.log("Peer:", peer.current);
    getMedia();
    if (peer.current !== null) {
      setHasPeer(true);
    }
    else {
      setHasPeer(false);
    }

    ws.current = new WebSocket('ws://localhost:8080/ws');

    ws.current.onmessage = async (message) => {
      console.log('Received message:', message.data);
      const data = JSON.parse(message.data);

      if (data.type === 'answer' && peer.current) {
        peer.current.signal(data);
      }
    };

    return () => {
      if (ws.current) {
        ws.current.close();
        console.log('Disconnected from server');
      }
    };
  }, [peer]);

  const startCall = () => {
    const p = new SimplePeer({ initiator: true, trickle: false, stream });

    p.on('error', err => console.log('error', err));

    p.on('signal', (data) => {
      console.log("send signal: ", { type: 'offer', params: data })
      ws.current.send(JSON.stringify({ type: 'offer', params: data }));
    });

    p.on('stream', (remoteStream) => {
      const audio = document.querySelector('audio');
      audio.srcObject = remoteStream;
      audio.play();
    });

    peer.current = p;
    
    setHasPeer(true);
  };

  const endCall = () => {
    if (peer) {
      peer.current.destroy();
      peer.current = null;
    }

    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
      setStream(null);
    }

    setHasPeer(false);
  };

  return (
    <div>
      <h1>WebRTC Voice Assistant: "Echo"</h1>
      <button onClick={startCall} disabled={hasPeer}>Start Call</button>
      <button onClick={endCall} disabled={!hasPeer}>End Call</button>
      <audio controls></audio>
    </div>
  );
};

export default WebRTCTester;