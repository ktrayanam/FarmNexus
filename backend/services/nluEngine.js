// Multilingual and Code-Mixed Natural Language Understanding (NLU) Engine
// Supports English, Hindi, Telugu, and Code-Mixed (Hinglish/Telugish)

const CROP_SYNONYMS = {
  Tomato: ["tomato", "tomatoes", "tamatar", "tamata", "thakkali", "టమాట", "టమోటా", "टमाटर"],
  Chilli: ["chilli", "chilly", "chillies", "mirchi", "mirapakaya", "mirchiya", "మిర్చి", "మిరపకాయ", "मिर्च", "मिर्ची"],
  Cotton: ["cotton", "kapas", "pathi", "patti", "పత్తి", "कपास"],
  Paddy: ["paddy", "rice", "dhan", "vadlu", "biyyam", "వరి", "ధాన్యం", "धान", "चावल"],
  Onion: ["onion", "onions", "pyaz", "kanda", "ullipaya", "ulli", "ఉల్లిపాయ", "प्याज़", "कांदा"],
  Potato: ["potato", "potatoes", "aloo", "alu", "bangaladumpa", "బంగాళాదుంప", "आलू"],
  Mango: ["mango", "mangoes", "aam", "mamidi", "mamidikaya", "మామిడి", "आम"]
};

const UNIT_SYNONYMS = {
  kg: ["kg", "kgs", "kilo", "kilos", "kilogram", "kilograms", "కిలో", "కిలోలు", "किलो", "किग्रा"],
  bags: ["bag", "bags", "basta", "baste", "bothi", "bastha", "బస్తా", "బస్తాలు", "बोरी", "कट्टा", "थैला"],
  tonnes: ["tonne", "tonnes", "ton", "tons", "quintal", "quintals", "క్వింటా", "టన్ను", "टन", "क्विंटल"],
  cartons: ["carton", "cartons", "dabba", "petti", "పెట్టె", "బాక్స్", "कार्टन", "पेटी"],
  boxes: ["box", "boxes", "pette", "crates", "crate", "బాక్సులు", "క్రేట్", "क्रैट", "बक्सा"],
  pieces: ["piece", "pieces", "nag", "nug", "items", "count", "ముక్కలు", "నగలు", "नग", "पीस"],
  dozens: ["dozen", "dozens", "darjan", "డజన్", "दर्जन"],
  litres: ["litre", "litres", "liter", "liters", "ltr", "లీటర్", "लीटर"]
};

export function detectLanguage(text) {
  if (!text) return "en";
  // Telugu unicode range 0C00-0C7F
  if (/[\u0C00-\u0C7F]/.test(text)) return "te";
  // Devanagari unicode range 0900-097F
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  
  const lower = text.toLowerCase();
  // Telugu romanized keywords
  if (/\b(entha|undi|undhi|ammamu|ammey|ammali|vesanu|kalupu|poyindi|pettamu|dharalu|rogam|purugu|dabbulu)\b/.test(lower)) {
    return "te";
  }
  // Hindi romanized keywords
  if (/\b(kitna|hai|becha|bech|daalo|jodo|nikalo|bhaav|rate|bimari|keeda|paisa|rupay|rupaya)\b/.test(lower)) {
    return "hi";
  }
  return "en";
}

