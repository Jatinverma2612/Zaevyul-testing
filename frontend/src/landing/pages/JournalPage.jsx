import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronDown, ArrowRight } from "lucide-react";
import Navbar from "../components/Navbar";
import SiteFooter from "../components/SiteFooter";
import { api } from "../../lib/api";

export default function JournalPage() {
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [sortBy, setSortBy] = useState("LATEST"); // LATEST | OLDEST
  const [visibleCount, setVisibleCount] = useState(3);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [blogsData, catsData] = await Promise.all([
          api.blogs.publicList(),
          api.blogCategories.list(),
        ]);
        setBlogs(blogsData || []);
        setCategories((catsData || []).map((c) => c.name));
      } catch (err) {
        console.error("Error fetching journal data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filtered & Sorted Blogs
  const processedBlogs = useMemo(() => {
    let result = [...blogs];

    // Filter by Category
    if (activeCategory !== "ALL") {
      result = result.filter(
        (b) => b.category?.toUpperCase() === activeCategory.toUpperCase(),
      );
    }

    // Filter by Search Query
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.title?.toLowerCase().includes(q) ||
          b.excerpt?.toLowerCase().includes(q) ||
          b.category?.toLowerCase().includes(q),
      );
    }

    // Sort
    if (sortBy === "LATEST") {
      result.sort(
        (a, b) =>
          new Date(b.publishedAt || b.createdAt) -
          new Date(a.publishedAt || a.createdAt),
      );
    } else {
      result.sort(
        (a, b) =>
          new Date(a.publishedAt || a.createdAt) -
          new Date(b.publishedAt || b.createdAt),
      );
    }

    return result;
  }, [blogs, activeCategory, search, sortBy]);

  const displayedBlogs = useMemo(() => {
    return processedBlogs.slice(0, visibleCount);
  }, [processedBlogs, visibleCount]);

  const formatDateString = (dateVal) => {
    if (!dateVal) return "May 10, 2025";
    const date = new Date(dateVal);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 3);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1916] font-sans overflow-x-hidden pt-[68px]">
      <Navbar />

      {/* Hero Header Section */}
      <header
        className="relative border-b border-[#E7DED3] overflow-hidden"
        style={{ minHeight: "340px" }}
      >
        {/* Background Image */}
        <img
          src="https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124713/zaevyul/storefront/journal-hero.png"
          alt="Journal Hero"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Text Overlay */}
        <div
          className="relative z-10 mx-auto max-w-[1400px] px-6 py-16 md:px-12 lg:px-18 lg:py-24 flex flex-col items-start justify-center h-full"
          style={{ minHeight: "340px" }}
        >
          <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.24em] text-[#B58A5B]">
            JOURNAL
          </span>
          <h1 className="mt-4 font-serif text-[42px] font-light leading-[1.1] tracking-tight text-[#1C1916] sm:text-[54px] lg:text-[62px]">
            Stories of Heritage,
            <br />
            Craft & Culture
          </h1>
          <div className="my-6 h-[1px] w-12 bg-[#1C1916]/40" />
          <p className="font-sans text-[14px] leading-relaxed text-[#1C1916]/70 max-w-[420px]">
            Thoughts, traditions and timeless tales from the world of Pashmina.
          </p>
        </div>
      </header>

      {/* Filter, Search & Sort Section */}
      <section className="border-b border-[#E7DED3] bg-[#FAF8F5] sticky top-[68px] z-40 backdrop-blur-md bg-opacity-95">
        <div className="mx-auto max-w-[1400px] px-6 py-4 md:px-12 lg:px-18 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {["ALL", ...categories].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setVisibleCount(3);
                }}
                className={`cursor-pointer whitespace-nowrap px-2 py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors duration-200 ${
                  activeCategory === cat
                    ? "text-[#1C1916]"
                    : "text-[#1C1916]/60 hover:text-[#1C1916]"
                }`}
                style={
                  activeCategory === cat
                    ? {
                        textDecoration: "underline",
                        textUnderlineOffset: "5px",
                        textDecorationColor: "#1C1916",
                        textDecorationThickness: "1px",
                      }
                    : { textDecoration: "none" }
                }
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search & Sort Controls */}
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-[220px]">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setVisibleCount(3);
                }}
                placeholder="Search articles..."
                className="w-full rounded-[2px] border border-[#E7DED3] bg-white px-3 py-1.5 pl-8 font-sans text-[11px] text-[#1C1916] placeholder-[#1C1916]/40 focus:border-[#B58A5B] focus:outline-none"
              />
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#1C1916]/40"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                className="flex items-center gap-1.5 rounded-[2px] border border-[#E7DED3] bg-white px-4 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1C1916] focus:outline-none"
              >
                <span>{sortBy}</span>
                <ChevronDown size={12} className="text-[#1C1916]/60" />
              </button>

              {sortDropdownOpen && (
                <div className="absolute right-0 mt-1 w-[120px] rounded-[2px] border border-[#E7DED3] bg-white py-1 shadow-md z-50">
                  <button
                    onClick={() => {
                      setSortBy("LATEST");
                      setSortDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1C1916] hover:bg-[#FAF8F5]"
                  >
                    LATEST
                  </button>
                  <button
                    onClick={() => {
                      setSortBy("OLDEST");
                      setSortDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1C1916] hover:bg-[#FAF8F5]"
                  >
                    OLDEST
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Grid of Articles */}
      <main className="mx-auto max-w-[1400px] px-6 py-12 md:px-12 lg:px-18 md:py-16">
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#B58A5B] border-t-transparent" />
          </div>
        ) : displayedBlogs.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-[#E7DED3] rounded-[2px] bg-white">
            <p className="font-serif text-[18px] text-[#1C1916]/70">
              No articles found
            </p>
            <p className="font-sans text-[12px] text-[#1C1916]/40 mt-1">
              Try modifying your category filters or search queries.
            </p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
              {displayedBlogs.map((blog) => (
                <Link
                  key={blog._id || blog.id}
                  to={`/journal/${blog.slug || blog._id || blog.id}`}
                  className="group flex flex-col overflow-hidden bg-white border border-[#E7DED3] rounded-[2px] hover:shadow-md transition-all duration-300"
                >
                  {/* Card Image */}
                  <div className="relative aspect-[3/2] w-full overflow-hidden bg-[#FAF8F5] border-b border-[#E7DED3]">
                    <img
                      src={
                        blog.featuredImage ||
                        blog.mainImage?.url ||
                        "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124719/zaevyul/storefront/story-bg.jpg"
                      }
                      alt={blog.title}
                      className="h-full w-full font-bold object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  </div>

                  {/* Card Content */}
                  <div className="flex flex-1 flex-col p-6">
                    {/* Category Label */}
                    <span className="font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-[#B58A5B]">
                      {blog.category || "General"}
                    </span>

                    {/* Title */}
                    <h2 className="mt-3 font-serif text-[24px] font-medium leading-snug tracking-tight text-[#1C1916] transition-colors duration-200 group-hover:text-[#B58A5B]">
                      {blog.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="mt-3 font-sans text-[12px] leading-relaxed text-[#1C1916]/70 line-clamp-3">
                      {blog.excerpt}
                    </p>

                    {/* Footer Row */}
                    <div className="mt-auto pt-6 flex items-center justify-between border-t border-[#FAF8F5]">
                      <span className="font-sans text-[11px] text-[#1C1916]/80">
                        {formatDateString(blog.publishedAt || blog.createdAt)}{" "}
                        &nbsp;·&nbsp; {blog.readTime || "5 min read"}
                      </span>
                      <ArrowRight
                        size={13}
                        className="text-[#1C1916]/50 group-hover:text-[#B58A5B] transition-colors duration-200 group-hover:translate-x-1 transition-transform"
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Load More Button */}
            {processedBlogs.length > visibleCount && (
              <div className="mt-16 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  className="flex items-center gap-2 border border-[#E7DED3] bg-white px-8 py-3.5 font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-[#1C1916] transition-all duration-200 hover:border-[#1C1916] hover:bg-[#1C1916] hover:text-[#FAF8F5]"
                >
                  <span>Load More Articles</span>
                  <ChevronDown size={12} />
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
