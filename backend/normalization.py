"""
GoldLens - Contract Specifications & Defensible Price Normalization Logic

MCX Commodity Derivatives Gold contracts differ significantly in:
1. Quotation Base (unit of price quote)
2. Trading Unit (physical lot size per contract)
3. Delivery Purity (995 fineness vs 999 fineness)

Normalization Logic:
- Benchmark Standard: MCX Gold contracts are conventionally evaluated on a ₹/10 grams quotation base (995 purity).
- Multipliers to 10g Base:
  - GOLDM: Quoted per 10g -> Multiplier = 1.0
  - GOLDTEN: Quoted per 10g -> Multiplier = 1.0
  - GOLDGUINEA: Quoted per 8g (1 Guinea = 8g) -> Multiplier = 10 / 8 = 1.25
  - GOLDPETAL: Quoted per 1g (1 Petal = 1g) -> Multiplier = 10.0
- Purity Adjustment (Optional / Advanced):
  - 995 Purity: 99.50% gold content (GOLDM, GOLDTEN, GOLDGUINEA)
  - 999 Purity: 99.90% gold content (GOLDPETAL)
  - Purity Factor = 995 / 999 = 0.995996
  - Adjusted 10g Price for Petal = Raw Price * 10 * (995 / 999)
"""

from typing import Dict, Any

CONTRACT_SPECS: Dict[str, Dict[str, Any]] = {
    "GOLD": {
        "symbol": "GOLD",
        "name": "Gold 1kg Big",
        "quotation_unit": "10g",
        "quotation_desc": "Quoted in Rupees per 10 grams",
        "trading_lot_grams": 1000.0,
        "purity": 995,
        "tick_size": 1.0,
        "multiplier_to_10g": 1.0,
        "multiplier_to_1g": 0.1,
        "purity_adjusted_multiplier_to_10g": 1.0,
        "official_source": "MCX Circular MCX/C&S/001/2003 (Standard 1kg Institutional Contract)",
        "description": "MCX primary institutional contract. 1000g delivery unit, quoted per 10 grams at 995 fineness."
    },
    "GOLDM": {
        "symbol": "GOLDM",
        "name": "Gold Mini",
        "quotation_unit": "10g",
        "quotation_desc": "Quoted in Rupees per 10 grams",
        "trading_lot_grams": 100.0,
        "purity": 995,
        "tick_size": 1.0,
        "multiplier_to_10g": 1.0,
        "multiplier_to_1g": 0.1,
        "purity_adjusted_multiplier_to_10g": 1.0,
        "official_source": "MCX Circular MCX/TRD/052/2006 (Gold Mini 100g Contract Specifications)",
        "description": "MCX benchmark mini contract. 100g delivery unit, quoted per 10 grams at 995 fineness. Highly liquid benchmark."
    },
    "GOLDTEN": {
        "symbol": "GOLDTEN",
        "name": "Gold 10",
        "quotation_unit": "10g",
        "quotation_desc": "Quoted in Rupees per 10 grams",
        "trading_lot_grams": 10.0,
        "purity": 995,
        "tick_size": 1.0,
        "multiplier_to_10g": 1.0,
        "multiplier_to_1g": 0.1,
        "purity_adjusted_multiplier_to_10g": 1.0,
        "official_source": "MCX Circular MCX/TRD/029/2021 (Gold 10g Contract Launch)",
        "description": "10-gram contract traded in 10g lots, quoted per 10g at 995 fineness. Ideal for precision hedging."
    },
    "GOLDGUINEA": {
        "symbol": "GOLDGUINEA",
        "name": "Gold Guinea",
        "quotation_unit": "8g",
        "quotation_desc": "Quoted in Rupees per 8 grams (1 Guinea coin)",
        "trading_lot_grams": 8.0,
        "purity": 995,
        "tick_size": 1.0,
        "multiplier_to_10g": 1.25, # (10 / 8)
        "multiplier_to_1g": 0.125, # (1 / 8)
        "purity_adjusted_multiplier_to_10g": 1.25,
        "official_source": "MCX Circular MCX/TRD/180/2008 (Gold Guinea 8g Contract Specifications)",
        "description": "Traditional 8-gram sovereign coin standard, quoted per 8 grams. Normalization to 10g requires a 1.25x factor."
    },
    "GOLDPETAL": {
        "symbol": "GOLDPETAL",
        "name": "Gold Petal",
        "quotation_unit": "1g",
        "quotation_desc": "Quoted in Rupees per 1 gram",
        "trading_lot_grams": 1.0,
        "purity": 999, # 999 fine gold
        "tick_size": 1.0,
        "multiplier_to_10g": 10.0,
        "multiplier_to_1g": 1.0,
        "purity_adjusted_multiplier_to_10g": round(10.0 * (995.0 / 999.0), 6), # ~9.95996
        "official_source": "MCX Circular MCX/TRD/383/2019 (Gold Petal 1g Contract Specifications)",
        "description": "Micro-derivative with 1-gram lot size, quoted per 1 gram at 999 fineness. Normalization to 10g requires a 10.0x factor (or 9.96x purity-adjusted)."
    }
}

def validate_contract_symbol(symbol: str) -> bool:
    """Validates whether a symbol is an officially recognized MCX gold futures contract."""
    return symbol.upper() in CONTRACT_SPECS

def get_contract_spec(symbol: str) -> Dict[str, Any]:
    """Retrieves verified contract specification or raises ValueError."""
    sym = symbol.upper()
    if sym not in CONTRACT_SPECS:
        raise ValueError(
            f"Unsupported contract symbol '{symbol}'. Officially recognized MCX gold contracts: "
            f"{', '.join(CONTRACT_SPECS.keys())}."
        )
    return CONTRACT_SPECS[sym]

def normalize_price(symbol: str, raw_price: float, target_base: str = "10g", adjust_purity: bool = False) -> float:
    """
    Normalizes contract price to a uniform unit basis (either '10g' or '1g').
    """
    spec = CONTRACT_SPECS.get(symbol.upper())
    if not spec:
        raise ValueError(f"Unknown contract symbol: {symbol}")
        
    if target_base == "10g":
        if adjust_purity:
            return round(raw_price * spec["purity_adjusted_multiplier_to_10g"], 2)
        else:
            return round(raw_price * spec["multiplier_to_10g"], 2)
    elif target_base == "1g":
        if adjust_purity:
            # 1g equivalent normalized to 995 fineness
            purity_factor = (995.0 / 999.0) if spec["purity"] == 999 else 1.0
            return round(raw_price * spec["multiplier_to_1g"] * purity_factor, 2)
        else:
            return round(raw_price * spec["multiplier_to_1g"], 2)
    else:
        raise ValueError(f"Unsupported target base: {target_base}")
