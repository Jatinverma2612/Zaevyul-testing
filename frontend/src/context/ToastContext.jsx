import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, XCircle, X, Info } from "lucide-react";

const ToastContext = createContext(null);

const ICONS = {
  default: Info,
  success: CheckCircle2,
  error: XCircle,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "default") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)),
      );
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        320,
      );
    }, 3500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)),
    );
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 320);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      <style>{`
        @keyframes toast-in {
          0% { opacity: 0; transform: translateY(10px) scale(0.97); filter: blur(2px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes toast-out {
          0% { opacity: 1; transform: translateY(0) scale(1); max-height: 80px; margin-top: 10px; }
          100% { opacity: 0; transform: translateY(-6px) scale(0.97); max-height: 0; margin-top: 0; }
        }
        @keyframes toast-sheen {
          0% { transform: translateX(-120%) skewX(-15deg); }
          100% { transform: translateX(220%) skewX(-15deg); }
        }
        .zp-toast-stack {
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          font-family: 'Cormorant Garamond', 'Georgia', serif;
        }
        .zp-toast {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          min-width: 300px;
          max-width: 380px;
          padding: 16px 18px;
          margin-top: 10px;
          background: linear-gradient(160deg, #3B3734 0%, #322E2B 100%);
          border: 1px solid rgba(169, 111, 74, 0.35);
          border-left: 3px solid var(--zp-accent, #A96F4A);
          border-radius: 3px;
          box-shadow:
            0 12px 28px -8px rgba(20, 16, 12, 0.45),
            0 2px 6px rgba(20, 16, 12, 0.25),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
          overflow: hidden;
          animation: toast-in 0.45s cubic-bezier(0.16, 1, 0.3, 1);
          backdrop-filter: blur(6px);
        }
        .zp-toast.leaving {
          animation: toast-out 0.32s cubic-bezier(0.4, 0, 1, 1) forwards;
        }
        .zp-toast::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(100deg, transparent 40%, rgba(238, 230, 216, 0.06) 50%, transparent 60%);
          transform: translateX(-120%) skewX(-15deg);
          animation: toast-sheen 1.1s ease-out 0.15s;
          pointer-events: none;
        }
        .zp-toast-icon {
          flex-shrink: 0;
          margin-top: 1px;
          color: var(--zp-accent, #A96F4A);
        }
        .zp-toast-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding-top: 1px;
        }
        .zp-toast-label {
          font-family: 'Georgia', serif;
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--zp-accent, #A96F4A);
          font-weight: 600;
        }
        .zp-toast-message {
          font-family: -apple-system, 'Segoe UI', sans-serif;
          font-size: 13.5px;
          line-height: 1.45;
          color: #EEE6D8;
          letter-spacing: 0.01em;
        }
        .zp-toast-close {
          flex-shrink: 0;
          background: none;
          border: none;
          cursor: pointer;
          color: #C8BCAD;
          opacity: 0.55;
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 2px;
          transition: opacity 0.15s ease, color 0.15s ease, background 0.15s ease;
        }
        .zp-toast-close:hover {
          opacity: 1;
          color: #F7F4EF;
          background: rgba(255, 255, 255, 0.06);
        }
        .zp-toast-progress {
          position: absolute;
          left: 0;
          bottom: 0;
          height: 2px;
          background: var(--zp-accent, #A96F4A);
          opacity: 0.55;
          animation: toast-shrink 3.5s linear forwards;
        }
        @keyframes toast-shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>

      {children}

      <div className="zp-toast-stack">
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || ICONS.default;
          const accent =
            t.type === "success"
              ? "#7C9473"
              : t.type === "error"
                ? "#B5654A"
                : "#A96F4A";
          const label =
            t.type === "success"
              ? "Success"
              : t.type === "error"
                ? "Error"
                : "Notice";
          return (
            <div
              key={t.id}
              className={`zp-toast${t.leaving ? " leaving" : ""}`}
              style={{ "--zp-accent": accent }}
              role="status"
            >
              <Icon size={17} className="zp-toast-icon" />
              <div className="zp-toast-body">
                <span className="zp-toast-label">{label}</span>
                <span className="zp-toast-message">{t.message}</span>
              </div>
              <button
                className="zp-toast-close"
                onClick={() => removeToast(t.id)}
                aria-label="Dismiss"
              >
                <X size={13} />
              </button>
              {!t.leaving && <div className="zp-toast-progress" />}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};

// --- Demo ---
function Demo() {
  const toast = useToast();
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F7F4EF",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        fontFamily: "-apple-system, sans-serif",
      }}
    >
      <h1
        style={{
          fontFamily: "Georgia, serif",
          color: "#3B3734",
          letterSpacing: "0.08em",
          marginBottom: 8,
        }}
      >
        ZAEVYUL <span style={{ fontWeight: 300 }}>TOASTS</span>
      </h1>
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={() => toast("Your order has been placed.", "success")}
          style={btnStyle("#4B5848")}
        >
          Success
        </button>
        <button
          onClick={() => toast("Item is currently out of stock.", "error")}
          style={btnStyle("#B5654A")}
        >
          Error
        </button>
        <button
          onClick={() =>
            toast("New autumn collection now available.", "default")
          }
          style={btnStyle("#705A46")}
        >
          Notice
        </button>
      </div>
    </div>
  );
}

function btnStyle(color) {
  return {
    padding: "10px 20px",
    borderRadius: 3,
    border: "none",
    background: color,
    color: "#F7F4EF",
    fontSize: 13,
    letterSpacing: "0.04em",
    cursor: "pointer",
    fontFamily: "-apple-system, sans-serif",
  };
}

export default function App() {
  return (
    <ToastProvider>
      <Demo />
    </ToastProvider>
  );
}
