import { getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js';

export const normalizeDialCode = (dialCode) => {
  if (!dialCode) return '';
  const digits = String(dialCode).replace(/\D/g, '');
  return digits ? `+${digits}` : '';
};

export const normalizeInternationalPhone = (rawPhone, countryCode) => {
  const iso = String(countryCode || '').trim().toUpperCase();
  const raw = String(rawPhone || '').trim();

  if (!raw) {
    throw new Error('Phone number is required.');
  }

  let parsed = null;
  if (raw.startsWith('+')) {
    parsed = parsePhoneNumberFromString(raw);
  } else {
    if (!iso) {
      throw new Error('Please select a country code for this phone number.');
    }
    parsed = parsePhoneNumberFromString(raw, iso);
  }

  if (!parsed || !parsed.isValid()) {
    throw new Error('Please enter a valid phone number for the selected country.');
  }

  const phoneCountryCode = `+${parsed.countryCallingCode}`;
  const expectedDialCode = iso ? `+${getCountryCallingCode(iso)}` : phoneCountryCode;

  if (iso && phoneCountryCode !== expectedDialCode) {
    throw new Error('Phone number does not match the selected country code.');
  }

  return {
    phone: parsed.number,
    phoneCountryCode,
    countryCode: parsed.country || iso,
    nationalNumber: parsed.nationalNumber,
  };
};
