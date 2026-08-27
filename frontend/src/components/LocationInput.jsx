import React, { useState, useEffect, useRef } from "react";
import { MapPin, Navigation, Loader2 } from "lucide-react";

export default function LocationInput({ value, onChange, placeholder = "Enter location..." }) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  // Sync external value changes
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

  const fetchLocations = async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`, {
        headers: { "Accept-Language": "en" }
      });
      const data = await response.json();
      setSuggestions(data);
      setShowDropdown(true);
    } catch (err) {
      console.error("Location search failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      // Don't search if the query perfectly matches the current value (meaning it was selected)
      if (query !== value) {
        fetchLocations(query);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [query, value]);

  const handleSelect = (item) => {
    const name = item.display_name.split(",")[0] + ", " + (item.address?.state || item.display_name.split(",").slice(-1)[0].trim());
    setQuery(name);
    setShowDropdown(false);
    if (onChange) onChange(name);
  };

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`, {
            headers: { "Accept-Language": "en" }
          });
          const data = await response.json();
          let locationName = "";
          if (data.address) {
            locationName = data.address.city || data.address.town || data.address.county || data.address.state || "Current Location";
          } else {
            locationName = data.display_name;
          }
          setQuery(locationName);
          if (onChange) onChange(locationName);
        } catch (error) {
          console.error("Reverse geocoding failed", error);
        } finally {
          setGpsLoading(false);
        }
      },
      (error) => {
        setGpsLoading(false);
        console.error("GPS Error", error);
        alert("Unable to retrieve your location");
      }
    );
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative flex items-center w-full">
        <div className="absolute left-3 text-gray-400">
          <MapPin size={18} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-12 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all text-gray-700 text-sm"
        />
        <button
          type="button"
          onClick={handleUseGPS}
          disabled={gpsLoading}
          className="absolute right-2 p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
          title="Use current location"
        >
          {gpsLoading ? <Loader2 size={18} className="animate-spin" /> : <Navigation size={18} />}
        </button>
      </div>

      {/* Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-center text-sm text-gray-500 flex justify-center items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Loading...
            </div>
          ) : (
            <ul>
              {suggestions.map((item, idx) => (
                <li
                  key={idx}
                  onClick={() => handleSelect(item)}
                  className="px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-start gap-2"
                >
                  <MapPin size={14} className="mt-0.5 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{item.display_name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
