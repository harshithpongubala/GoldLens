import React from 'react';
import { ArrowRight, Layers, Cpu, Compass, Activity } from 'lucide-react';
import { ComparisonMatrixItem, SignalItem } from '../types';

interface HeroCardProps {
  onExplore: () => void;
  matrix: ComparisonMatrixItem[];
  signals: SignalItem[];
  latestDate: string;
}

export const HeroCard: React.FC<HeroCardProps> = ({
  onExplore,
  matrix,
  signals,
  latestDate
}) => {
  // Count unusual deviations (|Z| >= 1.5)
  const deviationCount = matrix.filter(
    (m) => m.status === 'HIGH_DEVIATION' || m.status === 'ELEVATED'
  ).length;

  return (
    <div className="relative rounded-[28px] overflow-hidden glass-card p-6 md:p-8 flex flex-col justify-between min-h-[360px] md:min-h-[400px] border border-white/10 group">
      {/* Background radial gradient & ambient gold glow */}
      <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-gradient-to-bl from-[#D1B15F]/20 via-[#B8933D]/10 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 animate-subtle-pulse" />
      <div className="absolute bottom-0 left-1/3 w-[300px] h-[300px] bg-[#84A98C]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Decorative abstract SVG geometric artwork (Gold concentric rings & bullion lattice) */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 w-56 h-56 md:w-72 md:h-72 opacity-40 md:opacity-75 pointer-events-none transition-transform duration-700 group-hover:scale-105">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Outer circle */}
          <circle cx="100" cy="100" r="85" stroke="#D1B15F" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
          <circle cx="100" cy="100" r="70" stroke="url(#goldGradient)" strokeWidth="1.5" opacity="0.8" />
          <circle cx="100" cy="100" r="50" stroke="#84A98C" strokeWidth="1" opacity="0.5" />
          <circle cx="100" cy="100" r="30" stroke="#D1B15F" strokeWidth="2" opacity="0.9" />
          {/* Radial axis markers */}
          <line x1="100" y1="15" x2="100" y2="185" stroke="#D1B15F" strokeWidth="0.75" opacity="0.4" />
          <line x1="15" y1="100" x2="185" y2="100" stroke="#D1B15F" strokeWidth="0.75" opacity="0.4" />
          {/* Center core pulse */}
          <circle cx="100" cy="100" r="10" fill="#D1B15F" opacity="0.7" />
          <defs>
            <linearGradient id="goldGradient" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F5E09A" />
              <stop offset="0.5" stopColor="#D1B15F" />
              <stop offset="1" stopColor="#A68336" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-lg">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 font-medium mb-4">
          <Cpu className="w-3.5 h-3.5 text-[#D1B15F]" />
          <span>Quantitative MCX Commodity Normalization</span>
        </div>

        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white font-display leading-[1.15]">
          Understand Gold <br />
          <span className="text-gold-gradient">Beyond Price</span>
        </h2>

        <p className="text-sm md:text-base text-zinc-300/90 mt-3.5 leading-relaxed max-w-md">
          Uncovering hidden dislocations across <span className="text-white font-semibold">GOLDM</span>, <span className="text-white font-semibold">GOLDTEN</span>, <span className="text-white font-semibold">GOLDGUINEA</span>, and <span className="text-white font-semibold">GOLDPETAL</span> through unit-standardized basis analytics.
        </p>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={onExplore}
            className="px-6 py-2.5 rounded-full bg-white text-zinc-950 font-semibold text-xs md:text-sm tracking-wide shadow-lg hover:bg-zinc-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
          >
            <span>Explore Contracts</span>
            <ArrowRight className="w-4 h-4 text-zinc-950" />
          </button>
        </div>
      </div>

      {/* Overlapping Frosted Glass KPI Strip (matches Channel Analytics reference) */}
      <div className="relative z-20 mt-8 pt-2">
        <div className="glass-pill rounded-2xl md:rounded-3xl p-3 md:p-4 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 items-center">
          {/* KPI 1: Contracts Tracked */}
          <div className="px-3 py-1.5 flex flex-col border-r border-white/10 last:border-0">
            <span className="text-xl md:text-2xl font-bold text-white font-display">
              {matrix.length || 4}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-[11px] text-zinc-400 font-medium">Contracts Tracked</span>
            </div>
          </div>

          {/* KPI 2: Valid Comparisons */}
          <div className="px-3 py-1.5 flex flex-col border-r border-white/10 last:border-0">
            <span className="text-xl md:text-2xl font-bold text-white font-display">
              6 Pairs
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span className="text-[11px] text-zinc-400 font-medium">10g Basis Norm</span>
            </div>
          </div>

          {/* KPI 3: Unusual Deviations (Orange/amber glow highlight pill) */}
          <div className="px-3 py-1.5 flex flex-col rounded-xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-xl md:text-2xl font-bold text-amber-300 font-display">
              {deviationCount} Active
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="text-[11px] text-amber-200/90 font-medium">|Z| ≥ 1.5 Deviations</span>
            </div>
          </div>

          {/* KPI 4: Data Freshness + Action button */}
          <div className="px-3 py-1.5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm md:text-base font-bold text-emerald-400 font-display">
                {latestDate || 'Oct 2026'}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[11px] text-zinc-400 font-medium">MCX Settlement</span>
              </div>
            </div>

            <button
              onClick={onExplore}
              className="w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-transform hover:scale-110 ml-2"
              title="Inspect Relative Spreads"
            >
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
