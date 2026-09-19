"""Multilingual and Code-Mixed Natural Language Understanding (NLU) Engine for FarmNexus.
Supports English, Hindi, Telugu, and Code-Mixed (Hinglish/Telugish).
"""

import re
from typing import Dict, Any, Optional

CROP_SYNONYMS = {
    "Tomato": ["tomato", "tomatoes", "tamatar", "tamata", "thakkali", "టమాట", "టమోటా", "टमाटर"],
    "Chilli": ["chilli", "chilly", "chillies", "mirchi", "mirapakaya", "mirchiya", "మిర్చి", "మిరపకాయ", "मिर्च", "मिर्ची"],
    "Cotton": ["cotton", "kapas", "pathi", "patti", "పత్తి", "कपास"],
    "Paddy": ["paddy", "rice", "dhan", "vadlu", "biyyam", "వరి", "ధాన్యం", "धान", "चावल"],
    "Onion": ["onion", "onions", "pyaz", "kanda", "ullipaya", "ulli", "ఉల్లిపాయ", "प्याज़", "कांदा"],
    "Potato": ["potato", "potatoes", "aloo", "alu", "bangaladumpa", "బంగాళాదుంప", "आलू"],
    "Mango": ["mango", "mangoes", "aam", "mamidi", "mamidikaya", "మామిడి", "आम"]
}

UNIT_SYNONYMS = {
    "kg": ["kg", "kgs", "kilo", "kilos", "kilogram", "kilograms", "కిలో", "కిలోలు", "किलो", "किग्रा"],
    "bags": ["bag", "bags", "basta", "baste", "bothi", "bastha", "బస్తా", "బస్తాలు", "बोरी", "कट्टा", "थैला"],
    "tonnes": ["tonne", "tonnes", "ton", "tons", "quintal", "quintals", "క్వింటా", "టన్ను", "टन", "क्विंटल"],
    "cartons": ["carton", "cartons", "dabba", "petti", "పెట్టె", "బాక్స్", "कार्टन", "पेटी"],
    "boxes": ["box", "boxes", "pette", "crates", "crate", "బాక్సులు", "క్రేట్", "क्रैट", "बक्सा"],
    "pieces": ["piece", "pieces", "nag", "nug", "items", "count", "ముక్కలు", "నగలు", "नग", "पीस"],
    "dozens": ["dozen", "dozens", "darjan", "డజన్", "दर्जन"],
    "litres": ["litre", "litres", "liter", "liters", "ltr", "లీటర్", "लीटर"]
}

def detect_language(text: str) -> str:
    if not text:
        return "en"
    # Telugu unicode range: \u0C00-\u0C7F
    if re.search(r'[\u0C00-\u0C7F]', text):
        return "te"
    # Devanagari unicode range: \u0900-\u097F
    if re.search(r'[\u0900-\u097F]', text):
        return "hi"
    
    lower = text.lower()
    # Telugu romanized keywords
    if re.search(r'\b(entha|undi|undhi|ammamu|ammey|ammali|vesanu|kalupu|poyindi|pettamu|dharalu|rogam|purugu|dabbulu)\b', lower):
        return "te"
    # Hindi romanized keywords
    if re.search(r'\b(kitna|hai|becha|bech|daalo|jodo|nikalo|bhaav|rate|bimari|keeda|paisa|rupay|rupaya)\b', lower):
        return "hi"
    return "en"

