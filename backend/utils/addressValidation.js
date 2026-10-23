import { getCountries } from 'libphonenumber-js';
import { normalizeInternationalPhone } from './phone.js';

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
const SUPPORTED_COUNTRIES = new Set(getCountries());
const OPTIONAL_POSTAL_COUNTRIES = new Set(['AE', 'HK', 'MO', 'PA']);

const POSTAL_PATTERNS = {
  IN: /^[1-9][0-9]{5}$/,
  US: /^\d{5}(-\d{4})?$/,
  CA: /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i,
  GB: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i,
  AU: /^\d{4}$/,
  DE: /^\d{5}$/,
  FR: /^\d{5}$/,
  IT: /^\d{5}$/,
  ES: /^\d{5}$/,
  NL: /^\d{4}\s?[A-Z]{2}$/i,
};

export const normalizeAddressForResponse = (addr) => {
  const obj = typeof addr.toObject === 'function' ? addr.toObject() : addr;
  const recipientName = obj.recipientName || obj.name || '';
  const addressLine1 = obj.addressLine1 || obj.addressLine || '';
  const countryCode = String(obj.countryCode || 'IN').toUpperCase();

  return {
    ...obj,
    recipientName,
    name: obj.name || recipientName,
    country: obj.country || regionNames.of(countryCode) || 'India',
    countryCode,
    addressLine1,
    addressLine: obj.addressLine || addressLine1,
  };
};

export const validateAddressPayload = (payload, existing = null) => {
  const source = { ...(existing || {}), ...(payload || {}) };
  const countryCode = String(source.countryCode || 'IN').trim().toUpperCase();

  if (!SUPPORTED_COUNTRIES.has(countryCode)) {
    throw new Error('Please select a valid country.');
  }

  const recipientName = String(source.recipientName || source.name || '').trim();
  const addressLine1 = String(source.addressLine1 || source.addressLine || '').trim();
  const addressLine2 = String(source.addressLine2 || '').trim();
  const postalCode = String(source.postalCode || '').trim();
  const city = String(source.city || '').trim();
  const state = String(source.state || '').trim();
  const stateCode = String(source.stateCode || '').trim().toUpperCase();
  const landmark = String(source.landmark || '').trim();
  const label = String(source.label || 'Home').trim() || 'Home';

  if (!recipientName) throw new Error('Recipient name is required.');
  if (!addressLine1) throw new Error('Address line 1 is required.');
  if (!city) throw new Error('City is required.');
  if (!state) throw new Error('State, province, or region is required.');

  if (!postalCode && !OPTIONAL_POSTAL_COUNTRIES.has(countryCode)) {
    throw new Error('Postal code is required for the selected country.');
  }

  const postalPattern = POSTAL_PATTERNS[countryCode];
  if (postalCode && postalPattern && !postalPattern.test(postalCode)) {
    throw new Error('Please enter a valid postal code for the selected country.');
  }

  const normalizedPhone = normalizeInternationalPhone(source.phone, countryCode);

  return {
    label,
    recipientName,
    name: recipientName,
    country: regionNames.of(countryCode) || source.country || '',
    countryCode,
    addressLine1,
    addressLine2,
    addressLine: addressLine1,
    postalCode,
    state,
    stateCode,
    city,
    phone: normalizedPhone.phone,
    phoneCountryCode: normalizedPhone.phoneCountryCode,
    landmark,
    isDefault: !!source.isDefault,
  };
};
