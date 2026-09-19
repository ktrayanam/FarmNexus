# 🌾 FarmNexus — Voice-First AI Platform for Farmers

> **Hackathon Edition (Version 1.0)**  
> *Voice-First AI Platform for Smart Crop Care & Direct Market Access*

---

## 🚀 Quick Start in VS Code

Both frontend and backend are already set up and running on your local machine!

### To run both servers concurrently:
```bash
npm run dev
```

### To run individually:
```bash
# Terminal 1: Start Backend API (Port 5050)
cd backend && node server.js

# Terminal 2: Start Frontend Web App (Port 3000)
cd frontend && npm run dev
```

### To run the automated verification test suite:
```bash
npm test
# OR: cd backend && node test_suite.js
```

---

## 🌐 Live URLs

- **Frontend Application**: [http://localhost:3000](http://localhost:3000)
- **Backend API Server**: [http://localhost:5050/api/health](http://localhost:5050/api/health)
- **MongoDB Health & Status**: [http://localhost:5050/api/db/status](http://localhost:5050/api/db/status)

---

## 🔐 Role-Based Access Control (RBAC) & Personas

FarmNexus features a dedicated role-based login portal with custom workflows per persona:

| Persona | Purpose | Default Credentials | Authorized Access |
|---|---|---|---|
| **🌾 Farmer (రైతు)** | Voice stock entry, crop health, mandi rates, direct sales | Mobile: `9876543210`<br>OTP: `1234` | Dashboard, Stock/Produce, AI Crop Doctor, Mandi Rates, Marketplace, Cold Storage, Logistics |
| **🏢 Buyer** | Sourcing farm produce, purchase offers | Phone: `9848012345`<br>Password: `buyer123` | Direct Marketplace, Mandi Rates, Cold Storage, Logistics |
| **🤝 FPO Manager** | Collective produce aggregation & bulk selling | Reg No: `FPO-AP-GNT-2022-098`<br>PIN: `fpo123` | FPO Pooling Hub, Produce Ledger, Mandi Rates, Cold Storage |
| **⚙️ System Admin** | Platform monitoring, audit trails & database governance | Email: `admin@farmnexus.gov.in`<br>Key: `admin123` | Full Command Center, User Directory, Audit Logs, Mandi Feeds, DB Telemetry |

*Note: One-click demo login buttons are provided on the login page for instant access without typing.*

---

## 🍃 MongoDB Mongoose Database Layer
 
- **Active Local Database**: **MongoDB Community 7.0.43** installed locally on macOS via Homebrew (`sh.brew.mongodb-community`) and actively listening on port `27017`.
- **Database Connection**: `mongodb://127.0.0.1:27017/farmnexus` with 2-way real-time persistence between Mongoose models and the API.
- **Models**: `User`, `Inventory`, `Transaction`, `MandiPrice`, `MarketplaceListing`, `FpoAggregation`, `ColdStorage`, `Logistics` in `backend/models/`.
- **MongoDB Atlas Cloud (Optional)**: Set `MONGODB_URI` in `backend/.env` if you wish to use an external cloud cluster:
  ```env
  MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/farmnexus?retryWrites=true&w=majority
  ```
- **Resilient Fallback Guarantee**: If MongoDB is stopped, FarmNexus automatically operates on its resilient local store so your hackathon demo **never crashes**!

---

## 🎙️ Multilingual Voice-First Architecture

FarmNexus delivers a completely voice-guided experience designed specifically for smallholder farmers:

- **Interactive Voice Waveforms**: Visual pulsing sound wave bars during active listening.
- **Natural Language Understanding (NLU)**: Handles English, Telugu (`te-IN`), Hindi (`hi-IN`), and code-mixed speech (*"Tomato entha undi?"*, *"tamatar kitna hai"*).
- **Text-to-Speech (TTS) Engine**: Speaks responses natively in Telugu, Hindi, or English.
- **🔊 Dashboard Voice Briefing (ఆడియో బ్రీఫింగ్)**: 1-click morning briefing on the Farmer Dashboard reciting portfolio value, active stocks, and perishable alerts.
- **🔊 AI Crop Doctor Prescription (ఆడియో ప్రిస్క్రిప్షన్)**: Spoken audio diagnosis detailing pathogen severity, organic remedies, and chemical dosage.
- **🔊 Mandi Price Broadcast (ధరల ఆడియో)**: Verbal broadcast of today's live APMC mandi prices and market trends.

---

## 📋 Features Implemented (FR-01 to FR-20)

| Requirement | Feature | Location in Code |
|---|---|---|
| **FR-01** | Farmer Registration & OTP Auth | `backend/server.js`, `frontend/src/context/AuthContext.jsx` |
| **FR-02** | Produce Management | `frontend/src/components/ProduceManagement.jsx` |
| **FR-03** | Stock-In | `backend/services/dbManager.js` (`stockIn`) |
| **FR-04** | Stock-Out with Limit Validation | `backend/services/dbManager.js` (`stockOut`) |
| **FR-05** | Stock Adjustment Audit Ledger | `backend/services/dbManager.js` (`stockAdjustment`) |
| **FR-06** | Supported Trade Units (`kg`, `bags`, `tonnes`, `boxes`...) | `frontend/src/components/ProduceManagement.jsx` |
| **FR-07** | Spoken Stock Entry (Speech-to-Text & Entity Extractor) | `backend/services/nluEngine.js`, `frontend/src/components/VoiceAssistantModal.jsx` |
| **FR-08** | Voice Confirmation Modal & Audio Prompt | `frontend/src/components/VoiceConfirmationModal.jsx` |
| **FR-09** | Regional Languages (Telugu `తెలుగు`, Hindi `हिन्दी`, English) | `frontend/src/translations/{te,hi,en}.js` |
| **FR-10** | Mixed-Language NLU (*"Tomato entha undi?"*, *"tamatar kitna hai"*) | `backend/services/nluEngine.js` |
| **FR-11** | Live Stock Voice Assistant | `backend/server.js` (`/api/voice/nlu`) |
| **FR-12** | Smart Farm Alerts (Low Stock, Storage Aging, Price Surges) | `backend/services/dbManager.js` (`getSmartAlerts`) |
| **FR-13** | AI Crop Image Diagnosis | `backend/services/diseaseModel.js`, `frontend/src/components/CropDoctor.jsx` |
| **FR-14** | Organic & Chemical Treatment Guidance + KVK Helpline | `frontend/src/components/CropDoctor.jsx` |
| **FR-15** | Mandi Market Prices & 7-Day Trend Charts | `frontend/src/components/MarketPrices.jsx` |
| **FR-16** | Farmer-to-Buyer Marketplace (Listings, Offers, WhatsApp) | `frontend/src/components/Marketplace.jsx` |
| **FR-17** | FPO Module (Aggregated Produce Pooling & Bulk Tenders) | `frontend/src/components/FPOModule.jsx` |
| **FR-18** | Cold Storage Discovery & Space Booking | `frontend/src/components/ColdStorageDiscovery.jsx` |
| **FR-19** | Logistics Support & Freight Calculator | `frontend/src/components/LogisticsSupport.jsx` |
| **FR-20** | Offline Mode & Batch Sync with Deduplication | `frontend/src/services/offlineSync.js`, `backend/services/dbManager.js` |

---

## 🗂️ Project Directory Map

```text
farmnexus/
├── package.json                 # Root script runner (npm run dev, npm test)
├── README.md                    # Project documentation & guide
├── backend/
│   ├── package.json             # Express, Cors, Multer, UUID
│   ├── server.js                # Express REST API (Port 5050)
│   ├── test_suite.js            # Automated verification test suite (15 tests)
│   ├── data/
│   │   ├── seedData.js          # Realistic Indian agricultural seed data
│   │   └── db.json              # Local persistent JSON database
│   └── services/
│       ├── dbManager.js         # Inventory operations & offline sync deduplication
│       ├── nluEngine.js         # Multilingual & code-mixed voice NLU
│       └── diseaseModel.js      # AI Crop Doctor disease classifier & treatments
│
└── frontend/
    ├── package.json             # React 18, Vite, Tailwind CSS, Lucide React
    ├── vite.config.js           # Dev server config & proxy
    ├── tailwind.config.js       # Agricultural color palette
    ├── index.html               # Mobile viewport & multilingual Google fonts
    └── src/
        ├── App.jsx              # Main router & modal controller
        ├── main.jsx             # React root with Context Providers
        ├── index.css            # Styles & voice animations
        ├── components/
        │   ├── Navbar.jsx               # Top bar, language picker, offline switch
        │   ├── OfflineBanner.jsx        # Offline status & sync counter
        │   ├── VoiceAssistantModal.jsx  # Web Speech STT & NLU testing
        │   ├── VoiceConfirmationModal.jsx # FR-08 transaction confirmation
        │   ├── FarmerDashboard.jsx      # KPIs, Smart Alerts, Produce cards
        │   ├── ProduceManagement.jsx    # Stock-In, Stock-Out, Adjustment
        │   ├── CropDoctor.jsx           # AI Disease Diagnosis & KVK hotline
        │   ├── MarketPrices.jsx         # Mandi rates & 7-day trend bars
        │   ├── Marketplace.jsx          # Produce listings, buyer offers, WhatsApp
        │   ├── FPOModule.jsx            # Aggregation pools & corporate tenders
        │   ├── ColdStorageDiscovery.jsx # Facilities directory & reservations
        │   ├── LogisticsSupport.jsx     # Freight calculator & vehicle booking
        │   └── AdminPanel.jsx           # Role switcher & database reset
        ├── context/
        │   ├── AuthContext.jsx          # Multi-role support (Farmer, Buyer, FPO, Admin)
        │   ├── LanguageContext.jsx      # Translation provider (Telugu, Hindi, English)
        │   └── StockContext.jsx         # Live stock store & sync queue
        ├── translations/
        │   ├── en.js                    # English dictionary
        │   ├── te.js                    # Telugu (తెలుగు) dictionary
        │   └── hi.js                    # Hindi (हिन्दी) dictionary
        └── services/
            ├── api.js                   # REST API client
            ├── offlineSync.js           # Local storage queue & sync engine
            └── speechSynthesis.js       # Web Speech Synthesis TTS engine
```
