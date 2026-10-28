"""
Comprehensive Test Suite for GoldLens Data Ingestion, Validation & Switching
Tests:
1. Valid genuine MCX Bhavcopy ingestion and gold futures filtering
2. Corrupt / empty / non-CSV files rejection
3. Missing mandatory headers schema validation
4. Missing / corrupted date parsing handling
5. Duplicate row detection and deduplication
6. Non-gold contracts rejection
7. Unknown contract specifications validation
8. Dataset source switching (Demo <-> Genuine) with zero silent data mixing
9. Backtest data provenance and mode reporting
"""

import pytest
import io
import pandas as pd
from fastapi.testclient import TestClient
from main import app
from ingestion import parse_genuine_mcx_csv
from normalization import CONTRACT_SPECS, validate_contract_symbol, get_contract_spec

client = TestClient(app)

# Sample authentic-style multi-commodity MCX Bhavcopy content
VALID_MCX_BHAVCOPY_CSV = """Date,INSTRUMENT,SYMBOL,EXPIRY_DATE,OPTION_TYPE,STRIKE_PRICE,OPEN,HIGH,LOW,CLOSE,PREV_CLOSE,VOLUME,VALUE,OPEN_INTEREST
05-OCT-2024,FUTCOM,GOLDM,05-OCT-2024,XX,0,74200.00,74550.00,74100.00,74480.00,74150.00,12500,93100.00,18200
05-OCT-2024,FUTCOM,GOLDTEN,05-OCT-2024,XX,0,74250.00,74600.00,74120.00,74510.00,74180.00,4500,33529.50,6500
05-OCT-2024,FUTCOM,GOLDGUINEA,31-OCT-2024,XX,0,59400.00,59700.00,59300.00,59620.00,59350.00,2100,10016.16,3200
05-OCT-2024,FUTCOM,GOLDPETAL,31-OCT-2024,XX,0,7510.00,7560.00,7490.00,7545.00,7500.00,34000,2565.30,48000
05-OCT-2024,FUTCOM,CRUDEOIL,19-OCT-2024,XX,0,6200.00,6280.00,6150.00,6240.00,6180.00,50000,312000.00,22000
05-OCT-2024,OPTFUT,GOLD,28-OCT-2024,CE,75000,450.00,520.00,410.00,480.00,420.00,800,38.40,1200
"""

def test_1_valid_genuine_mcx_ingestion():
    """Verify ingestion of authentic MCX CSV with header mapping, option filtering, and normalization."""
    df, scorecard = parse_genuine_mcx_csv(VALID_MCX_BHAVCOPY_CSV, filename="test_valid_mcx.csv")
    
    assert scorecard["status"] == "VALID"
    assert scorecard["quality_score"] >= 90.0
    assert scorecard["gold_records_extracted"] == 4 # Only GOLDM, GOLDTEN, GOLDGUINEA, GOLDPETAL (excludes CRUDEOIL and CE option)
    assert "CRUDEOIL" not in df["Symbol"].values
    assert (df["Instrument"] == "FUTCOM").all()
    assert (df["Data_Type"] == "GENUINE_MCX_HISTORICAL").all()
    
    # Also test date inference from filename when Date column is omitted
    csv_no_date_col = """INSTRUMENT,SYMBOL,EXPIRY_DATE,CLOSE,VOLUME\nFUTCOM,GOLDM,05-OCT-2024,74480,12500\n"""
    df_inferred, sc_inferred = parse_genuine_mcx_csv(csv_no_date_col, filename="BhavCopy_05OCT2024.csv")
    assert df_inferred.iloc[0]["Date"] == "05-OCT-2024"
    assert any("inferred trade date" in w for w in sc_inferred["warnings"])
    
    # Check normalization multipliers
    guinea = df[df["Symbol"] == "GOLDGUINEA"].iloc[0]
    assert guinea["Norm_10g"] == round(guinea["Close"] * 1.25, 2)
    petal = df[df["Symbol"] == "GOLDPETAL"].iloc[0]
    assert petal["Norm_10g"] == round(petal["Close"] * 10.0, 2)

