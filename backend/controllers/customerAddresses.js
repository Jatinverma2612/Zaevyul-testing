import CustomerUser from '../model/CustomerUser.js';
import { normalizeAddressForResponse, validateAddressPayload } from '../utils/addressValidation.js';
import { lookupPostalCode } from '../services/postalLookupService.js';

const formatCustomer = (c) => ({
  id: c._id,
  name: c.name,
  email: c.email,
  phone: c.phone,
  phoneCountryCode: c.phoneCountryCode,
  profileImage: c.profileImage,
  emailVerified: c.emailVerified,
  phoneVerified: c.phoneVerified,
  addresses: (c.addresses || []).map(normalizeAddressForResponse),
  marketingPreferences: c.marketingPreferences || { emailUpdates: true },
  favoritesCount: c.favorites?.length ?? 0,
});

const findCustomer = async (req) => CustomerUser.findById(req.customerUser._id);

export const getCustomerAddresses = async (req, res) => {
  const customer = await findCustomer(req);
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });
  return res.status(200).json({
    success: true,
    addresses: (customer.addresses || []).map(normalizeAddressForResponse),
  });
};

export const lookupCustomerPostalCode = async (req, res) => {
  const { countryCode, postalCode } = req.query;

  if (!countryCode || !postalCode) {
    return res.status(400).json({
      success: false,
      message: 'Country and postal code are required.',
    });
  }

  try {
    const result = await lookupPostalCode({ countryCode, postalCode });
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: error.message || 'Postal lookup is temporarily unavailable.',
    });
  }
};

export const getCustomerAddress = async (req, res) => {
  const customer = await findCustomer(req);
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });
  const address = customer.addresses.id(req.params.addressId);
  if (!address) return res.status(404).json({ success: false, message: 'Address not found.' });
  return res.status(200).json({ success: true, address: normalizeAddressForResponse(address) });
};

export const addCustomerAddress = async (req, res) => {
  try {
    const customer = await findCustomer(req);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });

    const address = validateAddressPayload(req.body);
    address.isDefault = customer.addresses.length === 0 || !!req.body.isDefault;
    if (address.isDefault) {
      customer.addresses.forEach((addr) => { addr.isDefault = false; });
    }

    customer.addresses.push(address);
    await customer.save();

    return res.status(201).json({
      success: true,
      message: 'Address added successfully.',
      address: normalizeAddressForResponse(customer.addresses[customer.addresses.length - 1]),
      user: formatCustomer(customer),
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message || 'Failed to add address.' });
  }
};

export const updateCustomerAddress = async (req, res) => {
  try {
    const customer = await findCustomer(req);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });

    const address = customer.addresses.id(req.params.addressId);
    if (!address) return res.status(404).json({ success: false, message: 'Address not found.' });

    const next = validateAddressPayload(req.body, normalizeAddressForResponse(address));
    Object.assign(address, next);

    if (next.isDefault) {
      customer.addresses.forEach((addr) => {
        addr.isDefault = String(addr._id) === String(address._id);
      });
    }

    await customer.save();
    return res.status(200).json({
      success: true,
      message: 'Address updated successfully.',
      address: normalizeAddressForResponse(address),
      user: formatCustomer(customer),
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message || 'Failed to update address.' });
  }
};

export const deleteCustomerAddress = async (req, res) => {
  try {
    const customer = await findCustomer(req);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });

    const address = customer.addresses.id(req.params.addressId);
    if (!address) return res.status(404).json({ success: false, message: 'Address not found.' });

    const wasDefault = address.isDefault;
    customer.addresses.pull(address._id);

    if (wasDefault && customer.addresses.length > 0) {
      customer.addresses[0].isDefault = true;
    }

    await customer.save();
    return res.status(200).json({
      success: true,
      message: 'Address deleted successfully.',
      user: formatCustomer(customer),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete address.' });
  }
};

export const setDefaultCustomerAddress = async (req, res) => {
  try {
    const customer = await findCustomer(req);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });

    const address = customer.addresses.id(req.params.addressId);
    if (!address) return res.status(404).json({ success: false, message: 'Address not found.' });

    customer.addresses.forEach((addr) => {
      addr.isDefault = String(addr._id) === String(address._id);
    });

    await customer.save();
    return res.status(200).json({
      success: true,
      message: 'Default address updated.',
      user: formatCustomer(customer),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update default address.' });
  }
};
