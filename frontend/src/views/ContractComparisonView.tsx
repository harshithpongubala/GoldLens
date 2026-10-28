import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  ArrowRight,
  ShieldCheck,
  Calculator,
  Play,
  Scale,
  Sparkles,
  Info
} from 'lucide-react';
import {
  ContractSpec,
  ComparisonMatrixItem,
  ComparisonSummary,
  BacktestResult
} from '../types';
import { fetchBacktest } from '../services/api';

interface ContractComparisonViewProps {
  contracts: ContractSpec[];
  matrix: ComparisonMatrixItem[];
  benchmarkSymbol: string;
  targetSymbol: string;
  onTargetChange: (sym: string) => void;
  lookback: number;
}

export const ContractComparisonView: React.FC<ContractComparisonViewProps> = ({
  contracts,
  matrix,
  benchmarkSymbol,
  targetSymbol,
  onTargetChange,
  lookback
}) => {
  const [adjustPurity, setAdjustPurity] = useState<boolean>(false);
  const [calcSymbol, setCalcSymbol] = useState<string>('GOLDPETAL');
  const [calcInputPrice, setCalcInputPrice] = useState<number>(7650);

  // Backtest state
  const [isRunningBacktest, setIsRunningBacktest] = useState<boolean>(false);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [entryZ, setEntryZ] = useState<number>(2.0);
  const [exitZ, setExitZ] = useState<number>(0.5);
  const [maxHolding, setMaxHolding] = useState<number>(10);
  const [costBps, setCostBps] = useState<number>(5.0);

  const selectedTargetSpec = contracts.find((c) => c.symbol === targetSymbol) || contracts[0];
  const selectedBenchSpec = contracts.find((c) => c.symbol === benchmarkSymbol) || contracts[0];

  const handleRunBacktest = async () => {
    setIsRunningBacktest(true);
    try {
      const res = await fetchBacktest(
        benchmarkSymbol,
        targetSymbol,
        lookback,
        entryZ,
        exitZ,
        maxHolding,
        costBps
      );
      setBacktestResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunningBacktest(false);
    }
  };

  useEffect(() => {
    handleRunBacktest();
  }, [benchmarkSymbol, targetSymbol, lookback]);

  // Normalization calculator computation
  const calcSpec = contracts.find((c) => c.symbol === calcSymbol) || contracts[0];
  const calcNorm10g = calcSpec
    ? (adjustPurity
        ? calcInputPrice * calcSpec.purity_adjusted_multiplier_to_10g
        : calcInputPrice * calcSpec.multiplier_to_10g)
    : 0;
  const calcNorm1g = calcSpec ? calcInputPrice * calcSpec.multiplier_to_1g : 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card rounded-[28px] p-6 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-bold text-white font-display">
              Deep Contract Comparison & Normalization
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 text-[#D1B15F] border border-[#D1B15F]/20 font-medium">
              Multi-Variant Basis
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Evaluate quotations across differing trading lot sizes (1g to 100g) and purity fineness (995 vs 999). 
            Never compare incompatible quotation bases directly.
          </p>
        </div>

        {/* Purity toggle */}
        <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-2xl border border-white/10">
          <Scale className="w-4 h-4 text-[#D1B15F]" />
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold">Purity Adjustment</span>
            <span className="text-xs text-white font-medium">
              {adjustPurity ? '995 / 999 Fineness Adjusted' : 'Raw 10g Metric Equivalence'}
            </span>
          </div>
          <button
            onClick={() => setAdjustPurity(!adjustPurity)}
            className={`ml-2 w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              adjustPurity ? 'bg-[#D1B15F]' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                adjustPurity ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Side-by-Side Specifications Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Benchmark Contract Card */}
        <div className="glass-card rounded-[28px] p-6 border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              Benchmark Contract
            </span>
            <span className="text-xs text-zinc-400 font-mono">Reference Zero Basis</span>
          </div>

          <h3 className="text-2xl font-bold text-white font-display">
            {selectedBenchSpec?.name} ({selectedBenchSpec?.symbol})
          </h3>
          <p className="text-xs text-zinc-400 mt-1 mb-4">
            {selectedBenchSpec?.description}
          </p>

          <div className="grid grid-cols-2 gap-3 bg-black/30 p-4 rounded-2xl border border-white/5 text-xs">
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Quotation Base</span>
              <span className="text-white font-semibold">{selectedBenchSpec?.quotation_unit} (₹/10g)</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Trading Unit / Lot</span>
              <span className="text-white font-semibold">{selectedBenchSpec?.trading_lot_grams} Grams</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Purity Rating</span>
              <span className="text-white font-semibold">{selectedBenchSpec?.purity} Fineness</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Multiplier to 10g</span>
              <span className="text-[#D1B15F] font-mono font-bold">{selectedBenchSpec?.multiplier_to_10g}x</span>
            </div>
          </div>
        </div>

        {/* Target Contract Card */}
        <div className="glass-card rounded-[28px] p-6 border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-[#D1B15F] uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#D1B15F]/10 border border-[#D1B15F]/20">
              Selected Target Variant
            </span>
            <select
              value={targetSymbol}
              onChange={(e) => onTargetChange(e.target.value)}
              className="bg-black/60 text-xs font-bold text-white px-3 py-1 rounded-xl border border-white/10 focus:outline-none cursor-pointer"
            >
              <option value="GOLDPETAL" className="bg-[#222]">GOLDPETAL (1g Micro)</option>
              <option value="GOLDGUINEA" className="bg-[#222]">GOLDGUINEA (8g Coin)</option>
              <option value="GOLDTEN" className="bg-[#222]">GOLDTEN (10g Lot)</option>
            </select>
          </div>

          <h3 className="text-2xl font-bold text-white font-display">
            {selectedTargetSpec?.name} ({selectedTargetSpec?.symbol})
          </h3>
          <p className="text-xs text-zinc-400 mt-1 mb-4">
            {selectedTargetSpec?.description}
          </p>

          <div className="grid grid-cols-2 gap-3 bg-black/30 p-4 rounded-2xl border border-white/5 text-xs">
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Quotation Base</span>
              <span className="text-white font-semibold">{selectedTargetSpec?.quotation_unit}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Trading Unit / Lot</span>
              <span className="text-white font-semibold">{selectedTargetSpec?.trading_lot_grams} Grams</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Purity Rating</span>
              <span className="text-white font-semibold">{selectedTargetSpec?.purity} Fineness</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Normalization Multiplier</span>
              <span className="text-[#D1B15F] font-mono font-bold">
                {adjustPurity
                  ? `${selectedTargetSpec?.purity_adjusted_multiplier_to_10g}x (Purity Adj)`
                  : `${selectedTargetSpec?.multiplier_to_10g}x`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Quotation Normalization Calculator */}
      <div className="glass-card rounded-[28px] p-6 border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-[#D1B15F]" />
          <h3 className="text-lg font-bold text-white font-display">
            Interactive Quotation Normalization Calculator
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-[11px] text-zinc-400 uppercase font-semibold block mb-1.5">
              Select Contract Variant
            </label>
            <select
              value={calcSymbol}
              onChange={(e) => setCalcSymbol(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none"
            >
              <option value="GOLDPETAL" className="bg-[#222]">GOLDPETAL (₹/1g)</option>
              <option value="GOLDGUINEA" className="bg-[#222]">GOLDGUINEA (₹/8g)</option>
              <option value="GOLDTEN" className="bg-[#222]">GOLDTEN (₹/10g)</option>
              <option value="GOLDM" className="bg-[#222]">GOLDM (₹/10g)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] text-zinc-400 uppercase font-semibold block mb-1.5">
              Raw Quoted Exchange Price (₹)
            </label>
            <input
              type="number"
              value={calcInputPrice}
              onChange={(e) => setCalcInputPrice(Number(e.target.value))}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none font-mono"
            />
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/5">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
              Normalized 10g Equivalent
            </span>
            <span className="text-lg font-bold text-[#D1B15F] font-mono">
              ₹{calcNorm10g.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/5">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
              Normalized 1g Equivalent
            </span>
            <span className="text-lg font-bold text-white font-mono">
              ₹{calcNorm1g.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Historical Evaluation / Backtest Simulation Section */}
      <div className="glass-card rounded-[28px] p-6 border border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg md:text-xl font-bold text-white font-display">
                Historical Spread Reversion Evaluation (Non-Lookahead)
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold uppercase">
                Statistical Simulation
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
              Simulates historical mean-reversion when relative spread diverges beyond Z-score threshold.
              Includes round-trip exchange transaction costs, STT/CTT, brokerage, and slippage.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
              <span className="text-zinc-400">Entry Z:</span>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="3.5"
                value={entryZ}
                onChange={(e) => setEntryZ(Number(e.target.value))}
                className="w-12 bg-transparent text-white font-bold text-center focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
              <span className="text-zinc-400">Exit Z:</span>
              <input
                type="number"
                step="0.1"
                min="0.0"
                max="1.5"
                value={exitZ}
                onChange={(e) => setExitZ(Number(e.target.value))}
                className="w-12 bg-transparent text-white font-bold text-center focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
              <span className="text-zinc-400">Costs (bps):</span>
              <input
                type="number"
                step="1"
                min="0"
                max="30"
                value={costBps}
                onChange={(e) => setCostBps(Number(e.target.value))}
                className="w-12 bg-transparent text-white font-bold text-center focus:outline-none"
              />
            </div>
            <button
              onClick={handleRunBacktest}
              disabled={isRunningBacktest}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#D1B15F] to-[#B8933D] text-black font-semibold text-xs flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all shadow-md"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>{isRunningBacktest ? 'Running...' : 'Run Backtest'}</span>
            </button>
          </div>
        </div>

        {/* Backtest KPI Row */}
        {backtestResult && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="p-3.5 rounded-2xl bg-black/30 border border-white/5">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Total Signals Executed</span>
                <span className="text-xl font-bold text-white font-display block mt-1">
                  {backtestResult.total_trades}
                </span>
                <span className="text-[10px] text-zinc-500 mt-0.5 block">
                  {backtestResult.winning_trades} Wins / {backtestResult.losing_trades} Losses
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/30 border border-white/5">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Win Rate %</span>
                <span className="text-xl font-bold text-emerald-400 font-display block mt-1">
                  {backtestResult.win_rate_pct.toFixed(1)}%
                </span>
                <span className="text-[10px] text-zinc-500 mt-0.5 block">
                  Avg Hold: {backtestResult.average_holding_days} Days
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/30 border border-white/5">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Net Return (After Costs)</span>
                <span className={`text-xl font-bold font-display block mt-1 ${
                  backtestResult.net_total_return_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {backtestResult.net_total_return_pct > 0 ? '+' : ''}{backtestResult.net_total_return_pct.toFixed(2)}%
                </span>
                <span className="text-[10px] text-zinc-500 mt-0.5 block">
                  Gross: {backtestResult.gross_total_return_pct.toFixed(2)}%
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/30 border border-white/5">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Profit Factor</span>
                <span className="text-xl font-bold text-amber-300 font-display block mt-1">
                  {backtestResult.profit_factor.toFixed(2)}
                </span>
                <span className="text-[10px] text-zinc-500 mt-0.5 block">
                  Max DD: {backtestResult.max_drawdown_pct.toFixed(2)}%
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/30 border border-white/5">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Sharpe Ratio</span>
                <span className="text-xl font-bold text-[#D1B15F] font-display block mt-1">
                  {backtestResult.sharpe_ratio.toFixed(2)}
                </span>
                <span className="text-[10px] text-zinc-500 mt-0.5 block">
                  Annualized (250 Days)
                </span>
              </div>
            </div>

            {/* Backtest Disclaimer Notice */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-300">Analytical Research Notice: </span>
                {backtestResult.disclaimer}
              </div>
            </div>

            {/* Trade Log Table */}
            {backtestResult.trades.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-black/40 text-zinc-400 border-b border-white/10 uppercase text-[10px] tracking-wider font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Entry Date</th>
                      <th className="py-2.5 px-3">Exit Date</th>
                      <th className="py-2.5 px-3">Hold Days</th>
                      <th className="py-2.5 px-3">Direction</th>
                      <th className="py-2.5 px-3">Entry Z</th>
                      <th className="py-2.5 px-3">Exit Z</th>
                      <th className="py-2.5 px-3">PnL (₹/10g)</th>
                      <th className="py-2.5 px-3">Net Return</th>
                      <th className="py-2.5 px-3">Exit Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {backtestResult.trades.map((t, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 px-3 text-white">{t.entry_date}</td>
                        <td className="py-2.5 px-3 text-white">{t.exit_date}</td>
                        <td className="py-2.5 px-3 text-zinc-300">{t.holding_days}d</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.direction === 'SHORT_SPREAD' ? 'bg-amber-500/20 text-amber-300' : 'bg-cyan-500/20 text-cyan-300'
                          }`}>
                            {t.direction}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-zinc-300">{t.entry_z_score.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-zinc-300">{t.exit_z_score.toFixed(2)}</td>
                        <td className={`py-2.5 px-3 font-bold ${t.pnl_per_10g >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {t.pnl_per_10g > 0 ? '+' : ''}₹{t.pnl_per_10g.toFixed(1)}
                        </td>
                        <td className={`py-2.5 px-3 font-bold ${t.net_return_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {t.net_return_pct > 0 ? '+' : ''}{t.net_return_pct.toFixed(2)}%
                        </td>
                        <td className="py-2.5 px-3 text-[10px] text-zinc-400 uppercase">{t.exit_reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
