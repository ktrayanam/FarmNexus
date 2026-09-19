"""FarmNexus FastAPI Application (Python Backend).
Implements all RESTful endpoints with MongoDB integration, Swagger UI (/docs),
multilingual voice NLU, AI Crop Doctor, direct marketplace, and smart agricultural services.
"""

import os
import sys
import time
from datetime import datetime
from typing import Optional, List, Dict, Any

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from fastapi import FastAPI, Request, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from pydantic import BaseModel


from backend_python.db.mongo import connect_mongodb, get_mongo_status, DEFAULT_USERS
from backend_python.services.nlu_engine import parse_voice_input
from backend_python.services.disease_model import diagnose_crop_image, get_all_known_diseases
from backend_python.services.db_manager import (
    get_inventory,
    get_stock_by_crop,
    stock_in,
    stock_out,
    stock_adjustment,
    get_transactions,
    get_smart_alerts,
    sync_batch_transactions,
    get_mandi_prices,
    get_marketplace_listings,
    create_marketplace_listing,
    submit_buyer_offer,
    accept_marketplace_request,
    get_fpo_aggregations,
    create_fpo_aggregation,
    add_fpo_contribution,
    update_fpo_tender_status,
    add_fpo_tender,
    get_cold_storages,
    get_cold_storage_bookings,
    book_cold_storage,
    cancel_cold_storage_booking,
    get_logistics,
    get_logistics_bookings,
    book_logistics_vehicle,
    update_logistics_trip_status,
    update_mandi_price,
    reset_db,
    sync_state_with_mongo
)

app = FastAPI(
    title="FarmNexus Agricultural Platform API",
    description="Python FastAPI backend for FarmNexus: Multilingual Voice Ledger, AI Crop Doctor, Mandi Intelligence, and Direct Consumer Marketplace.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for React Frontend (port 3000) and any remote origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    connected = connect_mongodb()
    if connected:
        sync_state_with_mongo()

@app.get("/")
def root():
    return {
        "platform": "FarmNexus",
        "runtime": "Python 3.12 (FastAPI)",
        "docs": "/docs",
        "health": "/api/health",
        "message": "FarmNexus Python API Server is active!"
    }

# 1. Health & Status Telemetry
@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "platform": "FarmNexus",
        "version": "2.0.0",
        "runtime": f"Python {sys.version.split()[0]} (FastAPI + PyMongo)",
        "database": get_mongo_status(),
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

@app.get("/api/db/status")
def db_status():
    return {
        "success": True,
        "mongo": get_mongo_status()
    }

@app.post("/api/reset")
def reset_database():
    db = reset_db()
    return {
        "success": True,
        "message": "Database reset to initial demo state.",
        "db": db
    }

# 2. Authentication & Role-Based Access (FR-01)
@app.get("/api/auth/users")
def get_demo_users():
    return {"success": True, "users": DEFAULT_USERS}

class LoginRequest(BaseModel):
    role: Optional[str] = "farmer"
    phone: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    otp: Optional[str] = None
    language: Optional[str] = "te"
    fpoRegNo: Optional[str] = None

@app.post("/api/auth/login")
async def login(req: Request):
    try:
        body = await req.json()
    except Exception:
        body = {}

    role = body.get("role", "farmer")
    phone = body.get("phone")
    email = body.get("email")
    fpo_reg = body.get("fpoRegNo")
    language = body.get("language", "te")

    matched_user = None
    if role == "farmer":
        matched_user = next((u for u in DEFAULT_USERS if u["role"] == "farmer" and (not phone or u["phone"] == phone)), DEFAULT_USERS[0])
        if language:
            matched_user["preferredLanguage"] = language
    elif role == "buyer":
        matched_user = next((u for u in DEFAULT_USERS if u["role"] == "buyer" and (u["phone"] == phone or u["email"] == email)), DEFAULT_USERS[1])
    elif role == "fpo":
        matched_user = next((u for u in DEFAULT_USERS if u["role"] == "fpo" and (u.get("fpoRegNo") == fpo_reg or u["phone"] == phone)), DEFAULT_USERS[2])
    elif role == "admin":
        matched_user = next((u for u in DEFAULT_USERS if u["role"] == "admin"), DEFAULT_USERS[3])
    else:
        matched_user = DEFAULT_USERS[0]

    token = f"jwt-{matched_user['role']}-{int(time.time() * 1000)}"
    return {
        "success": True,
        "user": {
            **matched_user,
            "token": token
        },
        "message": f"Logged in successfully as {matched_user['name']} ({matched_user['role'].upper()})."
    }

# 3. Inventory APIs (FR-02, FR-03, FR-04)
@app.get("/api/inventory")
def get_all_inventory():
    return {"success": True, "inventory": get_inventory()}

@app.get("/api/inventory/{crop}")
def get_single_inventory(crop: str):
    item = get_stock_by_crop(crop)
    if not item:
        raise HTTPException(status_code=404, detail="Crop not found in inventory.")
    return {"success": True, "item": item}

@app.post("/api/inventory/stock-in")
async def api_stock_in(req: Request):
    try:
        data = await req.json()
        result = stock_in(
            crop=data.get("crop", ""),
            quantity=data.get("quantity", 0),
            unit=data.get("unit", "kg"),
            unit_price=data.get("unitPrice", 0),
            notes=data.get("notes", ""),
            recorded_via=data.get("recordedVia", "MANUAL"),
            variety=data.get("variety", "Standard")
        )
        return result
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))

