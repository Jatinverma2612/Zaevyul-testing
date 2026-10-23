import { useState, useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import { ArrowRight, Mail } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { useFavorite } from "../../context/FavoritesContext";
import { api } from "../../lib/api";
import Logo from "../../components/Logo";

function FacebookIcon({ size = 18, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />
    </svg>
  );
}

function InstagramIcon({ size = 18, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function XIcon({ size = 18, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedinIcon({ size = 18, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M6.94 5a2 2 0 1 1-4-.002 2 2 0 0 1 4 .002zM7 8.48H3V21h4V8.48zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-3.95 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.68-2.91V8.48z" />
    </svg>
  );
}

function YoutubeIcon({ size = 18, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

const formatExternalUrl = (url, fallback = "") => {
  const target = (url || "").trim() || fallback;
  if (!target) return "";
  if (/^https?:\/\//i.test(target)) return target;
  return `https://${target}`;
};

export default function SiteFooter() {
  const toast = useToast();
  const { setIsOpen: setWishlistOpen } = useFavorite();
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [settings, setSettings] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        const [settingsData, categoriesData] = await Promise.all([
          api.settings.getPublic(),
          api.categories.list(),
        ]);
        if (active) {
          setSettings(settingsData);
          setCategories(categoriesData || []);
        }
      } catch (err) {
        console.error(
          "Error loading footer database settings/categories:",
          err,
        );
      }
    };
    loadData();
    return () => {
      active = false;
    };
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    try {
      setSubscribing(true);
      const res = await api.newsletter.subscribe(email);
      setSubscribed(true);
      toast(res?.message || "Thank you for joining our newsletter!", "success");
      setEmail("");
    } catch (err) {
      toast(err?.message || "Welcome to the Zaevyul newsletter!", "info");
      setSubscribed(true);
      setEmail("");
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer className="bg-[#FAF8F5] font-sans text-[#1C1916] border-t border-[#ECE7E1]">
      {/* Main E-Commerce Footer Navigation Grid */}
      <div className="mx-auto max-w-[1720px] 2xl:max-w-[1920px] 3xl:max-w-[2200px] px-6 sm:px-10 lg:px-16 pt-16 pb-16">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 lg:gap-16">
          {/* Brand Column */}
          <div className="space-y-4">
            <RouterLink to="/" className="block">
              <Logo variant="footer" />
            </RouterLink>
            <div className="w-8 border-t border-[#B58A5B]/30 my-3"></div>
            <p className="text-[13px] font-light leading-[1.6] text-[#6B6560] whitespace-pre-line">
              {settings?.tagline || "Timeless elegance,\ncrafted for you."}
            </p>
          </div>

          {/* Column 2: OUR STORY */}
          <div>
            <h5 className="mb-4 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1C1916]">
              OUR STORY
            </h5>
            <ul className="flex flex-col gap-3 text-[13px] font-light text-[#6B6560]">
              <li>
                <RouterLink
                  to="/our-story"
                  className="hover:text-[#1C1916] transition-colors cursor-pointer"
                >
                  Our Story
                </RouterLink>
              </li>
              <li>
                <RouterLink
                  to="/our-story"
                  className="hover:text-[#1C1916] transition-colors cursor-pointer"
                >
                  Our Craft
                </RouterLink>
              </li>
              <li>
                <RouterLink
                  to="/our-story"
                  className="hover:text-[#1C1916] transition-colors cursor-pointer"
                >
                  Sustainability
                </RouterLink>
              </li>
              <li>
                <RouterLink
                  to="/journal"
                  className="hover:text-[#1C1916] transition-colors cursor-pointer"
                >
                  Journal
                </RouterLink>
              </li>
              <li>
                <RouterLink
                  to="/media-coverage"
                  className="hover:text-[#1C1916] transition-colors cursor-pointer"
                >
                  Media Coverage
                </RouterLink>
              </li>
            </ul>
          </div>


          {/* Column 3: ACCOUNT */}

          {/* Column 4: HELP */}
          <div>
            <h5 className="mb-4 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1C1916]">
              HELP
            </h5>
            <ul className="flex flex-col gap-3 text-[13px] font-light text-[#6B6560]">
              <li>
                <RouterLink
                  to="/faq?category=orders-shipping"
                  className="hover:text-[#1C1916] transition-colors cursor-pointer"
                >
                  Shipping & Delivery
                </RouterLink>
              </li>
              <li>
                <RouterLink
                  to="/faq?category=returns-exchanges"
                  className="hover:text-[#1C1916] transition-colors cursor-pointer"
                >
                  Returns & Exchanges
                </RouterLink>
              </li>
              <li>
                <RouterLink
                  to="/faq"
                  className="hover:text-[#1C1916] transition-colors cursor-pointer"
                >
                  FAQs
                </RouterLink>
              </li>
              <li>
                <RouterLink
                  to="/contact"
                  className="hover:text-[#1C1916] transition-colors cursor-pointer"
                >
                  Contact Us
                </RouterLink>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="mb-4 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1C1916]">
              ACCOUNT
            </h5>
            <ul className="flex flex-col gap-3 text-[13px] font-light text-[#6B6560]">
              <li>
                <RouterLink
                  to="/my-account"
                  className="hover:text-[#1C1916] transition-colors cursor-pointer"
                >
                  My Account
                </RouterLink>
              </li>
              <li>
                <RouterLink
                  to="/my-account/orders"
                  className="hover:text-[#1C1916] transition-colors cursor-pointer"
                >
                  My Orders
                </RouterLink>
              </li>
              <li>
                <button
                  onClick={() => setWishlistOpen(true)}
                  className="hover:text-[#1C1916] transition-colors cursor-pointer text-left"
                >
                  My Wishlist
                </button>
              </li>
            </ul>
          </div>

          {/* Column 5: STAY IN THE LOOP */}
          <div>
            <h5 className="mb-4 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1C1916]">
              STAY IN THE LOOP
            </h5>
            <div className="space-y-4">
              {subscribed ? (
                <div className="text-[12.5px] font-medium text-[#2E7D32]">
                  Thank you for subscribing!
                </div>
              ) : (
                <form
                  className="flex items-center w-full max-w-[280px]"
                  onSubmit={handleSubscribe}
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="flex-1 bg-white border border-[#E6DED4] px-3.5 h-11 text-[13px] font-light text-[#1C1916] outline-none placeholder:text-[#8A857E] rounded-l-[2px]"
                  />
                  <button
                    type="submit"
                    disabled={subscribing}
                    className="bg-[#B58A5B] hover:bg-[#9A7246] text-white px-4 h-11 flex items-center justify-center transition-colors cursor-pointer border border-[#B58A5B] rounded-r-[2px]"
                  >
                    <ArrowRight size={16} />
                  </button>
                </form>
              )}

              {/* Social Icons */}
              <div className="flex items-center gap-4 pt-1 text-[#1C1916]">
                {[
                  {
                    key: "facebook",
                    name: "Facebook",
                    icon: FacebookIcon,
                    url: formatExternalUrl(
                      settings?.socialLinks?.facebook,
                      "https://facebook.com"
                    ),
                  },
                  {
                    key: "instagram",
                    name: "Instagram",
                    icon: InstagramIcon,
                    url: formatExternalUrl(
                      settings?.socialLinks?.instagram,
                      "https://instagram.com/zaevyul"
                    ),
                  },
                  /* {
                    key: "twitter",
                    name: "X",
                    icon: XIcon,
                    url: formatExternalUrl(
                      settings?.socialLinks?.twitter,
                      "https://x.com"
                    ),
                  }, */
                  {
                    key: "linkedin",
                    name: "LinkedIn",
                    icon: LinkedinIcon,
                    url: formatExternalUrl(
                      settings?.socialLinks?.linkedin,
                      "https://linkedin.com"
                    ),
                  },
                  {
                    key: "youtube",
                    name: "YouTube",
                    icon: YoutubeIcon,
                    url: formatExternalUrl(
                      settings?.socialLinks?.youtube,
                      "https://youtube.com"
                    ),
                  },
                ].map(({ key, name, icon: Icon, url }) => (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={name}
                    className="w-6 h-6 flex items-center justify-center hover:text-[#B58A5B] transition-colors"
                  >
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Thin Strip */}
      <div className="border-t border-[#ECE7E1] bg-[#FAF8F5]">
        <div className="mx-auto max-w-[1720px] 2xl:max-w-[1920px] 3xl:max-w-[2200px] px-6 sm:px-10 lg:px-16 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-[#8A857E] font-light">
            &copy; {new Date().getFullYear()} {settings?.storeName || "Zaevyul"}{" "}
            Pashmina. All rights reserved.
          </p>

          <div className="flex items-center gap-4 text-[12px] text-[#8A857E] font-light">
            <RouterLink
              to="/privacy"
              className="hover:text-[#1C1916] transition-colors"
            >
              Privacy Policy
            </RouterLink>
            <span className="text-[#ECE7E1]">|</span>
            <RouterLink
              to="/terms"
              className="hover:text-[#1C1916] transition-colors"
            >
              Terms & Conditions
            </RouterLink>
          </div>
        </div>
      </div>
    </footer>
  );
}
