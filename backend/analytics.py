"""
GoldLens - Analytical Processing Engine
Handles MCX Bhavcopy ingestion, data validation, normalized pricing,
cross-contract spread analysis, rolling Z-score anomaly detection, and explainable insights.
"""

import os
import pandas as pd
import numpy as np
from datetime import datetime
from typing import List, Dict, Any, Optional
from normalization import CONTRACT_SPECS, normalize_price

class CommodityAnalyticsEngine:
    def __init__(
        self,
        csv_path: Optional[str] = None,
        dataframe: Optional[pd.DataFrame] = None,
        is_demo: bool = True,
        data_source_label: str = "DEMO DATA — Synthetic MCX Simulation (Non-Exchange Data)",
        quality_scorecard: Optional[Dict[str, Any]] = None
    ):
        self.csv_path = csv_path
        self.is_demo = is_demo
        self.data_source_label = data_source_label
        self.quality_scorecard = quality_scorecard
        self.data_quality_status = (
            quality_scorecard.get("quality_status", "VALIDATED") if quality_scorecard 
            else ("SYNTHETIC_SIMULATION" if is_demo else "GENUINE_EXCHANGE_DATA")
        )
        self.df: pd.DataFrame = pd.DataFrame()
        self.last_loaded: Optional[datetime] = None
        
        if dataframe is not None:
            self.df = dataframe.copy()
            if 'Norm_Open_10g' not in self.df.columns and not self.df.empty:
                self.df['Norm_Open_10g'] = self.df.apply(lambda r: normalize_price(r['Symbol'], r['Open'], target_base="10g", adjust_purity=False), axis=1)
            self.last_loaded = datetime.now()
        elif csv_path:
            self.load_data()

    def load_data(self):
        if not self.csv_path or not os.path.exists(self.csv_path):
            raise FileNotFoundError(f"MCX Bhavcopy dataset not found at {self.csv_path}")

        df = pd.read_csv(self.csv_path)

        # Standardize column names
        df.columns = [c.strip() for c in df.columns]

        # Parse date
        # Support formats like '15-OCT-2026', '2026-10-15', etc.
        df['ParsedDate'] = pd.to_datetime(df['Date'], format='mixed', errors='coerce')
        df = df.dropna(subset=['ParsedDate'])
        df = df.sort_values(by=['ParsedDate', 'Symbol']).reset_index(drop=True)

        # Fill missing values if any
        for col in ['Open', 'High', 'Low', 'Close']:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
        df['Close'] = df['Close'].ffill().bfill()
        df['Open'] = df['Open'].fillna(df['Close'])
        df['High'] = df['High'].fillna(df[['Open', 'Close']].max(axis=1))
        df['Low'] = df['Low'].fillna(df[['Open', 'Close']].min(axis=1))
        df['Volume'] = pd.to_numeric(df['Volume'], errors='coerce').fillna(0).astype(int)
        df['OpenInterest'] = pd.to_numeric(df['OpenInterest'], errors='coerce').fillna(0).astype(int)

        # Compute normalized prices
        df['Norm_10g'] = df.apply(lambda r: normalize_price(r['Symbol'], r['Close'], target_base="10g", adjust_purity=False), axis=1)
        df['Norm_1g'] = df.apply(lambda r: normalize_price(r['Symbol'], r['Close'], target_base="1g", adjust_purity=False), axis=1)
        df['PurityAdj_10g'] = df.apply(lambda r: normalize_price(r['Symbol'], r['Close'], target_base="10g", adjust_purity=True), axis=1)
        df['Norm_Open_10g'] = df.apply(lambda r: normalize_price(r['Symbol'], r['Open'], target_base="10g", adjust_purity=False), axis=1)

        self.df = df
        self.last_loaded = datetime.now()

    def get_data_status(self) -> Dict[str, Any]:
        if self.df.empty:
            return {
                "status": "EMPTY",
                "is_demo_data": True,
                "data_source": "DEMO DATA — Synthetic MCX Simulation",
                "start_date": "N/A",
                "end_date": "N/A",
                "last_available_trading_date": "N/A",
                "total_records": 0,
                "contracts_tracked": 0,
                "symbols": [],
                "data_quality_status": "EMPTY",
                "quality_score": 0.0,
                "quality_details": None,
                "last_updated": None
            }
        valid_dates = self.df['ParsedDate'].dropna()
        unique_dates = valid_dates.unique()
        unique_dates_count = len(unique_dates)
        min_date = valid_dates.min().strftime('%d-%b-%Y') if not valid_dates.empty else "N/A"
        max_date = valid_dates.max().strftime('%d-%b-%Y') if not valid_dates.empty else "N/A"
        symbols = sorted(self.df['Symbol'].dropna().unique().tolist())
        is_demo = getattr(self, 'is_demo', True)
        source_name = getattr(self, 'data_source_label', "DEMO DATA — Synthetic MCX Simulation (Non-Exchange Data)")
        score = self.quality_scorecard.get("quality_score", 100.0) if self.quality_scorecard else 100.0
        quality_status = getattr(self, 'data_quality_status', "SYNTHETIC_SIMULATION" if is_demo else "EXCELLENT")

        observation_mode = "SINGLE_DAY_SNAPSHOT" if unique_dates_count == 1 else ("INSUFFICIENT_HISTORY" if unique_dates_count < 5 else "TIME_SERIES")
        historical_readiness = unique_dates_count >= 5

        return {
            "status": "LOADED",
            "is_demo_data": is_demo,
            "data_source": source_name,
            "start_date": min_date,
            "end_date": max_date,
            "last_available_trading_date": max_date,
            "total_records": len(self.df),
            "unique_dates_count": unique_dates_count,
            "observation_mode": observation_mode,
            "historical_readiness": historical_readiness,
            "contracts_tracked": len(symbols),
            "symbols": symbols,
            "data_quality_status": quality_status,
            "quality_score": score,
            "quality_details": self.quality_scorecard,
            "last_updated": self.last_loaded.strftime('%Y-%m-%d %H:%M:%S') if self.last_loaded else None
        }


    def get_prices(self, symbol: Optional[str] = None, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict[str, Any]]:
        sub = self.df.copy()
        if symbol:
            sub = sub[sub['Symbol'] == symbol.upper()]
        if start_date:
            sub = sub[sub['ParsedDate'] >= pd.to_datetime(start_date)]
        if end_date:
            sub = sub[sub['ParsedDate'] <= pd.to_datetime(end_date)]

        results = []
        for _, row in sub.iterrows():
            results.append({
                "date": row['ParsedDate'].strftime('%Y-%m-%d'),
                "date_display": row['Date'],
                "symbol": row['Symbol'],
                "contract_name": row.get('Contract_Name', CONTRACT_SPECS.get(row['Symbol'], {}).get('name', row['Symbol'])),
                "expiry": row.get('Expiry', 'Active'),
                "raw_open": float(row['Open']),
                "raw_high": float(row['High']),
                "raw_low": float(row['Low']),
                "raw_close": float(row['Close']),
                "normalized_10g_close": float(row['Norm_10g']),
                "normalized_1g_close": float(row['Norm_1g']),
                "purity_adjusted_10g_close": float(row['PurityAdj_10g']),
                "volume": int(row['Volume']),
                "open_interest": int(row['OpenInterest']),
                "value_lakhs": float(row.get('Value_Lakhs', 0.0))
            })
        return results

    def get_comparison(self, benchmark_symbol: str = "GOLDM", target_symbol: str = "GOLDPETAL", lookback_window: int = 20) -> Dict[str, Any]:
        """
        Calculates normalized relative-price spread time series and statistical deviation metrics.
        """
        b_sym = benchmark_symbol.upper()
        t_sym = target_symbol.upper()

        b_cols = ['ParsedDate', 'Date', 'Norm_10g', 'Close', 'Open', 'Volume']
        if 'Norm_Open_10g' in self.df.columns:
            b_cols.append('Norm_Open_10g')
        if 'Expiry' in self.df.columns:
            b_cols.append('Expiry')
            
        b_df = self.df[self.df['Symbol'] == b_sym][b_cols].copy().rename(
            columns={
                'Norm_10g': 'Bench_Norm_10g',
                'Norm_Open_10g': 'Bench_Norm_Open_10g',
                'Close': 'Bench_Raw',
                'Open': 'Bench_Raw_Open',
                'Volume': 'Bench_Vol',
                'Expiry': 'Bench_Expiry'
            }
        )
        # Select active liquid front-month contract per trading session to avoid expiry cross-products
        b_df = b_df.sort_values(by=['ParsedDate', 'Bench_Vol'], ascending=[True, False]).drop_duplicates(subset=['ParsedDate'], keep='first')

        t_cols = ['ParsedDate', 'Norm_10g', 'Close', 'Open', 'Volume']
        if 'Norm_Open_10g' in self.df.columns:
            t_cols.append('Norm_Open_10g')
        if 'Expiry' in self.df.columns:
            t_cols.append('Expiry')

        t_df = self.df[self.df['Symbol'] == t_sym][t_cols].copy().rename(
            columns={
                'Norm_10g': 'Target_Norm_10g',
                'Norm_Open_10g': 'Target_Norm_Open_10g',
                'Close': 'Target_Raw',
                'Open': 'Target_Raw_Open',
                'Volume': 'Target_Vol',
                'Expiry': 'Target_Expiry'
            }
        )
        t_df = t_df.sort_values(by=['ParsedDate', 'Target_Vol'], ascending=[True, False]).drop_duplicates(subset=['ParsedDate'], keep='first')

        merged = pd.merge(b_df, t_df, on='ParsedDate', how='inner').sort_values('ParsedDate').reset_index(drop=True)

        if merged.empty:
            return {"error": f"No overlapping dates between {b_sym} and {t_sym}"}

        # Spread in INR per 10g equivalent
        merged['Spread_10g'] = merged['Target_Norm_10g'] - merged['Bench_Norm_10g']
        merged['Relative_Diff_Pct'] = ((merged['Target_Norm_10g'] - merged['Bench_Norm_10g']) / merged['Bench_Norm_10g']) * 100.0

        n_obs = len(merged)
        w = max(5, lookback_window)

        # Enforce minimum observation count: N >= 5 required for meaningful sample standard deviation and Z-score
        has_sufficient_history = n_obs >= 5

        if has_sufficient_history:
            merged['Rolling_Mean'] = merged['Spread_10g'].rolling(window=w, min_periods=5).mean()
            merged['Rolling_Std'] = merged['Spread_10g'].rolling(window=w, min_periods=5).std().fillna(1.0)
            merged['Rolling_Std'] = merged['Rolling_Std'].replace(0, 1.0)
            merged['Z_Score'] = (merged['Spread_10g'] - merged['Rolling_Mean']) / merged['Rolling_Std']
            merged['Z_Score'] = merged['Z_Score'].fillna(0.0)
            merged['Upper_Band'] = merged['Rolling_Mean'] + (2.0 * merged['Rolling_Std'])
            merged['Lower_Band'] = merged['Rolling_Mean'] - (2.0 * merged['Rolling_Std'])

            def classify_status(z):
                abs_z = abs(z)
                if abs_z >= 2.0:
                    return "HIGH_DEVIATION"
                elif abs_z >= 1.5:
                    return "ELEVATED"
                else:
                    return "NORMAL"

            merged['Status'] = merged['Z_Score'].apply(classify_status)
        else:
            merged['Rolling_Mean'] = None
            merged['Rolling_Std'] = None
            merged['Z_Score'] = None
            merged['Upper_Band'] = None
            merged['Lower_Band'] = None
            merged['Status'] = "SNAPSHOT_ONLY" if n_obs == 1 else "INSUFFICIENT_HISTORY"

        items = []
        for _, row in merged.iterrows():
            spread = round(float(row['Spread_10g']), 2)
            diff_pct = round(float(row['Relative_Diff_Pct']), 2)

            if has_sufficient_history and pd.notnull(row['Z_Score']):
                z = round(float(row['Z_Score']), 2)
                rolling_mean = round(float(row['Rolling_Mean']), 2) if pd.notnull(row['Rolling_Mean']) else None
                rolling_std = round(float(row['Rolling_Std']), 2) if pd.notnull(row['Rolling_Std']) else None
                upper_b = round(float(row['Upper_Band']), 2) if pd.notnull(row['Upper_Band']) else None
                lower_b = round(float(row['Lower_Band']), 2) if pd.notnull(row['Lower_Band']) else None
                status = row['Status']
                explanation = self._build_explanation(t_sym, b_sym, spread, diff_pct, z, status)
            else:
                z = None
                rolling_mean = None
                rolling_std = None
                upper_b = None
                lower_b = None
                status = "SNAPSHOT_ONLY" if n_obs == 1 else "INSUFFICIENT_HISTORY"
                if n_obs == 1:
                    explanation = (
                        f"Single-day genuine snapshot ({row['Date']}). Spread is ₹{spread:+.2f}/10g ({diff_pct:+.2f}%). "
                        "Historical Z-scores, rolling Bollinger Bands, and backtesting require at least 5 trading sessions."
                    )
                else:
                    explanation = (
                        f"Insufficient observations ({n_obs} sessions available). "
                        "At least 5 trading sessions required to compute sample variance and statistical Z-score."
                    )

            bench_open = float(row.get('Bench_Norm_Open_10g', row['Bench_Norm_10g']))
            target_open = float(row.get('Target_Norm_Open_10g', row['Target_Norm_10g']))

            items.append({
                "date": row['ParsedDate'].strftime('%Y-%m-%d'),
                "date_display": row['Date'],
                "benchmark_symbol": b_sym,
                "target_symbol": t_sym,
                "benchmark_price_10g": round(float(row['Bench_Norm_10g']), 2),
                "target_price_10g": round(float(row['Target_Norm_10g']), 2),
                "benchmark_open_10g": round(bench_open, 2),
                "target_open_10g": round(target_open, 2),
                "benchmark_raw_close": round(float(row['Bench_Raw']), 2),
                "target_raw_close": round(float(row['Target_Raw']), 2),
                "benchmark_raw_open": round(float(row.get('Bench_Raw_Open', row['Bench_Raw'])), 2),
                "target_raw_open": round(float(row.get('Target_Raw_Open', row['Target_Raw'])), 2),
                "benchmark_expiry": str(row.get('Bench_Expiry', 'Active')),
                "target_expiry": str(row.get('Target_Expiry', 'Active')),
                "spread_inr_10g": spread,
                "relative_diff_pct": diff_pct,
                "rolling_mean_spread": rolling_mean,
                "rolling_std_spread": rolling_std,
                "z_score": z,
                "upper_band": upper_b,
                "lower_band": lower_b,
                "status": status,
                "signal_explanation": explanation
            })

        latest = items[-1] if items else {}
        summary = {
            "benchmark_symbol": b_sym,
            "target_symbol": t_sym,
            "lookback_window": w,
            "total_points": len(items),
            "is_snapshot_only": not has_sufficient_history,
            "observation_mode": "SINGLE_DAY_SNAPSHOT" if n_obs == 1 else ("INSUFFICIENT_HISTORY" if not has_sufficient_history else "TIME_SERIES"),
            "current_spread_10g": latest.get("spread_inr_10g", 0),
            "current_diff_pct": latest.get("relative_diff_pct", 0),
            "current_z_score": latest.get("z_score", None),
            "current_status": latest.get("status", "SNAPSHOT_ONLY" if n_obs == 1 else "NORMAL"),
            "current_explanation": latest.get("signal_explanation", ""),
            "history": items
        }
        return summary

    def get_active_signals(self, benchmark_symbol: str = "GOLDM", z_threshold: float = 1.5, lookback_window: int = 20) -> List[Dict[str, Any]]:
        """
        Scans all target contracts against benchmark to isolate statistically elevated deviations.
        """
        b_sym = benchmark_symbol.upper()
        targets = [s for s in CONTRACT_SPECS.keys() if s != b_sym]
        signals = []

        for target in targets:
            comp = self.get_comparison(benchmark_symbol=b_sym, target_symbol=target, lookback_window=lookback_window)
            history = comp.get("history", [])
            for item in history:
                if item.get("z_score") is not None and abs(item["z_score"]) >= z_threshold:
                    target_spec = CONTRACT_SPECS.get(target, {})
                    signals.append({
                        "id": f"SIG-{target}-{item['date']}",
                        "date": item["date"],
                        "date_display": item["date_display"],
                        "benchmark_symbol": b_sym,
                        "target_symbol": target,
                        "target_name": target_spec.get("name", target),
                        "raw_target_price": item["target_raw_close"],
                        "target_quotation": target_spec.get("quotation_unit", ""),
                        "normalized_10g_price": item["target_price_10g"],
                        "benchmark_10g_price": item["benchmark_price_10g"],
                        "spread_inr_10g": item["spread_inr_10g"],
                        "relative_diff_pct": item["relative_diff_pct"],
                        "z_score": item["z_score"],
                        "severity": item["status"],
                        "direction": "PREMIUM" if item["spread_inr_10g"] > 0 else "DISCOUNT",
                        "percentile": round(min(99.9, max(0.1, 50.0 + (item["z_score"] * 24.0))), 1),
                        "explanation": item["signal_explanation"],
                        "potential_drivers": self._get_potential_drivers(target, item["z_score"])
                    })

        # Sort by latest date descending, then highest absolute z-score
        signals = sorted(signals, key=lambda s: (s["date"], abs(s["z_score"])), reverse=True)
        return signals

    def get_cross_comparison_matrix(self, benchmark_symbol: str = "GOLDM") -> List[Dict[str, Any]]:
        """
        Returns latest cross-contract comparison summary for all contracts.
        """
        b_sym = benchmark_symbol.upper()
        latest_date = self.df['ParsedDate'].max()
        latest_rows = self.df[self.df['ParsedDate'] == latest_date]
        bench_row = latest_rows[latest_rows['Symbol'] == b_sym]
        bench_10g = float(bench_row['Norm_10g'].iloc[0]) if not bench_row.empty else 75000.0

        valid_dates = self.df['ParsedDate'].dropna().unique()
        has_sufficient_history = len(valid_dates) >= 5

        results = []
        for symbol, spec in CONTRACT_SPECS.items():
            sym_row = latest_rows[latest_rows['Symbol'] == symbol]
            raw_close = float(sym_row['Close'].iloc[0]) if not sym_row.empty else 0.0
            norm_10g = float(sym_row['Norm_10g'].iloc[0]) if not sym_row.empty else 0.0
            norm_1g = float(sym_row['Norm_1g'].iloc[0]) if not sym_row.empty else 0.0
            vol = int(sym_row['Volume'].iloc[0]) if not sym_row.empty else 0
            oi = int(sym_row['OpenInterest'].iloc[0]) if not sym_row.empty else 0
            expiry = sym_row['Expiry'].iloc[0] if not sym_row.empty and 'Expiry' in sym_row else 'Active'

            spread = round(norm_10g - bench_10g, 2)
            rel_diff = round(((norm_10g - bench_10g) / bench_10g) * 100.0, 2) if bench_10g else 0.0

            # Calculate rolling Z-score
            if symbol == b_sym:
                z = 0.0 if has_sufficient_history else None
                status = "BENCHMARK"
            else:
                comp = self.get_comparison(benchmark_symbol=b_sym, target_symbol=symbol, lookback_window=20)
                z = comp.get("current_z_score", None)
                status = comp.get("current_status", "NORMAL")

            # Mini sparkline history (last 10 days normalized 10g price)
            sub = self.df[self.df['Symbol'] == symbol].sort_values('ParsedDate').tail(10)
            sparkline = [round(float(p), 2) for p in sub['Norm_10g'].tolist()]

            results.append({
                "symbol": symbol,
                "name": spec["name"],
                "quotation_unit": spec["quotation_unit"],
                "quotation_desc": spec["quotation_desc"],
                "trading_lot_grams": spec["trading_lot_grams"],
                "purity": spec["purity"],
                "raw_close": raw_close,
                "normalized_10g_price": norm_10g,
                "normalized_1g_price": norm_1g,
                "spread_vs_benchmark_10g": spread,
                "relative_diff_pct": rel_diff,
                "z_score": z,
                "status": status,
                "volume": vol,
                "open_interest": oi,
                "expiry": expiry,
                "sparkline": sparkline
            })
        return results


    def _build_explanation(self, target: str, bench: str, spread: float, diff_pct: float, z: float, status: str) -> str:
        t_spec = CONTRACT_SPECS.get(target, {})
        if status == "HIGH_DEVIATION":
            direction = "substantial premium" if spread > 0 else "unusual discount"
            return (
                f"{t_spec.get('name', target)} is exhibiting an acute statistical deviation (Z-Score {z:+.2f}), "
                f"trading at a {direction} of ₹{abs(spread):.1f}/10g ({diff_pct:+.2f}%) over {bench}. "
                f"This diverges by >2.0 standard deviations from its 20-day historical basis, indicating transient structural friction."
            )
        elif status == "ELEVATED":
            return (
                f"{t_spec.get('name', target)} shows an elevated spread of ₹{spread:+.1f}/10g ({diff_pct:+.2f}%) "
                f"versus {bench} (Z-Score {z:+.2f}). Spread is tracking within the 1.5 - 2.0 sigma corridor."
            )
        else:
            return (
                f"{t_spec.get('name', target)} is trading normally relative to {bench} with a spread of "
                f"₹{spread:+.1f}/10g ({diff_pct:+.2f}%, Z-Score {z:+.2f}). Spread dynamics are within typical historical variance."
            )

    def _get_potential_drivers(self, symbol: str, z_score: float) -> List[str]:
        drivers = []
        if symbol == "GOLDPETAL":
            drivers.extend([
                "Purity discrepancy (999 fineness in Petal vs 995 benchmark fineness on Mini)",
                "Retail delivery packaging & micro-denomination minting premium",
                "High retail participation spikes around Dhanteras/Akshaya Tritiya delivery windows"
            ])
        elif symbol == "GOLDGUINEA":
            drivers.extend([
                "Quotation base conversion friction (8-gram sovereign unit vs 10-gram metric standard)",
                "Physical sovereign coin delivery demand in regional bullion centers",
                "Lower liquidity depth relative to benchmark mini contracts"
            ])
        elif symbol == "GOLDTEN":
            drivers.extend([
                "Contract delivery rollover pressure between near-month and far-month cycles",
                "Margin financing differentials between 10g and 100g contract lots"
            ])
        else:
            drivers.append("Standard macro market volatility and order flow imbalances")

        if abs(z_score) >= 2.0:
            drivers.append("Statistical mean-reversion dislocation — high probability of historical basis convergence")
        return drivers
