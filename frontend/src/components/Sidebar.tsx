import React from 'react';
import {
  BarChart3,
  GitCompare,
  TrendingUp,
  AlertTriangle,
  BookOpen,
  Settings,
  Bell,
  Sparkles
} from 'lucide-react';

export type NavTab = 'overview' | 'comparison' | 'historical' | 'signals' | 'methodology' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  unreadSignalsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  unreadSignalsCount
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'comparison', label: 'Contract Comparison', icon: <GitCompare className="w-5 h-5" /> },
    { id: 'historical', label: 'Historical Analysis', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'signals', label: 'Signal Monitor', icon: <AlertTriangle className="w-5 h-5" /> },
    { id: 'methodology', label: 'Methodology', icon: <BookOpen className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-16 md:w-20 bg-[#141414] border-r border-white/5 flex flex-col items-center py-6 justify-between select-none z-30 shrink-0">
      {/* Top Logo */}
      <div className="flex flex-col items-center gap-6">
        <button
          onClick={() => onSelectTab('overview')}
          className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#B8933D] to-[#F5E09A] p-[1px] shadow-gold-glow flex items-center justify-center transition-transform hover:scale-105"
          title="GoldLens — Commodity Derivatives Intelligence"
        >
          <div className="w-full h-full bg-[#181818] rounded-2xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#D1B15F]" />
          </div>
        </button>

        {/* Navigation Items */}
        <nav className="flex flex-col items-center gap-3 mt-4">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                title={item.label}
                className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 group ${
                  isActive
                    ? 'bg-white/10 text-[#D1B15F] shadow-[0_0_15px_rgba(209,177,95,0.15)]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                {item.id === 'signals' && unreadSignalsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#141414] animate-pulse" />
                )}
                
                {/* Tooltip */}
                <div className="absolute left-16 px-2.5 py-1 bg-[#222222] border border-white/10 rounded-lg text-xs text-white font-medium whitespace-nowrap shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                  {item.label}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={() => onSelectTab('signals')}
          title="Notifications & Alerts"
          className="relative w-11 h-11 rounded-2xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <Bell className="w-5 h-5" />
          {unreadSignalsCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#141414]" />
          )}
        </button>

        <button
          onClick={() => onSelectTab('settings')}
          title="Settings & Data Config"
          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
            currentTab === 'settings'
              ? 'bg-white/10 text-[#D1B15F]'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
};
