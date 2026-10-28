import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts';
import { Sparkles, Eye, Maximize2 } from 'lucide-react';
import { ComparisonSummary } from '../types';

interface RelativePriceChartProps {
  comparison: ComparisonSummary | null;
  targetSymbol: string;
  onTargetChange: (target: string) => void;
  benchmarkSymbol: string;
}

export const RelativePriceChart: React.FC<RelativePriceChartProps> = ({
  comparison,
  targetSymbol,
  onTargetChange,
  benchmarkSymbol
}) => {
  const [viewMode, setViewMode] = useState<'prices' | 'spread'>('prices');
  const [timeRange, setTimeRange] = useState<'1M' | '3M' | 'ALL'>('3M');

  if (!comparison || !comparison.history || comparison.history.length === 0) {
    return (
      <div className="glass-card rounded-[28px] p-6 flex flex-col items-center justify-center min-h-[280px]">
        <div className="animate-pulse text-zinc-500 text-sm">Loading market time-series...</div>
      </div>
    );
  }

  // Filter time range
  let data = [...comparison.history];
  if (timeRange === '1M') {
    data = data.slice(-22);
  } else if (timeRange === '3M') {
    data = data.slice(-66);
  }

  const latest = data[data.length - 1];

  return (
    <div className="glass-card rounded-[28px] p-6 flex flex-col justify-between border border-white/10 min-h-[280px] md:min-h-[300px]">
      {/* Card Header matching Channel Analytics reference */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white font-display flex items-center gap-1.5">
            <span>Relative Price Dynamics</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          </span>
          <span className="text-[11px] text-zinc-400 font-mono">
            {targetSymbol} vs {benchmarkSymbol}
          </span>
        </div>

        {/* View Mode & Range Toggles */}
        <div className="flex items-center gap-2">
          {/* Target contract selector */}
          <select
            value={targetSymbol}
            onChange={(e) => onTargetChange(e.target.value)}
            className="bg-black/40 text-xs font-semibold text-white px-2.5 py-1 rounded-lg border border-white/10 focus:outline-none"
          >
            <option value="GOLDPETAL" className="bg-[#222]">GOLDPETAL (1g)</option>
            <option value="GOLDGUINEA" className="bg-[#222]">GOLDGUINEA (8g)</option>
            <option value="GOLDTEN" className="bg-[#222]">GOLDTEN (10g)</option>
          </select>

          {/* Time range buttons */}
          <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/10 text-[10px]">
            {(['1M', '3M', 'ALL'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                  timeRange === r ? 'bg-white/20 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            onClick={() => setViewMode(viewMode === 'prices' ? 'spread' : 'prices')}
            className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
              viewMode === 'spread'
                ? 'bg-[#D1B15F]/20 text-[#D1B15F] border-[#D1B15F]/40'
                : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
            }`}
            title="Toggle between Price Curves and Spread Anomaly Z-Score"
          >
            {viewMode === 'prices' ? 'Show Spread' : 'Show Prices'}
          </button>
        </div>
      </div>

      {/* Metric Callout Badge (matching "50" badge on chart in reference) */}
      <div className="flex items-baseline gap-3 my-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-white font-display">
            {viewMode === 'prices'
              ? `₹${latest.target_price_10g.toLocaleString('en-IN')}`
              : `₹${latest.spread_inr_10g > 0 ? '+' : ''}${latest.spread_inr_10g.toFixed(1)}/10g`}
          </span>
          <span className="text-[11px] text-zinc-400">
            {viewMode === 'prices' ? 'Normalized 10g Base' : `Relative Diff: ${latest.relative_diff_pct > 0 ? '+' : ''}${latest.relative_diff_pct.toFixed(2)}%`}
          </span>
        </div>

        {/* Z-score Pill */}
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
            latest.status === 'HIGH_DEVIATION'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : latest.status === 'ELEVATED'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : latest.status === 'SNAPSHOT_ONLY' || latest.status === 'INSUFFICIENT_HISTORY'
              ? 'bg-zinc-800 text-amber-300 border border-amber-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          }`}
        >
          {latest.z_score !== null && latest.z_score !== undefined
            ? `Z-Score ${latest.z_score > 0 ? '+' : ''}${latest.z_score.toFixed(2)} (${latest.status.replace('_', ' ')})`
            : `Snapshot Only (N=1) — Z-Score N/A`}
        </span>
      </div>

      {/* Chart container or Single-Day Snapshot View */}
      {data.length === 1 ? (
        <div className="w-full h-44 mt-2 bg-black/30 rounded-2xl border border-white/5 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-white font-mono uppercase tracking-wider">
                Single-Trading-Day Snapshot ({latest.date_display})
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10 font-mono">
              MCX Bhavcopy (1 Trading Session)
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 my-auto">
            <div className="bg-white/[0.03] p-2.5 rounded-xl border border-white/5">
              <div className="text-[10px] text-zinc-400 uppercase font-medium">{targetSymbol} Raw Close</div>
              <div className="text-sm font-bold text-white font-mono mt-0.5">₹{latest.target_raw_close.toLocaleString('en-IN')}</div>
              <div className="text-[9px] text-[#D1B15F]">Norm 10g: ₹{latest.target_price_10g.toLocaleString('en-IN')}</div>
            </div>
            <div className="bg-white/[0.03] p-2.5 rounded-xl border border-white/5">
              <div className="text-[10px] text-zinc-400 uppercase font-medium">{benchmarkSymbol} Raw Close</div>
              <div className="text-sm font-bold text-white font-mono mt-0.5">₹{latest.benchmark_raw_close.toLocaleString('en-IN')}</div>
              <div className="text-[9px] text-[#84A98C]">Bench 10g: ₹{latest.benchmark_price_10g.toLocaleString('en-IN')}</div>
            </div>
            <div className="bg-white/[0.03] p-2.5 rounded-xl border border-white/5">
              <div className="text-[10px] text-zinc-400 uppercase font-medium">Static Spread (10g)</div>
              <div className={`text-sm font-bold font-mono mt-0.5 ${latest.spread_inr_10g >= 0 ? 'text-[#D1B15F]' : 'text-rose-400'}`}>
                ₹{latest.spread_inr_10g > 0 ? '+' : ''}{latest.spread_inr_10g.toFixed(1)}
              </div>
              <div className="text-[9px] text-zinc-400">Target - Benchmark</div>
            </div>
            <div className="bg-white/[0.03] p-2.5 rounded-xl border border-white/5">
              <div className="text-[10px] text-zinc-400 uppercase font-medium">Relative % Diff</div>
              <div className={`text-sm font-bold font-mono mt-0.5 ${latest.relative_diff_pct >= 0 ? 'text-[#D1B15F]' : 'text-rose-400'}`}>
                {latest.relative_diff_pct > 0 ? '+' : ''}{latest.relative_diff_pct.toFixed(2)}%
              </div>
              <div className="text-[9px] text-zinc-400">Spread / Bench</div>
            </div>
          </div>

          <div className="text-[10px] text-zinc-400 flex items-center justify-between border-t border-white/5 pt-1.5">
            <span>Historical trends, Z-scores, and backtesting require ≥5 trading dates.</span>
            <span className="text-[#D1B15F] font-medium">Static Normalization Active</span>
          </div>
        </div>
      ) : (
        <div className="w-full h-44 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'prices' ? (
              <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="date_display"
                  tick={{ fill: '#71717A', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => {
                    const parts = val.split('-');
                    return parts.length >= 2 ? `${parts[1]}` : val;
                  }}
                  interval={Math.floor(data.length / 5)}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fill: '#71717A', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E1E1E',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '12px',
                    fontSize: '11px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                  }}
                  formatter={(value: any, name: string) => [
                    `₹${Number(value).toLocaleString('en-IN')}`,
                    name === 'target_price_10g' ? `${targetSymbol} (Norm 10g)` : `${benchmarkSymbol} (Bench 10g)`
                  ]}
                  labelFormatter={(lbl) => `Date: ${lbl}`}
                />
                <Line
                  type="monotone"
                  dataKey="target_price_10g"
                  name="target_price_10g"
                  stroke="#D1B15F"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#D1B15F', stroke: '#fff', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="benchmark_price_10g"
                  name="benchmark_price_10g"
                  stroke="#84A98C"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  dot={false}
                  activeDot={{ r: 4, fill: '#84A98C' }}
                />
              </LineChart>
            ) : (
              <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="date_display"
                  tick={{ fill: '#71717A', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.floor(data.length / 5)}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fill: '#71717A', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₹${Math.round(v)}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E1E1E',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '12px',
                    fontSize: '11px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                  }}
                  formatter={(value: any, name: string) => [
                    `₹${Number(value).toFixed(1)}/10g`,
                    name
                  ]}
                />
                {/* Bollinger Bands for Spread */}
                <Line type="monotone" dataKey="upper_band" stroke="rgba(209,177,95,0.3)" strokeDasharray="3 3" dot={false} name="Upper Band (+2σ)" />
                <Line type="monotone" dataKey="rolling_mean_spread" stroke="#71717A" strokeDasharray="2 2" dot={false} name="20D Rolling Mean" />
                <Line type="monotone" dataKey="lower_band" stroke="rgba(209,177,95,0.3)" strokeDasharray="3 3" dot={false} name="Lower Band (-2σ)" />
                <Line
                  type="monotone"
                  dataKey="spread_inr_10g"
                  name="Spread (Target - Bench)"
                  stroke="#D1B15F"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#D1B15F' }}
                />
                <ReferenceLine y={0} stroke="#52525B" />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

