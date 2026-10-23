import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import SiteFooter from "../components/SiteFooter";
import { useToast } from "../../context/ToastContext";

import AccountLayout from "./my-account/AccountLayout";
import DashboardOverview from "./my-account/DashboardOverview";
import AccountDetailsPage from "./my-account/AccountDetailsPage";
import OrdersPage from "./my-account/OrdersPage";
import SavedPiecesPage from "./my-account/SavedPiecesPage";
import AddressesPage from "./my-account/AddressPage";
import AddressFormPage from "./my-account/AddressFormPage";
import MarketingPreferencesPage from "./my-account/MarketingPrefrencePage";
import OrderDetailPage from "./my-account/OrderDetailsPage";

import { AVATARS } from "./my-account/AccountProfile";

import { useCustomerAuth } from "../../context/CustomerAuthContext";
import { customerApi } from "../../lib/customerApi";
import { useFavorite } from "../../context/FavoritesContext";

const INITIAL_SAVED_PIECES = [
  {
    id: "p1",
    name: "Ivory Sozni Shawl",
    price: 42000,
    image: "/storefront/prod-1.png",
    category: "shawls",
    slug: "ivory-sozni-shawl",
  },
  {
    id: "p2",
    name: "Midnight Garden Shawl",
    price: 48000,
    image: "/storefront/prod-2.png",
    category: "shawls",
    slug: "midnight-garden-shawl",
  },
  {
    id: "p3",
    name: "Sand Pashmina Stole",
    price: 18000,
    image: "/storefront/cat-shawls.png",
    category: "stoles",
    slug: "sand-pashmina-stole",
  },
  {
    id: "p4",
    name: "Plain Pashmina Stole",
    price: 16000,
    image: "/storefront/cat-embroidered.png",
    category: "stoles",
    slug: "plain-pashmina-stole",
  },
];

