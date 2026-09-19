# 🌾 FarmNexus — Python AI Platform for Farmers & Direct Agri-Marketplace

> **Hackathon Edition (Version 2.0 — Python Native)**  
> *Voice-First AI Platform for Smart Crop Care & Direct Market Access*  
> *Built with **Python FastAPI**, **PyMongo**, **MongoDB 7.0**, **Streamlit**, and **React 18**.*

---

## 🐍 Python Platform Quick Start

FarmNexus is fully implemented in **Python 3.12**! You can run the Python FastAPI backend, the Streamlit full-stack web app, or the 15/15 automated Python test suite using the handy launcher script:

### 1. Launch FastAPI Backend (Port 5050):
```bash
./run_python.sh api
# OR directly:
python3 -m uvicorn backend_python.main:app --port 5050 --reload
```
- **Interactive Swagger UI (API Explorer)**: [http://localhost:5050/docs](http://localhost:5050/docs)
- **ReDoc Interactive Documentation**: [http://localhost:5050/redoc](http://localhost:5050/redoc)
- **Health Check & Telemetry**: [http://localhost:5050/api/health](http://localhost:5050/api/health)
- **MongoDB Status**: [http://localhost:5050/api/db/status](http://localhost:5050/api/db/status)

### 2. Run Pure Python Full-Stack App (Streamlit - Port 8501):
```bash
./run_python.sh web
# OR directly:
streamlit run streamlit_app.py --server.port 8501
```
- **Streamlit Web Dashboard**: [http://localhost:8501](http://localhost:8501)
- Features all modules in 100% pure Python:
  - Role-based login (Farmer, Direct Consumer, FPO, Admin)
  - Multilingual voice NLU assistant (Telugu, Hindi, English)
  - AI Crop Doctor pathology & treatment guide
  - Direct Consumer Marketplace with instant digital trade contracts
  - Mandi price trends and comparison charts
  - Cold storage directory & rural logistics freight calculator

### 3. Run Automated Python Test Suite (15/15 Passed):
```bash
./run_python.sh test
# OR directly:
python3 backend_python/test_suite.py
```

### 4. Run Both FastAPI & Streamlit Concurrently:
```bash
./run_python.sh both
```

---

## 🌐 Live Web Interfaces

- **Pure Python Streamlit App**: [http://localhost:8501](http://localhost:8501)
- **React Frontend Application**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Backend API**: [http://localhost:5050/api/health](http://localhost:5050/api/health)
- **Interactive Swagger UI**: [http://localhost:5050/docs](http://localhost:5050/docs)
- **MongoDB Health & Status**: [http://localhost:5050/api/db/status](http://localhost:5050/api/db/status)

---

## 🔐 Role-Based Access Control (RBAC) & Personas

FarmNexus features a dedicated role-based portal with custom workflows per persona:

| Persona | Purpose | Default Credentials | Authorized Access |
|---|---|---|---|
| **🌾 Farmer (రైతు)** | Voice stock entry, crop health, mandi rates, direct sales | Mobile: `9876543210`<br>OTP: `1234` | Dashboard, Stock/Produce, AI Crop Doctor, Mandi Rates, Marketplace, Cold Storage, Logistics |
| **🛒 Direct Consumer / Buyer** | Direct farm sourcing, accept farmer sell requests with contracts | Phone: `9848012345`<br>Password: `buyer123` | Direct Marketplace, Mandi Rates, Cold Storage, Logistics |
| **🤝 FPO Manager** | Collective produce aggregation & bulk selling | Reg No: `FPO-AP-GNT-2022-098`<br>PIN: `fpo123` | FPO Pooling Hub, Produce Ledger, Mandi Rates, Cold Storage |
| **⚙️ System Admin** | Platform monitoring, audit trails & database governance | Email: `admin@farmnexus.gov.in`<br>Key: `admin123` | Full Command Center, User Directory, Audit Logs, Mandi Feeds, DB Telemetry |

---

## 🍃 MongoDB & PyMongo Database Layer
 
- **Active Local Database**: **MongoDB Community 7.0.43** installed locally on macOS and actively listening on port `27017`.
- **Database Connection**: `mongodb://127.0.0.1:27017/farmnexus` connected via PyMongo with real-time bidirectional synchronization.
- **Collections Managed**:
  1. `users` (Farmer, Buyer, FPO, Admin)
  2. `inventories` (Live stock ledger)
  3. `transactions` (Stock in, stock out, audit logs)
  4. `mandiprices` (APMC yards & 7-day trend histories)
  5. `marketplacelistings` (Active farm lots & accepted deals)
  6. `fpoaggregations` (Collective bulk pools)
  7. `coldstorages` (Controlled-atmosphere facilities)
  8. `logistics` (Verified rural transport fleet)
- **Resilient Fallback Guarantee**: If MongoDB is stopped, FarmNexus automatically operates on its resilient local store (`data/db.json`) so your hackathon demo **never crashes**!

---

## 🎙️ Multilingual Voice-First Architecture

FarmNexus delivers a completely voice-guided experience designed specifically for smallholder farmers:

- **Natural Language Understanding (NLU)**: Native Python parser for English, Telugu (`te`), Hindi (`hi`), and code-mixed speech (*"Tomato entha undi?"*, *"tamatar kitna hai"*).
- **Text-to-Speech (TTS)**: Verbal responses in Telugu, Hindi, or English.
- **Stock Automation**: Direct translation of spoken sentences like *"Add 200 kilos of tomatoes"* or *"I sold 100 kg tomatoes for 25 rupees per kilo"* into structured database mutations.

---

## 📋 Features Implemented (FR-01 to FR-20)

| Requirement | Feature | Python Implementation |
|---|---|---|
| **FR-01** | Role-Based Access Control & Auth | `backend_python/main.py` (`/api/auth/login`) |
| **FR-02** | Produce Management | `backend_python/services/db_manager.py` |
| **FR-03** | Stock-In (Harvest Entry) | `backend_python/services/db_manager.py` (`stock_in`) |
| **FR-04** | Stock-Out with Limit Validation | `backend_python/services/db_manager.py` (`stock_out`) |
| **FR-05** | Stock Adjustment Audit Ledger | `backend_python/services/db_manager.py` (`stock_adjustment`) |
| **FR-06** | Supported Trade Units (`kg`, `bags`, `quintals`) | `backend_python/services/nlu_engine.py` |
| **FR-07** | Spoken Stock Entry (NLU) | `backend_python/services/nlu_engine.py` (`parse_voice_input`) |
| **FR-08** | Voice Confirmation & Spoken Response | `backend_python/main.py` (`/api/voice/nlu`) |
| **FR-09** | Regional Languages (Telugu, Hindi, English) | `backend_python/services/nlu_engine.py` |
| **FR-10** | Mixed-Language NLU (*"Tomato entha undi?"*) | `backend_python/services/nlu_engine.py` |
| **FR-11** | Live Stock Voice Assistant | `backend_python/main.py` (`/api/voice/nlu`) |
| **FR-12** | Smart Farm Alerts (Low Stock, Aging, Price Surges) | `backend_python/services/db_manager.py` (`get_smart_alerts`) |
| **FR-13** | AI Crop Image Diagnosis | `backend_python/services/disease_model.py` (`diagnose_crop_image`) |
| **FR-14** | Organic & Chemical Treatment Guidance + KVK Helpline | `backend_python/services/disease_model.py` |
| **FR-15** | Mandi Market Prices & 7-Day Trend Charts | `backend_python/services/db_manager.py` (`get_mandi_prices`) |
| **FR-16** | Direct Marketplace (Farmer Requests & Consumer Deals) | `backend_python/services/db_manager.py` (`accept_marketplace_request`) |
| **FR-17** | FPO Module (Produce Pooling & Bulk Sourcing) | `backend_python/services/db_manager.py` (`get_fpo_aggregations`) |
| **FR-18** | Cold Storage Discovery & Space Booking | `backend_python/services/db_manager.py` (`get_cold_storages`) |
| **FR-19** | Logistics Support & Freight Calculator | `backend_python/services/db_manager.py` (`get_logistics`) |
| **FR-20** | Offline Mode & Batch Sync with Deduplication | `backend_python/services/db_manager.py` (`sync_batch_transactions`) |

---

## 🗂️ Python Project Directory Structure

```text
farmnexus/
├── run_python.sh                # Interactive launcher script (api, web, test, both)
├── streamlit_app.py             # Pure Python full-stack application (Streamlit)
├── README.md                    # Platform documentation
├── backend_python/
│   ├── main.py                  # FastAPI server with Swagger UI (/docs) on port 5050
│   ├── test_suite.py            # Automated test suite (15/15 tests passing)
│   ├── data/
│   │   └── seed_data.py         # Agricultural dataset (crops, users, prices, diseases)
│   ├── db/
│   │   └── mongo.py             # PyMongo MongoDB 7.0 driver & telemetry manager
│   └── services/
│       ├── db_manager.py        # Business logic, inventory, and marketplace contracts
│       ├── nlu_engine.py        # Multilingual voice NLU engine
│       └── disease_model.py     # AI Crop Doctor plant pathology & KVK guidance
├── frontend/                    # React 18 frontend (Vite) on port 3000
└── backend/                     # Node.js Express server (companion / reference)
```