@app.post("/api/inventory/stock-out")
async def api_stock_out(req: Request):
    try:
        data = await req.json()
        result = stock_out(
            crop=data.get("crop", ""),
            quantity=data.get("quantity", 0),
            unit=data.get("unit", "kg"),
            unit_price=data.get("unitPrice", 0),
            notes=data.get("notes", ""),
            recorded_via=data.get("recordedVia", "MANUAL")
        )
        return result
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))

@app.post("/api/inventory/adjust")
async def api_stock_adjust(req: Request):
    try:
        data = await req.json()
        result = stock_adjustment(
            crop=data.get("crop", ""),
            quantity_change=data.get("quantityChange", 0),
            unit=data.get("unit", "kg"),
            reason=data.get("reason", "Audit"),
            authorized_by=data.get("authorizedBy", "Farmer")
        )
        return result
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))

@app.get("/api/inventory/transactions")
def api_get_transactions():
    return {"success": True, "transactions": get_transactions()}

# 4. Smart Alerts (FR-12)
@app.get("/api/alerts")
def api_get_alerts():
    return {"success": True, "alerts": get_smart_alerts()}

# 5. Voice & Multilingual NLU Engine (FR-07, FR-08, FR-10, FR-11)
@app.post("/api/voice/nlu")
async def api_voice_nlu(req: Request):
    try:
        data = await req.json()
        text = data.get("text", "")
        preferred_lang = data.get("preferredLanguage")

        parsed = parse_voice_input(text)

        spoken_response = ""
        answer_text = ""

        if parsed["intent"] == "QUERY_STOCK":
            if parsed["crop"]:
                item = get_stock_by_crop(parsed["crop"])
                if item:
                    lang = preferred_lang or parsed["language"]
                    val = item["quantity"] * item["unitPrice"]
                    if lang == "te":
                        spoken_response = f"మీ వద్ద ప్రస్తుతం {item['quantity']} {item['unit']} {item['crop']} స్టాక్ ఉంది. దీని అంచనా విలువ సుమారు {val:,.0f} రూపాయలు."
                        answer_text = f"ప్రస్తుత స్టాక్: {item['quantity']} {item['unit']} ({item['crop']}) - మార్కెట్ విలువ: ₹{val:,.0f}"
                    elif lang == "hi":
                        spoken_response = f"आपके पास वर्तमान में {item['quantity']} {item['unit']} {item['crop']} उपलब्ध है। कुल मूल्य लगभग ₹{val:,.0f} है।"
                        answer_text = f"वर्तमान स्टॉक: {item['quantity']} {item['unit']} ({item['crop']}) - कुल मूल्य: ₹{val:,.0f}"
                    else:
                        spoken_response = f"You currently have {item['quantity']} {item['unit']} of {item['crop']} in stock, valued at approximately ₹{val:,.0f}."
                        answer_text = f"Current stock: {item['quantity']} {item['unit']} ({item['crop']}) - Estimated value: ₹{val:,.0f}"
                else:
                    spoken_response = f"Sorry, {parsed['crop']} is not found in your inventory."
                    answer_text = f"No stock records found for {parsed['crop']}."
            else:
                inv = get_inventory()
                items_str = ", ".join([f"{i['crop']}: {i['quantity']} {i['unit']}" for i in inv])
                spoken_response = f"Your inventory summary: {items_str}"
                answer_text = f"Inventory: {items_str}"

        elif parsed["intent"] == "QUERY_PRICE":
            prices = get_mandi_prices()
            match = next((p for p in prices if parsed["crop"] and p["crop"].lower() == parsed["crop"].lower()), prices[0] if prices else None)
            if match:
                spoken_response = f"Latest {match['crop']} rate at {match['market']} is ₹{match['modalPrice']} per {match['unit']}. Trend is {match['trend']}."
                answer_text = f"{match['market']} - {match['crop']}: ₹{match['modalPrice']}/{match['unit']} ({match['trend']})"

        elif parsed["intent"] == "DIAGNOSE_CROP":
            lang = preferred_lang or parsed["language"]
            spoken_response = (
                "AI పంట డాక్టర్ తెరవబడుతుంది. ఆకు వ్యాధిని తనిఖీ చేయండి." if lang == "te" else
                "AI फसल डॉक्टर खोला जा रहा है। पत्ती रोग की जांच करें।" if lang == "hi" else
                "Opening AI Crop Doctor to diagnose leaf disease."
            )
            answer_text = "AI Crop Doctor: Ready for photo diagnosis."

        elif parsed["intent"] == "FIND_STORAGE":
            lang = preferred_lang or parsed["language"]
            spoken_response = (
                "సమీప శీతల గిడ్డంగులను (కోల్డ్ స్టోరేజ్) కనుగొనడం." if lang == "te" else
                "निकटतम कोल्ड स्टोरेज सुविधाओं की खोज की जा रही है।" if lang == "hi" else
                "Discovering nearest cold storage facilities."
            )
            answer_text = "Cold Storage: Controlled-atmosphere facilities located."

        elif parsed["intent"] == "FIND_LOGISTICS":
            lang = preferred_lang or parsed["language"]
            spoken_response = (
                "రవాణా లారీ మరియు ట్రక్ బుకింగ్ క్యాలిక్యులేటర్ తెరవబడుతుంది." if lang == "te" else
                "माल ढुलाई ट्रक बुकिंग कैलकुलेटर खोला जा रहा है।" if lang == "hi" else
                "Opening freight transport & truck booking calculator."
            )
            answer_text = "Freight Logistics: Verified rural transport vehicles found."

        return {
            "success": True,
            "parsed": parsed,
            "answerText": answer_text,
            "spokenResponse": spoken_response
        }
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))

