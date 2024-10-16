// MeetingRoom.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaClosedCaptioning,
  FaPhoneSlash,
  FaAssistiveListeningSystems,
  FaSpinner, // Use spinner icon
} from 'react-icons/fa';
import SimplePeer from 'simple-peer';

export default function MeetingRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const decodedRoomId = decodeURIComponent(roomId);
  const [transcriptVisible, setTranscriptVisible] = useState(false);
  const [micOn, setMicOn] = useState(true);

  // Modify transcript state to be an array of messages
  const [transcript, setTranscript] = useState([]); // Changed from '' to []

  const [isLoading, setIsLoading] = useState(true);
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
      statusIcon: null,
    },
  ]);
  const ws = useRef(null);
  const peersRef = useRef({});
  const serverPeerRef = useRef(null);
  const localStream = useRef(null);
  const animationFrameId = useRef(null);
  const modelAudioRef = useRef(null);

  // Voice Activity Detection (same as before)
  const analyzeAudio = useCallback(() => {
    participants.forEach((participant) => {
      if (participant.analyserNode) {
        const dataArray = new Uint8Array(
          participant.analyserNode.frequencyBinCount
        );
        participant.analyserNode.getByteFrequencyData(dataArray);
        const _voiceActivity = dataArray.reduce(
          (accumulator, currentValue) => accumulator + currentValue,
          0
        );
        const _voiceActivityLevel = Math.floor(_voiceActivity / 1000);
        const isTalking = _voiceActivityLevel > 0; // Adjust threshold as needed

        // Update participant's talking state
        setParticipants((prevParticipants) =>
          prevParticipants.map((p) =>
            p.name === participant.name ? { ...p, isTalking } : p
          )
        );
        if (isTalking && participant.name === 'Model') {
          setParticipants((prevParticipants) =>
            prevParticipants.map((participant) =>
              participant.name === 'Model'
                ? { ...participant, statusIcon: null }
                : participant
            )
          );
        }
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
        setIsLoading(false);
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
      }
      // Handle user_text and system_text messages
      else if (message.type === 'user_text') {
        // Append user message with white color
        setTranscript((prevTranscript) => [
          ...prevTranscript,
          { text: message.data, color: 'white' },
        ]);
      } else if (message.type === 'system_text') {
        // Append system message with green color
        setTranscript((prevTranscript) => [
          ...prevTranscript,
          { text: message.data, color: 'green' },
        ]);
      } else if (message.type === 'command') {
        const command = message.data;
        if (command === 'user_turn') {
          // Show "ear" icon on model head
          setParticipants((prevParticipants) =>
            prevParticipants.map((participant) =>
              participant.name === 'Model'
                ? { ...participant, statusIcon: 'ear' }
                : participant
            )
          );
        } else if (command === 'system_turn') {
          // Show spinner icon on model head
          setParticipants((prevParticipants) =>
            prevParticipants.map((participant) =>
              participant.name === 'Model'
                ? { ...participant, statusIcon: 'spinner' }
                : participant
            )
          );
        }
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
    );

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
    <div className="flex flex-col items-center justify-center h-full w-full bg-gray-900 relative">
      {/* Loading Icon */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-50">
          <FaSpinner className="animate-spin text-white" size={50} />
        </div>
      )}

      <div className="flex w-4/5 space-x-8 mb-8">
        {participants.map((participant, index) => (
          <div
            key={index}
            className={`w-1/2 h-64 bg-gray-800 rounded-xl flex flex-col items-center justify-center relative ${
              participant.isTalking ? 'border-4 border-green-500' : ''
            }`}
          >
            {/* Participant Icon */}
            <div className="mb-4 relative">
              {participant.icon ? (
                participant.icon
              ) : (
                <div className="w-24 h-24 bg-gray-600 rounded-full"></div>
              )}
              {/* Status Icon Overlay */}
              {participant.statusIcon && (
                <div className="absolute top-0 right-0">
                  {participant.statusIcon === 'ear' && (
                    <FaAssistiveListeningSystems size={24} color="white" />
                  )}
                  {participant.statusIcon === 'spinner' && (
                    <FaSpinner
                      size={24}
                      color="white"
                      className="animate-spin"
                    />
                  )}
                </div>
              )}
            </div>
            {/* Participant Name */}
            <span className="text-white" style={{ fontSize: '18px' }}>
              {participant.name}
            </span>
          </div>
        ))}
      </div>


      {/* Bottom Bar */}
      <div className="absolute bottom-0 w-full bg-gray-800 p-4 flex justify-center space-x-8">
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
        <div
          className="absolute bottom-16 w-full bg-black bg-opacity-75 text-center p-2"
          style={{ maxHeight: '200px', overflowY: 'auto' }}
        >
          {/* Display grouped transcript here */}
          <div>
            {(() => {
              // Group messages by color
              const groupedTranscript = [];
              if (transcript.length > 0) {
                let lastColor = transcript[0].color;
                let lastText = transcript[0].text;
                for (let i = 1; i < transcript.length; i++) {
                  if (transcript[i].color === lastColor) {
                    // Same color, concatenate text
                    lastText += ' ' + transcript[i].text;
                  } else {
                    // Different color, push last message and reset
                    groupedTranscript.push({ text: lastText, color: lastColor });
                    lastColor = transcript[i].color;
                    lastText = transcript[i].text;
                  }
                }
                // Push the last accumulated message
                groupedTranscript.push({ text: lastText, color: lastColor });
              }

              return groupedTranscript.map((message, index) => (
                <p key={index} style={{ color: message.color }}>
                  {message.text}
                </p>
              ));
            })()}
          </div>
        </div>
      )}
      {/* Add the audio element */}
      <div style={{ display: 'none' }}>
        <audio ref={modelAudioRef} autoPlay />
      </div>
    </div>
  );
}
