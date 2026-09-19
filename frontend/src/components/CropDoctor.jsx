import React, { useState } from "react";
import {
  Stethoscope,
  Upload,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Phone,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Leaf,
  Volume2,
  VolumeX
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { diagnoseCrop } from "../services/api";
import { speakText, stopSpeaking } from "../services/speechSynthesis";

const PRESET_CASES = [
  {
    id: "case-tomato",
    crop: "Tomato",
    diseaseName: "Late Blight",
    pathogen: "Phytophthora infestans",
    confidence: 0.94,
    severity: "High",
    icon: "🍅",
    thumbnail: "Dark brown water-soaked lesions on leaf margins with white sporulation on underside."
  },
  {
    id: "case-chilli",
    crop: "Chilli",
    diseaseName: "Leaf Curl Virus (Murda)",
    pathogen: "Begomovirus (Vector: Whitefly)",
    confidence: 0.91,
    severity: "Critical",
    icon: "🌶️",
    thumbnail: "Severe upward puckering, curling of leaves, stunted internodes and flower drop."
  },
  {
    id: "case-cotton",
    crop: "Cotton",
    diseaseName: "Pink Bollworm Infestation",
    pathogen: "Pectinophora gossypiella",
    confidence: 0.89,
    severity: "High",
    icon: "🌸",
    thumbnail: "Rosetted flowers, bore holes in developing bolls with larval excreta."
  },
  {
    id: "case-rice",
    crop: "Rice / Paddy",
    diseaseName: "Blast Disease",
    pathogen: "Magnaporthe oryzae",
    confidence: 0.93,
    severity: "High",
    icon: "🌾",
    thumbnail: "Spindle-shaped diamond lesions with ash-grey center and necrotic neck-rot."
  },
  {
    id: "case-potato",
    crop: "Potato",
    diseaseName: "Early Blight",
    pathogen: "Alternaria solani",
    confidence: 0.88,
    severity: "Moderate",
    icon: "🥔",
    thumbnail: "Concentric target-board rings on lower foliage with chlorotic yellow haloes."
  }
];

export default function CropDoctor() {
  const { language, t } = useLanguage();
  const [selectedCrop, setSelectedCrop] = useState("Tomato");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [showExpertModal, setShowExpertModal] = useState(false);
  const [isPlayingPrescription, setIsPlayingPrescription] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setDiagnosisResult(null);
    }
  };

  const handleRunDiagnosis = async (cropHint) => {
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("crop", cropHint || selectedCrop);
      if (selectedFile) {
        formData.append("image", selectedFile);
      }
      const result = await diagnoseCrop(formData);
      setDiagnosisResult(result);
    } catch (err) {
      alert("Error diagnosing crop: " + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectPreset = (preset) => {
    setSelectedCrop(preset.crop);
    setPreviewUrl(null);
    setSelectedFile(null);
    handleRunDiagnosis(preset.crop);
  };

  const handlePlayPrescription = () => {
    if (!diagnosisResult) return;
    if (isPlayingPrescription) {
      stopSpeaking();
      setIsPlayingPrescription(false);
      return;
    }

    setIsPlayingPrescription(true);
    const orgTreatment = diagnosisResult.treatment?.organic?.[0] || "Spray Neem oil 5ml per liter.";
    const chemTreatment = diagnosisResult.treatment?.chemical?.[0] || "Consult agriculture extension officer.";

    let spoken = "";
    if (language === "te") {
      spoken = `పంట డాక్టర్ నిర్ధారణ: ${diagnosisResult.crop} పంటలో ${diagnosisResult.diseaseName} గుర్తించబడింది. తీవ్రత: ${diagnosisResult.severity}. సహజ నివారణ: ${orgTreatment}. రసాయన మందు: ${chemTreatment}. అత్యవసర సంప్రదింపుల కోసం కేవీకే హెల్ప్‌లైన్ 1551 కి కాల్ చేయండి.`;
    } else if (language === "hi") {
      spoken = `फसल डॉक्टर रिपोर्ट: ${diagnosisResult.crop} में ${diagnosisResult.diseaseName} पाया गया है। गंभीरता: ${diagnosisResult.severity}। जैविक उपचार: ${orgTreatment}। रासायनिक उपचार: ${chemTreatment}। सहायता के लिए किसान हेल्पलाइन 1551 डायल करें।`;
    } else {
      spoken = `Crop Doctor Diagnosis: Detected ${diagnosisResult.diseaseName} in ${diagnosisResult.crop}. Severity is ${diagnosisResult.severity}. Recommended organic remedy: ${orgTreatment}. Chemical treatment: ${chemTreatment}. For free expert support, dial Kisan helpline 1551.`;
    }

    speakText(spoken, language);
    setTimeout(() => setIsPlayingPrescription(false), 9500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <Stethoscope size={26} className="text-agri-700" />
            <span>{t("cropDoctorTitle")}</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            {t("cropDoctorDesc")}
          </p>
        </div>

        <button
          onClick={() => setShowExpertModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold transition-all self-start sm:self-auto"
        >
          <Phone size={14} />
          <span>Krishi Vigyan Kendra Helpline</span>
        </button>
      </div>

      {/* Preset Test Cases Banner for Hackathon Demo */}
      <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" />
            <span>Interactive Crop Disease Profiles (One-Tap Test)</span>
          </span>
          <span className="text-[11px] text-stone-400">Click any crop to inspect real diagnosis</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {PRESET_CASES.map((preset) => {
            const isSelected = selectedCrop === preset.crop && diagnosisResult?.diseaseName === preset.diseaseName;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-agri-50 border-agri-500 ring-2 ring-agri-500/20 shadow-xs"
                    : "bg-stone-50 border-stone-200 hover:bg-stone-100/80"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-base mb-1">
                    <span>{preset.icon}</span>
                    <span className="text-[10px] font-extrabold bg-white px-1.5 py-0.5 rounded-full border border-stone-200 text-stone-700">
                      {Math.round(preset.confidence * 100)}%
                    </span>
                  </div>
                  <h4 className="font-extrabold text-stone-900 text-xs">{preset.crop}</h4>
                  <p className="text-[11px] font-bold text-agri-800 leading-tight mt-0.5">{preset.diseaseName}</p>
                </div>
                <p className="text-[10px] text-stone-500 line-clamp-2 mt-2 leading-tight">
                  {preset.thumbnail}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Image Upload Box */}
      <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-3">
            <h3 className="font-extrabold text-stone-900 text-sm sm:text-base">
              Capture or Upload Affected Plant Photo
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              For best accuracy, ensure good lighting, clear focus on the leaf lesion or pest, and capture both the upper and lower leaf surfaces.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <label className="cursor-pointer bg-agri-700 hover:bg-agri-800 text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md transition-all">
                <Upload size={16} />
                <span>Upload Leaf Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => handleRunDiagnosis()}
                disabled={isAnalyzing}
                className="bg-stone-900 hover:bg-black text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all"
              >
                <Sparkles size={16} className="text-emerald-400" />
                <span>{isAnalyzing ? "Analyzing Symptoms..." : "Run AI Diagnosis"}</span>
              </button>
            </div>
          </div>

          {/* Photo Preview Box */}
          <div className="h-44 sm:h-52 bg-stone-100 rounded-2xl border-2 border-dashed border-stone-300 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Selected leaf sample"
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <div className="text-center space-y-2 text-stone-400">
                <Camera size={36} className="mx-auto text-stone-400" />
                <p className="text-xs font-semibold">No custom image uploaded yet</p>
                <p className="text-[11px] text-stone-400">Select an image or use the crop profiles above</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Diagnosis Results Display */}
      {diagnosisResult && (
        <div className="bg-white rounded-3xl border border-emerald-200 p-6 shadow-sm space-y-6 animate-fadeIn">
          {/* Top Result Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-emerald-100 text-emerald-900 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  AI Confirmed Match
                </span>
                <span className="text-xs font-semibold text-stone-500">
                  {diagnosisResult.crop}
                </span>
              </div>
              <h3 className="text-2xl font-black text-stone-950 mt-1">
                {diagnosisResult.diseaseName}
              </h3>
              <p className="text-xs text-stone-500 italic">
                Pathogen: {diagnosisResult.pathogen}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handlePlayPrescription}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs shadow-sm transition-all active:scale-95"
              >
                {isPlayingPrescription ? (
                  <VolumeX size={15} className="text-amber-300 animate-pulse" />
                ) : (
                  <Volume2 size={15} className="text-white animate-pulse" />
                )}
                <span>{isPlayingPrescription ? "Stop Audio" : "Listen to Prescription (ఆడియో ప్రిస్క్రిప్షన్)"}</span>
              </button>

              <div className="text-right">
                <span className="text-xs text-stone-500 block font-semibold">{t("confidence")}</span>
                <span className="text-2xl font-black text-emerald-700">
                  {diagnosisResult.confidencePercent}
                </span>
              </div>
              <div className="h-10 w-px bg-stone-200"></div>
              <div>
                <span className="text-xs text-stone-500 block font-semibold">Severity</span>
                <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-lg ${
                  diagnosisResult.severity === "Critical"
                    ? "bg-red-100 text-red-900 border border-red-200"
                    : "bg-amber-100 text-amber-900 border border-amber-200"
                }`}>
                  {diagnosisResult.severity}
                </span>
              </div>
            </div>
          </div>

          {/* Observed Symptoms */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
              <Leaf size={14} className="text-agri-700" />
              <span>{t("symptoms")}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {diagnosisResult.symptoms?.map((sym, idx) => (
                <div key={idx} className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/80 text-xs font-medium text-stone-800 flex items-start gap-2">
                  <span className="text-agri-600 font-bold">•</span>
                  <span>{sym}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Treatment Solutions (Dual Column: Organic vs Chemical) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Organic Solutions */}
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center gap-1.5 text-emerald-900 font-black text-xs uppercase tracking-wider">
                <ShieldCheck size={16} className="text-emerald-700" />
                <span>{t("organicRemedy")}</span>
              </div>
              <ul className="space-y-1.5 text-xs text-stone-800">
                {diagnosisResult.treatment?.organic?.map((org, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-white/80 p-2 rounded-xl border border-emerald-100">
                    <span className="text-emerald-600 font-black">🌱</span>
                    <span>{org}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Chemical Solutions & Dosage */}
            <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center gap-1.5 text-blue-900 font-black text-xs uppercase tracking-wider">
                <AlertTriangle size={16} className="text-blue-700" />
                <span>{t("chemicalRemedy")}</span>
              </div>
              <ul className="space-y-1.5 text-xs text-stone-800">
                {diagnosisResult.treatment?.chemical?.map((chem, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-white/80 p-2 rounded-xl border border-blue-100">
                    <span className="text-blue-600 font-black">🔬</span>
                    <span>{chem}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Safety Precaution Footnote */}
          <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-xs text-stone-600 flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span>
              <strong>Safety Note:</strong> Always wear PPE mask & gloves when preparing sprays. Adhere strictly to the pre-harvest withholding interval (PHI) before marketing.
            </span>
          </div>

          {/* Expert Escalation Box (FR-14) */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h5 className="font-extrabold text-amber-950 text-xs uppercase tracking-wider">
                Need Confirmation from Field Scientists?
              </h5>
              <p className="text-xs text-amber-900">
                {diagnosisResult.expertConsultation?.hotline || "Krishi Vigyan Kendra Helpline available 24/7"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="tel:1551"
                className="bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs"
              >
                <Phone size={13} />
                <span>Dial 1551 (Free)</span>
              </a>
              <a
                href={`https://wa.me/919440098765?text=Hello%20Agri%20Officer,%20I%20am%20seeing%20${encodeURIComponent(diagnosisResult.diseaseName)}%20in%20my%20${diagnosisResult.crop}%20crop.%20Please%20guide.`}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs"
              >
                <MessageSquare size={13} />
                <span>WhatsApp Expert</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Expert Consultation Modal */}
      {showExpertModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-agri-800 font-extrabold text-base">
                <Stethoscope size={20} />
                <span>Krishi Vigyan Kendra (KVK) Escalation</span>
              </div>
              <button
                onClick={() => setShowExpertModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              When symptoms are ambiguous or field infestation is severe, FarmNexus connects you directly with ICAR agricultural extension officers and District Subject Matter Specialists.
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-stone-500 block font-semibold">Toll-Free Kisan Call Center:</span>
                <strong className="text-sm text-stone-900">1551 (Available 6 AM - 10 PM, 22 Languages)</strong>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-stone-500 block font-semibold">District KVK Guntur Desk:</span>
                <strong className="text-sm text-stone-900">+91 863-2234567 / +91 94400 98765</strong>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowExpertModal(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 rounded-xl text-xs font-bold text-stone-700"
              >
                Close
              </button>
              <a
                href="tel:1551"
                className="px-4 py-2 bg-agri-700 hover:bg-agri-800 rounded-xl text-xs font-bold text-white flex items-center gap-1.5"
              >
                <Phone size={13} />
                <span>Call Now</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
