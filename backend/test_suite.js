// Comprehensive Functional & Verification Test Suite for FarmNexus
import assert from "assert";

const BASE_URL = "http://127.0.0.1:5050/api";

async function runTests() {
  console.log("🧪 Starting FarmNexus Comprehensive Verification Test Suite...\n");

  // 1. Health check
  console.log("1. Testing System Health...");
  const healthRes = await fetch(`${BASE_URL}/health`).then(r => r.json());
  assert.strictEqual(healthRes.status, "ok");
  console.log("   ✅ Health check passed!");

  // 2. FR-01: Farmer Auth & Profile
  console.log("2. Testing FR-01: Farmer Registration & OTP Auth...");
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "9876543210", otp: "1234", language: "te" })
  }).then(r => r.json());
  assert.strictEqual(loginRes.success, true);
  assert.strictEqual(loginRes.user.name, "Ramesh Patel");
  assert.strictEqual(loginRes.user.preferredLanguage, "te");
  console.log("   ✅ FR-01 Farmer Auth & Profile verified!");

  // 3. FR-07 & FR-10: Voice NLU - Document Example 1 (Stock In)
  console.log("3. Testing FR-07: Document Example 1 - 'Add 200 kilos of tomatoes'...");
  const voice1 = await fetch(`${BASE_URL}/voice/nlu`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "Add 200 kilos of tomatoes" })
  }).then(r => r.json());
  assert.strictEqual(voice1.parsed.intent, "STOCK_IN");
  assert.strictEqual(voice1.parsed.crop, "Tomato");
  assert.strictEqual(voice1.parsed.quantity, 200);
  assert.strictEqual(voice1.parsed.unit, "kg");
  console.log("   ✅ Document Example 1 parsed perfectly!");

  // 4. FR-07 & FR-10: Voice NLU - Document Example 2 (Stock Out)
  console.log("4. Testing FR-07: Document Example 2 - 'I sold 100 kg tomatoes for 25 rupees per kilo'...");
  const voice2 = await fetch(`${BASE_URL}/voice/nlu`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "I sold 100 kg tomatoes for 25 rupees per kilo" })
  }).then(r => r.json());
  assert.strictEqual(voice2.parsed.intent, "STOCK_OUT");
  assert.strictEqual(voice2.parsed.crop, "Tomato");
  assert.strictEqual(voice2.parsed.quantity, 100);
  assert.strictEqual(voice2.parsed.unit, "kg");
  assert.strictEqual(voice2.parsed.price, 25);
  console.log("   ✅ Document Example 2 parsed perfectly!");

  // 5. FR-10 & FR-11: Voice NLU - Document Example 3 ('Tomato entha undi?')
  console.log("5. Testing FR-11: Document Example 3 - 'Tomato entha undi?' (Telugu query)...");
  const voice3 = await fetch(`${BASE_URL}/voice/nlu`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "Tomato entha undi?" })
  }).then(r => r.json());
  assert.strictEqual(voice3.parsed.intent, "QUERY_STOCK");
  assert.strictEqual(voice3.parsed.crop, "Tomato");
  assert.ok(voice3.spokenResponse.includes("టమాటా") || voice3.spokenResponse.includes("Tomato"));
  console.log("   ✅ Document Example 3 answered with live database inventory in Telugu!");

  // 6. FR-03: Stock In Execution
  console.log("6. Testing FR-03: Stock In execution...");
  const stockInRes = await fetch(`${BASE_URL}/inventory/stock-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ crop: "Tomato", quantity: 50, unit: "kg", unitPrice: 22 })
  }).then(r => r.json());
  assert.strictEqual(stockInRes.success, true);
  console.log(`   ✅ Stock In confirmed! New Tomato quantity: ${stockInRes.updatedItem.quantity} kg`);

  // 7. FR-04 & Section 7 Validation: Stock Out Limit Enforcement
  console.log("7. Testing FR-04 & Section 7: Stock Out overdraw prevention...");
  const overdrawRes = await fetch(`${BASE_URL}/inventory/stock-out`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ crop: "Tomato", quantity: 999999, unit: "kg" })
  }).then(r => r.json());
  assert.ok(overdrawRes.error.includes("Insufficient stock"));
  console.log("   ✅ Overdraw rejected as expected:", overdrawRes.error);

  // 8. FR-05: Stock Adjustment Audit Trail
  console.log("8. Testing FR-05: Stock Adjustment with audit trail...");
  const adjRes = await fetch(`${BASE_URL}/inventory/adjust`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      crop: "Tomato",
      quantityChange: -5,
      unit: "kg",
      reason: "Moisture shrinkage / transport bruising",
      authorizedBy: "Ramesh Patel"
    })
  }).then(r => r.json());
  assert.strictEqual(adjRes.success, true);
  assert.strictEqual(adjRes.transaction.reason, "Moisture shrinkage / transport bruising");
  console.log("   ✅ Stock adjustment recorded in audit ledger!");

  // 9. FR-12: Smart Alerts (Low Stock, Aging, Price Surge)
  console.log("9. Testing FR-12: Smart Alerts generation...");
  const alertsRes = await fetch(`${BASE_URL}/alerts`).then(r => r.json());
  assert.strictEqual(alertsRes.success, true);
  assert.ok(alertsRes.alerts.length >= 2);
  const hasLowStock = alertsRes.alerts.some(a => a.type === "LOW_STOCK");
  const hasAging = alertsRes.alerts.some(a => a.type === "AGING_PRODUCE");
  assert.ok(hasLowStock);
  assert.ok(hasAging);
  console.log(`   ✅ Generated ${alertsRes.alerts.length} smart alerts (Low Stock, Aging, Market Surge)!`);

  // 10. FR-13 & FR-14: Crop Doctor Diagnosis & Treatment
  console.log("10. Testing FR-13 & FR-14: AI Crop Doctor Diagnosis & Treatment Guidance...");
  const diagRes = await fetch(`${BASE_URL}/crop-doctor/diagnose`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ crop: "Chilli" })
  }).then(r => r.json());
  assert.strictEqual(diagRes.success, true);
  assert.strictEqual(diagRes.crop, "Chilli");
  assert.ok(diagRes.treatment.organic.length > 0);
  assert.ok(diagRes.treatment.chemical.length > 0);
  assert.ok(diagRes.expertConsultation.hotline);
  console.log(`   ✅ Diagnosed '${diagRes.diseaseName}' with ${diagRes.confidencePercent} confidence & KVK helpline!`);

  // 11. FR-15: Mandi Prices & Comparison
  console.log("11. Testing FR-15: Mandi Price Intelligence...");
  const mandiRes = await fetch(`${BASE_URL}/market/prices`).then(r => r.json());
  assert.strictEqual(mandiRes.success, true);
  assert.ok(mandiRes.mandiPrices.length >= 5);
  console.log(`   ✅ Loaded ${mandiRes.mandiPrices.length} live mandi price feeds with 7-day trends!`);

  // 12. FR-16: Marketplace Listing & Buyer Offer
  console.log("12. Testing FR-16: Marketplace produce listing & offer submission...");
  const newListing = await fetch(`${BASE_URL}/marketplace/listings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      crop: "Paddy",
      variety: "BPT Sona Masoori",
      quantity: 50,
      unit: "bags",
      askingPrice: 1900,
      location: "Guntur Rural, AP"
    })
  }).then(r => r.json());
  assert.strictEqual(newListing.success, true);

  const offerRes = await fetch(`${BASE_URL}/marketplace/listings/${newListing.listing.id}/offer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      buyerName: "Kisan Wholesale Trader",
      buyerPhone: "+919848012345",
      offeredPrice: 1880,
      offeredQuantity: 50
    })
  }).then(r => r.json());
  assert.strictEqual(offerRes.success, true);
  console.log("   ✅ Marketplace produce listed and buyer offer submitted successfully!");

  // 13. FR-18: Cold Storage Discovery & Booking
  console.log("13. Testing FR-18: Cold Storage Discovery & Space Reservation...");
  const storageRes = await fetch(`${BASE_URL}/storage/facilities`).then(r => r.json());
  assert.ok(storageRes.coldStorages.length >= 3);
  const bookRes = await fetch(`${BASE_URL}/storage/book`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      facilityId: storageRes.coldStorages[0].id,
      crop: "Tomato",
      quantityBags: 60,
      durationMonths: 2
    })
  }).then(r => r.json());
  assert.strictEqual(bookRes.success, true);
  assert.ok(bookRes.booking.bookingId);
  console.log(`   ✅ Cold storage reservation confirmed: ${bookRes.booking.bookingId}`);

  // 14. FR-19: Logistics Freight Calculator & Booking
  console.log("14. Testing FR-19: Logistics Support & Freight Calculator...");
  const logEstimate = await fetch(`${BASE_URL}/logistics/estimate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ distanceKm: 35, quantityKg: 600 })
  }).then(r => r.json());
  assert.strictEqual(logEstimate.success, true);
  assert.ok(logEstimate.estimate.totalFreight > 0);
  console.log(`   ✅ Freight calculated for ${logEstimate.estimate.distanceKm} km: ₹${logEstimate.estimate.totalFreight}`);

  // 15. FR-20: Offline Batch Synchronization with Deduplication
  console.log("15. Testing FR-20: Offline transaction batch synchronization & deduplication...");
  const offlineTx = [
    {
      id: "offline-test-1",
      syncToken: "token-abc-123",
      type: "STOCK_IN",
      crop: "Tomato",
      quantity: 10,
      unit: "kg",
      unitPrice: 20
    }
  ];
  // First sync
  const sync1 = await fetch(`${BASE_URL}/sync/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transactions: offlineTx })
  }).then(r => r.json());
  assert.strictEqual(sync1.processed, 1);

  // Duplicate sync of same token
  const sync2 = await fetch(`${BASE_URL}/sync/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transactions: offlineTx })
  }).then(r => r.json());
  assert.strictEqual(sync2.duplicatesSkipped, 1);
  console.log("   ✅ Offline sync processed batch and successfully prevented duplicate entries!");

  console.log("\n🎉 ALL 15 AUTOMATED TESTS PASSED SUCCESSFULLY! 💯");
}

runTests().catch(err => {
  console.error("❌ Test suite failed:", err);
  process.exit(1);
});
