// MachineMachineInterface.js
import React, { useState, useEffect } from 'react';
import TalkingHead from './TalkingHead';
import CustomAudioPlayer from './CustomAudioPlayer';
import EvaluationPanel from './EvaluationPanel';
import { v4 as uuidv4 } from 'uuid';

function MachineMachineInterface() {
  const [ws, setWs] = useState(null);
  const [clientId] = useState(uuidv4());
  const [modelAAudioSrc, setModelAAudioSrc] = useState('https://slmarena.ntuspeechlab.com:8080/demo/chinese_0001_A.wav');
  const [modelBAudioSrc, setModelBAudioSrc] = useState('https://slmarena.ntuspeechlab.com:8080/demo/chinese_0001_B.wav');
  const [modelAPrompt, setModelAPrompt] = useState('你是一位旅行顧問，熟悉各國的旅遊景點和行程安排。你正在幫助一位顧客規劃他們的下一次海外旅行。請根據顧客的興趣和需求，提供合適的旅遊建議，並為他們制定一個全面的旅行計劃。');
  const [modelBPrompt, setModelBPrompt] = useState('你是一位熱愛旅遊的顧客，計劃在下個月進行一趟海外旅行，但還不確定要去哪裡。你希望得到旅行顧問的建議，請分享你的旅遊興趣、喜歡的活動，以及希望旅行中體驗的文化或風景，並在討論中積極回應顧問的建議。');
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const fetchData = () => {
    // Initialize WebSocket connection
    const websocket = new WebSocket('wss://slmarena.ntuspeechlab.com:8080/ws/track2');
    websocket.onopen = () => {
      console.log('WebSocket connection established');
    };
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received message:', data);
      setModelAAudioSrc(data.sample_path_A);
      setModelBAudioSrc(data.sample_path_B);
      setModelAPrompt(data.system_prompt_A);
      setModelBPrompt(data.system_prompt_B);
    };
    websocket.onclose = () => {
      console.log('WebSocket connection closed');
    };
    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    setWs(websocket);

    // Cleanup on component unmount
    return () => {
      websocket.close();
    };
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="max-w-full flex items-center flex-col min-h-screen p-8 border-slate-500">
      <div className="w-4/5 h-full flex items-center flex-col bg-gray-800 m-1 p-4 rounded-xl border-slate-500">
        <div className="flex flex-row w-full items-stretch">
          <div className="flex w-1/2 place-content-center">
            <TalkingHead
              id="MA_talking_head"
              name="Model A"
              audioSrc={modelAAudioSrc}
              isPlaying={isPlaying}
            />
          </div>
          <div className="flex w-1/2 place-content-center">
            <TalkingHead
              id="MB_talking_head"
              name="Model B"
              audioSrc={modelBAudioSrc}
              isPlaying={isPlaying}
            />
          </div>
        </div>
        <div className="flex flex-row w-full items-stretch gap-4">
        <div className="flex w-1/2 place-content-center">
            <p className="place-self-center text-lg text-slate-300">{modelAPrompt}</p>
          </div>
          <div className="flex w-1/2 place-content-center">
            <p className="place-self-center text-lg text-slate-300">{modelBPrompt}</p>
          </div>
        </div>
        <CustomAudioPlayer isPlaying={isPlaying} togglePlay={togglePlay} />
      </div>
      <EvaluationPanel ws={ws} clientId={clientId} handleNext={fetchData} />
    </div>
  );
}

export default MachineMachineInterface;
