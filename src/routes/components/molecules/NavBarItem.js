import { Button } from '@headlessui/react';
import { Link } from 'react-router-dom';
import React from 'react'

export default function NavBarItem({name, path, children}) {
  return (
    <div className="text-left">
      <div className='py-2'>
        {/* <Button className="font-sans text-lg text-slate-300 hover:text-slate-100 hover:font-bold focus:text-blue-400 focus:font-bold">{name}</Button> */}
        <Link to={path} className="font-sans text-lg text-slate-300 hover:text-slate-100 hover:font-bold focus:text-blue-400 focus:font-bold">{name}</Link>
      </div>
      <div>
        {children}
      </div>
    </div>
  )
}
