import { HandHeart, Gem, Mountain, Globe, ArrowRight } from "lucide-react";
import Navbar from "../components/Navbar";
import SiteFooter from "../components/SiteFooter";

/* Small ornamental divider used under each section heading */
function OrnamentDivider({ className = "" }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="h-px w-6 bg-[#B58A5B]/50" />
      <span className="h-1.5 w-1.5 rotate-45 border border-[#B58A5B]" />
      <span className="h-px w-6 bg-[#B58A5B]/50" />
    </div>
  );
}

/* Eyebrow: number + "OUR STORY" label, shared across all 4 sections */
function SectionEyebrow({ number }) {
  return (
    <div className="mb-4">
      <span className="block font-serif text-[13px] text-[#B58A5B] mb-2.5">
        {number}
      </span>
      <span className="block text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[#B58A5B]">
        Our Story
      </span>
    </div>
  );
}

const rootsFeatures = [
  { icon: Mountain, label: "Rooted in Kashmir" },
  { icon: HandHeart, label: "Handmade with Love" },
  { icon: Gem, label: "Crafted by Artisans" },
  { icon: Globe, label: "Shared with the World" },
];

const legacyImgs = [
  {
    number: "01",
    img: "/storefront/about-nature-logo.jpeg",
    title: "Inspired by Nature",
    description: "The serene beauty of Kashmir inspires everything we create.",
  },
  {
    number: "02",
    img: "/storefront/about-artisan-tradition-logo.jpeg",
    title: "Crafted by Hand",
    description:
      "Skilled artisans weave each piece with care, keeping traditions alive.",
  },
  {
    number: "03",
    img: "/storefront/about-pashmina-logo.jpeg",
    title: "Finest Pashmina",
    description:
      "From the finest fibres to intricate details, quality is our promise.",
  },
  {
    number: "04",
    img: "/storefront/about-globe-logo.jpeg",
    title: "Loved Worldwide",
    description:
      "Our creations travel across the world, spreading timeless elegance.",
  },
];

