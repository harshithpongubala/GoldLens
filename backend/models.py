from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ContractSpec(BaseModel):
    symbol: str
    name: str
    quotation_unit: str
    quotation_desc: str
    trading_lot_grams: float
    purity: int
    tick_size: float
    multiplier_to_10g: float
    multiplier_to_1g: float
    purity_adjusted_multiplier_to_10g: float
    description: str

class PriceRecord(BaseModel):
    date: str
    symbol: str
    contract_name: str
    expiry: str
    raw_open: float
    raw_high: float
    raw_low: float
    raw_close: float
    normalized_10g_close: float
    normalized_1g_close: float
    purity_adjusted_10g_close: float
    volume: int
    open_interest: int
    value_lakhs: float

class ComparisonPair(BaseModel):
    date: str
    benchmark_symbol: str
    target_symbol: str
    benchmark_price_10g: float
    target_price_10g: float
    spread_inr_10g: float
    relative_diff_pct: float
    rolling_mean_spread: float
    rolling_std_spread: float
    z_score: float
    upper_band: float
    lower_band: float
    status: str # NORMAL, ELEVATED, HIGH_DEVIATION
    signal_explanation: str

class SignalItem(BaseModel):
    id: str
    date: str
    benchmark_symbol: str
    target_symbol: str
    target_name: str
    raw_target_price: float
    target_quotation: str
    normalized_10g_price: float
    benchmark_10g_price: float
    spread_inr_10g: float
    relative_diff_pct: float
    z_score: float
    severity: str # "NORMAL", "ELEVATED", "HIGH_DEVIATION"
    direction: str # "PREMIUM" (Overvalued relative to bench) or "DISCOUNT" (Undervalued)
    percentile: float
    explanation: str
    potential_drivers: List[str]

class BacktestRequest(BaseModel):
    benchmark_symbol: str = "GOLDM"
    target_symbol: str = "GOLDPETAL"
    lookback_window: int = 20
    entry_z_score: float = 2.0
    exit_z_score: float = 0.5
    max_holding_days: int = 10
    cost_per_leg_bps: float = 5.0 # 0.05% slippage/costs

class BacktestTrade(BaseModel):
    entry_date: str
    exit_date: str
    holding_days: int
    direction: str # LONG_SPREAD or SHORT_SPREAD
    entry_z_score: float
    exit_z_score: float
    entry_spread: float
    exit_spread: float
    gross_return_pct: float
    net_return_pct: float
    pnl_per_10g: float
    exit_reason: str # "REVERSION", "MAX_HOLDING", "EXPIRY"

class BacktestResult(BaseModel):
    benchmark_symbol: str
    target_symbol: str
    lookback_window: int
    entry_z_score: float
    exit_z_score: float
    cost_per_leg_bps: float
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate_pct: float
    gross_total_return_pct: float
    net_total_return_pct: float
    average_trade_return_pct: float
    average_holding_days: float
    profit_factor: float
    max_drawdown_pct: float
    sharpe_ratio: float
    disclaimer: str
    trades: List[BacktestTrade]
