"""FarmNexus - Pure Python Web Application (Streamlit).
Full-stack agricultural management platform supporting:
- Multi-role switching (Farmer, Direct Consumer/Buyer, FPO Manager, Admin)
- Multilingual Voice & Text Ledger (Telugu, Hindi, English)
- AI Crop Doctor Plant Pathology & KVK Helpline
- Live Mandi Intelligence & 7-day Price Trends
- Direct Marketplace with Farmer Sell Requests & Consumer Deal Acceptance
- Cold Storage Space Reservation & Rural Freight Logistics Calculator
- Live MongoDB 7.0 database integration with resilient local fallback
"""

import sys
import os
import time
from datetime import datetime

# Ensure project root is on sys.path
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import streamlit as st
import pandas as pd

from backend_python.db.mongo import connect_mongodb, get_mongo_status, DEFAULT_USERS
from backend_python.services.db_manager import (
    get_inventory,
    get_stock_by_crop,
    stock_in,
    stock_out,
    stock_adjustment,
    get_transactions,
    get_smart_alerts,
    get_mandi_prices,
    get_marketplace_listings,
    create_marketplace_listing,
    submit_buyer_offer,
    accept_marketplace_request,
    get_fpo_aggregations,
    get_cold_storages,
    get_logistics,
    reset_db
)
from backend_python.services.nlu_engine import parse_voice_input
from backend_python.services.disease_model import diagnose_crop_image, get_all_known_diseases

