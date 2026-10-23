import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, RefreshCw, Search } from "lucide-react";
import CountrySelect from "../../../components/CountrySelect";
import PhoneNumberInput, { normalizePhoneInput } from "../../../components/PhoneNumberInput";
import { getAddressLabels, getCountry } from "../../../config/countries";
import { customerApi } from "../../../lib/customerApi";
import { useCustomerAuth } from "../../../context/CustomerAuthContext";
import { useToast } from "../../../context/ToastContext";
import { isPostalLookupSupported, lookupPostalCode } from "../../../services/postalLookupService";

const blankForm = {
  label: "Home",
  recipientName: "",
  countryCode: "",
  addressLine1: "",
  addressLine2: "",
  postalCode: "",
  state: "",
  stateCode: "",
  city: "",
  phone: "",
  landmark: "",
  isDefault: false,
};

const hydrateForm = (address = {}) => ({
  ...blankForm,
  ...address,
  recipientName: address.recipientName || address.name || "",
  addressLine1: address.addressLine1 || address.addressLine || "",
  countryCode: address.countryCode || "IN",
});

export default function AddressFormPage() {
  const { addressId } = useParams();
  const isEditing = !!addressId;
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { user, refreshUser } = useCustomerAuth();
  const [form, setForm] = useState(blankForm);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [error, setError] = useState("");
  const [lookupMessage, setLookupMessage] = useState("");
  const lastLookupKeyRef = useRef("");

  const labels = useMemo(() => getAddressLabels(form.countryCode), [form.countryCode]);
  const selectedCountry = getCountry(form.countryCode);
  const returnTo = new URLSearchParams(location.search).get("returnTo");

  useEffect(() => {
    if (!isEditing) {
      setForm((prev) => ({ ...prev, countryCode: user?.countryCode || "IN" }));
      return;
    }

    const existing = user?.addresses?.find((addr) => String(addr._id) === String(addressId));
    if (existing) {
      setForm(hydrateForm(existing));
      setLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await customerApi.addresses.getById(addressId);
        if (!cancelled) setForm(hydrateForm(res.address));
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load address.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [addressId, isEditing, user]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
  };

  const canAutoLookup = (countryCode, postalCode) => {
    const country = String(countryCode || "").toUpperCase();
    const code = String(postalCode || "").trim();
    if (!isPostalLookupSupported(country)) return false;
    if (country === "IN") return /^[1-9][0-9]{5}$/.test(code);
    if (country === "US") return /^\d{5}(-\d{4})?$/.test(code);
    if (country === "GB") return code.replace(/\s/g, "").length >= 5;
    return code.length >= 3;
  };

  const applyLookupSuggestion = (result, silent = false) => {
    if (!result.suggestions.length) {
      if (!silent) setLookupMessage("No location suggestions found. Enter city and region manually.");
      return;
    }
    const suggestion = result.suggestions[0];
    setForm((prev) => ({
      ...prev,
      city: suggestion.city || prev.city,
      state: suggestion.state || prev.state,
      stateCode: suggestion.stateCode || prev.stateCode,
    }));
    setLookupMessage(
      result.suggestions.length > 1
        ? "Multiple location suggestions exist. The first was applied and can be edited."
        : "Location suggestion applied. You can edit it if needed.",
    );
  };

  const handleLookup = async ({ silent = false } = {}) => {
    if (!silent) setLookupMessage("");
    if (!form.countryCode || !form.postalCode) {
      if (!silent) setLookupMessage("Select a country and enter a postal code first.");
      return;
    }
    if (!isPostalLookupSupported(form.countryCode)) {
      if (!silent) setLookupMessage("Postal lookup is not available for this country. Enter city and region manually.");
      return;
    }
    try {
      setLookupLoading(true);
      lastLookupKeyRef.current = `${form.countryCode}:${form.postalCode}`;
      const result = await lookupPostalCode({
        countryCode: form.countryCode,
        postalCode: form.postalCode,
      });
      applyLookupSuggestion(result, silent);
    } catch (err) {
      if (!silent) setLookupMessage(err.message || "Postal lookup is temporarily unavailable.");
    } finally {
      setLookupLoading(false);
    }
  };

  useEffect(() => {
    const key = `${form.countryCode}:${form.postalCode}`;
    if (!canAutoLookup(form.countryCode, form.postalCode) || lastLookupKeyRef.current === key) {
      return;
    }
    const timer = setTimeout(() => {
      handleLookup({ silent: true });
    }, 650);
    return () => clearTimeout(timer);
  }, [form.countryCode, form.postalCode]);

  const validate = () => {
    if (!form.recipientName.trim()) return "Recipient name is required.";
    if (!form.countryCode) return "Country is required.";
    if (!form.addressLine1.trim()) return "Address line 1 is required.";
    if (!form.postalCode.trim() && !["AE", "HK", "MO", "PA"].includes(form.countryCode)) {
      return `${labels.postalCode} is required.`;
    }
    if (!form.state.trim()) return `${labels.region} is required.`;
    if (!form.city.trim()) return `${labels.city} is required.`;
    normalizePhoneInput({ phone: form.phone, countryCode: form.countryCode });
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const validationError = validate();
      if (validationError) {
        setError(validationError);
        return;
      }
      const normalizedPhone = normalizePhoneInput({
        phone: form.phone,
        countryCode: form.countryCode,
      });
      const country = getCountry(form.countryCode);
      const payload = {
        ...form,
        country: country?.name || form.country,
        phone: normalizedPhone.phone,
        phoneCountryCode: normalizedPhone.phoneCountryCode,
      };
      setSaving(true);
      if (isEditing) {
        await customerApi.addresses.update(addressId, payload);
        toast("Address updated successfully", "success");
      } else {
        await customerApi.addresses.create(payload);
        toast("Address added successfully", "success");
      }
      await refreshUser();
      navigate(returnTo === "checkout" ? "/cart?checkout=1" : "/my-account/addresses", { replace: true });
    } catch (err) {
      setError(err.message || "Failed to save address.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#E6DED4]/40 rounded-[4px] p-8 shadow-xs">
        <div className="flex items-center gap-3 text-[#8A857E]">
          <RefreshCw size={16} className="animate-spin text-[#B58A5B]" />
          Loading address
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E6DED4]/40 rounded-[4px] p-6 sm:p-8 shadow-xs">
      <div className="mb-6 flex items-center justify-between border-b border-[#E6DED4]/60 pb-4">
        <h3 className="font-serif text-[18px] font-normal tracking-wide text-[#1C1916]">
          {isEditing ? "Edit Address" : "Add Address"}
        </h3>
        <button
          type="button"
          onClick={() => navigate(returnTo === "checkout" ? "/cart?checkout=1" : "/my-account/addresses")}
          className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[#8A857E] hover:text-[#1C1916] cursor-pointer"
        >
          <ArrowLeft size={13} /> Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[#6B6560]">
              Address Tag
            </label>
            <input
              value={form.label}
              onChange={(e) => setField("label", e.target.value)}
              placeholder="Home, Office, Studio"
              className="w-full rounded-[2px] border border-[#E6DED4] bg-white p-3 font-sans text-[12.5px] focus:outline-none focus:border-[#B58A5B]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[#6B6560]">
              Recipient Name *
            </label>
            <input
              required
              value={form.recipientName}
              onChange={(e) => setField("recipientName", e.target.value)}
              className="w-full rounded-[2px] border border-[#E6DED4] bg-white p-3 font-sans text-[12.5px] focus:outline-none focus:border-[#B58A5B]"
            />
          </div>
        </div>

        <CountrySelect
          value={form.countryCode}
          onChange={(code) => {
            setForm((prev) => ({
              ...prev,
              countryCode: code,
              state: "",
              stateCode: "",
              city: "",
              postalCode: "",
            }));
            setLookupMessage("");
          }}
        />

        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[#6B6560]">
            Address Line 1 *
          </label>
          <input
            required
            value={form.addressLine1}
            onChange={(e) => setField("addressLine1", e.target.value)}
            placeholder="Street address, building, apartment"
            className="w-full rounded-[2px] border border-[#E6DED4] bg-white p-3 font-sans text-[12.5px] focus:outline-none focus:border-[#B58A5B]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[#6B6560]">
            Address Line 2
          </label>
          <input
            value={form.addressLine2}
            onChange={(e) => setField("addressLine2", e.target.value)}
            placeholder="Apartment, suite, unit, floor"
            className="w-full rounded-[2px] border border-[#E6DED4] bg-white p-3 font-sans text-[12.5px] focus:outline-none focus:border-[#B58A5B]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[#6B6560]">
              {labels.postalCode} *
            </label>
            <input
              value={form.postalCode}
              onChange={(e) => setField("postalCode", e.target.value)}
              className="w-full rounded-[2px] border border-[#E6DED4] bg-white p-3 font-sans text-[12.5px] focus:outline-none focus:border-[#B58A5B]"
            />
          </div>
          <button
            type="button"
            onClick={() => handleLookup()}
            disabled={lookupLoading}
            className="h-[43px] rounded-[2px] border border-[#E6DED4] px-4 text-[10px] font-semibold uppercase tracking-wider text-[#1C1916] hover:bg-[#FAF8F5] disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
          >
            {lookupLoading ? <RefreshCw size={13} className="animate-spin" /> : <Search size={13} />}
            Lookup
          </button>
        </div>
        {lookupMessage && (
          <p className="font-sans text-[11px] text-[#8A857E]">{lookupMessage}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[#6B6560]">
              {labels.region} *
            </label>
            <input
              required
              value={form.state}
              onChange={(e) => setField("state", e.target.value)}
              className="w-full rounded-[2px] border border-[#E6DED4] bg-white p-3 font-sans text-[12.5px] focus:outline-none focus:border-[#B58A5B]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[#6B6560]">
              {labels.city} *
            </label>
            <input
              required
              value={form.city}
              onChange={(e) => setField("city", e.target.value)}
              className="w-full rounded-[2px] border border-[#E6DED4] bg-white p-3 font-sans text-[12.5px] focus:outline-none focus:border-[#B58A5B]"
            />
          </div>
        </div>

        <PhoneNumberInput
          countryCode={form.countryCode}
          phone={form.phone}
          onCountryChange={(code) => setField("countryCode", code)}
          onPhoneChange={(value) => setField("phone", value)}
        />

        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[#6B6560]">
            Landmark / Additional Instructions
          </label>
          <textarea
            rows={3}
            value={form.landmark}
            onChange={(e) => setField("landmark", e.target.value)}
            className="w-full rounded-[2px] border border-[#E6DED4] bg-white p-3 font-sans text-[12.5px] focus:outline-none focus:border-[#B58A5B]"
          />
        </div>

        <label className="flex items-center gap-3 text-[12px] text-[#3D3833]">
          <input
            type="checkbox"
            checked={form.isDefault}
            onChange={(e) => setField("isDefault", e.target.checked)}
          />
          Set as default address
        </label>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-[2px] px-4 py-3 font-sans text-[12px] text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(returnTo === "checkout" ? "/cart?checkout=1" : "/my-account/addresses")}
            className="px-5 py-3 border border-[#E6DED4] text-[10px] font-semibold tracking-wider uppercase rounded-[2px] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-[#1C1916] hover:bg-[#B58A5B] text-white text-[10px] font-semibold tracking-wider uppercase rounded-[2px] transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving && <RefreshCw size={13} className="animate-spin" />}
            {isEditing ? "Save Address" : "Add Address"}
          </button>
        </div>
      </form>
      {selectedCountry && (
        <p className="mt-5 text-[11px] text-[#8A857E]">
          Phone and postal-code validation are based on {selectedCountry.name}.
        </p>
      )}
    </div>
  );
}
