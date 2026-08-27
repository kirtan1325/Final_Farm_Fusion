import React, { useEffect, useState, useRef } from 'react';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi', flag: '🇮🇳' },
  { code: 'ta', label: 'Tamil', flag: '🇮🇳' },
  { code: 'te', label: 'Telugu', flag: '🇮🇳' },
  { code: 'mr', label: 'Marathi', flag: '🇮🇳' },
];

const GoogleTranslate = () => {
  const isMounted = useRef(false);
  const [currentLang, setCurrentLang] = useState('en');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isMounted.current) return;
    isMounted.current = true;

    // We use a unique ID in case of remounts
    const containerId = 'google_translate_element';
    
    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        try {
          new window.google.translate.TranslateElement(
            { pageLanguage: 'en', autoDisplay: false },
            containerId
          );
        } catch (e) {
          console.error("Google Translate Init Error:", e);
        }
      }
    };

    const scriptId = 'google-translate-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'text/javascript';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      document.body.appendChild(script);
    } else {
      if (window.google && window.google.translate && window.google.translate.TranslateElement) {
        window.googleTranslateElementInit();
      }
    }

    // Close dropdown when clicking outside
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const changeLanguage = (langCode) => {
    setCurrentLang(langCode);
    setIsOpen(false);
    
    // Find the hidden Google Translate select element
    const select = document.querySelector('.goog-te-combo');
    if (select) {
      select.value = langCode;
      select.dispatchEvent(new Event('change'));
    }
  };

  const currentLangObj = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Hidden container for the actual Google widget */}
      <div id="google_translate_element" className="hidden"></div>
      
      {/* Global CSS to hide the annoying Google banners and tooltips */}
      <style>
        {`
          .goog-te-banner-frame { display: none !important; }
          .goog-logo-link { display: none !important; }
          .goog-te-gadget { display: none !important; }
          body { top: 0 !important; }
          #goog-gt-tt { display: none !important; }
          .goog-tooltip { display: none !important; }
          .goog-tooltip:hover { display: none !important; }
          .goog-text-highlight { background-color: transparent !important; box-shadow: none !important; }
        `}
      </style>

      {/* Custom UI Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-[#080f25] border border-[#10b981]/30 hover:border-[#10b981]/60 px-3 py-1.5 rounded-full text-white text-xs font-bold transition-all shadow-md"
      >
        <span className="text-sm">{currentLangObj.flag}</span>
        <span className="uppercase tracking-wider">{currentLangObj.label}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Custom Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-36 bg-[#080f25] border border-[#10b981]/30 rounded-xl shadow-2xl z-50 overflow-hidden ff-scale-in">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer
                ${currentLang === lang.code ? 'bg-[#10b981]/20 text-[#10b981]' : 'text-gray-300 hover:bg-[#10b981]/10 hover:text-white'}`}
            >
              <span className="text-sm">{lang.flag}</span>
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default GoogleTranslate;
