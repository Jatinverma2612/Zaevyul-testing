import ProductCard from "./ProductCard";

const RELATED = [
  {
    id: 8,
    name: "Sand Pashmina Shawl",
    price: "₹ 32,000",
    img: "/storefront/cat-shawls.png",
    hoverImg: "/storefront/prod-1.png",
    categorySlug: "accessories",
    slug: "pashmina-fingerless-gloves"
  },
  {
    id: 10,
    name: "Reversible Pashmina Shawl",
    price: "₹ 35,000",
    img: "/storefront/prod-3.png",
    hoverImg: "/storefront/prod-stack.png",
    categorySlug: "stoles",
    slug: "cream-pashmina-stole"
  },
  {
    id: 11,
    name: "Midnight Garden Shawl",
    price: "₹ 42,000",
    img: "/storefront/prod-2.png",
    hoverImg: "/storefront/cat-embroidered.png",
    categorySlug: "blankets",
    slug: "alpine-pine-blanket"
  },
  {
    id: 6,
    name: "Sozni Embroidered Shawl",
    price: "₹ 55,000",
    img: "/storefront/cat-embroidered.png",
    hoverImg: "/storefront/prod-2.png",
    categorySlug: "scarves",
    slug: "morning-mist-scarf"
  },
  {
    id: 12,
    name: "Pashmina Shawl",
    price: "₹ 30,000",
    img: "/storefront/prod-stack.png",
    hoverImg: "/storefront/prod-3.png",
    categorySlug: "shawls",
    slug: "himalayan-snow-shawl"
  },
];

export default function RelatedProducts() {
  return (
    <section className="bg-[#FAF8F5] py-16 sm:py-20 lg:py-24 border-t border-[#ECE7E1]">
      <div className="mx-auto max-w-[1440px] 2xl:max-w-[1720px] px-6 sm:px-10 lg:px-16 w-full">
        
        {/* Section Title */}
        <h2 className="text-center font-sans text-[10px] sm:text-[11px] font-semibold tracking-[0.25em] uppercase text-[#8A857E] mb-12">
          YOU MAY ALSO LOVE
        </h2>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-8 lg:gap-8">
          {RELATED.slice(0, 5).map((p) => (
            <ProductCard
              key={p.id}
              p={p}
              showAddButton={false}
              onClick={() => window.scrollTo(0, 0)}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
