import React from 'react';
import {
  Calendar,
  Database,
  Sliders,
  UploadCloud,
  Search,
  Mail,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { DataStatus } from '../types';

interface HeaderProps {
  status: DataStatus | null;
  benchmark: string;
  onBenchmarkChange: (sym: string) => void;
  lookback: number;
  onLookbackChange: (w: number) => void;
  onOpenImport: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  benchmark,
  onBenchmarkChange,
  lookback,
  onLookbackChange,
  onOpenImport,
  onRefresh,
  isRefreshing
}) => {
  return (
    <header className="px-6 md:px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 bg-[#1B1B1B]/40 backdrop-blur-md">
      {/* Title & Tagline */}
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-display">
              Commodity Intelligence
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#D1B15F]/20 text-[#D1B15F] border border-[#D1B15F]/30 tracking-wide uppercase">
              GoldLens Pro
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2">
            <span>MCX Gold Futures Basis & Relative-Spread Normalization</span>
            <span className="w-1 h-1 rounded-full bg-zinc-600" />
            <span className="text-emerald-400/90 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Research Grade Logic
            </span>
          </p>
        </div>
      </div>

      {/* Control Strip & Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Data Source Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs">
          <Database className="w-3.5 h-3.5 text-[#D1B15F]" />
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
              {status?.is_demo_data ? 'DEMO DATA' : 'AUTHENTIC MCX'}
            </span>
            <span className="text-white text-xs font-semibold">
              {status ? `${status.start_date.slice(0, 6)} - ${status.end_date}` : 'Connecting...'}
            </span>
          </div>
        </div>

        {/* Benchmark Selector */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs">
          <Sliders className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-400 text-xs">Bench:</span>
          <select
            value={benchmark}
            onChange={(e) => onBenchmarkChange(e.target.value)}
            className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer"
          >
            <option value="GOLDM" className="bg-[#222222] text-white">GOLDM (Mini 100g)</option>
            <option value="GOLDTEN" className="bg-[#222222] text-white">GOLDTEN (10g)</option>
          </select>
        </div>

        {/* Lookback Window */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs">
          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-400 text-xs">Window:</span>
          <select
            value={lookback}
            onChange={(e) => onLookbackChange(Number(e.target.value))}
            className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer"
          >
            <option value={10} className="bg-[#222222] text-white">10 Days</option>
            <option value={20} className="bg-[#222222] text-white">20 Days (Default)</option>
            <option value={30} className="bg-[#222222] text-white">30 Days</option>
            <option value={60} className="bg-[#222222] text-white">60 Days</option>
          </select>
        </div>

        {/* Import Bhavcopy Button */}
        <button
          onClick={onOpenImport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D1B15F]/15 hover:bg-[#D1B15F]/25 text-[#D1B15F] border border-[#D1B15F]/30 text-xs font-medium transition-all"
          title="Import Genuine MCX Daily Bhavcopy CSV"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Import CSV</span>
        </button>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-300 transition-all"
          title="Refresh Data & Calculations"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#D1B15F]' : ''}`} />
        </button>

        {/* User Avatar with subtle gold ring (matching reference image top right) */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#D1B15F] to-[#84A98C] p-[1.5px] cursor-pointer">
          <div className="w-full h-full rounded-full bg-[#181818] flex items-center justify-center text-[11px] font-bold text-amber-200">
            GL
          </div>
        </div>
      </div>
    </header>
  );
};
