"use client";

import { useState } from "react";
import Link from "next/link";
import { LuChevronRight } from "react-icons/lu";
import { AdminSidebarMenu } from "@/lib/adminSidebarMenu";

export default function Sidebar({ closeSidebar }) {
  const [collapsed, setCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState({});

  const toggleSidebar = () => setCollapsed((prev) => !prev);

  const toggleMenu = (index) => {
    setOpenMenus((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div
      className={`h-screen bg-gray-900 text-white transition-all duration-300 
      ${collapsed ? "w-20" : "w-64"} flex flex-col border-r border-gray-800`}
    >
      {/* Top */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {!collapsed && <h1 className="text-sm font-bold tracking-wider text-zinc-300">ADMIN CONTROL</h1>}
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-800 rounded hidden md:block"
        >
          <LuChevronRight
            size={18}
            className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {AdminSidebarMenu.map((menu, index) => (
          <div key={index}>
            {menu.submenu ? (
              <div>
                <button
                  onClick={() => toggleMenu(index)}
                  className="flex items-center gap-3 w-full p-2.5 rounded hover:bg-gray-800 cursor-pointer transition-all"
                >
                  <menu.icon size={18} className="text-zinc-400" />
                  {!collapsed && <span className="text-sm font-medium">{menu.title}</span>}
                  <LuChevronRight
                    size={14}
                    className={`ml-auto transition-transform duration-300 ${openMenus[index] ? "rotate-90" : ""}`}
                  />
                </button>
                
                {/* Submenu */}
                {openMenus[index] && !collapsed && (
                  <div className="ml-8 mt-1 space-y-1 border-l border-zinc-800 pl-2">
                    {menu.submenu.map((sub, subIndex) => (
                      <Link
                        key={subIndex}
                        href={sub.href}
                        onClick={closeSidebar}
                        className="block p-2 text-xs text-zinc-400 hover:text-zinc-200 rounded hover:bg-gray-800 transition-all"
                      >
                        {sub.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={menu.href}
                onClick={closeSidebar}
                className="flex items-center gap-3 w-full p-2.5 rounded hover:bg-gray-800 cursor-pointer transition-all"
              >
                <menu.icon size={18} className="text-zinc-400" />
                {!collapsed && <span className="text-sm font-medium">{menu.title}</span>}
              </Link>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}