def test_2_empty_or_corrupt_file_rejection():
    """Verify empty or unparseable files are rejected with informative error."""
    with pytest.raises(ValueError, match="Uploaded file is empty"):
        parse_genuine_mcx_csv("", filename="empty.csv")
        
    with pytest.raises(ValueError, match="CSV Parsing Error"):
        parse_genuine_mcx_csv("this is totally corrupt\n\x00\x01\x02\n,,,\n", filename="corrupt.csv")

def test_3_missing_mandatory_headers():
    """Verify schema validation catches missing required fields."""
    invalid_csv = """INSTRUMENT,SYMBOL,EXPIRY_DATE\nFUTCOM,GOLDM,05-OCT-2024\n"""
    with pytest.raises(ValueError, match="Schema Validation Failed"):
        parse_genuine_mcx_csv(invalid_csv, filename="missing_cols.csv")

def test_4_missing_or_corrupt_dates():
    """Verify unparseable dates are detected and dropped/flagged."""
    csv_bad_dates = """Date,Symbol,Close,Volume\nINVALID_DATE,GOLDM,74000,100\n15-OCT-2024,GOLDM,74200,200\n"""
    df, scorecard = parse_genuine_mcx_csv(csv_bad_dates, filename="bad_dates.csv")
    assert len(df) == 1
    assert df.iloc[0]["Date"] == "15-OCT-2024"
    assert any("Dropped 1 rows with invalid/unparseable dates" in w for w in scorecard["warnings"])

def test_5_duplicate_row_detection_and_deduplication():
    """Verify duplicate contract records on same date and expiry are detected and deduplicated."""
    dup_csv = """Date,Symbol,Expiry,Close,Volume\n15-OCT-2024,GOLDM,05-DEC-2024,74000,1000\n15-OCT-2024,GOLDM,05-DEC-2024,74000,1000\n15-OCT-2024,GOLDM,05-DEC-2024,74050,1500\n"""
    df, scorecard = parse_genuine_mcx_csv(dup_csv, filename="duplicates.csv")
    assert scorecard["duplicates_removed"] == 2
    assert len(df) == 1

def test_6_non_gold_contracts_rejection():
    """Verify file with only non-gold commodities is rejected."""
    non_gold_csv = """Date,Symbol,Close,Volume\n15-OCT-2024,CRUDEOIL,6200,500\n15-OCT-2024,NATURALGAS,240,1200\n"""
    with pytest.raises(ValueError, match="Contract Validation Failed"):
        parse_genuine_mcx_csv(non_gold_csv, filename="no_gold.csv")

def test_7_contract_specification_validation():
    """Verify contract specification and symbol validation functions."""
    assert validate_contract_symbol("GOLDM") is True
    assert validate_contract_symbol("GOLDPETAL") is True
    assert validate_contract_symbol("GOLDGUINEA") is True
    assert validate_contract_symbol("UNKNOWN_CONTRACT") is False
    
    spec = get_contract_spec("GOLDPETAL")
    assert spec["purity"] == 999
    assert spec["multiplier_to_10g"] == 10.0
    
    with pytest.raises(ValueError, match="Unsupported contract symbol"):
        get_contract_spec("INVALID_COMMODITY")

def test_8_api_import_and_source_switching():
    """
    Verify complete API import workflow, dataset switching,
    and guarantee that synthetic and genuine data are never mixed silently.
    """
    # 1. Reset to DEMO mode
    r_switch_demo = client.post("/api/dataset/switch", json={"mode": "demo"})
    assert r_switch_demo.status_code == 200
    assert r_switch_demo.json()["is_demo_data"] is True
    
    # Verify status reports DEMO DATA
    r_status = client.get("/api/status")
    assert r_status.status_code == 200
    assert r_status.json()["is_demo_data"] is True
    assert "DEMO DATA" in r_status.json()["data_source"]
    
    # 2. Upload Genuine MCX CSV via /api/import
    r_import = client.post("/api/import", json={
        "filename": "mcx_oct_2024_sample.csv",
        "csv_content": VALID_MCX_BHAVCOPY_CSV
    })
    assert r_import.status_code == 200
    res = r_import.json()
    assert res["status"] == "SUCCESS"
    assert res["records"] == 4
    assert res["scorecard"]["quality_status"] in ["EXCELLENT", "GOOD"]
    
    # Verify status now reports AUTHENTIC MCX
    r_status_genuine = client.get("/api/status")
    status_data = r_status_genuine.json()
    assert status_data["is_demo_data"] is False
    assert "Authentic MCX Archive" in status_data["data_source"]
    assert status_data["total_records"] == 4
    
    # 3. Check /api/datasets list
    r_datasets = client.get("/api/datasets")
    assert r_datasets.status_code == 200
    ds_data = r_datasets.json()
    assert ds_data["active_is_demo"] is False
    assert "mcx_oct_2024_sample.csv" in ds_data["genuine_datasets"]
    
    # 4. Switch back to DEMO mode safely
    r_switch_back = client.post("/api/dataset/switch", json={"mode": "demo"})
    assert r_switch_back.status_code == 200
    assert r_switch_back.json()["is_demo_data"] is True
    
    # Verify status is back to baseline demo without any imported records mixed in
    r_status_reset = client.get("/api/status")
    assert r_status_reset.json()["is_demo_data"] is True
    assert r_status_reset.json()["total_records"] == 560 # Clean baseline 560 demo rows

