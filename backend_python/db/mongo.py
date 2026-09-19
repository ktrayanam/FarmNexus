"""MongoDB Connection and Telemetry Manager for FarmNexus (Python / PyMongo).
Provides connection lifecycle management, database status telemetry, and automatic seeding.
"""

import os
from typing import Dict, Any, Optional
import pymongo
from pymongo.errors import PyMongoError, ServerSelectionTimeoutError
from backend_python.data.seed_data import INITIAL_DB

# Default pre-seeded users for the 4 core roles
DEFAULT_USERS = [
    {
        "id": "farmer-01",
        "name": "Ramesh Patel",
        "role": "farmer",
        "phone": "9876543210",
        "email": "ramesh.farmer@farmnexus.in",
        "password": "1234",
        "location": "Guntur Rural, Andhra Pradesh",
        "preferredLanguage": "te",
        "farmSizeAcres": 4.5,
        "cropsGrown": ["Tomato", "Chilli", "Cotton", "Paddy"],
        "avatar": "👨‍🌾"
    },
    {
        "id": "buyer-01",
        "name": "Vikram Singhal",
        "role": "buyer",
        "phone": "9848012345",
        "email": "vikram@kisanfresh.com",
        "password": "buyer123",
        "companyName": "Kisan Fresh Wholesale Supermarkets",
        "mandiLicenseId": "APMC-HYD-W-2024-889",
        "buyerType": "Wholesale Supermarket Sourcing",
        "location": "Bowenpally Agri Yard, Hyderabad",
        "preferredLanguage": "en",
        "avatar": "🏢"
    },
    {
        "id": "fpo-01",
        "name": "Venkateswara Rao",
        "role": "fpo",
        "phone": "9440056789",
        "email": "contact@krishnadeltafpo.org",
        "password": "fpo123",
        "companyName": "Krishna Delta Farmer Producer Co.",
        "fpoRegNo": "FPO-AP-GNT-2022-098",
        "memberCount": 142,
        "location": "Tenali Hub, Guntur District",
        "preferredLanguage": "te",
        "avatar": "🤝"
    },
    {
        "id": "admin-01",
        "name": "FarmNexus System Admin",
        "role": "admin",
        "phone": "8000011223",
        "email": "admin@farmnexus.gov.in",
        "password": "admin123",
        "location": "State Agricultural Command Center",
        "preferredLanguage": "en",
        "avatar": "⚙️"
    }
]

_mongo_client: Optional[pymongo.MongoClient] = None
_db: Optional[Any] = None
_is_connected: bool = False
_connection_attempted: bool = False
_connection_error: Optional[str] = None

def get_mongo_uri() -> str:
    return os.environ.get("MONGODB_URI", "mongodb://127.0.0.1:27017/farmnexus")

def connect_mongodb(force: bool = False) -> bool:
    global _mongo_client, _db, _is_connected, _connection_attempted, _connection_error
    if _connection_attempted and not force:
        return _is_connected

    _connection_attempted = True
    uri = get_mongo_uri()
    try:
        # 1.5s server selection timeout for rapid startup
        _mongo_client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=1500)
        # Verify connection with ping
        _mongo_client.admin.command("ping")
        _db = _mongo_client.get_database("farmnexus")
        _is_connected = True
        _connection_error = None
        print(f"🍃 Python PyMongo successfully connected to MongoDB: {uri}")
        seed_mongo_if_empty()
        return True
    except Exception as err:
        _is_connected = False
        _connection_error = str(err)
        print(f"⚠️ PyMongo connection notice ({err}). Resilient JSON fallback active.")
        return False

def get_db_instance():
    global _db, _is_connected, _connection_attempted
    if not _connection_attempted:
        connect_mongodb()
    return _db if _is_connected else None


def seed_mongo_if_empty():
    global _db, _is_connected
    if not _is_connected or _db is None:
        return

    try:
        # Seed users if empty
        if _db["users"].count_documents({}) == 0:
            _db["users"].insert_many(DEFAULT_USERS)
            print("🍃 MongoDB seeded with role-based users in Python!")

        # Seed agricultural datasets if empty
        if _db["inventories"].count_documents({}) == 0:
            _db["inventories"].insert_many(INITIAL_DB["inventory"])
            _db["transactions"].insert_many(INITIAL_DB["transactions"])
            _db["mandiprices"].insert_many(INITIAL_DB["mandiPrices"])
            _db["marketplacelistings"].insert_many(INITIAL_DB["marketplaceListings"])
            _db["fpoaggregations"].insert_many(INITIAL_DB["fpoAggregations"])
            _db["coldstorages"].insert_many(INITIAL_DB["coldStorages"])
            _db["logistics"].insert_many(INITIAL_DB["logistics"])
            print("🍃 MongoDB seeded with complete agricultural datasets via PyMongo!")
    except Exception as seed_err:
        print(f"PyMongo seed notice: {seed_err}")

def get_mongo_status() -> Dict[str, Any]:
    uri = get_mongo_uri()
    safe_uri = "MongoDB Atlas (Cloud URI Configured)" if "mongodb+srv" in uri else uri
    return {
        "connected": _is_connected,
        "uri": safe_uri,
        "error": _connection_error,
        "fallbackMode": "Inactive (Native MongoDB Active)" if _is_connected else "Active (Resilient JSON Store)",
        "driver": "PyMongo 4.x (Python 3.12)"
    }
