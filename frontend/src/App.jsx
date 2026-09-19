import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import OfflineBanner from "./components/OfflineBanner";
import VoiceAssistantModal from "./components/VoiceAssistantModal";
import VoiceConfirmationModal from "./components/VoiceConfirmationModal";
import FarmerDashboard from "./components/FarmerDashboard";
import ProduceManagement from "./components/ProduceManagement";
import CropDoctor from "./components/CropDoctor";
import MarketPrices from "./components/MarketPrices";
import Marketplace from "./components/Marketplace";
import FPOModule from "./components/FPOModule";
import ColdStorageDiscovery from "./components/ColdStorageDiscovery";
import LogisticsSupport from "./components/LogisticsSupport";
import AdminPanel from "./components/AdminPanel";
import LoginPage from "./components/LoginPage";
import { useStock } from "./context/StockContext";
import { useAuth } from "./context/AuthContext";

export default function App() {
  const { isAuthenticated, currentRole, allowedTabs, defaultTab } = useAuth();
  const [activeTab, setActiveTab] = useState(defaultTab || "dashboard");
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [confirmingTx, setConfirmingTx] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [marketplacePreFilter, setMarketplacePreFilter] = useState("ALL");

  // Keep active tab valid whenever role changes
  useEffect(() => {
    if (allowedTabs && !allowedTabs.includes(activeTab)) {
      setActiveTab(defaultTab || allowedTabs[0] || "dashboard");
    }
  }, [currentRole, allowedTabs, defaultTab, activeTab]);

  const { stockIn, stockOut } = useStock();

  // If not logged in, show dedicated multi-role login page
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Called when Voice Assistant extracts a Stock In or Stock Out transaction
  const handleVoiceTransactionParsed = (parsedData) => {
    setConfirmingTx(parsedData);
  };

  // Called when Farmer approves the Voice Confirmation Modal (FR-08)
  const executeConfirmedTransaction = async (txData) => {
    try {
      if (txData.intent === "STOCK_IN") {
        await stockIn({
          crop: txData.crop,
          quantity: txData.quantity,
          unit: txData.unit || "kg",
          unitPrice: txData.price || 0,
          recordedVia: "VOICE",
          notes: txData.originalText || "Spoken stock addition"
        });
        showToast(`🌾 Added ${txData.quantity} ${txData.unit} of ${txData.crop} via Voice!`);
      } else if (txData.intent === "STOCK_OUT") {
        await stockOut({
          crop: txData.crop,
          quantity: txData.quantity,
          unit: txData.unit || "kg",
          unitPrice: txData.price || 0,
          recordedVia: "VOICE",
          notes: txData.originalText || "Spoken stock sale"
        });
        showToast(`💰 Recorded sale of ${txData.quantity} ${txData.unit} of ${txData.crop} via Voice!`);
      }
      setConfirmingTx(null);
    } catch (err) {
      alert("Error executing transaction: " + err.message);
    }
  };

  // Quick Action triggers from Dashboard
  const handleQuickStockIn = (item) => {
    setConfirmingTx({
      intent: "STOCK_IN",
      crop: item.crop,
      quantity: 50,
      unit: item.unit,
      price: item.unitPrice,
      originalText: `Quick Stock In: +50 ${item.unit} ${item.crop}`
    });
  };

  const handleQuickStockOut = (item) => {
    setConfirmingTx({
      intent: "STOCK_OUT",
      crop: item.crop,
      quantity: 25,
      unit: item.unit,
      price: item.unitPrice,
      originalText: `Quick Stock Out: -25 ${item.unit} ${item.crop}`
    });
  };

  const handleNavigateToListing = (cropName) => {
    setMarketplacePreFilter(cropName);
    setActiveTab("marketplace");
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
      {/* Navigation Header */}
      <Navbar
        onOpenVoice={() => setIsVoiceOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Offline Alert Banner */}
      <OfflineBanner />

      {/* Main App Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeTab === "dashboard" && (
          <FarmerDashboard
            onOpenVoice={() => setIsVoiceOpen(true)}
            setActiveTab={setActiveTab}
            onQuickStockIn={handleQuickStockIn}
            onQuickStockOut={handleQuickStockOut}
          />
        )}
        {activeTab === "produce" && <ProduceManagement />}
        {activeTab === "crop-doctor" && <CropDoctor />}
        {activeTab === "mandi-prices" && (
          <MarketPrices onNavigateToListing={handleNavigateToListing} />
        )}
        {activeTab === "marketplace" && (
          <Marketplace initialCropFilter={marketplacePreFilter} />
        )}
        {activeTab === "fpo" && <FPOModule />}
        {activeTab === "cold-storage" && <ColdStorageDiscovery />}
        {activeTab === "logistics" && <LogisticsSupport />}
        {activeTab === "admin" && <AdminPanel />}
      </main>

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onConfirmTransaction={handleVoiceTransactionParsed}
        onNavigateTab={setActiveTab}
      />

      {/* Voice Confirmation Modal (FR-08) */}
      <VoiceConfirmationModal
        isOpen={Boolean(confirmingTx)}
        transactionData={confirmingTx}
        onConfirm={executeConfirmedTransaction}
        onCancel={() => setConfirmingTx(null)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-2xl border border-stone-700 flex items-center gap-3 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
