import { Button } from '@headlessui/react'
import React from 'react'

export default function NavBarItem({name, children}) {
  return (
    <div className="text-left">
      <div className='py-2'>
        <Button className="font-sans text-lg text-slate-300 hover:text-slate-100 hover:font-bold focus:text-blue-400 focus:font-bold">{name}</Button>
      </div>
      <div>
        {children}
      </div>
    </div>
  )
}
