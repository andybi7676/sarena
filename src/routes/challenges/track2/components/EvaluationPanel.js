import { Button } from '@headlessui/react';
import React, { useState } from 'react';
import EvaluationAspect from './molecules/EvaluationAspect';

const evaluationAspects = [
  "Intelligibility",
  "Naturalness",
  "Overall"
]

function EvaluationPanel() {

  return (
    <div className="w-4/5 h-full flex items-center flex-col mt-4 py-4 rounded-xl bg-gray-800">
      {
        evaluationAspects.map((aspect, index) => {
          return (
            <EvaluationAspect key={index} aspect={aspect} />
          );
        })
      }
    </div>
  )
}

export default EvaluationPanel
