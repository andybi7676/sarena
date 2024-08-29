import React from 'react';
import HumanMachineInterface from './components/HumanMachineInterface';

export default function Track3() {
  return (
    <div className='flex w-full min-h-full divide-x divide-slate-600'>
      <div className='w-2/3'>
        <HumanMachineInterface />
      </div>
      <div className='w-1/3'></div>
    </div>
  )
}