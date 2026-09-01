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
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full shadow-2xl flex items-center justify-center text-white text-xl hover:scale-110 active:scale-95 transition-all z-50 border border-[rgba(0,244,254,0.4)] cursor-pointer"
        style={{ background: "linear-gradient(135deg, #10b981, #00f4fe)", color: "#002021", boxShadow: "0 8px 25px rgba(0, 244, 254, 0.3)" }}>
        🎙️
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-[#0d1315] rounded-2xl shadow-2xl border border-[rgba(0,244,254,0.3)] z-50 overflow-hidden flex flex-col backdrop-blur-xl">
      <div className="px-5 py-3 flex items-center justify-between border-b border-white/10"
        style={{ background: "rgba(16, 185, 129, 0.15)" }}>
        <h3 className="text-white font-bold flex items-center gap-2 text-sm"><span>🎙️</span> AI Farm Voice Assistant</h3>
        <button onClick={() => { setIsOpen(false); window.speechSynthesis.cancel(); }} className="text-[#a8cfb9] hover:text-white text-xl leading-none cursor-pointer">&times;</button>
      </div>


      <div className="p-5 flex flex-col items-center">
        <div className="w-full flex justify-end mb-3">
          <select value={language} onChange={e => setLanguage(e.target.value)}
            className="text-xs font-bold bg-[#0b0f10] border border-white/15 rounded-lg px-2 py-1 outline-none text-[#00f4fe] cursor-pointer">
            <option value="en-IN">English (India)</option>
            <option value="hi-IN">हिन्दी (Hindi)</option>
            <option value="ta-IN">தமிழ் (Tamil)</option>
          </select>
        </div>

        <button onClick={toggleListen}
          className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-xl transition-all cursor-pointer relative ${isListening ? "bg-red-500 text-white scale-110 shadow-[0_0_20px_rgba(239,68,68,0.5)]" : "bg-[#0b0f10] border-2 border-[rgba(0,244,254,0.3)] text-[#00f4fe] hover:scale-105"}`}>
          {isListening && <span className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-75"></span>}
          <span className="relative z-10">{isListening ? "👂" : "🎤"}</span>
        </button>
        
        <p className="mt-3 text-xs font-bold text-[#a8cfb9] uppercase tracking-widest text-center">
          {isListening ? "Listening..." : "Tap Microphone to Speak"}
        </p>

        <div className="w-full mt-4 space-y-3">
          {transcript && (
            <div className="bg-[#0b0f10] rounded-xl p-3 border border-white/10 text-xs text-white self-end">
              <span className="font-bold text-[10px] text-[#00f4fe] block mb-0.5">YOU SAID</span>
              "{transcript}"
            </div>
          )}
          
          {loading && (
            <div className="flex gap-1 items-center justify-center py-2">
              <span className="w-2 h-2 bg-[#00f4fe] rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-[#00f4fe] rounded-full animate-bounce delay-100"></span>
              <span className="w-2 h-2 bg-[#00f4fe] rounded-full animate-bounce delay-200"></span>
            </div>
          )}

          {response && !loading && (
            <div className="bg-[#0b0f10] border border-[rgba(76,227,70,0.4)] rounded-xl p-3 text-xs font-medium text-[#4ce346] shadow-sm relative">
              {response}
              <button onClick={() => speakText(response, language)} className="absolute bottom-2 right-2 text-[#00f4fe] bg-white/10 hover:bg-white/20 rounded-full p-1 text-xs cursor-pointer">
                🔊
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
