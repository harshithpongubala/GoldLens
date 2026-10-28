"""
GoldLens - MCX Simulation Data Generator (DEMO DATASET ONLY)
Generates synthetic demo data simulating MCX daily commodity bhavcopy structure for GOLDM, GOLDTEN, GOLDGUINEA, GOLDPETAL.
WARNING: This is synthetically generated demo data for platform demonstration and research. IT IS NOT AUTHENTIC MCX EXCHANGE DATA.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

def generate_mcx_bhavcopy(output_path: str, num_days: int = 140):
    np.random.seed(42)
    
    # End date: Oct 27, 2026 (latest weekday)
    end_date = datetime(2026, 10, 27)
    
    # Generate business trading days (excluding weekends)
    dates = []
    curr = end_date
    while len(dates) < num_days:
        if curr.weekday() < 5:  # Monday to Friday
            dates.append(curr)
        curr -= timedelta(days=1)
    dates = sorted(dates)
    
    # Base gold 10g price series (starts around ₹71,500 and trends to ~₹78,400 with realistic volatility)
    base_price = 72000.0
    daily_returns = np.random.normal(0.0006, 0.0075, size=len(dates))
    # Add a couple of realistic macro trend swings
    price_10g_series = [base_price]
    for ret in daily_returns:
        price_10g_series.append(price_10g_series[-1] * (1.0 + ret))
    price_10g_series = np.array(price_10g_series[1:])
    
    records = []
    
    # Contracts specifications
    contracts_spec = {
        "GOLDM": {
            "name": "Gold Mini",
            "quotation_unit": "10g",
            "trading_lot_grams": 100,
            "purity": 995,
            "quote_ratio": 1.0, # quoted per 10g
            "avg_volume": 12500,
            "avg_oi": 18500,
            "spread_bias_pct": 0.0, # benchmark
            "spread_noise_pct": 0.0008,
            "anomaly_days": []
        },
        "GOLDTEN": {
            "name": "Gold 10",
            "quotation_unit": "10g",
            "trading_lot_grams": 10,
            "purity": 995,
            "quote_ratio": 1.0, # quoted per 10g
            "avg_volume": 4200,
            "avg_oi": 6500,
            "spread_bias_pct": 0.0004, # tiny premium due to smaller lot
            "spread_noise_pct": 0.0012,
            "anomaly_days": [22, 68, 115] # slight deviation spikes
        },
        "GOLDGUINEA": {
            "name": "Gold Guinea",
            "quotation_unit": "8g", # 1 Guinea = 8g
            "trading_lot_grams": 8,
            "purity": 995,
            "quote_ratio": 8.0 / 10.0, # quoted per 8g!
            "avg_volume": 2100,
            "avg_oi": 3400,
            "spread_bias_pct": 0.0035, # Guinea trades at ~0.35% premium on 10g equivalent
            "spread_noise_pct": 0.0025,
            "anomaly_days": [45, 88, 128] # anomaly spikes
        },
        "GOLDPETAL": {
            "name": "Gold Petal",
            "quotation_unit": "1g", # 1 Petal = 1g
            "trading_lot_grams": 1,
            "purity": 999, # 999 purity
            "quote_ratio": 1.0 / 10.0, # quoted per 1g!
            "avg_volume": 35000,
            "avg_oi": 52000,
            "spread_bias_pct": 0.0090, # 999 purity and retail packaging premium ~0.9%
            "spread_noise_pct": 0.0030,
            "anomaly_days": [35, 75, 102, 134] # festive/liquidity dislocation spikes
        }
    }
    
    # Contract expiry schedule
    # Gold contracts on MCX typically expire on 5th of delivery months (e.g., Oct 5, Dec 5, Feb 5)
    def get_active_expiry(dt: datetime):
        if dt < datetime(2026, 8, 5):
            return "05-AUG-2026"
        elif dt < datetime(2026, 10, 5):
            return "05-OCT-2026"
        else:
            return "05-DEC-2026"
            
    for i, date_obj in enumerate(dates):
        date_str = date_obj.strftime("%d-%b-%Y").upper()
        p_10g_bench = price_10g_series[i]
        expiry_str = get_active_expiry(date_obj)
        
        for symbol, spec in contracts_spec.items():
            ratio = spec["quote_ratio"]
            bias = spec["spread_bias_pct"]
            noise = np.random.normal(0, spec["spread_noise_pct"])
            
            # Anomaly injection
            if i in spec["anomaly_days"]:
                noise += np.random.choice([0.018, -0.015, 0.022]) # 1.8% to 2.2% unusual dislocation
                
            # Calculate 10g equivalent price for this contract
            contract_10g_eq = p_10g_bench * (1.0 + bias + noise)
            
            # Quoted raw price based on exchange quotation unit
            raw_close = round(contract_10g_eq * ratio, 2)
            
            # Intra-day high/low/open based on realistic volatility
            intra_vol = np.random.uniform(0.003, 0.009)
            raw_high = round(raw_close * (1.0 + intra_vol * np.random.uniform(0.4, 0.9)), 2)
            raw_low = round(raw_close * (1.0 - intra_vol * np.random.uniform(0.4, 0.9)), 2)
            raw_open = round(raw_low + (raw_high - raw_low) * np.random.uniform(0.2, 0.8), 2)
            
            # Volume and OI with noise
            vol = int(max(10, spec["avg_volume"] * np.random.uniform(0.65, 1.45)))
            oi = int(max(50, spec["avg_oi"] * np.random.uniform(0.85, 1.15)))
            turnover_lakhs = round((raw_close * vol * spec["trading_lot_grams"]) / 100000.0, 2)
            
            records.append({
                "Date": date_str,
                "Data_Type": "DEMO_DATA_SYNTHETIC",
                "Instrument": "FUTCOM",
                "Symbol": symbol,
                "Contract_Name": spec["name"],
                "Expiry": expiry_str,
                "Quotation_Unit": spec["quotation_unit"],
                "Lot_Size_Grams": spec["trading_lot_grams"],
                "Purity": spec["purity"],
                "Open": raw_open,
                "High": raw_high,
                "Low": raw_low,
                "Close": raw_close,
                "Volume": vol,
                "OpenInterest": oi,
                "Value_Lakhs": turnover_lakhs
            })
            
    df = pd.DataFrame(records)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"[DEMO DATA] Generated {len(df)} synthetic simulation records from {dates[0].strftime('%Y-%m-%d')} to {dates[-1].strftime('%Y-%m-%d')} at {output_path}")

if __name__ == "__main__":
    out = os.path.join(os.path.dirname(__file__), "..", "data", "mcx_gold_bhavcopy.csv")
    generate_mcx_bhavcopy(out)
