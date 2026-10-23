import { useState } from "react";
import { Save, Shield, Clock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/PageHeader";
import { useToast } from "../../context/ToastContext";
import { api } from "../../lib/api";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // AUD-007: Wire to real API instead of setTimeout mock
  const saveProfile = async () => {
    if (!profile.name || !profile.email) {
      toast("Name and email are required", "error");
      return;
    }
    setSaving(true);
    try {
      await api.profile.update({ name: profile.name, email: profile.email });
      if (refreshUser) await refreshUser();
      toast("Profile updated", "success");
    } catch (err) {
      toast(err.message || "Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  // AUD-007 + AUD-027: Wire to real API, enforce password complexity
  const savePassword = async () => {
    if (!passwords.current) {
      toast("Current password is required", "error");
      return;
    }
    if (passwords.next.length < 8) {
      toast("Password must be at least 8 characters", "error");
      return;
    }
    // AUD-027: Complexity check — require uppercase, lowercase, and number
    const complexityRe = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
    if (!complexityRe.test(passwords.next)) {
      toast(
        "Password must contain uppercase, lowercase, and a number",
        "error",
      );
      return;
    }
    if (passwords.next !== passwords.confirm) {
      toast("Passwords do not match", "error");
      return;
    }
    setSavingPw(true);
    try {
      await api.profile.changePassword(passwords.current, passwords.next);
      setPasswords({ current: "", next: "", confirm: "" });
      toast("Password changed successfully", "success");
    } catch (err) {
      toast(err.message || "Failed to change password", "error");
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="page page-enter">
      <PageHeader title="Profile" crumbs={[{ label: "Profile" }]} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 260px",
          gap: 20,
          alignItems: "start",
        }}
      >
        <div>
          {/* Tabs */}
          <div className="tabs" style={{ marginBottom: 20 }}>
            {[
              { id: "profile", label: "Profile Information" },
              { id: "security", label: "Change Password" },
            ].map((t) => (
              <button
                key={t.id}
                className={`tab ${activeTab === t.id ? "active" : ""}`}
                onClick={() => setActiveTab(t.id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === "profile" && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Personal Information</span>
              </div>
              <div
                className="card-body"
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                <div className="form-row">
                  <div className="field-group">
                    <label className="field-label">Full Name</label>
                    <input
                      className="field-input"
                      value={profile.name}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, name: e.target.value }))
                      }
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Email</label>
                    <input
                      className="field-input"
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, email: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div
                  style={{
                    paddingTop: 8,
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    className="btn btn-primary"
                    onClick={saveProfile}
                    disabled={saving}
                  >
                    <Save size={13} /> {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Change Password</span>
              </div>
              <div
                className="card-body"
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                <div className="field-group">
                  <label className="field-label">Current Password *</label>
                  <input
                    className="field-input"
                    type="password"
                    value={passwords.current}
                    placeholder="Enter current password"
                    onChange={(e) =>
                      setPasswords((p) => ({ ...p, current: e.target.value }))
                    }
                  />
                </div>
                <div className="form-row">
                  <div className="field-group">
                    <label className="field-label">New Password *</label>
                    <input
                      className="field-input"
                      type="password"
                      value={passwords.next}
                      placeholder="Enter new password"
                      onChange={(e) =>
                        setPasswords((p) => ({ ...p, next: e.target.value }))
                      }
                    />
                    <p
                      style={{
                        fontSize: 11,
                        color: "var(--color-text-caption)",
                        marginTop: 4,
                      }}
                    >
                      Min 8 chars · uppercase · lowercase · number
                    </p>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Confirm New Password *</label>
                    <input
                      className="field-input"
                      type="password"
                      value={passwords.confirm}
                      placeholder="Confirm new password"
                      onChange={(e) =>
                        setPasswords((p) => ({ ...p, confirm: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div
                  style={{
                    paddingTop: 8,
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    className="btn btn-primary"
                    onClick={savePassword}
                    disabled={savingPw}
                  >
                    {savingPw ? "Changing…" : "Change Password"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile card */}
        <div className="card">
          <div
            className="card-body"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "var(--color-cream)",
                border: "2px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 600,
                color: "var(--color-walnut)",
                fontFamily: "var(--font-serif)",
              }}
            >
              {user?.initials}
            </div>
            <div>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: "var(--color-text-primary)",
                }}
              >
                {user?.name}
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--color-text-caption)",
                  marginTop: 2,
                }}
              >
                {user?.email}
              </p>
            </div>
            <span className="role-badge">{user?.role?.replace("_", " ")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
