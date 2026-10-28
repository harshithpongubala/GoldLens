import pandas as pd
from normalization import CONTRACT_SPECS, normalize_price

df = pd.read_csv('c:/Users/rahul/goldlens/data/genuine/BhavCopyDateWise_27102026.csv')

print(f"Total valid gold records: {len(df)}")
unique_dates = df['Date'].unique().tolist()
print(f"Unique trading dates: {unique_dates} (Count: {len(unique_dates)})")
symbols = sorted(df['Symbol'].unique().tolist())
print(f"Contract symbols ({len(symbols)}): {symbols}")

for sym in symbols:
    sub = df[df['Symbol'] == sym]
    expiries = sub['Expiry'].tolist()
    print(f"  Contract: {sym:10s} | Records: {len(sub)} | Expiries: {', '.join(expiries)}")

print("\n--- Verifying Normalized Prices Against Raw Settlement Prices & Conversion Rules ---")
for idx, r in df.iterrows():
    sym = r['Symbol']
    raw = r['Close']
    q = r['Quotation_Unit']
    norm10 = r['Norm_10g']
    norm1 = r['Norm_1g']

    expected_10g = normalize_price(sym, raw, target_base="10g", adjust_purity=False)
    expected_1g = normalize_price(sym, raw, target_base="1g", adjust_purity=False)
    
    assert abs(norm10 - expected_10g) < 1e-4, f"Mismatch in 10g for {sym}: {norm10} vs {expected_10g}"
    assert abs(norm1 - expected_1g) < 1e-4, f"Mismatch in 1g for {sym}: {norm1} vs {expected_1g}"

print("All 30 records match documented quotation-unit conversion rules with 100% precision!\n")

print("--- Front-Month Liquid Contracts Normalized Price Snapshot (27-OCT-2026) ---")
front_rows = df[df['Expiry'].isin(['30OCT2026', '05NOV2026', '04DEC2026'])].drop_duplicates(subset=['Symbol'], keep='first')
for _, r in front_rows.iterrows():
    mult_10g = CONTRACT_SPECS[r['Symbol']]['multiplier_to_10g']
    print(f"{r['Symbol']:10s} | Expiry: {r['Expiry']:9s} | Raw Close: INR {r['Close']:>9.2f} / {r['Quotation_Unit']:3s} | Multiplier: {mult_10g:4.2f}x | Norm 10g: INR {r['Norm_10g']:>9.2f} | Norm 1g: INR {r['Norm_1g']:>8.2f}")
