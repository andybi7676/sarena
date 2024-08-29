import React from 'react';
import TalkingHead from './TalkingHead';


function MachineMachineInterface() {
  return (
    <div className="max-w-full flex items-center flex-col min-h-screen p-8 border-2 boder-slate-500">
      <div className="w-4/5 h-full flex items-center flex-col bg-gray-800 m-1 p-4 rounded-xl border-2 border-slate-500">
        <div className='flex flex-row border w-full items-stretch'>
          <div className='w-1/2'>
            <TalkingHead />
          </div>
          <div className='w-1/2'>
            <TalkingHead />
          </div>
        </div>
        {/* <CustomAudioPlayer /> */}
      </div>
    </div>
  )
}

export default MachineMachineInterface