def test_9_backtest_source_labeling():
    """Verify backtest results explicitly declare dataset source and demo vs genuine provenance."""
    # Run backtest in demo mode
    client.post("/api/dataset/switch", json={"mode": "demo"})
    r_bt = client.get("/api/backtest?benchmark_symbol=GOLDM&target_symbol=GOLDPETAL")
    assert r_bt.status_code == 200
    bt = r_bt.json()
    assert bt["is_demo_data"] is True
    assert "DEMO DATA" in bt["data_provenance"]
    assert "Synthetic simulation" in bt["data_provenance"]

def test_10_single_day_genuine_data_behavior():
    """
    Verify behavior when genuine MCX dataset contains only one trading date:
    - Reports exact valid gold records (30) and 1 unique trading date
    - Returns observation_mode = SINGLE_DAY_SNAPSHOT and historical_readiness = False
    - Returns null Z-score and null rolling bands
    - Status is SNAPSHOT_ONLY
    """
    # Switch to genuine dataset
    r_switch = client.post("/api/dataset/switch", json={"mode": "genuine", "filename": "BhavCopyDateWise_27102026.csv"})
    assert r_switch.status_code == 200
    assert r_switch.json()["is_demo_data"] is False

    # Check status endpoint
    r_status = client.get("/api/status")
    assert r_status.status_code == 200
    status = r_status.json()
    assert status["is_demo_data"] is False
    assert status["total_records"] == 30
    assert status["unique_dates_count"] == 1
    assert status["observation_mode"] == "SINGLE_DAY_SNAPSHOT"
    assert status["historical_readiness"] is False
    assert set(status["symbols"]) == {"GOLD", "GOLDGUINEA", "GOLDM", "GOLDPETAL", "GOLDTEN"}

    # Check comparison endpoint for single-day data
    r_comp = client.get("/api/comparison?benchmark_symbol=GOLDM&target_symbol=GOLDPETAL")
    assert r_comp.status_code == 200
    comp = r_comp.json()
    assert comp["is_snapshot_only"] is True
    assert comp["observation_mode"] == "SINGLE_DAY_SNAPSHOT"
    assert comp["current_z_score"] is None
    assert comp["current_status"] == "SNAPSHOT_ONLY"
    assert "Single-day genuine snapshot" in comp["current_explanation"]
    
    # Verify history items
    assert len(comp["history"]) == 1
    item = comp["history"][0]
    assert item["z_score"] is None
    assert item["rolling_mean_spread"] is None
    assert item["rolling_std_spread"] is None
    assert item["upper_band"] is None
    assert item["lower_band"] is None
    assert item["status"] == "SNAPSHOT_ONLY"
    # Highest volume GOLDPETAL contract (30NOV2026, vol=233221) Norm 10g is 144850.0
    # Highest volume GOLDM contract (05NOV2026, vol=34370) Norm 10g is 142509.0
    # Spread = 144850.0 - 142509.0 = 2341.0
    assert item["spread_inr_10g"] == 2341.0

