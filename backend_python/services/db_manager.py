"""Database and Business Logic Manager for FarmNexus (Python).
Handles state synchronization between in-memory cache, local db.json, and MongoDB (PyMongo).
Provides inventory transactions, smart alert evaluations, offline sync with deduplication,
and marketplace digital trade settlements.
"""

import os
import json
import time
import copy
from datetime import datetime
from typing import Dict, Any, List, Optional

from backend_python.data.seed_data import INITIAL_DB
from backend_python.db.mongo import get_db_instance

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
# Sync with the existing data/db.json so React UI and Python backend share the exact same store
DB_FILE = os.path.abspath(os.path.join(CURRENT_DIR, "../../backend/data/db.json"))

_state: Optional[Dict[str, Any]] = None

def _persist_mongo_inventory(item: Dict[str, Any]):
    try:
        db = get_db_instance()
        if db is not None:
            clean_item = copy.deepcopy(item)
            clean_item.pop("_id", None)
            db["inventories"].update_one(
                {"crop": clean_item["crop"]},
                {"$set": clean_item},
                upsert=True
            )
    except Exception:
        pass

def _persist_mongo_transaction(tx: Dict[str, Any]):
    try:
        db = get_db_instance()
        if db is not None:
            clean_tx = copy.deepcopy(tx)
            clean_tx.pop("_id", None)
            db["transactions"].insert_one(clean_tx)
    except Exception:
        pass

def _persist_mongo_listing(listing: Dict[str, Any]):
    try:
        db = get_db_instance()
        if db is not None:
            clean_l = copy.deepcopy(listing)
            clean_l.pop("_id", None)
            db["marketplacelistings"].update_one(
                {"id": clean_l["id"]},
                {"$set": clean_l},
                upsert=True
            )
    except Exception:
        pass

def get_db() -> Dict[str, Any]:
    global _state
    if _state is None:
        try:
            if os.path.exists(DB_FILE):
                with open(DB_FILE, "r", encoding="utf-8") as f:
                    _state = json.load(f)
            else:
                _state = copy.deepcopy(INITIAL_DB)
                save_db()
        except Exception as e:
            print(f"Fallback to in-memory initialDb: {e}")
            _state = copy.deepcopy(INITIAL_DB)
    return _state

def save_db():
    global _state
    if _state is not None:
        try:
            os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
            with open(DB_FILE, "w", encoding="utf-8") as f:
                json.dump(_state, f, indent=2, ensure_ascii=False, default=str)
        except Exception as e:
            print(f"Error saving db.json: {e}")


def reset_db() -> Dict[str, Any]:
    global _state
    _state = copy.deepcopy(INITIAL_DB)
    save_db()
    return _state

def sync_state_with_mongo():
    try:
        db = get_db_instance()
        if db is not None:
            mongo_inv = list(db["inventories"].find())
            if mongo_inv:
                s = get_db()
                for i in mongo_inv:
                    i.pop("_id", None)
                s["inventory"] = mongo_inv
                save_db()
                print("🍃 Python state synced with MongoDB inventories!")
    except Exception as e:
        print(f"Mongo state sync notice: {e}")

# 1. Inventory & Stock Operations
def get_inventory() -> List[Dict[str, Any]]:
    return get_db().get("inventory", [])

def get_stock_by_crop(crop_name: str) -> Optional[Dict[str, Any]]:
    if not crop_name:
        return None
    db = get_db()
    crop_lower = crop_name.strip().lower()
    return next((i for i in db.get("inventory", []) if i["crop"].lower() == crop_lower), None)

def stock_in(crop: str, quantity: float, unit: str = "kg", unit_price: float = 0.0,
             notes: str = "", recorded_via: str = "MANUAL", variety: str = "Standard") -> Dict[str, Any]:
    if not crop or not crop.strip():
        raise ValueError("Crop name is required.")
    num_qty = float(quantity)
    if num_qty <= 0:
        raise ValueError("Quantity must be greater than zero.")

    db = get_db()
    crop_clean = crop.strip()
    item = next((i for i in db["inventory"] if i["crop"].lower() == crop_clean.lower()), None)

    if not item:
        item = {
            "id": f"inv-{int(time.time() * 1000)}",
            "crop": crop_clean,
            "variety": variety or "Standard Farm",
            "quantity": 0.0,
            "unit": unit or "kg",
            "unitPrice": float(unit_price) if unit_price else 0.0,
            "harvestDate": datetime.utcnow().strftime("%Y-%m-%d"),
            "grade": "Grade A",
            "minThreshold": 50.0,
            "storageLocation": "Farm Storage",
            "storageDays": 1,
            "isPerishable": True
        }
        db["inventory"].append(item)

    item["quantity"] = round(item["quantity"] + num_qty, 2)
    if unit_price and float(unit_price) > 0:
        item["unitPrice"] = float(unit_price)
    if unit:
        item["unit"] = unit

    tx = {
        "id": f"tx-{int(time.time() * 1000)}-{os.urandom(2).hex()}",
        "type": "STOCK_IN",
        "crop": item["crop"],
        "quantity": num_qty,
        "unit": item["unit"],
        "unitPrice": item["unitPrice"],
        "date": datetime.utcnow().isoformat() + "Z",
        "source": "Farmer Harvest / Inward Entry",
        "recordedVia": recorded_via or "MANUAL",
        "notes": notes or "Stock-in transaction"
    }

    db.setdefault("transactions", []).insert(0, tx)
    save_db()
    _persist_mongo_inventory(item)
    _persist_mongo_transaction(tx)

    return {"success": True, "updatedItem": item, "transaction": tx}

