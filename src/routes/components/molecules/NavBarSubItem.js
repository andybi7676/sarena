import { Button } from '@headlessui/react'
import { Link } from 'react-router-dom';
import { useState } from 'react'
import React from 'react'

export default function NavBarSubItem({name, path}) {
  return (
    <div className=' flex flex-row divide-x divide-slate-700 px-2'>
      <div className='w-0'></div>
      <Link to={path} className="w-full px-4 p-2 font-normal text-left text-slate-400 hover:text-slate-300 hover:font-bold focus:text-blue-400 focus:font-bold">{name}</Link>
    </div>
  )
}
