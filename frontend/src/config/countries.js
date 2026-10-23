import { getCountries, getCountryCallingCode } from "libphonenumber-js";

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

export const countryFlag = (countryCode) =>
  String(countryCode || "")
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt(0)),
    );

export const countries = getCountries()
  .map((code) => ({
    code,
    name: regionNames.of(code) || code,
    dialCode: `+${getCountryCallingCode(code)}`,
    flag: countryFlag(code),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const getCountry = (code) =>
  countries.find((country) => country.code === String(code || "").toUpperCase());

export const getCountryByDialCode = (dialCode) =>
  countries.find((country) => country.dialCode === dialCode);

export const addressLabelsByCountry = {
  IN: { postalCode: "PIN Code", region: "State", city: "City / District" },
  US: { postalCode: "ZIP Code", region: "State", city: "City" },
  GB: { postalCode: "Postcode", region: "County / Region", city: "Town / City" },
  CA: { postalCode: "Postal Code", region: "Province", city: "City" },
  AU: { postalCode: "Postcode", region: "State / Territory", city: "Suburb / City" },
  AE: { postalCode: "Postal Code", region: "Emirate", city: "City" },
};

export const getAddressLabels = (countryCode) =>
  addressLabelsByCountry[String(countryCode || "").toUpperCase()] || {
    postalCode: "Postal / ZIP Code",
    region: "State / Province / Region",
    city: "City",
  };
