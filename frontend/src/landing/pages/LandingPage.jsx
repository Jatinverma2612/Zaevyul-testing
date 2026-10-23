import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import CraftSection from "../components/CraftSection";
import CollectionsGrid from "../components/CollectionsGrid";
import FeaturedProducts from "../components/FeaturedProducts";
import StoryBanner from "../components/StoryBanner";
import TrustBadges from "../components/TrustBadges";
import SiteFooter from "../components/SiteFooter";

export default function LandingPage() {

  return (
    <div className="bg-[#FAF8F5] text-[#1C1916] font-sans overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <CraftSection />
      <CollectionsGrid />
      <FeaturedProducts />
      <StoryBanner />
      <TrustBadges />
      <SiteFooter />
    </div>
  );
}
