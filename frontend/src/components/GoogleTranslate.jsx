import React, { useEffect, useState, useRef, useMemo } from 'react';

// Comprehensive list of Google Translate languages
const ALL_LANGUAGES = [
  // 🇮🇳 Indian & Regional Languages
  { code: 'en', label: 'English', native: 'English', flag: '🇬🇧', category: 'Indian / Main' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', flag: '🇮🇳', category: 'Indian / Main' },
  { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳', category: 'Indian / Main' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা', flag: '🇮🇳', category: 'Indian / Main' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳', category: 'Indian / Main' },
  { code: 'mr', label: 'Marathi', native: 'मराठी', flag: '🇮🇳', category: 'Indian / Main' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', flag: '🇮🇳', category: 'Indian / Main' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు', flag: '🇮🇳', category: 'Indian / Main' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳', category: 'Indian / Main' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳', category: 'Indian / Main' },
  { code: 'ur', label: 'Urdu', native: 'اردو', flag: '🇵🇰', category: 'Indian / Main' },
  { code: 'ne', label: 'Nepali', native: 'नेपाली', flag: '🇳🇵', category: 'Indian / Main' },
  { code: 'or', label: 'Odia', native: 'ଓଡ଼ିଆ', flag: '🇮🇳', category: 'Indian / Main' },
  { code: 'as', label: 'Assamese', native: 'অসমীয়া', flag: '🇮🇳', category: 'Indian / Main' },
  { code: 'sd', label: 'Sindhi', native: 'سنڌي', flag: '🇮🇳', category: 'Indian / Main' },
  { code: 'mai', label: 'Maithili', native: 'मैथिली', flag: '🇮🇳', category: 'Indian / Main' },
  { code: 'doi', label: 'Dogri', native: 'डोगरी', flag: '🇮🇳', category: 'Indian / Main' },
  { code: 'gom', label: 'Konkani', native: 'कोंकणी', flag: '🇮🇳', category: 'Indian / Main' },
  { code: 'mni-Mtei', label: 'Manipuri', native: 'মৈতৈলোন্', flag: '🇮🇳', category: 'Indian / Main' },
  { code: 'sat', label: 'Santali', native: 'ᱥᱟᱱᱛᱟᱲᱤ', flag: '🇮🇳', category: 'Indian / Main' },
  { code: 'bdo', label: 'Bodo', native: 'बर\'', flag: '🇮🇳', category: 'Indian / Main' },

  // 🌐 Global Major Languages
  { code: 'es', label: 'Spanish', native: 'Español', flag: '🇪🇸', category: 'Global' },
  { code: 'fr', label: 'French', native: 'Français', flag: '🇫🇷', category: 'Global' },
  { code: 'de', label: 'German', native: 'Deutsch', flag: '🇩🇪', category: 'Global' },
  { code: 'ar', label: 'Arabic', native: 'العربية', flag: '🇸🇦', category: 'Global' },
  { code: 'zh-CN', label: 'Chinese (Simplified)', native: '简体中文', flag: '🇨🇳', category: 'Global' },
  { code: 'zh-TW', label: 'Chinese (Traditional)', native: '繁體中文', flag: '🇹🇼', category: 'Global' },
  { code: 'ja', label: 'Japanese', native: '日本語', flag: '🇯🇵', category: 'Global' },
  { code: 'ko', label: 'Korean', native: '한국어', flag: '🇰🇷', category: 'Global' },
  { code: 'ru', label: 'Russian', native: 'Русский', flag: '🇷🇺', category: 'Global' },
  { code: 'pt', label: 'Portuguese', native: 'Português', flag: '🇵🇹', category: 'Global' },
  { code: 'it', label: 'Italian', native: 'Italiano', flag: '🇮🇹', category: 'Global' },
  { code: 'tr', label: 'Turkish', native: 'Türkçe', flag: '🇹🇷', category: 'Global' },
  { code: 'id', label: 'Indonesian', native: 'Bahasa Indonesia', flag: '🇮🇩', category: 'Global' },
  { code: 'vi', label: 'Vietnamese', native: 'Tiếng Việt', flag: '🇻🇳', category: 'Global' },
  { code: 'th', label: 'Thai', native: 'ไทย', flag: '🇹🇭', category: 'Global' },
  { code: 'nl', label: 'Dutch', native: 'Nederlands', flag: '🇳🇱', category: 'Global' },
  { code: 'pl', label: 'Polish', native: 'Polski', flag: '🇵🇱', category: 'Global' },

  // 🌍 All Google Translate Languages
  { code: 'af', label: 'Afrikaans', native: 'Afrikaans', flag: '🇿🇦', category: 'All Languages' },
  { code: 'sq', label: 'Albanian', native: 'Shqip', flag: '🇦🇱', category: 'All Languages' },
  { code: 'am', label: 'Amharic', native: 'አማርኛ', flag: '🇪🇹', category: 'All Languages' },
  { code: 'hy', label: 'Armenian', native: 'Հայերեն', flag: '🇦🇲', category: 'All Languages' },
  { code: 'az', label: 'Azerbaijani', native: 'Azərbaycan', flag: '🇦🇿', category: 'All Languages' },
  { code: 'eu', label: 'Basque', native: 'Euskara', flag: '🇪🇸', category: 'All Languages' },
  { code: 'be', label: 'Belarusian', native: 'Беларуская', flag: '🇧🇾', category: 'All Languages' },
  { code: 'bs', label: 'Bosnian', native: 'Bosanski', flag: '🇧🇦', category: 'All Languages' },
  { code: 'bg', label: 'Bulgarian', native: 'Български', flag: '🇧🇬', category: 'All Languages' },
  { code: 'ca', label: 'Catalan', native: 'Català', flag: '🇪🇸', category: 'All Languages' },
  { code: 'hr', label: 'Croatian', native: 'Hrvatski', flag: '🇭🇷', category: 'All Languages' },
  { code: 'cs', label: 'Czech', native: 'Čeština', flag: '🇨🇿', category: 'All Languages' },
  { code: 'da', label: 'Danish', native: 'Dansk', flag: '🇩🇰', category: 'All Languages' },
  { code: 'eo', label: 'Esperanto', native: 'Esperanto', flag: '🌐', category: 'All Languages' },
  { code: 'et', label: 'Estonian', native: 'Eesti', flag: '🇪🇪', category: 'All Languages' },
  { code: 'fi', label: 'Finnish', native: 'Suomi', flag: '🇫🇮', category: 'All Languages' },
  { code: 'ka', label: 'Georgian', native: 'ქართული', flag: '🇬🇪', category: 'All Languages' },
  { code: 'el', label: 'Greek', native: 'Ελληνικά', flag: '🇬🇷', category: 'All Languages' },
  { code: 'ht', label: 'Haitian Creole', native: 'Kreyòl Ayisyen', flag: '🇭🇹', category: 'All Languages' },
  { code: 'he', label: 'Hebrew', native: 'עברית', flag: '🇮🇱', category: 'All Languages' },
  { code: 'hu', label: 'Hungarian', native: 'Magyar', flag: '🇭🇺', category: 'All Languages' },
  { code: 'is', label: 'Icelandic', native: 'Íslenska', flag: '🇮🇸', category: 'All Languages' },
  { code: 'ga', label: 'Irish', native: 'Gaeilge', flag: '🇮🇪', category: 'All Languages' },
  { code: 'jw', label: 'Javanese', native: 'Basa Jawa', flag: '🇮🇩', category: 'All Languages' },
  { code: 'km', label: 'Khmer', native: 'ភាសាខ្មែរ', flag: '🇰🇭', category: 'All Languages' },
  { code: 'lo', label: 'Lao', native: 'ພາສາລາວ', flag: '🇱🇦', category: 'All Languages' },
  { code: 'la', label: 'Latin', native: 'Latina', flag: '🇻🇦', category: 'All Languages' },
  { code: 'lv', label: 'Latvian', native: 'Latviešu', flag: '🇱🇻', category: 'All Languages' },
  { code: 'lt', label: 'Lithuanian', native: 'Lietuvių', flag: '🇱🇹', category: 'All Languages' },
  { code: 'ms', label: 'Malay', native: 'Bahasa Melayu', flag: '🇲🇾', category: 'All Languages' },
  { code: 'mt', label: 'Maltese', native: 'Malti', flag: '🇲🇹', category: 'All Languages' },
  { code: 'mn', label: 'Mongolian', native: 'Монгол', flag: '🇲🇳', category: 'All Languages' },
  { code: 'my', label: 'Burmese', native: 'မြန်မာဘာသာ', flag: '🇲🇲', category: 'All Languages' },
  { code: 'fa', label: 'Persian', native: 'فارسی', flag: '🇮🇷', category: 'All Languages' },
  { code: 'ro', label: 'Romanian', native: 'Română', flag: '🇷🇴', category: 'All Languages' },
  { code: 'sr', label: 'Serbian', native: 'Српски', flag: '🇷🇸', category: 'All Languages' },
  { code: 'si', label: 'Sinhala', native: 'සිංහල', flag: '🇱🇰', category: 'All Languages' },
  { code: 'sk', label: 'Slovak', native: 'Slovenčina', flag: '🇸🇰', category: 'All Languages' },
  { code: 'sl', label: 'Slovenian', native: 'Slovenščina', flag: '🇸🇮', category: 'All Languages' },
  { code: 'sw', label: 'Swahili', native: 'Kiswahili', flag: '🇰🇪', category: 'All Languages' },
  { code: 'sv', label: 'Swedish', native: 'Svenska', flag: '🇸🇪', category: 'All Languages' },
  { code: 'tl', label: 'Tagalog', native: 'Wikang Tagalog', flag: '🇵🇭', category: 'All Languages' },
  { code: 'uk', label: 'Ukrainian', native: 'Українська', flag: '🇺🇦', category: 'All Languages' },
  { code: 'cy', label: 'Welsh', native: 'Cymraeg', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', category: 'All Languages' },
  { code: 'yi', label: 'Yiddish', native: 'ייִדיש', flag: '🇮🇱', category: 'All Languages' },
];

const GoogleTranslate = () => {
  const isMounted = useRef(false);
  const [currentLang, setCurrentLang] = useState(() => {
    return localStorage.getItem('farm_fusion_lang') || 'en';
  });
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Filter languages based on search input
  const filteredLanguages = useMemo(() => {
    if (!search.trim()) return ALL_LANGUAGES;
    const query = search.toLowerCase().trim();
    return ALL_LANGUAGES.filter(
      (l) =>
        l.label.toLowerCase().includes(query) ||
        l.native.toLowerCase().includes(query) ||
        l.code.toLowerCase().includes(query)
    );
  }, [search]);

  useEffect(() => {
    if (isMounted.current) return;
    isMounted.current = true;

    const containerId = 'google_translate_element';

    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        try {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              autoDisplay: false,
            },
            containerId
          );

          // Restore saved language if set
          const savedLang = localStorage.getItem('farm_fusion_lang');
          if (savedLang && savedLang !== 'en') {
            setTimeout(() => {
              applyLanguageChange(savedLang);
            }, 800);
          }
        } catch (e) {
          console.error('Google Translate Init Error:', e);
        }
      }
    };

    const scriptId = 'google-translate-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'text/javascript';
      script.src =
        'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      document.body.appendChild(script);
    } else {
      if (window.google && window.google.translate && window.google.translate.TranslateElement) {
        window.googleTranslateElementInit();
      }
    }

    // Close dropdown on outside click
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const applyLanguageChange = (langCode) => {
    // Set googtrans cookie across domains and paths
    if (langCode === 'en') {
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
    } else {
      document.cookie = `googtrans=/en/${langCode}; path=/;`;
      document.cookie = `googtrans=/en/${langCode}; path=/; domain=${window.location.hostname}`;
    }

    // Polling trigger for Google Translate select element (.goog-te-combo)
    let attempts = 0;
    const triggerSelect = () => {
      const select =
        document.querySelector('.goog-te-combo') ||
        document.querySelector('#google_translate_element select');

      if (select) {
        select.value = langCode;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        select.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
      return false;
    };

    if (!triggerSelect()) {
      const interval = setInterval(() => {
        attempts++;
        if (triggerSelect() || attempts > 20) {
          clearInterval(interval);
        }
      }, 100);
    }
  };

  const changeLanguage = (langCode) => {
    setCurrentLang(langCode);
    localStorage.setItem('farm_fusion_lang', langCode);
    setIsOpen(false);
    setSearch('');
    applyLanguageChange(langCode);
  };

  const currentLangObj =
    ALL_LANGUAGES.find((l) => l.code === currentLang) || ALL_LANGUAGES[0];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Invisible container for actual Google Translate widget so JS DOM events trigger properly */}
      <div
        id="google_translate_element"
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
          height: 0,
          width: 0,
          overflow: 'hidden',
        }}
      ></div>

      {/* Styles to remove annoying Google frames and tooltips */}
      <style>
        {`
          .goog-te-banner-frame { display: none !important; visibility: hidden !important; height: 0 !important; }
          .goog-logo-link { display: none !important; }
          .goog-te-gadget { display: none !important; font-size: 0 !important; }
          body { top: 0 !important; position: static !important; }
          #goog-gt-tt { display: none !important; }
          .goog-tooltip { display: none !important; }
          .goog-tooltip:hover { display: none !important; }
          .goog-text-highlight { background-color: transparent !important; box-shadow: none !important; }
          .goog-te-spinner-pos { display: none !important; }
        `}
      </style>

      {/* Language Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-[#080f25] border border-[#10b981]/40 hover:border-[#10b981] px-3.5 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-lg hover:shadow-emerald-950/50 cursor-pointer group"
      >
        <span className="text-base group-hover:scale-110 transition-transform">
          {currentLangObj.flag}
        </span>
        <div className="flex flex-col text-left leading-none">
          <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">
            Language
          </span>
          <span className="text-xs font-extrabold text-white truncate max-w-[90px]">
            {currentLangObj.label}
          </span>
        </div>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`ml-1 text-emerald-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Searchable Language Menu */}
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 w-72 bg-[#0d1527] border border-[#10b981]/30 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden ff-scale-in"
          style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}
        >
          {/* Header & Search Bar */}
          <div className="p-3 border-b border-gray-800 bg-[#080f25]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                🌐 Google Translate ({ALL_LANGUAGES.length})
              </span>
              <span className="text-[10px] text-gray-500">Live Translate</span>
            </div>
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search language (e.g. Hindi, Punjabi, Spanish)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#131f37] text-white placeholder-gray-400 text-xs px-3 py-2 pl-8 rounded-xl border border-gray-700 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <svg
                className="absolute left-2.5 top-2.5 text-gray-400"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Language List */}
          <div className="max-h-64 overflow-y-auto p-1.5 divide-y divide-gray-800/40 custom-scrollbar">
            {filteredLanguages.map((lang) => {
              const isSelected = currentLang === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600/20 text-emerald-400 font-bold border border-emerald-500/30'
                      : 'text-gray-300 hover:bg-emerald-500/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-base">{lang.flag}</span>
                    <div className="flex flex-col text-left truncate">
                      <span className="truncate">{lang.label}</span>
                      {lang.native !== lang.label && (
                        <span className="text-[10px] text-gray-400 font-normal truncate">
                          {lang.native}
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <span className="text-emerald-400 text-xs font-bold">✓</span>
                  )}
                </button>
              );
            })}

            {filteredLanguages.length === 0 && (
              <div className="text-center py-6 text-xs text-gray-400">
                No languages found matching "{search}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleTranslate;
