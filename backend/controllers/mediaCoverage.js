import MediaCoverage from "../model/MediaCoverage.js";

/**
 * Validate URL format
 */
const isValidUrl = (string) => {
  try {
    const url = new URL(string.startsWith("http://") || string.startsWith("https://") ? string : `https://${string}`);
    return Boolean(url.hostname);
  } catch {
    return false;
  }
};

/**
 * GET /api/admin/media-coverage
 * Fetch media coverage entries with optional status filter.
 */
export const getMediaCoverages = async (req, res) => {
  const { status, search } = req.query;
  try {
    const filter = {};
    if (status && status !== "all") {
      filter.status = status;
    }
    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { sourceName: { $regex: q, $options: "i" } },
        { excerpt: { $regex: q, $options: "i" } },
      ];
    }

    const items = await MediaCoverage.find(filter).sort({
      sortOrder: 1,
      publishedAt: -1,
      createdAt: -1,
    });

    return res.status(200).json({ success: true, items });
  } catch (error) {
    console.error("[mediaCoverageController] getMediaCoverages error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/media-coverage/:id
 * Fetch single media coverage entry by ID.
 */
export const getMediaCoverageById = async (req, res) => {
  try {
    const item = await MediaCoverage.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Media coverage entry not found" });
    }
    return res.status(200).json({ success: true, item });
  } catch (error) {
    console.error("[mediaCoverageController] getMediaCoverageById error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/admin/media-coverage
 * Create a new media coverage entry.
 */
export const createMediaCoverage = async (req, res) => {
  try {
    const {
      title,
      articleUrl,
      sourceName = "",
      excerpt = "",
      imageUrl = "",
      image = null,
      status = "published",
      publishedAt,
      sortOrder = 0,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    if (!articleUrl || !articleUrl.trim()) {
      return res.status(400).json({ success: false, message: "Article URL is required" });
    }

    if (!isValidUrl(articleUrl.trim())) {
      return res.status(400).json({ success: false, message: "Please provide a valid article URL" });
    }

    // Resolve image URL
    const finalImageUrl = imageUrl || image?.url || (typeof image === "string" ? image : "");
    const finalImageObj = image && typeof image === "object" ? image : { url: finalImageUrl };

    const mediaCoverage = new MediaCoverage({
      title: title.trim(),
      articleUrl: articleUrl.trim(),
      sourceName: sourceName.trim(),
      excerpt: excerpt.trim(),
      imageUrl: finalImageUrl,
      image: finalImageObj,
      status: ["draft", "published"].includes(status) ? status : "published",
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
      sortOrder: Number(sortOrder) || 0,
    });

    await mediaCoverage.save();
    return res.status(201).json({ success: true, item: mediaCoverage });
  } catch (error) {
    console.error("[mediaCoverageController] createMediaCoverage error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to create media coverage entry" });
  }
};

/**
 * PUT /api/admin/media-coverage/:id
 * Update an existing media coverage entry.
 */
export const updateMediaCoverage = async (req, res) => {
  try {
    const {
      title,
      articleUrl,
      sourceName,
      excerpt,
      imageUrl,
      image,
      status,
      publishedAt,
      sortOrder,
    } = req.body;

    const updates = {};
    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({ success: false, message: "Title cannot be empty" });
      }
      updates.title = title.trim();
    }

    if (articleUrl !== undefined) {
      if (!articleUrl.trim()) {
        return res.status(400).json({ success: false, message: "Article URL cannot be empty" });
      }
      if (!isValidUrl(articleUrl.trim())) {
        return res.status(400).json({ success: false, message: "Please provide a valid article URL" });
      }
      updates.articleUrl = articleUrl.trim();
    }

    if (sourceName !== undefined) updates.sourceName = sourceName.trim();
    if (excerpt !== undefined) updates.excerpt = excerpt.trim();
    if (status !== undefined) updates.status = status;
    if (sortOrder !== undefined) updates.sortOrder = Number(sortOrder) || 0;
    if (publishedAt !== undefined) updates.publishedAt = publishedAt ? new Date(publishedAt) : new Date();

    if (imageUrl !== undefined || image !== undefined) {
      const finalImageUrl = imageUrl || image?.url || (typeof image === "string" ? image : "");
      updates.imageUrl = finalImageUrl;
      updates.image = image && typeof image === "object" ? image : { url: finalImageUrl };
    }

    const item = await MediaCoverage.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!item) {
      return res.status(404).json({ success: false, message: "Media coverage entry not found" });
    }

    return res.status(200).json({ success: true, item });
  } catch (error) {
    console.error("[mediaCoverageController] updateMediaCoverage error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to update media coverage entry" });
  }
};

/**
 * DELETE /api/admin/media-coverage/:id
 * Delete a media coverage entry.
 */
export const deleteMediaCoverage = async (req, res) => {
  try {
    const item = await MediaCoverage.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Media coverage entry not found" });
    }
    return res.status(200).json({ success: true, message: "Media coverage entry deleted successfully" });
  } catch (error) {
    console.error("[mediaCoverageController] deleteMediaCoverage error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
