import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save, Trash2, X } from "lucide-react";
import { formatCurrency } from "../../../lib/mockData";
import PageHeader from "../../../components/PageHeader";
import ImageUploader from "../../../components/ImageUploader";
import { DeleteDialog } from "../../../components/Modal";
import StatusBadge from "../../../components/StatusBadge";
import { useToast } from "../../../context/ToastContext";
import { api } from "../../../lib/api";

const BLANK = {
  name: "",
  slug: "",
  sku: "",
  description: "",
  shortDescription: "",
  productDetails: "",
  careInstructions: "",
  artisanStory: "",
  basePrice: "",
  discountPrice: "",
  quantity: "",
  lowStockThreshold: 5,
  status: "draft",
  category: "",
  gender: "neutral",
  material: "",
  color: "",
  size: "",
  mainImage: null,
  hoverImage: null,
  gallery: [],
  colors: [],
  seo: { title: "", description: "", url: "" },
  sizes: [],
};

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isNew = !id || id === "new";

  const [form, setForm] = useState(BLANK);
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  useEffect(() => {
    const loadFormInfo = async () => {
      try {
        const catList = await api.categories.list();
        setCategories(catList);

        if (!isNew) {
          const product = await api.products.get(id);
          if (product) {
            setForm({
              ...BLANK,
              ...product,
              mainImage:
                product.mainImage ||
                (product.images && product.images[0]) ||
                null,
              hoverImage:
                product.hoverImage ||
                (product.images && product.images[1]) ||
                null,
              gallery:
                product.gallery ||
                (product.images && product.images.slice(2)) ||
                [],
              colors: (product.colors || []).map((c, i) => ({
                name: c.name || "",
                mainImage: c.mainImage
                  ? typeof c.mainImage === "string"
                    ? { id: `main-${i}`, url: c.mainImage, name: "Main" }
                    : c.mainImage
                  : null,
                galleryImages: (c.galleryImages || []).map((g, gi) =>
                  typeof g === "string"
                    ? { id: `g-${i}-${gi}`, url: g, name: `Gallery ${gi + 1}` }
                    : g,
                ),
                sizes: c.sizes || [],
              })),
              seo: product.seo || BLANK.seo,
              category:
                typeof product.category === "string"
                  ? product.category
                  : product.category?._id || product.category?.id || "",
            });
          } else {
            toast("Product not found", "error");
            navigate("/admin/products");
          }
        }
      } catch (err) {
        toast("Error loading product details", "error");
      }
    };
    loadFormInfo();
  }, [id, isNew]);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const setSeo = (field, value) =>
    setForm((f) => ({ ...f, seo: { ...f.seo, [field]: value } }));

  const generateSlug = (name) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const handleSave = async (status = form.status) => {
    if (!form.name) {
      toast("Product name is required", "error");
      return;
    }
    setSaving(true);

    const sizes = (form.sizes || []).map((s) => ({
      size: s.size,
      price: Number(s.price) || 0,
      discountPrice: s.discountPrice ? Number(s.discountPrice) : null,
      quantity: Number(s.quantity) || 0,
    }));

    const colors = (form.colors || []).map((c) => {
      const mainImgUrl =
        typeof c.mainImage === "string"
          ? c.mainImage
          : c.mainImage?.url || c.mainImage?.name || "";
      const galleryUrls = (c.galleryImages || [])
        .map((g) => (typeof g === "string" ? g : g.url || g.name || ""))
        .filter(Boolean);
      const colorSizes = (c.sizes || [])
        .map((s) => ({
          size: s.size ? s.size.trim() : "",
          price: Number(s.price) || 0,
          discountPrice: s.discountPrice ? Number(s.discountPrice) : null,
          quantity: Number(s.quantity) || 0,
        }))
        .filter((s) => s.size);

      return {
        name: c.name ? c.name.trim() : "",
        mainImage: mainImgUrl,
        galleryImages: galleryUrls,
        sizes: colorSizes,
      };
    });

    for (let i = 0; i < colors.length; i++) {
      if (!colors[i].name || !colors[i].mainImage) {
        toast(
          `Color Variant #${i + 1} requires a Color Name and Main Image`,
          "error",
        );
        setSaving(false);
        return;
      }
    }

    // Calculate dynamic basePrice, discountPrice, and quantity for backward-compatibility
    let basePrice = Number(form.basePrice) || 0;
    let discountPrice = form.discountPrice ? Number(form.discountPrice) : null;
    let quantity = Number(form.quantity) || 0;

    let hasColorSizes = false;
    let totalColorStock = 0;
    let firstColorPrice = null;
    let firstColorDiscount = null;

    colors.forEach((c) => {
      if (c.sizes && c.sizes.length > 0) {
        hasColorSizes = true;
        c.sizes.forEach((s) => {
          totalColorStock += s.quantity;
          if (firstColorPrice === null) {
            firstColorPrice = s.price;
            firstColorDiscount = s.discountPrice;
          }
        });
      }
    });

    if (hasColorSizes) {
      quantity = totalColorStock;
      if (firstColorPrice !== null) {
        basePrice = firstColorPrice;
        discountPrice = firstColorDiscount;
      }
    } else if (sizes.length > 0) {
      basePrice = sizes[0].price;
      discountPrice = sizes[0].discountPrice;
      quantity = sizes.reduce((sum, s) => sum + s.quantity, 0);
    }

    const extractUrl = (img) =>
      typeof img === "string" ? img : img?.url || img?.src || "";

    const mainImgStr = extractUrl(form.mainImage);
    const hoverImgStr = extractUrl(form.hoverImage);
    const galleryStrList = (form.gallery || []).map(extractUrl).filter(Boolean);

    const allImageUrls = [
      ...(mainImgStr ? [mainImgStr] : []),
      ...(hoverImgStr ? [hoverImgStr] : []),
      ...galleryStrList,
    ];

    const formattedImages = allImageUrls.map((url, i) => ({
      id: `img-${Date.now()}-${i}`,
      name: `Image ${i + 1}`,
      url: typeof url === "string" ? url : url.url || url.src || "",
    })).filter((img) => img.url);

    const generateSKU = (name) => {
      const prefix = (name || "ZAE")
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 3)
        .toUpperCase() || "ZAE";
      return `${prefix}-${Date.now().toString().slice(-4)}`;
    };

    const productData = {
      ...form,
      status,
      sizes,
      colors,
      basePrice,
      discountPrice,
      quantity,
      sku: form.sku?.trim() ? form.sku.trim() : generateSKU(form.name),
      slug: form.slug?.trim() ? form.slug.trim() : generateSlug(form.name),
      img: mainImgStr || allImageUrls[0] || "",
      mainImage: mainImgStr,
      hoverImage: hoverImgStr,
      gallery: galleryStrList,
      images: formattedImages,
    };

    try {
      if (isNew) {
        await api.products.create(productData);
      } else {
        await api.products.update(id, productData);
      }
      toast(isNew ? "Product created" : "Changes saved", "success");
      navigate("/admin/products");
    } catch (err) {
      toast(err.message || "Failed to save product", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.products.delete(id);
      toast("Product deleted", "success");
      navigate("/admin/products");
    } catch (err) {
      toast("Failed to delete product", "error");
    }
  };

  const TABS = [
    { id: "basic", label: "Basic Info" },
    { id: "variants", label: "Pricing, Color & Size Variants" },
    { id: "media", label: "Media" },
    { id: "details", label: "Product Accordions" },
    { id: "seo", label: "SEO" },
  ];

  return (
    <div className="page page-enter">
      <PageHeader
        title={isNew ? "New Product" : form.name || "Edit Product"}
        crumbs={[
          { label: "Products", to: "/admin/products" },
          { label: isNew ? "New" : "Edit" },
        ]}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-secondary"
              onClick={() => navigate("/admin/products")}
            >
              <X size={13} /> Close
            </button>
            {!isNew && (
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 size={13} /> Delete
              </button>
            )}
            <button
              className="btn btn-secondary"
              onClick={() => handleSave("draft")}
              disabled={saving}
            >
              Save draft
            </button>
            <button
              className="btn btn-primary"
              onClick={() => handleSave("published")}
              disabled={saving}
            >
              <Save size={13} />{" "}
              {saving ? "Saving…" : isNew ? "Publish" : "Save"}
            </button>
          </div>
        }
      />

      {/* Status pill */}
      {!isNew && (
        <div
          style={{
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <StatusBadge status={form.status} />
          <span style={{ fontSize: 11, color: "var(--color-text-caption)" }}>
            SKU: {form.sku}
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 24 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${activeTab === t.id ? "active" : ""}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 280px",
          gap: 16,
          alignItems: "start",
        }}
      >
        {/* Main content */}
        <div>
          {activeTab === "basic" && (
            <div className="card">
              <div
                className="card-body"
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                <div className="form-section">
                  <p className="form-section-title">Identity</p>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <div className="field-group">
                      <label className="field-label">Product Name *</label>
                      <input
                        className="field-input"
                        value={form.name}
                        placeholder="e.g. Himalayan Snow Shawl"
                        onChange={(e) => {
                          set("name", e.target.value);
                          if (!form.slug)
                            set("slug", generateSlug(e.target.value));
                        }}
                      />
                    </div>
                    <div className="form-row">
                      <div className="field-group">
                        <label className="field-label">Slug</label>
                        <input
                          className="field-input"
                          value={form.slug}
                          placeholder="himalayan-snow-shadow"
                          onChange={(e) => set("slug", e.target.value)}
                        />
                      </div>
                      <div className="field-group">
                        <label className="field-label">SKU</label>
                        <input
                          className="field-input"
                          value={form.sku}
                          placeholder="ZAE-SH-001"
                          onChange={(e) => set("sku", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="field-group">
                      <label className="field-label">Short Description</label>
                      <input
                        className="field-input"
                        value={form.shortDescription}
                        placeholder="One-line product summary"
                        onChange={(e) =>
                          set("shortDescription", e.target.value)
                        }
                      />
                    </div>
                    <div className="field-group">
                      <label className="field-label">Description</label>
                      <textarea
                        className="field-textarea"
                        rows={5}
                        value={form.description}
                        placeholder="Describe the product — origin, material, craftsmanship…"
                        onChange={(e) => set("description", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <p className="form-section-title">Organisation</p>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <div className="form-row">
                      <div className="field-group">
                        <label className="field-label">Category</label>
                        <select
                          className="field-select"
                          value={form.category}
                          onChange={(e) => set("category", e.target.value)}
                        >
                          <option value="">Select category</option>
                          {categories.map((c) => (
                            <option key={c._id || c.id} value={c._id || c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="field-group">
                        <label className="field-label">Gender Target</label>
                        <select
                          className="field-select"
                          value={form.gender || "neutral"}
                          onChange={(e) => set("gender", e.target.value)}
                        >
                          <option value="neutral">Neutral / Unisex</option>
                          <option value="men">Men</option>
                          <option value="women">Women</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "media" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                {/* Main Image */}
                <div className="card">
                  <div
                    className="card-body"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <div>
                      <p className="form-section-title">Main Image</p>
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--color-text-caption)",
                        }}
                      >
                        Primary thumbnail for catalogs and search results.
                      </span>
                    </div>
                    <ImageUploader
                      images={form.mainImage ? [form.mainImage] : []}
                      onChange={(imgs) => set("mainImage", imgs[0] || null)}
                      max={1}
                      label="main image"
                    />
                  </div>
                </div>

                {/* Hover Image */}
                <div className="card">
                  <div
                    className="card-body"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <div>
                      <p className="form-section-title">Hover Image</p>
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--color-text-caption)",
                        }}
                      >
                        Secondary image shown on hover.
                      </span>
                    </div>
                    <ImageUploader
                      images={form.hoverImage ? [form.hoverImage] : []}
                      onChange={(imgs) => set("hoverImage", imgs[0] || null)}
                      max={1}
                      label="hover image"
                    />
                  </div>
                </div>
              </div>

              {/* Gallery Images */}
              <div className="card">
                <div
                  className="card-body"
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  <div>
                    <p className="form-section-title">Product Gallery</p>
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--color-text-caption)",
                      }}
                    >
                      Additional detail shots and close-ups. Up to 8 photos.
                    </span>
                  </div>
                  <ImageUploader
                    images={form.gallery || []}
                    onChange={(imgs) => set("gallery", imgs)}
                    max={8}
                    label="gallery images"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "variants" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Base Pricing & Inventory Alerts */}
              <div className="card">
                <div
                  className="card-body"
                  style={{ display: "flex", flexDirection: "column", gap: 14 }}
                >
                  <p className="form-section-title">Inventory Alerts</p>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <div className="field-group">
                      <label className="field-label">
                        Low Stock Alert Threshold
                      </label>
                      <input
                        className="field-input"
                        type="number"
                        min="0"
                        value={form.lowStockThreshold || 5}
                        placeholder="5"
                        onChange={(e) => {
                          const val =
                            e.target.value === ""
                              ? ""
                              : Math.max(0, Number(e.target.value));
                          set("lowStockThreshold", val);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Attributes card */}
              <div className="card">
                <div
                  className="card-body"
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  <p className="form-section-title">Product Attributes</p>
                  <div className="form-row">
                    <div className="field-group">
                      <label className="field-label">Default Color Label</label>
                      <input
                        className="field-input"
                        value={form.color}
                        placeholder="e.g. Ivory, Walnut Brown"
                        onChange={(e) => set("color", e.target.value)}
                      />
                    </div>
                    <div className="field-group">
                      <label className="field-label">Material</label>
                      <input
                        className="field-input"
                        value={form.material}
                        placeholder="e.g. 100% Pashmina"
                        onChange={(e) => set("material", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Color Variants (with Sizes & Stock for each color) */}
              <div className="card">
                <div
                  className="card-body"
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <p
                        className="form-section-title"
                        style={{ marginBottom: 2 }}
                      >
                        Color Variants (with Sizes & Stock)
                      </p>
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--color-text-caption)",
                        }}
                      >
                        Add color options, upload photos, and configure specific
                        prices, sale prices, and stock for each size under each
                        color.
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: "6px 12px", fontSize: 11.5 }}
                      onClick={() => {
                        const updated = [
                          ...(form.colors || []),
                          {
                            name: "",
                            mainImage: null,
                            galleryImages: [],
                            sizes: [],
                          },
                        ];
                        set("colors", updated);
                      }}
                    >
                      + Add Color Variant
                    </button>
                  </div>

                  {!form.colors || form.colors.length === 0 ? (
                    <div
                      style={{
                        padding: "24px 0",
                        textAlign: "center",
                        fontSize: 11,
                        color: "var(--color-text-caption)",
                        border: "1px dashed var(--color-border)",
                        borderRadius: 4,
                      }}
                    >
                      No color variants configured yet. Click "+ Add Color
                      Variant" above, or use the standalone sizes section below.
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                      }}
                    >
                      {form.colors.map((c, idx) => {
                        const updateColor = (key, val) => {
                          const list = [...form.colors];
                          list[idx] = { ...list[idx], [key]: val };
                          set("colors", list);
                        };

                        const removeColor = () => {
                          const list = form.colors.filter((_, i) => i !== idx);
                          set("colors", list);
                        };

                        const moveUp = () => {
                          if (idx === 0) return;
                          const list = [...form.colors];
                          const temp = list[idx - 1];
                          list[idx - 1] = list[idx];
                          list[idx] = temp;
                          set("colors", list);
                        };

                        const moveDown = () => {
                          if (idx === form.colors.length - 1) return;
                          const list = [...form.colors];
                          const temp = list[idx + 1];
                          list[idx + 1] = list[idx];
                          list[idx] = temp;
                          set("colors", list);
                        };

                        const colorSizes = c.sizes || [];

                        const addColorSize = () => {
                          const updatedSizes = [
                            ...colorSizes,
                            {
                              size: "",
                              price: "",
                              discountPrice: null,
                              quantity: 0,
                            },
                          ];
                          updateColor("sizes", updatedSizes);
                        };

                        const updateColorSize = (sIdx, key, val) => {
                          const updatedSizes = [...colorSizes];
                          updatedSizes[sIdx] = {
                            ...updatedSizes[sIdx],
                            [key]: val,
                          };
                          updateColor("sizes", updatedSizes);
                        };

                        const removeColorSize = (sIdx) => {
                          const updatedSizes = colorSizes.filter(
                            (_, i) => i !== sIdx,
                          );
                          updateColor("sizes", updatedSizes);
                        };

                        const mainImgList = c.mainImage
                          ? [
                              typeof c.mainImage === "string"
                                ? {
                                    id: c.mainImage,
                                    url: c.mainImage,
                                    name: "Main",
                                  }
                                : c.mainImage,
                            ]
                          : [];

                        const galleryList = (c.galleryImages || []).map(
                          (g, gi) =>
                            typeof g === "string"
                              ? {
                                  id: `${g}-${gi}`,
                                  url: g,
                                  name: `Gallery ${gi + 1}`,
                                }
                              : g,
                        );

                        return (
                          <div
                            key={idx}
                            style={{
                              border: "1px solid var(--color-border)",
                              borderRadius: 6,
                              background: "var(--color-surface-2)",
                              padding: 16,
                              display: "flex",
                              flexDirection: "column",
                              gap: 14,
                            }}
                          >
                            {/* Color Header & Actions */}
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <span
                                  style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: "50%",
                                    background: "var(--color-walnut)",
                                    display: "inline-block",
                                  }}
                                />
                                <strong
                                  style={{
                                    fontSize: 13,
                                    color: "var(--color-text-primary)",
                                  }}
                                >
                                  Color #{idx + 1}: {c.name || "Untitled Color"}
                                </strong>
                              </div>
                              <div style={{ display: "flex", gap: 6 }}>
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  style={{ padding: "3px 8px", fontSize: 10 }}
                                  onClick={moveUp}
                                  disabled={idx === 0}
                                >
                                  ↑ Up
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  style={{ padding: "3px 8px", fontSize: 10 }}
                                  onClick={moveDown}
                                  disabled={idx === form.colors.length - 1}
                                >
                                  ↓ Down
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  style={{
                                    padding: "3px 8px",
                                    fontSize: 10,
                                    color: "var(--color-saffron)",
                                  }}
                                  onClick={removeColor}
                                >
                                  <Trash2 size={12} /> Remove Color
                                </button>
                              </div>
                            </div>

                            {/* Color Name */}
                            <div className="field-group">
                              <label className="field-label">
                                Color Name *
                              </label>
                              <input
                                className="field-input"
                                value={c.name || ""}
                                placeholder="e.g. Black, Ivory, Camel"
                                onChange={(e) =>
                                  updateColor("name", e.target.value)
                                }
                              />
                            </div>

                            {/* Main & Gallery Images */}
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1.5fr",
                                gap: 14,
                              }}
                            >
                              <div>
                                <label
                                  className="field-label"
                                  style={{ marginBottom: 6, display: "block" }}
                                >
                                  Main Image *{" "}
                                  <span
                                    style={{
                                      fontSize: 10,
                                      color: "var(--color-text-caption)",
                                    }}
                                  >
                                    (Primary)
                                  </span>
                                </label>
                                <ImageUploader
                                  images={mainImgList}
                                  onChange={(imgs) =>
                                    updateColor("mainImage", imgs[0] || null)
                                  }
                                  max={1}
                                  label="color main image"
                                />
                              </div>

                              <div>
                                <label
                                  className="field-label"
                                  style={{ marginBottom: 6, display: "block" }}
                                >
                                  Gallery Images{" "}
                                  <span
                                    style={{
                                      fontSize: 10,
                                      color: "var(--color-text-caption)",
                                    }}
                                  >
                                    (Additional shots)
                                  </span>
                                </label>
                                <ImageUploader
                                  images={galleryList}
                                  onChange={(imgs) =>
                                    updateColor("galleryImages", imgs)
                                  }
                                  max={8}
                                  label="color gallery images"
                                />
                              </div>
                            </div>

                            {/* Sizes & Stock for this Color */}
                            <div
                              style={{
                                marginTop: 8,
                                borderTop: "1px solid var(--color-border)",
                                paddingTop: 12,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  marginBottom: 10,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: "var(--color-text-primary)",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                  }}
                                >
                                  Sizes & Stock for "
                                  {c.name || `Color #${idx + 1}`}"
                                </span>
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  style={{
                                    padding: "4px 10px",
                                    fontSize: 10.5,
                                  }}
                                  onClick={addColorSize}
                                >
                                  + Add Size for {c.name || "this color"}
                                </button>
                              </div>

                              {colorSizes.length === 0 ? (
                                <div
                                  style={{
                                    padding: "12px",
                                    fontSize: 11,
                                    color: "var(--color-text-caption)",
                                    textTransform: "uppercase",
                                    textAlign: "center",
                                    border: "1px dashed var(--color-border)",
                                    borderRadius: 4,
                                  }}
                                >
                                  No sizes added for this color yet. Click
                                  button above.
                                </div>
                              ) : (
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 8,
                                  }}
                                >
                                  {colorSizes.map((cs, sIdx) => (
                                    <div
                                      key={sIdx}
                                      style={{
                                        display: "grid",
                                        gridTemplateColumns:
                                          "1.2fr 1fr 1fr 0.8fr 34px",
                                        gap: 8,
                                        alignItems: "end",
                                        padding: 8,
                                        background: "var(--color-surface-1)",
                                        border: "1px solid var(--color-border)",
                                        borderRadius: 4,
                                      }}
                                    >
                                      <div className="field-group">
                                        <label
                                          className="field-label"
                                          style={{ fontSize: 9 }}
                                        >
                                          Size *
                                        </label>
                                        <input
                                          className="field-input"
                                          style={{ height: 32, fontSize: 12 }}
                                          value={cs.size}
                                          placeholder="e.g. Standard (200x70cm)"
                                          onChange={(e) =>
                                            updateColorSize(
                                              sIdx,
                                              "size",
                                              e.target.value,
                                            )
                                          }
                                        />
                                      </div>
                                      <div className="field-group">
                                        <label
                                          className="field-label"
                                          style={{ fontSize: 9 }}
                                        >
                                          Price (₹) *
                                        </label>
                                        <input
                                          className="field-input"
                                          style={{ height: 32, fontSize: 12 }}
                                          type="number"
                                          min="0"
                                          value={cs.price}
                                          placeholder="Price"
                                          onChange={(e) =>
                                            updateColorSize(
                                              sIdx,
                                              "price",
                                              e.target.value === ""
                                                ? ""
                                                : Math.max(
                                                    0,
                                                    Number(e.target.value),
                                                  ),
                                            )
                                          }
                                        />
                                      </div>
                                      <div className="field-group">
                                        <label
                                          className="field-label"
                                          style={{ fontSize: 9 }}
                                        >
                                          Sale Price (₹)
                                        </label>
                                        <input
                                          className="field-input"
                                          style={{ height: 32, fontSize: 12 }}
                                          type="number"
                                          min="0"
                                          value={cs.discountPrice || ""}
                                          placeholder="Optional"
                                          onChange={(e) =>
                                            updateColorSize(
                                              sIdx,
                                              "discountPrice",
                                              e.target.value
                                                ? Math.max(
                                                    0,
                                                    Number(e.target.value),
                                                  )
                                                : null,
                                            )
                                          }
                                        />
                                      </div>
                                      <div className="field-group">
                                        <label
                                          className="field-label"
                                          style={{ fontSize: 9 }}
                                        >
                                          Stock *
                                        </label>
                                        <input
                                          className="field-input"
                                          style={{ height: 32, fontSize: 12 }}
                                          type="number"
                                          min="0"
                                          value={cs.quantity}
                                          placeholder="0"
                                          onChange={(e) =>
                                            updateColorSize(
                                              sIdx,
                                              "quantity",
                                              e.target.value === ""
                                                ? 0
                                                : Math.max(
                                                    0,
                                                    Number(e.target.value),
                                                  ),
                                            )
                                          }
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => removeColorSize(sIdx)}
                                        style={{
                                          height: 32,
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          border: "none",
                                          background: "transparent",
                                          color: "var(--color-saffron)",
                                          cursor: "pointer",
                                        }}
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "details" && (
            <div className="card">
              <div className="card-header">
                <div>
                  <span className="card-title">
                    Product Specific Accordions
                  </span>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--color-text-caption)",
                      marginTop: 2,
                    }}
                  >
                    Customise the 3 product-specific accordion sections
                    displayed on the storefront (Product Details, Care
                    Instructions, Artisan Story).
                  </p>
                </div>
              </div>
              <div
                className="card-body"
                style={{ display: "flex", flexDirection: "column", gap: 18 }}
              >
                <div className="field-group">
                  <label className="field-label">1. Product Details</label>
                  <textarea
                    className="field-textarea"
                    rows={4}
                    value={form.productDetails || ""}
                    placeholder={`100% pure premium Kashmiri (Pashmina).\nAuthentic hand-spun yarn and hand-loomed weave.\nFeatures traditional Sozni fine needle embroidery along borders.\nDimensions: 70 x 200 cm (approximately 28 x 80 inches).`}
                    onChange={(e) => set("productDetails", e.target.value)}
                  />
                  <span className="field-hint">
                    Specify exact fabric, weave, embroidery type, and
                    dimensions. Separate points with newlines.
                  </span>
                </div>

                <div className="field-group">
                  <label className="field-label">2. Care Instructions</label>
                  <textarea
                    className="field-textarea"
                    rows={4}
                    value={form.careInstructions || ""}
                    placeholder={`Dry clean only.\nStore in a cool, dry place wrapped in a muslin cloth to protect from moths.\nIron on low heat under a protective cotton sheet if necessary.`}
                    onChange={(e) => set("careInstructions", e.target.value)}
                  />
                  <span className="field-hint">
                    Specific washing, ironing, and preservation instructions.
                    Separate points with newlines.
                  </span>
                </div>

                <div className="field-group">
                  <label className="field-label">3. Artisan Story</label>
                  <textarea
                    className="field-textarea"
                    rows={4}
                    value={form.artisanStory || ""}
                    placeholder={`Hand-spun by Kashmiri women and hand-woven by local master weavers.\nEmbroidered by a skilled craftsman in Srinagar over a span of 120 hours.\nSupports sustainable fair-trade livelihoods in the Kashmir valley.`}
                    onChange={(e) => set("artisanStory", e.target.value)}
                  />
                  <span className="field-hint">
                    Origin story, craft hours, heritage technique, and artisan
                    impact. Separate points with newlines.
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "seo" && (
            <div className="card">
              <div
                className="card-body"
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <p className="form-section-title">Search Engine Optimisation</p>
                <div className="field-group">
                  <label className="field-label">Meta Title</label>
                  <input
                    className="field-input"
                    value={form.seo.title}
                    placeholder="Page title for search engines (50–60 chars)"
                    onChange={(e) => setSeo("title", e.target.value)}
                  />
                  <span className="field-hint">
                    {form.seo.title.length}/60 characters
                  </span>
                </div>
                <div className="field-group">
                  <label className="field-label">Meta Description</label>
                  <textarea
                    className="field-textarea"
                    rows={3}
                    value={form.seo.description}
                    placeholder="Short description for search results (150–160 chars)"
                    onChange={(e) => setSeo("description", e.target.value)}
                  />
                  <span className="field-hint">
                    {form.seo.description.length}/160 characters
                  </span>
                </div>
                <div className="field-group">
                  <label className="field-label">URL Handle</label>
                  <input
                    className="field-input"
                    value={form.seo.url || form.slug}
                    onChange={(e) => setSeo("url", e.target.value)}
                  />
                </div>
                {/* Preview */}
                {(form.seo.title || form.name) && (
                  <div
                    style={{
                      border: "1px solid var(--color-border)",
                      borderRadius: 6,
                      padding: "12px 14px",
                      marginTop: 4,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 11,
                        color: "var(--color-text-caption)",
                        marginBottom: 6,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                      }}
                    >
                      Search preview
                    </p>
                    <p
                      style={{
                        fontSize: 14,
                        color: "#1a0dab",
                        marginBottom: 2,
                      }}
                    >
                      {form.seo.title || form.name}
                    </p>
                    <p style={{ fontSize: 11, color: "#006621" }}>
                      zaevyul.com/{form.seo.url || form.slug}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#545454",
                        marginTop: 2,
                        lineHeight: 1.4,
                      }}
                    >
                      {form.seo.description || form.shortDescription}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Status</span>
            </div>
            <div
              className="card-body"
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              <select
                className="field-select"
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
              <button
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => handleSave()}
                disabled={saving}
              >
                <Save size={13} /> {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>

          {!isNew && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Details</span>
              </div>
              <div
                className="card-body"
                style={{ display: "flex", flexDirection: "column", gap: 8 }}
              >
                {[
                  ["SKU", form.sku],
                  [
                    "Category",
                    categories.find(
                      (c) => String(c._id || c.id) === String(form.category),
                    )?.name || "—",
                  ],
                  ["Stock", form.quantity],
                  [
                    "Price",
                    formatCurrency(form.discountPrice || form.basePrice),
                  ],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                    }}
                  >
                    <span style={{ color: "var(--color-text-caption)" }}>
                      {k}
                    </span>
                    <span
                      style={{
                        color: "var(--color-text-primary)",
                        fontWeight: 500,
                      }}
                    >
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <DeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete product"
        desc="This will permanently remove the product and all its images. Orders are not affected."
      />
    </div>
  );
}
