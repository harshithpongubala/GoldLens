"""
GoldLens — Commodity Derivatives Intelligence Platform
FastAPI Backend Server
"""

import sys
import os
from typing import Optional, List

# Ensure backend directory is in sys.path regardless of execution CWD
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from fastapi import FastAPI, Query, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from normalization import CONTRACT_SPECS
from analytics import CommodityAnalyticsEngine
from backtest import run_historical_backtest

# Initialize paths
DATA_FILE = os.path.abspath(os.path.join(BACKEND_DIR, "..", "data", "mcx_gold_bhavcopy.csv"))
if not os.path.exists(DATA_FILE):
    from generate_mcx_data import generate_mcx_bhavcopy
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    generate_mcx_bhavcopy(DATA_FILE)

analytics_engine = CommodityAnalyticsEngine(DATA_FILE)

app = FastAPI(
    title="GoldLens — Commodity Derivatives Intelligence API",
    description="Analytical engine for MCX Gold Futures relative-price anomaly detection and spread normalization",
    version="1.0.0"
)

# Enable CORS for Vite frontend (typically localhost:5173 or 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/info")
def read_root():
    return {
        "platform": "GoldLens — Commodity Derivatives Intelligence Platform",
        "version": "1.0.0",
        "documentation": "/docs",
        "status": "operational"
    }

@app.get("/api/status")
def get_status():
    """Returns dataset freshness, active contracts, and integrity status."""
    try:
        return analytics_engine.get_data_status()
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Data engine error: {str(e)}")

@app.get("/api/contracts")
def get_contracts():
    """
    Returns full contract specifications, quotation bases, trading lots,
    purity ratings, and defensible normalization multipliers.
    """
    return {
        "contracts": list(CONTRACT_SPECS.values()),
        "base_standard": "10 Grams (₹/10g) at 995 fineness",
        "methodology_summary": (
            "Because MCX quotes GOLDGUINEA per 8g and GOLDPETAL per 1g while GOLDM and GOLDTEN "
            "quote per 10g, raw prices are fundamentally incomparable without multiplying "
            "by the appropriate conversion factor (1.25x for Guinea, 10.0x for Petal)."
        )
    }

@app.get("/api/prices")
def get_prices(
    symbol: Optional[str] = Query(None, description="Contract symbol: GOLDM, GOLDTEN, GOLDGUINEA, GOLDPETAL"),
    start_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="YYYY-MM-DD")
):
    """
    Returns historical price records including raw close, normalized 10g close,
    normalized 1g close, purity-adjusted close, volume, and open interest.
    """
    prices = analytics_engine.get_prices(symbol=symbol, start_date=start_date, end_date=end_date)
    return {
        "count": len(prices),
        "data": prices
    }

@app.get("/api/comparison")
def get_comparison(
    benchmark_symbol: str = Query("GOLDM", description="Benchmark contract (default: GOLDM)"),
    target_symbol: str = Query("GOLDPETAL", description="Target contract to compare"),
    lookback_window: int = Query(20, ge=5, le=60, description="Rolling window in trading days for Z-score")
):
    """
    Calculates normalized cross-contract spread, relative % difference,
    rolling mean, rolling standard deviation, Z-score, and Bollinger Bands.
    """
    if benchmark_symbol.upper() not in CONTRACT_SPECS:
        raise HTTPException(status_code=400, detail=f"Invalid benchmark symbol: {benchmark_symbol}")
    if target_symbol.upper() not in CONTRACT_SPECS:
        raise HTTPException(status_code=400, detail=f"Invalid target symbol: {target_symbol}")

    res = analytics_engine.get_comparison(
        benchmark_symbol=benchmark_symbol,
        target_symbol=target_symbol,
        lookback_window=lookback_window
    )
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return res

