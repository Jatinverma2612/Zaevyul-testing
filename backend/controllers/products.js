import Product from '../model/Product.js';
import { escapeRegex } from './public.js';

const compactFeaturedProductOrder = async () => {
  const featured = await Product.find({ featured: true }).sort({ featuredOrder: 1, createdAt: -1 });
  await Promise.all(featured.map((product, index) => (
    Product.findByIdAndUpdate(product._id, { featuredOrder: index + 1 })
  )));
};

/**
 * GET /api/admin/products
 * Supports regex escaping (AUD-021) and pagination (AUD-025).
 */
export const getProducts = async (req, res) => {
  const { search, category, status, gender, page = 1, limit = 0 } = req.query;
  try {
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (gender) filter.gender = gender;
    if (search) {
      const safeSearch = escapeRegex(search);
      filter.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { sku: { $regex: safeSearch, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = parseInt(limit, 10) || 0;

    let query = Product.find(filter).populate('category', 'name slug sizeChartImage').sort({ createdAt: -1 });
    if (limitNum > 0) {
      query = query.skip((pageNum - 1) * limitNum).limit(limitNum);
    }

    const [products, totalCount] = await Promise.all([
      query,
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      products,
      totalCount,
      page: pageNum,
      totalPages: limitNum > 0 ? Math.ceil(totalCount / limitNum) : 1,
    });
  } catch (error) {
    console.error('Fetch products error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ featured: true })
      .sort({ featuredOrder: 1 })
      .limit(6)
      .populate('category', 'name slug sizeChartImage')
      .select('name slug category basePrice discountPrice material images featuredOrder');
    return res.status(200).json({ success: true, products });
  } catch (error) {
    console.error('Fetch featured products error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name slug sizeChartImage');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.status(200).json({ success: true, product });
  } catch (error) {
    console.error('Fetch product detail error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getProductFields = (body) => {
  const {
    name, slug, sku, category, basePrice, discountPrice, costPrice,
    quantity, lowStockThreshold, status, tags, gender, material, color, size,
    description, shortDescription, images, seo, sizes, colors,
    productDetails, careInstructions, artisanStory
  } = body;

  const fields = {};
  if (name !== undefined) fields.name = name;
  if (slug !== undefined) fields.slug = slug;
  if (sku !== undefined) fields.sku = sku;
  if (category !== undefined) {
    if (!category || category === 'null' || category === 'undefined' || category === '') {
      fields.category = null;
    } else if (mongoose.Types.ObjectId.isValid(category)) {
      fields.category = new mongoose.Types.ObjectId(category);
    } else {
      fields.category = null;
    }
  }
  if (costPrice !== undefined) fields.costPrice = costPrice !== null && costPrice !== '' ? Math.max(0, Number(costPrice)) : null;
  if (lowStockThreshold !== undefined) fields.lowStockThreshold = Math.max(0, Number(lowStockThreshold) || 5);
  if (status !== undefined) fields.status = status;
  if (tags !== undefined) fields.tags = tags;
  if (gender !== undefined) fields.gender = gender;
  if (material !== undefined) fields.material = material;
  if (color !== undefined) fields.color = color;
  if (size !== undefined) fields.size = size;
  if (description !== undefined) fields.description = description;
  if (shortDescription !== undefined) fields.shortDescription = shortDescription;
  if (productDetails !== undefined) fields.productDetails = productDetails;
  if (careInstructions !== undefined) fields.careInstructions = careInstructions;
  if (artisanStory !== undefined) fields.artisanStory = artisanStory;
  if (images !== undefined) {
    fields.images = Array.isArray(images)
      ? images.map((img, idx) => {
          if (typeof img === 'string') {
            return { id: `img-${Date.now()}-${idx}`, name: `Image ${idx + 1}`, url: img };
          }
          return {
            id: img.id || `img-${Date.now()}-${idx}`,
            name: img.name || `Image ${idx + 1}`,
            url: typeof img.url === 'string' ? img.url : (img.src || ''),
          };
        }).filter((img) => img.url)
      : [];
  }
  if (seo !== undefined) fields.seo = seo;
  if (colors !== undefined) {
    fields.colors = Array.isArray(colors)
      ? colors
          .map((c) => ({
            name: (c.name || '').trim(),
            mainImage: typeof c.mainImage === 'string' ? c.mainImage : (c.mainImage?.url || c.mainImage?.name || ''),
            galleryImages: Array.isArray(c.galleryImages)
              ? c.galleryImages.map((g) => (typeof g === 'string' ? g : (g.url || g.name || '')))
              : [],
            sizes: Array.isArray(c.sizes)
              ? c.sizes.map((s) => ({
                  size: (s.size || '').trim(),
                  price: Math.max(0, Number(s.price) || 0),
                  discountPrice: s.discountPrice ? Math.max(0, Number(s.discountPrice)) : null,
                  quantity: Math.max(0, Number(s.quantity) || 0),
                })).filter((s) => s.size)
              : [],
          }))
          .filter((c) => c.name && c.mainImage)
      : [];
  }

  // Calculate dynamic root basePrice, discountPrice, and quantity from sizes or color sizes
  let computedStock = 0;
  let hasColorStock = false;
  let firstPrice = null;
  let firstDiscount = null;

  if (fields.colors && fields.colors.length > 0) {
    fields.colors.forEach((c) => {
      if (c.sizes && c.sizes.length > 0) {
        hasColorStock = true;
        c.sizes.forEach((s) => {
          computedStock += Number(s.quantity) || 0;
          if (firstPrice === null) {
            firstPrice = s.price;
            firstDiscount = s.discountPrice;
          }
        });
      }
    });
  }

  if (hasColorStock) {
    fields.quantity = computedStock;
    if (firstPrice !== null) {
      fields.basePrice = firstPrice;
      fields.discountPrice = firstDiscount;
    }
  } else if (sizes !== undefined) {
    fields.sizes = Array.isArray(sizes) ? sizes : [];
    if (fields.sizes.length > 0) {
      fields.basePrice = fields.sizes[0].price;
      fields.discountPrice = fields.sizes[0].discountPrice;
      fields.quantity = fields.sizes.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
    } else {
      if (basePrice !== undefined) fields.basePrice = Number(basePrice) || 0;
      if (discountPrice !== undefined) fields.discountPrice = discountPrice ? Number(discountPrice) : null;
      if (quantity !== undefined) fields.quantity = Number(quantity) || 0;
    }
  } else {
    if (basePrice !== undefined) fields.basePrice = Number(basePrice) || 0;
    if (discountPrice !== undefined) fields.discountPrice = discountPrice ? Number(discountPrice) : null;
    if (quantity !== undefined) fields.quantity = Number(quantity) || 0;
  }

  // Auto-generate unique slug & sku fallbacks if omitted
  if (fields.name && (!fields.slug || !fields.slug.trim())) {
    fields.slug = fields.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);
  }
  if (!fields.sku || !fields.sku.trim()) {
    const prefix = (fields.name || 'ZAE').replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'ZAE';
    fields.sku = `${prefix}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
  }

  return fields;
};

/**
 * AUD-028: Validate product pricing sanity rules.
 * Returns an error message string, or null if valid.
 */
const validatePriceSanity = ({ basePrice, discountPrice, costPrice }) => {
  if (basePrice !== undefined && basePrice < 0) return 'Base price cannot be negative';
  if (discountPrice !== undefined && basePrice !== undefined && discountPrice > basePrice) {
    return 'Discount price cannot be greater than base price';
  }
  if (costPrice !== undefined && basePrice !== undefined && costPrice > basePrice) {
    return 'Cost price cannot exceed base price';
  }
  return null;
};

export const createProduct = async (req, res) => {
  try {
    const productFields = getProductFields(req.body);

    if (!productFields.name || !productFields.name.trim()) {
      return res.status(400).json({ success: false, message: 'Product name is required.' });
    }

    // AUD-028: Sanity-check prices before saving
    let priceError = null;
    if (productFields.sizes && productFields.sizes.length > 0) {
      for (const s of productFields.sizes) {
        priceError = validatePriceSanity({ basePrice: s.price, discountPrice: s.discountPrice });
        if (priceError) break;
      }
    } else {
      priceError = validatePriceSanity(productFields);
    }
    if (priceError) {
      return res.status(400).json({ success: false, message: priceError });
    }

    const product = new Product(productFields);
    await product.save();
    return res.status(201).json({ success: true, product });
  } catch (error) {
    console.error('Create product error:', error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'SKU or Slug';
      return res.status(400).json({ success: false, message: `${field.toUpperCase()} already exists. Please choose a unique value.` });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: `Invalid value for ${error.path}: ${error.value}` });
    }
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const productFields = getProductFields(req.body);

    // AUD-028: Sanity-check prices
    let priceError = null;
    if (productFields.sizes && productFields.sizes.length > 0) {
      for (const s of productFields.sizes) {
        priceError = validatePriceSanity({ basePrice: s.price, discountPrice: s.discountPrice });
        if (priceError) break;
      }
    } else {
      priceError = validatePriceSanity(productFields);
    }
    if (priceError) {
      return res.status(400).json({ success: false, message: priceError });
    }

    const product = await Product.findByIdAndUpdate(req.params.id, productFields, { new: true, runValidators: true });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.status(200).json({ success: true, product });
  } catch (error) {
    console.error('Update product error:', error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'SKU or Slug';
      return res.status(400).json({ success: false, message: `${field.toUpperCase()} already exists. Please choose a unique value.` });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: `Invalid value for ${error.path}: ${error.value}` });
    }
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (product.featured) {
      await compactFeaturedProductOrder();
    }
    return res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const duplicateProduct = async (req, res) => {
  try {
    const original = await Product.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const copyData = original.toObject();
    delete copyData._id;
    delete copyData.createdAt;
    delete copyData.updatedAt;

    copyData.name = `${original.name} (Copy)`;
    // AUD-016: Append timestamp suffix to avoid SKU collision on duplicate
    copyData.sku = `${original.sku}-${Date.now()}`;
    copyData.slug = `${original.slug}-copy-${Date.now()}`;
    copyData.status = 'draft';
    copyData.featured = false;
    copyData.featuredOrder = null;

    const copy = new Product(copyData);
    await copy.save();

    return res.status(201).json({ success: true, product: copy });
  } catch (error) {
    console.error('Duplicate product error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const toggleFeatured = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.featured) {
      const removedOrder = product.featuredOrder;
      await Product.findByIdAndUpdate(req.params.id, { featured: false, featuredOrder: null });

      const remaining = await Product.find({ featured: true, featuredOrder: { $gt: removedOrder } })
        .sort({ featuredOrder: 1 });
      await Promise.all(remaining.map((p) => (
        Product.findByIdAndUpdate(p._id, { featuredOrder: p.featuredOrder - 1 })
      )));
    } else {
      const count = await Product.countDocuments({ featured: true });
      if (count >= 6) {
        return res.status(400).json({ success: false, message: 'Maximum of 6 featured products allowed. Disable one first.' });
      }

      const nextOrder = count + 1;
      await Product.findByIdAndUpdate(req.params.id, { featured: true, featuredOrder: nextOrder });
    }

    const updated = await Product.findById(req.params.id).populate('category', 'name slug sizeChartImage');
    return res.status(200).json({ success: true, product: updated });
  } catch (error) {
    console.error('Toggle product featured error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const bulkDeleteProducts = async (req, res) => {
  const { ids } = req.body;
  try {
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ success: false, message: 'IDs array is required' });
    }
    const deletingFeatured = await Product.exists({ _id: { $in: ids }, featured: true });
    await Product.deleteMany({ _id: { $in: ids } });
    if (deletingFeatured) {
      await compactFeaturedProductOrder();
    }
    return res.status(200).json({ success: true, message: 'Selected products deleted successfully' });
  } catch (error) {
    console.error('Bulk delete products error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
