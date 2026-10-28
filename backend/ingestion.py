"""
GoldLens - MCX Daily Bhavcopy Ingestion & Integrity Engine
Handles genuine MCX file ingestion, schema validation, multi-format date parsing,
contract symbol filtering, duplicate detection, and data-quality auditing.
"""

import io
import os
import re
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, Any, Tuple, List, Optional
from normalization import CONTRACT_SPECS, normalize_price, validate_contract_symbol

# Canonical column names required for GoldLens platform
CANONICAL_COLUMNS = [
    "Date", "Instrument", "Symbol", "Contract_Name", "Expiry",
    "Quotation_Unit", "Lot_Size_Grams", "Purity",
    "Open", "High", "Low", "Close", "Volume", "OpenInterest", "Value_Lakhs"
]

def extract_date_from_filename(filename: str) -> Optional[str]:
    """Attempts to extract trade date from file names like mcx_2024-10-05.csv or BhavCopy_05OCT2024.csv."""
    # Pattern 1: YYYY-MM-DD or YYYY_MM_DD
    m1 = re.search(r"(\d{4})[-_](\d{2})[-_](\d{2})", filename)
    if m1:
        return f"{m1.group(1)}-{m1.group(2)}-{m1.group(3)}"
    # Pattern 2: DD-MMM-YYYY or DD_MMM_YYYY (e.g. 05-OCT-2024)
    m2 = re.search(r"(\d{2})[-_]?([A-Za-z]{3})[-_]?(\d{4})", filename)
    if m2:
        return f"{m2.group(1)}-{m2.group(2).upper()}-{m2.group(3)}"
    # Pattern 3: YYYYMMDD (e.g. 20241005)
    m3 = re.search(r"(20\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])", filename)
    if m3:
        return f"{m3.group(1)}-{m3.group(2)}-{m3.group(3)}"
    return None

# Aliases for mapping raw MCX / broker headers to canonical columns
COLUMN_ALIASES = {
    "date": ["date", "timestamp", "trade_date", "tradedate", "trans_date"],
    "instrument": ["instrument", "inst_type", "instrument_name", "series"],
    "symbol": ["symbol", "commodity", "contract", "ticker", "scrip"],
    "expiry": ["expiry", "expiry_date", "exp_date", "expirydate", "maturity_date"],
    "option_type": ["option_type", "opt_type", "optiontype", "option"],
    "strike_price": ["strike_price", "strike", "strikeprice"],
    "open": ["open", "open_price", "openprice"],
    "high": ["high", "high_price", "highprice"],
    "low": ["low", "low_price", "lowprice"],
    "close": ["close", "close_price", "closeprice", "sett_price", "settlement_price", "settle_price", "ltp"],
    "volume": ["volume", "traded_qty", "qty", "no_of_contracts", "contracts_traded", "total_volume"],
    "open_interest": ["openinterest", "open_interest", "oi", "open_int"],
    "value_lakhs": ["value_lakhs", "value", "turnover", "traded_value", "turnover_lakhs"]
}

def map_headers(raw_cols: List[str]) -> Dict[str, str]:
    """Maps arbitrary incoming CSV headers to canonical field names."""
    mapping = {}
    clean_cols = [c.strip().lower().replace(" ", "_") for c in raw_cols]
    
    for canonical, aliases in COLUMN_ALIASES.items():
        matched = False
        for i, col in enumerate(clean_cols):
            if col in aliases:
                mapping[raw_cols[i]] = canonical
                matched = True
                break
        if not matched:
            # Substring match fallback
            for i, col in enumerate(clean_cols):
                for alias in aliases:
                    if alias in col:
                        mapping[raw_cols[i]] = canonical
                        matched = True
                        break
                if matched:
                    break
    return mapping

