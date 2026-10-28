import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  ComposedChart,
  Area
} from 'recharts';
import { TrendingUp, BarChart2, Calendar, Download, Sparkles, AlertTriangle } from 'lucide-react';
import { ComparisonSummary } from '../types';

interface HistoricalAnalysisViewProps {
  comparison: ComparisonSummary | null;
  benchmarkSymbol: string;
  targetSymbol: string;
  onTargetChange: (sym: string) => void;
  lookback: number;
}

export const HistoricalAnalysisView: React.FC<HistoricalAnalysisViewProps> = ({
  comparison,
  benchmarkSymbol,
  targetSymbol,
  onTargetChange,
  lookback
}) => {
  const [activeTab, setActiveTab] = useState<'spread' | 'zscore' | 'raw_vs_norm'>('spread');
  const [filterDays, setFilterDays] = useState<number>(60);

  if (!comparison || !comparison.history || comparison.history.length === 0) {
    return (
      <div className="glass-card rounded-[28px] p-8 text-center text-zinc-500">
        Loading historical records...
      </div>
    );
  }

  const rawHistory = comparison.history;
  const filteredData = filterDays > 0 ? rawHistory.slice(-filterDays) : rawHistory;

  const handleExportCSV = () => {
    const headers = "Date,Benchmark,Target,Bench_Price_10g,Target_Price_10g,Spread_10g,Relative_Diff_Pct,Z_Score\n";
    const rows = filteredData.map(d =>
      `${d.date},${d.benchmark_symbol},${d.target_symbol},${d.benchmark_price_10g},${d.target_price_10g},${d.spread_inr_10g},${d.relative_diff_pct},${d.z_score !== null && d.z_score !== undefined ? d.z_score : 'N/A'}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GoldLens_${targetSymbol}_vs_${benchmarkSymbol}_Historical.csv`;
    a.click();
  };


  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="glass-card rounded-[28px] p-6 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-bold text-white font-display">
              Historical Relative-Spread Analysis
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 text-[#D1B15F] border border-[#D1B15F]/20 font-medium">
              Time Series Analytics
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Analyzing longitudinal spread behavior between {targetSymbol} and {benchmarkSymbol} over multiple MCX expiry cycles.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={targetSymbol}
            onChange={(e) => onTargetChange(e.target.value)}
            className="bg-black/40 text-xs font-semibold text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none cursor-pointer"
          >
            <option value="GOLDPETAL" className="bg-[#222]">GOLDPETAL (1g Micro)</option>
            <option value="GOLDGUINEA" className="bg-[#222]">GOLDGUINEA (8g Coin)</option>
            <option value="GOLDTEN" className="bg-[#222]">GOLDTEN (10g Bar)</option>
          </select>

          {/* Time range buttons */}
          <div className="flex items-center bg-black/40 rounded-xl p-1 border border-white/10 text-xs">
            {[
              { label: '30D', days: 30 },
              { label: '60D', days: 60 },
              { label: '90D', days: 90 },
              { label: 'All', days: 0 }
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={() => setFilterDays(btn.days)}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  filterDays === btn.days ? 'bg-white/20 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 hover:text-white border border-white/10 transition-all"
            title="Export CSV time-series"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Single-Day Snapshot / Insufficient History Banner */}
      {comparison.history.length < 5 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-white">
              Single-Trading-Day Genuine MCX Snapshot ({comparison.history[0]?.date_display || 'Active Date'})
            </div>
            <p className="text-zinc-300 text-[11px] leading-relaxed">
              Historical relative-spread trends, rolling Bollinger Bands, Z-scores, and mean-reversion backtesting require multi-day time series data (minimum 5 trading sessions). Contract price normalization and cross-contract static spreads are fully active below.
            </p>
          </div>
        </div>
      )}

      {/* Main Chart Card */}
      <div className="glass-card rounded-[28px] p-6 border border-white/10 space-y-6">
        {/* Chart View Mode Switcher */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-2">
            {[
              { id: 'spread', label: 'Spread & Bollinger Bands (₹/10g)' },
              { id: 'zscore', label: 'Rolling Z-Score Anomaly Indicator' },
              { id: 'raw_vs_norm', label: 'Normalized Prices vs Benchmark' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#D1B15F]/20 text-[#D1B15F] border border-[#D1B15F]/30 shadow-md'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Chart Container or Single-Day Breakdown */}
        {filteredData.length === 1 ? (
          <div className="w-full min-h-[300px] flex flex-col justify-center items-center p-6 bg-black/20 rounded-2xl border border-white/5 space-y-6">
            <div className="text-center max-w-md">
              <div className="text-sm font-semibold text-white font-display">
                Single-Day Snapshot Comparison ({filteredData[0].date_display})
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Static normalized price comparison between {targetSymbol} and {benchmarkSymbol} on the imported exchange date.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                <div className="text-[11px] text-zinc-400 font-medium">{targetSymbol} Raw Close</div>
                <div className="text-base md:text-lg font-bold text-white font-mono mt-1">₹{filteredData[0].target_raw_close.toLocaleString('en-IN')}</div>
                <div className="text-[10px] text-[#D1B15F] mt-0.5">Norm: ₹{filteredData[0].target_price_10g.toLocaleString('en-IN')}/10g</div>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                <div className="text-[11px] text-zinc-400 font-medium">{benchmarkSymbol} Raw Close</div>
                <div className="text-base md:text-lg font-bold text-white font-mono mt-1">₹{filteredData[0].benchmark_raw_close.toLocaleString('en-IN')}</div>
                <div className="text-[10px] text-[#84A98C] mt-0.5">Bench: ₹{filteredData[0].benchmark_price_10g.toLocaleString('en-IN')}/10g</div>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                <div className="text-[11px] text-zinc-400 font-medium">Spread (10g Base)</div>
                <div className={`text-base md:text-lg font-bold font-mono mt-1 ${filteredData[0].spread_inr_10g >= 0 ? 'text-[#D1B15F]' : 'text-rose-400'}`}>
                  ₹{filteredData[0].spread_inr_10g > 0 ? '+' : ''}{filteredData[0].spread_inr_10g.toFixed(1)}
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">Target - Benchmark</div>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                <div className="text-[11px] text-zinc-400 font-medium">Relative Difference</div>
                <div className={`text-base md:text-lg font-bold font-mono mt-1 ${filteredData[0].relative_diff_pct >= 0 ? 'text-[#D1B15F]' : 'text-rose-400'}`}>
                  {filteredData[0].relative_diff_pct > 0 ? '+' : ''}{filteredData[0].relative_diff_pct.toFixed(2)}%
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">Normalized Premium/Discount</div>
              </div>
            </div>

            <div className="text-xs text-zinc-400 bg-white/5 px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#D1B15F] shrink-0" />
              <span>Historical rolling statistics, volatility bands, and backtest simulations unlock automatically when ≥5 trading dates are imported.</span>
            </div>
          </div>
        ) : (
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              {activeTab === 'spread' ? (
                <ComposedChart data={filteredData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>

                <XAxis
                  dataKey="date_display"
                  tick={{ fill: '#71717A', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.floor(filteredData.length / 8)}
                />
                <YAxis
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
                  formatter={(val: any, name: string) => [`₹${Number(val).toFixed(2)}/10g`, name]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="upper_band" stroke="#E5C875" strokeDasharray="3 3" dot={false} strokeOpacity={0.6} name="Upper Band (+2σ)" />
                <Line type="monotone" dataKey="rolling_mean_spread" stroke="#A1A1AA" strokeDasharray="2 2" dot={false} name="20D Rolling Mean" />
                <Line type="monotone" dataKey="lower_band" stroke="#E5C875" strokeDasharray="3 3" dot={false} strokeOpacity={0.6} name="Lower Band (-2σ)" />
                <Line
                  type="monotone"
                  dataKey="spread_inr_10g"
                  name="Spread (₹/10g)"
                  stroke="#D1B15F"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#D1B15F', stroke: '#fff', strokeWidth: 2 }}
                />
                <ReferenceLine y={0} stroke="#52525B" />
              </ComposedChart>
            ) : activeTab === 'zscore' ? (
              <ComposedChart data={filteredData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="date_display"
                  tick={{ fill: '#71717A', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.floor(filteredData.length / 8)}
                />
                <YAxis
                  domain={[-3.5, 3.5]}
                  tick={{ fill: '#71717A', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v.toFixed(1)}σ`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E1E1E',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '12px',
                    fontSize: '11px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                  }}
                  formatter={(val: any) => [`${Number(val).toFixed(2)} σ`, 'Z-Score']}
                />
                <ReferenceLine y={2.0} stroke="#F87171" strokeDasharray="3 3" label={{ value: '+2σ Critical Anomaly', fill: '#F87171', fontSize: 10 }} />
                <ReferenceLine y={1.5} stroke="#FBBF24" strokeDasharray="2 2" label={{ value: '+1.5σ Elevated', fill: '#FBBF24', fontSize: 10 }} />
                <ReferenceLine y={0} stroke="#71717A" />
                <ReferenceLine y={-1.5} stroke="#FBBF24" strokeDasharray="2 2" />
                <ReferenceLine y={-2.0} stroke="#F87171" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="z_score"
                  stroke="#84A98C"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#84A98C', stroke: '#fff' }}
                  name="Statistical Z-Score"
                />
              </ComposedChart>
            ) : (
              <LineChart data={filteredData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="date_display"
                  tick={{ fill: '#71717A', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.floor(filteredData.length / 8)}
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
                  formatter={(val: any, name: string) => [`₹${Number(val).toLocaleString('en-IN')}`, name]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="target_price_10g"
                  name={`${targetSymbol} (Norm 10g)`}
                  stroke="#D1B15F"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="benchmark_price_10g"
                  name={`${benchmarkSymbol} (Bench 10g)`}
                  stroke="#84A98C"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
      </div>
    </div>
  );
};