def test_11_insufficient_observations_zscore_and_backtest():
    """
    Verify that with N=1 or N < 5 observations:
    - Never calculates a fabricated historical Z-score
    - Active signals returns empty list (0 false signals)
    - Backtest returns status INSUFFICIENT_DATA with 0 trades
    """
    # In genuine single-day mode
    client.post("/api/dataset/switch", json={"mode": "genuine", "filename": "BhavCopyDateWise_27102026.csv"})

    # Signals
    r_sig = client.get("/api/signals?benchmark_symbol=GOLDM&z_threshold=1.5")
    assert r_sig.status_code == 200
    sig_data = r_sig.json()
    assert sig_data["count"] == 0
    assert sig_data["signals"] == []

    # Backtest
    r_bt = client.get("/api/backtest?benchmark_symbol=GOLDM&target_symbol=GOLDPETAL")
    assert r_bt.status_code == 200
    bt = r_bt.json()
    assert bt["status"] == "INSUFFICIENT_DATA"
    assert bt["total_trades"] == 0
    assert bt["win_rate_pct"] == 0.0
    assert "Insufficient historical trading sessions" in bt["disclaimer"]

def test_12_normalization_and_unit_conversion_math():
    """
    Verify price normalization logic against raw settlement prices and official MCX quotation rules.
    """
    from normalization import normalize_price

    # GOLDM: raw = 75000 / 10g -> norm_10g = 75000, norm_1g = 7500
    assert normalize_price("GOLDM", 75000.0, "10g") == 75000.0
    assert normalize_price("GOLDM", 75000.0, "1g") == 7500.0

    # GOLDGUINEA: raw = 60000 / 8g -> norm_10g = 60000 * 1.25 = 75000, norm_1g = 7500
    assert normalize_price("GOLDGUINEA", 60000.0, "10g") == 75000.0
    assert normalize_price("GOLDGUINEA", 60000.0, "1g") == 7500.0

    # GOLDPETAL: raw = 7500 / 1g -> norm_10g = 7500 * 10 = 75000, norm_1g = 7500
    assert normalize_price("GOLDPETAL", 7500.0, "10g") == 75000.0
    assert normalize_price("GOLDPETAL", 7500.0, "1g") == 7500.0

    # GOLDTEN: raw = 75000 / 10g -> norm_10g = 75000
    assert normalize_price("GOLDTEN", 75000.0, "10g") == 75000.0

    # GOLD (1kg): raw = 75000 / 10g -> norm_10g = 75000
    assert normalize_price("GOLD", 75000.0, "10g") == 75000.0

    # Invalid symbol or invalid target base
    with pytest.raises(ValueError):
        normalize_price("INVALID_SYM", 1000.0)
    with pytest.raises(ValueError):
        normalize_price("GOLDM", 75000.0, target_base="50g")

def test_13_missing_contracts_graceful_handling():
    """Verify that comparisons against missing contracts return clean error response instead of crashing."""
    r_err = client.get("/api/comparison?benchmark_symbol=GOLDM&target_symbol=NONEXISTENT")
    assert r_err.status_code == 400
    assert "Invalid target symbol" in r_err.json()["detail"]

def test_14_dataset_switching_integrity_no_data_leakage():
    """Verify clean switching between genuine and demo datasets with zero record leakage."""
    # 1. Switch to demo
    r_demo = client.post("/api/dataset/switch", json={"mode": "demo"})
    assert r_demo.status_code == 200
    status_demo = client.get("/api/status").json()
    assert status_demo["is_demo_data"] is True
    assert status_demo["total_records"] == 560

    # 2. Switch to genuine
    r_gen = client.post("/api/dataset/switch", json={"mode": "genuine", "filename": "BhavCopyDateWise_27102026.csv"})
    assert r_gen.status_code == 200
    status_gen = client.get("/api/status").json()
    assert status_gen["is_demo_data"] is False
    assert status_gen["total_records"] == 30

    # 3. Switch back to demo
    r_demo2 = client.post("/api/dataset/switch", json={"mode": "demo"})
    assert r_demo2.status_code == 200
    status_demo2 = client.get("/api/status").json()
    assert status_demo2["is_demo_data"] is True
    assert status_demo2["total_records"] == 560

if __name__ == "__main__":
    pytest.main(["-v", __file__])

