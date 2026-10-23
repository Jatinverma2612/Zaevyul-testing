const ZIPPOTAM_SUPPORTED_COUNTRIES = new Set([
  'AD', 'AR', 'AS', 'AT', 'AU', 'BD', 'BE', 'BG', 'BR', 'CA', 'CH',
  'CZ', 'DE', 'DK', 'ES', 'FI', 'FO', 'FR', 'GB', 'GF', 'GG', 'GL',
  'GP', 'GT', 'GU', 'GY', 'HR', 'HU', 'IM', 'IN', 'IS', 'IT', 'JE',
  'JP', 'LI', 'LK', 'LT', 'LU', 'MC', 'MD', 'MH', 'MK', 'MP', 'MQ',
  'MX', 'MY', 'NL', 'NO', 'NZ', 'PH', 'PK', 'PL', 'PM', 'PR', 'RE',
  'RU', 'SE', 'SI', 'SJ', 'SK', 'SM', 'TH', 'TR', 'US', 'VA', 'VI',
  'YT', 'ZA',
]);

const uniqBy = (items, keyFn) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const isPostalLookupSupported = (countryCode) =>
  countryCode === 'IN' || ZIPPOTAM_SUPPORTED_COUNTRIES.has(countryCode);

export const lookupPostalCode = async ({ countryCode, postalCode }) => {
  const country = String(countryCode || '').trim().toUpperCase();
  const code = String(postalCode || '').trim();

  if (!country || !code || !isPostalLookupSupported(country)) {
    return { supported: false, suggestions: [] };
  }

  if (country === 'IN') {
    return lookupIndiaPincode(code);
  }

  return lookupZippopotam(country, code);
};

const lookupIndiaPincode = async (postalCode) => {
  if (!/^[1-9][0-9]{5}$/.test(postalCode)) {
    return { supported: true, suggestions: [] };
  }

  const response = await fetch(`https://api.postalpincode.in/pincode/${encodeURIComponent(postalCode)}`);
  if (!response.ok) {
    throw new Error('Postal lookup is temporarily unavailable.');
  }

  const data = await response.json();
  const result = Array.isArray(data) ? data[0] : null;
  const offices = result?.Status === 'Success' && Array.isArray(result.PostOffice)
    ? result.PostOffice
    : [];

  const suggestions = uniqBy(
    offices
      .filter((office) => office?.District && office?.State)
      .map((office) => ({
        city: office.District,
        state: office.State,
        stateCode: '',
        locality: office.Name || '',
        country: 'India',
        countryCode: 'IN',
      })),
    (item) => `${item.city}|${item.state}`,
  );

  return {
    supported: true,
    source: 'postalpincode.in',
    suggestions,
  };
};

const lookupZippopotam = async (countryCode, postalCode) => {
  const response = await fetch(
    `https://api.zippopotam.us/${encodeURIComponent(countryCode)}/${encodeURIComponent(postalCode)}`,
  );

  if (response.status === 404) {
    return { supported: true, suggestions: [] };
  }
  if (!response.ok) {
    throw new Error('Postal lookup is temporarily unavailable.');
  }

  const data = await response.json();
  const suggestions = uniqBy(
    (data.places || []).map((place) => ({
      city: place['place name'] || '',
      state: place.state || '',
      stateCode: place['state abbreviation'] || '',
      country: data.country || '',
      countryCode: data['country abbreviation'] || countryCode,
    })),
    (item) => `${item.city}|${item.state}|${item.stateCode}`,
  );

  return {
    supported: true,
    source: 'zippopotam.us',
    suggestions,
  };
};
