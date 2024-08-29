import React from 'react';
import { HeaderBanner, NavBar } from './components';
import { Outlet } from "react-router-dom";

function App() {
  return (
    <div className="font-sans min-h-screen bg-slate-900 flex flex-col divide-y divide-slate-600">
      <HeaderBanner/>
      <div className='flex flex-row w-full min-h-screen bg-slate-900 divide-x divide-slate-600'>
        <div className='w-1/4 font-medium'>
          <NavBar />
        </div>
        <div className='w-3/4'>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default App;