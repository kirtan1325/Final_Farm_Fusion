import { useState, useEffect, useRef } from "react";
import axiosInstance from "../api/axiosInstance";

const BACKEND_URL = import.meta.env.VITE_API_URL || "https://final-farm-fusion.onrender.com";

const SUPPORTED_LANGUAGES = [
  { code: "en-IN", label: "English (India)", flag: "🇮🇳" },
  { code: "hi-IN", label: "हिन्दी (Hindi)", flag: "🇮🇳" },
  { code: "gu-IN", label: "ગુજરાતી (Gujarati)", flag: "🇮🇳" },
  { code: "ta-IN", label: "தமிழ் (Tamil)", flag: "🇮🇳" },
  { code: "te-IN", label: "తెలుగు (Telugu)", flag: "🇮🇳" },
  { code: "mr-IN", label: "मराठी (Marathi)", flag: "🇮🇳" },
  { code: "pa-IN", label: "ਪੰਜਾਬੀ (Punjabi)", flag: "🇮🇳" },
];

export default function VoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [aiEngineName, setAiEngineName] = useState("");
  const [language, setLanguage] = useState("en-IN");
  const [loading, setLoading] = useState(false);
  const [manualText, setManualText] = useState("");

  const recogRef = useRef(null);

  useEffect(() => {
    // Initialize Web Speech Recognition API (Speech-to-Text)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recogRef.current = new SpeechRecognition();
      recogRef.current.continuous = false;
      recogRef.current.interimResults = false;

      recogRef.current.onresult = (event) => {
        const spokenText = event.results[0][0].transcript;
        setTranscript(spokenText);
        setIsListening(false);
        fetchGeminiVoiceAnswer(spokenText, language);
      };

      recogRef.current.onerror = (e) => {
        console.warn("Speech recognition notice:", e.error);
        setIsListening(false);
      };

      recogRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [language]);

  const toggleListen = () => {
    if (isListening) {
      recogRef.current?.stop();
      setIsListening(false);
    } else {
      if (recogRef.current) {
        setTranscript("");
        setResponse("");
        setAiEngineName("");
        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
        }
        recogRef.current.lang = language;
        try {
          recogRef.current.start();
          setIsListening(true);
        } catch (err) {
          console.warn("Speech start notice:", err);
        }
      } else {
        alert("Voice speech recognition is not supported in this browser. You can type your query below!");
      }
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualText || !manualText.trim()) return;
    const text = manualText.trim();
    setTranscript(text);
    setManualText("");
    fetchGeminiVoiceAnswer(text, language);
  };

  const fetchGeminiVoiceAnswer = async (text, lang) => {
    setLoading(true);
    setResponse("");
    setAiEngineName("");

    try {
      // Direct call to backend Gemini AI Voice Assistant Endpoint
      let res;
      try {
        res = await axiosInstance.post("/ai/voice-assistant", { query: text, language: lang });
      } catch (e) {
        // Direct URL fallback
        const axios = (await import("axios")).default;
        res = await axios.post(`${BACKEND_URL}/api/ai/voice-assistant`, { query: text, language: lang });
      }

      if (res.data && res.data.success && res.data.response) {
        setResponse(res.data.response);
        setAiEngineName(res.data.aiEngine || "Google Gemini AI");
        speakTextToVoice(res.data.response, lang);
      } else {
        setResponse("Sorry, I could not generate an answer right now. Please try again.");
      }
    } catch (err) {
      console.error("Gemini Voice Assistant Error:", err);
      setResponse("Sorry, Gemini AI voice server is unreachable right now. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  // Convert Gemini Text Output back to Spoken Audio Voice (Text-to-Speech)
  const speakTextToVoice = (text, lang) => {
    if (!("speechSynthesis" in window) || !text) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.95; // Natural clear pace for farmers
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white text-2xl hover:scale-110 active:scale-95 transition-all z-50 bg-gradient-to-r from-[#0F4C2A] to-emerald-600 border-2 border-emerald-400 cursor-pointer group"
        title="✨ Open Gemini AI Voice Assistant"
      >
        <span className="group-hover:animate-pulse">🎙️</span>
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white animate-ping"></span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 max-w-[calc(100vw-2rem)] w-88 sm:w-96 bg-white rounded-2xl shadow-2xl border-2 border-emerald-500 z-50 overflow-hidden flex flex-col transition-all">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-emerald-700 bg-gradient-to-r from-[#0F4C2A] to-emerald-800 text-white">
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <div>
            <h3 className="text-white font-bold text-xs uppercase tracking-wider">
              Gemini AI Voice Assistant
            </h3>
            <span className="text-[10px] text-emerald-200 block font-medium">
              Speech ➔ Gemini AI ➔ Voice Output
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            setIsOpen(false);
            stopSpeech();
          }}
          className="text-emerald-200 hover:text-white text-xl font-bold leading-none cursor-pointer p-1"
        >
          &times;
        </button>
      </div>

      <div className="p-4 flex flex-col items-center space-y-3">
        {/* Language selector */}
        <div className="w-full flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <span>🗣️</span> Spoken Language
          </span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 outline-none cursor-pointer focus:border-emerald-500"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.label}
              </option>
            ))}
          </select>
        </div>

        {/* Big Mic Circle */}
        <button
          onClick={toggleListen}
          className={`w-20 h-20 rounded-full flex flex-col items-center justify-center text-3xl shadow-xl transition-all cursor-pointer relative ${
            isListening
              ? "bg-red-600 text-white scale-105 shadow-red-300"
              : "bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-400 text-[#0F4C2A] hover:bg-emerald-200 hover:scale-105"
          }`}
        >
          {isListening && (
            <span className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-75"></span>
          )}
          <span className="relative z-10">{isListening ? "👂" : "🎤"}</span>
          <span className="relative z-10 text-[9px] font-extrabold uppercase mt-0.5 tracking-tight">
            {isListening ? "Listening" : "Tap Speak"}
          </span>
        </button>

        <p className="text-[11px] font-semibold text-slate-500 text-center">
          {isListening ? (
            <span className="text-red-600 font-bold animate-pulse">
              🎙️ Listening to your voice... Speak now!
            </span>
          ) : (
            "Speak your farming query (Mandi rates, crop advisory, diseases)"
          )}
        </p>

        {/* Manual Text Input Bar */}
        <form onSubmit={handleManualSubmit} className="w-full flex items-center gap-1.5 pt-1">
          <input
            type="text"
            placeholder="Or type voice query here..."
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            className="flex-1 text-xs px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-emerald-500 text-slate-900"
          />
          <button
            type="submit"
            disabled={!manualText.trim()}
            className="px-3 py-1.5 bg-[#0F4C2A] hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg cursor-pointer shrink-0"
          >
            ✨ Send
          </button>
        </form>

        {/* Dynamic Display Area */}
        <div className="w-full space-y-2 pt-1">
          {/* User's Spoken Input (Speech-To-Text Output) */}
          {transcript && (
            <div className="bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 shadow-2xs">
              <span className="font-extrabold text-[10px] text-emerald-800 block mb-0.5 uppercase tracking-wider flex items-center gap-1">
                <span>🎙️</span> SPEECH-TO-TEXT INPUT
              </span>
              <p className="font-medium text-slate-800">"{transcript}"</p>
            </div>
          )}

          {/* Loading Animation */}
          {loading && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-emerald-800 animate-pulse">
              <span>✨</span>
              <span>Gemini AI is processing query & generating voice...</span>
            </div>
          )}

          {/* Gemini AI Voice Response & TTS Output */}
          {response && !loading && (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-3 text-xs text-emerald-950 shadow-sm space-y-2 relative">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-1.5">
                <span className="font-extrabold text-[10px] text-[#0F4C2A] uppercase tracking-wider flex items-center gap-1">
                  <span>✨</span> GEMINI AI VOICE RESPONSE
                </span>
                {aiEngineName && (
                  <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-bold">
                    {aiEngineName}
                  </span>
                )}
              </div>

              <p className="font-semibold text-slate-900 leading-relaxed pt-0.5">
                {response}
              </p>

              {/* Voice Controls */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1">
                  {isSpeaking ? (
                    <button
                      onClick={stopSpeech}
                      className="px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 border border-red-300 rounded-md font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      <span>⏹️</span> Stop Voice
                    </button>
                  ) : (
                    <button
                      onClick={() => speakTextToVoice(response, language)}
                      className="px-2.5 py-1 bg-white text-[#0F4C2A] hover:bg-emerald-100 border border-emerald-300 rounded-md font-bold text-[10px] flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <span>🔊</span> Replay Voice
                    </button>
                  )}
                </div>
                {isSpeaking && (
                  <span className="text-[10px] font-bold text-emerald-700 animate-pulse flex items-center gap-1">
                    <span>🔊</span> Speaking response...
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
