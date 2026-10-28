from fastapi.testclient import TestClient
from main import app
import json

def test_all():
    client = TestClient(app)
    
    print("--- 1. Testing GET /api/status ---")
    r = client.get("/api/status")
    assert r.status_code == 200, f"Status failed: {r.status_code}"
    status_data = r.json()
    print("Status:", status_data)
    assert status_data["contracts_tracked"] == 4
    assert "GOLDM" in status_data["symbols"]
    assert "GOLDPETAL" in status_data["symbols"]

    print("\n--- 2. Testing GET /api/contracts ---")
    r = client.get("/api/contracts")
    assert r.status_code == 200, f"Contracts failed: {r.status_code}"
    contracts_data = r.json()
    assert len(contracts_data["contracts"]) >= 4
    symbols = [c["symbol"] for c in contracts_data["contracts"]]
    print("Contracts returned:", symbols)
    # Check Guinea multiplier is 1.25
    guinea = next(c for c in contracts_data["contracts"] if c["symbol"] == "GOLDGUINEA")
    assert guinea["multiplier_to_10g"] == 1.25
    # Check Petal multiplier is 10.0
    petal = next(c for c in contracts_data["contracts"] if c["symbol"] == "GOLDPETAL")
    assert petal["multiplier_to_10g"] == 10.0

    print("\n--- 3. Testing GET /api/prices ---")
    r = client.get("/api/prices?symbol=GOLDM")
    assert r.status_code == 200, f"Prices failed: {r.status_code}"
    prices_data = r.json()
    print(f"Price records returned for GOLDM: {prices_data['count']}")
    assert prices_data["count"] > 100
    first_record = prices_data["data"][0]
    assert "normalized_10g_close" in first_record
    assert "raw_close" in first_record

    print("\n--- 4. Testing GET /api/comparison ---")
    r = client.get("/api/comparison?benchmark_symbol=GOLDM&target_symbol=GOLDPETAL&lookback_window=20")
    assert r.status_code == 200, f"Comparison failed: {r.status_code}"
    comp_data = r.json()
    print(f"Comparison: Current Spread = INR {comp_data['current_spread_10g']}/10g, Z-score = {comp_data['current_z_score']}")
    assert "history" in comp_data
    assert len(comp_data["history"]) > 100
    assert "signal_explanation" in comp_data["history"][-1]

    print("\n--- 4b. Testing GET /api/comparison/matrix ---")
    r = client.get("/api/comparison/matrix?benchmark_symbol=GOLDM")
    assert r.status_code == 200, f"Matrix failed: {r.status_code}"
    matrix = r.json()["matrix"]
    print(f"Matrix rows: {len(matrix)}")
    assert len(matrix) >= 4

    print("\n--- 5. Testing GET /api/signals ---")
    r = client.get("/api/signals?benchmark_symbol=GOLDM&z_threshold=1.5&lookback_window=20")
    assert r.status_code == 200, f"Signals failed: {r.status_code}"
    sig_data = r.json()
    print(f"Active Signals detected (|Z| >= 1.5): {sig_data['count']}")
    if sig_data["count"] > 0:
        top_sig = sig_data["signals"][0]
        print(f"Top signal: {top_sig['target_symbol']} on {top_sig['date']}, Z={top_sig['z_score']}, drivers: {len(top_sig['potential_drivers'])}")
        assert "explanation" in top_sig
        assert "percentile" in top_sig

    print("\n--- 6. Testing GET /api/backtest ---")
    r = client.get("/api/backtest?benchmark_symbol=GOLDM&target_symbol=GOLDPETAL&lookback_window=20&entry_z_score=2.0&exit_z_score=0.5&cost_per_leg_bps=5.0")
    assert r.status_code == 200, f"Backtest failed: {r.status_code}"
    bt_data = r.json()
    print(f"Backtest: Total Trades = {bt_data['total_trades']}, Win Rate = {bt_data['win_rate_pct']}%, Net Total Return = {bt_data['net_total_return_pct']}%")
    assert "trades" in bt_data
    assert "disclaimer" in bt_data
    assert "sharpe_ratio" in bt_data

    print("\n=======================================================")
    print("ALL 5 REQUIRED BACKEND API ENDPOINTS VERIFIED & WORKING!")
    print("=======================================================")

if __name__ == "__main__":
    test_all()
