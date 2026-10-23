import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Compass } from "lucide-react";
import Navbar from "../components/Navbar";
import SiteFooter from "../components/SiteFooter";

export default function UnderMaintenancePage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1916] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 flex items-center justify-center pt-28 pb-20 px-6 sm:px-10">
        <div className="max-w-2xl w-full text-center bg-white p-8 sm:p-14 rounded-[2px] border border-[#ECE7E1] shadow-[0_15px_45px_rgba(28,25,22,0.04)]">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FAF8F5] border border-[#ECE7E1] text-[#B58A5B] mb-6">
            <Sparkles size={28} strokeWidth={1.4} />
          </div>

          <span className="block font-sans text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.25em] text-[#B58A5B] mb-3">
            Zaevyul Atelier
          </span>

          <h1 className="font-serif text-[32px] sm:text-[44px] font-light leading-[1.15] text-[#1C1916] mb-5">
            Page Under Refinement
          </h1>

          <p className="font-sans text-[13px] sm:text-[14px] font-light leading-relaxed text-[#6B6560] max-w-lg mx-auto mb-9">
            Our master artisans and digital team are currently refining this section to provide you with an exceptional experience. Please check back shortly or explore our active collections.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/collections"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-[#B58A5B] hover:bg-[#9A7246] text-white px-8 py-3.5 rounded-[1px] font-sans text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors cursor-pointer"
            >
              <span>Explore Collections</span>
              <ArrowRight size={14} />
            </Link>

            <Link
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-[#1C1916] hover:bg-[#1C1916] hover:text-white text-[#1C1916] px-8 py-3.5 rounded-[1px] font-sans text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors cursor-pointer"
            >
              <Compass size={14} />
              <span>Return Home</span>
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
