import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { CURRENCIES, DEFAULT_CURRENCY_CODE } from "../config/currencies";
import { currencyService } from "../services/currencyService";
import countryMapping from "../config/country-currency-mapping-expanded.json";
import { api } from "../lib/api";

const CurrencyContext = createContext(null);

const RATES_CACHE_KEY = "zae_currency_rates";
const RATES_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // AUD-015: 24-hour cache

/** Load rates from localStorage if they were cached within the last 24 hours. */
const loadCachedRates = () => {
  try {
    const raw = localStorage.getItem(RATES_CACHE_KEY);
    if (!raw) return null;
    const { rates, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp < RATES_CACHE_TTL_MS) return rates;
  } catch { /* ignore */ }
  return null;
};

/** Persist rates to localStorage with a timestamp. */
const persistRates = (rates) => {
  try {
    localStorage.setItem(RATES_CACHE_KEY, JSON.stringify({ rates, timestamp: Date.now() }));
  } catch { /* ignore */ }
};

export function CurrencyProvider({ children }) {
  const [currencyCode, setCurrencyCodeState] = useState(() => {
    const saved = localStorage.getItem("currency");
    if (saved && CURRENCIES.some((c) => c.code === saved)) {
      return saved;
    }
    return DEFAULT_CURRENCY_CODE;
  });

  const [rates, setRates] = useState(() => {
    // AUD-015: Initialise from cache to avoid unnecessary network round-trip on mount
    const cached = loadCachedRates();
    return cached || { [DEFAULT_CURRENCY_CODE]: 1 };
  });
  const [loading, setLoading] = useState(!loadCachedRates());
  const [error, setError] = useState(null);

  const fetchRatesData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const fetchedRates = await currencyService.fetchRates();
      // Ensure base rate is strictly 1
      fetchedRates[DEFAULT_CURRENCY_CODE] = 1;
      setRates(fetchedRates);
      persistRates(fetchedRates); // AUD-015: cache the fresh rates
    } catch (err) {
      console.error("Failed to fetch rates:", err);
      setError("Could not load current exchange rates. Using fallback values.");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  // Fetch rates on mount only if cache is stale/missing; refresh every 24 hrs
  useEffect(() => {
    const cached = loadCachedRates();
    if (!cached) {
      fetchRatesData(true);
    }

    const interval = setInterval(() => {
      fetchRatesData(false); // Background refresh every 24 hours
    }, RATES_CACHE_TTL_MS);

    return () => clearInterval(interval);
  }, [fetchRatesData]);

  // Automatic location-based currency detection on initial visit
  useEffect(() => {
    const isManual = localStorage.getItem("zae_currency_is_manual") === "true";
    if (isManual) {
      // User has manually selected currency before; never override
      return;
    }

    const detectLocation = async () => {
      try {
        const countryCode = await api.location.get();
        if (countryCode) {
          const upperCountry = countryCode.toUpperCase();
          const targetCurrency =
            countryMapping.countryToCurrency[upperCountry] ||
            countryMapping.defaultCurrency ||
            DEFAULT_CURRENCY_CODE;

          if (CURRENCIES.some((c) => c.code === targetCurrency)) {
            setCurrencyCodeState(targetCurrency);
            localStorage.setItem("currency", targetCurrency);
          }
        }
      } catch (err) {
        console.warn("Location detection failed, defaulting to saved/fallback currency:", err);
      }
    };

    detectLocation();
  }, []);

  const setCurrency = useCallback((code) => {
    if (CURRENCIES.some((c) => c.code === code)) {
      setCurrencyCodeState(code);
      localStorage.setItem("currency", code);
      localStorage.setItem("zae_currency_is_manual", "true");
    }
  }, []);

  const convertPrice = useCallback((priceInINR) => {
    if (priceInINR === undefined || priceInINR === null) return 0;
    const numericPrice = typeof priceInINR === "number" ? priceInINR : parseFloat(priceInINR);
    if (isNaN(numericPrice)) return 0;

    const rate = rates[currencyCode];
    if (rate === undefined || rate === null) {
      return null;
    }
    return numericPrice * rate;
  }, [rates, currencyCode]);

  const activeCurrency = CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];

  const formatPrice = useCallback((priceInINR) => {
    if (priceInINR === undefined || priceInINR === null) return "";
    const numericPrice = typeof priceInINR === "number" ? priceInINR : parseFloat(priceInINR);
    if (isNaN(numericPrice)) return "";

    // Base currency (INR) formatting works immediately without API wait
    if (currencyCode === DEFAULT_CURRENCY_CODE) {
      return new Intl.NumberFormat(activeCurrency.locale, {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(numericPrice);
    }

    const rate = rates[currencyCode];
    if (rate === undefined || rate === null) {
      return "Loading...";
    }

    const converted = numericPrice * rate;
    return new Intl.NumberFormat(activeCurrency.locale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(converted);
  }, [rates, currencyCode, activeCurrency]);

  const refreshRates = useCallback(() => {
    return fetchRatesData(true);
  }, [fetchRatesData]);

  const value = {
    currency: activeCurrency,
    currencyCode,
    currencySymbol: activeCurrency.symbol,
    exchangeRate: rates[currencyCode] || null,
    rates,
    loading,
    error,
    setCurrency,
    convertPrice,
    formatPrice,
    refreshRates
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