# 6. AI Crop Doctor Diagnosis (FR-13, FR-14)
@app.post("/api/crop-doctor/diagnose")
async def api_crop_doctor_diagnose(
    crop: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None)
):
    try:
        crop_hint = crop or (image.filename if image else "Tomato")
        file_meta = None
        if image:
            content = await image.read()
            file_meta = {
                "filename": image.filename,
                "size": len(content),
                "mimetype": image.content_type
            }
        result = diagnose_crop_image(crop_hint, file_meta)
        return result
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))

@app.get("/api/crop-doctor/diseases")
def api_crop_doctor_diseases():
    return {"success": True, "diseases": get_all_known_diseases()}

# 7. Mandi Prices (FR-15)
@app.get("/api/market/prices")
def api_get_mandi_prices():
    return {"success": True, "mandiPrices": get_mandi_prices()}

@app.post("/api/market/prices")
async def api_post_mandi_prices(req: Request):
    try:
        body = await req.json()
        market = body.get("market")
        crop = body.get("crop")
        modal_price = body.get("modalPrice")
        trend = body.get("trend", "up")
        return update_mandi_price(market, crop, float(modal_price), trend)
    except Exception as err:
        raise HTTPException(status_code=400, detail=str(err))

# 8. Marketplace & Direct Consumer Orders (FR-16)
@app.get("/api/marketplace/listings")
def api_get_listings():
    return {"success": True, "listings": get_marketplace_listings()}

@app.post("/api/marketplace/listings")
async def api_create_listing(req: Request):
    try:
        data = await req.json()
        listing = create_marketplace_listing(data)
        return {"success": True, "listing": listing}
    except Exception as err:
        raise HTTPException(status_code=400, detail=str(err))

@app.post("/api/marketplace/listings/{listing_id}/offer")
async def api_submit_offer(listing_id: str, req: Request):
    try:
        data = await req.json()
        result = submit_buyer_offer(listing_id, data)
        return result
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))

@app.post("/api/marketplace/listings/{listing_id}/accept")
async def api_accept_request(listing_id: str, req: Request):
    try:
        data = await req.json()
        result = accept_marketplace_request(listing_id, data)
        return result
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))

# 9. FPO Module (FR-17)
@app.get("/api/fpo/aggregations")
def api_get_fpos():
    return {"success": True, "aggregations": get_fpo_aggregations()}

@app.post("/api/fpo/aggregations")
async def api_create_fpo(req: Request):
    try:
        data = await req.json()
        lot = create_fpo_aggregation(data)
        return {"success": True, "lot": lot}
    except Exception as err:
        raise HTTPException(status_code=400, detail=str(err))

@app.post("/api/fpo/aggregations/{lot_id}/contribute")
async def api_contribute_fpo(lot_id: str, req: Request):
    try:
        data = await req.json()
        result = add_fpo_contribution(
            lot_id=lot_id,
            farmer_name=data.get("farmerName", "Farmer Member"),
            quantity=float(data.get("quantity", 0)),
            unit=data.get("unit")
        )
        return result
    except Exception as err:
        raise HTTPException(status_code=400, detail=str(err))

