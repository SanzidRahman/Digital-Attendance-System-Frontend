"use client";

import { Bell, User, Menu } from "lucide-react";

export default function Topbar({ onToggleSidebar }) {
  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to logout?");
    if (confirmed) {
      localStorage.removeItem("token");
      window.location.href = "/";
    }
  };

  return (
    <div className="w-full h-16 bg-gray-900 text-white flex items-center justify-between px-4 border-b border-gray-700">
      {/* Left: Sidebar Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-gray-800 rounded md:hidden"
          title="Toggle Menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="font-bold text-base md:text-lg">Admin Dashboard</h1>
      </div>

      {/* Right: Notifications + User + Logout */}
      <div className="flex items-center gap-3 md:gap-4">
        <button className="p-2 hover:bg-gray-800 rounded relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
        </button>
        
        <div className="flex items-center gap-1 md:gap-2">
          <div className="flex items-center gap-1.5 p-1.5 px-2 bg-gray-800/40 border border-gray-800 rounded-lg">
            <User size={16} className="text-zinc-400" />
            <span className="text-xs text-zinc-300 hidden sm:inline">Admin</span>
          </div>

          <button
            onClick={handleLogout}
            className="p-1.5 px-2.5 bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 border border-red-900/30 hover:border-red-900/60 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all duration-200"
          >
            🚪 <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
