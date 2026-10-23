import { useMemo, useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";
import { countries } from "../config/countries";

export default function CountrySelect({
  value,
  onChange,
  label = "Country",
  includeDialCode = true,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Selected country object
  const selectedCountry = useMemo(() => {
    return (
      countries.find((c) => c.code === String(value || "").toUpperCase()) ||
      countries.find((c) => c.code === "IN") ||
      countries[0]
    );
  }, [value]);

  // Filter countries based on user search input
  const filteredCountries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.dialCode.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (code) => {
    onChange(code);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[#6B6560]">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-1.5 rounded-[2px] border border-[#E6DED4] bg-white p-3 font-sans text-[12.5px] text-[#1C1916] transition-colors hover:border-[#B58A5B] focus:outline-none focus:border-[#B58A5B] cursor-pointer"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-1.5 truncate">
          <span className="text-[14px] leading-none">{selectedCountry?.flag}</span>
          <span className="font-medium text-[12px] text-[#1C1916]">
            {selectedCountry?.dialCode}
          </span>
        </span>
        <ChevronDown
          size={14}
          className={`text-[#8A857E] shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#1C1916]" : ""
          }`}
        />
      </button>

      {/* Floating Type-in Searchable Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 w-[260px] sm:w-[280px] max-h-[280px] rounded-[2px] border border-[#E6DED4] bg-white shadow-lg flex flex-col overflow-hidden">
          {/* Search Bar Input */}
          <div className="p-2 border-b border-[#E6DED4] bg-[#FAF8F5] flex items-center gap-2">
            <Search size={14} className="text-[#8A857E] shrink-0 ml-1" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type country name or +code..."
              className="w-full bg-transparent font-sans text-[12px] text-[#1C1916] placeholder-[#8A857E] focus:outline-none"
            />
          </div>

          {/* Filtered Country List */}
          <div className="overflow-y-auto flex-1 divide-y divide-[#E6DED4]/30">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => {
                const isSelected = country.code === selectedCountry?.code;
                return (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleSelect(country.code)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left font-sans text-[12px] transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-[#FAF8F5] font-semibold text-[#B58A5B]"
                        : "hover:bg-[#FAF8F5] text-[#1C1916]"
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate pr-2">
                      <span className="text-[14px]">{country.flag}</span>
                      <span className="truncate">{country.name}</span>
                    </span>
                    <span className="font-mono text-[11px] text-[#8A857E] shrink-0">
                      {country.dialCode}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center font-sans text-[12px] text-[#8A857E] italic">
                No matching country found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
