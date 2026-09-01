import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";

export default function SearchAutocomplete({ 
  value, 
  onChange, 
  onSelect, 
  fetchSuggestions, 
  placeholder = "Search...", 
  renderItem = (item) => item.name || item.title || item.label,
  className = ""
}) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  // Sync external value
  useEffect(() => {
    if (value !== undefined && value !== query) {
      setQuery(value);
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (!query || query.length < 2) {
        setSuggestions([]);
        return;
      }
      
      setLoading(true);
      try {
        const results = await fetchSuggestions(query);
        setSuggestions(results || []);
        setShowDropdown(true);
      } catch (err) {
        console.error("Search suggestions failed", err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query, fetchSuggestions]);

  const handleSelect = (item) => {
    const textValue = renderItem(item);
    setQuery(textValue);
    setShowDropdown(false);
    if (onChange) onChange(textValue);
    if (onSelect) onSelect(item);
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setShowDropdown(true);
    if (onChange) onChange(e.target.value);
  };

  return (
    <div className={`relative w-full ${className}`} ref={wrapperRef}>
      <div className="relative flex items-center w-full">
        <div className="absolute left-3.5 text-[#00f4fe] pointer-events-none z-10">
          <Search size={16} />
        </div>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
          className="w-full !pl-10 !pr-10 py-2 bg-[#062c1d] border border-[rgba(0,244,254,0.3)] rounded-xl outline-none focus:border-[#00f4fe] focus:ring-2 focus:ring-[#00f4fe]/20 transition-all text-sm text-white"
        />
        {loading && (
          <div className="absolute right-3 text-emerald-500">
            <Loader2 size={14} className="animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-60 overflow-y-auto overflow-x-hidden">
          <ul>
            {suggestions.map((item, idx) => (
              <li
                key={item._id || item.id || idx}
                onClick={() => handleSelect(item)}
                className="px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-center gap-2"
              >
                <Search size={14} className="text-gray-300 flex-shrink-0" />
                <span className="truncate">{renderItem(item)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