@app.post("/api/fpo/aggregations/{lot_id}/tender")
async def api_tender_fpo(lot_id: str, req: Request):
    try:
        data = await req.json()
        buyer = data.get("buyer")
        status = data.get("status")
        counter_rate = data.get("counterRate") or data.get("proposedRate")
        if status in ("CONFIRMED", "REJECTED", "IN_NEGOTIATION"):
            return update_fpo_tender_status(lot_id, buyer, status, counter_rate)
        return add_fpo_tender(lot_id, buyer, float(counter_rate), status or "IN_NEGOTIATION")
    except Exception as err:
        raise HTTPException(status_code=400, detail=str(err))

# 10. Cold Storage Discovery (FR-18)
@app.get("/api/storage/facilities")
def api_get_cold_storages():
    return {"success": True, "coldStorages": get_cold_storages()}

@app.get("/api/storage/bookings")
def api_get_storage_bookings():
    return {"success": True, "bookings": get_cold_storage_bookings()}

@app.post("/api/storage/book")
async def api_book_storage(req: Request):
    try:
        body = await req.json()
        booking = book_cold_storage(body)
        return {
            "success": True,
            "booking": booking,
            "message": f"Reservation confirmed at {booking.get('facilityName')}. Ref: {booking.get('bookingId')}"
        }
    except Exception as err:
        raise HTTPException(status_code=400, detail=str(err))

@app.delete("/api/storage/bookings/{booking_id}")
def api_cancel_storage_booking(booking_id: str):
    try:
        return cancel_cold_storage_booking(booking_id)
    except Exception as err:
        raise HTTPException(status_code=400, detail=str(err))

# 11. Logistics & Freight Calculator (FR-19)
@app.get("/api/logistics/providers")
def api_get_logistics():
    return {"success": True, "vehicles": get_logistics()}

@app.get("/api/logistics/trips")
def api_get_logistics_trips():
    return {"success": True, "trips": get_logistics_bookings()}

@app.post("/api/logistics/book")
async def api_book_logistics_trip_endpoint(req: Request):
    try:
        body = await req.json()
        trip = book_logistics_vehicle(body)
        return {
            "success": True,
            "trip": trip,
            "message": f"Vehicle booked successfully! Booking Ref: {trip.get('bookingRef')}"
        }
    except Exception as err:
        raise HTTPException(status_code=400, detail=str(err))

@app.patch("/api/logistics/trips/{booking_ref}")
async def api_patch_trip_endpoint(booking_ref: str, req: Request):
    try:
        body = await req.json()
        return update_logistics_trip_status(booking_ref, body.get("status", "COMPLETED"))
    except Exception as err:
        raise HTTPException(status_code=400, detail=str(err))

@app.post("/api/logistics/estimate")
async def api_estimate_freight(req: Request):
    try:
        body = await req.json()
        dist = float(body.get("distanceKm", 25))
        veh_id = body.get("vehicleId")

        vehicles = get_logistics()
        vehicle = next((v for v in vehicles if v["id"] == veh_id), vehicles[0] if vehicles else {})

        base_fare = vehicle.get("baseFare", 350)
        rate_km = vehicle.get("ratePerKm", 15)
        total_freight = round(base_fare + (dist * rate_km))

        return {
            "success": True,
            "estimate": {
                "vehicleType": vehicle.get("vehicleType", "Tata Ace"),
                "distanceKm": dist,
                "baseFare": base_fare,
                "ratePerKm": rate_km,
                "totalFreight": total_freight,
                "driverName": vehicle.get("driverName", "Rural Driver"),
                "driverPhone": vehicle.get("driverPhone", "+919700000000"),
                "vehicleNumber": vehicle.get("vehicleNumber", "AP 07 TA 1422"),
                "etaMinutes": vehicle.get("etaMinutes", 25)
            }
        }
    except Exception as err:
        raise HTTPException(status_code=400, detail=str(err))

# 12. Offline Sync (FR-20)
@app.post("/api/sync/batch")
async def api_sync_batch(req: Request):
    try:
        body = await req.json()
        txs = body.get("transactions")
        if not isinstance(txs, list):
            raise HTTPException(status_code=400, detail="transactions must be an array.")
        result = sync_batch_transactions(txs)
        return result
    except HTTPException:
        raise
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 5050))
    print(f"🌾 FarmNexus Python API Server starting on port {port}...")
    print(f"🔗 Swagger UI: http://localhost:{port}/docs")
    uvicorn.run(app, host="0.0.0.0", port=port)
