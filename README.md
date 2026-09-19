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
