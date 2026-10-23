import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";

const BrandingContext = createContext(null);

export const DEFAULT_BRANDING = {
  logo: "",
  favicon: "",
  storeName: "Zaevyul",
  tagline: "Timeless · Authentic · Handcrafted",
};

/** Dynamic Favicon DOM update helper */
const updateDOMFavicon = (faviconUrl) => {
  if (typeof document === "undefined") return;

  const targetUrl = faviconUrl ? faviconUrl : "/favicon.svg";

  let iconLink = document.querySelector("link[rel*='icon']");
  if (!iconLink) {
    iconLink = document.createElement("link");
    iconLink.rel = "icon";
    document.head.appendChild(iconLink);
  }

  // Set type if known
  if (targetUrl.endsWith(".svg")) {
    iconLink.type = "image/svg+xml";
  } else if (targetUrl.endsWith(".ico")) {
    iconLink.type = "image/x-icon";
  } else if (targetUrl.endsWith(".png")) {
    iconLink.type = "image/png";
  } else if (targetUrl.endsWith(".webp")) {
    iconLink.type = "image/webp";
  }

  // Append timestamp cache buster if custom URL
  const hrefWithBuster = targetUrl.startsWith("http") || targetUrl.startsWith("data:")
    ? (targetUrl.includes("?") ? `${targetUrl}&_t=${Date.now()}` : `${targetUrl}?_t=${Date.now()}`)
    : targetUrl;

  iconLink.href = hrefWithBuster;
};

export function BrandingProvider({ children }) {
  const [branding, setBranding] = useState(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);

  const fetchBranding = useCallback(async () => {
    try {
      const res = await api.branding.getPublic();
      if (res && res.success) {
        const newBranding = {
          logo: res.logo || "",
          favicon: res.favicon || "",
          storeName: res.storeName || "Zaevyul",
          tagline: res.tagline || "Timeless · Authentic · Handcrafted",
        };
        setBranding(newBranding);
        updateDOMFavicon(newBranding.favicon);
      }
    } catch (err) {
      console.warn("Failed to fetch branding context:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranding();

    const handleBrandingChange = () => {
      fetchBranding();
    };

    window.addEventListener("branding-updated", handleBrandingChange);
    window.addEventListener("admin-data-updated", handleBrandingChange);
    window.addEventListener("storage", handleBrandingChange);

    return () => {
      window.removeEventListener("branding-updated", handleBrandingChange);
      window.removeEventListener("admin-data-updated", handleBrandingChange);
      window.removeEventListener("storage", handleBrandingChange);
    };
  }, [fetchBranding]);

  const updateLogo = async (fileOrBase64) => {
    const res = await api.branding.uploadLogo(fileOrBase64);
    if (res && res.success) {
      setBranding((prev) => ({ ...prev, logo: res.logo || "" }));
      window.dispatchEvent(new Event("branding-updated"));
    }
    return res;
  };

  const updateFavicon = async (fileOrBase64) => {
    const res = await api.branding.uploadFavicon(fileOrBase64);
    if (res && res.success) {
      const newFavicon = res.favicon || "";
      setBranding((prev) => ({ ...prev, favicon: newFavicon }));
      updateDOMFavicon(newFavicon);
      window.dispatchEvent(new Event("branding-updated"));
    }
    return res;
  };

  const removeLogo = async () => {
    const res = await api.branding.removeLogo();
    if (res && res.success) {
      setBranding((prev) => ({ ...prev, logo: "" }));
      window.dispatchEvent(new Event("branding-updated"));
    }
    return res;
  };

  const removeFavicon = async () => {
    const res = await api.branding.removeFavicon();
    if (res && res.success) {
      setBranding((prev) => ({ ...prev, favicon: "" }));
      updateDOMFavicon("");
      window.dispatchEvent(new Event("branding-updated"));
    }
    return res;
  };

  return (
    <BrandingContext.Provider
      value={{
        branding,
        logo: branding.logo,
        favicon: branding.favicon,
        storeName: branding.storeName,
        tagline: branding.tagline,
        loading,
        refreshBranding: fetchBranding,
        updateLogo,
        updateFavicon,
        removeLogo,
        removeFavicon,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (!context) {
    return {
      branding: DEFAULT_BRANDING,
      logo: "",
      favicon: "",
      storeName: "Zaevyul",
      tagline: "Timeless · Authentic · Handcrafted",
      loading: false,
      refreshBranding: () => {},
      updateLogo: async () => ({ success: false }),
      updateFavicon: async () => ({ success: false }),
      removeLogo: async () => ({ success: false }),
      removeFavicon: async () => ({ success: false }),
    };
  }
  return context;
}
