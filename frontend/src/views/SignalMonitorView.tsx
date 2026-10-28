import React, { useState } from 'react';
import {
  AlertTriangle,
  Sliders,
  ShieldAlert,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Info,
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { SignalItem } from '../types';

interface SignalMonitorViewProps {
  signals: SignalItem[];
  benchmarkSymbol: string;
  zThreshold: number;
  onThresholdChange: (th: number) => void;
  lookback: number;
}

export const SignalMonitorView: React.FC<SignalMonitorViewProps> = ({
  signals,
  benchmarkSymbol,
  zThreshold,
  onThresholdChange,
  lookback
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'HIGH_DEVIATION' | 'ELEVATED'>('ALL');
  const [selectedSignal, setSelectedSignal] = useState<SignalItem | null>(null);

  const filteredSignals = signals.filter((s) => {
    if (filterSeverity === 'ALL') return true;
    return s.severity === filterSeverity;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card rounded-[28px] p-6 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-bold text-white font-display">
              Explainable Statistical Signal Monitor
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold uppercase">
              Anomaly Detection
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Detecting unusual relative-price dislocations against rolling historical variance.
            Each deviation is accompanied by fundamental and institutional attribution drivers.
          </p>
        </div>

        {/* Threshold Slider */}
        <div className="flex items-center gap-3 bg-black/40 px-4 py-2.5 rounded-2xl border border-white/10 text-xs">
          <Sliders className="w-4 h-4 text-[#D1B15F]" />
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold">
              Z-Threshold: <span className="text-white font-bold">{zThreshold.toFixed(1)}σ</span>
            </span>
            <input
              type="range"
              min="1.0"
              max="3.0"
              step="0.1"
              value={zThreshold}
              onChange={(e) => onThresholdChange(Number(e.target.value))}
              className="w-32 accent-[#D1B15F] cursor-pointer mt-1"
            />
          </div>
        </div>
      </div>

      {/* Severity Filter Tabs */}
      <div className="flex items-center gap-2">
        {[
          { id: 'ALL', label: `All Deviations (${signals.length})` },
          { id: 'HIGH_DEVIATION', label: `High Deviation ≥ 2.0σ (${signals.filter(s => s.severity === 'HIGH_DEVIATION').length})` },
          { id: 'ELEVATED', label: `Elevated 1.5σ - 2.0σ (${signals.filter(s => s.severity === 'ELEVATED').length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterSeverity(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filterSeverity === tab.id
                ? 'bg-white/15 text-white border border-white/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Signals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSignals.map((sig) => {
          const isHigh = sig.severity === 'HIGH_DEVIATION';
          const isPremium = sig.direction === 'PREMIUM';

          return (
            <div
              key={sig.id}
              onClick={() => setSelectedSignal(sig)}
              className={`rounded-[24px] p-5 border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                isHigh
                  ? 'bg-rose-500/[0.04] border-rose-500/25 hover:border-rose-500/50 hover:bg-rose-500/[0.07]'
                  : 'bg-black/30 border-white/5 hover:border-white/15 hover:bg-black/45'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white font-display">
                      {sig.target_name} ({sig.target_symbol})
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        isHigh
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {sig.severity.replace('_', ' ')}
                    </span>
                  </div>

                  <span className="text-xs text-zinc-400 font-mono flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {sig.date_display || sig.date}
                  </span>
                </div>

                {/* Metric Summary */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-black/40 border border-white/5 mb-3 text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block">Normalized Spread</span>
                    <span className={`font-mono font-bold ${isPremium ? 'text-amber-300' : 'text-cyan-300'}`}>
                      {sig.spread_inr_10g > 0 ? '+' : ''}₹{sig.spread_inr_10g.toFixed(1)}/10g
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block">Relative % Diff</span>
                    <span className="font-mono font-bold text-white">
                      {sig.relative_diff_pct > 0 ? '+' : ''}{sig.relative_diff_pct.toFixed(2)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block">Z-Score</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {sig.z_score > 0 ? '+' : ''}{sig.z_score.toFixed(2)}σ
                    </span>
                  </div>
                </div>

                {/* Explanation text */}
                <p className="text-xs text-zinc-300 leading-relaxed mb-3">
                  {sig.explanation}
                </p>

                {/* Potential Drivers Tags */}
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
                    Attribution Drivers:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {sig.potential_drivers.map((drv, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-white/5 text-zinc-300 border border-white/5"
                      >
                        {drv}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Notice */}
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-500">
                <span>Benchmark: {sig.benchmark_symbol}</span>
                <span>Historical Percentile: {sig.percentile}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
