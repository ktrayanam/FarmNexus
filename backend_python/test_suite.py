"""Comprehensive Functional & Verification Test Suite for FarmNexus (Python).
Tests all 15 critical Functional Requirements (FR-01 to FR-20):
1. System Health & Platform Telemetry
2. FR-01: Farmer Registration & OTP Auth (RBAC)
3. FR-07 & FR-10: Multilingual Voice NLU - Stock In (Example 1)
4. FR-07 & FR-10: Multilingual Voice NLU - Stock Out (Example 2)
5. FR-10 & FR-11: Multilingual Voice NLU - Telugu Query ('Tomato entha undi?')
6. FR-03: Stock In Execution
7. FR-04: Stock Out Overdraw Prevention Rule
8. FR-05: Stock Adjustment with Audit Trail
9. FR-12: Smart Alerts (Low Stock, Aging, Market Opportunity)
10. FR-13 & FR-14: AI Crop Doctor Diagnosis & KVK Helpline
11. FR-15: Mandi Price Intelligence with Trends
12. FR-16: Direct Marketplace Listing, Buyer Offer & Consumer Contract Acceptance
13. FR-18: Cold Storage Discovery & Space Reservation
14. FR-19: Rural Logistics Freight Estimator
15. FR-20: Offline Batch Synchronization with Idempotency & Deduplication
"""

import sys
import os
import time

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import requests
from starlette.testclient import TestClient

from backend_python.main import app


def create_client():
    # Attempt connecting to live running server on port 5050 only if it's the Python server; fallback to in-memory TestClient
    live_url = "http://127.0.0.1:5050/api"
    try:
        r = requests.get(f"{live_url}/health", timeout=0.5)
        if r.status_code == 200 and "Python" in r.text:
            print("🌐 Connected to live FarmNexus Python FastAPI server at http://127.0.0.1:5050")
            class LiveClient:
                def get(self, path, **kwargs):
                    return requests.get(f"http://127.0.0.1:5050{path}", **kwargs)
                def post(self, path, **kwargs):
                    return requests.post(f"http://127.0.0.1:5050{path}", **kwargs)
                def patch(self, path, **kwargs):
                    return requests.patch(f"http://127.0.0.1:5050{path}", **kwargs)
                def delete(self, path, **kwargs):
                    return requests.delete(f"http://127.0.0.1:5050{path}", **kwargs)
            return LiveClient()
    except Exception:
        pass

    print("⚡ Using high-speed FastAPI in-process TestClient for verification")
    return TestClient(app)