def parse_voice_input(speech_text: str) -> Dict[str, Any]:
    if not speech_text or not isinstance(speech_text, str):
        return {
            "intent": "UNKNOWN",
            "confidence": 0.0,
            "originalText": "",
            "clarificationNeeded": True,
            "message": "Please speak or enter your stock transaction or question."
        }

    raw = speech_text.strip()
    lower = raw.lower()
    lang = detect_language(raw)

    # 1. Detect Intent
    intent = "UNKNOWN"
    confidence = 0.85

    is_stock_in = bool(re.search(r'\b(add|stock in|inward|harvested|received|brought|daalo|jodo|rakho|vesanu|kalupu|pettamu|vachindi|chera)\b', lower))
    is_stock_out = bool(re.search(r'\b(sold|sell|sale|stock out|outward|dispatched|becha|becho|nikalo|ammamu|ammey|poyindi|theey)\b', lower))
    is_stock_query = bool(re.search(r'\b(entha undi|entha undhi|undha|how much|how many|kitna hai|kya stock|available|balance|current stock|sthaiti)\b', lower))
    is_price_query = bool(re.search(r'\b(market price|mandi rate|bhaav|rate|price|dharalu|rate entha|bhaav kya hai)\b', lower))
    is_disease_query = bool(re.search(r'\b(disease|pest|bimari|rogam|keeda|purugu|leaf|spot|curl|blight|cure|treatment)\b', lower))
    is_storage_query = bool(re.search(r'\b(cold storage|storage|warehouse|godown|sheetagruha)\b', lower))
    is_logistics_query = bool(re.search(r'\b(truck|transport|logistics|lorry|auto|vehicle|chota hathi|gaadi)\b', lower))

    if is_stock_in and not is_stock_out:
        intent = "STOCK_IN"
    elif is_stock_out:
        intent = "STOCK_OUT"
    elif is_stock_query:
        intent = "QUERY_STOCK"
    elif is_price_query:
        intent = "QUERY_PRICE"
    elif is_disease_query:
        intent = "DIAGNOSE_CROP"
    elif is_storage_query:
        intent = "FIND_STORAGE"
    elif is_logistics_query:
        intent = "FIND_LOGISTICS"
    else:
        if re.search(r'\d+', lower):
            intent = "STOCK_IN"
            confidence = 0.70

    # 2. Extract Crop
    matched_crop = None
    for crop, synonyms in CROP_SYNONYMS.items():
        for syn in synonyms:
            regex = rf'\b{re.escape(syn)}\b'
            if re.search(regex, lower, re.IGNORECASE) or syn.lower() in lower:
                matched_crop = crop
                break
        if matched_crop:
            break

    # 3. Extract Quantity
    matched_quantity = None
    qty_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:kg|kilos?|bags?|tonnes?|quintals?|cartons?|boxes?|pieces?|basta|bothi|katta)?', lower)
    if qty_match:
        matched_quantity = float(qty_match.group(1))

    # 4. Extract Unit
    matched_unit = "kg"
    for unit, synonyms in UNIT_SYNONYMS.items():
        for syn in synonyms:
            regex = rf'\b{re.escape(syn)}\b'
            if re.search(regex, lower, re.IGNORECASE):
                matched_unit = unit
                break

    # 5. Extract Price
    matched_price = None
    all_numbers = [float(n) for n in re.findall(r'(\d+(?:\.\d+)?)', lower)]
    if len(all_numbers) >= 2:
        matched_quantity = all_numbers[0]
        matched_price = all_numbers[1]

    # Validation & Clarification
    clarification_needed = False
    clarification_prompt = ""

    if (intent in ["STOCK_IN", "STOCK_OUT"]) and matched_quantity is None:
        clarification_needed = True
        clarification_prompt = (
            "దయచేసి ఎంత పరిమాణం (క్వాంటిటీ) చెప్పండి." if lang == "te" else
            "कृपया फसल की मात्रा (Quantity) बताएं।" if lang == "hi" else
            "Please specify the quantity of produce."
        )

    if (intent in ["STOCK_IN", "STOCK_OUT", "QUERY_STOCK"]) and matched_crop is None:
        clarification_needed = True
        clarification_prompt = (
            "దయచేసి ఏ పంట కోసం రికార్డ్ చేయాలనుకుంటున్నారో చెప్పండి (ఉదా. టమాటా, మిర్చి)." if lang == "te" else
            "कृपया फसल का नाम बताएं (जैसे टमाटर, मिर्च, कपास)।" if lang == "hi" else
            "Please mention which crop you are referring to (e.g. Tomato, Chilli)."
        )

    return {
        "intent": intent,
        "crop": matched_crop,
        "quantity": matched_quantity,
        "unit": matched_unit,
        "price": matched_price,
        "language": lang,
        "confidence": confidence,
        "clarificationNeeded": clarification_needed,
        "clarificationPrompt": clarification_prompt,
        "originalText": raw
    }
