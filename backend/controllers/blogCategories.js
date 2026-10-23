import BlogCategory from '../model/BlogCategory.js';
import Blog from '../model/Blog.js';

export const getBlogCategories = async (req, res) => {
  try {
    const categories = await BlogCategory.find().sort({ name: 1 });
    
    // Dynamically query blog count for each category
    const list = await Promise.all(categories.map(async (c) => {
      const blogCount = await Blog.countDocuments({ category: c.name });
      const obj = c.toObject();
      obj.blogCount = blogCount;
      return obj;
    }));

    return res.status(200).json({ success: true, categories: list });
  } catch (error) {
    console.error('Fetch blog categories error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createBlogCategory = async (req, res) => {
  try {
    const category = new BlogCategory(req.body);
    await category.save();
    return res.status(201).json({ success: true, category });
  } catch (error) {
    console.error('Create blog category error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Blog category name already exists' });
    }
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getBlogCategoryById = async (req, res) => {
  try {
    const category = await BlogCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Blog category not found' });
    }
    return res.status(200).json({ success: true, category });
  } catch (error) {
    console.error('Fetch blog category detail error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateBlogCategory = async (req, res) => {
  try {
    const oldCategory = await BlogCategory.findById(req.params.id);
    if (!oldCategory) {
      return res.status(404).json({ success: false, message: 'Blog category not found' });
    }

    const category = await BlogCategory.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    
    // If the category name changed, update the category string in associated blogs
    if (req.body.name && req.body.name !== oldCategory.name) {
      await Blog.updateMany({ category: oldCategory.name }, { $set: { category: req.body.name } });
    }

    return res.status(200).json({ success: true, category });
  } catch (error) {
    console.error('Update blog category error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Blog category name already exists' });
    }
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteBlogCategory = async (req, res) => {
  try {
    const category = await BlogCategory.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Blog category not found' });
    }
    
    // Clear the category reference on any associated blogs
    await Blog.updateMany({ category: category.name }, { $set: { category: '' } });

    return res.status(200).json({ success: true, message: 'Blog category deleted and blogs updated successfully' });
  } catch (error) {
    console.error('Delete blog category error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
