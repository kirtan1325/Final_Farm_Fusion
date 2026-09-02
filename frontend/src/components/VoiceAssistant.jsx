import { useState, useEffect, useRef } from "react";
import axios from "axios";

const ML_API_URL = import.meta.env.VITE_ML_API_URL || "https://farm-fusion-5.onrender.com";

export default function VoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [language, setLanguage] = useState("en-IN");
  const [loading, setLoading] = useState(false);

  const recogRef = useRef(null);

  useEffect(() => {
    // Initialize SpeechRecognition if available
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recogRef.current = new SpeechRecognition();
      recogRef.current.continuous = false;
      recogRef.current.interimResults = false;
      
      recogRef.current.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        setIsListening(false);
        fetchAnswer(text, language);
      };

      recogRef.current.onerror = (e) => {
        console.error("Speech recognition error:", e.error);
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
        recogRef.current.lang = language;
        recogRef.current.start();
        setIsListening(true);
      } else {
        alert("Your browser does not support Voice Recognition.");
      }
    }
  };

  const fetchAnswer = async (text, lang) => {
    setLoading(true);
    try {
      const res = await axios.post(`${ML_API_URL}/voice-assistant`, { query: text, language: lang });
      if (res.data.success) {
        setResponse(res.data.response);
        speakText(res.data.response, lang);
      }
    } catch (err) {
      setResponse("Sorry, I am offline right now.");
    } finally {
      setLoading(false);
    }
  };

  const speakText = (text, lang) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      window.speechSynthesis.speak(utterance);
    }
  };

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white text-xl hover:scale-105 active:scale-95 transition-all z-50 bg-[#0F4C2A] border border-emerald-600 cursor-pointer">
        🎙️
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 max-w-[calc(100vw-2rem)] w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden flex flex-col">
      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100 bg-[#0F4C2A] text-white">
        <h3 className="text-white font-bold flex items-center gap-2 text-xs uppercase tracking-wider"><span>🎙️</span> AI Farm Voice Assistant</h3>
        <button onClick={() => { setIsOpen(false); window.speechSynthesis.cancel(); }} className="text-emerald-200 hover:text-white text-lg leading-none cursor-pointer">&times;</button>
      </div>

      <div className="p-4 flex flex-col items-center">
        <div className="w-full flex justify-end mb-3">
          <select value={language} onChange={e => setLanguage(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-md px-2 py-1 outline-none text-slate-700 cursor-pointer">
            <option value="en-IN">English (India)</option>
            <option value="hi-IN">हिन्दी (Hindi)</option>
            <option value="ta-IN">தமிழ் (Tamil)</option>
          </select>
        </div>

        <button onClick={toggleListen}
          className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-md transition-all cursor-pointer relative ${isListening ? "bg-red-600 text-white scale-105 shadow-lg" : "bg-emerald-50 border border-emerald-200 text-[#0F4C2A] hover:bg-emerald-100"}`}>
          {isListening && <span className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-75"></span>}
          <span className="relative z-10">{isListening ? "👂" : "🎤"}</span>
        </button>
        
        <p className="mt-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
          {isListening ? "Listening..." : "Tap Microphone to Speak"}
        </p>

        <div className="w-full mt-3 space-y-2">
          {transcript && (
            <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 text-xs text-slate-900 self-end">
              <span className="font-bold text-[10px] text-emerald-700 block mb-0.5 uppercase">YOU SAID</span>
              "{transcript}"
            </div>
          )}
          
          {loading && (
            <div className="flex gap-1 items-center justify-center py-2">
              <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce delay-100"></span>
              <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce delay-200"></span>
            </div>
          )}

          {response && !loading && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-xs font-medium text-emerald-900 shadow-xs relative">
              {response}
              <button onClick={() => speakText(response, language)} className="absolute bottom-2 right-2 text-emerald-700 bg-white hover:bg-emerald-100 rounded-full p-1 text-xs cursor-pointer border border-emerald-200">
                🔊
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
