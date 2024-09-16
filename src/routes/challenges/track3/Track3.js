import React from 'react';
import HumanMachineInterface from './components/HumanMachineInterface';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MeetingRoom from './components/MeetingRoom';
import LandingPage from './components/LandingPage';

export default function Track3() {
  return (
    <div className='flex w-full min-h-full divide-x divide-slate-600'>
      <div className='w-2/3'>
        {/* <HumanMachineInterface /> */}
        <Routes>
          <Route path='' element={<LandingPage />} />
          <Route path='playground' element={<HumanMachineInterface />} />
          <Route path='meeting/:roomId' element={<MeetingRoom />} />
        </Routes>
      </div>
      <div className='w-1/3'></div>
    </div>
  )
}