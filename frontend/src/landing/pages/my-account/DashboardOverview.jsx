import { useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../../components/ProductCard";
import {
  List,
  Heart,
  MapPin,
  User,
  Mail,
  Edit3,
  Trash2,
  Plus,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";

/**
 * PREVIEW-ONLY FILE — for viewing in this chat's artifact renderer.
 * Do NOT copy this into your project. Your production file is
 * DashboardOverview.jsx (bracket Tailwind classes + react-router-dom Link),
 * which is correct for a real Tailwind build and untouched by this file.
 *
 * This copy exists only because the chat preview here has no Tailwind
 * JIT compiler, so bracket values like bg-[#EEE8E0] don't render — this
 * version uses inline styles instead, purely so you can see the layout.
 */

const C = {
  border: "#EEE8E0",
  borderLight: "#F0ECE7",
  ink: "#161411",
  inkStrong: "#1C1916",
  textMuted: "#6B6560",
  textFaint: "#8D8780",
  textFainter: "#8A857E",
  accent: "#9D7E59",
  hoverBg: "#FBF9F6",
  hoverBg2: "#F3EFE9",
  iconBg: "#F4F1EC",
  avatarBg: "#EFE9E1",
  toggleOff: "#E6DED4",
  danger: "#C94C4C",
  labelName: "#5F5A54",
  avatarEditBorder: "#E9E2DA",
  avatarOptBorder: "#E6DED4",
};

const AVATARS = [
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
];

const DEMO_PROFILE = {
  name: "Devyansh Grover",
  email: "devyansh.grover348@gmail.com",
  tagline: "Timeless pieces. Thoughtful choices.",
  avatar:
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
};

const DEMO_SAVED_PIECES = [
  {
    id: 1,
    name: "Ivory Sozni Shawl",
    price: 42000,
    image:
      "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&q=80&w=400",
  },
  {
    id: 2,
    name: "Midnight Garden Shawl",
    price: 46000,
    image:
      "https://images.unsplash.com/photo-1610030181087-540f3116e3aa?auto=format&fit=crop&q=80&w=400",
  },
  {
    id: 3,
    name: "Sand Pashmina Stole",
    price: 18000,
    image:
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&q=80&w=400",
  },
  {
    id: 4,
    name: "Plain Pashmina Stole",
    price: 16000,
    image:
      "https://images.unsplash.com/photo-1620799139507-2a76f79a2f4d?auto=format&fit=crop&q=80&w=400",
  },
];

function DashboardOverviewPreview({
  profile = DEMO_PROFILE,
  savedPieces: propSavedPieces = DEMO_SAVED_PIECES,
  addresses = [],
  marketingPreferences: marketingPreferencesProp,
  onToggleMarketing: onToggleMarketingProp,
  onAddAddress,
  onToggleHeart: onToggleHeartProp,
  setActiveTab = () => {},
  setIsEditing = () => {},
}) {
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [editForm, setEditForm] = useState({ ...profile });
  const [localSavedPieces, setLocalSavedPieces] = useState(null);
  const [localMarketingPreferences, setLocalMarketingPreferences] = useState({
    emailUpdates: true,
  });

  const savedPieces =
    localSavedPieces !== null ? localSavedPieces : propSavedPieces;

  const onToggleHeart = (id, name) => {
    if (onToggleHeartProp) {
      onToggleHeartProp(id, name);
    } else {
      setLocalSavedPieces(
        (localSavedPieces || propSavedPieces).filter((p) => p.id !== id),
      );
    }
  };

  const marketingPreferences =
    marketingPreferencesProp || localMarketingPreferences;
  const onToggleMarketing =
    onToggleMarketingProp ||
    (() =>
      setLocalMarketingPreferences((prev) => ({
        ...prev,
        emailUpdates: !prev.emailUpdates,
      })));

  return (
    <div className="bg-white border border-[#E6DED4]/40 rounded-[4px] p-6 sm:p-8 shadow-xs">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] items-start gap-10 lg:gap-14">
        {/* LEFT COLUMN */}
        <div className="flex flex-col items-center lg:items-start pt-2 w-full">
          <div style={{ position: "relative" }}>
            {profile.avatar &&
            (profile.avatar.startsWith("http") ||
              profile.avatar.startsWith("https")) ? (
              <div
                style={{
                  height: 142,
                  width: 142,
                  overflow: "hidden",
                  borderRadius: "9999px",
                  background: C.avatarBg,
                }}
              >
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  style={{ height: "100%", width: "100%", objectFit: "cover" }}
                />
              </div>
            ) : (
              <div
                style={{
                  height: 142,
                  width: 142,
                  color: "#1C1916",
                  borderRadius: "9999px",
                  background: "#d8cebe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "Georgia, serif",
                  fontSize: 38,
                  fontWeight: 300,
                  letterSpacing: "0.05em",
                }}
              >
                {(() => {
                  if (!profile.name) return "Z";
                  const parts = profile.name.trim().split(/\s+/);
                  return parts
                    .map((p) => p[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);
                })()}
              </div>
            )}
          </div>

          <h2
            className="text-center lg:text-left"
            style={{
              marginTop: 28,
              fontSize: 25,
              fontFamily: "Georgia, serif",
              color: C.ink,
            }}
          >
            {profile.name}
          </h2>
          <p
            className="text-center lg:text-left"
            style={{
              marginTop: 8,
              fontSize: 12,
              fontWeight: 300,
              color: C.textFaint,
            }}
          >
            {profile.tagline}
          </p>

          <button
            onClick={onAddAddress}
            style={{
              marginTop: 32,
              display: "inline-flex",
              height: 40,
              minWidth: 126,
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              borderRadius: 4,
              border: `1px solid ${C.border}`,
              background: "#fff",
              padding: "0 20px",
              fontSize: 11,
              fontWeight: 500,
              color: C.inkStrong,
              cursor: "pointer",
            }}
          >
            <Plus size={14} strokeWidth={1.55} /> New Address
          </button>
        </div>

        {/* RIGHT COLUMN */}
        <div
          style={{
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 32,
          }}
        >
          <section
            style={{
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: "#fdfefd",
              padding: "24px 28px",
            }}
          >
            <div
              style={{
                marginBottom: 28,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <h3
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: 17,
                  color: C.ink,
                  margin: 0,
                }}
              >
                Account Details
              </h3>
              <button
                onClick={() => {
                  setActiveTab("Account Details");
                  setIsEditing(true);
                }}
                style={{
                  display: "flex",
                  height: 28,
                  width: 28,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "9999px",
                  background: C.hoverBg,
                  color: C.textMuted,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <Edit3 size={12} strokeWidth={1.45} />
              </button>
            </div>
            <div className="space-y-4 sm:space-y-0" style={{ fontSize: 12 }}>
              <div
                className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-1 sm:gap-4"
                style={{
                  borderBottom: `1px solid ${C.borderLight}`,
                  paddingBottom: 16,
                }}
              >
                <span style={{ color: C.labelName }}>Name</span>
                <span style={{ color: C.ink }}>{profile.name}</span>
              </div>
              <div
                className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-1 sm:gap-4"
                style={{
                  paddingTop: 16,
                }}
              >
                <span style={{ color: C.labelName }}>Email</span>
                <span style={{ color: C.ink }}>{profile.email}</span>
              </div>
            </div>
          </section>

          <section>
            <div
              style={{
                marginBottom: 16,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <h3
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  fontFamily: "Georgia, serif",
                  fontSize: 17,
                  color: C.ink,
                  margin: 0,
                }}
              >
                <span
                  style={{
                    display: "flex",
                    height: 20,
                    width: 20,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 4,
                    background: C.iconBg,
                    color: C.textMuted,
                  }}
                >
                  <List size={12} strokeWidth={1.4} />
                </span>
                Latest Orders
              </h3>
            </div>
            <div
              style={{
                display: "flex",
                minHeight: 82,
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                background: "#fff",
                padding: "16px 20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    display: "flex",
                    height: 44,
                    width: 44,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "9999px",
                    background: C.iconBg,
                    color: C.accent,
                  }}
                >
                  <ShoppingBag size={18} strokeWidth={1.45} />
                </div>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      fontWeight: 500,
                      color: C.ink,
                    }}
                  >
                    You have no orders yet.
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 11,
                      fontWeight: 300,
                      color: C.textFaint,
                    }}
                  >
                    Explore our handcrafted pieces.
                  </p>
                </div>
              </div>
              <Link
                to="/collections"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 11,
                  fontWeight: 500,
                  color: C.ink,
                  textDecoration: "none",
                  cursor: "pointer",
                }}
              >
                Explore Collection <ArrowRight size={14} strokeWidth={1.45} />
              </Link>
            </div>
          </section>

          <section>
            <div
              style={{
                marginBottom: 20,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <h3
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  fontFamily: "Georgia, serif",
                  fontSize: 17,
                  color: C.ink,
                  margin: 0,
                }}
              >
                <Heart size={17} strokeWidth={1.35} color={C.ink} /> Saved
                Pieces
              </h3>
              <span
                onClick={() => setActiveTab("Saved Pieces")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 11,
                  fontWeight: 500,
                  color: C.ink,
                  cursor: "pointer",
                }}
              >
                View all <ArrowRight size={14} strokeWidth={1.45} />
              </span>
            </div>
            {savedPieces.length === 0 ? (
              <div
                style={{
                  padding: "40px 0",
                  textAlign: "center",
                  fontSize: 12,
                  color: C.textFainter,
                }}
              >
                No saved pieces yet. Browse items and click heart icon to save.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {savedPieces.map((p) => (
                  <ProductCard
                    key={p._id || p.id}
                    p={p}
                    showAddButton={false}
                  />
                ))}
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <section
              style={{
                display: "flex",
                minHeight: 162,
                flexDirection: "column",
                justifyContent: "space-between",
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                background: "#fff",
                padding: "20px 24px",
              }}
            >
              <div>
                <div
                  style={{
                    marginBottom: 16,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <h4
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      fontFamily: "Georgia, serif",
                      fontSize: 16,
                      color: C.ink,
                      margin: 0,
                    }}
                  >
                    <MapPin size={16} strokeWidth={1.35} color={C.ink} />{" "}
                    Addresses
                  </h4>
                  <button
                    onClick={onAddAddress}
                    style={{
                      display: "flex",
                      height: 28,
                      width: 28,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "9999px",
                      background: C.hoverBg,
                      color: C.textMuted,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <Plus size={14} strokeWidth={1.55} />
                  </button>
                </div>
                {addresses.length === 0 ? (
                  <p
                    style={{
                      marginBottom: 16,
                      fontSize: 11,
                      fontWeight: 300,
                      lineHeight: 1.6,
                      color: C.textFaint,
                    }}
                  >
                    No saved addresses.
                    <br />
                    Add a delivery address for faster checkout.
                  </p>
                ) : (
                  <p
                    style={{
                      marginBottom: 16,
                      fontSize: 11,
                      fontWeight: 300,
                      lineHeight: 1.6,
                      color: C.inkStrong,
                    }}
                  >
                    {addresses.find((a) => a.isDefault)?.addressLine1 ||
                      addresses.find((a) => a.isDefault)?.addressLine ||
                      addresses[0].addressLine1 ||
                      addresses[0].addressLine}
                    <br />
                    {addresses.find((a) => a.isDefault)?.city ||
                      addresses[0].city}
                  </p>
                )}
              </div>
              <button
                onClick={() => setActiveTab("Addresses")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 11,
                  fontWeight: 500,
                  color: C.ink,
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  padding: 0,
                  textAlign: "left",
                }}
              >
                Manage Addresses <ArrowRight size={14} strokeWidth={1.45} />
              </button>
            </section>

            <section
              style={{
                display: "flex",
                minHeight: 162,
                flexDirection: "column",
                justifyContent: "space-between",
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                background: "#fff",
                padding: "20px 24px",
              }}
            >
              <div>
                <div
                  style={{
                    marginBottom: 16,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <h4
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      fontFamily: "Georgia, serif",
                      fontSize: 16,
                      color: C.ink,
                      margin: 0,
                    }}
                  >
                    <User size={16} strokeWidth={1.35} color={C.ink} /> Account
                    Details
                  </h4>
                  <button
                    onClick={() => {
                      setActiveTab("Account Details");
                      setIsEditing(true);
                    }}
                    style={{
                      display: "flex",
                      height: 28,
                      width: 28,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "9999px",
                      background: C.hoverBg,
                      color: C.textMuted,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <Edit3 size={12} strokeWidth={1.45} />
                  </button>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    fontSize: 11,
                    fontWeight: 300,
                  }}
                >
                  <div
                    style={{ display: "grid", gridTemplateColumns: "60px 1fr" }}
                  >
                    <span style={{ color: C.labelName }}>Name</span>
                    <span style={{ color: C.inkStrong }}>{profile.name}</span>
                  </div>
                  <div
                    style={{ display: "grid", gridTemplateColumns: "60px 1fr" }}
                  >
                    <span style={{ color: C.labelName }}>Email</span>
                    <span
                      style={{
                        color: C.inkStrong,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {profile.email}
                    </span>
                  </div>
                  <div
                    style={{ display: "grid", gridTemplateColumns: "60px 1fr" }}
                  >
                    <span style={{ color: C.labelName }}>Password</span>
                    <span style={{ color: C.inkStrong }}>
                      &bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;
                    </span>
                  </div>
                </div>
              </div>
              <span
                onClick={() => {
                  setActiveTab("Account Details");
                  setIsEditing(true);
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 11,
                  fontWeight: 500,
                  color: C.ink,
                  paddingTop: 16,
                  cursor: "pointer",
                }}
              >
                Full Details <ArrowRight size={14} strokeWidth={1.45} />
              </span>
            </section>

            <section
              style={{
                display: "flex",
                minHeight: 162,
                flexDirection: "column",
                justifyContent: "space-between",
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                background: "#fff",
                padding: "20px 24px",
              }}
            >
              <div>
                <div
                  style={{
                    marginBottom: 16,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <h4
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      fontFamily: "Georgia, serif",
                      fontSize: 16,
                      color: C.ink,
                      margin: 0,
                    }}
                  >
                    <Mail size={16} strokeWidth={1.35} color={C.ink} />{" "}
                    Marketing Preferences
                  </h4>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 11,
                  }}
                >
                  <div>
                    <span
                      style={{
                        display: "block",
                        fontWeight: 500,
                        color: C.ink,
                      }}
                    >
                      Email Updates
                    </span>
                    <span
                      style={{
                        marginTop: 4,
                        display: "block",
                        fontSize: 10.5,
                        fontWeight: 300,
                        color: C.textFaint,
                      }}
                    >
                      Receive updates about new collections and offers.
                    </span>
                  </div>
                  <button
                    onClick={onToggleMarketing}
                    role="switch"
                    aria-checked={marketingPreferences.emailUpdates}
                    style={{
                      position: "relative",
                      marginLeft: 12,
                      display: "block",
                      height: 22,
                      width: 58,
                      borderRadius: "9999px",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      background: marketingPreferences.emailUpdates
                        ? C.accent
                        : C.toggleOff,
                      transition: "background .2s ease",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: 2,
                        left: 2,
                        display: "block",
                        height: 18,
                        width: 18,
                        borderRadius: "9999px",
                        background: "#fff",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                        transform: marketingPreferences.emailUpdates
                          ? "translateX(18px)"
                          : "translateX(0)",
                        transition: "transform .2s ease",
                      }}
                    />
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardOverviewPreview;
