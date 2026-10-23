import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { CustomerAuthProvider } from "./context/CustomerAuthContext"; // CUSTOMER — new
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { CartProvider } from "./context/CartContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import { BrandingProvider } from "./context/BrandingContext";
import AdminRouter from "./router";
import LandingPage from "./landing/pages/LandingPage";
import CollectionsPage from "./landing/pages/CollectionsPage";
import ProductDetailPage from "./landing/pages/ProductDetailPage";
import CartPage from "./landing/pages/CartPage";
import CheckoutPage from "./landing/pages/CheckoutPage";
import MyAccountPage from "./landing/pages/MyAccountPage";
import JournalPage from "./landing/pages/JournalPage";
import JournalDetailPage from "./landing/pages/JournalDetailPage";
import MediaCoveragePage from "./landing/pages/MediaCoveragePage";
import OrderConfirmationPage from "./landing/pages/OrderConfirmationPage";

import CustomerLoginPage from "./landing/pages/CustomerLoginPage";
import OurStoryPage from "./landing/pages/OurStory";
import ScrollToTop from "./landing/components/ScrollToTop";
import CartDrawer from "./landing/components/CartDrawer";
import WishlistDrawer from "./landing/components/WishlistDrawer";
import ContactPage from "./landing/pages/ContactPage";
import TermsPage from "./landing/pages/TermsPage";
import PrivacyPolicyPage from "./landing/pages/PrivacyPolicyPage";
import { PersonalizationProvider } from "./context/PersonalizationContext";
import TrackOrderPage from "./landing/pages/TrackOrderPage";
import FAQPage from "./landing/pages/FAQPage";
import UnderMaintenancePage from "./landing/pages/UnderMaintenancePage";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function App() {
  return (
    <BrowserRouter>
      <BrandingProvider>
        <CurrencyProvider>
          <ThemeProvider>
            <ToastProvider>
              {/* Customer auth wraps the storefront — Google provider needed for GoogleLogin component */}
              <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                <CustomerAuthProvider>
                  <PersonalizationProvider>
                    <FavoritesProvider>
                      <CartProvider>
                      <ScrollToTop />
                      <CartDrawer />
                      <WishlistDrawer />
                      <Routes>
                        {/* Storefront routes */}
                        <Route path="/" element={<LandingPage />} />
                        <Route
                          path="/collections"
                          element={<CollectionsPage />}
                        />
                        <Route
                          path="/collections/:category"
                          element={<CollectionsPage />}
                        />
                        <Route
                          path="/collection/:categorySlug/:productSlug"
                          element={<ProductDetailPage />}
                        />
                        <Route path="/cart" element={<CartPage />} />
                        <Route path="/checkout" element={<CheckoutPage />} />
                        <Route
                          path="/order-confirmation"
                          element={<OrderConfirmationPage />}
                        />
                        <Route
                          path="/order-confirmation/:orderId"
                          element={<OrderConfirmationPage />}
                        />
                        <Route path="/my-account/*" element={<MyAccountPage />} />
                        <Route path="/journal" element={<JournalPage />} />
                        <Route
                          path="/journal/:slug"
                          element={<JournalDetailPage />}
                        />
                        <Route path="/media-coverage" element={<MediaCoveragePage />} />
                        <Route path="/about" element={<OurStoryPage />} />
                        <Route path="/our-story" element={<OurStoryPage />} />


                        {/* Customer auth */}
                        <Route path="/login" element={<CustomerLoginPage />} />
                        <Route path="/contact" element={<ContactPage />} />
                        <Route path="/terms" element={<TermsPage />} />
                        <Route path="/terms-and-conditions" element={<TermsPage />} />
                        <Route path="/privacy" element={<PrivacyPolicyPage />} />
                        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                        <Route path="/track-order" element={<TrackOrderPage />} />
                        <Route path="/faq" element={<FAQPage />} />
                        <Route path="/faqs" element={<FAQPage />} />
                        <Route path="/maintenance" element={<UnderMaintenancePage />} />
                        <Route path="/under-maintenance" element={<UnderMaintenancePage />} />

                        {/* Admin panel — separate auth context */}
                        <Route path="/admin/*" element={<AdminRouter />} />

                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </CartProvider>
                  </FavoritesProvider>
                </PersonalizationProvider>
              </CustomerAuthProvider>
              </GoogleOAuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </CurrencyProvider>
      </BrandingProvider>
    </BrowserRouter>
  );
}
