import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function CraftHighlight({
  tag = "THE CRAFT",
  title = "A Heritage Woven by Hand",
  description = "Sozni embroidery is a centuries-old Kashmiri technique known for its intricate fine-needlework. Each motif is meticulously hand-stitched by skilled artisans, preserving a legacy of patience, precision and pride.",
  image = "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124716/zaevyul/storefront/prod-2.jpg",
  linkText = "Discover The Craft",
  linkUrl = "/about"
}) {
  return (
    <section className="bg-[#FAF8F5] py-16 sm:py-20 lg:py-24 border-t border-[#ECE7E1]">
      <div className="mx-auto max-w-[1200px] px-6 sm:px-10 lg:px-16 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-center">
          
          {/* Left Side: Close-up Image */}
          <div className="relative aspect-[16/10] sm:aspect-[4/3] overflow-hidden rounded-[2px] bg-[#EFE9E1]">
            <img
              src={image}
              alt="Close-up of intricate Kashmiri embroidery"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-[1.03]"
            />
          </div>

          {/* Right Side: Content */}
          <div className="flex flex-col justify-center max-w-[480px]">
            <span className="block font-sans text-[9px] sm:text-[10px] font-semibold tracking-[0.2em] uppercase text-[#8A857E] mb-3">
              {tag}
            </span>
            <h2 className="font-serif text-[28px] sm:text-[34px] lg:text-[40px] font-light leading-[1.15] text-[#1C1916] mb-5">
              {title}
            </h2>
            <p className="font-sans text-[13px] sm:text-[14px] text-[#6B6560] font-light leading-relaxed mb-8">
              {description}
            </p>
            <Link
              to={linkUrl === "#" ? "/about" : linkUrl}
              className="group inline-flex items-center gap-2 font-sans text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1C1916] border-b border-[#1C1916]/20 pb-1.5 w-fit hover:border-[#1C1916] transition-all cursor-pointer"
            >
              <span>{linkText}</span>
              <ArrowRight
                size={13}
                strokeWidth={1.5}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
