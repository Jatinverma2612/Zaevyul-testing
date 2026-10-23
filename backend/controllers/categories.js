import Category from '../model/Category.js';
import Product from '../model/Product.js';

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1, name: 1 });
    
    // Dynamically query product count for each category
    const list = await Promise.all(categories.map(async (c) => {
      const productCount = await Product.countDocuments({ category: c._id });
      const obj = c.toObject();
      obj.productCount = productCount;
      return obj;
    }));

    return res.status(200).json({ success: true, categories: list });
  } catch (error) {
    console.error('Fetch categories error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getFeaturedCategories = async (req, res) => {
  try {
    const categories = await Category.find({ featured: true })
      .sort({ featuredOrder: 1 })
      .limit(4)
      .select('name slug mainImage featuredOrder');
    return res.status(200).json({ success: true, categories });
  } catch (error) {
    console.error('Fetch featured categories error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createCategory = async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    return res.status(201).json({ success: true, category });
  } catch (error) {
    console.error('Create category error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Category slug already exists' });
    }
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    return res.status(200).json({ success: true, category });
  } catch (error) {
    console.error('Fetch category detail error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    return res.status(200).json({ success: true, category });
  } catch (error) {
    console.error('Update category error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    
    // Clear the category reference on any associated products
    await Product.updateMany({ category: req.params.id }, { $set: { category: null } });

    // If this was featured, compact the order of remaining featured categories
    if (category.featured) {
      const remaining = await Category.find({ featured: true }).sort({ featuredOrder: 1 });
      await Promise.all(remaining.map((c, i) =>
        Category.findByIdAndUpdate(c._id, { featuredOrder: i + 1 })
      ));
    }

    return res.status(200).json({ success: true, message: 'Category deleted and products detached successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// PATCH /api/admin/categories/:id/featured
export const toggleFeatured = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (category.featured) {
      // --- Disable featured ---
      const removedOrder = category.featuredOrder;
      await Category.findByIdAndUpdate(req.params.id, { featured: false, featuredOrder: null });

      // Compact remaining: shift down any slot > removedOrder
      const remaining = await Category.find({ featured: true, featuredOrder: { $gt: removedOrder } })
        .sort({ featuredOrder: 1 });
      await Promise.all(remaining.map((c) =>
        Category.findByIdAndUpdate(c._id, { featuredOrder: c.featuredOrder - 1 })
      ));
    } else {
      // --- Enable featured --- enforce max 4
      const count = await Category.countDocuments({ featured: true });
      if (count >= 4) {
        return res.status(400).json({ success: false, message: 'Maximum of 4 featured categories allowed. Disable one first.' });
      }
      // Auto-assign next available order slot
      const nextOrder = count + 1;
      await Category.findByIdAndUpdate(req.params.id, { featured: true, featuredOrder: nextOrder });
    }

    const updated = await Category.findById(req.params.id);
    return res.status(200).json({ success: true, category: updated });
  } catch (error) {
    console.error('Toggle featured error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