def stock_out(crop: str, quantity: float, unit: str = "kg", unit_price: float = 0.0,
              notes: str = "", recorded_via: str = "MANUAL") -> Dict[str, Any]:
    if not crop or not crop.strip():
        raise ValueError("Crop name is required.")
    num_qty = float(quantity)
    if num_qty <= 0:
        raise ValueError("Quantity must be greater than zero.")

    db = get_db()
    crop_clean = crop.strip()
    item = next((i for i in db["inventory"] if i["crop"].lower() == crop_clean.lower()), None)

    if not item:
        raise ValueError(f"Crop '{crop}' does not exist in inventory. Please add stock first.")

    if num_qty > item["quantity"]:
        raise ValueError(f"Insufficient stock! Available: {item['quantity']} {item['unit']}, requested: {num_qty} {unit}.")

    item["quantity"] = round(item["quantity"] - num_qty, 2)
    if unit_price and float(unit_price) > 0:
        item["unitPrice"] = float(unit_price)

    tx = {
        "id": f"tx-{int(time.time() * 1000)}-{os.urandom(2).hex()}",
        "type": "STOCK_OUT",
        "crop": item["crop"],
        "quantity": num_qty,
        "unit": item["unit"],
        "unitPrice": float(unit_price) if unit_price else item["unitPrice"],
        "date": datetime.utcnow().isoformat() + "Z",
        "source": "Direct Sale / Outward Transfer",
        "recordedVia": recorded_via or "MANUAL",
        "notes": notes or "Stock-out transaction"
    }

    db.setdefault("transactions", []).insert(0, tx)
    save_db()
    _persist_mongo_inventory(item)
    _persist_mongo_transaction(tx)

    return {"success": True, "updatedItem": item, "transaction": tx}

def stock_adjustment(crop: str, quantity_change: float, unit: str = "kg",
                     reason: str = "Audit", authorized_by: str = "Farmer") -> Dict[str, Any]:
    db = get_db()
    crop_clean = crop.strip()
    item = next((i for i in db["inventory"] if i["crop"].lower() == crop_clean.lower()), None)

    if not item:
        raise ValueError(f"Crop '{crop}' not found in inventory.")

    num_change = float(quantity_change)
    new_total = item["quantity"] + num_change
    if new_total < 0:
        raise ValueError(f"Adjustment cannot result in negative stock. Current: {item['quantity']}, change: {num_change}.")

    item["quantity"] = round(new_total, 2)

    tx = {
        "id": f"tx-adj-{int(time.time() * 1000)}",
        "type": "ADJUSTMENT",
        "crop": item["crop"],
        "quantity": num_change,
        "unit": item["unit"],
        "unitPrice": item["unitPrice"],
        "date": datetime.utcnow().isoformat() + "Z",
        "source": "Manual Stock Audit",
        "recordedVia": "MANUAL",
        "reason": reason or "Recounting/Shrinkage/Damage",
        "authorizedBy": authorized_by or "Farm Admin"
    }

    db.setdefault("transactions", []).insert(0, tx)
    save_db()
    _persist_mongo_inventory(item)
    _persist_mongo_transaction(tx)

    return {"success": True, "updatedItem": item, "transaction": tx}

def get_transactions() -> List[Dict[str, Any]]:
    return get_db().get("transactions", [])

