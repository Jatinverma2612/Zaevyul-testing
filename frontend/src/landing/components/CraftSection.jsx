import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function CraftSection() {
  return (
    <section className="overflow-hidden bg-[#FAF8F5] py-20 sm:py-28 lg:py-36">
      <div className="mx-auto max-w-[1720px] 2xl:max-w-[1920px] 3xl:max-w-[2200px] px-6 sm:px-10 lg:px-16 w-full grid grid-cols-1 items-center gap-14 sm:gap-18 lg:grid-cols-[1.05fr_0.95fr] lg:gap-24 xl:gap-32">
        <div className="relative w-full">
          <div
            className="relative w-full overflow-hidden rounded-[2px]"
            style={{ aspectRatio: "4/3" }}
          >
            <img
              src="https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124706/zaevyul/storefront/artisan.jpg"
              alt="Kashmiri artisan weaving at a traditional loom"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
            />
          </div>

          <div
            className="absolute -bottom-7 right-[-2%] w-[38%] overflow-hidden rounded-[2px] shadow-[0_20px_55px_rgba(28,25,22,0.16)] ring-4 ring-[#FAF8F5] sm:-bottom-9 sm:right-[-5%] sm:w-[34%] sm:ring-8"
            style={{ aspectRatio: "1/1" }}
          >
            <img
              src="https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124707/zaevyul/storefront/cat-embroidered.jpg"
              alt="Hand-spun pashmina yarn detail"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="mt-8 max-w-[500px] lg:mt-0 lg:justify-self-end">
          <p className="mb-4 font-sans text-[10px] font-semibold uppercase tracking-[0.25em] text-[#B58A5B] sm:mb-5">
            Our Craft
          </p>

          <h2
            className="mb-6 font-serif font-light leading-[1.08] text-[#1C1916] sm:mb-8"
            style={{ fontSize: "clamp(2.25rem, 4.2vw, 4.35rem)" }}
          >
            Where Tradition
            <br />
            Meets <em className="italic">Time.</em>
          </h2>

          <p className="mb-8 font-sans text-[13px] font-light leading-[1.8] text-[#6B6560] sm:mb-10 sm:text-[14px] sm:leading-[1.9]">
            From the highlands of Changthang to the hands of our weavers, every
            piece carries a story centuries in the making. Our commitment to the
            craft ensures that each thread is a testament to the enduring legacy
            of Kashmiri Handicrafts and Artisanship. It is not merely an accessory; it is an
            heirloom.
          </p>

          <Link
            to="/about"
            className="group inline-flex items-center gap-3 font-sans text-[10px] font-semibold uppercase tracking-[0.25em] text-[#1C1916] cursor-pointer"
          >
            <span className="border-b border-[#1C1916]/40 pb-0.5 transition-colors duration-300 group-hover:border-[#B58A5B] group-hover:text-[#B58A5B]">
              Discover the Journey
            </span>
            <ArrowRight
              size={12}
              className="transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[#B58A5B]"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