@app.get("/api/comparison/matrix")
def get_comparison_matrix(
    benchmark_symbol: str = Query("GOLDM", description="Benchmark symbol")
):
    """
    Returns latest cross-contract summary table for all 4 contracts vs benchmark.
    """
    if benchmark_symbol.upper() not in CONTRACT_SPECS:
        raise HTTPException(status_code=400, detail=f"Invalid benchmark symbol: {benchmark_symbol}")
    return {
        "benchmark_symbol": benchmark_symbol.upper(),
        "matrix": analytics_engine.get_cross_comparison_matrix(benchmark_symbol=benchmark_symbol)
    }

@app.get("/api/signals")
def get_signals(
    benchmark_symbol: str = Query("GOLDM", description="Benchmark symbol"),
    z_threshold: float = Query(1.5, ge=1.0, le=3.5, description="Z-score threshold for deviation alert"),
    lookback_window: int = Query(20, ge=5, le=60, description="Lookback window for statistical calculation")
):
    """
    Returns detected statistical anomalies and deviations across all gold contracts,
    complete with severity levels, percentiles, and explainable drivers.
    """
    signals = analytics_engine.get_active_signals(
        benchmark_symbol=benchmark_symbol,
        z_threshold=z_threshold,
        lookback_window=lookback_window
    )
    return {
        "benchmark_symbol": benchmark_symbol.upper(),
        "threshold": z_threshold,
        "count": len(signals),
        "signals": signals
    }

@app.get("/api/backtest")
def get_backtest(
    benchmark_symbol: str = Query("GOLDM", description="Benchmark symbol"),
    target_symbol: str = Query("GOLDPETAL", description="Target contract symbol"),
    lookback_window: int = Query(20, ge=5, le=60),
    entry_z_score: float = Query(2.0, ge=1.0, le=4.0),
    exit_z_score: float = Query(0.5, ge=0.0, le=1.5),
    max_holding_days: int = Query(10, ge=2, le=30),
    cost_per_leg_bps: float = Query(5.0, ge=0.0, le=50.0, description="Brokerage and statutory charges in bps per leg"),
    slippage_bps_per_leg: float = Query(2.0, ge=0.0, le=50.0, description="Bid-ask execution slippage in bps per leg")
):
    """
    Runs historical evaluation of statistical spread mean-reversion without look-ahead bias,
    incorporating realistic next-bar Open fills, Indian commodity transaction charges, and slippage.
    """
    res = run_historical_backtest(
        analytics_engine=analytics_engine,
        benchmark_symbol=benchmark_symbol,
        target_symbol=target_symbol,
        lookback_window=lookback_window,
        entry_z_score=entry_z_score,
        exit_z_score=exit_z_score,
        max_holding_days=max_holding_days,
        cost_per_leg_bps=cost_per_leg_bps,
        slippage_bps_per_leg=slippage_bps_per_leg
    )
    if "error" in res and res.get("status") != "INSUFFICIENT_DATA":
        raise HTTPException(status_code=400, detail=res["error"])
    return res

from ingestion import parse_genuine_mcx_csv

class ImportPayload(BaseModel):
    filename: str
    csv_content: str

class SwitchDatasetPayload(BaseModel):
    mode: str # "demo" or "genuine"
    filename: Optional[str] = None

@app.get("/api/datasets")
def list_datasets():
    """Lists available datasets (demo baseline vs imported authentic MCX archives)."""
    genuine_dir = os.path.join(os.path.dirname(DATA_FILE), "genuine")
    genuine_files = []
    if os.path.exists(genuine_dir):
        genuine_files = [f for f in os.listdir(genuine_dir) if f.endswith(".csv")]
    return {
        "active_is_demo": analytics_engine.is_demo,
        "active_source": analytics_engine.data_source_label,
        "active_quality_status": getattr(analytics_engine, "data_quality_status", "VALIDATED"),
        "demo_dataset": {
            "name": "mcx_gold_bhavcopy.csv",
            "type": "DEMO_DATA_SYNTHETIC",
            "records": 560,
            "description": "Baseline demonstration dataset with controlled relative dislocations."
        },
        "genuine_datasets": genuine_files
    }

