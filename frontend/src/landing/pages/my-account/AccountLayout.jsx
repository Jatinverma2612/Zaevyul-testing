import {
  ArrowLeft,
  Bookmark,
  Bell,
  MoreHorizontal,
  Heart,
  Package,
  MapPin,
  Mail,
  User,
  HelpCircle,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import { useCustomerAuth } from "../../../context/CustomerAuthContext";

const accountNavItems = [
  { tab: "Overview", label: "Dashboard", icon: LayoutDashboard },
  { tab: "Orders", label: "Orders", icon: Package },
  { tab: "Saved Pieces", label: "Wishlist", icon: Heart },
  { tab: "Addresses", label: "Addresses", icon: MapPin },
  { tab: "Account Details", label: "Account Details", icon: User },
  {
    tab: "Marketing Preferences",
    label: "Marketing Preferences",
    icon: Mail,
  },
];

export default function AccountLayout({
  activeTab,
  setActiveTab,
  navigate,
  toast,
  children,
}) {
  const activeNavLabel = activeTab === "Saved Pieces" ? "Wishlist" : activeTab;
  const { user, isAuthenticated, logout } = useCustomerAuth();
  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <main className="flex-1 pt-[68px] bg-[#fffeff]">
      <Navbar />

      <div className="flex w-full items-stretch">
        <aside className="z-30 hidden min-h-[calc(100vh-68px)] w-[80px] shrink-0 self-stretch border-r border-[#E6DED4]/70 bg-[#F8F7F3] lg:block">
          <div className="sticky top-[68px] flex h-[calc(100vh-68px)] flex-col items-center justify-between px-2 py-6">
            <div className="flex flex-col items-center gap-6 w-full">
              <nav className="flex flex-col items-center gap-3 w-full">
                {accountNavItems.map(({ tab, label, icon: Icon }) => {
                  const isActive = activeTab === tab;
                  const displayLabel =
                    label === "Account Details"
                      ? "Profile"
                      : label === "Marketing Preferences"
                        ? "Marketing"
                        : label === "Dashboard"
                          ? "Overview"
                          : label;

                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`relative flex flex-col items-center justify-center w-14 h-12 py-2 rounded-lg transition-all duration-200 cursor-pointer ${
                        isActive
                          ? "bg-[#d8cebe] text-[#0a0a0a] shadow-[0_10px_26px_rgba(28,25,22,0.07)]"
                          : "text-[#8A857E] hover:bg-white hover:text-[#1C1916]"
                      }`}
                      aria-label={label}
                      title={label}
                    >
                      {isActive && (
                        <span className="absolute -left-2 top-1/2 h-6 w-px -translate-y-1/2 bg-[#1C1916]" />
                      )}
                      <Icon size={14} strokeWidth={1.35} />
                      <span className="mt-1 text-[7px] font-medium tracking-wider uppercase opacity-85 text-center leading-none">
                        {displayLabel}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="flex flex-col items-center gap-3 border-t border-[#E6DED4]/70 pt-5 text-[#8A857E]">
              <button
                onClick={() => toast("No new account alerts", "info")}
                className="flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 hover:bg-white hover:text-[#1C1916] hover:shadow-[0_8px_24px_rgba(28,25,22,0.06)] cursor-pointer"
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell size={14} strokeWidth={1.35} />
              </button>
              <button
                onClick={() =>
                  toast("Help and support will be available soon", "info")
                }
                className="flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 hover:bg-white hover:text-[#1C1916] hover:shadow-[0_8px_24px_rgba(28,25,22,0.06)] cursor-pointer"
                aria-label="Help and Support"
                title="Help and Support"
              >
                <HelpCircle size={14} strokeWidth={1.35} />
              </button>
              <button
                onClick={handleLogout}
                className="flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 hover:bg-white hover:text-[#1C1916] hover:shadow-[0_8px_24px_rgba(28,25,22,0.06)] cursor-pointer"
                aria-label="Logout"
                title="Logout"
              >
                <LogOut size={14} strokeWidth={1.35} />
              </button>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 px-6 pb-10 pt-0 lg:pt-10 sm:px-10 lg:px-10 xl:px-14">
          <div className="mb-8 hidden items-center justify-between border-b border-[#E6DED4]/60 pb-4 lg:flex">
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center gap-2 text-[10px] font-semibold tracking-[0.25em] uppercase text-[#1C1916]/70 transition-colors duration-200 hover:text-[#1C1916] cursor-pointer"
            >
              <span className="inline-block transition-transform duration-200 group-hover:-translate-x-1">
                &larr;
              </span>
              MY ACCOUNT
            </button>

            <div className="font-sans text-[11px] text-[#8A857E] tracking-wide">
              Home &gt; My Account &gt; {activeNavLabel}
            </div>
          </div>

          <div className="lg:hidden -mx-6 mb-8 overflow-x-auto border-y border-[#E6DED4]/50 bg-[#FAF8F5] px-6 py-3 sm:-mx-10 sm:px-10">
            <div className="flex w-max items-center gap-2">
              {accountNavItems.map(({ tab, label, icon: Icon }) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-2 whitespace-nowrap rounded-[4px] px-3.5 py-2 text-[11px] font-medium tracking-wide transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-[#F5EFE7] text-[#1C1916] shadow-xs"
                        : "text-[#8A857E] hover:bg-[#F5EFE7]/70 hover:text-[#1C1916]"
                    }`}
                  >
                    <Icon size={14} strokeWidth={1.5} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-full min-w-0 space-y-10">{children}</div>
        </div>
      </div>
    </main>
  );
}
