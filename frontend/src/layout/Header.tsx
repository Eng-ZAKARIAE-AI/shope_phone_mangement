import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Smartphone, LogOut, User as UserIcon, ShieldAlert } from 'lucide-react';

interface HeaderProps {
  onNotify: (msg: string, type: 'success' | 'error') => void;
}

export default function Header({ onNotify }: HeaderProps) {
  const { user, profile, logout } = useAuth();

  const handleSignOut = async () => {
    try {
      await logout();
      onNotify("Logged out of employee workspace successfully", "success");
    } catch (e: any) {
      onNotify(e.message || "Log out failed", "error");
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 h-16 shadow-sm" id="app-header-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full">
          
          {/* Brand Logo Group */}
          <div className="flex items-center gap-3 select-none">
            <div className="bg-teal-400 p-1.5 rounded-xl text-slate-900 shadow-sm shrink-0">
              <Smartphone size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Tecno Tech
              </span>
              <span className="text-[10px] text-teal-400 block font-semibold uppercase tracking-widest leading-none mt-0.5">
                Authorized Stock Controller
              </span>
            </div>
          </div>

          {/* User Status Bar */}
          <div className="flex items-center gap-3">
            {profile && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700/60 rounded-xl max-w-sm">
                <div className="h-2 w-2 rounded-full bg-teal-400 animate-pulse"></div>
                <span className="text-xs font-semibold text-slate-350 truncate block max-w-[150px]">
                  {profile.displayName} ({profile.role.toUpperCase()})
                </span>
              </div>
            )}
            
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 text-xs font-semibold cursor-pointer transition-all duration-200"
              title="End session"
              id="header-logout-btn"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
