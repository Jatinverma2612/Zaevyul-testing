import React, { useState, useEffect, useRef } from "react";
import { useCurrency } from "../context/CurrencyContext";
import { CURRENCIES } from "../config/currencies";
import { ChevronDown } from "lucide-react";

export default function CurrencySelector({ className = "", dropUp = false }) {
  const { currencyCode, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const activeCurrency =
    CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];

  const handleSelect = (code) => {
    setCurrency(code);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className || "inline-block"}`}>
      {/* Selector Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Change currency"
        className="inline-flex items-center gap-1.5 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1C1916]/64 hover:text-[#1C1916] transition-all duration-200 cursor-pointer py-1.5 px-2.5 rounded-[2px] hover:bg-[#F5EFE7]/40"
      >
        <span>
          {activeCurrency.code} ({activeCurrency.symbol})
        </span>
        <ChevronDown
          size={10.5}
          className={`transition-transform duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isOpen
              ? dropUp
                ? "rotate-0 text-[#1C1916]"
                : "rotate-180 text-[#1C1916]"
              : dropUp
              ? "rotate-180 text-[#1C1916]/40 group-hover:text-[#1C1916]/80"
              : "text-[#1C1916]/40 group-hover:text-[#1C1916]/80"
          }`}
        />
      </button>

      {/* Dropdown Options List */}
      <ul
        role="listbox"
        className={`absolute right-0 z-50 bg-[#FAF8F5]/98 backdrop-blur-md border border-[#E7DED3] shadow-lg rounded-[2px] py-1.5 min-w-[150px] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          dropUp ? "bottom-full mb-2 origin-bottom-right" : "top-full mt-2 origin-top-right"
        } ${
          isOpen
            ? "transform scale-100 opacity-100 translate-y-0 visible pointer-events-auto"
            : dropUp
            ? "transform scale-95 opacity-0 translate-y-1 invisible pointer-events-none"
            : "transform scale-95 opacity-0 -translate-y-1 invisible pointer-events-none"
        }`}
      >
        {CURRENCIES.map((c) => {
          const isSelected = c.code === currencyCode;
          return (
            <li
              key={c.code}
              role="option"
              aria-selected={isSelected}
              onClick={() => handleSelect(c.code)}
              className={`flex items-center justify-between px-4 py-2 text-[10.5px] font-sans uppercase tracking-[0.12em] transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "bg-[#F5EFE7] text-[#B58A5B] font-semibold"
                  : "text-[#1C1916]/75 hover:bg-[#FAF8F5] hover:text-[#B58A5B]"
              }`}
            >
              <span>{c.code}</span>
              <span className="opacity-60 text-[12px]">{c.symbol}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
