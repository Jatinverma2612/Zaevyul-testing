/**
 * Utility to update page meta tags, OpenGraph tags, canonical link, and JSON-LD structured data for SEO.
 * Reads admin-defined SEO fields from DB first (product.seo / categoryObj.seo), falling back to generated defaults.
 */

function updateMetaTag(name, content, attrName = "name") {
  if (!content) return;
  let element = document.querySelector(`meta[${attrName}="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attrName, name);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function updateCanonicalLink(url) {
  if (!url) return;
  let element = document.querySelector(`link[rel="canonical"]`);
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }
  element.setAttribute("href", url);
}

function injectJsonLd(id, data) {
  let element = document.getElementById(id);
  if (!element) {
    element = document.createElement("script");
    element.id = id;
    element.type = "application/ld+json";
    document.head.appendChild(element);
  }
  element.textContent = JSON.stringify(data, null, 2);
}

function removeJsonLd(id) {
  const element = document.getElementById(id);
  if (element) {
    element.remove();
  }
}

export function updateProductSEO(product, currentUrl) {
  if (!product) return;

  const dbSeo = product.seo || {};

  // 1. Page Title: Prioritize admin DB entry
  const pageTitle =
    dbSeo.title && dbSeo.title.trim() !== ""
      ? dbSeo.title.trim()
      : `${product.name} | Handcrafted Kashmiri Pashmina | Zaevyul`;

  document.title = pageTitle;

  // 2. Meta Description: Prioritize admin DB entry
  const description =
    dbSeo.description && dbSeo.description.trim() !== ""
      ? dbSeo.description.trim()
      : product.description ||
        product.shortDescription ||
        `Discover ${product.name} by Zaevyul. Handcrafted Kashmiri Pashmina made with traditional artisan heritage, luxury softness, and timeless elegance.`;

  // 3. Keywords: Prioritize admin DB entry
  const keywords =
    dbSeo.keywords && dbSeo.keywords.trim() !== ""
      ? dbSeo.keywords.trim()
      : `${product.name}, Pashmina, Kashmiri Shawls, Stoles, Zaevyul, Luxury Craft`;

  // 4. Canonical URL: Prioritize admin DB entry
  const mainImage =
    product.img ||
    (product.images && product.images[0]?.url) ||
    `${window.location.origin}https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124715/zaevyul/storefront/prod-1.jpg`;

  let fullUrl = currentUrl || window.location.href;
  if (dbSeo.url && dbSeo.url.trim() !== "") {
    const rawUrl = dbSeo.url.trim();
    fullUrl = rawUrl.startsWith("http")
      ? rawUrl
      : `${window.location.origin}/${rawUrl.replace(/^\//, "")}`;
  }

  // Standard Meta Tags
  updateMetaTag("description", description.slice(0, 160));
  updateMetaTag("keywords", keywords);

  // Open Graph / Facebook
  updateMetaTag("og:title", pageTitle, "property");
  updateMetaTag("og:description", description.slice(0, 200), "property");
  updateMetaTag("og:image", mainImage, "property");
  updateMetaTag("og:url", fullUrl, "property");
  updateMetaTag("og:type", "product", "property");

  // Twitter Card
  updateMetaTag("twitter:card", "summary_large_image");
  updateMetaTag("twitter:title", pageTitle);
  updateMetaTag("twitter:description", description.slice(0, 200));
  updateMetaTag("twitter:image", mainImage);

  // Canonical Link
  updateCanonicalLink(fullUrl);

  // JSON-LD Product Structured Data for Google Search
  const priceVal = product.discountPrice || product.basePrice || 30000;
  const inStock =
    typeof product.quantity === "number" ? product.quantity > 0 : true;

  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: pageTitle,
    image:
      product.images && product.images.length > 0
        ? product.images.map((i) => i.url || i)
        : [mainImage],
    description: description,
    sku: product._id || product.id || product.slug,
    brand: {
      "@type": "Brand",
      name: "Zaevyul",
    },
    category:
      typeof product.category === "string"
        ? product.category
        : product.category?.name || "Pashmina",
    offers: {
      "@type": "Offer",
      url: fullUrl,
      priceCurrency: "INR",
      price: priceVal,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Zaevyul Pashmina",
      },
    },
  };

  injectJsonLd("product-jsonld", productSchema);

  // JSON-LD BreadcrumbList
  const categoryName =
    typeof product.category === "string"
      ? product.category
      : product.category?.name || "Collections";
  const categorySlug =
    product.categorySlug ||
    (typeof product.category === "object"
      ? product.category.slug
      : "collections");

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${window.location.origin}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Collections",
        item: `${window.location.origin}/collections`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: categoryName,
        item: `${window.location.origin}/collections/${categorySlug}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: product.name,
        item: fullUrl,
      },
    ],
  };

  injectJsonLd("breadcrumb-jsonld", breadcrumbSchema);
}

export function updateCategorySEO(categoryObj, categorySlug, currentUrl) {
  const dbSeo = categoryObj?.seo || {};

  const categoryName =
    categoryObj?.name ||
    (categorySlug ? categorySlug.replace(/-/g, " ") : "All Collections");
  const formattedName =
    categoryName.charAt(0).toUpperCase() + categoryName.slice(1);

  // 1. Page Title: Prioritize admin DB entry
  const pageTitle =
    dbSeo.title && dbSeo.title.trim() !== ""
      ? dbSeo.title.trim()
      : `${formattedName} Collection | Authentic Kashmiri Pashmina | Zaevyul`;

  document.title = pageTitle;

  // 2. Meta Description: Prioritize admin DB entry
  const description =
    dbSeo.description && dbSeo.description.trim() !== ""
      ? dbSeo.description.trim()
      : categoryObj?.description ||
        `Explore the ${formattedName} collection at Zaevyul. Discover luxury hand-spun and hand-woven Kashmiri Pashmina shawls, stoles, and heritage apparel.`;

  // 3. Keywords: Prioritize admin DB entry
  const keywords =
    dbSeo.keywords && dbSeo.keywords.trim() !== ""
      ? dbSeo.keywords.trim()
      : `${formattedName}, Kashmiri Pashmina, Zaevyul Collections, Luxury Shawls, Handwoven`;

  // 4. Canonical URL: Prioritize admin DB entry
  let fullUrl = currentUrl || window.location.href;
  if (dbSeo.url && dbSeo.url.trim() !== "") {
    const rawUrl = dbSeo.url.trim();
    fullUrl = rawUrl.startsWith("http")
      ? rawUrl
      : `${window.location.origin}/${rawUrl.replace(/^\//, "")}`;
  }

  // Standard Meta Tags
  updateMetaTag("description", description.slice(0, 160));
  updateMetaTag("keywords", keywords);

  // Open Graph
  updateMetaTag("og:title", pageTitle, "property");
  updateMetaTag("og:description", description.slice(0, 200), "property");
  updateMetaTag("og:url", fullUrl, "property");
  updateMetaTag("og:type", "website", "property");

  // Twitter Card
  updateMetaTag("twitter:card", "summary");
  updateMetaTag("twitter:title", pageTitle);
  updateMetaTag("twitter:description", description.slice(0, 200));

  // Canonical Link
  updateCanonicalLink(fullUrl);

  // JSON-LD Collection Schema
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: pageTitle,
    description: description,
    url: fullUrl,
    publisher: {
      "@type": "Organization",
      name: "Zaevyul Pashmina",
    },
  };

  injectJsonLd("category-jsonld", collectionSchema);
}

export function resetSEO() {
  document.title = "Zaevyul Pashmina";
  removeJsonLd("product-jsonld");
  removeJsonLd("breadcrumb-jsonld");
  removeJsonLd("category-jsonld");
}
