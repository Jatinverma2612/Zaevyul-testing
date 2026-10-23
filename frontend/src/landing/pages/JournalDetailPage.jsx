import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, ChevronRight, Mail } from "lucide-react";
import Navbar from "../components/Navbar";
import SiteFooter from "../components/SiteFooter";
import { api } from "../../lib/api";

import { useToast } from "../../context/ToastContext";

function FacebookIcon({ size = 13, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function PinterestIcon({ size = 13, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.62 0 12.017 0z" />
    </svg>
  );
}

function TwitterIcon({ size = 12, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function BotanicalWatermark() {
  return (
    <svg
      viewBox="0 0 320 520"
      fill="none"
      stroke="#B58A5B"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="absolute right-0 bottom-0 pointer-events-none opacity-25 w-[300px] sm:w-[380px] lg:w-[460px] h-auto z-0 select-none"
    >
      <path d="M260 520 C210 410 160 300 210 150 C230 90 290 40 310 10" />
      <path d="M210 350 C150 320 110 280 90 220" />
      <path d="M90 220 C70 200 60 170 70 140 C90 140 110 170 90 220Z" fill="#B58A5B" fillOpacity="0.04" />
      <path d="M180 280 C130 250 120 200 140 160 C170 170 190 210 180 280Z" fill="#B58A5B" fillOpacity="0.04" />
      <path d="M210 150 C170 110 180 60 220 30 C250 50 240 110 210 150Z" fill="#B58A5B" fillOpacity="0.04" />
      <circle cx="100" cy="150" r="4" fill="#B58A5B" fillOpacity="0.25" />
      <circle cx="150" cy="170" r="3" fill="#B58A5B" fillOpacity="0.25" />
      <circle cx="230" cy="40" r="5" fill="#B58A5B" fillOpacity="0.25" />
      <path d="M200 420 C140 400 110 360 130 310" />
      <path d="M130 310 C110 290 100 260 120 230 C140 240 150 280 130 310Z" fill="#B58A5B" fillOpacity="0.04" />
      <path d="M230 460 C180 440 160 410 170 380 C190 390 200 420 180 450Z" fill="#B58A5B" fillOpacity="0.04" />
    </svg>
  );
}

// Fallback articles matching reference design
const DEFAULT_RELATED = [
  {
    id: "rel-1",
    slug: "timeless-elegance-pashmina",
    title: "The Timeless Elegance of Pashmina",
    publishedAt: "2025-05-10",
    featuredImage: "/storefront/hero-1.png",
  },
  {
    id: "rel-2",
    slug: "why-handwoven-pashmina-worth-it",
    title: "Why Handwoven Pashmina is Worth It",
    publishedAt: "2025-04-28",
    featuredImage: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124716/zaevyul/storefront/prod-2.jpg",
  },
  {
    id: "rel-3",
    slug: "how-to-style-pashmina-every-season",
    title: "How to Style Pashmina for Every Season",
    publishedAt: "2025-04-15",
    featuredImage: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124717/zaevyul/storefront/prod-3.jpg",
  },
];

export default function JournalDetailPage() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchArticle = async () => {
      try {
        setLoading(true);
        setError(null);
        const [data, allPosts] = await Promise.all([
          api.blogs.getBySlug(slug).catch(() => null),
          api.blogs.publicList().catch(() => []),
        ]);
        if (cancelled) return;

        if (data) {
          setBlog(data);
        } else {
          // Fallback demo article matching the user's reference screenshot
          setBlog({
            title: "Caring for Your Pashmina: Tips to Keep It Timeless",
            category: "Care Guide",
            publishedAt: "2025-05-10",
            readTime: "5 min read",
            featuredImage: "/storefront/hero-1.png",
            content: `
              <p class="lead font-light text-[15.5px] leading-[1.8] text-[#3D3833] mb-6">
                Pashmina is more than just a fabric—it's a legacy of craftsmanship, tradition, and timeless beauty. With the right care, your pashmina pieces can stay as elegant and soft as the day you brought them home.
              </p>
              <h2 class="font-serif text-[22px] font-normal text-[#1C1916] mt-8 mb-3">1. Store It with Care</h2>
              <p class="font-light text-[14.5px] leading-[1.8] text-[#554F47] mb-6">
                Always fold your pashmina and store it in a muslin cloth or breathable cotton bag. Avoid plastic covers as they can trap moisture and lead to damage.
              </p>
              <hr className="border-t border-[#ECE7E1] my-8" />
              <h2 class="font-serif text-[22px] font-normal text-[#1C1916] mt-8 mb-3">2. Gentle Cleaning is Key</h2>
              <p class="font-light text-[14.5px] leading-[1.8] text-[#554F47] mb-6">
                We recommend dry cleaning for best results. If hand washing, use cold water and a mild shampoo specifically for wool or delicate fabrics. Do not wring or twist.
              </p>
            `,
          });
        }

        const related = (allPosts || [])
          .filter(
            (b) =>
              (b.slug || b.id || b._id) !== (data?.slug || data?.id || data?._id || slug),
          )
          .sort(
            (a, b) =>
              new Date(b.publishedAt || b.createdAt || 0) -
              new Date(a.publishedAt || a.createdAt || 0),
          )
          .slice(0, 3);

        setRelatedPosts(related.length > 0 ? related : DEFAULT_RELATED);
      } catch (err) {
        if (cancelled) return;
        console.error("Error fetching article:", err);
        setRelatedPosts(DEFAULT_RELATED);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchArticle();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const formatDate = (dateVal) => {
    if (!dateVal) return "May 10, 2025";
    return new Date(dateVal).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const toast = useToast();

  const getBlogImage = (b, fallback = "/storefront/hero-1.png") => {
    if (!b) return fallback;
    const src =
      b.featuredImage ||
      b.image ||
      (b.bannerImage && typeof b.bannerImage === "string" ? b.bannerImage : b.bannerImage?.url) ||
      (b.mainImage && typeof b.mainImage === "string" ? b.mainImage : b.mainImage?.url);

    if (src && typeof src === "string" && src.trim() !== "" && !src.includes("undefined")) {
      return src;
    }
    return fallback;
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleShareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      "_blank",
      "width=600,height=450"
    );
  };

  const handleSharePinterest = () => {
    const imgUrl = getBlogImage(blog, "/storefront/hero-1.png");
    const fullImg = imgUrl.startsWith("http") ? imgUrl : `${window.location.origin}${imgUrl}`;
    window.open(
      `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&media=${encodeURIComponent(fullImg)}&description=${encodeURIComponent(blog?.title || "")}`,
      "_blank",
      "width=750,height=550"
    );
  };

  const handleShareTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(blog?.title || "")}`,
      "_blank",
      "width=600,height=400"
    );
  };

  const handleShareCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast("Article link copied to clipboard!", "success");
    } catch {
      window.location.href = `mailto:?subject=${encodeURIComponent(blog?.title || "")}&body=${encodeURIComponent(shareUrl)}`;
    }
  };

  return (
    <div className="relative min-h-screen bg-[#FAF8F5] text-[#1C1916] font-sans pt-[68px] overflow-hidden">
      <Navbar />

      {/* Botanical Background Sketch Artwork */}
      <BotanicalWatermark />

      {/* Main Page Container */}
      <div className="relative z-10 mx-auto max-w-[1280px] px-6 sm:px-10 lg:px-16 pt-7 pb-20">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 font-sans text-[11.5px] text-[#8A857E] mb-8">
          <Link to="/" className="hover:text-[#1C1916] transition-colors">
            Home
          </Link>
          <span className="text-[#C5BFAF]">&rsaquo;</span>
          <Link
            to="/journal"
            className="hover:text-[#1C1916] transition-colors"
          >
            Journal
          </Link>
          <span className="text-[#C5BFAF]">&rsaquo;</span>
          <span className="text-[#554F47] font-normal truncate max-w-[280px]">
            {blog?.title || "Caring for Your Pashmina"}
          </span>
        </nav>

        {loading ? (
          <div className="flex justify-center items-center py-32">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#B58A5B] border-t-transparent" />
          </div>
        ) : (
          <main className="flex flex-col lg:grid lg:grid-cols-[280px_1fr] gap-10 lg:gap-14 items-start">
            {/* Left Sidebar (Renders below article on mobile via order-2) */}
            <aside className="order-2 lg:order-1 space-y-6 w-full">
              {/* Back button */}
              <Link
                to="/journal"
                className="inline-flex items-center gap-2 text-[12px] font-medium text-[#1C1916] hover:text-[#B58A5B] transition-colors group mb-2"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                <span>Back to Journal</span>
              </Link>

              {/* Related Posts Heading */}
              <h3 className="font-serif text-[20px] font-normal text-[#1C1916] pt-1">
                Related Posts
              </h3>

              {/* Related Cards List */}
              <div className="space-y-3.5">
                {relatedPosts.map((post, idx) => {
                  const key = post.slug || post.id || post._id;
                  const fallbackList = [
                    "/storefront/hero-1.png",
                    "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124715/zaevyul/storefront/prod-1.jpg",
                    "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124716/zaevyul/storefront/prod-2.jpg",
                    "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124717/zaevyul/storefront/prod-3.jpg"
                  ];
                  const img = getBlogImage(post, fallbackList[idx % fallbackList.length]);

                  return (
                    <Link
                      key={key}
                      to={`/journal/${post.slug || key}`}
                      className="group flex items-center gap-3.5 rounded-[4px] border border-[#E6DED4]/80 bg-white p-3 shadow-xs hover:border-[#B58A5B] transition-all duration-200"
                    >
                      <img
                        src={img}
                        alt={post.title}
                        onError={(e) => {
                          e.currentTarget.src = fallbackList[idx % fallbackList.length];
                        }}
                        className="w-16 h-16 object-cover rounded-[3px] shrink-0 bg-[#EFE9E1]"
                      />
                      <div className="flex-1 min-w-0 pr-1">
                        <h4 className="font-serif text-[13.5px] leading-snug font-normal text-[#1C1916] group-hover:text-[#B58A5B] transition-colors line-clamp-2">
                          {post.title}
                        </h4>
                        <p className="font-sans text-[10.5px] text-[#8A857E] mt-1.5 font-light">
                          {formatDate(post.publishedAt || post.createdAt)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* View All Articles Button */}
              <Link
                to="/journal"
                className="block w-full text-center rounded-[2px] border border-[#E6DED4] bg-[#FAF8F5] hover:bg-[#1C1916] hover:text-white text-[#1C1916] py-3 text-[10px] font-semibold tracking-[0.16em] uppercase transition-colors duration-200 cursor-pointer shadow-xs mt-4"
              >
                View All Articles
              </Link>
            </aside>

            {/* Right Main Article (Renders first on mobile via order-1) */}
            <article className="order-1 lg:order-2 max-w-[820px] w-full">
              {/* Category tag */}
              <div className="mb-2">
                <span className="inline-flex items-center gap-1 font-sans text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#B58A5B]">
                  {blog.category || "CARE GUIDE"}
                  <ChevronRight size={11} className="text-[#B58A5B]/70" />
                </span>
              </div>

              {/* Article Main Heading */}
              <h1 className="font-serif text-[32px] sm:text-[38px] lg:text-[42px] font-normal leading-[1.18] text-[#1C1916] mb-5">
                {blog.title}
              </h1>

              {/* Meta Bar & Share Icons */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-y border-[#ECE7E1] py-3.5 mb-7">
                {/* Meta details */}
                <div className="flex items-center gap-3 font-sans text-[12px] text-[#6B6560]">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-[#8A857E]" />
                    <span>{formatDate(blog.publishedAt || blog.createdAt)}</span>
                  </div>
                  <span className="text-[#D8CFC2]">|</span>
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-[#8A857E]" />
                    <span>{blog.readTime || "5 min read"}</span>
                  </div>
                </div>

                {/* Share icons */}
                <div className="flex items-center gap-2 text-[12px] text-[#6B6560]">
                  <span className="font-sans text-[11.5px] text-[#8A857E] mr-1">
                    Share:
                  </span>
                  <button
                    onClick={handleShareFacebook}
                    aria-label="Share on Facebook"
                    title="Share on Facebook"
                    className="w-7.5 h-7.5 rounded-full border border-[#E6DED4] bg-white flex items-center justify-center text-[#1C1916] hover:bg-[#1C1916] hover:text-white hover:border-[#1C1916] transition-all duration-200 cursor-pointer shadow-2xs group"
                  >
                    <FacebookIcon size={12} className="transition-transform group-hover:scale-110" />
                  </button>
                  <button
                    onClick={handleSharePinterest}
                    aria-label="Share on Pinterest"
                    title="Share on Pinterest"
                    className="w-7.5 h-7.5 rounded-full border border-[#E6DED4] bg-white flex items-center justify-center text-[#1C1916] hover:bg-[#1C1916] hover:text-white hover:border-[#1C1916] transition-all duration-200 cursor-pointer shadow-2xs group"
                  >
                    <PinterestIcon size={12} className="transition-transform group-hover:scale-110" />
                  </button>
                  <button
                    onClick={handleShareTwitter}
                    aria-label="Share on X (Twitter)"
                    title="Share on X (Twitter)"
                    className="w-7.5 h-7.5 rounded-full border border-[#E6DED4] bg-white flex items-center justify-center text-[#1C1916] hover:bg-[#1C1916] hover:text-white hover:border-[#1C1916] transition-all duration-200 cursor-pointer shadow-2xs group"
                  >
                    <TwitterIcon size={11} className="transition-transform group-hover:scale-110" />
                  </button>
                  <button
                    onClick={handleShareCopy}
                    aria-label="Copy Article Link"
                    title="Copy Article Link"
                    className="w-7.5 h-7.5 rounded-full border border-[#E6DED4] bg-white flex items-center justify-center text-[#1C1916] hover:bg-[#1C1916] hover:text-white hover:border-[#1C1916] transition-all duration-200 cursor-pointer shadow-2xs group"
                  >
                    <Mail size={12} className="transition-transform group-hover:scale-110" />
                  </button>
                </div>
              </div>

              {/* Main Banner Image */}
              <div className="mb-8 overflow-hidden rounded-[8px] border border-[#ECE7E1] shadow-xs">
                <img
                  src={getBlogImage(blog, "/storefront/hero-1.png")}
                  alt={blog.title}
                  onError={(e) => {
                    e.currentTarget.src = "/storefront/hero-1.png";
                  }}
                  className="w-full h-auto max-h-[460px] object-cover"
                />
              </div>

              {/* Article Content Body */}
              <div
                className="
                  prose prose-stone max-w-none font-sans text-[15px] leading-[1.8] text-[#3D3833]
                  prose-headings:font-serif prose-headings:font-normal prose-headings:text-[#1C1916]
                  prose-h2:text-[22px] prose-h2:mt-8 prose-h2:mb-3
                  prose-p:my-0 prose-p:mb-5 prose-p:text-[#4A453E] prose-p:font-light
                  prose-a:text-[#B58A5B] prose-a:no-underline hover:prose-a:underline
                  prose-hr:border-[#ECE7E1] prose-hr:my-8
                "
              >
                {blog.content ? (
                  <div dangerouslySetInnerHTML={{ __html: blog.content }} />
                ) : (
                  <div>
                    <p className="font-light text-[15.5px] leading-[1.8] text-[#3D3833] mb-6">
                      Pashmina is more than just a fabric—it's a legacy of craftsmanship, tradition, and timeless beauty. With the right care, your pashmina pieces can stay as elegant and soft as the day you brought them home.
                    </p>
                    <h2 className="font-serif text-[22px] font-normal text-[#1C1916] mt-8 mb-3">
                      1. Store It with Care
                    </h2>
                    <p className="font-light text-[14.5px] leading-[1.8] text-[#554F47] mb-6">
                      Always fold your pashmina and store it in a muslin cloth or breathable cotton bag. Avoid plastic covers as they can trap moisture and lead to damage.
                    </p>
                    <hr className="border-t border-[#ECE7E1] my-8" />
                    <h2 className="font-serif text-[22px] font-normal text-[#1C1916] mt-8 mb-3">
                      2. Gentle Cleaning is Key
                    </h2>
                    <p className="font-light text-[14.5px] leading-[1.8] text-[#554F47] mb-6">
                      We recommend dry cleaning for best results. If hand washing, use cold water and a mild shampoo specifically for wool or delicate fabrics. Do not wring or twist.
                    </p>
                  </div>
                )}
              </div>
            </article>
          </main>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
