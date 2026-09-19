import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, X, Volume2, Sparkles, CheckCircle2, AlertCircle, ArrowRight, CornerDownLeft } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { parseVoiceSpeech } from "../services/api";
import { speakText, stopSpeaking } from "../services/speechSynthesis";

export default function VoiceAssistantModal({ isOpen, onClose, onConfirmTransaction, onNavigateTab }) {
  const { language, t } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [nluResult, setNluResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const recognitionRef = useRef(null);

  // Initialize Web Speech Recognition if available in browser
  useEffect(() => {
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;

      // Set language based on active context
      if (language === "te") recognition.lang = "te-IN";
      else if (language === "hi") recognition.lang = "hi-IN";
      else recognition.lang = "en-IN";

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage("");
      };

      recognition.onresult = (event) => {
        let current = "";
        for (let i = 0; i < event.results.length; i++) {
          current += event.results[i][0].transcript;
        }
        setTranscript(current);
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error !== "no-speech") {
          setErrorMessage("Microphone note: " + event.error + ". You can also type or use the demo speech buttons below.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language]);

  const toggleListening = () => {
    stopSpeaking();
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      if (transcript) processText(transcript);
    } else {
      setTranscript("");
      setNluResult(null);
      setErrorMessage("");
      try {
        recognitionRef.current?.start();
      } catch (e) {
        setIsListening(true);
      }
    }
  };

  const processText = async (textToProcess) => {
    if (!textToProcess || !textToProcess.trim()) return;
    setIsProcessing(true);
    setErrorMessage("");

    try {
      const res = await parseVoiceSpeech(textToProcess, language);
      if (res?.success) {
        setNluResult(res);

        // If spoken response is available (e.g. stock query or price query), speak it out
        if (res.spokenResponse) {
          speakText(res.spokenResponse, language);
        } else if (res.parsed?.clarificationNeeded && res.parsed?.clarificationPrompt) {
          speakText(res.parsed.clarificationPrompt, language);
        }
      } else {
        setErrorMessage("Could not parse speech. Please try again.");
      }
    } catch (err) {
      setErrorMessage("Voice processing error: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDemoPrompt = (promptText) => {
    setTranscript(promptText);
    processText(promptText);
  };

  const handleConfirmAction = () => {
    if (nluResult?.parsed && (nluResult.parsed.intent === "STOCK_IN" || nluResult.parsed.intent === "STOCK_OUT")) {
      onConfirmTransaction(nluResult.parsed);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-agri-700 to-agri-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
              <Sparkles size={18} className="text-yellow-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">FarmNexus Voice AI Assistant</h3>
              <p className="text-[11px] text-agri-100">Supports Telugu, Hindi, English & Mixed Speech</p>
            </div>
          </div>
          <button
            onClick={() => { stopSpeaking(); onClose(); }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Big Interactive Mic Action */}
          <div className="flex flex-col items-center justify-center py-4">
            <button
              onClick={toggleListening}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-xl ${
                isListening
                  ? "bg-red-500 text-white mic-active scale-110 shadow-red-500/50"
                  : "bg-agri-600 hover:bg-agri-700 text-white hover:scale-105 shadow-agri-600/30"
              }`}
            >
              {isListening ? <MicOff size={42} /> : <Mic size={42} />}
            </button>

            <p className="mt-4 text-sm font-bold text-stone-800 text-center">
              {isListening ? t("voiceListening") : t("voiceTapToStop") ? "Tap Microphone to Speak" : "Tap Microphone to Speak"}
            </p>
            <p className="text-xs text-stone-500 mt-1">
              Active Language: <strong className="text-agri-800 uppercase">{language}</strong> (auto-detects code-mixed speech)
            </p>
          </div>

          {/* Transcript / Input Box */}
          <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200">
            <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5 font-semibold">
              <span>Spoken Speech / Input:</span>
              {transcript && (
                <button
                  onClick={() => setTranscript("")}
                  className="text-stone-400 hover:text-stone-700"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && processText(transcript)}
                placeholder="Spoken words will appear here, or type..."
                className="w-full bg-transparent text-sm text-stone-900 font-medium focus:outline-none"
              />
              {transcript && !isListening && (
                <button
                  onClick={() => processText(transcript)}
                  disabled={isProcessing}
                  className="bg-agri-700 text-white px-3 py-1 rounded-xl text-xs font-bold hover:bg-agri-800 shrink-0"
                >
                  {isProcessing ? "..." : "Send"}
                </button>
              )}
            </div>
          </div>

          {/* Error notice */}
          {errorMessage && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* NLU Parsed Result Card */}
          {nluResult && nluResult.parsed && (
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 size={15} /> Intent Detected: {nluResult.parsed.intent}
                </span>
                <span className="text-[11px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                  {Math.round(nluResult.parsed.confidence * 100)}% Match
                </span>
              </div>

              {/* Stock Query Response */}
              {nluResult.answerText && (
                <div className="bg-white rounded-xl p-3 border border-emerald-100 shadow-xs">
                  <div className="flex items-start gap-2 text-stone-800 font-semibold text-sm">
                    <Volume2 size={18} className="text-agri-700 shrink-0 mt-0.5" />
                    <span>{nluResult.answerText}</span>
                  </div>
                </div>
              )}

              {/* Clarification prompt if needed */}
              {nluResult.parsed.clarificationNeeded && (
                <div className="bg-amber-100/70 p-3 rounded-xl text-xs text-amber-900 font-semibold flex items-center gap-2">
                  <AlertCircle size={15} className="text-amber-700 shrink-0" />
                  <span>{nluResult.parsed.clarificationPrompt}</span>
                </div>
              )}

              {/* Stock Transaction Entities */}
              {(nluResult.parsed.intent === "STOCK_IN" || nluResult.parsed.intent === "STOCK_OUT") && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                      <span className="text-stone-500 block">Product:</span>
                      <strong className="text-stone-900 text-sm">{nluResult.parsed.crop || "Unknown"}</strong>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                      <span className="text-stone-500 block">Quantity:</span>
                      <strong className="text-stone-900 text-sm">
                        {nluResult.parsed.quantity || 0} {nluResult.parsed.unit}
                      </strong>
                    </div>
                    {nluResult.parsed.price && (
                      <div className="bg-white p-2.5 rounded-xl border border-emerald-100 col-span-2">
                        <span className="text-stone-500 block">Price:</span>
                        <strong className="text-stone-900 text-sm">₹{nluResult.parsed.price} per {nluResult.parsed.unit}</strong>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleConfirmAction}
                    className="w-full bg-agri-700 hover:bg-agri-800 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition-all mt-2"
                  >
                    <span>Proceed to Confirm</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {/* Navigation intents */}
              {nluResult.parsed.intent === "DIAGNOSE_CROP" && (
                <button
                  onClick={() => { onClose(); onNavigateTab("crop-doctor"); }}
                  className="w-full bg-agri-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2"
                >
                  Open AI Crop Doctor &rarr;
                </button>
              )}
              {nluResult.parsed.intent === "FIND_STORAGE" && (
                <button
                  onClick={() => { onClose(); onNavigateTab("cold-storage"); }}
                  className="w-full bg-blue-600 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2"
                >
                  Discover Cold Storage Facilities &rarr;
                </button>
              )}
              {nluResult.parsed.intent === "FIND_LOGISTICS" && (
                <button
                  onClick={() => { onClose(); onNavigateTab("logistics"); }}
                  className="w-full bg-purple-600 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2"
                >
                  Book Freight Logistics &rarr;
                </button>
              )}
            </div>
          )}

          {/* Quick Demo Prompts (Document Requirements Testing) */}
          <div className="space-y-2 pt-2 border-t border-stone-200">
            <div className="flex items-center justify-between text-xs font-bold text-stone-600">
              <span>{t("voiceTryPrompt")} (Hackathon Test Prompts)</span>
              <span className="text-[10px] text-stone-400">Tap to test instantly</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => handleDemoPrompt("Add 200 kilos of tomatoes")}
                className="text-left bg-stone-100 hover:bg-agri-50 hover:border-agri-300 border border-stone-200 p-2 rounded-xl text-xs font-medium text-stone-800 flex items-center justify-between group transition-all"
              >
                <span>🗣️ "Add 200 kilos of tomatoes"</span>
                <span className="text-[10px] bg-stone-200 group-hover:bg-agri-200 px-1.5 py-0.5 rounded font-mono">FR-07 Stock In</span>
              </button>

              <button
                onClick={() => handleDemoPrompt("I sold 100 kg tomatoes for 25 rupees per kilo")}
                className="text-left bg-stone-100 hover:bg-agri-50 hover:border-agri-300 border border-stone-200 p-2 rounded-xl text-xs font-medium text-stone-800 flex items-center justify-between group transition-all"
              >
                <span>🗣️ "I sold 100 kg tomatoes for 25 rupees per kilo"</span>
                <span className="text-[10px] bg-stone-200 group-hover:bg-agri-200 px-1.5 py-0.5 rounded font-mono">FR-07 Stock Out</span>
              </button>

              <button
                onClick={() => handleDemoPrompt("Tomato entha undi?")}
                className="text-left bg-stone-100 hover:bg-agri-50 hover:border-agri-300 border border-stone-200 p-2 rounded-xl text-xs font-medium text-stone-800 flex items-center justify-between group transition-all"
              >
                <span>🗣️ "Tomato entha undi?" (Telugu)</span>
                <span className="text-[10px] bg-stone-200 group-hover:bg-agri-200 px-1.5 py-0.5 rounded font-mono">FR-11 Voice Query</span>
              </button>

              <button
                onClick={() => handleDemoPrompt("tamatar kitna hai")}
                className="text-left bg-stone-100 hover:bg-agri-50 hover:border-agri-300 border border-stone-200 p-2 rounded-xl text-xs font-medium text-stone-800 flex items-center justify-between group transition-all"
              >
                <span>🗣️ "tamatar kitna hai" (Hindi)</span>
                <span className="text-[10px] bg-stone-200 group-hover:bg-agri-200 px-1.5 py-0.5 rounded font-mono">FR-10 Code-Mixed</span>
              </button>

              <button
                onClick={() => handleDemoPrompt("Market price of Tomato")}
                className="text-left bg-stone-100 hover:bg-agri-50 hover:border-agri-300 border border-stone-200 p-2 rounded-xl text-xs font-medium text-stone-800 flex items-center justify-between group transition-all"
              >
                <span>🗣️ "Market price of Tomato"</span>
                <span className="text-[10px] bg-stone-200 group-hover:bg-agri-200 px-1.5 py-0.5 rounded font-mono">FR-15 Mandi</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