# 2. Smart Alerts (FR-12)
def get_smart_alerts() -> List[Dict[str, Any]]:
    db = get_db()
    alerts = []

    # Check inventory for low-stock and aging
    for item in db.get("inventory", []):
        if item["quantity"] <= item.get("minThreshold", 0):
            alerts.append({
                "id": f"alert-low-{item['id']}",
                "type": "LOW_STOCK",
                "severity": "warning",
                "crop": item["crop"],
                "title": f"Low Stock Alert: {item['crop']}",
                "message": f"{item['crop']} quantity ({item['quantity']} {item['unit']}) has dropped below minimum threshold ({item.get('minThreshold')} {item['unit']}). Consider harvesting or replenishing.",
                "actionLink": "/inventory",
                "date": datetime.utcnow().isoformat() + "Z"
            })

        if item.get("isPerishable") and item.get("storageDays", 0) > 5:
            alerts.append({
                "id": f"alert-aging-{item['id']}",
                "type": "AGING_PRODUCE",
                "severity": "critical",
                "crop": item["crop"],
                "title": f"Aging Storage Alert: {item['crop']}",
                "message": f"{item['crop']} has been stored at room conditions for {item['storageDays']} days. Risk of spoilage! Move to cold storage or sell immediately.",
                "actionLink": "/cold-storage",
                "date": datetime.utcnow().isoformat() + "Z"
            })

    # Check Mandi price surges (Market Opportunity Alert)
    surging_mandi = next((m for m in db.get("mandiPrices", []) if m.get("trend") == "up" and m.get("crop") == "Tomato"), None)
    if surging_mandi:
        alerts.append({
            "id": "alert-price-surge",
            "type": "MARKET_OPPORTUNITY",
            "severity": "info",
            "crop": surging_mandi["crop"],
            "title": f"High Price Surge in {surging_mandi['market']}!",
            "message": f"{surging_mandi['crop']} prices rose {surging_mandi.get('changePercent')} to ₹{surging_mandi.get('modalPrice')}/{surging_mandi.get('unit')}. Great time to list on Marketplace!",
            "actionLink": "/marketplace",
            "date": datetime.utcnow().isoformat() + "Z"
        })

    return alerts

