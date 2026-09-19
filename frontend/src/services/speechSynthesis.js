// Browser Text-to-Speech (TTS) Voice Synthesis Service
// Handles regional speech playback in English, Telugu, and Hindi

export function speakText(text, lang = "en") {
  if (!text || typeof window === "undefined" || !("speechSynthesis" in window)) {
    console.warn("Speech synthesis not supported or empty text:", text);
    return;
  }

  // Cancel any currently speaking audio
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95; // slightly slower for better clarity for farmers
  utterance.pitch = 1.0;

  // Language mapping
  let targetLang = "en-IN";
  if (lang === "te") targetLang = "te-IN";
  else if (lang === "hi") targetLang = "hi-IN";

  utterance.lang = targetLang;

  // Attempt to find an appropriate voice
  const voices = window.speechSynthesis.getVoices();
  const match = voices.find(v => v.lang.startsWith(targetLang) || v.lang.includes(lang));
  if (match) {
    utterance.voice = match;
  }

  utterance.onerror = (e) => {
    console.warn("Speech synthesis notice:", e);
  };

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
