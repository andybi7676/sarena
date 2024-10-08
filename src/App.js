import React from 'react';

function App() {
  return (
    <div className="font-sans min-h-screen bg-slate-900 flex flex-col divide-y divide-slate-600">
      <HeaderBanner/>
      <div className='flex flex-row w-full min-h-full bg-slate-900 divide-x divide-slate-600'>
        <div className='w-1/4 font-medium'>
          <NavBar />
        </div>
        <div className='w-2/4'>
        </div>
        <div className='w-1/4'></div>
      </div>
    </div>
  );
}

export default App;