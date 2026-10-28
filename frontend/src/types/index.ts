export interface ContractSpec {
  symbol: string;
  name: string;
  quotation_unit: string;
  quotation_desc: string;
  trading_lot_grams: number;
  purity: number;
  tick_size: number;
  multiplier_to_10g: number;
  multiplier_to_1g: number;
  purity_adjusted_multiplier_to_10g: number;
  description: string;
}

export interface ComparisonMatrixItem {
  symbol: string;
  name: string;
  quotation_unit: string;
  quotation_desc: string;
  trading_lot_grams: number;
  purity: number;
  raw_close: number;
  normalized_10g_price: number;
  normalized_1g_price: number;
  spread_vs_benchmark_10g: number;
  relative_diff_pct: number;
  z_score: number | null;
  status: 'BENCHMARK' | 'NORMAL' | 'ELEVATED' | 'HIGH_DEVIATION' | 'SNAPSHOT_ONLY' | 'SNAPSHOT';
  volume: number;
  open_interest: number;
  expiry: string;
  sparkline: number[];
}

export interface ComparisonPoint {
  date: string;
  date_display: string;
  benchmark_symbol: string;
  target_symbol: string;
  benchmark_price_10g: number;
  target_price_10g: number;
  benchmark_open_10g?: number;
  target_open_10g?: number;
  benchmark_raw_close: number;
  target_raw_close: number;
  benchmark_raw_open?: number;
  target_raw_open?: number;
  benchmark_expiry?: string;
  target_expiry?: string;
  spread_inr_10g: number;
  relative_diff_pct: number;
  rolling_mean_spread: number | null;
  rolling_std_spread: number | null;
  z_score: number | null;
  upper_band: number | null;
  lower_band: number | null;
  status: 'NORMAL' | 'ELEVATED' | 'HIGH_DEVIATION' | 'SNAPSHOT_ONLY' | 'SNAPSHOT';
  has_sufficient_history?: boolean;
  signal_explanation: string;
}

export interface ComparisonSummary {
  benchmark_symbol: string;
  target_symbol: string;
  lookback_window: number;
  total_points: number;
  observation_mode?: string;
  historical_readiness?: string;
  readiness_message?: string;
  current_spread_10g: number;
  current_diff_pct: number;
  current_z_score: number | null;
  current_status: 'NORMAL' | 'ELEVATED' | 'HIGH_DEVIATION' | 'SNAPSHOT_ONLY' | 'SNAPSHOT';
  current_explanation: string;
  history: ComparisonPoint[];
}

export interface SignalItem {
  id: string;
  date: string;
  date_display: string;
  benchmark_symbol: string;
  target_symbol: string;
  target_name: string;
  raw_target_price: number;
  target_quotation: string;
  normalized_10g_price: number;
  benchmark_10g_price: number;
  spread_inr_10g: number;
  relative_diff_pct: number;
  z_score: number;
  severity: 'NORMAL' | 'ELEVATED' | 'HIGH_DEVIATION';
  direction: 'PREMIUM' | 'DISCOUNT';
  percentile: number;
  explanation: string;
  potential_drivers: string[];
}

export interface BacktestTrade {
  entry_date: string;
  exit_date: string;
  holding_days: number;
  direction: 'SHORT_SPREAD' | 'LONG_SPREAD';
  entry_z_score: number;
  exit_z_score: number;
  entry_spread: number;
  exit_spread: number;
  gross_return_pct: number;
  net_return_pct: number;
  pnl_per_10g: number;
  exit_reason: string;
}

export interface BacktestResult {
  benchmark_symbol: string;
  target_symbol: string;
  lookback_window: number;
  entry_z_score: number;
  exit_z_score: number;
  cost_per_leg_bps: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate_pct: number;
  gross_total_return_pct: number;
  net_total_return_pct: number;
  average_trade_return_pct: number;
  average_holding_days: number;
  profit_factor: number;
  max_drawdown_pct: number;
  sharpe_ratio: number;
  disclaimer: string;
  is_demo_data?: boolean;
  dataset_source?: string;
  data_provenance?: string;
  trades: BacktestTrade[];
}

export interface DataStatus {
  status: string;
  is_demo_data: boolean;
  data_source: string;
  start_date: string;
  end_date: string;
  last_available_trading_date?: string;
  total_records: number;
  contracts_tracked: number;
  symbols: string[];
  data_quality_status?: string;
  quality_score?: number;
  quality_details?: any;
  last_updated?: string;
}
