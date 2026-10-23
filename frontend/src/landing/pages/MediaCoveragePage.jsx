import { useState, useEffect } from "react";
import { ExternalLink, Newspaper } from "lucide-react";
import Navbar from "../components/Navbar";
import SiteFooter from "../components/SiteFooter";
import { api } from "../../lib/api";

export default function MediaCoveragePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set page document title for SEO
    document.title = "Media Coverage & Press | Zaevyul Pashmina";

    const fetchMediaCoverage = async () => {
      try {
        setLoading(true);
        const data = await api.mediaCoverage.publicList();
        setItems(data || []);
      } catch (err) {
        console.error("Error fetching media coverage:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMediaCoverage();
  }, []);

  const formatDateString = (dateVal) => {
    if (!dateVal) return "";
    const date = new Date(dateVal);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatExternalUrl = (url) => {
    if (!url) return "#";
    const trimmed = url.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
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
          src="https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124719/zaevyul/storefront/story-bg.jpg"
          alt="Media Coverage Banner"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Subtle Darkening Overlay */}
        <div className="absolute inset-0 bg-[#FAF8F5]/85" />

        {/* Text Overlay */}
        <div
          className="relative z-10 mx-auto max-w-[1400px] px-6 py-16 md:px-12 lg:px-18 lg:py-24 flex flex-col items-start justify-center h-full"
          style={{ minHeight: "340px" }}
        >
          <span className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.26em] text-[#B58A5B]">
            PRESS & RECOGNITION
          </span>
          <h1 className="mt-3 font-serif text-[38px] font-light leading-[1.15] tracking-tight text-[#1C1916] sm:text-[50px] lg:text-[58px]">
            In the Media
          </h1>
          <div className="my-5 h-[1px] w-12 bg-[#B58A5B]/60" />
          <p className="font-sans text-[13.5px] leading-relaxed text-[#1C1916]/75 max-w-[500px]">
            Discover how leading publications, cultural chronicles, and journalists spotlight
            the artistry, heritage, and timeless grace of Zaevyul Pashmina.
          </p>
        </div>
      </header>

      {/* Main Grid Section */}
      <main className="mx-auto max-w-[1400px] px-6 py-12 md:px-12 lg:px-18 md:py-16">
        {loading ? (
          <div className="flex justify-center items-center py-28">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#B58A5B] border-t-transparent" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-[#E7DED3] rounded-[2px] bg-white max-w-2xl mx-auto px-6">
            <Newspaper size={36} className="mx-auto text-[#B58A5B]/70 mb-4" strokeWidth={1.5} />
            <h2 className="font-serif text-[22px] text-[#1C1916]">
              No Media Coverage Yet
            </h2>
            <p className="font-sans text-[13px] text-[#1C1916]/60 mt-2 max-w-md mx-auto">
              We are currently curating our latest press mentions and editorial features. Please check back soon.
            </p>
          </div>
        ) : (
          <div>
            <div className="mb-8 flex items-center justify-between">
              <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B6560]">
                All Features ({items.length})
              </span>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => {
                const imgSource =
                  item.imageUrl ||
                  item.image?.url ||
                  "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124706/zaevyul/storefront/artisan.jpg";

                const targetUrl = formatExternalUrl(item.articleUrl);
                const pubDate = formatDateString(item.publishedAt || item.createdAt);

                return (
                  <a
                    key={item._id || item.id}
                    href={targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col overflow-hidden bg-white border border-[#E7DED3] rounded-[2px] hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#B58A5B] focus:ring-offset-2"
                  >
                    {/* Card Image Container */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#FAF8F5] border-b border-[#E7DED3]">
                      <img
                        src={imgSource}
                        alt={item.title}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124706/zaevyul/storefront/artisan.jpg";
                        }}
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      {item.sourceName && (
                        <div className="absolute top-3 left-3 bg-[#1C1916]/85 backdrop-blur-sm text-white px-2.5 py-1 rounded-[2px] text-[9.5px] font-semibold uppercase tracking-[0.16em]">
                          {item.sourceName}
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="flex flex-1 flex-col p-6 sm:p-7">
                      {/* Publication & Date Header */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B58A5B]">
                          {item.sourceName || "PRESS"}
                        </span>
                        {pubDate && (
                          <span className="font-sans text-[11px] text-[#8A857E] font-light">
                            {pubDate}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h2 className="font-serif text-[21px] sm:text-[23px] font-medium leading-[1.3] tracking-tight text-[#1C1916] transition-colors duration-200 group-hover:text-[#B58A5B]">
                        {item.title}
                      </h2>

                      {/* Excerpt */}
                      {item.excerpt && (
                        <p className="mt-3 font-sans text-[12.5px] leading-relaxed text-[#6B6560] font-light line-clamp-3">
                          {item.excerpt}
                        </p>
                      )}

                      {/* Card Footer Link */}
                      <div className="mt-auto pt-6 flex items-center justify-between border-t border-[#F2ECE4]">
                        <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1C1916] group-hover:text-[#B58A5B] transition-colors duration-200 flex items-center gap-1.5">
                          Read Full Article
                        </span>
                        <div className="w-7 h-7 rounded-full bg-[#FAF8F5] border border-[#E7DED3] flex items-center justify-center text-[#1C1916]/70 group-hover:text-[#B58A5B] group-hover:border-[#B58A5B] transition-all duration-200">
                          <ExternalLink
                            size={12}
                            className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200"
                          />
                        </div>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
