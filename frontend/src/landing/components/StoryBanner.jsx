import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function StoryBanner() {
  return (
    <section className="relative h-[500px] overflow-hidden sm:h-[600px] lg:h-[660px]">
      <div className="absolute inset-0">
        <img
          src="https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124719/zaevyul/storefront/story-bg.jpg"
          alt="Himalayan mountain landscape"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <div className="absolute inset-0 mx-auto flex max-w-[1720px] 2xl:max-w-[1920px] 3xl:max-w-[2200px] flex-col items-center justify-center px-6 text-center sm:px-10 lg:px-16">
        <p className="mb-5 font-sans text-[9px] font-semibold uppercase tracking-[0.3em] text-white/70 sm:mb-6 sm:text-[10px] sm:tracking-[0.35em]">
          The House of Zaevyul
        </p>

        <h2
          className="mb-5 max-w-[660px] font-serif font-light leading-[1.05] text-white sm:mb-7"
          style={{ fontSize: "clamp(2.5rem, 5.8vw, 5.6rem)" }}
        >
          A story to wrap yourself in.
        </h2>

        <p className="mb-8 max-w-[390px] font-sans text-[13px] font-light leading-[1.75] text-white/68 sm:mb-11 sm:text-[15px] sm:leading-[1.9]">
          Explore our enduring edit of hand-finished pashmina, made for the
          moments you keep.
        </p>
        <Link
          to="/collections"
          className="inline-flex items-center justify-center gap-3 rounded-[1px] bg-[#FAF8F5] px-10 py-4 transition-colors duration-300 hover:bg-white sm:px-12 sm:py-5 cursor-pointer"
        >
          <span className="font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-[#1C1916] sm:text-[10px] sm:tracking-[0.25em]">
            Explore the Collection
          </span>
          <ArrowRight size={13} strokeWidth={1.5} className="text-[#1C1916]" />
        </Link>
      </div>
    </section>
  );
}