# 3. Offline Sync with Deduplication (FR-20)
def sync_batch_transactions(offline_transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
    db = get_db()
    results = {
        "processed": 0,
        "duplicatesSkipped": 0,
        "errors": []
    }

    for item in offline_transactions:
        # Check idempotency / duplicates
        existing = next((t for t in db.get("transactions", []) if t.get("id") == item.get("id") or (item.get("syncToken") and t.get("syncToken") == item.get("syncToken"))), None)
        if existing:
            results["duplicatesSkipped"] += 1
            continue

        try:
            tx_type = item.get("type")
            if tx_type == "STOCK_IN":
                res = stock_in(
                    crop=item.get("crop", ""),
                    quantity=item.get("quantity", 0),
                    unit=item.get("unit", "kg"),
                    unit_price=item.get("unitPrice", 0),
                    notes=(item.get("notes", "") or "") + " [Synced Offline]",
                    recorded_via=item.get("recordedVia", "OFFLINE_SYNC")
                )
                if item.get("id"):
                    res["transaction"]["id"] = item["id"]
                if item.get("syncToken"):
                    res["transaction"]["syncToken"] = item["syncToken"]
                save_db()
                results["processed"] += 1
            elif tx_type == "STOCK_OUT":
                res = stock_out(
                    crop=item.get("crop", ""),
                    quantity=item.get("quantity", 0),
                    unit=item.get("unit", "kg"),
                    unit_price=item.get("unitPrice", 0),
                    notes=(item.get("notes", "") or "") + " [Synced Offline]",
                    recorded_via=item.get("recordedVia", "OFFLINE_SYNC")
                )
                if item.get("id"):
                    res["transaction"]["id"] = item["id"]
                if item.get("syncToken"):
                    res["transaction"]["syncToken"] = item["syncToken"]
                save_db()
                results["processed"] += 1
        except Exception as err:
            results["errors"].append({"id": item.get("id"), "error": str(err)})

    return {
        "success": True,
        **results,
        "currentInventory": db.get("inventory", [])
    }

# 4. Mandi Prices
def get_mandi_prices() -> List[Dict[str, Any]]:
    return get_db().get("mandiPrices", [])

# 5. Marketplace Listings & Direct Consumer Orders
def get_marketplace_listings() -> List[Dict[str, Any]]:
    return get_db().get("marketplaceListings", [])

def create_marketplace_listing(listing_data: Dict[str, Any]) -> Dict[str, Any]:
    db = get_db()
    new_listing = {
        "id": f"listing-{int(time.time() * 1000)}",
        "farmerId": listing_data.get("farmerId", "farmer-01"),
        "farmerName": listing_data.get("farmerName", "Ramesh Patel"),
        "farmerPhone": listing_data.get("farmerPhone", "+919876543210"),
        "crop": listing_data.get("crop", "Tomato"),
        "variety": listing_data.get("variety", "Standard Grade"),
        "quantity": float(listing_data.get("quantity", 100)),
        "unit": listing_data.get("unit", "kg"),
        "askingPrice": float(listing_data.get("askingPrice", 25)),
        "currency": "INR",
        "location": listing_data.get("location", "Guntur, AP"),
        "grade": listing_data.get("grade", "Grade A"),
        "harvestDate": listing_data.get("harvestDate", datetime.utcnow().strftime("%Y-%m-%d")),
        "status": "ACTIVE",
        "description": listing_data.get("description", "Farm-fresh quality produce ready for immediate dispatch."),
        "offers": []
    }

    db.setdefault("marketplaceListings", []).insert(0, new_listing)
    save_db()
    _persist_mongo_listing(new_listing)
    return new_listing

def submit_buyer_offer(listing_id: str, offer_data: Dict[str, Any]) -> Dict[str, Any]:
    db = get_db()
    listing = next((l for l in db.get("marketplaceListings", []) if l["id"] == listing_id), None)
    if not listing:
        raise ValueError("Listing not found.")

    offer = {
        "id": f"off-{int(time.time() * 1000)}",
        "buyerName": offer_data.get("buyerName", "Agri Buyer"),
        "buyerPhone": offer_data.get("buyerPhone", "+919800000000"),
        "offeredPrice": float(offer_data.get("offeredPrice", listing["askingPrice"])),
        "offeredQuantity": float(offer_data.get("offeredQuantity", listing["quantity"])),
        "notes": offer_data.get("notes", "Ready for immediate pickup."),
        "status": "PENDING",
        "date": datetime.utcnow().isoformat() + "Z"
    }

    listing.setdefault("offers", []).append(offer)
    save_db()
    _persist_mongo_listing(listing)
    return {"success": True, "listing": listing, "offer": offer}

def accept_marketplace_request(listing_id: str, deal_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    db = get_db()
    listing = next((l for l in db.get("marketplaceListings", []) if l["id"] == listing_id), None)
    if not listing:
        raise ValueError("Listing not found.")

    deal_data = deal_data or {}
    final_price = float(deal_data.get("agreedPrice") or deal_data.get("acceptedPrice") or listing["askingPrice"])
    final_qty = float(deal_data.get("agreedQuantity") or deal_data.get("acceptedQuantity") or listing["quantity"])
    total_amount = round(final_price * final_qty)

    listing["status"] = "ACCEPTED"
    deal = {
        "dealId": f"DEAL-{str(int(time.time() * 1000))[-6:]}",
        "buyerName": deal_data.get("buyerName", "Direct Consumer"),
        "buyerPhone": deal_data.get("buyerPhone", "+91 98480 12345"),
        "buyerAddress": deal_data.get("buyerAddress", "Local Consumer Pickup / Home Delivery"),
        "buyerRole": deal_data.get("buyerRole", "Direct Consumer"),
        "agreedPrice": final_price,
        "agreedQuantity": final_qty,
        "unit": listing["unit"],
        "totalAmount": total_amount,
        "acceptedAt": datetime.utcnow().isoformat() + "Z",
        "status": "CONFIRMED_ORDER"
    }
    listing["acceptedDeal"] = deal

    save_db()
    _persist_mongo_listing(listing)

    # Automatically record sale transaction in Farmer's stock ledger
    try:
        tx = {
            "id": f"tx-deal-{int(time.time() * 1000)}",
            "type": "STOCK_OUT",
            "crop": listing["crop"],
            "quantity": final_qty,
            "unit": listing["unit"],
            "unitPrice": final_price,
            "date": datetime.utcnow().isoformat() + "Z",
            "source": f"Direct Market Sale to {deal['buyerName']}",
            "recordedVia": "DIRECT_CONSUMER_ACCEPT",
            "notes": f"Order {deal['dealId']} confirmed! Total ₹{total_amount:,}"
        }
        db.setdefault("transactions", []).insert(0, tx)
        save_db()
        _persist_mongo_transaction(tx)
    except Exception as e:
        print(f"Deal tx record notice: {e}")

    return {"success": True, "listing": listing, "deal": deal}

# 6. FPO Aggregations
def get_fpo_aggregations() -> List[Dict[str, Any]]:
    return get_db().get("fpoAggregations", [])

# 7. Cold Storages
def get_cold_storages() -> List[Dict[str, Any]]:
    return get_db().get("coldStorages", [])

# 8. Logistics
def get_logistics() -> List[Dict[str, Any]]:
    return get_db().get("logistics", [])
