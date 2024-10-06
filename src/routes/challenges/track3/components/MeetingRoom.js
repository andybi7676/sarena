// MeetingRoom.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaClosedCaptioning,
  FaPhoneSlash,
} from 'react-icons/fa';
import SimplePeer from 'simple-peer';

export default function MeetingRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const decodedRoomId = decodeURIComponent(roomId);
  const [transcriptVisible, setTranscriptVisible] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [participants, setParticipants] = useState([
    {
      name: 'You',
      icon: null,
      isTalking: false,
      audioStream: null,
      analyserNode: null,
      audioContext: null,
    },
    {
      name: 'Model',
      icon: null,
      isTalking: false,
      audioStream: null,
      analyserNode: null,
      audioContext: null,
    },
  ]);
  const ws = useRef(null);
  const peersRef = useRef({});
  const serverPeerRef = useRef(null);
  const localStream = useRef(null);
  const animationFrameId = useRef(null);
  const modelAudioRef = useRef(null);

  // Voice Activity Detection
  const analyzeAudio = useCallback(() => {
    participants.forEach((participant) => {
      if (participant.analyserNode) {
        const dataArray = new Uint8Array(
          participant.analyserNode.frequencyBinCount
        );
        participant.analyserNode.getByteFrequencyData(dataArray);
        const _voiceActivity = dataArray.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
        const _voiceActivityLevel = Math.floor(_voiceActivity / 1000);
        // console.log(`Frequency Data from ${participant.name}:`, _voiceActivityLevel);
        const isTalking = _voiceActivityLevel > 0; // Adjust threshold as needed

        // Update participant's talking state
        setParticipants((prevParticipants) =>
          prevParticipants.map((p) =>
            p.name === participant.name ? { ...p, isTalking } : p
          )
        );
      }
    });

    // Continue analyzing
    animationFrameId.current = requestAnimationFrame(analyzeAudio);
  }, [participants]);

  useEffect(() => {
    participants.forEach((participant) => {
      if (participant.audioStream && !participant.analyserNode) {
        // Initialize audio analysis for this participant
        const audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
        const analyserNode = audioContext.createAnalyser();
        const sourceNode = audioContext.createMediaStreamSource(
          participant.audioStream
        );
        sourceNode.connect(analyserNode);

        analyserNode.fftSize = 1024;
        analyserNode.minDecibels = -80;
        analyserNode.maxDecibels = -10;
        analyserNode.smoothingTimeConstant = 0.4;

        // Update participant with audio context and analyser node
        setParticipants((prevParticipants) =>
          prevParticipants.map((p) =>
            p.name === participant.name
              ? { ...p, analyserNode, audioContext }
              : p
          )
        );
      }
    });
  }, [participants]);

  useEffect(() => {
    if (participants.some((p) => p.analyserNode)) {
      analyzeAudio();
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [participants, analyzeAudio]);

  useEffect(() => {
    console.log(`Room ID: ${roomId}`);
    console.log(`Decoded Room ID: ${decodedRoomId}`);

    const wsUrl = `wss://slmarena.ntuspeechlab.com:8080/ws?roomId=${encodeURIComponent(
      roomId
    )}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      // Initialize local media stream
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        localStream.current = stream;
        setParticipants((prevParticipants) =>
          prevParticipants.map((p) =>
            p.name === 'You' ? { ...p, audioStream: stream } : p
          )
        );

        // Send message to server to join the room
        ws.current.send(
          JSON.stringify({
            type: 'join_room',
            roomId: roomId,
            name: 'You',
          })
        );

        // Establish WebRTC connection to the server
        createServerPeerConnection(stream);
      });
    };

    ws.current.onmessage = (event) => {
      console.log('Received message:', event.data);
      const message = JSON.parse(event.data);

      if (message.type === 'webrtc_signal') {
        if (serverPeerRef.current) {
          serverPeerRef.current.signal(message.data);
        }
      } else if (message.type === 'user_joined') {
        // Handle other participants joining
        const participantName = message.name;
        if (participantName !== 'You') {
          setParticipants((prevParticipants) => [
            ...prevParticipants,
            {
              name: participantName,
              icon: null,
              isTalking: false,
              audioStream: null,
              analyserNode: null,
              audioContext: null,
            },
          ]);
          createPeerConnection(participantName, true);
        }
      } else if (message.type === 'signal') {
        const from = message.from;
        const data = message.data;

        if (!peersRef.current[from]) {
          createPeerConnection(from, false);
        }
        peersRef.current[from].signal(data);
      } else if (message.type.includes('text')) {
        setTranscript((prev) => prev + '\n' + message.data);
      } else if (message.type === 'model_speaking') {
        // Set model's talking status
        setParticipants((prevParticipants) =>
          prevParticipants.map((participant) =>
            participant.name === 'Model'
              ? { ...participant, isTalking: true }
              : participant
          )
        );
        // Reset after a delay
        setTimeout(() => {
          setParticipants((prevParticipants) =>
            prevParticipants.map((participant) =>
              participant.name === 'Model'
                ? { ...participant, isTalking: false }
                : participant
            )
          );
        }, 2000); // Adjust the delay as needed
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.current.onclose = () => {
      console.log('WebSocket closed');
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
      // Destroy peer connections
      Object.values(peersRef.current).forEach((peer) => {
        peer.destroy();
      });
      if (serverPeerRef.current) {
        serverPeerRef.current.destroy();
      }
      // Stop local media stream tracks
      if (localStream.current) {
        localStream.current.getTracks().forEach((track) => {
          track.stop();
        });
      }
      // Cancel animation frames
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [roomId]);

  const createServerPeerConnection = (stream) => {
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    peer.on('signal', (data) => {
      ws.current.send(
        JSON.stringify({
          type: 'webrtc_signal',
          data: data,
        })
      );
    });

    peer.on('stream', (remoteStream) => {
      // Update model's audio stream
      setParticipants((prevParticipants) =>
        prevParticipants.map((p) =>
          p.name === 'Model' ? { ...p, audioStream: remoteStream } : p
        )
      );
      modelAudioRef.current.srcObject = remoteStream;
    });

    peer.on('connect', () => {
      console.log('WebRTC connection to server established');
    });

    peer.on('error', (err) => {
      console.error('WebRTC error:', err);
    });

    serverPeerRef.current = peer;
  };

  const createPeerConnection = (participantName, initiator) => {
    const peer = new SimplePeer({
      initiator,
      trickle: false,
      stream: initiator ? localStream.current : null,
    });

    peer.on('signal', (data) => {
      ws.current.send(
        JSON.stringify({
          type: 'signal',
          to: participantName,
          from: 'You',
          data,
        })
      );
    });

    peer.on('stream', (stream) => {
      // Update participant's audio stream
      setParticipants((prevParticipants) =>
        prevParticipants.map((p) =>
          p.name === participantName ? { ...p, audioStream: stream } : p
        )
      );
    });

    peer.on('error', (err) => {
      console.error('Peer error:', err);
    });

    peersRef.current[participantName] = peer;
  };

  // Toggle transcript visibility
  const toggleTranscript = () => {
    setTranscriptVisible(!transcriptVisible);
  };

  // Leave the meeting room
  const leaveRoom = () => {

    // Send message to server to leave the room
    ws.current.send(
      JSON.stringify({
        type: 'leave_room',
        roomId: roomId,
        name: 'You',
      })
    )


    if (ws.current) {
      ws.current.close();
    }

    // Destroy all peer connections
    Object.values(peersRef.current).forEach((peer) => {
      peer.destroy();
    });
    if (serverPeerRef.current) {
      serverPeerRef.current.destroy();
    }

    // Stop all media tracks
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => {
        track.stop();
      });
    }

    // Navigate back to the landing page
    navigate('/challenges/track3');
  };

  // Toggle microphone on/off
  const toggleMic = () => {
    setMicOn(!micOn);
    if (localStream.current) {
      localStream.current.getAudioTracks().forEach((track) => {
        track.enabled = !micOn;
      });
    }
  };

  // Update user's talking status based on micOn
  useEffect(() => {
    setParticipants((prevParticipants) =>
      prevParticipants.map((participant) =>
        participant.name === 'You'
          ? { ...participant, isTalking: micOn }
          : participant
      )
    );
  }, [micOn]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      <div className="flex space-x-8 mb-8">
        {participants.map((participant, index) => (
          <div
            key={index}
            className={`w-64 h-64 bg-gray-800 rounded-xl flex flex-col items-center justify-center ${
              participant.isTalking ? 'border-4 border-green-500' : ''
            }`}
          >
            {/* Participant Icon */}
            <div className="mb-4">
              {participant.icon ? (
                participant.icon
              ) : (
                <div className="w-24 h-24 bg-gray-600 rounded-full"></div>
              )}
            </div>
            {/* Participant Name */}
            <span className="text-white" style={{ fontSize: '18px' }}>{participant.name}</span>
          </div>
        ))}
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 w-full bg-gray-800 p-4 flex justify-center space-x-8">
        {/* Close Mic */}
        <button
          className="text-white hover:text-gray-400"
          onClick={toggleMic}
        >
          {micOn ? (
            <FaMicrophone size={30} />
          ) : (
            <FaMicrophoneSlash size={30} />
          )}
        </button>
        {/* CC (Subtitle) */}
        <button
          className={`text-white hover:text-gray-400 ${
            transcriptVisible ? 'text-green-500' : ''
          }`}
          onClick={toggleTranscript}
        >
          <FaClosedCaptioning size={30} />
        </button>
        {/* Leave Room */}
        <button
          className="text-white hover:text-gray-400"
          onClick={leaveRoom}
        >
          <FaPhoneSlash size={30} />
        </button>
      </div>

      {/* Transcript */}
      {transcriptVisible && (
        <div className="absolute bottom-16 w-full bg-black bg-opacity-75 text-white text-center p-2">
          {/* Display transcript here */}
          <p>{transcript}</p>
        </div>
      )}
      {/* Add the audio element */}
      <div style={{ display: 'none' }}>
        <audio ref={modelAudioRef} autoPlay />
      </div>
    </div>
  );
}
