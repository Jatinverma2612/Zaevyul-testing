import { useState, useEffect } from "react";
import { useBranding } from "../context/BrandingContext";

export default function Logo({
  variant = "default", // 'default' | 'header' | 'footer' | 'sidebar' | 'sidebar-collapsed' | 'auth' | 'invoice' | 'mark'
  className = "",
  imgClassName = "",
  showSub = true,
  alt,
  style = {},
}) {
  const { logo, storeName } = useBranding();
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [logo]);

  const displayStoreName = storeName || "Zaevyul";

  // 1. Custom uploaded logo image takes highest priority
  if (logo && !imgError) {
    let defaultImgStyles = "object-contain max-h-full inline-block transition-all";
    if (variant === "header") defaultImgStyles += " max-h-8 sm:max-h-10 lg:max-h-11";
    else if (variant === "footer") defaultImgStyles += " max-h-10 sm:max-h-12";
    else if (variant === "sidebar") defaultImgStyles += " max-h-8 max-w-[140px]";
    else if (variant === "sidebar-collapsed") defaultImgStyles += " max-h-7 max-w-[32px]";
    else if (variant === "auth") defaultImgStyles += " max-h-12 max-w-[160px]";
    else if (variant === "invoice") defaultImgStyles += " max-h-10 max-w-[160px]";
    else defaultImgStyles += " max-h-10";

    return (
      <span className={`inline-flex items-center justify-center ${className}`} style={style}>
        <img
          src={logo}
          alt={alt || displayStoreName}
          className={`${defaultImgStyles} ${imgClassName}`}
          onError={() => setImgError(true)}
        />
      </span>
    );
  }

  // 2. Default brand mark renderers (when no custom logo image has been uploaded)
  if (variant === "sidebar-collapsed" || variant === "mark") {
    return (
      <div
        className={`sidebar-logo-mark ${className}`}
        style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          background: "#B58A5B",
          color: "#FFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-serif, Georgia, serif)",
          fontWeight: 700,
          fontSize: 16,
          lineHeight: 1,
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          ...style,
        }}
      >
        {displayStoreName.charAt(0).toUpperCase()}
      </div>
    );
  }

  if (variant === "sidebar") {
    return (
      <div className={`sidebar-logo-text-block ${className}`} style={{ textAlign: "center", width: "100%", padding: "6px 0", ...style }}>
        <span
          className="sidebar-logo-text"
          style={{
            fontSize: 16,
            letterSpacing: "0.2em",
            fontFamily: "var(--font-serif, Georgia, serif)",
            display: "block",
            color: "#FFFFFF",
            fontWeight: 500,
          }}
        >
          {displayStoreName}
        </span>
        {showSub && (
          <span
            className="sidebar-logo-sub"
            style={{
              fontSize: 9,
              letterSpacing: "0.3em",
              fontFamily: "var(--font-sans, sans-serif)",
              color: "rgba(255,255,255,0.4)",
              display: "block",
              marginTop: 2,
            }}
          >
            PASHMINA
          </span>
        )}
      </div>
    );
  }

  if (variant === "auth") {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`} style={style}>
        <div
          className="w-10 h-10 rounded-md bg-[#1C1916] text-white flex items-center justify-center font-serif text-xl font-bold mb-2 shadow-sm"
          style={{ backgroundColor: "#1C1916", color: "#FFF" }}
        >
          {displayStoreName.charAt(0).toUpperCase()}
        </div>
        <p style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: 18, color: "var(--color-text-primary, #1C1916)", letterSpacing: "0.02em" }}>
          {displayStoreName}
        </p>
      </div>
    );
  }

  if (variant === "invoice") {
    return (
      <div className={`text-left ${className}`} style={style}>
        <h6
          style={{
            fontFamily: "Cormorant Garamond, serif",
            fontSize: 18,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            fontWeight: 600,
            color: "#1C1916",
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          {displayStoreName.toUpperCase()}
        </h6>
        {showSub && (
          <p
            style={{
              fontSize: 8.5,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#8A857E",
              margin: "2px 0 0 0",
              fontWeight: 600,
            }}
          >
            P A S H M I N A
          </p>
        )}
      </div>
    );
  }

  // Header, Footer & Default variant text fallback (no favicon icon in navbar)
  return (
    <span
      className={`font-serif tracking-[0.2em] sm:tracking-[0.28em] uppercase text-[#1C1916] inline-block font-normal text-[16px] sm:text-[18px] lg:text-[20px] ${className}`}
      style={{ fontFamily: "var(--font-serif, Cormorant Garamond, serif)", ...style }}
    >
      {displayStoreName}
    </span>
  );
}
