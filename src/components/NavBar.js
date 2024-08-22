import React from 'react'
import { NavBarItem, NavBarSubItem } from './subcomponents/index';

const navBarItems = [
  {
    name: "About",
    subItems: [
    ]
  },
  {
    name: "Challenges",
    subItems: [
      {
        name: "Track 1",
      },
      {
        name: "Track 2",
      },
      {
        name: "Track 3",
      }
    ]
  },
  {
    name: "Contact",
    subItems: [
    ]
  },
  {
    name: "Support",
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
                <NavBarItem key={index} name={item.name}>
                  {
                    item.subItems.map((subItem, subIndex) => {
                      return (
                        <NavBarSubItem key={subIndex} name={subItem.name} />
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
