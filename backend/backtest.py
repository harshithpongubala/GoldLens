"""
GoldLens - Historical Evaluation & Mean-Reversion Backtest Engine
Evaluates historical statistical spread convergence with realistic execution timing,
next-bar executable fills, configurable exchange transaction costs, bid-ask slippage,
and contract expiry rollover handling.

CRITICAL FINANCIAL INTEGRITY PRINCIPLES:
1. Signal Timing: A signal evaluated on day t Close CANNOT be filled at day t Close.
   Execution MUST occur on day t+1 Open (or next executable bar).
2. Friction Modeling: Accounts for 4 legs per spread trade (entry + exit across 2 contracts),
   incorporating MCX exchange turnover fees, CTT/STT, GST, SEBI charges, stamp duty, and slippage.
3. Provenance Integrity: Synthetic demo dislocations must never be claimed as strategy alpha.
"""

from typing import Dict, Any, List
import pandas as pd
import numpy as np

def run_historical_backtest(
    analytics_engine,
    benchmark_symbol: str = "GOLDM",
    target_symbol: str = "GOLDPETAL",
    lookback_window: int = 20,
    entry_z_score: float = 2.0,
    exit_z_score: float = 0.5,
    max_holding_days: int = 10,
    cost_per_leg_bps: float = 5.0,
    slippage_bps_per_leg: float = 2.0
) -> Dict[str, Any]:
    """
    Executes a walk-forward, strictly non-lookahead backtest on historical relative spreads
    with next-day Open executable fills and realistic Indian commodity derivatives transaction friction.
    """
    b_sym = benchmark_symbol.upper()
    t_sym = target_symbol.upper()
    is_demo = getattr(analytics_engine, 'is_demo', True)
    source_label = getattr(analytics_engine, 'data_source_label', 'Unknown')

    provenance = (
        "DEMO DATA: Synthetic simulation with injected transient dislocation shocks. "
        "Trades and returns are purely demonstration artifacts and must not be used as evidence of live trading alpha."
        if is_demo else
        "GENUINE DATA: Historical MCX Daily Bhavcopy exchange records."
    )

    comp = analytics_engine.get_comparison(
        benchmark_symbol=b_sym,
        target_symbol=t_sym,
        lookback_window=lookback_window
    )
    history = comp.get("history", [])

    # Minimum history check: need at least lookback_window + 5 sessions
    min_required = lookback_window + 5
    if len(history) < min_required:
        return {
            "status": "INSUFFICIENT_DATA",
            "benchmark_symbol": b_sym,
            "target_symbol": t_sym,
            "is_demo_data": is_demo,
            "dataset_source": source_label,
            "data_provenance": provenance,
            "lookback_window": lookback_window,
            "entry_z_score": entry_z_score,
            "exit_z_score": exit_z_score,
            "cost_per_leg_bps": cost_per_leg_bps,
            "slippage_bps_per_leg": slippage_bps_per_leg,
            "total_trades": 0,
            "winning_trades": 0,
            "losing_trades": 0,
            "win_rate_pct": 0.0,
            "gross_total_return_pct": 0.0,
            "net_total_return_pct": 0.0,
            "average_trade_return_pct": 0.0,
            "average_holding_days": 0.0,
            "profit_factor": 0.0,
            "max_drawdown_pct": 0.0,
            "sharpe_ratio": 0.0,
            "disclaimer": (
                f"Insufficient historical trading sessions for backtesting {t_sym} vs {b_sym}. "
                f"Available: {len(history)} session(s), minimum required: {min_required} sessions."
            ),
            "trades": []
        }

    # Transaction Friction:
    # 4 execution legs total (2 on entry, 2 on exit)
    # Statutory fees: MCX turnover (0.0021%), SEBI, Stamp Duty, CTT, GST ~ 3-5 bps
    statutory_fee_pct = (4 * cost_per_leg_bps) / 100.0  # e.g., 4 * 0.05% = 0.20%
    slippage_rate = slippage_bps_per_leg / 10000.0       # e.g., 2 bps = 0.0002

    trades: List[Dict[str, Any]] = []
    in_trade = False
    current_trade: Dict[str, Any] = {}
    pending_signal: Dict[str, Any] = {}

    for i in range(lookback_window, len(history)):
        item = history[i]
        date = item["date"]
        z = item["z_score"]
        spread_close = item["spread_inr_10g"]
        expiry = item.get("target_expiry", "Active")

        # 1. PROCESS PENDING ENTRY (Execute at Bar i Open if signaled at Bar i-1 Close)
        if pending_signal and not in_trade:
            bench_open = item["benchmark_open_10g"]
            target_open = item["target_open_10g"]
            direction = pending_signal["direction"]

            # Apply realistic bid-ask slippage to executable Open prices
            if direction == "SHORT_SPREAD":
                # Sell target at bid (lower), buy bench at ask (higher)
                target_fill = target_open * (1.0 - slippage_rate)
                bench_fill = bench_open * (1.0 + slippage_rate)
            else:
                # Buy target at ask (higher), sell bench at bid (lower)
                target_fill = target_open * (1.0 + slippage_rate)
                bench_fill = bench_open * (1.0 - slippage_rate)

            fill_spread = target_fill - bench_fill

            in_trade = True
            current_trade = {
                "signal_date": pending_signal["signal_date"],
                "entry_date": date,
                "entry_index": i,
                "direction": direction,
                "signal_z_score": pending_signal["signal_z_score"],
                "entry_bench_price": bench_fill,
                "entry_target_price": target_fill,
                "entry_spread": fill_spread,
                "entry_expiry": expiry,
                "max_exit_index": min(len(history) - 1, i + max_holding_days)
            }
            pending_signal = {}

        # 2. CHECK EXIT CONDITIONS IF CURRENTLY IN TRADE
        if in_trade:
            holding_days = i - current_trade["entry_index"]
            exit_reason = None

            # Reason A: Statistical mean-reversion achieved (|Z| <= exit_z)
            if abs(z) <= exit_z_score:
                exit_reason = "STATISTICAL_REVERSION"
            # Reason B: Expiry rollover required (contract changed or expired)
            elif expiry != current_trade["entry_expiry"] and current_trade["entry_expiry"] != "Active":
                exit_reason = "CONTRACT_EXPIRY_ROLL"
            # Reason C: Max holding period elapsed
            elif i >= current_trade["max_exit_index"]:
                exit_reason = "MAX_HOLDING_DAYS"
            # Reason D: Last bar of historical archive
            elif i == len(history) - 1:
                exit_reason = "END_OF_DATA_CLOSEOUT"

            if exit_reason:
                # Determine exit fill price:
                # If subsequent session i+1 exists and reason is not END_OF_DATA, exit at bar i+1 Open
                if i + 1 < len(history) and exit_reason != "END_OF_DATA_CLOSEOUT":
                    next_bar = history[i + 1]
                    exit_date = next_bar["date"]
                    exit_bench_open = next_bar["benchmark_open_10g"]
                    exit_target_open = next_bar["target_open_10g"]
                    holding_days += 1
                else:
                    # Final bar closeout
                    exit_date = date
                    exit_bench_open = item["benchmark_price_10g"]
                    exit_target_open = item["target_price_10g"]

                # Apply exit slippage
                direction = current_trade["direction"]
                if direction == "SHORT_SPREAD":
                    # Buy back target at ask, sell bench at bid
                    exit_target_fill = exit_target_open * (1.0 + slippage_rate)
                    exit_bench_fill = exit_bench_open * (1.0 - slippage_rate)
                    exit_spread = exit_target_fill - exit_bench_fill
                    gross_pnl_10g = current_trade["entry_spread"] - exit_spread
                else:
                    # Sell target at bid, buy back bench at ask
                    exit_target_fill = exit_target_open * (1.0 - slippage_rate)
                    exit_bench_fill = exit_bench_open * (1.0 + slippage_rate)
                    exit_spread = exit_target_fill - exit_bench_fill
                    gross_pnl_10g = exit_spread - current_trade["entry_spread"]

                capital_base = current_trade["entry_bench_price"] + current_trade["entry_target_price"]
                gross_ret_pct = (gross_pnl_10g / capital_base) * 100.0 if capital_base > 0 else 0.0
                net_ret_pct = gross_ret_pct - statutory_fee_pct

                trades.append({
                    "signal_date": current_trade["signal_date"],
                    "entry_date": current_trade["entry_date"],
                    "exit_date": exit_date,
                    "holding_days": max(1, holding_days),
                    "direction": direction,
                    "entry_z_score": round(current_trade["signal_z_score"], 2),
                    "exit_z_score": round(z, 2),
                    "entry_spread": round(current_trade["entry_spread"], 2),
                    "exit_spread": round(exit_spread, 2),
                    "gross_return_pct": round(gross_ret_pct, 3),
                    "net_return_pct": round(net_ret_pct, 3),
                    "pnl_per_10g": round(gross_pnl_10g, 2),
                    "exit_reason": exit_reason
                })

                in_trade = False
                current_trade = {}
                continue

        # 3. EVALUATE ENTRY SIGNAL AT BAR i CLOSE (strictly non-lookahead)
        if not in_trade and not pending_signal:
            if abs(z) >= entry_z_score and i < len(history) - 1:
                direction = "SHORT_SPREAD" if z > 0 else "LONG_SPREAD"
                pending_signal = {
                    "signal_date": date,
                    "signal_z_score": z,
                    "direction": direction
                }

    # Compute aggregate statistical performance metrics
    total_trades = len(trades)
    if total_trades > 0:
        net_returns = [t["net_return_pct"] for t in trades]
        winning = [t for t in trades if t["net_return_pct"] > 0]
        losing = [t for t in trades if t["net_return_pct"] <= 0]
        win_rate = (len(winning) / total_trades) * 100.0
        gross_total = sum(t["gross_return_pct"] for t in trades)
        net_total = sum(net_returns)
        avg_ret = float(np.mean(net_returns))
        avg_holding = float(np.mean([t["holding_days"] for t in trades]))

        sum_wins = sum(t["net_return_pct"] for t in winning)
        sum_losses = abs(sum(t["net_return_pct"] for t in losing))
        profit_factor = round(sum_wins / sum_losses, 2) if sum_losses > 0 else (99.0 if sum_wins > 0 else 1.0)

        cumulative_curve = np.cumsum(net_returns)
        running_max = np.maximum.accumulate(cumulative_curve)
        drawdowns = running_max - cumulative_curve
        max_dd = float(np.max(drawdowns)) if len(drawdowns) > 0 else 0.0

        ret_std = float(np.std(net_returns))
        sharpe = round((avg_ret / ret_std) * np.sqrt(250 / max(1, avg_holding)), 2) if ret_std > 0 else 0.0
    else:
        win_rate = 0.0
        gross_total = 0.0
        net_total = 0.0
        avg_ret = 0.0
        avg_holding = 0.0
        profit_factor = 0.0
        max_dd = 0.0
        sharpe = 0.0
        winning = []
        losing = []

    execution_notes = (
        "Execution Model: Next-Day Open Fills. Signals triggered at Bar t Close execute strictly at Bar t+1 Open. "
        f"Transaction Costs: 4 legs * {cost_per_leg_bps} bps = {round(statutory_fee_pct, 2)}% statutory fees. "
        f"Execution Slippage: {slippage_bps_per_leg} bps per leg applied directly to executable Open fills."
    )

    return {
        "status": "COMPLETED",
        "benchmark_symbol": b_sym,
        "target_symbol": t_sym,
        "is_demo_data": is_demo,
        "dataset_source": source_label,
        "data_provenance": provenance,
        "execution_model": execution_notes,
        "lookback_window": lookback_window,
        "entry_z_score": entry_z_score,
        "exit_z_score": exit_z_score,
        "cost_per_leg_bps": cost_per_leg_bps,
        "slippage_bps_per_leg": slippage_bps_per_leg,
        "total_trades": total_trades,
        "winning_trades": len(winning),
        "losing_trades": len(losing),
        "win_rate_pct": round(win_rate, 1),
        "gross_total_return_pct": round(gross_total, 2),
        "net_total_return_pct": round(net_total, 2),
        "average_trade_return_pct": round(avg_ret, 3),
        "average_holding_days": round(avg_holding, 1),
        "profit_factor": profit_factor,
        "max_drawdown_pct": round(max_dd, 2),
        "sharpe_ratio": sharpe,
        "disclaimer": (
            "HISTORICAL SIMULATION ONLY. Results model realistic next-bar Open fills, Indian statutory charges, and slippage. "
            "Past statistical convergence does not guarantee future performance or live liquidity availability."
        ),
        "trades": trades
    }
