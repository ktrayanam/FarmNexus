import React, { useState } from "react";
import {
  Shield,
  Smartphone,
  Building2,
  Users,
  Lock,
  ArrowRight,
  Globe,
  Sparkles,
  Database,
  CheckCircle2,
  KeyRound,
  FileCheck
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { language, setLanguage, t } = useLanguage();
  const { login, isLoggingIn, loginError } = useAuth();

  const [selectedRole, setSelectedRole] = useState("farmer"); // "farmer" | "buyer" | "fpo" | "admin"

  // Role Form States
  // Farmer
  const [farmerPhone, setFarmerPhone] = useState("9876543210");
  const [farmerOtp, setFarmerOtp] = useState("1234");
  const [otpSent, setOtpSent] = useState(false);

  // Buyer
  const [buyerIdentifier, setBuyerIdentifier] = useState("9848012345");
  const [buyerPassword, setBuyerPassword] = useState("buyer123");
  const [mandiLicense, setMandiLicense] = useState("APMC-HYD-W-2024-889");

  // FPO
  const [fpoRegNo, setFpoRegNo] = useState("FPO-AP-GNT-2022-098");
  const [fpoPhone, setFpoPhone] = useState("9440056789");
  const [fpoPassword, setFpoPassword] = useState("fpo123");

  // Admin
  const [adminEmail, setAdminEmail] = useState("admin@farmnexus.gov.in");
  const [adminPassword, setAdminPassword] = useState("admin123");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedRole === "farmer") {
      login("farmer", { phone: farmerPhone, otp: farmerOtp, language });
    } else if (selectedRole === "buyer") {
      login("buyer", { phone: buyerIdentifier, password: buyerPassword, mandiLicense });
    } else if (selectedRole === "fpo") {
      login("fpo", { fpoRegNo, phone: fpoPhone, password: fpoPassword });
    } else if (selectedRole === "admin") {
      login("admin", { email: adminEmail, password: adminPassword });
    }
  };

  const handleQuickDemoLogin = (role) => {
    setSelectedRole(role);
    if (role === "farmer") {
      login("farmer", { phone: "9876543210", otp: "1234", language });
    } else if (role === "buyer") {
      login("buyer", { phone: "9848012345", password: "buyer123" });
    } else if (role === "fpo") {
      login("fpo", { fpoRegNo: "FPO-AP-GNT-2022-098", phone: "9440056789", password: "fpo123" });
    } else if (role === "admin") {
      login("admin", { email: "admin@farmnexus.gov.in", password: "admin123" });
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-agri-200">
      {/* Top Brand Banner */}
      <div className="max-w-md w-full text-center mb-6 space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-agri-600 to-agri-900 text-white shadow-xl shadow-agri-700/20 text-3xl">
          🌾
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-stone-950 tracking-tight">
          Farm<span className="text-agri-700">Nexus</span>
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 font-medium">
          Voice-First AI Platform for Smart Crop Care & Direct Market Access
        </p>

        {/* MongoDB Database indicator badge */}
        <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 px-3 py-0.5 rounded-full text-[11px] font-bold shadow-2xs">
          <Database size={12} className="text-emerald-600" />
          <span>MongoDB Mongoose Persistence Layer Enabled</span>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="bg-white max-w-md w-full rounded-3xl shadow-xl border border-stone-200/80 overflow-hidden">
        {/* Role Selector Tabs */}
        <div className="grid grid-cols-4 bg-stone-50 border-b border-stone-200 p-1 gap-1">
          {[
            { id: "farmer", label: "Farmer", icon: "👨‍🌾", desc: "Produce & Voice" },
            { id: "buyer", label: "Buyer", icon: "🏢", desc: "Wholesale Offers" },
            { id: "fpo", label: "FPO", icon: "🤝", desc: "Produce Pooling" },
            { id: "admin", label: "Admin", icon: "⚙️", desc: "System Governance" }
          ].map((tab) => {
            const isSelected = selectedRole === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedRole(tab.id)}
                className={`py-2 px-1 text-center rounded-2xl transition-all flex flex-col items-center justify-center ${
                  isSelected
                    ? "bg-white text-stone-950 font-black shadow-xs border border-stone-200/70"
                    : "text-stone-500 hover:text-stone-800 font-bold"
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="text-xs mt-0.5">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Role-Specific Form Container */}
        <div className="p-6 space-y-5">
          {/* Header per role */}
          <div className="space-y-1">
            <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
              {selectedRole === "farmer" && "👨‍🌾 Farmer Voice Login (రైతు లాగిన్)"}
              {selectedRole === "buyer" && "🏢 Wholesale Buyer & Trader Access"}
              {selectedRole === "fpo" && "🤝 FPO Collective Aggregation Login"}
              {selectedRole === "admin" && "⚙️ Department of Agriculture Admin"}
            </h2>
            <p className="text-xs text-stone-500">
              {selectedRole === "farmer" && "Access voice stock-in/out, crop disease diagnostics & market prices."}
              {selectedRole === "buyer" && "Explore farmer listings, negotiate purchase offers & view mandi trends."}
              {selectedRole === "fpo" && "Manage pooled crops, member farmer equity and corporate bulk sales."}
              {selectedRole === "admin" && "Monitor platform telemetry, audit ledgers and MongoDB data collections."}
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-800">
              {loginError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* 1. FARMER LOGIN FORM (FR-01) */}
            {selectedRole === "farmer" && (
              <div className="space-y-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Mobile Number (మొబైల్ నంబర్ / मोबाइल नंबर)
                  </label>
                  <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
                    <Smartphone size={14} className="text-agri-700 shrink-0" />
                    <span className="text-stone-500 font-bold">+91</span>
                    <input
                      type="tel"
                      required
                      value={farmerPhone}
                      onChange={(e) => setFarmerPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full bg-transparent font-bold text-stone-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-stone-700">4-Digit OTP Code</label>
                    <button
                      type="button"
                      onClick={() => { setOtpSent(true); setFarmerOtp("1234"); }}
                      className="text-[11px] text-agri-700 font-bold hover:underline"
                    >
                      {otpSent ? "OTP Sent: 1234" : "Send OTP"}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
                    <KeyRound size={14} className="text-stone-400 shrink-0" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={farmerOtp}
                      onChange={(e) => setFarmerOtp(e.target.value)}
                      placeholder="1234"
                      className="w-full bg-transparent font-bold text-stone-900 tracking-widest focus:outline-none text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Preferred Voice Language (ప్రాధాన్య భాష)
                  </label>
                  <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5">
                    <Globe size={14} className="text-agri-700 shrink-0" />
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-transparent font-bold text-stone-900 focus:outline-none cursor-pointer py-1"
                    >
                      <option value="te">తెలుగు (Telugu - Default)</option>
                      <option value="en">English</option>
                      <option value="hi">हिन्दी (Hindi)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 2. BUYER LOGIN FORM */}
            {selectedRole === "buyer" && (
              <div className="space-y-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Business Phone or Email
                  </label>
                  <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
                    <Building2 size={14} className="text-blue-700 shrink-0" />
                    <input
                      type="text"
                      required
                      value={buyerIdentifier}
                      onChange={(e) => setBuyerIdentifier(e.target.value)}
                      placeholder="9848012345 or buyer@company.com"
                      className="w-full bg-transparent font-bold text-stone-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Mandi License ID / APMC Trade Reg
                  </label>
                  <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
                    <FileCheck size={14} className="text-stone-400 shrink-0" />
                    <input
                      type="text"
                      value={mandiLicense}
                      onChange={(e) => setMandiLicense(e.target.value)}
                      className="w-full bg-transparent font-bold text-stone-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Password</label>
                  <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
                    <Lock size={14} className="text-stone-400 shrink-0" />
                    <input
                      type="password"
                      required
                      value={buyerPassword}
                      onChange={(e) => setBuyerPassword(e.target.value)}
                      className="w-full bg-transparent font-bold text-stone-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. FPO LOGIN FORM */}
            {selectedRole === "fpo" && (
              <div className="space-y-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    FPO Registration Number
                  </label>
                  <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
                    <Users size={14} className="text-purple-700 shrink-0" />
                    <input
                      type="text"
                      required
                      value={fpoRegNo}
                      onChange={(e) => setFpoRegNo(e.target.value)}
                      placeholder="FPO-AP-GNT-2022-098"
                      className="w-full bg-transparent font-bold text-stone-900 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Authorized Manager Phone
                  </label>
                  <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
                    <Smartphone size={14} className="text-stone-400 shrink-0" />
                    <input
                      type="tel"
                      required
                      value={fpoPhone}
                      onChange={(e) => setFpoPhone(e.target.value)}
                      placeholder="9440056789"
                      className="w-full bg-transparent font-bold text-stone-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Access PIN / Password</label>
                  <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
                    <Lock size={14} className="text-stone-400 shrink-0" />
                    <input
                      type="password"
                      required
                      value={fpoPassword}
                      onChange={(e) => setFpoPassword(e.target.value)}
                      className="w-full bg-transparent font-bold text-stone-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 4. ADMIN LOGIN FORM */}
            {selectedRole === "admin" && (
              <div className="space-y-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Govt Admin Email ID
                  </label>
                  <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
                    <Shield size={14} className="text-stone-700 shrink-0" />
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@farmnexus.gov.in"
                      className="w-full bg-transparent font-bold text-stone-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Security Passkey</label>
                  <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
                    <Lock size={14} className="text-stone-400 shrink-0" />
                    <input
                      type="password"
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full bg-transparent font-bold text-stone-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className={`w-full py-3 rounded-2xl text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
                selectedRole === "farmer"
                  ? "bg-agri-700 hover:bg-agri-800 shadow-agri-700/25"
                  : selectedRole === "buyer"
                  ? "bg-blue-700 hover:bg-blue-800 shadow-blue-700/25"
                  : selectedRole === "fpo"
                  ? "bg-purple-700 hover:bg-purple-800 shadow-purple-700/25"
                  : "bg-stone-900 hover:bg-black shadow-stone-900/25"
              }`}
            >
              <span>{isLoggingIn ? "Authenticating..." : `Login as ${selectedRole.toUpperCase()}`}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* One-Click Hackathon Demo Login Pills */}
          <div className="pt-3 border-t border-stone-100 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-black uppercase text-stone-500">
              <span className="flex items-center gap-1">
                <Sparkles size={12} className="text-amber-500" />
                <span>Instant Hackathon Demo Logins</span>
              </span>
              <span className="text-[10px] text-stone-400">1-Click Access</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin("farmer")}
                className="p-2.5 bg-agri-50 hover:bg-agri-100 border border-agri-200 rounded-xl text-left font-bold text-agri-950 flex items-center justify-between transition-all"
              >
                <span>👨‍🌾 Farmer Demo</span>
                <span className="text-[10px] bg-agri-200 px-1.5 py-0.5 rounded font-mono">OTP</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin("buyer")}
                className="p-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-left font-bold text-blue-950 flex items-center justify-between transition-all"
              >
                <span>🏢 Buyer Demo</span>
                <span className="text-[10px] bg-blue-200 px-1.5 py-0.5 rounded font-mono">Trade</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin("fpo")}
                className="p-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl text-left font-bold text-purple-950 flex items-center justify-between transition-all"
              >
                <span>🤝 FPO Manager</span>
                <span className="text-[10px] bg-purple-200 px-1.5 py-0.5 rounded font-mono">Pool</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin("admin")}
                className="p-2.5 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-xl text-left font-bold text-stone-900 flex items-center justify-between transition-all"
              >
                <span>⚙️ System Admin</span>
                <span className="text-[10px] bg-stone-300 px-1.5 py-0.5 rounded font-mono">Full</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
