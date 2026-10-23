import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative h-[92svh] max-h-[920px] min-h-[620px] w-full">
      <div className="absolute inset-0">
        <img
          src="https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124712/zaevyul/storefront/hero.png"
          alt="Woman in Kashmir pashmina shawl against Himalayan mountains"
          className="absolute inset-0 h-full w-full object-cover object-[80%_top]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,9,7,0.68)_0%,rgba(12,9,7,0.42)_36%,rgba(12,9,7,0.08)_72%)]" />
      </div>

      <div className="absolute inset-x-0 bottom-0 top-[68px] mx-auto flex max-w-[1720px] 2xl:max-w-[1920px] 3xl:max-w-[2200px] flex-col justify-center px-6 sm:px-10 lg:px-16">
        <div className="max-w-[850px]">
          <h1 className="mb-6 font-serif text-[2.5rem] sm:text-[3.5rem] md:text-[4.5rem] lg:text-[5.2rem] xl:text-[5.8rem] font-light leading-[1.05] text-white sm:mb-8">
            Woven in Kashmir
            <br />
            Made for <br /> <em className="italic">Generations</em>
          </h1>

          <p className="mb-9 max-w-[390px] font-sans text-[14px] font-light leading-[1.85] text-white/74 sm:mb-11 sm:text-[15px]">
            Pure Pashmina. Handcrafted by Artisans.
            <br />
            Preserved for Us.
          </p>

          <Link
            to="/collections"
            className="group inline-flex items-center gap-3 border-b border-white/48 pb-2 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:border-white cursor-pointer"
          >
            Explore Collection
            <ArrowRight
              size={14}
              strokeWidth={1.4}
              className="transition-transform duration-300 group-hover:translate-x-1.5"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
