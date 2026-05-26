import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { 
  BarChart3, 
  Boxes, 
  FileText, 
  Moon, 
  Sun, 
  LogOut, 
  Smartphone, 
  Database,
  Users,
  ShieldCheck 
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  productsCount: number;
}

export default function Sidebar({ activeTab, setActiveTab, productsCount }: SidebarProps) {
  const { profile, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'inventory', label: 'Inventory Stock', icon: Boxes, badge: productsCount },
    { id: 'audit', label: 'Audit Logs', icon: FileText },
    { id: 'team', label: 'Staff Accounts', icon: Users, permission: 'admin' },
  ];

  return (
    <aside className="w-68 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-[calc(100vh-4rem)] sticky top-16" id="dashboard-sidebar">
      {/* Quick branding & level */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-2.5 bg-teal-50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-900/40 p-3 rounded-2xl">
          <ShieldCheck size={18} className="text-teal-500 dark:text-teal-400 shrink-0" />
          <div className="truncate">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-600 dark:text-teal-400 block pb-0.5">
              Access Granted
            </span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {isAdmin ? 'System Admin' : 'Shop Staff'}
            </span>
          </div>
        </div>
      </div>

      {/* Nav Actions */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          if (item.permission === 'admin' && !isAdmin) return null;
          
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-teal-500 text-slate-950 dark:bg-teal-400 dark:text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
              id={`sidebar-tab-${item.id}`}
            >
              <div className="flex items-center gap-2.5">
                <IconComponent size={18} className="shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-slate-950 text-teal-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User profile actions + Quick theme selector */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
            Night Mode
          </span>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-400 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-teal-500 cursor-pointer transition-colors"
            title="Toggle theme appearance"
            id="theme-toggle-btn"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </div>
    </aside>
  );
}
