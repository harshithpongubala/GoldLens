import React, { useState } from 'react';
import {
  ArrowUpDown,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  Coins,
  ChevronDown,
  Info
} from 'lucide-react';
import { ComparisonMatrixItem } from '../types';

interface ComparisonTableProps {
  matrix: ComparisonMatrixItem[];
  benchmarkSymbol: string;
  onSelectContract: (symbol: string) => void;
  onOpenMethodology: () => void;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  matrix,
  benchmarkSymbol,
  onSelectContract,
  onOpenMethodology
}) => {
  const [sortBy, setSortBy] = useState<'spread' | 'zscore' | 'volume' | 'price'>('spread');

  const sortedMatrix = [...matrix].sort((a, b) => {
    if (sortBy === 'spread') return Math.abs(b.spread_vs_benchmark_10g) - Math.abs(a.spread_vs_benchmark_10g);
    if (sortBy === 'zscore') return Math.abs(b.z_score) - Math.abs(a.z_score);
    if (sortBy === 'volume') return b.volume - a.volume;
    if (sortBy === 'price') return b.normalized_10g_price - a.normalized_10g_price;
    return 0;
  });

  return (
    <div className="glass-card rounded-[28px] p-6 md:p-8 border border-white/10 mt-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg md:text-xl font-bold text-white font-display">
              Contract Comparison & Relative Spreads
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/10">
              Normalized to 10g Standard
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Raw exchange quotes converted into uniform basis units. Differences represent relative basis premiums/discounts.
          </p>
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none bg-black/40 border border-white/10 text-white text-xs font-semibold px-4 py-2 pr-9 rounded-xl focus:outline-none cursor-pointer"
            >
              <option value="spread" className="bg-[#222]">Sort by: Spread Deviation</option>
              <option value="zscore" className="bg-[#222]">Sort by: Z-Score Magnitude</option>
              <option value="volume" className="bg-[#222]">Sort by: Trading Volume</option>
              <option value="price" className="bg-[#222]">Sort by: Normalized Price</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={onOpenMethodology}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-all"
            title="View Mathematical Normalization Methodology"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Comparison Rows (Pill shaped cards matching reference image list items) */}
      <div className="flex flex-col gap-3">
        {sortedMatrix.map((item) => {
          const isBench = item.symbol === benchmarkSymbol;
          const isElevated = item.status === 'ELEVATED' || item.status === 'HIGH_DEVIATION';

          // Generate mini sparkline path
          const sparkData = item.sparkline || [];
          const minP = Math.min(...sparkData, item.normalized_10g_price);
          const maxP = Math.max(...sparkData, item.normalized_10g_price);
          const range = maxP - minP || 1;
          const points = sparkData
            .map((p, idx) => {
              const x = (idx / Math.max(1, sparkData.length - 1)) * 90;
              const y = 20 - ((p - minP) / range) * 16;
              return `${x},${y}`;
            })
            .join(' ');

          return (
            <div
              key={item.symbol}
              onClick={() => !isBench && onSelectContract(item.symbol)}
              className={`rounded-2xl p-4 md:px-6 md:py-4 transition-all duration-200 border flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group ${
                isBench
                  ? 'bg-white/[0.03] border-white/5 hover:bg-white/[0.05]'
                  : isElevated
                  ? 'bg-amber-500/[0.04] border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-500/[0.08]'
                  : 'bg-black/30 border-white/5 hover:border-white/20 hover:bg-black/50'
              }`}
            >
              {/* Left: Thumbnail & Contract Info */}
              <div className="flex items-center gap-4 min-w-[220px]">
                {/* Thumbnail box (matching video thumbnails in reference) */}
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-tr from-[#252525] to-[#181818] border border-white/10 p-2 flex flex-col items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Coins className="w-5 h-5 text-[#D1B15F]" />
                  <span className="text-[9px] font-mono text-zinc-400 mt-1 font-bold">
                    {item.purity}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm md:text-base font-bold text-white font-display group-hover:text-[#D1B15F] transition-colors">
                      {item.name}
                    </span>
                    {isBench && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        BENCHMARK
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-400">
                    <span className="font-mono text-zinc-300 font-semibold">{item.symbol}</span>
                    <span>•</span>
                    <span>Expiry: {item.expiry}</span>
                    <span>•</span>
                    <span>Lot: {item.trading_lot_grams}g</span>
                  </div>
                </div>
              </div>

              {/* Middle Metric: Raw vs Normalized Price */}
              <div className="flex items-center gap-6 min-w-[200px]">
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-medium">Raw Quoted</span>
                  <span className="text-xs md:text-sm font-semibold text-zinc-300 font-mono">
                    ₹{item.raw_close.toLocaleString('en-IN')}
                    <span className="text-[10px] text-zinc-500 ml-1">/{item.quotation_unit}</span>
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-medium">Normalized 10g Base</span>
                  <span className="text-sm md:text-base font-bold text-white font-mono">
                    ₹{item.normalized_10g_price.toLocaleString('en-IN')}
                    <span className="text-[10px] text-zinc-500 ml-1">/10g</span>
                  </span>
                </div>
              </div>

              {/* Relative Difference & Z-Score Signal */}
              <div className="flex items-center gap-4 min-w-[170px]">
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-medium">Spread vs Bench</span>
                  {isBench ? (
                    <span className="text-xs text-zinc-500 font-mono">— Base —</span>
                  ) : (
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-xs md:text-sm font-bold font-mono ${
                        item.spread_vs_benchmark_10g > 0 ? 'text-amber-300' : 'text-cyan-300'
                      }`}>
                        {item.spread_vs_benchmark_10g > 0 ? '+' : ''}₹{item.spread_vs_benchmark_10g.toFixed(1)}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        ({item.relative_diff_pct > 0 ? '+' : ''}{item.relative_diff_pct.toFixed(2)}%)
                      </span>
                    </div>
                  )}
                </div>

                {/* Z-Score badge */}
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-medium">Anomaly Status</span>
                  {isBench ? (
                    <span className="text-xs text-zinc-500 font-medium">Benchmark Ref</span>
                  ) : item.z_score !== null && item.z_score !== undefined ? (
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.status === 'HIGH_DEVIATION'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                          : item.status === 'ELEVATED'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      Z {item.z_score > 0 ? '+' : ''}{item.z_score.toFixed(2)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-zinc-400 border border-white/10 uppercase tracking-wider">
                      Spot Snapshot
                    </span>
                  )}
                </div>
              </div>

              {/* Sparkline curve (matching mini line charts in reference table items) */}
              <div className="w-24 h-8 shrink-0 hidden lg:block">
                <svg viewBox="0 0 90 24" className="w-full h-full overflow-visible">
                  <polyline
                    fill="none"
                    stroke={item.spread_vs_benchmark_10g >= 0 ? '#D1B15F' : '#84A98C'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                  />
                </svg>
              </div>

              {/* Action Button */}
              <div className="shrink-0 flex items-center justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectContract(item.symbol);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-1.5 transition-all"
                  title="Analyze Contract Deep Dive"
                >
                  <span>Analyze</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
