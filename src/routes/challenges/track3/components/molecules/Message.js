import React from 'react'

export default function Message({message}) {
  return <div className='w-full flex'>
    {
      message.type.includes('user')
      ?
      <div className="flex flex-row-reverse w-full my-1">
        <div className="w-3/4">
          <div className="bg-slate-300 text-slate-900 p-2 rounded-lg">
            {message.data}
          </div>
        </div>
      </div>
      :
      <div className="flex flex-row w-full my-1">
        <div className="w-3/4 justify-self-start">
        <div className="bg-gray-800 text-slate-200 p-2 rounded-lg">
            {message.data}
          </div>
        </div>
      </div>
    }
  </div>
}