@app.post("/api/dataset/switch")
def switch_dataset(payload: SwitchDatasetPayload):
    """
    Safely switch active dataset between DEMO DATA and GENUINE MCX DATA.
    Ensures synthetic and authentic records are never mixed.
    """
    global analytics_engine
    if payload.mode.lower() == "demo":
        analytics_engine = CommodityAnalyticsEngine(
            DATA_FILE,
            is_demo=True,
            data_source_label="DEMO DATA — Synthetic MCX Simulation (Non-Exchange Data)"
        )
        return {
            "status": "SUCCESS",
            "message": "Switched to DEMO DATA mode (Synthetic MCX Simulation).",
            "is_demo_data": True,
            "data_source": analytics_engine.data_source_label,
            "records": len(analytics_engine.df)
        }
    elif payload.mode.lower() == "genuine":
        genuine_dir = os.path.join(os.path.dirname(DATA_FILE), "genuine")
        if not os.path.exists(genuine_dir):
            raise HTTPException(status_code=404, detail="No authentic MCX datasets have been imported yet.")
        files = [f for f in os.listdir(genuine_dir) if f.endswith(".csv")]
        if not files:
            raise HTTPException(status_code=404, detail="No authentic MCX datasets found. Please import one first.")
            
        filename = payload.filename if payload.filename else sorted(files)[-1]
        target_path = os.path.join(genuine_dir, filename)
        if not os.path.exists(target_path):
            raise HTTPException(status_code=404, detail=f"Dataset '{filename}' not found.")
            
        with open(target_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        clean_df, scorecard = parse_genuine_mcx_csv(content, filename=filename)
        analytics_engine = CommodityAnalyticsEngine(
            dataframe=clean_df,
            is_demo=False,
            data_source_label=f"Authentic MCX Archive: {filename}",
            quality_scorecard=scorecard
        )
        return {
            "status": "SUCCESS",
            "message": f"Switched to Authentic MCX dataset: {filename}.",
            "is_demo_data": False,
            "data_source": analytics_engine.data_source_label,
            "records": len(analytics_engine.df),
            "scorecard": scorecard
        }
    else:
        raise HTTPException(status_code=400, detail="Invalid mode. Supported options: 'demo', 'genuine'.")

@app.post("/api/import")
def import_bhavcopy(payload: ImportPayload):
    """
    Upload genuine MCX Bhavcopy CSV content with schema validation,
    contract filtering, duplicate removal, and quality scoring.
    """
    if not payload.csv_content.strip():
        raise HTTPException(status_code=400, detail="CSV content cannot be empty.")
        
    try:
        # Validate, filter, and normalize incoming genuine MCX CSV
        clean_df, scorecard = parse_genuine_mcx_csv(
            csv_input=payload.csv_content,
            filename=payload.filename
        )
        
        # Save to genuine repository separately from demo dataset
        genuine_dir = os.path.join(os.path.dirname(DATA_FILE), "genuine")
        os.makedirs(genuine_dir, exist_ok=True)
        save_path = os.path.join(genuine_dir, payload.filename)
        clean_df.to_csv(save_path, index=False)

        # Re-initialize engine with validated genuine dataframe
        global analytics_engine
        analytics_engine = CommodityAnalyticsEngine(
            dataframe=clean_df,
            is_demo=False,
            data_source_label=f"Authentic MCX Archive: {payload.filename}",
            quality_scorecard=scorecard
        )
        return {
            "status": "SUCCESS",
            "message": f"Successfully ingested genuine MCX Bhavcopy: {payload.filename}",
            "records": len(clean_df),
            "scorecard": scorecard
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error processing bhavcopy: {str(e)}")

# Mount static frontend production build
from fastapi.staticfiles import StaticFiles
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="static")
