// EvaluationAspect.js
import React from 'react';

function EvaluationAspect({ aspect, value, onChange }) {
  const toggleSelection = (newSelection) => {
    onChange(newSelection);
  };

  return (
    <div className="w-full h-1/3 flex items-center flex-col p-4 rounded-xl border-slate-500">
      <p className="flex w-full text-2xl text-left text-slate-300 font-bold mb-4">
        {aspect}
      </p>
      <div className="w-full h-12 flex items-center flex-row m-2 border-slate-100">
        <button
          className={`rounded-l-lg w-1/2 h-full flex place-content-center border-2 hover:opacity-50 ${
            value === 'A'
              ? 'bg-slate-400 text-slate-900 border-slate-200'
              : 'text-slate-500 hover:bg-slate-700 border-slate-500'
          }`}
          onClick={() => toggleSelection('A')}
        >
          <p className="text-lg font-semibold text-center place-self-center">
            Model A
          </p>
        </button>
        <button
          className={`rounded-r-lg z-10 w-1/2 h-full flex place-content-center border-2 hover:opacity-50 ${
            value === 'B'
              ? 'bg-slate-400 text-slate-900 border-slate-200'
              : 'text-slate-500 hover:bg-slate-700 border-slate-500'
          }`}
          onClick={() => toggleSelection('B')}
        >
          <p className="text-lg font-semibold text-center place-self-center">
            Model B
          </p>
        </button>
      </div>
    </div>
  );
}

export default EvaluationAspect;
