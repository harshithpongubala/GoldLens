import {
  ContractSpec,
  ComparisonMatrixItem,
  ComparisonSummary,
  SignalItem,
  BacktestResult,
  DataStatus
} from '../types';

const API_BASE = '/api';

async function handleResponse<T>(res: Response, endpointName: string): Promise<T> {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const err = await res.json();
      if (err.detail) detail = err.detail;
      else if (err.error) detail = err.error;
      else if (err.message) detail = err.message;
    } catch {
      // not json
    }
    throw new Error(`${endpointName} error: ${detail}`);
  }
  return res.json();
}

export async function fetchStatus(): Promise<DataStatus> {
  const res = await fetch(`${API_BASE}/status`);
  return handleResponse<DataStatus>(res, 'Status API');
}

export async function fetchContracts(): Promise<{ contracts: ContractSpec[]; base_standard: string; methodology_summary: string }> {
  const res = await fetch(`${API_BASE}/contracts`);
  return handleResponse<{ contracts: ContractSpec[]; base_standard: string; methodology_summary: string }>(res, 'Contracts API');
}

export async function fetchComparisonMatrix(benchmarkSymbol: string = 'GOLDM'): Promise<{ benchmark_symbol: string; matrix: ComparisonMatrixItem[] }> {
  const res = await fetch(`${API_BASE}/comparison/matrix?benchmark_symbol=${benchmarkSymbol}`);
  return handleResponse<{ benchmark_symbol: string; matrix: ComparisonMatrixItem[] }>(res, 'Comparison Matrix API');
}

export async function fetchComparison(
  benchmarkSymbol: string = 'GOLDM',
  targetSymbol: string = 'GOLDPETAL',
  lookbackWindow: number = 20
): Promise<ComparisonSummary> {
  const res = await fetch(
    `${API_BASE}/comparison?benchmark_symbol=${benchmarkSymbol}&target_symbol=${targetSymbol}&lookback_window=${lookbackWindow}`
  );
  return handleResponse<ComparisonSummary>(res, 'Comparison API');
}

export async function fetchSignals(
  benchmarkSymbol: string = 'GOLDM',
  zThreshold: number = 1.5,
  lookbackWindow: number = 20
): Promise<{ benchmark_symbol: string; threshold: number; count: number; signals: SignalItem[] }> {
  const res = await fetch(
    `${API_BASE}/signals?benchmark_symbol=${benchmarkSymbol}&z_threshold=${zThreshold}&lookback_window=${lookbackWindow}`
  );
  return handleResponse<{ benchmark_symbol: string; threshold: number; count: number; signals: SignalItem[] }>(res, 'Signals API');
}

export async function fetchBacktest(
  benchmarkSymbol: string = 'GOLDM',
  targetSymbol: string = 'GOLDPETAL',
  lookbackWindow: number = 20,
  entryZScore: number = 2.0,
  exitZScore: number = 0.5,
  maxHoldingDays: number = 10,
  costPerLegBps: number = 5.0
): Promise<BacktestResult> {
  const params = new URLSearchParams({
    benchmark_symbol: benchmarkSymbol,
    target_symbol: targetSymbol,
    lookback_window: lookbackWindow.toString(),
    entry_z_score: entryZScore.toString(),
    exit_z_score: exitZScore.toString(),
    max_holding_days: maxHoldingDays.toString(),
    cost_per_leg_bps: costPerLegBps.toString()
  });
  const res = await fetch(`${API_BASE}/backtest?${params.toString()}`);
  if (!res.ok) throw new Error(`Backtest error: ${res.statusText}`);
  return res.json();
}

export async function importBhavcopy(filename: string, csvContent: string): Promise<{ status: string; message: string; records: number; scorecard?: any }> {
  const res = await fetch(`${API_BASE}/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, csv_content: csvContent })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Import failed');
  }
  return res.json();
}

export async function switchDataset(mode: 'demo' | 'genuine', filename?: string): Promise<{ status: string; message: string; is_demo_data: boolean; records: number }> {
  const res = await fetch(`${API_BASE}/dataset/switch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, filename })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Dataset switch failed');
  }
  return res.json();
}

