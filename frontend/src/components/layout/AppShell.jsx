import React, { useState } from "react";
import SharedSidebar from "../SharedSidebar";
import NotificationBell from "../NotificationBell";

export default function AppShell({ activePath, user, onLogout, children, title, subtitle, headerActions }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Sidebar */}
      <SharedSidebar
        activePath={activePath}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        user={user}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {title && (
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate tracking-tight">{title}</h1>
                {subtitle && <p className="text-xs text-slate-500 truncate hidden sm:block">{subtitle}</p>}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {headerActions}
            <NotificationBell />
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
