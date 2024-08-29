import React from 'react';
import { useRouteError } from "react-router-dom";

function ErrorPage() {
    const error = useRouteError();
    console.error(error);
  
    return (
      <div id="error-page" className='flex flex-row justify-center h-screen'>
        <div className='basis-1/2 flex flex-col justify-center'>
          <h1 className='place-self-center text-5xl p-8 font-black'>Oops!</h1>
          <p className='place-self-center text-lg p-1 text-slate-800'>Sorry, an unexpected error has occurred.</p>
          <p className='place-self-center text-xl p-2 font-semibold text-slate-500'>
            <i>{error.statusText || error.message}</i>
          </p>
        </div>
      </div>
    );
}

export default ErrorPage
