import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save, ExternalLink } from "lucide-react";
import { formatDate } from "../../../lib/mockData";
import PageHeader from "../../../components/PageHeader";
import ImageUploader from "../../../components/ImageUploader";
import { useToast } from "../../../context/ToastContext";
import { api } from "../../../lib/api";

const BLANK = {
  title: "",
  articleUrl: "",
  sourceName: "",
  excerpt: "",
  imageUrl: "",
  image: null,
  status: "published",
  publishedAt: new Date().toISOString().split("T")[0],
  sortOrder: 0,
};

export default function MediaCoverageForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isNew = !id || id === "new";

  const [form, setForm] = useState(BLANK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (isNew) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const item = await api.mediaCoverage.get(id);
        if (item) {
          const pubDate = item.publishedAt
            ? new Date(item.publishedAt).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0];
          setForm({
            ...BLANK,
            ...item,
            image: item.image || (item.imageUrl ? { url: item.imageUrl } : null),
            publishedAt: pubDate,
          });
        } else {
          toast("Entry not found", "error");
          navigate("/admin/media-coverage");
        }
      } catch {
        toast("Error loading media coverage details", "error");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, isNew, navigate, toast]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async (statusOverride) => {
    const activeStatus = statusOverride || form.status;

    if (!form.title || !form.title.trim()) {
      toast("Article title is required", "error");
      return;
    }

    if (!form.articleUrl || !form.articleUrl.trim()) {
      toast("Article URL is required", "error");
      return;
    }

    const imgUrl = form.image?.url || form.imageUrl;
    if (!imgUrl) {
      toast("Please upload an article/publication image", "error");
      return;
    }

    setSaving(true);

    const payload = {
      title: form.title.trim(),
      articleUrl: form.articleUrl.trim(),
      sourceName: form.sourceName.trim(),
      excerpt: form.excerpt.trim(),
      imageUrl: imgUrl,
      image: form.image || { url: imgUrl },
      status: activeStatus,
      publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : new Date().toISOString(),
      sortOrder: Number(form.sortOrder) || 0,
    };

    try {
      if (isNew) {
        await api.mediaCoverage.create(payload);
      } else {
        await api.mediaCoverage.update(id, payload);
      }
      toast(isNew ? "Media coverage created" : "Changes saved successfully", "success");
      navigate("/admin/media-coverage");
    } catch (err) {
      toast(err.message || "Failed to save entry", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page flex-center py-20">
        <div className="spinner" />
      </div>
    );
  }

  const currentImages = form.image ? [form.image] : form.imageUrl ? [{ url: form.imageUrl }] : [];

  return (
    <div className="page page-enter">
      <PageHeader
        title={isNew ? "New Media Coverage" : form.title || "Edit Media Coverage"}
        crumbs={[
          { label: "Media Coverage", to: "/admin/media-coverage" },
          { label: isNew ? "New" : "Edit" },
        ]}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleSave("draft")}
              disabled={saving}
            >
              Save draft
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleSave("published")}
              disabled={saving}
            >
              <Save size={13} /> {saving ? "Saving…" : "Publish"}
            </button>
          </div>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "start" }}>
        {/* Main Form Area */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Article Information</span>
            </div>
            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Title */}
              <div className="field-group">
                <label className="field-label">Article Title *</label>
                <input
                  type="text"
                  className="field-input"
                  style={{ fontSize: 14, height: 42 }}
                  value={form.title}
                  placeholder='e.g., "Kashmiri women handcraft Pashmina shawls with dignity in Srinagar"'
                  onChange={(e) => set("title", e.target.value)}
                  required
                />
              </div>

              {/* URL */}
              <div className="field-group">
                <label className="field-label">Article / Publication URL *</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="url"
                    className="field-input"
                    value={form.articleUrl}
                    placeholder="https://example.com/article"
                    onChange={(e) => set("articleUrl", e.target.value)}
                    required
                  />
                  {form.articleUrl && (
                    <a
                      href={form.articleUrl.startsWith("http") ? form.articleUrl : `https://${form.articleUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        position: "absolute",
                        right: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--color-walnut, #B58A5B)",
                        display: "flex",
                        alignItems: "center",
                      }}
                      title="Test URL"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
                <span className="field-hint">
                  Clicking the media coverage card on the storefront will open this link in a new tab.
                </span>
              </div>

              {/* Source / Publication Name */}
              <div className="field-group">
                <label className="field-label">Publication / Source Name</label>
                <input
                  type="text"
                  className="field-input"
                  value={form.sourceName}
                  placeholder='e.g., "Hindustan Times", "Vogue India", "The Hindu"'
                  onChange={(e) => set("sourceName", e.target.value)}
                />
              </div>

              {/* Short excerpt */}
              <div className="field-group">
                <label className="field-label">Short Description / Quote / Excerpt</label>
                <textarea
                  className="field-textarea"
                  rows={3}
                  value={form.excerpt}
                  placeholder="Optional brief snippet or highlight from the article…"
                  onChange={(e) => set("excerpt", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Image Upload Card */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Article Featured Image *</span>
            </div>
            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                Upload the publication thumbnail or feature photo. Reuses Cloudinary secure storage.
              </p>
              <ImageUploader
                images={currentImages}
                onChange={(imgs) => {
                  const first = imgs.length > 0 ? imgs[0] : null;
                  set("image", first);
                  set("imageUrl", first ? (typeof first === "string" ? first : first.url) : "");
                }}
                max={1}
                label="article image"
                folder="zaevyul/media"
              />
            </div>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Publishing & Status</span>
            </div>
            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="field-group">
                <label className="field-label">Status</label>
                <select
                  className="field-select"
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              <div className="field-group">
                <label className="field-label">Publication Date</label>
                <input
                  type="date"
                  className="field-input"
                  value={form.publishedAt}
                  onChange={(e) => set("publishedAt", e.target.value)}
                />
              </div>

              <div className="field-group">
                <label className="field-label">Display Order (Sort Position)</label>
                <input
                  type="number"
                  className="field-input"
                  value={form.sortOrder}
                  onChange={(e) => set("sortOrder", parseInt(e.target.value, 10) || 0)}
                  placeholder="0"
                />
                <span className="field-hint">Lower numbers appear first.</span>
              </div>

              {!isNew && form.createdAt && (
                <p style={{ fontSize: 11, color: "var(--color-text-caption)" }}>
                  Created {formatDate(form.createdAt)}
                </p>
              )}

              <button
                type="button"
                className="btn btn-primary"
                style={{ justifyContent: "center", marginTop: 6 }}
                onClick={() => handleSave()}
                disabled={saving}
              >
                <Save size={13} /> {saving ? "Saving…" : "Save Entry"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
