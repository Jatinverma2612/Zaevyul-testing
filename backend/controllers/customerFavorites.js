import mongoose from 'mongoose';
import CustomerUser from '../model/CustomerUser.js';
import Product from '../model/Product.js';

/**
 * GET /api/customer/favorites
 * Returns the authenticated customer's favorite product IDs and populated items.
 */
export const getFavorites = async (req, res) => {
  try {
    const customer = await CustomerUser.findById(req.customerUser._id);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    // Normalize any legacy ObjectIds or objects in favorites array to clean string IDs
    const rawFavs = (customer.favorites || []).map((f) => (f && f._id ? String(f._id) : (f && f.id ? String(f.id) : String(f))));
    const uniqueFavs = Array.from(new Set(rawFavs.filter(Boolean)));

    // Self-healing migration: if any entry was an ObjectId or object, persist normalized strings
    const hasNonString = (customer.favorites || []).some((f) => typeof f !== 'string') || uniqueFavs.length !== (customer.favorites || []).length;
    if (needsHealCheck(customer.favorites, uniqueFavs)) {
      customer.favorites = uniqueFavs;
      customer.markModified('favorites');
      await customer.save();
    }

    const validObjIds = uniqueFavs.filter((id) => mongoose.Types.ObjectId.isValid(id));

    // Fetch products matching ObjectId or string id/slug
    const dbProducts = await Product.find({
      $or: [
        { _id: { $in: validObjIds } },
        { id: { $in: uniqueFavs } }
      ]
    }).select('_id id name slug basePrice discountPrice images category quantity sizes').lean();

    return res.status(200).json({
      success: true,
      favorites: dbProducts || [],
      favoriteIds: uniqueFavs,
    });
  } catch (error) {
    console.error('[customerFavorites] getFavorites error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/** Helper to check if healing is required */
function needsHealCheck(favorites, uniqueFavs) {
  if (!Array.isArray(favorites)) return true;
  if (favorites.length !== uniqueFavs.length) return true;
  return favorites.some((f) => typeof f !== 'string');
}

/**
 * POST /api/customer/favorites/:productId
 * Adds a product to the customer's favorites.
 */
export const addFavorite = async (req, res) => {
  const { productId } = req.params;

  try {
    const strId = String(productId);
    const customer = await CustomerUser.findById(req.customerUser._id);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const currentFavs = (customer.favorites || []).map((f) => (f && f._id ? String(f._id) : (f && f.id ? String(f.id) : String(f))));
    if (!currentFavs.includes(strId)) {
      currentFavs.push(strId);
    }
    customer.favorites = Array.from(new Set(currentFavs.filter(Boolean)));
    customer.markModified('favorites');
    await customer.save();

    return res.status(200).json({
      success: true,
      message: 'Added to favorites.',
      favoriteIds: customer.favorites,
    });
  } catch (error) {
    console.error('[customerFavorites] addFavorite error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * DELETE /api/customer/favorites/:productId
 * Removes a product from the customer's favorites.
 */
export const removeFavorite = async (req, res) => {
  const { productId } = req.params;

  try {
    const strId = String(productId);
    const pullTargets = [strId];
    if (mongoose.Types.ObjectId.isValid(strId)) {
      pullTargets.push(new mongoose.Types.ObjectId(strId));
    }

    // 1. Atomic $pull supporting strings, ObjectIds, or nested objects
    let customer = await CustomerUser.findByIdAndUpdate(
      req.customerUser._id,
      {
        $pull: {
          favorites: {
            $in: [
              ...pullTargets,
              { _id: strId },
              ...(mongoose.Types.ObjectId.isValid(strId) ? [{ _id: new mongoose.Types.ObjectId(strId) }] : []),
              { id: strId }
            ]
          }
        }
      },
      { new: true }
    );

    // 2. Fallback / sanitation: ensure all representations of strId are filtered out and healed
    if (customer) {
      const remainingFavs = (customer.favorites || []).filter((f) => {
        const idVal = String(f && f._id ? f._id : (f && f.id ? f.id : f));
        return idVal !== strId;
      });

      if (
        remainingFavs.length !== (customer.favorites || []).length ||
        (customer.favorites || []).some((f) => typeof f !== 'string')
      ) {
        customer.favorites = Array.from(new Set(remainingFavs.map((f) => String(f && f._id ? f._id : (f && f.id ? f.id : f))).filter(Boolean)));
        customer.markModified('favorites');
        await customer.save();
      }
    }

    const favIds = (customer?.favorites || []).map((f) => (f && f._id ? String(f._id) : (f && f.id ? String(f.id) : String(f))));

    return res.status(200).json({
      success: true,
      message: 'Removed from favorites.',
      favoriteIds: favIds,
    });
  } catch (error) {
    console.error('[customerFavorites] removeFavorite error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};
