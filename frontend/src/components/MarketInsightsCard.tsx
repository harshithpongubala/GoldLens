import React from 'react';
import { TrendingUp, ArrowUpRight, ShieldAlert, Award, Info } from 'lucide-react';
import { ComparisonMatrixItem, ComparisonSummary } from '../types';

interface MarketInsightsCardProps {
  comparison: ComparisonSummary | null;
  matrix: ComparisonMatrixItem[];
  targetSymbol: string;
}

export const MarketInsightsCard: React.FC<MarketInsightsCardProps> = ({
  comparison,
  matrix,
  targetSymbol
}) => {
  const targetItem = matrix.find((m) => m.symbol === targetSymbol) || matrix[0];
  const spread = comparison?.current_spread_10g ?? 0;
  const relDiff = comparison?.current_diff_pct ?? 0;
  const isPremium = spread >= 0;

  return (
    <div className="glass-card rounded-[28px] p-6 flex flex-col justify-between border border-white/10 min-h-[180px]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-display">
          Market Insights & Basis
        </span>
        <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          <ArrowUpRight className="w-3 h-3" />
          <span>{relDiff > 0 ? `+${relDiff.toFixed(2)}%` : `${relDiff.toFixed(2)}%`}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Left Column: Metric & Sparkline */}
        <div>
          {/* Mini SVG Sparkline curve matching reference */}
          <div className="w-28 h-6 mb-2">
            <svg viewBox="0 0 100 25" className="w-full h-full overflow-visible">
              <path
                d="M 0 18 Q 20 22, 35 12 T 70 8 T 100 3"
                fill="none"
                stroke={isPremium ? '#84A98C' : '#F87171'}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="100" cy="3" r="3.5" fill={isPremium ? '#84A98C' : '#F87171'} />
            </svg>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-white font-display">
              ₹{Math.abs(spread).toFixed(1)}
            </span>
            <span className="text-xs font-semibold text-zinc-400">
              / 10g
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isPremium ? 'bg-amber-400' : 'bg-cyan-400'}`} />
            <span>
              {targetSymbol} {isPremium ? 'Premium' : 'Discount'} vs {comparison?.benchmark_symbol || 'GOLDM'}
            </span>
          </p>
        </div>

        {/* Right Column: Featured Bullion Asset Preview Box (matching Synthetics backpack tile in reference) */}
        <div className="rounded-2xl bg-black/40 border border-white/5 p-3.5 flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-[#332A15] to-[#1C1C1C] border border-[#D1B15F]/30 p-2 flex flex-col items-center justify-center shrink-0 shadow-lg">
            <Award className="w-6 h-6 text-[#D1B15F]" />
            <span className="text-[9px] font-mono text-[#F5E09A] font-bold mt-0.5">
              {targetItem?.purity || 995}
            </span>
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-white truncate font-display">
              {targetItem?.name || targetSymbol}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono mt-0.5">
              Lot: {targetItem?.trading_lot_grams}g | Quote: {targetItem?.quotation_unit}
            </span>
            <span className="text-[10px] text-[#D1B15F] mt-1 font-medium truncate">
              {targetItem?.purity === 999 ? '999 Fine Bullion' : '995 Standard MCX'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