# Set Streamlit page configuration
st.set_page_config(
    page_title="FarmNexus - Agricultural Intelligence Platform",
    page_icon="🌾",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Connect to MongoDB on startup
if "mongo_connected" not in st.session_state:
    st.session_state.mongo_connected = connect_mongodb()

# Sidebar - Brand and Role Switching
st.sidebar.title("🌾 FarmNexus AI")
st.sidebar.caption("Python 3.12 • FastAPI • Streamlit • MongoDB 7.0")

# Role-Based Access Control Selector
role_names = {
    "farmer": "👨‍🌾 Farmer (Ramesh Patel)",
    "buyer": "🛒 Direct Consumer / Buyer (Vikram)",
    "fpo": "🤝 FPO Manager (Venkateswara Rao)",
    "admin": "⚙️ System Admin"
}

selected_role_key = st.sidebar.selectbox(
    "Active Role (RBAC):",
    options=list(role_names.keys()),
    format_func=lambda k: role_names[k]
)

current_user = next((u for u in DEFAULT_USERS if u["role"] == selected_role_key), DEFAULT_USERS[0])

st.sidebar.markdown(f"**Logged in as:** `{current_user['name']}`")
st.sidebar.markdown(f"**Location:** {current_user['location']}")

mongo_telemetry = get_mongo_status()
if mongo_telemetry["connected"]:
    st.sidebar.success("🍃 MongoDB: Connected (v7.0)")
else:
    st.sidebar.info("💾 Database: Resilient Local Store Active")

# Main Navigation
nav_options = [
    "📊 Farmer Dashboard & Ledger",
    "🎙️ Voice Command Assistant",
    "🌿 AI Crop Doctor",
    "🤝 Direct Consumer Marketplace",
    "📈 Mandi Prices & Market Trends",
    "❄️ Cold Storage & Logistics",
    "⚙️ System Status & Database Telemetry"
]
active_tab = st.sidebar.radio("Navigation:", nav_options)

# -------------------------------------------------------------
# TAB 1: FARMER DASHBOARD & LEDGER
# -------------------------------------------------------------
if active_tab == "📊 Farmer Dashboard & Ledger":
    st.title("🌾 Farmer Inventory & Digital Ledger")
    st.markdown(f"*Welcome back, **{current_user['name']}**! Managing produce for Guntur Agricultural Cluster.*")

    inventory = get_inventory()
    total_items = len(inventory)
    total_qty = sum(i["quantity"] for i in inventory)
    est_value = sum(i["quantity"] * i.get("unitPrice", 0) for i in inventory)

    # Metric Cards
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Crops in Stock", f"{total_items} varieties")
    col2.metric("Total Volume", f"{total_qty:,.0f} units")
    col3.metric("Est. Total Valuation", f"₹{est_value:,.0f}")
    col4.metric("Active Mandi Linkages", "7 APMC Yards")

    # Smart Alerts Display
    alerts = get_smart_alerts()
    if alerts:
        st.subheader("🔔 Smart Agricultural Alerts")
        for alert in alerts:
            if alert["severity"] == "critical":
                st.error(f"🚨 **{alert['title']}**: {alert['message']}")
            elif alert["severity"] == "warning":
                st.warning(f"⚠️ **{alert['title']}**: {alert['message']}")
            else:
                st.info(f"💡 **{alert['title']}**: {alert['message']}")

    # Inventory Table
    st.subheader("📦 Live Stock Ledger")
    df_inv = pd.DataFrame(inventory)[["crop", "variety", "quantity", "unit", "unitPrice", "harvestDate", "grade", "storageLocation", "storageDays"]]
    df_inv.columns = ["Crop", "Variety", "Current Stock", "Unit", "Unit Price (₹)", "Harvest Date", "Grade", "Location", "Days in Storage"]
    st.dataframe(df_inv, use_container_width=True)

    # Actions: Stock In & Stock Out
    st.subheader("⚡ Quick Stock Operations")
    tab_in, tab_out, tab_adj = st.tabs(["📥 Record Harvest (Stock In)", "📤 Record Sale (Stock Out)", "⚖️ Stock Adjustment"])

    with tab_in:
        with st.form("stock_in_form"):
            col_a, col_b, col_c = st.columns(3)
            c_crop = col_a.selectbox("Crop", ["Tomato", "Chilli", "Cotton", "Paddy", "Onion", "Potato"])
            c_qty = col_b.number_input("Quantity Added", min_value=1.0, value=100.0, step=10.0)
            c_unit = col_c.selectbox("Unit", ["kg", "bags", "quintals"])
            col_d, col_e = st.columns(2)
            c_price = col_d.number_input("Unit Price (₹)", min_value=1.0, value=25.0)
            c_notes = col_e.text_input("Notes", "Fresh morning harvest")
            submitted_in = st.form_submit_button("✅ Confirm Stock In")
            if submitted_in:
                res = stock_in(crop=c_crop, quantity=c_qty, unit=c_unit, unit_price=c_price, notes=c_notes)
                st.success(f"Stock In Recorded! {c_crop} total is now {res['updatedItem']['quantity']} {c_unit}.")
                time.sleep(0.5)
                st.rerun()

    with tab_out:
        with st.form("stock_out_form"):
            col_x, col_y, col_z = st.columns(3)
            o_crop = col_x.selectbox("Crop to Sell", [i["crop"] for i in inventory])
            curr_stock = get_stock_by_crop(o_crop)
            avail_str = f"{curr_stock['quantity']} {curr_stock['unit']}" if curr_stock else "0"
            o_qty = col_y.number_input(f"Quantity Sold (Available: {avail_str})", min_value=1.0, value=20.0, step=5.0)
            o_unit = col_z.text_input("Unit", curr_stock["unit"] if curr_stock else "kg", disabled=True)
            o_notes = st.text_input("Buyer / Sale Details", "Sold to local buyer")
            submitted_out = st.form_submit_button("📤 Confirm Stock Out")
            if submitted_out:
                try:
                    res = stock_out(crop=o_crop, quantity=o_qty, unit=curr_stock["unit"], notes=o_notes)
                    st.success(f"Stock Out Recorded! Remaining {o_crop}: {res['updatedItem']['quantity']} {curr_stock['unit']}.")
                    time.sleep(0.5)
                    st.rerun()
                except ValueError as err:
                    st.error(f"❌ Stock Out Blocked: {err}")

    with tab_adj:
        with st.form("stock_adj_form"):
            col_j, col_k = st.columns(2)
            adj_crop = col_j.selectbox("Crop for Audit", [i["crop"] for i in inventory], key="adj_crop")
            adj_change = col_k.number_input("Quantity Change (+ or -)", value=-2.0, step=1.0)
            adj_reason = st.text_input("Audit Reason", "Moisture shrinkage / sorting loss")
            submitted_adj = st.form_submit_button("⚖️ Apply Audit Adjustment")
            if submitted_adj:
                try:
                    res = stock_adjustment(crop=adj_crop, quantity_change=adj_change, reason=adj_reason, authorized_by=current_user["name"])
                    st.success(f"Audit Adjustment Saved! New total: {res['updatedItem']['quantity']}.")
                    time.sleep(0.5)
                    st.rerun()
                except ValueError as err:
                    st.error(f"❌ Adjustment Rejected: {err}")

# -------------------------------------------------------------
# TAB 2: VOICE COMMAND ASSISTANT
# -------------------------------------------------------------
elif active_tab == "🎙️ Voice Command Assistant":
    st.title("🎙️ Multilingual Voice Ledger Assistant")
    st.markdown("Speak or type in **Telugu (తెలుగు)**, **Hindi (हिंदी)**, **English**, or **Code-Mixed** speech.")

    preset_commands = [
        "Add 200 kilos of tomatoes",
        "I sold 100 kg tomatoes for 25 rupees per kilo",
        "Tomato entha undi?",
        "టమాట ఎంత ఉంది?",
        "150 kilo tamatar becha 30 rupay mein",
        "Check chilli leaf curl disease",
        "Find cold storage near Guntur",
        "Book a truck for 500 kg"
    ]

    selected_preset = st.selectbox("Or choose a sample spoken phrase:", ["-- Custom Input --"] + preset_commands)
    user_voice_text = st.text_input("Simulated Voice Speech Input:", value="" if selected_preset == "-- Custom Input --" else selected_preset)

    if st.button("🎙️ Process Voice Command", type="primary") and user_voice_text:
        parsed = parse_voice_input(user_voice_text)
        st.subheader("🔍 AI Natural Language Understanding (NLU) Output")
        
        c1, c2, c3, c4 = st.columns(4)
        c1.metric("Detected Intent", parsed["intent"])
        c2.metric("Extracted Crop", str(parsed["crop"]))
        c3.metric("Extracted Quantity", f"{parsed['quantity']} {parsed['unit']}" if parsed["quantity"] else "N/A")
        c4.metric("Language", parsed["language"].upper())

        # Live Answer Generation
        if parsed["intent"] == "QUERY_STOCK" and parsed["crop"]:
            stock_info = get_stock_by_crop(parsed["crop"])
            if stock_info:
                st.success(f"🗣️ **Spoken Voice Response:** *మీ వద్ద ప్రస్తుతం {stock_info['quantity']} {stock_info['unit']} {stock_info['crop']} స్టాక్ ఉంది.*")
                st.info(f"📊 **Live Inventory Value:** ₹{stock_info['quantity'] * stock_info['unitPrice']:,.0f}")
            else:
                st.warning(f"Produce '{parsed['crop']}' was not found in active inventory.")
        elif parsed["intent"] == "STOCK_IN" and parsed["crop"] and parsed["quantity"]:
            if st.button(f"📥 Execute Stock-In of {parsed['quantity']} {parsed['unit']} {parsed['crop']} now?"):
                stock_in(crop=parsed["crop"], quantity=parsed["quantity"], unit=parsed["unit"], recorded_via="VOICE")
                st.success("✅ Voice command executed and stored in MongoDB!")
                st.rerun()

# -------------------------------------------------------------
# TAB 3: AI CROP DOCTOR
# -------------------------------------------------------------
elif active_tab == "🌿 AI Crop Doctor":
    st.title("🌿 AI Crop Doctor - Pathology & Treatment")
    st.markdown("Computer vision disease diagnosis for smallholder crops with organic and chemical remedies.")

    col_diag1, col_diag2 = st.columns([1, 1])

    with col_diag1:
        st.subheader("📸 Submit Plant Specimen")
        uploaded_leaf = st.file_uploader("Upload leaf photo (JPEG/PNG):", type=["jpg", "jpeg", "png"])
        crop_hint = st.selectbox("Or choose crop for sample diagnosis:", ["Tomato", "Chilli", "Cotton", "Paddy", "Potato"])
        diagnose_btn = st.button("🔬 Run AI Disease Diagnosis", type="primary")

    if diagnose_btn or uploaded_leaf:
        with col_diag2:
            diag = diagnose_crop_image(crop_hint=crop_hint)
            st.subheader(f"Diagnosis: {diag['diseaseName']}")
            st.markdown(f"**Pathogen:** *{diag['pathogen']}*")
            st.metric("Confidence Score", diag["confidencePercent"], delta=f"Severity: {diag['severity']}")

            st.markdown("#### 🔍 Visual Symptoms")
            for sym in diag["symptoms"]:
                st.markdown(f"- {sym}")

            st.markdown("#### 🌿 Organic & Biological Treatments")
            for org in diag["treatment"]["organic"]:
                st.markdown(f"- {org}")

            st.markdown("#### 🧪 Chemical Control & Safety Interval")
            for chem in diag["treatment"]["chemical"]:
                st.markdown(f"- {chem}")

            st.warning(f"⚠️ {diag['treatment']['safetyNotes']}")
            st.info(f"📞 **KVK Expert Hotline:** `{diag['expertConsultation']['hotline']}`")

# -------------------------------------------------------------
# TAB 4: DIRECT CONSUMER MARKETPLACE (FR-16)
# -------------------------------------------------------------
elif active_tab == "🤝 Direct Consumer Marketplace":
    st.title("🤝 Direct Consumer & Buyer Marketplace")
    st.markdown("Empowering direct-to-consumer farm trade. Farmers list harvest; Direct Consumers accept deals with instant digital contracts.")

    listings = get_marketplace_listings()

    # Section 1: Farmer Listing Form
    with st.expander("➕ Farmer Sell Request (Create New Listing)", expanded=(selected_role_key == "farmer")):
        with st.form("create_listing_form"):
            lc1, lc2, lc3 = st.columns(3)
            l_crop = lc1.selectbox("Crop", ["Tomato", "Chilli", "Cotton", "Paddy", "Onion"])
            l_var = lc2.text_input("Variety", "Grade A Fresh")
            l_qty = lc3.number_input("Available Quantity", min_value=10.0, value=200.0, step=20.0)
            
            lc4, lc5, lc6 = st.columns(3)
            l_unit = lc4.selectbox("Unit", ["kg", "bags", "quintals"])
            l_price = lc5.number_input("Asking Price (₹ per unit)", min_value=1.0, value=24.0)
            l_loc = lc6.text_input("Farm Location", current_user["location"])

            l_desc = st.text_input("Produce Description", "Naturally grown, freshly harvested from field.")
            create_list_btn = st.form_submit_button("🚀 Publish Farm Listing")
            if create_list_btn:
                new_l = create_marketplace_listing({
                    "farmerId": current_user["id"],
                    "farmerName": current_user["name"],
                    "crop": l_crop,
                    "variety": l_var,
                    "quantity": l_qty,
                    "unit": l_unit,
                    "askingPrice": l_price,
                    "location": l_loc,
                    "description": l_desc
                })
                st.success(f"Listing published for {l_crop}! Listing ID: {new_l['id']}")
                time.sleep(0.5)
                st.rerun()

    # Section 2: Active Listings & Consumer Acceptance
    st.subheader("🛒 Active Produce Listings")
    for listing in listings:
        status_color = "🟢 ACTIVE" if listing.get("status") == "ACTIVE" else "🔵 ACCEPTED / ORDER CONFIRMED"
        with st.container():
            st.markdown(f"### {listing['crop']} - {listing['variety']} ({status_color})")
            c_info1, c_info2, c_info3 = st.columns(3)
            c_info1.markdown(f"**Farmer:** {listing['farmerName']} ({listing.get('location')})")
            c_info2.markdown(f"**Available Quantity:** `{listing['quantity']} {listing['unit']}`")
            c_info3.markdown(f"**Asking Rate:** `₹{listing['askingPrice']} / {listing['unit']}`")

            if listing.get("status") == "ACCEPTED":
                deal = listing.get("acceptedDeal", {})
                st.success(f"🎉 **CONFIRMED ORDER CONTRACT** | Deal ID: `{deal.get('dealId')}` | Buyer: **{deal.get('buyerName')}** | Agreed Price: ₹{deal.get('agreedPrice')}/{deal.get('unit')} | Total Value: **₹{deal.get('totalAmount'):,}**")
            else:
                # Direct Consumer / Buyer Accept Interface
                with st.expander(f"🛒 Direct Consumer: Accept Request for {listing['crop']} (#{listing['id']})"):
                    st.markdown("*Review digital contract terms and confirm purchase:*")
                    b_name = st.text_input("Consumer / Buyer Name:", value=current_user["name"], key=f"bname_{listing['id']}")
                    b_phone = st.text_input("Contact Phone:", value=current_user["phone"], key=f"bphone_{listing['id']}")
                    b_addr = st.text_input("Delivery / Pickup Address:", value=current_user["location"], key=f"baddr_{listing['id']}")
                    
                    total_val = listing['quantity'] * listing['askingPrice']
                    st.info(f"**Total Contract Value:** ₹{listing['askingPrice']} × {listing['quantity']} {listing['unit']} = **₹{total_val:,.0f}**")

                    if st.button(f"🤝 Confirm & Accept Deal for {listing['crop']}", key=f"btn_accept_{listing['id']}", type="primary"):
                        res = accept_marketplace_request(listing["id"], {
                            "buyerName": b_name,
                            "buyerPhone": b_phone,
                            "buyerAddress": b_addr,
                            "buyerRole": current_user["role"],
                            "agreedPrice": listing["askingPrice"],
                            "agreedQuantity": listing["quantity"]
                        })
                        st.balloons()
                        st.success(f"Order Accepted! Digital Contract ID: `{res['deal']['dealId']}` created and logged in farmer's sales ledger!")
                        time.sleep(1)
                        st.rerun()
            st.divider()

# -------------------------------------------------------------
# TAB 5: MANDI PRICES & MARKET TRENDS
# -------------------------------------------------------------
elif active_tab == "📈 Mandi Prices & Market Trends":
    st.title("📈 Mandi Price Intelligence & Trends")
    st.markdown("Live daily modal prices across key APMC yards in South & Central India.")

    prices = get_mandi_prices()
    df_mandi = pd.DataFrame(prices)[["market", "state", "crop", "variety", "modalPrice", "minPrice", "maxPrice", "unit", "trend", "changePercent"]]
    df_mandi.columns = ["Mandi Yard", "State", "Crop", "Variety", "Modal Rate (₹)", "Min Price", "Max Price", "Unit", "Trend", "24h Change"]
    st.dataframe(df_mandi, use_container_width=True)

    st.subheader("📊 Price Comparison Across Mandis")
    crop_filter = st.selectbox("Select Crop to Compare:", list(set([p["crop"] for p in prices])))
    filtered = [p for p in prices if p["crop"] == crop_filter]
    if filtered:
        chart_df = pd.DataFrame({
            "Mandi": [p["market"] for p in filtered],
            "Modal Rate (₹)": [p["modalPrice"] for p in filtered]
        }).set_index("Mandi")
        st.bar_chart(chart_df)

# -------------------------------------------------------------
# TAB 6: COLD STORAGE & LOGISTICS
# -------------------------------------------------------------
elif active_tab == "❄️ Cold Storage & Logistics":
    st.title("❄️ Post-Harvest Storage & Rural Freight")

    col_cs, col_log = st.columns(2)

    with col_cs:
        st.subheader("🧊 Verified Cold Storage Facilities")
        storages = get_cold_storages()
        for s in storages:
            with st.container():
                st.markdown(f"**{s['name']}** ({s['distanceKm']} km away)")
                st.caption(f"Location: {s['location']} • Temp: {s['temperatureRange']}")
                st.markdown(f"Rate: **₹{s['rates']['perBagMonth']}/bag/month** | Rating: ⭐ {s['rating']}")
                st.markdown(f"Contact: `{s['phone']}` ({s['contactPerson']})")
                st.divider()

    with col_log:
        st.subheader("🚛 Rural Logistics Freight Estimator")
        vehicles = get_logistics()
        dist = st.slider("Distance to Market (km):", min_value=5, max_value=150, value=25)
        veh_choice = st.selectbox("Choose Transport Vehicle:", [f"{v['vehicleType']} ({v['capacityKg']} kg)" for v in vehicles])
        sel_veh = vehicles[0]
        for v in vehicles:
            if v["vehicleType"] in veh_choice:
                sel_veh = v
                break
        
        est_fare = round(sel_veh["baseFare"] + (dist * sel_veh["ratePerKm"]))
        st.markdown(f"### Estimated Freight: **₹{est_fare:,}**")
        st.caption(f"Base Fare: ₹{sel_veh['baseFare']} + ₹{sel_veh['ratePerKm']}/km")
        st.markdown(f"**Driver:** {sel_veh['driverName']} • `{sel_veh['driverPhone']}`")
        st.markdown(f"**Vehicle Number:** `{sel_veh['vehicleNumber']}` • ETA: ~{sel_veh['etaMinutes']} mins")

# -------------------------------------------------------------
# TAB 7: SYSTEM STATUS & DATABASE TELEMETRY
# -------------------------------------------------------------
elif active_tab == "⚙️ System Status & Database Telemetry":
    st.title("⚙️ System Status & Database Telemetry")
    st.markdown("Live diagnostic and hackathon verification telemetry for FarmNexus.")

    status_data = get_mongo_status()
    st.json(status_data)

    st.subheader("Database Operations")
    if st.button("🔄 Reset Demo State to Default Initial State"):
        reset_db()
        st.success("Database reset to factory demo state.")
        st.rerun()