export default function OurStoryPage() {
  return (
    <div className="bg-white text-[#1C1916] font-sans min-h-screen">
      <Navbar />

      <main className="pt-[68px]">
        {/* ===================== SECTION 01 — Woven in Kashmir ===================== */}
        <section className="max-w-7xl 2xl:max-w-[1680px] mx-auto px-6 sm:px-10 lg:px-16 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="max-w-md">
              <SectionEyebrow number="01" />
              <h2 className="font-serif text-[30px] sm:text-[38px] lg:text-[42px] leading-[1.15] text-[#1C1916]">
                Woven in Kashmir.
                <br />
                Cherished Everywhere.
              </h2>
              <OrnamentDivider className="my-6" />
              <p className="font-sans text-[13.5px] leading-relaxed text-[#6B6560] font-light">
                Zaevyul is a celebration of Kashmiri heritage—its people, its
                traditions and an art that has been passed down for generations.
              </p>
            </div>

            <div className="w-full aspect-[16/11] sm:aspect-[3/2] lg:aspect-[16/11] bg-[#F3EFE8] rounded-[2px] overflow-hidden">
              {/* Replace src with the Kashmir lake / houseboat illustration */}
              <img
                src="/storefront/about-main-v2.jpeg" //don't have cloudinary url so directly take image from public assets
                alt="Illustration of a Kashmiri lake with a houseboat"
                className="w-full h-full"
              />
            </div>
          </div>
        </section>

        <div className="max-w-7xl 2xl:max-w-[1680px] mx-auto px-6 sm:px-10 lg:px-16">
          <div className="border-t border-[#E6DED4]/60" />
        </div>

        {/* ===================== SECTION 02 — Our Roots ===================== */}
        <section className="max-w-7xl 2xl:max-w-[1680px] mx-auto px-6 sm:px-10 lg:px-16 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="w-full aspect-[4/3] sm:aspect-[3/2] lg:aspect-[4/3] bg-white rounded-[2px] overflow-hidden order-1 lg:order-1 grid grid-cols-2 gap-2">
              <img
                src="/storefront/about-2-part1.jpeg"
                alt="Tourist in kashmir boating and traditional house"
                className="w-full h-full object-cover"
              />
              <img
                src="/storefront/about-2-part2.jpeg" // Second image
                alt="Kashmiri traditional house design"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="max-w-md order-2 lg:order-2">
              <SectionEyebrow number="02" />
              <h2 className="font-serif text-[30px] sm:text-[38px] lg:text-[42px] leading-[1.15] text-[#1C1916]">
                Our Roots.
                <br />
                Our Identity.
              </h2>
              <p className="font-sans text-[13.5px] leading-relaxed text-[#6B6560] font-light mt-6 mb-10">
                From the valleys of Kashmir, where the finest Pashmina is born,
                we carry forward a legacy of purity, patience and passion.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-8 gap-x-4">
                {rootsFeatures.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center text-center gap-3"
                  >
                    <Icon
                      size={22}
                      strokeWidth={1.25}
                      className="text-[#1C1916]"
                    />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6B6560] leading-snug">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===================== SECTION 03 — The Legacy We Weave ===================== */}
        <section className="bg-[#FAF8F5] py-16 sm:py-24">
          <div className="max-w-7xl 2xl:max-w-[1680px] mx-auto px-6 sm:px-10 lg:px-16">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,340px)_1fr] gap-12 lg:gap-16 items-center">
              <div className="max-w-md">
                <SectionEyebrow number="03" />
                <h2 className="font-serif text-[30px] sm:text-[38px] leading-[1.15] text-[#1C1916]">
                  The Legacy
                  <br />
                  We Weave.
                </h2>
                <p className="font-sans text-[13.5px] leading-relaxed text-[#6B6560] font-light mt-6 mb-8">
                  Every Zaevyul piece tells a story of heritage, crafted through
                  generations of skill and devotion.
                </p>
                <button className="group inline-flex items-center gap-2.5 border border-[#E6DED4] hover:border-[#1C1916] px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#1C1916] transition-colors duration-200 cursor-pointer">
                  Our Journey
                  <ArrowRight
                    size={13}
                    strokeWidth={1.75}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </button>
              </div>

              <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-y-10 gap-x-6">
                {/* connecting dotted line — desktop only */}
                <div
                  className="hidden sm:block absolute left-[12.5%] right-[12.5%] top-9 border-t border-dotted border-[#B58A5B]/50 -z-0"
                  aria-hidden="true"
                />

                {legacyImgs.map(({ number, img, title, description }) => (
                  <div
                    key={number}
                    className="relative z-10 flex flex-col items-center text-center gap-4"
                  >
                    <div className="h-[72px] w-[72px] rounded-full bg-[#F3EFE8] border border-[#E6DED4] overflow-hidden shrink-0">
                      <img
                        src={img}
                        alt={title}
                        className="h-full w-full object-cover scale-130"
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-[#B58A5B] tracking-wide">
                      {number}
                    </span>
                    <div>
                      <h4 className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#1C1916] mb-2">
                        {title}
                      </h4>
                      <p className="text-[11.5px] leading-relaxed text-[#8A857E] font-light">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===================== SECTION 04 — More than Pashmina ===================== */}
        <section className="max-w-7xl 2xl:max-w-[1680px] mx-auto px-6 sm:px-10 lg:px-16 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="w-full aspect-[4/3] sm:aspect-[3/2] lg:aspect-[4/3] bg-[#F3EFE8] rounded-[2px] overflow-hidden order-1">
              {/* Replace src with the folded embroidered shawl photograph */}
              <img
                src="https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124696/zaevyul/storefront/about-3.png"
                alt="Close-up of a folded ivory pashmina shawl with gold embroidery"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="max-w-md order-2">
              <SectionEyebrow number="04" />
              <h2 className="font-serif text-[30px] sm:text-[38px] lg:text-[42px] leading-[1.15] text-[#1C1916]">
                More than Pashmina.
                <br />A Legacy of Love.
              </h2>
              <OrnamentDivider className="my-6" />
              <p className="font-sans text-[13.5px] leading-relaxed text-[#6B6560] font-light">
                Zaevyul is more than a brand. It is a legacy of Kashmir, woven
                with love, meant to be cherished, always.
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
