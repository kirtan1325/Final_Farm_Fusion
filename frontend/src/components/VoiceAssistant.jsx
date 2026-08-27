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
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full shadow-2xl flex items-center justify-center text-white text-2xl hover:scale-110 active:scale-95 transition-all z-50 animate-bounce">
        🎙️
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden flex flex-col">
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-5 py-4 flex items-center justify-between">
        <h3 className="text-white font-bold flex items-center gap-2"><span>🎙️</span> AI Farm Assistant</h3>
        <button onClick={() => { setIsOpen(false); window.speechSynthesis.cancel(); }} className="text-white hover:text-green-200 text-2xl leading-none">&times;</button>
      </div>

      <div className="p-5 flex flex-col items-center">
        <div className="w-full flex justify-end mb-4">
          <select value={language} onChange={e => setLanguage(e.target.value)}
            className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 outline-none text-gray-700 cursor-pointer">
            <option value="en-IN">English (India)</option>
            <option value="hi-IN">हिन्दी (Hindi)</option>
            <option value="ta-IN">தமிழ் (Tamil)</option>
          </select>
        </div>

        <button onClick={toggleListen}
          className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-xl transition-all cursor-pointer relative ${isListening ? "bg-red-500 text-white scale-110" : "bg-gray-50 border-4 border-gray-100 text-gray-400 hover:bg-green-50 hover:border-green-200 hover:text-green-600"}`}>
          {isListening && <span className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-75"></span>}
          <span className="relative z-10">{isListening ? "👂" : "🎤"}</span>
        </button>
        
        <p className="mt-4 text-sm font-bold text-gray-400 uppercase tracking-widest text-center">
          {isListening ? "Listening..." : "Tap to Speak"}
        </p>

        <div className="w-full mt-6 space-y-3">
          {transcript && (
            <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 text-sm text-gray-700 self-end">
              <span className="font-bold text-xs text-gray-400 block mb-1">YOU SAID</span>
              "{transcript}"
            </div>
          )}
          
          {loading && (
            <div className="flex gap-1 items-center justify-center py-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce delay-100"></span>
              <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce delay-200"></span>
            </div>
          )}

          {response && !loading && (
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-sm font-medium text-green-900 shadow-sm relative">
              {response}
              <button onClick={() => speakText(response, language)} className="absolute bottom-2 right-2 text-green-600 hover:text-green-800 bg-white rounded-full p-1.5 shadow-sm text-xs cursor-pointer">
                🔊
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
