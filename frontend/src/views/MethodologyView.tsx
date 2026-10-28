import React from 'react';
import {
  BookOpen,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Cpu,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { ContractSpec } from '../types';

interface MethodologyViewProps {
  contracts: ContractSpec[];
}

export const MethodologyView: React.FC<MethodologyViewProps> = ({ contracts }) => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div className="glass-card rounded-[28px] p-6 md:p-8 border border-white/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#D1B15F]/20 text-[#D1B15F] flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white font-display">
              Quantitative Methodology & Normalization Logic
            </h2>
            <p className="text-xs text-zinc-400">
              Documented, mathematically defensible framework for MCX Gold Futures relative-price analytics.
            </p>
          </div>
        </div>

        {/* Critical Rule Banner */}
        <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <AlertTriangle className="w-4 h-4" />
            <span>Foundational Analytical Principles</span>
          </div>
          <p>
            1. <span className="font-semibold text-white">Never compare incompatible quotation bases directly:</span> MCX quotes GOLDM and GOLDTEN per 10 grams, GOLDGUINEA per 8 grams, and GOLDPETAL per 1 gram. Direct price comparison without normalization produces meaningless results.
          </p>
          <p>
            2. <span className="font-semibold text-white">Price difference is NOT guaranteed arbitrage:</span> Relative-price divergences reflect delivery lot size friction, minting/fabrication charges for micro-units, quotation rounding, and differing liquidity depth across contracts.
          </p>
        </div>
      </div>

      {/* Contract Specs Reference Table */}
      <div className="glass-card rounded-[28px] p-6 md:p-8 border border-white/10">
        <h3 className="text-lg font-bold text-white font-display mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#D1B15F]" />
          <span>MCX Gold Contracts Specification Matrix</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/40 text-zinc-400 uppercase text-[10px] tracking-wider font-semibold border-b border-white/10">
              <tr>
                <th className="py-3 px-4">Symbol</th>
                <th className="py-3 px-4">Contract Name</th>
                <th className="py-3 px-4">Quotation Base</th>
                <th className="py-3 px-4">Trading Unit (Lot)</th>
                <th className="py-3 px-4">Purity</th>
                <th className="py-3 px-4">10g Multiplier</th>
                <th className="py-3 px-4">1g Multiplier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {contracts.map((c) => (
                <tr key={c.symbol} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-bold text-white">{c.symbol}</td>
                  <td className="py-3 px-4 text-zinc-300 font-sans">{c.name}</td>
                  <td className="py-3 px-4 text-amber-300 font-bold">{c.quotation_unit}</td>
                  <td className="py-3 px-4 text-zinc-300">{c.trading_lot_grams}g</td>
                  <td className="py-3 px-4 text-zinc-300">{c.purity} Fineness</td>
                  <td className="py-3 px-4 text-[#D1B15F] font-bold">{c.multiplier_to_10g}x</td>
                  <td className="py-3 px-4 text-zinc-300">{c.multiplier_to_1g}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mathematical Formulations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Normalization Formulas */}
        <div className="glass-card rounded-[28px] p-6 border border-white/10 space-y-4">
          <h4 className="text-base font-bold text-white font-display flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#D1B15F]" />
            <span>1. Unit Normalization Logic</span>
          </h4>

          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 font-mono text-xs text-zinc-300 space-y-2">
            <div className="text-zinc-500 font-sans text-[11px] font-semibold uppercase">Standard 10g Basis Formulas:</div>
            <div>P_10g(GOLDM) = RawPrice * 1.0</div>
            <div>P_10g(GOLDTEN) = RawPrice * 1.0</div>
            <div>P_10g(GOLDGUINEA) = RawPrice * (10 / 8) = RawPrice * 1.25</div>
            <div>P_10g(GOLDPETAL) = RawPrice * 10.0</div>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            <span className="text-white font-semibold">Purity Adjustment (Optional):</span> For GOLDPETAL (999 fineness), the theoretical 995-purity equivalent price is adjusted by the ratio:
          </p>
          <div className="p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-[#D1B15F]">
            P_10g_adj(PETAL) = RawPrice * 10.0 * (995 / 999) ≈ RawPrice * 9.95996
          </div>
        </div>

        {/* Statistical Anomaly Detection */}
        <div className="glass-card rounded-[28px] p-6 border border-white/10 space-y-4">
          <h4 className="text-base font-bold text-white font-display flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#D1B15F]" />
            <span>2. Rolling Z-Score Anomaly Detection</span>
          </h4>

          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 font-mono text-xs text-zinc-300 space-y-2">
            <div className="text-zinc-500 font-sans text-[11px] font-semibold uppercase">Spread & Z-Score Equations:</div>
            <div>Spread_t = P_target,t - P_bench,t (₹/10g)</div>
            <div>μ_t = (1 / W) * Σ Spread_(t-k) for k=0..W-1</div>
            <div>σ_t = sqrt[ (1 / (W-1)) * Σ (Spread_(t-k) - μ_t)^2 ]</div>
            <div>Z_t = (Spread_t - μ_t) / σ_t</div>
          </div>

          <div className="text-xs text-zinc-400 space-y-1">
            <div>• <span className="text-emerald-400 font-semibold">Normal:</span> |Z_t| &lt; 1.5σ (within standard historical noise)</div>
            <div>• <span className="text-amber-400 font-semibold">Elevated:</span> 1.5σ ≤ |Z_t| &lt; 2.0σ (transient basis pressure)</div>
            <div>• <span className="text-rose-400 font-semibold">High Deviation:</span> |Z_t| ≥ 2.0σ (statistical anomaly dislocation)</div>
          </div>
        </div>
      </div>

      {/* Backtesting Mechanics & Cost Modeling */}
      <div className="glass-card rounded-[28px] p-6 md:p-8 border border-white/10 space-y-4">
        <h4 className="text-base font-bold text-white font-display flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#84A98C]" />
          <span>3. Historical Simulation Without Lookahead Bias</span>
        </h4>
        <p className="text-xs text-zinc-400 leading-relaxed">
          The GoldLens historical backtester evaluates the historical mean-reversion hypothesis of relative-price spreads.
          To ensure credibility and prevent lookahead bias:
        </p>
        <ul className="text-xs text-zinc-300 space-y-2 list-disc list-inside">
          <li><span className="font-semibold text-white">Strict Point-in-Time Rolling Metrics:</span> Parameters (μ_t, σ_t, Z_t) at day t are calculated exclusively from history up to day t.</li>
          <li><span className="font-semibold text-white">Contract Expiry Handling:</span> Trades are forcibly liquidated prior to the MCX physical tender period to eliminate delivery settlement risk.</li>
          <li><span className="font-semibold text-white">Realistic Transaction Friction:</span> Deducts exchange turnover fees (0.0021%), STT/CTT (0.01%), broker commissions (0.03%), GST (18%), and execution slippage across both legs.</li>
        </ul>
      </div>
    </div>
  );
};
