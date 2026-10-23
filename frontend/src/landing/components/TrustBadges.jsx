const BADGES = [
  {
    title: "Handcrafted by Kashmiri Artisans",
    desc: "Sourced and inspired from the nature",
  },
  {
    title: "Free shipping and returns",
    desc: "Free delivery and easy return within 14 days",
  },
  {
    title: "Secure payment",
    desc: "Visa, Mastercard, GPay, Apple Pay, American Express",
  },
];

export default function TrustBadges() {
  return (
    <section className="bg-[#FAF8F5] border-y border-[#E6DED4]">
      <div className="mx-auto max-w-[1720px] 2xl:max-w-[1920px] 3xl:max-w-[2200px] px-6 sm:px-10 lg:px-16 w-full py-16 sm:py-24">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-6 lg:gap-12">
          {BADGES.map((badge, idx) => (
            <div
              key={badge.title}
              className={`flex flex-col items-center gap-3 px-4 text-center
                ${idx < BADGES.length - 1 ? "border-b border-[#E6DED4]/60 pb-10 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-6 lg:pr-12" : ""}`}
            >
              <h4 className="font-sans text-[15px] font-medium leading-snug text-[#1C1916] sm:text-[16px]">
                {badge.title}
              </h4>
              <p className="max-w-[240px] font-sans text-[13px] font-light leading-[1.7] text-[#8A857E] sm:text-[14px]">
                {badge.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

