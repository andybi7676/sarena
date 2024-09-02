import React from 'react';
import TalkingHead from './TalkingHead';
import CustomAudioPlayer from './CustomAudioPlayer';
import EvaluationPanel from './EvaluationPanel';

const modelAAudioSrc = require("../demo/model_A.flac");
const modelBAudioSrc = require("../demo/model_B.flac");

function MachineMachineInterface() {
  const [isPlaying, setIsPlaying] = React.useState(false);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  }

  return (
    <div className="max-w-full flex items-center flex-col min-h-screen p-8 boder-slate-500">
      <div className="w-4/5 h-full flex items-center flex-col bg-gray-800 m-1 p-4 rounded-xl border-slate-500">
        <div className='flex flex-row w-full items-stretch'>
          <div className='flex w-1/2 place-content-center'>
            <TalkingHead id="MA_talking_head" name="Model A" audioSrc={modelAAudioSrc} isPlaying={isPlaying} />
          </div>
          <div className='flex w-1/2 place-content-center'>
            <TalkingHead id="MB_talking_head" name="Model B" audioSrc={modelBAudioSrc} isPlaying={isPlaying} />
          </div>
        </div>
        <CustomAudioPlayer isPlaying={isPlaying} togglePlay={togglePlay} />
        {/* <AudioPlayerWithCapture /> */}
      </div>
      <EvaluationPanel />
    </div>
  )
}

export default MachineMachineInterface
