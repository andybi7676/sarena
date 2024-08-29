import React from 'react'
import { NavBarItem, NavBarSubItem } from './molecules';

const navBarItems = [
  {
    name: "About",
    routing_full_path: "/about",
    subItems: [
    ]
  },
  {
    name: "Challenges",
    routing_full_path: "/challenges",
    subItems: [
      {
        name: "Track 1",
        routing_full_path: "/challenges/track1",
      },
      {
        name: "Track 2",
        routing_full_path: "/challenges/track2",
      },
      {
        name: "Track 3",
        routing_full_path: "/challenges/track3",
      }
    ]
  },
  {
    name: "Contact",
    routing_full_path: "/contact",
    subItems: [
    ]
  },
  {
    name: "Support",
    routing_full_path: "/support",
    subItems: [
    ]
  },
];

export default function NavBar() {
  return (
    <div className='flex flex-row-reverse'>
        <div className="w-1/2 p-2 py-4">
          {
            navBarItems.map((item, index) => {
              return (
                <NavBarItem key={index} name={item.name} path={item.routing_full_path}>
                  {
                    item.subItems.map((subItem, subIndex) => {
                      return (
                        <NavBarSubItem key={subIndex} name={subItem.name} path={subItem.routing_full_path} />
                      )
                    })
                  }
                </NavBarItem>
              )
            })
          }
        </div>
    </div>
  )
}
