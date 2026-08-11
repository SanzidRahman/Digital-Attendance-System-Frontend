"use client";

import { useState } from "react";
import Sidebar from "@/components/admin-panel/AppSidebar";
import Topbar from "@/components/admin-panel/Topbar";

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-950 text-zinc-100 font-sans">
      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar - relative on desktop, floating drawer on mobile */}
      <div
        className={`fixed md:relative inset-y-0 left-0 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 ease-in-out z-50`}
      >
        <Sidebar closeSidebar={() => setSidebarOpen(false)} />
      </div>

      {/* Main content wrapper */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <div className="h-16">
          <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
          {children}
        </div>

        {/* Footer */}
        <footer className="h-10 border-t border-zinc-900 bg-zinc-950 flex justify-center items-center text-xs text-zinc-500 font-mono">
          All Rights Reserved &copy; Mustafizur Rahman
        </footer>
      </main>
    </div>
  );
}