export function parseVoiceInput(speechText) {
  if (!speechText || typeof speechText !== "string") {
    return {
      intent: "UNKNOWN",
      confidence: 0,
      originalText: "",
      clarificationNeeded: true,
      message: "Please speak or enter your stock transaction or question."
    };
  }

  const raw = speechText.trim();
  const lower = raw.toLowerCase();
  const lang = detectLanguage(raw);

  // 1. Detect Intent
  let intent = "UNKNOWN";
  let confidence = 0.85;

  // Stock In indicators
  const isStockIn = /\b(add|stock in|inward|harvested|received|brought|daalo|jodo|rakho|vesanu|kalupu|pettamu|vachindi|chera)\b/i.test(lower);
  // Stock Out indicators
  const isStockOut = /\b(sold|sell|sale|stock out|outward|dispatched|becha|becho|nikalo|ammamu|ammey|poyindi|theey)\b/i.test(lower);
  // Stock Query indicators
  const isStockQuery = /\b(entha undi|entha undhi|undha|how much|how many|kitna hai|kya stock|available|balance|current stock|sthaiti)\b/i.test(lower);
  // Price Query indicators
  const isPriceQuery = /\b(market price|mandi rate|bhaav|rate|price|dharalu|rate entha|bhaav kya hai)\b/i.test(lower);
  // Disease / Diagnosis indicators
  const isDiseaseQuery = /\b(disease|pest|bimari|rogam|keeda|purugu|leaf|spot|curl|blight|cure|treatment)\b/i.test(lower);
  // Storage indicators
  const isStorageQuery = /\b(cold storage|storage|warehouse|godown|sheetagruha)\b/i.test(lower);
  // Logistics indicators
  const isLogisticsQuery = /\b(truck|transport|logistics|lorry|auto|vehicle|chota hathi|gaadi)\b/i.test(lower);

  if (isStockIn && !isStockOut) {
    intent = "STOCK_IN";
  } else if (isStockOut) {
    intent = "STOCK_OUT";
  } else if (isStockQuery) {
    intent = "QUERY_STOCK";
  } else if (isPriceQuery) {
    intent = "QUERY_PRICE";
  } else if (isDiseaseQuery) {
    intent = "DIAGNOSE_CROP";
  } else if (isStorageQuery) {
    intent = "FIND_STORAGE";
  } else if (isLogisticsQuery) {
    intent = "FIND_LOGISTICS";
  } else {
    // Fallback: If numbers + crop are mentioned, default to stock-in unless context implies otherwise
    if (/\d+/.test(lower)) {
      intent = "STOCK_IN";
      confidence = 0.70;
    }
  }

  // 2. Extract Crop
  let matchedCrop = null;
  for (const [crop, synonyms] of Object.entries(CROP_SYNONYMS)) {
    for (const syn of synonyms) {
      const regex = new RegExp(`\\b${syn}\\b`, "i");
      if (regex.test(lower) || lower.includes(syn.toLowerCase())) {
        matchedCrop = crop;
        break;
      }
    }
    if (matchedCrop) break;
  }

  // 3. Extract Quantity
  let matchedQuantity = null;
  // Match patterns like "200 kg", "100", "50.5"
  const qtyMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilos?|bags?|tonnes?|quintals?|cartons?|boxes?|pieces?|basta|bothi|katta)?/i);
  if (qtyMatch) {
    matchedQuantity = parseFloat(qtyMatch[1]);
  }

  // 4. Extract Unit
  let matchedUnit = "kg"; // default sensible unit
  for (const [unit, synonyms] of Object.entries(UNIT_SYNONYMS)) {
    for (const syn of synonyms) {
      const regex = new RegExp(`\\b${syn}\\b`, "i");
      if (regex.test(lower)) {
        matchedUnit = unit;
        break;
      }
    }
  }

  // 5. Extract Price (if mentioned, e.g. "for 25 rupees per kilo", "25 rupay mein", "₹30", "dharalu 25")
  let matchedPrice = null;
  const priceMatch = lower.match(/(?:for|at|rate|price|rupees?|rs|₹|rupay|rupiyalu|dar|dharalu)?\s*(\d+(?:\.\d+)?)\s*(?:rupees?|rs|₹|rupay|rupiyalu|\/kg|per\s*(?:kg|kilo|bag|unit|quintal)|mein|lo)?/i);
  // Specifically look for price markers if a second number exists
  const allNumbers = [...lower.matchAll(/(\d+(?:\.\d+)?)/g)].map(m => parseFloat(m[1]));
  if (allNumbers.length >= 2) {
    // Usually first number is qty, second is price
    matchedQuantity = allNumbers[0];
    matchedPrice = allNumbers[1];
  } else if (/\b(rupees?|rs|₹|rupay|rupiyalu)\b/i.test(lower) && allNumbers.length === 1 && (isStockIn || isStockOut)) {
    // If only one number and it follows a currency word, it could be price, but usually in agricultural speech "200 kilos" is qty.
  }

  // Validation & Clarification
  let clarificationNeeded = false;
  let clarificationPrompt = "";

  if ((intent === "STOCK_IN" || intent === "STOCK_OUT") && !matchedQuantity) {
    clarificationNeeded = true;
    clarificationPrompt = lang === "te" 
      ? "దయచేసి ఎంత పరిమాణం (క్వాంటిటీ) చెప్పండి." 
      : lang === "hi" 
      ? "कृपया फसल की मात्रा (Quantity) बताएं।" 
      : "Please specify the quantity of produce.";
  }

  if ((intent === "STOCK_IN" || intent === "STOCK_OUT" || intent === "QUERY_STOCK") && !matchedCrop) {
    clarificationNeeded = true;
    clarificationPrompt = lang === "te"
      ? "దయచేసి ఏ పంట కోసం రికార్డ్ చేయాలనుకుంటున్నారో చెప్పండి (ఉదా. టమాటా, మిర్చి)."
      : lang === "hi"
      ? "कृपया फसल का नाम बताएं (जैसे टमाटर, मिर्च, कपास)।"
      : "Please mention which crop you are referring to (e.g. Tomato, Chilli).";
  }

  return {
    intent,
    crop: matchedCrop,
    quantity: matchedQuantity,
    unit: matchedUnit,
    price: matchedPrice,
    language: lang,
    confidence,
    clarificationNeeded,
    clarificationPrompt,
    originalText: raw
  };
}