def parse_genuine_mcx_csv(
    csv_input: str,
    filename: str = "mcx_bhavcopy.csv"
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Ingests and validates raw MCX Bhavcopy CSV content.
    Returns:
        Tuple of (clean_normalized_dataframe, data_quality_scorecard)
    Raises:
        ValueError if the file is invalid, missing required schema, or has no gold contracts.
    """
    if not csv_input or not csv_input.strip():
        raise ValueError("Uploaded file is empty. Please provide a valid MCX Bhavcopy CSV.")

    try:
        df_raw = pd.read_csv(io.StringIO(csv_input))
    except Exception as e:
        raise ValueError(f"CSV Parsing Error: Could not parse CSV structure: {str(e)}")

    if df_raw.empty:
        raise ValueError("Uploaded CSV contains no records.")

    total_input_rows = len(df_raw)
    warnings: List[str] = []

    # 1. Header mapping
    header_map = map_headers(list(df_raw.columns))
    df_renamed = df_raw.rename(columns=header_map)

    # Check for date in columns; if missing, attempt inference from filename
    if "date" not in df_renamed.columns:
        inferred_date = extract_date_from_filename(filename)
        if inferred_date:
            df_renamed["date"] = inferred_date
            warnings.append(f"Date column not present in CSV; inferred trade date '{inferred_date}' from filename '{filename}'.")
        else:
            raise ValueError(
                f"Schema Validation Failed: Missing mandatory column 'date' and could not extract date from filename '{filename}'. "
                f"Detected columns: {list(df_raw.columns)}"
            )

    # Check for remaining indispensable fields: symbol, close
    required_fields = ["symbol", "close"]
    missing_required = [f for f in required_fields if f not in df_renamed.columns]
    if missing_required:
        raise ValueError(
            f"Schema Validation Failed: Missing mandatory columns: {missing_required}. "
            f"Detected columns: {list(df_raw.columns)}"
        )

    # 2. Filter for Futures contracts (exclude options like CE, PE, OPTFUT, OPTCOM)
    if "option_type" in df_renamed.columns:
        options_mask = df_renamed["option_type"].astype(str).str.upper().isin(["CE", "PE"])
        if options_mask.any():
            opts_count = int(options_mask.sum())
            df_renamed = df_renamed[~options_mask]
            warnings.append(f"Ignored {opts_count} Option contract rows (CE/PE).")

    if "instrument" in df_renamed.columns:
        opt_inst_mask = df_renamed["instrument"].astype(str).str.upper().str.startswith("OPT")
        if opt_inst_mask.any():
            opt_cnt = int(opt_inst_mask.sum())
            df_renamed = df_renamed[~opt_inst_mask]
            warnings.append(f"Ignored {opt_cnt} Option instrument rows (OPTFUT/OPTCOM).")

    # 3. Clean and filter Gold Contract Symbols
    df_renamed["symbol_clean"] = df_renamed["symbol"].astype(str).str.strip().str.upper()
    
    # Check what symbols are present
    all_symbols = df_renamed["symbol_clean"].unique().tolist()
    gold_mask = df_renamed["symbol_clean"].isin(CONTRACT_SPECS.keys())
    gold_df = df_renamed[gold_mask].copy()

    if gold_df.empty:
        raise ValueError(
            f"Contract Validation Failed: No recognized MCX Gold contracts found in file. "
            f"Recognized: {list(CONTRACT_SPECS.keys())}. Found in file: {all_symbols[:8]}"
        )

    non_gold_count = total_input_rows - len(gold_df)
    if non_gold_count > 0:
        warnings.append(f"Filtered out {non_gold_count} non-gold or unsupported contract rows.")

    # 4. Multi-format Date Parsing
    gold_df["ParsedDate"] = pd.to_datetime(gold_df["date"], format="mixed", errors="coerce")
    null_dates = gold_df["ParsedDate"].isna().sum()
    if null_dates > 0:
        warnings.append(f"Dropped {null_dates} rows with invalid/unparseable dates.")
        gold_df = gold_df.dropna(subset=["ParsedDate"])

    if gold_df.empty:
        raise ValueError("Date Parsing Failed: None of the records contained valid parseable dates.")

    # 5. Missing / Numeric Value Handling
    for col in ["close", "open", "high", "low", "volume", "open_interest", "value_lakhs"]:
        if col in gold_df.columns:
            gold_df[col] = pd.to_numeric(gold_df[col], errors="coerce")
        else:
            gold_df[col] = np.nan

    # Drop records where Close is null or <= 0
    invalid_close = (gold_df["close"].isna()) | (gold_df["close"] <= 0)
    if invalid_close.any():
        drop_cnt = int(invalid_close.sum())
        warnings.append(f"Dropped {drop_cnt} rows with missing or non-positive closing prices.")
        gold_df = gold_df[~invalid_close]

    # Impute Open, High, Low from Close if missing
    imputed_count = 0
    if gold_df["open"].isna().any():
        imputed_count += int(gold_df["open"].isna().sum())
        gold_df["open"] = gold_df["open"].fillna(gold_df["close"])
    if gold_df["high"].isna().any():
        imputed_count += int(gold_df["high"].isna().sum())
        gold_df["high"] = gold_df["high"].fillna(gold_df[["open", "close"]].max(axis=1))
    if gold_df["low"].isna().any():
        imputed_count += int(gold_df["low"].isna().sum())
        gold_df["low"] = gold_df["low"].fillna(gold_df[["open", "close"]].min(axis=1))

    gold_df["volume"] = gold_df["volume"].fillna(0).astype(int)
    gold_df["open_interest"] = gold_df["open_interest"].fillna(0).astype(int)
    
    if imputed_count > 0:
        warnings.append(f"Imputed {imputed_count} missing OHLC values from settlement price.")

    # 6. Duplicate Detection & Deduplication
    expiry_col = "expiry" if "expiry" in gold_df.columns else "symbol_clean"
    dups = gold_df.duplicated(subset=["ParsedDate", "symbol_clean", expiry_col], keep="first")
    dup_count = int(dups.sum())
    if dup_count > 0:
        warnings.append(f"Detected and dropped {dup_count} duplicate contract-date records.")
        gold_df = gold_df.drop_duplicates(subset=["ParsedDate", "symbol_clean", expiry_col], keep="first")

    # 7. Ground with Official Contract Specs and Normalization
    canonical_records = []
    for _, row in gold_df.iterrows():
        sym = row["symbol_clean"]
        spec = CONTRACT_SPECS[sym]
        date_str = row["ParsedDate"].strftime("%d-%b-%Y").upper()
        expiry_val = str(row["expiry"]) if "expiry" in row and pd.notna(row["expiry"]) else "NEAR_MONTH"
        
        raw_close = float(row["close"])
        raw_open = float(row["open"])
        raw_high = float(row["high"])
        raw_low = float(row["low"])
        vol = int(row["volume"])
        oi = int(row["open_interest"])
        
        # Calculate turnover in lakhs if not present
        if pd.notna(row.get("value_lakhs")) and row["value_lakhs"] > 0:
            val_lakhs = round(float(row["value_lakhs"]), 2)
        else:
            val_lakhs = round((raw_close * vol * spec["trading_lot_grams"]) / 100000.0, 2)
            
        canonical_records.append({
            "Date": date_str,
            "ParsedDate": row["ParsedDate"],
            "Data_Type": "GENUINE_MCX_HISTORICAL",
            "Instrument": "FUTCOM",
            "Symbol": sym,
            "Contract_Name": spec["name"],
            "Expiry": expiry_val,
            "Quotation_Unit": spec["quotation_unit"],
            "Lot_Size_Grams": spec["trading_lot_grams"],
            "Purity": spec["purity"],
            "Open": raw_open,
            "High": raw_high,
            "Low": raw_low,
            "Close": raw_close,
            "Volume": vol,
            "OpenInterest": oi,
            "Value_Lakhs": val_lakhs,
            "Norm_10g": normalize_price(sym, raw_close, target_base="10g", adjust_purity=False),
            "Norm_1g": normalize_price(sym, raw_close, target_base="1g", adjust_purity=False),
            "PurityAdj_10g": normalize_price(sym, raw_close, target_base="10g", adjust_purity=True)
        })

    final_df = pd.DataFrame(canonical_records)
    final_df = final_df.sort_values(by=["ParsedDate", "Symbol"]).reset_index(drop=True)

    # 8. Compute Data Quality Score (0 to 100)
    score = 100.0
    if dup_count > 0:
        score -= min(15.0, dup_count * 2.0)
    if imputed_count > 0:
        score -= min(10.0, imputed_count * 1.5)
    if null_dates > 0:
        score -= min(15.0, null_dates * 3.0)
    score = round(max(0.0, score), 1)

    unique_symbols = sorted(final_df["Symbol"].unique().tolist())
    min_date = final_df["ParsedDate"].min().strftime("%d-%b-%Y")
    max_date = final_df["ParsedDate"].max().strftime("%d-%b-%Y")

    quality_status = "EXCELLENT" if score >= 90 else ("GOOD" if score >= 75 else "ACCEPTABLE")

    scorecard: Dict[str, Any] = {
        "status": "VALID",
        "quality_score": score,
        "quality_status": quality_status,
        "filename": filename,
        "total_input_rows": total_input_rows,
        "gold_records_extracted": len(final_df),
        "contracts_detected": len(unique_symbols),
        "symbols": unique_symbols,
        "date_range": {
            "start": min_date,
            "end": max_date
        },
        "last_available_trading_date": max_date,
        "duplicates_removed": dup_count,
        "imputed_missing_values": imputed_count,
        "warnings": warnings
    }

    return final_df, scorecard
