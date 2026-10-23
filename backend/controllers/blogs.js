import Blog from "../model/Blog.js";

export const getBlogs = async (req, res) => {
  const { status } = req.query;
  try {
    const filter = {};
    if (status) filter.status = status;

    const blogs = await Blog.find(filter)
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, blogs });
  } catch (error) {
    console.error("Fetch blogs error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getPublicBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ status: "published" })
      .sort({ publishedAt: -1 });
    return res.status(200).json({ success: true, blogs });
  } catch (error) {
    console.error("Fetch public blogs error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog post not found" });
    }
    return res.status(200).json({ success: true, blog });
  } catch (error) {
    console.error("Fetch blog detail error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const createBlog = async (req, res) => {
  try {
    const blogData = {
      ...req.body,
      author: req.user._id,
    };
    if (blogData.status === "published" && !blogData.publishedAt) {
      blogData.publishedAt = new Date();
    }
    const blog = new Blog(blogData);
    await blog.save();
    return res.status(201).json({ success: true, blog });
  } catch (error) {
    console.error("Create blog post error:", error);
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: "Slug already exists" });
    }
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const updateBlog = async (req, res) => {
  try {
    const blogData = { ...req.body };
    if (blogData.status === "published" && !blogData.publishedAt) {
      blogData.publishedAt = new Date();
    }
    const blog = await Blog.findByIdAndUpdate(req.params.id, blogData, {
      new: true,
      runValidators: true,
    });
    if (!blog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog post not found" });
    }
    return res.status(200).json({ success: true, blog });
  } catch (error) {
    console.error("Update blog post error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog post not found" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Blog post deleted successfully" });
  } catch (error) {
    console.error("Delete blog post error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
