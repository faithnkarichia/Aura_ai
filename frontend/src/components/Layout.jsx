import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Folder, Settings, LogOut, Sparkles, Mic } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function Layout({ user, setUser }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('aura_user');
    setUser(null);
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-brand-bg overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-brand-border flex flex-col bg-white">
        <div className="p-6 flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-ink rounded-lg flex items-center justify-center">
            <Sparkles className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight">Aura AI</span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <SidebarLink to="/dashboard" icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" />
          <SidebarLink to="/calendar" icon={<Calendar className="w-5 h-5" />} label="Calendar" />
          <SidebarLink to="/files" icon={<Folder className="w-5 h-5" />} label="My Files" />
        </nav>

        <div className="p-4 border-t border-brand-border">
          <div className="flex items-center gap-3 p-2 mb-4">
            <img src={user?.avatar} alt={user?.name} className="w-10 h-10 rounded-full border border-brand-border" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user?.name}</p>
              <p className="text-xs text-brand-ink/50 truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2 p-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-bottom border-brand-border px-8 flex items-center justify-between bg-white/80 backdrop-blur-sm z-10">
          <h2 className="font-bold text-lg">
            {window.location.pathname === '/dashboard' && 'Dashboard'}
            {window.location.pathname === '/calendar' && 'Calendar'}
            {window.location.pathname === '/files' && 'My Files'}
          </h2>
          <div className="flex items-center gap-4">
             <button 
               onClick={() => navigate('/dashboard')}
               className="bg-brand-ink text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 hover:scale-105 transition-transform"
             >
               <Mic className="w-4 h-4" />
               New Recording
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function SidebarLink({ to, icon, label }) {
  return (
    <NavLink 
      to={to}
      className={({ isActive }) => cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
        isActive 
          ? "bg-brand-muted text-brand-ink shadow-sm" 
          : "text-brand-ink/50 hover:text-brand-ink hover:bg-brand-muted/50"
      )}
    >
      {icon}
      {label}
    </NavLink>
  );
}
