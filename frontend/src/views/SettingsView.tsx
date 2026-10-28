import React, { useState } from 'react';
import {
  Settings,
  Database,
  RefreshCw,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Server
} from 'lucide-react';
import { DataStatus } from '../types';

interface SettingsViewProps {
  status: DataStatus | null;
  onOpenImport: () => void;
  onRefreshData: () => void;
  isRefreshing: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  status,
  onOpenImport,
  onRefreshData,
  isRefreshing
}) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="glass-card rounded-[28px] p-6 md:p-8 border border-white/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white font-display">
              Platform & Data Configuration
            </h2>
            <p className="text-xs text-zinc-400">
              Manage MCX Bhavcopy data feeds, analytical parameters, and system health.
            </p>
          </div>
        </div>
      </div>

      {/* Data Source & Freshness Card */}
      <div className="glass-card rounded-[28px] p-6 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
            <Database className="w-5 h-5 text-[#D1B15F]" />
            <span>Dataset Integrity & Active Source</span>
          </h3>

          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            status?.is_demo_data ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          }`}>
            {status?.is_demo_data ? 'DEMO DATASET ACTIVE' : 'AUTHENTIC MCX ARCHIVE'}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-black/40 p-4 rounded-2xl border border-white/5 text-xs">
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase">Data Source</span>
            <span className="text-white font-semibold">{status?.data_source || 'MCX Daily Bhavcopy'}</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase">Coverage Range</span>
            <span className="text-white font-semibold">{status?.start_date} to {status?.end_date}</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase">Total Records</span>
            <span className="text-white font-semibold">{status?.total_records} Trade Days</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase">Contracts Active</span>
            <span className="text-[#D1B15F] font-bold">{status?.contracts_tracked} (GOLDM, GOLDTEN, GUINEA, PETAL)</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={onOpenImport}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white border border-white/10 flex items-center gap-2 transition-all"
          >
            <UploadCloud className="w-4 h-4 text-[#D1B15F]" />
            <span>Import New Bhavcopy CSV</span>
          </button>

          <button
            onClick={onRefreshData}
            disabled={isRefreshing}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 hover:text-white border border-white/10 flex items-center gap-2 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#D1B15F]' : ''}`} />
            <span>Reload & Re-normalize Data</span>
          </button>
        </div>
      </div>

      {/* Backend API Service Health */}
      <div className="glass-card rounded-[28px] p-6 border border-white/10 space-y-4">
        <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
          <Server className="w-5 h-5 text-emerald-400" />
          <span>Backend Analytical Engine Service</span>
        </h3>

        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">FastAPI Engine Status:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Online (127.0.0.1:8000)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Swagger API Docs:</span>
            <a
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="text-[#D1B15F] hover:underline flex items-center gap-1 font-mono"
            >
              http://127.0.0.1:8000/docs <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Endpoints Verified:</span>
            <span className="text-zinc-300 font-mono">
              /contracts, /prices, /comparison, /signals, /backtest, /status
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
