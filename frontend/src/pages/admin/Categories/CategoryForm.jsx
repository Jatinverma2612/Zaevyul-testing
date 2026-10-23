import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save, Trash2, X } from "lucide-react";
import PageHeader from "../../../components/PageHeader";
import ImageUploader from "../../../components/ImageUploader";
import { DeleteDialog } from "../../../components/Modal";
import StatusBadge from "../../../components/StatusBadge";
import { useToast } from "../../../context/ToastContext";
import { api } from "../../../lib/api";

const BLANK = {
  name: "",
  slug: "",
  description: "",
  status: "active",
  mainImage: null,
  sizeChartImage: null,
  seo: { title: "", description: "", url: "" },
};

export default function CategoryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isNew = !id || id === "new";

  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  useEffect(() => {
    const loadCategory = async () => {
      if (!isNew) {
        try {
          const category = await api.categories.get(id);
          if (category) {
            setForm({
              ...BLANK,
              ...category,
              mainImage: category.mainImage || null,
              sizeChartImage: category.sizeChartImage || null,
              seo: category.seo || { ...BLANK.seo },
            });
          } else {
            toast("Category not found", "error");
            navigate("/admin/categories");
          }
        } catch (err) {
          toast("Error loading category details", "error");
        }
      }
    };
    loadCategory();
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
      toast("Category name is required", "error");
      return;
    }
    setSaving(true);

    const mainImageUrl =
      typeof form.mainImage === "string"
        ? form.mainImage
        : form.mainImage?.url || form.mainImage?.src || "";

    const sizeChartUrl =
      typeof form.sizeChartImage === "string"
        ? form.sizeChartImage
        : form.sizeChartImage?.url || form.sizeChartImage?.src || "";

    const categoryData = {
      ...form,
      mainImage: mainImageUrl
        ? typeof form.mainImage === "object" && form.mainImage?.url
          ? form.mainImage
          : { url: mainImageUrl }
        : null,
      image: mainImageUrl,
      sizeChartImage: sizeChartUrl
        ? typeof form.sizeChartImage === "object" && form.sizeChartImage?.url
          ? form.sizeChartImage
          : { url: sizeChartUrl }
        : null,
      status,
    };

    try {
      if (isNew) {
        await api.categories.create(categoryData);
      } else {
        await api.categories.update(id, categoryData);
      }
      toast(isNew ? "Category created" : "Changes saved", "success");
      navigate("/admin/categories");
    } catch (err) {
      toast(err.message || "Failed to save category", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.categories.delete(id);
      toast("Category deleted", "success");
      navigate("/admin/categories");
    } catch (err) {
      toast("Failed to delete category", "error");
    }
  };

  const TABS = [
    { id: "basic", label: "Basic Info" },
    { id: "media", label: "Media" },
    { id: "seo", label: "SEO" },
  ];

  return (
    <div className="page page-enter">
      <PageHeader
        title={isNew ? "New Category" : form.name || "Edit Category"}
        crumbs={[
          { label: "Categories", to: "/admin/categories" },
          { label: isNew ? "New" : "Edit" },
        ]}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-secondary"
              onClick={() => navigate("/admin/categories")}
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
              onClick={() => handleSave("inactive")}
              disabled={saving}
            >
              Save as Inactive
            </button>
            <button
              className="btn btn-primary"
              onClick={() => handleSave("active")}
              disabled={saving}
            >
              <Save size={13} />{" "}
              {saving ? "Saving…" : isNew ? "Create" : "Save"}
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
            ID: {form._id || form.id}
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
                      <label className="field-label">Category Name *</label>
                      <input
                        className="field-input"
                        value={form.name}
                        placeholder="e.g. Shawls"
                        onChange={(e) => {
                          set("name", e.target.value);
                          if (!form.slug)
                            set("slug", generateSlug(e.target.value));
                        }}
                      />
                    </div>
                    <div className="field-group">
                      <label className="field-label">Slug</label>
                      <input
                        className="field-input"
                        value={form.slug}
                        placeholder="shawls"
                        onChange={(e) => set("slug", e.target.value)}
                      />
                    </div>
                    <div className="field-group">
                      <label className="field-label">Description</label>
                      <textarea
                        className="field-textarea"
                        rows={5}
                        value={form.description}
                        placeholder="Describe this category..."
                        onChange={(e) => set("description", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "media" && (
            <div className="card">
              <div
                className="card-body"
                style={{ display: "flex", flexDirection: "column", gap: 20 }}
              >
                <div>
                  <div>
                    <p className="form-section-title">Main Image</p>
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--color-text-caption)",
                      }}
                    >
                      Primary thumbnail for category pages.
                    </span>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <ImageUploader
                      images={form.mainImage ? [form.mainImage] : []}
                      onChange={(imgs) => set("mainImage", imgs[0] || null)}
                      max={1}
                      label="category image"
                      folder="zaevyul/categories"
                    />
                  </div>
                </div>

                {/* <div style={{ paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
                  <div>
                    <p className="form-section-title">Category Size Chart</p>
                    <span style={{ fontSize: 11, color: 'var(--color-text-caption)' }}>
                      Size guide / dimension chart displayed in the storefront size guide modal for products in this category.
                    </span>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <ImageUploader
                      images={form.sizeChartImage ? [form.sizeChartImage] : []}
                      onChange={imgs => set('sizeChartImage', imgs[0] || null)}
                      max={1}
                      label="size chart image"
                      folder="zaevyul/size-charts"
                    />
                  </div>
                </div> */}
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
                      zaevyul.com/categories/{form.seo.url || form.slug}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#545454",
                        marginTop: 2,
                        lineHeight: 1.4,
                      }}
                    >
                      {form.seo.description || form.description}
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
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
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
                  ["Slug", form.slug],
                  ["Products", form.productCount || 0],
                  ["Sort Order", form.sortOrder || "0"],
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
        title="Delete category"
        desc="This will permanently remove the category. Products in this category will become uncategorised. This action cannot be undone."
      />
    </div>
  );
}
