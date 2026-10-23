import { useState, useEffect, useCallback } from "react";
import { Save, Plus, Edit2, Trash2, X, AlertTriangle, Upload, RefreshCw, Image as ImageIcon, Globe } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import { DeleteDialog } from "../../components/Modal";
import { useToast } from "../../context/ToastContext";
import { useBranding } from "../../context/BrandingContext";
import { api } from "../../lib/api";

const SECTIONS = [
  "General",
  "Branding",
  "Currency",
  "Tax Settings",
  "Shipping",
  // 'Payment',
  "Social",
];

const COUNTRIES_LIST = [
  { code: "IN", name: "India" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "AU", name: "Australia" },
];

const SOCIAL_PLATFORMS = [
  {
    key: "facebook",
    label: "Facebook",
    placeholder: "https://facebook.com/zaevyul",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />
      </svg>
    ),
  },
  {
    key: "instagram",
    label: "Instagram",
    placeholder: "https://instagram.com/zaevyul",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2.5" y="2.5" width="19" height="19" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  /* {
    key: "twitter",
    label: "X (formerly Twitter)",
    placeholder: "https://x.com/zaevyul",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  }, */
  {
    key: "linkedin",
    label: "LinkedIn",
    placeholder: "https://linkedin.com/company/zaevyul",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6.94 5a2 2 0 1 1-4-.002 2 2 0 0 1 4 .002zM7 8.48H3V21h4V8.48zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-3.95 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.68-2.91V8.48z" />
      </svg>
    ),
  },
  {
    key: "youtube",
    label: "YouTube",
    placeholder: "https://youtube.com/@zaevyul",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
];

const DEFAULT_SETTINGS_STATE = {
  storeName: "ZAEVYUL",
  tagline: "Timeless elegance, crafted for you.",
  logo: "",
  favicon: "",
  contactEmail: "care@zaevyul.com",
  contactPhone: "+91 98765 43210",
  currency: "INR",
  currencySymbol: "₹",
  socialLinks: {
    facebook: "",
    instagram: "https://instagram.com/zaevyul",
    twitter: "",
    linkedin: "",
    youtube: "",
  },
  paymentGateways: {},
};