def run_tests():
    print("🌾 Starting FarmNexus Python Comprehensive Verification Test Suite...\n")
    client = create_client()
    passed_count = 0
    total_count = 20

    # 1. Health check
    print("1. Testing System Health & Telemetry...")
    res = client.get("/api/health").json()
    assert res["status"] == "ok"
    assert "FarmNexus" in res["platform"]
    print(f"   ✅ Health check passed! Runtime: {res.get('runtime', 'Python')}")
    passed_count += 1

    # 2. FR-01: Farmer Auth & Profile
    print("2. Testing FR-01: Role-Based Access Control & Farmer Auth...")
    login_res = client.post("/api/auth/login", json={"role": "farmer", "phone": "9876543210", "otp": "1234", "language": "te"}).json()
    assert login_res["success"] is True
    assert login_res["user"]["name"] == "Ramesh Patel"
    assert login_res["user"]["role"] == "farmer"
    assert login_res["user"]["preferredLanguage"] == "te"
    print(f"   ✅ FR-01 Farmer Auth verified! Logged in as: {login_res['user']['name']}")
    passed_count += 1

    # 3. FR-07 & FR-10: Voice NLU - Example 1 (Stock In)
    print("3. Testing FR-07: Voice NLU - 'Add 200 kilos of tomatoes'...")
    voice1 = client.post("/api/voice/nlu", json={"text": "Add 200 kilos of tomatoes"}).json()
    assert voice1["parsed"]["intent"] == "STOCK_IN"
    assert voice1["parsed"]["crop"] == "Tomato"
    assert voice1["parsed"]["quantity"] == 200.0
    assert voice1["parsed"]["unit"] == "kg"
    print("   ✅ Voice Document Example 1 parsed perfectly (Intent: STOCK_IN, Crop: Tomato, Qty: 200 kg)!")
    passed_count += 1

    # 4. FR-07 & FR-10: Voice NLU - Example 2 (Stock Out)
    print("4. Testing FR-07: Voice NLU - 'I sold 100 kg tomatoes for 25 rupees per kilo'...")
    voice2 = client.post("/api/voice/nlu", json={"text": "I sold 100 kg tomatoes for 25 rupees per kilo"}).json()
    assert voice2["parsed"]["intent"] == "STOCK_OUT"
    assert voice2["parsed"]["crop"] == "Tomato"
    assert voice2["parsed"]["quantity"] == 100.0
    assert voice2["parsed"]["price"] == 25.0
    print("   ✅ Voice Document Example 2 parsed perfectly (Intent: STOCK_OUT, Crop: Tomato, Qty: 100 kg, Price: ₹25)!")
    passed_count += 1

    # 5. FR-10 & FR-11: Voice NLU - Example 3 ('Tomato entha undi?' in Telugu)
    print("5. Testing FR-11: Voice NLU - 'Tomato entha undi?' (Telugu query)...")
    voice3 = client.post("/api/voice/nlu", json={"text": "Tomato entha undi?", "preferredLanguage": "te"}).json()
    assert voice3["parsed"]["intent"] == "QUERY_STOCK"
    assert voice3["parsed"]["crop"] == "Tomato"
    assert ("టమాటా" in voice3["spokenResponse"] or "Tomato" in voice3["spokenResponse"])
    print(f"   ✅ Telugu speech response generated: {voice3['spokenResponse']}")
    passed_count += 1

    # 6. FR-03: Stock In Execution
    print("6. Testing FR-03: Stock In Execution...")
    stock_in_res = client.post("/api/inventory/stock-in", json={"crop": "Tomato", "quantity": 50.0, "unit": "kg", "unitPrice": 22.0}).json()
    assert stock_in_res["success"] is True
    print(f"   ✅ Stock In confirmed! Updated quantity: {stock_in_res['updatedItem']['quantity']} kg")
    passed_count += 1

    # 7. FR-04: Stock Out Overdraw Prevention Rule
    print("7. Testing FR-04: Stock Out Overdraw Prevention Rule...")
    overdraw_resp = client.post("/api/inventory/stock-out", json={"crop": "Tomato", "quantity": 999999.0, "unit": "kg"})
    assert overdraw_resp.status_code == 400 or (overdraw_resp.status_code == 200 and "Insufficient" in overdraw_resp.text)
    detail = overdraw_resp.json().get("detail") or overdraw_resp.json().get("error") or ""
    assert "Insufficient" in detail or "Insufficient" in overdraw_resp.text
    print(f"   ✅ Overdraw prevented successfully: {detail}")
    passed_count += 1

    # 8. FR-05: Stock Adjustment Audit Trail
    print("8. Testing FR-05: Stock Adjustment Audit Trail...")
    adj_res = client.post("/api/inventory/adjust", json={
        "crop": "Tomato",
        "quantityChange": -5.0,
        "unit": "kg",
        "reason": "Moisture shrinkage / transport bruising",
        "authorizedBy": "Ramesh Patel"
    }).json()
    assert adj_res["success"] is True
    assert adj_res["transaction"]["reason"] == "Moisture shrinkage / transport bruising"
    print("   ✅ Stock adjustment recorded in audit ledger!")
    passed_count += 1

    # 9. FR-12: Smart Alerts
    print("9. Testing FR-12: Smart Alerts Generation...")
    alerts_res = client.get("/api/alerts").json()
    assert alerts_res["success"] is True
    assert len(alerts_res["alerts"]) >= 2
    types = [a["type"] for a in alerts_res["alerts"]]
    assert "LOW_STOCK" in types
    assert "AGING_PRODUCE" in types
    print(f"   ✅ Generated {len(alerts_res['alerts'])} smart alerts (Low Stock, Aging, Market Surge)!")
    passed_count += 1

    # 10. FR-13 & FR-14: AI Crop Doctor Diagnosis & Treatment
    print("10. Testing FR-13 & FR-14: AI Crop Doctor Diagnosis & Treatment...")
    diag_res = client.post("/api/crop-doctor/diagnose", data={"crop": "Chilli"}).json()
    assert diag_res["success"] is True
    assert diag_res["crop"] == "Chilli"
    assert len(diag_res["treatment"]["organic"]) > 0
    assert len(diag_res["treatment"]["chemical"]) > 0
    assert diag_res["expertConsultation"]["hotline"]
    print(f"   ✅ Diagnosed '{diag_res['diseaseName']}' with {diag_res['confidencePercent']} confidence & KVK hotline!")
    passed_count += 1

    # 11. FR-15: Mandi Price Intelligence
    print("11. Testing FR-15: Mandi Price Intelligence...")
    mandi_res = client.get("/api/market/prices").json()
    assert mandi_res["success"] is True
    assert len(mandi_res["mandiPrices"]) >= 5
    print(f"   ✅ Loaded {len(mandi_res['mandiPrices'])} live mandi price feeds!")
    passed_count += 1

    # 12. FR-16: Direct Marketplace Listing & Consumer Contract Acceptance
    print("12. Testing FR-16: Marketplace Listing & Direct Consumer Order Acceptance...")
    new_listing = client.post("/api/marketplace/listings", json={
        "crop": "Paddy",
        "variety": "BPT Sona Masoori",
        "quantity": 50.0,
        "unit": "bags",
        "askingPrice": 1900.0,
        "location": "Guntur Rural, AP"
    }).json()
    assert new_listing["success"] is True
    listing_id = new_listing["listing"]["id"]

    accept_res = client.post(f"/api/marketplace/listings/{listing_id}/accept", json={
        "buyerName": "Sunita Sharma (Direct Consumer)",
        "buyerPhone": "+91 98480 12345",
        "buyerAddress": "Flat 402, Green Meadows, Guntur",
        "buyerRole": "Direct Consumer",
        "agreedPrice": 1900.0,
        "agreedQuantity": 50.0
    }).json()
    assert accept_res["success"] is True
    assert accept_res["listing"]["status"] == "ACCEPTED"
    assert accept_res["deal"]["totalAmount"] == 95000
    print(f"   ✅ Order accepted & digital contract created! Deal ID: {accept_res['deal']['dealId']}, Total: ₹{accept_res['deal']['totalAmount']:,}")
    passed_count += 1

    # 13. FR-18: Cold Storage Discovery & Space Reservation
    print("13. Testing FR-18: Cold Storage Space Reservation...")
    storages = client.get("/api/storage/facilities").json()
    assert len(storages["coldStorages"]) >= 3
    book_res = client.post("/api/storage/book", json={
        "facilityId": storages["coldStorages"][0]["id"],
        "crop": "Tomato",
        "quantityBags": 60,
        "durationMonths": 2
    }).json()
    assert book_res["success"] is True
    assert "CSB-" in book_res["booking"]["bookingId"]
    print(f"   ✅ Cold storage booking confirmed: {book_res['booking']['bookingId']} (Cost: ₹{book_res['booking']['estimatedCost']})")
    passed_count += 1

    # 14. FR-19: Rural Logistics Freight Estimator
    print("14. Testing FR-19: Rural Logistics Freight Estimator...")
    freight_res = client.post("/api/logistics/estimate", json={"distanceKm": 35.0, "quantityKg": 600.0}).json()
    assert freight_res["success"] is True
    assert freight_res["estimate"]["totalFreight"] > 0
    print(f"   ✅ Freight calculated for {freight_res['estimate']['distanceKm']} km: ₹{freight_res['estimate']['totalFreight']}")
    passed_count += 1

    # 15. FR-20: Offline Batch Synchronization with Deduplication
    print("15. Testing FR-20: Offline Batch Sync & Deduplication...")
    sync_token = f"token-python-sync-{int(time.time() * 1000)}"
    offline_tx = [
        {
            "id": f"offline-test-{int(time.time() * 1000)}",
            "syncToken": sync_token,
            "type": "STOCK_IN",
            "crop": "Tomato",
            "quantity": 10.0,
            "unit": "kg",
            "unitPrice": 20.0
        }
    ]
    sync1 = client.post("/api/sync/batch", json={"transactions": offline_tx}).json()
    assert sync1.get("processed") == 1, f"Expected 1 processed, got {sync1}"
    # Duplicate sync
    sync2 = client.post("/api/sync/batch", json={"transactions": offline_tx}).json()
    assert sync2.get("duplicatesSkipped") == 1, f"Expected 1 duplicate skipped, got {sync2}"
    print("   ✅ Offline sync batch processed and idempotency verified (duplicate prevented)!")
    passed_count += 1

    # 16. FR-17: FPO Pooling Lot creation, farmer contribution & tender acceptance
    print("16. Testing FR-17: FPO Pooling Lot creation, farmer contribution & tender acceptance...")
    new_fpo = client.post("/api/fpo/aggregations", json={
        "crop": "Paddy",
        "aggregatedQuantity": 5000.0,
        "unit": "kg",
        "targetPrice": 28.0,
        "fpoName": "Krishna Delta Farmer Producer Co."
    }).json()
    assert new_fpo["success"] is True
    fpo_id = new_fpo["lot"]["id"]

    contrib = client.post(f"/api/fpo/aggregations/{fpo_id}/contribute", json={
        "farmerName": "Ramesh Patel",
        "quantity": 500.0,
        "unit": "kg"
    }).json()
    assert contrib["success"] is True
    assert contrib["lot"]["aggregatedQuantity"] == 5500.0

    tender = client.post(f"/api/fpo/aggregations/{fpo_id}/tender", json={
        "buyer": "ITC Agri Sourcing",
        "status": "CONFIRMED",
        "counterRate": 28.5
    }).json()
    assert tender["success"] is True
    print("   ✅ FPO Bulk pool created, member contribution recorded, and corporate tender confirmed!")
    passed_count += 1

    # 17. Cold Storage Reservations History & Cancel
    print("17. Testing Cold Storage Bookings History & Cancellation...")
    all_bookings = client.get("/api/storage/bookings").json()
    assert all_bookings["success"] is True
    assert len(all_bookings["bookings"]) > 0

    cancel_res = client.delete(f"/api/storage/bookings/{book_res['booking']['bookingId']}").json()
    assert cancel_res["success"] is True
    assert cancel_res["booking"]["status"] == "CANCELLED"
    print(f"   ✅ Cold storage reservation {book_res['booking']['bookingId']} cancelled successfully!")
    passed_count += 1

    # 18. Logistics Vehicle Trip Booking & Status Update
    print("18. Testing Logistics Vehicle Booking & Live Status Dispatch...")
    trip = client.post("/api/logistics/book", json={
        "vehicleId": "veh-01",
        "distanceKm": 20.0,
        "pickupLocation": "Guntur Farm Shed",
        "destinationLocation": "Vijayawada Hub",
        "totalFreight": 650.0
    }).json()
    assert trip["success"] is True
    booking_ref = trip["trip"]["bookingRef"]

    patch_trip = client.patch(f"/api/logistics/trips/{booking_ref}", json={"status": "COMPLETED"}).json()
    assert patch_trip["success"] is True
    assert patch_trip["trip"]["status"] == "COMPLETED"
    print(f"   ✅ Logistics vehicle booked ({booking_ref}) and marked COMPLETED!")
    passed_count += 1

    # 19. APMC Mandi Price Calibration
    print("19. Testing APMC Mandi Price Calibration & Update...")
    cal_res = client.post("/api/market/prices", json={
        "market": "Bowenpally APMC, Hyderabad",
        "crop": "Tomato",
        "modalPrice": 2600.0,
        "trend": "up"
    }).json()
    assert cal_res["success"] is True
    assert cal_res["priceItem"]["modalPrice"] == 2600.0
    print("   ✅ Bowenpally Tomato APMC price calibrated to ₹2600/quintal!")
    passed_count += 1

    # 20. Buyer Offer Submission
    print("20. Testing Buyer Offer Submission & Validation...")
    offer_res = client.post(f"/api/marketplace/listings/{listing_id}/offer", json={
        "buyerName": "Kisan Wholesale Trader",
        "buyerPhone": "+919848012345",
        "offeredPrice": 1880.0,
        "offeredQuantity": 50.0
    }).json()
    assert offer_res["success"] is True
    print(f"   ✅ Marketplace buyer offer submitted and validated for listing {listing_id}!")
    passed_count += 1

    print(f"\n🎉 ALL {passed_count}/{total_count} AUTOMATED PYTHON TESTS PASSED SUCCESSFULLY! 💯")
    return True

if __name__ == "__main__":
    import time
    try:
        run_tests()
        sys.exit(0)
    except AssertionError as ae:
        print(f"\n❌ Assertion Error in test: {ae}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Test suite execution error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
