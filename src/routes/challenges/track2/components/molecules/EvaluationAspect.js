import React, { useState } from 'react';
import { Button } from '@headlessui/react';

function EvaluationAspect({ aspect }) {
  const [selection, setSelection] = useState(null);

  const toggleSelection = (selection) => {
    setSelection(selection);
  }

  return (
    <div className="w-full h-1/3 flex items-center flex-col p-4 rounded-xl border-slate-500">
      <p className="flex w-full text-2xl text-left text-slate-300 font-bold mb-4">
        {aspect}
      </p>
      <div className="w-full h-12 flex items-center flex-row m-2 border-slate-100">
        <Button 
          className={
            `rounded-l-lg w-1/2 h-full flex place-content-center border-2 hover:opacity-50 ${
              selection === `Model_A` 
              ? 
              "bg-slate-400 text-slate-900 border-slate-200"
              :
              "text-slate-500 hover:bg-slate-700 border-slate-500 " 
            }`
          }
          onClick={() => toggleSelection(`Model_A`)}
          >
          <p className='text-lg font-semibold text-center place-self-center'>
            Model A
          </p>
        </Button>
        <Button 
          className={
            `rounded-r-lg z-10 w-1/2 h-full flex place-content-center border-2 hover:opacity-50 ${
              selection === `Model_B` 
              ? 
              "bg-slate-400 text-slate-900 border-slate-200" 
              : 
              "text-slate-500 hover:bg-slate-700 border-slate-500 "
            }`
          }
          onClick={() => toggleSelection(`Model_B`)}
        >
          <p className='text-lg font-semibold text-center place-self-center'>
            Model B
          </p>
        </Button>
      </div>
    </div>
  )
}

export default EvaluationAspect
