import { CURRENCIES, DEFAULT_CURRENCY_CODE } from "../config/currencies";

const API_BASE_URL = "https://api.frankfurter.dev/v2";

export const currencyService = {
  fetchRates: async () => {
    const targetCodes = CURRENCIES
      .map((c) => c.code)
      .filter((code) => code !== DEFAULT_CURRENCY_CODE)
      .join(",");

    const url = `${API_BASE_URL}/rates?base=${DEFAULT_CURRENCY_CODE}&quotes=${targetCodes}`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Frankfurter API returned HTTP error ${res.status}`);
      }
      const data = await res.json();

      if (!Array.isArray(data)) {
        throw new Error("Unexpected exchange rate response format");
      }

      // Initialize with base currency rate = 1
      const rates = { [DEFAULT_CURRENCY_CODE]: 1 };
      
      data.forEach((item) => {
        if (item.quote && typeof item.rate === "number") {
          rates[item.quote] = item.rate;
        }
      });

      return rates;
    } catch (err) {
      console.error("Error in currencyService.fetchRates:", err);
      throw err;
    }
  },
};
