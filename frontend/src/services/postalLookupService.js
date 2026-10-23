import { customerApi } from "../lib/customerApi";

const LOOKUP_SUPPORTED_COUNTRIES = new Set([
  "AD", "AR", "AS", "AT", "AU", "BD", "BE", "BG", "BR", "CA", "CH",
  "CZ", "DE", "DK", "ES", "FI", "FO", "FR", "GB", "GF", "GG", "GL",
  "GP", "GT", "GU", "GY", "HR", "HU", "IM", "IN", "IS", "IT", "JE",
  "JP", "LI", "LK", "LT", "LU", "MC", "MD", "MH", "MK", "MP", "MQ",
  "MX", "MY", "NL", "NO", "NZ", "PH", "PK", "PL", "PM", "PR", "RE",
  "RU", "SE", "SI", "SJ", "SK", "SM", "TH", "TR", "US", "VA", "VI",
  "YT", "ZA",
]);

export const isPostalLookupSupported = (countryCode) =>
  LOOKUP_SUPPORTED_COUNTRIES.has(String(countryCode || "").toUpperCase());

export const lookupPostalCode = async ({ countryCode, postalCode }) => {
  const country = String(countryCode || "").toUpperCase();
  const code = String(postalCode || "").trim();

  if (!country || !code || !isPostalLookupSupported(country)) {
    return { supported: false, suggestions: [] };
  }

  return customerApi.postalLookup.lookup({
    countryCode: country,
    postalCode: code,
  });
};