export default function Settings() {
  const toast = useToast();
  const {
    logo,
    favicon,
    updateLogo,
    updateFavicon,
    removeLogo,
    removeFavicon,
    refreshBranding,
  } = useBranding();

  const [settings, setSettings] = useState(DEFAULT_SETTINGS_STATE);
  const [activeSection, setActiveSection] = useState("General");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  const handleLogoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast("Invalid logo file format. Please upload PNG, JPG, SVG, or WebP.", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast("Logo file size exceeds 5MB limit.", "error");
      return;
    }

    try {
      setUploadingLogo(true);
      const res = await updateLogo(file);
      if (res?.success) {
        toast("Logo updated successfully!", "success");
      } else {
        toast(res?.message || "Failed to update logo.", "error");
      }
    } catch (err) {
      toast(err.message || "Failed to upload logo.", "error");
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const handleFaviconFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/png", "image/x-icon", "image/vnd.microsoft.icon", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"];
    if (!validTypes.includes(file.type) && !file.name.endsWith(".ico")) {
      toast("Invalid favicon file format. Please upload PNG, ICO, SVG, or WebP.", "error");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast("Favicon file size exceeds 2MB limit.", "error");
      return;
    }

    try {
      setUploadingFavicon(true);
      const res = await updateFavicon(file);
      if (res?.success) {
        toast("Favicon updated successfully!", "success");
      } else {
        toast(res?.message || "Failed to update favicon.", "error");
      }
    } catch (err) {
      toast(err.message || "Failed to upload favicon.", "error");
    } finally {
      setUploadingFavicon(false);
      e.target.value = "";
    }
  };

  const handleRemoveLogo = async () => {
    try {
      setUploadingLogo(true);
      const res = await removeLogo();
      if (res?.success) {
        toast("Logo reset to default fallback.", "success");
      } else {
        toast(res?.message || "Failed to remove logo.", "error");
      }
    } catch (err) {
      toast(err.message || "Failed to remove logo.", "error");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveFavicon = async () => {
    try {
      setUploadingFavicon(true);
      const res = await removeFavicon();
      if (res?.success) {
        toast("Favicon reset to default fallback.", "success");
      } else {
        toast(res?.message || "Failed to remove favicon.", "error");
      }
    } catch (err) {
      toast(err.message || "Failed to remove favicon.", "error");
    } finally {
      setUploadingFavicon(false);
    }
  };

  const [taxRules, setTaxRules] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [deleteRuleTarget, setDeleteRuleTarget] = useState(null);
  const [deleteRuleLoading, setDeleteRuleLoading] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    countryCode: "IN",
    countryName: "India",
    taxName: "GST",
    taxType: "GST",
    rate: 18,
    isActive: true,
  });

  const set = (k, v) => setSettings((s) => ({ ...s, [k]: v }));
  const setSocial = (k, v) =>
    setSettings((s) => ({
      ...s,
      socialLinks: { ...(s.socialLinks || {}), [k]: v },
    }));
  const setPayment = (gw, k, v) =>
    setSettings((s) => ({
      ...s,
      paymentGateways: {
        ...(s.paymentGateways || {}),
        [gw]: { ...((s.paymentGateways || {})[gw] || {}), [k]: v },
      },
    }));

  useEffect(() => {
    let active = true;
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await api.settings.get();
        if (active) {
          setSettings(data || DEFAULT_SETTINGS_STATE);
        }
      } catch (err) {
        toast(err.message || "Failed to load settings", "error");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchSettings();
    return () => {
      active = false;
    };
  }, [toast]);

  useEffect(() => {
    if (activeSection === "Tax Settings") {
      const fetchRules = async () => {
        setRulesLoading(true);
        try {
          const rules = await api.taxRules.list();
          setTaxRules(rules || []);
        } catch (err) {
          toast(err.message || "Failed to load tax rules", "error");
        } finally {
          setRulesLoading(false);
        }
      };
      fetchRules();
    }
  }, [activeSection, toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...settings,
        logo: logo || settings.logo || "",
        favicon: favicon || settings.favicon || "",
      };
      const updated = await api.settings.update(payload);
      if (updated) {
        setSettings(updated);
        refreshBranding();
      }
      toast("Settings saved successfully", "success");
    } catch (err) {
      toast(err.message || "Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    try {
      if (editingRule) {
        const updated = await api.taxRules.update(editingRule._id, ruleForm);
        setTaxRules((prev) =>
          prev.map((r) => (r._id === editingRule._id ? updated : r)),
        );
        toast("Tax rule updated successfully", "success");
      } else {
        const created = await api.taxRules.create(ruleForm);
        setTaxRules((prev) => [...prev, created]);
        toast("Tax rule created successfully", "success");
      }
      setRuleModalOpen(false);
      setEditingRule(null);
    } catch (err) {
      toast(err.message || "Failed to save tax rule", "error");
    }
  };

  const handleEditRuleClick = (rule) => {
    setEditingRule(rule);
    setRuleForm({
      countryCode: rule.countryCode,
      countryName: rule.countryName,
      stateCode: rule.stateCode || "",
      stateName: rule.stateName || "",
      taxName: rule.taxName,
      taxType: rule.taxType,
      rate: rule.rate,
      isActive: rule.isActive,
    });
    setRuleModalOpen(true);
  };

  const handleDeleteRuleClick = (ruleId) => {
    setDeleteRuleTarget(ruleId);
  };

  const handleConfirmDeleteRule = async () => {
    if (!deleteRuleTarget) return;
    setDeleteRuleLoading(true);
    try {
      await api.taxRules.delete(deleteRuleTarget);
      setTaxRules((prev) => prev.filter((r) => r._id !== deleteRuleTarget));
      toast("Tax rule deleted successfully", "success");
    } catch (err) {
      toast(err.message || "Failed to delete tax rule", "error");
    } finally {
      setDeleteRuleTarget(null);
      setDeleteRuleLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page flex-center py-20">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page page-enter">
      <PageHeader
        title="Settings"
        crumbs={[{ label: "Settings" }]}
        actions={
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={13} /> {saving ? "Saving…" : "Save Changes"}
          </button>
        }
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "180px 1fr",
          gap: 24,
          alignItems: "start",
        }}
      >
        {/* Section nav */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {SECTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              style={{
                padding: "7px 12px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                background:
                  activeSection === s ? "var(--color-cream)" : "transparent",
                color:
                  activeSection === s
                    ? "var(--color-walnut)"
                    : "var(--color-text-secondary)",
                fontSize: 13,
                fontWeight: activeSection === s ? 500 : 400,
                cursor: "pointer",
                textAlign: "left",
                transition: "all var(--transition-fast)",
              }}
            >
              {s}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">{activeSection}</span>
          </div>
          <div
            className="card-body"
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            {activeSection === "General" && (
              <>
                <div className="field-group">
                  <label className="field-label">Store Name</label>
                  <input
                    className="field-input"
                    value={settings.storeName}
                    onChange={(e) => set("storeName", e.target.value)}
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Tagline</label>
                  <input
                    className="field-input"
                    value={settings.tagline}
                    onChange={(e) => set("tagline", e.target.value)}
                  />
                </div>
                <div className="form-row">
                  <div className="field-group">
                    <label className="field-label">Email</label>
                    <input
                      className="field-input"
                      type="email"
                      value={settings.email}
                      onChange={(e) => set("email", e.target.value)}
                    />
                    <span className="field-hint">
                      Used for store contact and customer notifications.
                    </span>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Phone</label>
                    <input
                      className="field-input"
                      value={settings.phone}
                      onChange={(e) => set("phone", e.target.value)}
                    />
                  </div>
                </div>
                <div className="field-group">
                  <label className="field-label">Address</label>
                  <textarea
                    className="field-textarea"
                    rows={2}
                    value={settings.address}
                    onChange={(e) => set("address", e.target.value)}
                  />
                </div>
              </>
            )}

            {activeSection === "Branding" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {/* Logo Section */}
                <div className="border-b border-[#ECE7E1] pb-6">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>
                        Application Logo
                      </h4>
                      <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "2px 0 0 0" }}>
                        Upload your brand logo. This will be automatically displayed across all panels, storefront headers, footers, and authentication screens.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 20, alignItems: "center", background: "var(--color-surface-2, #FAF8F5)", padding: 16, borderRadius: 8, border: "1px solid var(--color-border, #ECE7E1)" }}>
                    {/* Logo Preview Box */}
                    <div
                      style={{
                        width: 140,
                        height: 70,
                        borderRadius: 6,
                        border: "1px dashed var(--color-border, #CBD5E1)",
                        background: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        padding: 8,
                        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.03)",
                      }}
                    >
                      {logo ? (
                        <img src={logo} alt="Store Logo Preview" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                      ) : (
                        <div style={{ textAlign: "center" }}>
                          <span style={{ fontFamily: "var(--font-serif, serif)", fontSize: 16, fontWeight: 600, color: "var(--color-walnut, #1C1916)", letterSpacing: "0.15em", display: "block" }}>
                            {settings.storeName || "Zaevyul"}
                          </span>
                          <span style={{ fontSize: 8, color: "var(--color-text-caption, #8A857E)", letterSpacing: "0.2em" }}>
                            DEFAULT FALLBACK
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Logo Action Controls */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <label
                          className="btn btn-primary"
                          style={{
                            cursor: uploadingLogo ? "not-allowed" : "pointer",
                            fontSize: 12,
                            padding: "6px 14px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          {uploadingLogo ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                          {logo ? "Replace Logo" : "Upload Logo"}
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                            onChange={handleLogoFileChange}
                            disabled={uploadingLogo}
                            style={{ display: "none" }}
                          />
                        </label>

                        {logo && (
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={handleRemoveLogo}
                            disabled={uploadingLogo}
                            style={{ fontSize: 12, padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: 4, color: "#DC2626" }}
                          >
                            <Trash2 size={13} />
                            Remove / Reset
                          </button>
                        )}
                      </div>
                      <span style={{ fontSize: 11, color: "var(--color-text-caption, #8A857E)" }}>
                        Supported formats: PNG, JPG, JPEG, SVG, WebP (Max file size: 5MB).
                      </span>
                    </div>
                  </div>
                </div>

                {/* Favicon Section */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>
                        Browser Favicon
                      </h4>
                      <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "2px 0 0 0" }}>
                        Upload your website favicon. The browser tab icon will automatically update across all pages.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 20, alignItems: "center", background: "var(--color-surface-2, #FAF8F5)", padding: 16, borderRadius: 8, border: "1px solid var(--color-border, #ECE7E1)" }}>
                    {/* Favicon Preview Box */}
                    <div
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: 6,
                        border: "1px dashed var(--color-border, #CBD5E1)",
                        background: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        padding: 4,
                        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.03)",
                      }}
                    >
                      {favicon ? (
                        <img src={favicon} alt="Favicon Preview" style={{ width: 32, height: 32, objectFit: "contain" }} />
                      ) : (
                        <Globe size={24} style={{ color: "var(--color-walnut, #B58A5B)" }} />
                      )}
                    </div>

                    {/* Favicon Action Controls */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <label
                          className="btn btn-primary"
                          style={{
                            cursor: uploadingFavicon ? "not-allowed" : "pointer",
                            fontSize: 12,
                            padding: "6px 14px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          {uploadingFavicon ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                          {favicon ? "Replace Favicon" : "Upload Favicon"}
                          <input
                            type="file"
                            accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/jpeg,image/jpg,image/svg+xml,image/webp"
                            onChange={handleFaviconFileChange}
                            disabled={uploadingFavicon}
                            style={{ display: "none" }}
                          />
                        </label>

                        {favicon && (
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={handleRemoveFavicon}
                            disabled={uploadingFavicon}
                            style={{ fontSize: 12, padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: 4, color: "#DC2626" }}
                          >
                            <Trash2 size={13} />
                            Remove / Reset
                          </button>
                        )}
                      </div>
                      <span style={{ fontSize: 11, color: "var(--color-text-caption, #8A857E)" }}>
                        Supported formats: PNG, ICO, SVG, WebP (Max file size: 2MB).
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "Currency" && (
              <>
                <div className="form-row">
                  <div className="field-group">
                    <label className="field-label">Store Currency</label>
                    <select
                      className="field-select"
                      value={settings.currency}
                      onChange={(e) => {
                        const code = e.target.value;
                        const symbols = {
                          INR: "₹",
                          USD: "$",
                          AUD: "A$",
                          AED: "د.إ",
                          GBP: "£",
                          EUR: "€",
                        };
                        set("currency", code);
                        set("currencySymbol", symbols[code] || "₹");
                      }}
                    >
                      <option value="INR">INR — Indian Rupee (₹)</option>
                      <option value="USD">USD — US Dollar ($)</option>
                      <option value="AUD">AUD — Australian Dollar (A$)</option>
                      <option value="AED">AED — UAE Dirham (د.إ)</option>
                      <option value="GBP">GBP — British Pound (£)</option>
                      <option value="EUR">EUR — Euro (€)</option>
                    </select>
                    <span className="field-hint">
                      Note: Product prices in the database remain stored in INR.
                      Selected currency is the default representation.
                    </span>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Currency Symbol</label>
                    <input
                      className="field-input"
                      value={settings.currencySymbol}
                      readOnly
                      style={{
                        background: "var(--color-surface-2)",
                        cursor: "not-allowed",
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            {activeSection === "Tax Settings" && (
              <>
                <div className="form-row">
                  <div className="field-group">
                    <label className="field-label">
                      Default/Primary Jurisdiction
                    </label>
                    <select
                      className="field-select"
                      value={settings.defaultJurisdictionCountryCode || "IN"}
                      onChange={(e) =>
                        set("defaultJurisdictionCountryCode", e.target.value)
                      }
                    >
                      {COUNTRIES_LIST.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <span className="field-hint">
                      Fallback tax jurisdiction for guest customers or customers
                      with no saved addresses.
                    </span>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Tax Pricing Mode</label>
                    <select
                      className="field-select"
                      value={settings.taxPricingMode || "exclusive"}
                      onChange={(e) => set("taxPricingMode", e.target.value)}
                    >
                      <option value="exclusive">
                        Tax-Exclusive (Tax added on top of product prices)
                      </option>
                      <option value="inclusive">
                        Tax-Inclusive (Tax included within product prices)
                      </option>
                    </select>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 20,
                    borderTop: "1px solid var(--color-border)",
                    paddingTop: 20,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 14,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--color-walnut)",
                      }}
                    >
                      Tax Rules
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setEditingRule(null);
                        setRuleForm({
                          countryCode: "IN",
                          countryName: "India",
                          taxName: "GST",
                          taxType: "GST",
                          rate: 18,
                          isActive: true,
                        });
                        setRuleModalOpen(true);
                      }}
                    >
                      <Plus size={12} style={{ marginRight: 4 }} /> Add Tax Rule
                    </button>
                  </div>

                  {rulesLoading ? (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        padding: "20px 0",
                      }}
                    >
                      <div className="spinner" />
                    </div>
                  ) : taxRules.length === 0 ? (
                    <div
                      style={{
                        padding: "24px",
                        textAlign: "center",
                        background: "var(--color-surface-2)",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      No tax rules configured yet. Click "Add Tax Rule" to
                      configure one.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          fontSize: 13,
                        }}
                      >
                        <thead>
                          <tr
                            style={{
                              textAlign: "left",
                              borderBottom: "2px solid var(--color-border)",
                            }}
                          >
                            <th style={{ padding: "10px 8px" }}>Country</th>
                            <th style={{ padding: "10px 8px" }}>Tax Name</th>
                            <th style={{ padding: "10px 8px" }}>Type</th>
                            <th style={{ padding: "10px 8px" }}>Rate</th>
                            <th style={{ padding: "10px 8px" }}>Status</th>
                            <th
                              style={{
                                padding: "10px 8px",
                                textAlign: "right",
                              }}
                            >
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {taxRules.map((r) => (
                            <tr
                              key={r._id}
                              style={{
                                borderBottom: "1px solid var(--color-border)",
                              }}
                            >
                              <td style={{ padding: "10px 8px" }}>
                                {r.countryName} ({r.countryCode})
                              </td>
                              <td style={{ padding: "10px 8px" }}>
                                {r.taxName}
                              </td>
                              <td style={{ padding: "10px 8px" }}>
                                <span className="badge">{r.taxType}</span>
                              </td>
                              <td style={{ padding: "10px 8px" }}>{r.rate}%</td>
                              <td style={{ padding: "10px 8px" }}>
                                <span
                                  className={`status-pill ${r.isActive ? "status-active" : "status-inactive"}`}
                                  style={{
                                    padding: "2px 8px",
                                    borderRadius: 10,
                                    fontSize: 11,
                                    background: r.isActive
                                      ? "#E8F5E9"
                                      : "#FFEBEE",
                                    color: r.isActive ? "#2E7D32" : "#C62828",
                                  }}
                                >
                                  {r.isActive ? "Active" : "Inactive"}
                                </span>
                              </td>
                              <td
                                style={{
                                  padding: "10px 8px",
                                  textAlign: "right",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 8,
                                    justifyContent: "flex-end",
                                  }}
                                >
                                  <button
                                    type="button"
                                    className="btn btn-icon"
                                    onClick={() => handleEditRuleClick(r)}
                                    title="Edit"
                                    style={{ minWidth: "auto", padding: 6 }}
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-icon btn-danger"
                                    onClick={() => handleDeleteRuleClick(r._id)}
                                    title="Delete"
                                    style={{ minWidth: "auto", padding: 6 }}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeSection === "Shipping" && (
              <div className="field-group" style={{ maxWidth: 220 }}>
                <label className="field-label">Free Shipping Above (₹)</label>
                <input
                  className="field-input"
                  type="number"
                  min="0"
                  value={settings.freeShippingAbove}
                  onChange={(e) =>
                    set("freeShippingAbove", Math.max(0, +e.target.value || 0))
                  }
                />
                <span className="field-hint">
                  Set to 0 to disable free shipping threshold
                </span>
              </div>
            )}

            {activeSection === "Payment" && (
              <>
                <div
                  style={{
                    padding: "12px 14px",
                    background: "var(--color-surface-2)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                    marginBottom: 4,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 10,
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 500 }}>
                      Razorpay
                    </span>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={settings.paymentGateways.razorpay.enabled}
                        onChange={(e) =>
                          setPayment("razorpay", "enabled", e.target.checked)
                        }
                      />
                      <div className="toggle-track" />
                      <div className="toggle-thumb" />
                    </label>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Key ID</label>
                    <input
                      className="field-input"
                      type="password"
                      value={settings.paymentGateways.razorpay.keyId}
                      onChange={(e) =>
                        setPayment("razorpay", "keyId", e.target.value)
                      }
                      placeholder="rzp_live_…"
                    />
                  </div>
                </div>
                <div
                  style={{
                    padding: "12px 14px",
                    background: "var(--color-surface-2)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 10,
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 500 }}>
                      Stripe
                    </span>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={settings.paymentGateways.stripe.enabled}
                        onChange={(e) =>
                          setPayment("stripe", "enabled", e.target.checked)
                        }
                      />
                      <div className="toggle-track" />
                      <div className="toggle-thumb" />
                    </label>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Key ID</label>
                    <input
                      className="field-input"
                      type="password"
                      value={settings.paymentGateways.stripe.keyId}
                      onChange={(e) =>
                        setPayment("stripe", "keyId", e.target.value)
                      }
                      placeholder="sk_live_…"
                    />
                  </div>
                </div>
              </>
            )}

            {activeSection === "Social" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div style={{ marginBottom: "0.25rem" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "4px" }}>
                    Social Media Profiles
                  </h3>
                  <p style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
                    Configure the social media links for your store. When visitors click these icons in the storefront footer, they will open in a new tab.
                  </p>
                </div>
                {SOCIAL_PLATFORMS.map(({ key, label, placeholder, icon }) => (
                  <div key={key} className="field-group">
                    <label
                      className="field-label"
                      style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 500 }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", color: "var(--color-text-secondary)" }}>
                        {icon}
                      </span>
                      {label}
                    </label>
                    <input
                      className="field-input"
                      type="url"
                      value={settings?.socialLinks?.[key] || ""}
                      placeholder={placeholder}
                      onChange={(e) => setSocial(key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tax Rule Modal */}
      {ruleModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(28, 25, 22, 0.45)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: 480,
              margin: 16,
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div
              className="card-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span className="card-title">
                {editingRule ? "Edit Tax Rule" : "Add Tax Rule"}
              </span>
              <button
                type="button"
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "var(--color-text-secondary)",
                }}
                onClick={() => setRuleModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveRule}>
              <div
                className="card-body"
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <div className="field-group">
                  <label className="field-label">Country *</label>
                  <select
                    className="field-select"
                    value={ruleForm.countryCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      const country = COUNTRIES_LIST.find(
                        (c) => c.code === code,
                      );
                      setRuleForm((f) => ({
                        ...f,
                        countryCode: code,
                        countryName: country ? country.name : "",
                      }));
                    }}
                  >
                    {COUNTRIES_LIST.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="field-group">
                    <label className="field-label">Tax Name *</label>
                    <input
                      className="field-input"
                      value={ruleForm.taxName}
                      onChange={(e) =>
                        setRuleForm((f) => ({ ...f, taxName: e.target.value }))
                      }
                      placeholder="e.g. GST, VAT"
                      required
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Tax Type</label>
                    <select
                      className="field-select"
                      value={ruleForm.taxType}
                      onChange={(e) =>
                        setRuleForm((f) => ({ ...f, taxType: e.target.value }))
                      }
                    >
                      <option value="GST">GST</option>
                      <option value="VAT">VAT</option>
                      <option value="Sales Tax">Sales Tax</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label">Rate (%) *</label>
                  <input
                    className="field-input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={ruleForm.rate}
                    onChange={(e) =>
                      setRuleForm((f) => ({
                        ...f,
                        rate: Math.max(0, +e.target.value || 0),
                      }))
                    }
                    placeholder="18"
                    required
                  />
                </div>

                <div
                  className="field-group"
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    marginTop: 8,
                  }}
                >
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={ruleForm.isActive}
                      onChange={(e) =>
                        setRuleForm((f) => ({
                          ...f,
                          isActive: e.target.checked,
                        }))
                      }
                    />
                    <div className="toggle-track" />
                    <div className="toggle-thumb" />
                  </label>
                  <span
                    style={{
                      fontSize: 13,
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    Rule is Active
                  </span>
                </div>
              </div>
              <div
                className="card-footer"
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  borderTop: "1px solid var(--color-border)",
                  paddingTop: 12,
                  paddingBottom: 12,
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setRuleModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteDialog
        open={!!deleteRuleTarget}
        onClose={() => setDeleteRuleTarget(null)}
        onConfirm={handleConfirmDeleteRule}
        loading={deleteRuleLoading}
        title="Delete tax rule"
        desc="Are you sure you want to delete this tax rule? This action cannot be undone."
      />
    </div>
  );
}
