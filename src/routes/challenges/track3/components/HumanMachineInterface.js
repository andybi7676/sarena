import { Button, Textarea } from '@headlessui/react';
import React, { useState, useEffect, useRef } from 'react';
import { LiveAudioVisualizer } from 'react-audio-visualize';
import SimplePeer from 'simple-peer';
import { Message } from './molecules'; // Assuming you have this component for displaying messages

const placeholderCandidates = [
  'You are a chatbot, only respond precisely.',
  '你是一位旅行顧問，熟悉各國的旅遊景點和行程安排。你正在幫助一位顧客規劃他們的下一次海外旅行。',
];

export default function MergedRecorderChatbox() {
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mic_on, setMicOn] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [system_prompt, setSystemPrompt] = useState('');
  const [placeholderText, setPlaceholderText] = useState(placeholderCandidates[0]);
  const ws = useRef(null);
  const sp = useRef(null);
  const audioRef = useRef(null);
  let eos = true;

  useEffect(() => {

    // randomize placeholder text
    // setPlaceholderText(placeholderCandidates[Math.floor(Math.random() * placeholderCandidates.length)]);
    
    ws.current = new WebSocket('ws://localhost:8080/ws');

    ws.current.onmessage = async (event) => {
      console.log('Received message:', event.data);
      const message = JSON.parse(event.data);

      if (message.type === 'answer' && sp.current) {
        sp.current.signal(message);
      } else {
        handleChatMessage(message);
      }
    };

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      establishPeerConnection();
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
    };

    ws.current.onerror = (error) => {
      console.error(`WebSocket error: ${error}`);
    };

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

  const establishPeerConnection = () => {
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
      startRecording();
    });
  };

  const handleChatMessage = (message) => {
    if (message.eos) {
      eos = true;
    } else {
      if (eos) {
        setMessages((prevMessages) => [...prevMessages, message]);
        eos = false;
      } else {
        setMessages((prevMessages) => {
          if (prevMessages.length === 0) {
            // If no previous messages, simply add the new message
            return [message];
          } else {
            const lastMessage = prevMessages[prevMessages.length - 1];
            if (message.type === lastMessage.type) {
              return [
                ...prevMessages.slice(0, -1),
                { ...lastMessage, data: lastMessage.data + message.data }
              ];
            }
            return [...prevMessages, message];
          }
        });
      }
    }
  };

  const open_microphone = () => {
    setMicOn(true);
    // send message to server to open microphone
    if (ws.current) {
      ws.current.send(JSON.stringify({ type: 'open_mic' }));
    }
  };

  const close_microphone = () => {
    setMicOn(false);
    if (ws.current) {
      ws.current.send(JSON.stringify({ type: 'close_mic' }));
    }
    console.log("Microphone closed");
  };

  const startRecording = async () => {
    const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(localStream);
    mr.start();
    localStream.getTracks().forEach((track) => sp.current.addTrack(track, localStream));
    setMediaRecorder(mr);
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(track => track.stop()); // Stop each track
    const senders = sp.current._pc.getSenders(); // Get all RTCRtpSenders
    senders.forEach(sender => {
      sp.current._pc.removeTrack(sender); // Remove each track
    });
    setMediaRecorder(null);
    setIsRecording(false);
  }

  const sendMessage = () => {
    if (ws.current && inputText.trim()) {
      const message = { type: 'user_text', data: inputText, input_timestamp: Date.now() / 1000 };
      ws.current.send(JSON.stringify(message));
      setMessages((prevMessages) => [...prevMessages, message]);
      setInputText('');
      console.log('Sent message:', message);
    }
  };

  const sendSystemPrompt = () => {
    if (ws.current) {
      const systemPrompt = {
        type: 'system_prompt',
        data: system_prompt.trim() || placeholderText,
        input_timestamp: Date.now() / 1000,
      };
      ws.current.send(JSON.stringify(systemPrompt));
      setSystemPrompt('');
      console.log('Sent system prompt:', systemPrompt);
    }
  };

  return (
    <div className="max-w-full flex items-center flex-col min-h-screen p-8">
      <div className="w-2/3 flex items-center flex-col bg-gray-800 m-1 p-4 rounded-xl">
        {/* Chatbox UI */}
        <div className='w-full pb-2'>
          <div className="mb-4 p-2 w-full h-[30rem] flex flex-col overflow-auto items-center rounded-lg bg-gray-700">
            {messages.map((message, index) => (
              <Message key={index} message={message} />
            ))}
          </div>
          <div className="w-full" name="systemPrompt">
            <p className="text-slate-300 font-bold">System Prompt</p>
            <div className="flex flex-row w-full min-h-16 py-2">
              <Textarea
                type="text"
                className="text-wrap px-2 py-1 w-11/12 mr-2 items-center rounded-lg bg-gray-700 text-white"
                placeholder={placeholderText}
                value={system_prompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
              />
              <Button
                className="px-1 bg-blue-500 text-white rounded-lg hover:bg-blue-400 place-self-end h-8"
                onClick={sendSystemPrompt}
              >
                {/* Send Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                  <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.288Z" />
                </svg>
              </Button>
            </div>
          </div>
          <div className="w-full" name="inputText">
            <p className="text-slate-300 font-bold">Input Text</p>
            <div className="flex flex-row w-full min-h-16 py-2">
              <Textarea
                type="text"
                className="text-wrap px-2 py-1 w-11/12 mr-2 items-center rounded-lg bg-gray-700 text-white"
                placeholder="Type your message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <Button
                className="px-1 bg-blue-500 text-white rounded-lg hover:bg-blue-400 place-self-end h-8"
                onClick={sendMessage}
              >
                {/* Send Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                  <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.288Z" />
                </svg>
              </Button>
            </div>
          </div>
        </div>

      </div>
      {/* Recorder UI */}
      <div className="w-full p-2">
        {/* Recorder UI */}
        <div className="flex justify-around items-center p-4 bg-gray-800 rounded-b-xl">
          {mic_on ? (
            <Button className="mr-6 px-1 bg-slate-500 text-white rounded-full hover:bg-slate-400 w-14 h-14 flex place-content-center" onClick={() => close_microphone()} >
              {/* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-8 place-self-center">
                </svg> */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-8 place-self-center">
                <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
                <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
              </svg>
            </Button>
          ):(
            <Button className="mr-6 px-1 bg-red-500 text-white rounded-full hover:bg-red-300 w-14 h-14 flex place-content-center" onClick={() => open_microphone()} >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-8 place-self-center">
                <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
                <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
                <path d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l18 18a.75.75 0 1 0 1.06-1.06l-18-18Z" />
              </svg>
            </Button>
          )}
          {isRecording ? (
            <Button className="ml-6 px-1 bg-red-500 text-white rounded-full hover:bg-red-300 w-14 h-14 flex place-content-center" onClick={() => stopRecording()} >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-8 place-self-center">
                <path fillRule="evenodd" d="M15.22 3.22a.75.75 0 0 1 1.06 0L18 4.94l1.72-1.72a.75.75 0 1 1 1.06 1.06L19.06 6l1.72 1.72a.75.75 0 0 1-1.06 1.06L18 7.06l-1.72 1.72a.75.75 0 1 1-1.06-1.06L16.94 6l-1.72-1.72a.75.75 0 0 1 0-1.06ZM1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z" clipRule="evenodd" />
              </svg>
            </Button>
          ) : (
            <Button className="ml-6 px-1 bg-green-500 text-white rounded-full hover:bg-green-300 w-14 h-14 flex place-content-center" onClick={() => startRecording()} >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-8 place-self-center">
                <path fillRule="evenodd" d="M15 3.75a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0V5.56l-4.72 4.72a.75.75 0 1 1-1.06-1.06l4.72-4.72h-2.69a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z" clipRule="evenodd" />
              </svg>

            </Button>
          )}
        </div>

        {/* Audio Player */}
        <div className="w-full flex justify-between">
          <audio ref={audioRef} className="w-full flex p-1 place-self-center"></audio>
        </div>
      </div>
    </div>
  );
}
