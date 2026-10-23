import { parsePhoneNumberFromString } from "libphonenumber-js";
import CountrySelect from "./CountrySelect";
import { getCountry } from "../config/countries";

export const normalizePhoneInput = ({ phone, countryCode }) => {
  const raw = String(phone || "").trim();
  const iso = String(countryCode || "").toUpperCase();
  const parsed = raw.startsWith("+")
    ? parsePhoneNumberFromString(raw)
    : parsePhoneNumberFromString(raw, iso);

  if (!parsed || !parsed.isValid()) {
    throw new Error("Please enter a valid phone number for the selected country.");
  }

  if (iso && parsed.country && parsed.country !== iso) {
    throw new Error("Phone number does not match the selected country.");
  }

  return {
    phone: parsed.number,
    phoneCountryCode: `+${parsed.countryCallingCode}`,
    countryCode: parsed.country || iso,
  };
};

export default function PhoneNumberInput({
  countryCode,
  phone,
  onCountryChange,
  onPhoneChange,
  label = "Phone Number",
  required = true,
}) {
  const country = getCountry(countryCode);

  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[#6B6560]">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2.5">
        {/* Compact Country Selector (smaller than phone input) */}
        <div className="w-[110px] sm:w-[120px] shrink-0">
          <CountrySelect
            value={countryCode}
            onChange={onCountryChange}
            label=""
            includeDialCode
          />
        </div>

        {/* Phone Number Field */}
        <div className="flex-1 min-w-0">
          <input
            type="tel"
            required={required}
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder={country ? `${country.dialCode} number` : "Phone number"}
            className="w-full rounded-[2px] border border-[#E6DED4] bg-white p-3 font-sans text-[12.5px] text-[#1C1916] placeholder-[#8A857E] focus:outline-none focus:border-[#B58A5B]"
          />
        </div>
      </div>
    </div>
  );
}