export default function MyAccountPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const { user, isAuthenticated, loading, refreshUser } = useCustomerAuth();
  const { toggleFavorites } = useFavorite();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate(
        `/login?redirect=${encodeURIComponent(window.location.pathname)}`,
        { replace: true },
      );
    }
  }, [isAuthenticated, loading, navigate]);

  const tabToPath = {
    Overview: "/my-account",
    Orders: "/my-account/orders",
    "Saved Pieces": "/my-account/saved-pieces",
    Addresses: "/my-account/addresses",
    "Account Details": "/my-account/account-details",
    "Marketing Preferences": "/my-account/marketing-preferences",
  };

  const pathToTab = () => {
    const path = location.pathname;
    if (path.includes("/orders")) return "Orders";
    if (path.includes("/saved-pieces")) return "Saved Pieces";
    if (path.includes("/addresses")) return "Addresses";
    if (path.includes("/account-details")) return "Account Details";
    if (path.includes("/marketing-preferences")) return "Marketing Preferences";
    return "Overview";
  };

  const activeTab = pathToTab();
  const setActiveTab = (tab) => navigate(tabToPath[tab] || "/my-account");

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    phoneCountryCode: "",
    countryCode: "",
    avatar: "",
    tagline: "Timeless pieces. Thoughtful choices.",
  });

  const [savedPieces, setSavedPieces] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  const [addresses, setAddresses] = useState([]);

  const [marketingPreferences, setMarketingPreferences] = useState({
    emailUpdates: true,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ ...profile });

  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Sync user details to local state
  useEffect(() => {
    if (user) {
      const uProfile = {
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        phoneCountryCode: user.phoneCountryCode || "",
        countryCode:
          parsePhoneNumberFromString(user.phone || "")?.country || "",
        avatar: user.profileImage || "",
        tagline: "Timeless pieces. Thoughtful choices.",
      };
      setProfile(uProfile);
      setAddresses(user.addresses || []);
      setMarketingPreferences(
        user.marketingPreferences || { emailUpdates: true },
      );
      if (!isEditing) {
        setEditForm(uProfile);
      }
    }
  }, [user, isEditing]);

  // Load populated favorites from the database
  useEffect(() => {
    if (isAuthenticated) {
      let cancelled = false;
      const loadFavorites = async () => {
        setLoadingFavorites(true);
        try {
          const res = await customerApi.favorites.getAll();
          if (!cancelled) {
            setSavedPieces(res.favorites || []);
          }
        } catch (err) {
          console.error("Failed to load favorites in MyAccountPage:", err);
        } finally {
          if (!cancelled) setLoadingFavorites(false);
        }
      };
      loadFavorites();
      return () => {
        cancelled = true;
      };
    }
  }, [isAuthenticated, user?.favoritesCount]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!editForm.name || (!editForm.email && !editForm.phone)) {
      toast("Name and either email or phone are required", "error");
      return;
    }
    try {
      await customerApi.auth.updateProfile({
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        countryCode: editForm.countryCode,
      });
      await refreshUser();
      setIsEditing(false);
      toast("Profile updated successfully", "success");
    } catch (err) {
      toast(err.message || "Failed to update profile", "error");
    }
  };

  const handleAvatarChange = async (avatarUrl) => {
    try {
      await customerApi.auth.updateProfile({ profileImage: avatarUrl });
      await refreshUser();
      setShowAvatarSelector(false);
      toast("Profile avatar updated", "success");
    } catch (err) {
      toast(err.message || "Failed to update avatar", "error");
    }
  };

  const handleToggleHeart = async (productId, productName) => {
    try {
      await toggleFavorites(productId);
      toast(`Removed "${productName}" from saved pieces`, "info");
      // Local filter for instant response
      setSavedPieces((prev) =>
        prev.filter((item) => (item._id || item.id) !== productId),
      );
    } catch (err) {
      toast("Failed to update favorites", "error");
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      await customerApi.auth.deleteAddress(id);
      await refreshUser();
      toast("Address removed", "info");
    } catch (err) {
      toast("Failed to remove address", "error");
    }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      await customerApi.auth.setDefaultAddress(id);
      await refreshUser();
      toast("Default address updated", "success");
    } catch (err) {
      toast("Failed to update default address", "error");
    }
  };

  const handleToggleMarketing = async () => {
    const nextVal = !marketingPreferences.emailUpdates;
    try {
      await customerApi.auth.updateMarketing(nextVal);
      await refreshUser();
      toast(
        nextVal
          ? "Subscribed to email updates"
          : "Unsubscribed from email updates",
        "info",
      );
    } catch (err) {
      toast("Failed to update preferences", "error");
    }
  };

  const renderActivePage = () => {
    if (location.pathname.endsWith("/addresses/new")) {
      return <AddressFormPage />;
    }
    if (/\/addresses\/[^/]+\/edit$/.test(location.pathname)) {
      return <AddressFormPage />;
    }

    const orderDetailMatch = location.pathname.match(
      /^\/my-account\/orders\/([^/]+)$/,
    );
    if (orderDetailMatch) {
      return <OrderDetailPage orderId={orderDetailMatch[1]} />;
    }

    switch (activeTab) {
      case "Overview":
        return (
          <DashboardOverview
            profile={profile}
            showAvatarSelector={showAvatarSelector}
            setShowAvatarSelector={setShowAvatarSelector}
            onAvatarChange={handleAvatarChange}
            onAddAddress={() => navigate("/my-account/addresses/new")}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            editForm={editForm}
            setEditForm={setEditForm}
            onProfileSave={handleProfileSave}
            savedPieces={savedPieces}
            onToggleHeart={handleToggleHeart}
            addresses={addresses}
            onDeleteAddress={handleDeleteAddress}
            marketingPreferences={marketingPreferences}
            onToggleMarketing={handleToggleMarketing}
            setActiveTab={setActiveTab}
          />
        );
      case "Orders":
        return <OrdersPage />;
      case "Saved Pieces":
        return (
          <SavedPiecesPage
            savedPieces={savedPieces}
            onToggleHeart={handleToggleHeart}
          />
        );
      case "Addresses":
        return (
          <AddressesPage
            profile={profile}
            addresses={addresses}
            onDeleteAddress={handleDeleteAddress}
            onAddAddress={() => navigate("/my-account/addresses/new")}
            onEditAddress={(id) => navigate(`/my-account/addresses/${id}/edit`)}
            onSetDefault={handleSetDefaultAddress}
          />
        );
      case "Account Details":
        return (
          <AccountDetailsPage
            profile={profile}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            editForm={editForm}
            setEditForm={setEditForm}
            onProfileSave={handleProfileSave}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />
        );
      case "Marketing Preferences":
        return (
          <MarketingPreferencesPage
            marketingPreferences={marketingPreferences}
            onToggleMarketing={handleToggleMarketing}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#FAF8F5] text-[#1C1916] font-sans min-h-screen flex flex-col justify-between overflow-x-hidden">
      <AccountLayout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        navigate={navigate}
        toast={toast}
      >
        {renderActivePage()}
      </AccountLayout>

      <div>
        <SiteFooter />
      </div>
    </div>
  );
}
