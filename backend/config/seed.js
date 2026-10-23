import BlogCategory from "../model/BlogCategory.js";
import Blog from "../model/Blog.js";
import Category from "../model/Category.js";
import MediaCoverage from "../model/MediaCoverage.js";

const categoriesData = [
  { name: "Heritage" },
  { name: "Craft" },
  { name: "Culture" },
  { name: "Stories" },
  { name: "Care" }
];

const productCategoriesData = [
  { name: "Shawls", slug: "shawls", description: "Handwoven Kashmiri shawls in pure Pashmina", sortOrder: 1, mainImage: { url: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124709/zaevyul/storefront/cat-shawls.jpg" } },
  { name: "Stoles", slug: "stoles", description: "Lightweight Pashmina stoles for everyday elegance", sortOrder: 2, mainImage: { url: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124710/zaevyul/storefront/cat-stoles.jpg" } },
  { name: "Scarves", slug: "scarves", description: "Fine Pashmina scarves in seasonal tones", sortOrder: 3, mainImage: { url: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124708/zaevyul/storefront/cat-scarves.jpg" } },
  { name: "Pashmina caps", slug: "pashmina-caps", description: "Warm, handcrafted Pashmina caps", sortOrder: 4, mainImage: { url: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124717/zaevyul/storefront/prod-3.jpg" } },
  { name: "Pashmina skill caps", slug: "pashmina-skill-caps", description: "Traditional handcrafted Pashmina skill caps", sortOrder: 5, mainImage: { url: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124718/zaevyul/storefront/prod-stack.jpg" } },
  { name: "British flat hats", slug: "british-flat-hats", description: "Classic British flat hats in fine wool and Pashmina", sortOrder: 6, mainImage: { url: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124712/zaevyul/storefront/hero.png" } },
  { name: "Woollen beanies", slug: "woollen-beanies", description: "Cozy knitted woollen beanies", sortOrder: 7, mainImage: { url: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124711/zaevyul/storefront/color-palette.png" } },
  { name: "Woollen caps", slug: "woollen-caps", description: "Premium woollen caps for cold seasons", sortOrder: 8, mainImage: { url: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124715/zaevyul/storefront/prod-1.jpg" } },
  { name: "Tailoring section : Jackets", slug: "jackets", description: "Tailored Kashmiri jackets with fine embroidery", sortOrder: 9, mainImage: { url: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124707/zaevyul/storefront/cat-embroidered.jpg" } },
  { name: "Coats", slug: "coats", description: "Luxurious long coats in Pashmina and fine wool blends", sortOrder: 10, mainImage: { url: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124719/zaevyul/storefront/story-bg.jpg" } },
  { name: "Male trousers", slug: "male-trousers", description: "Tailored male trousers in premium wool", sortOrder: 11, mainImage: { url: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124706/zaevyul/storefront/artisan.jpg" } },
  { name: "Male shirts", slug: "male-shirts", description: "Custom-tailored men's shirts", sortOrder: 12, mainImage: { url: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124714/zaevyul/storefront/craft-process.jpg" } },
  { name: "Kashmiri male pherans", slug: "kashmiri-male-pherans", description: "Traditional Kashmiri male pherans", sortOrder: 13, mainImage: { url: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124713/zaevyul/storefront/craft-grid-1.jpg" } },
  { name: "Kashmiri female pherans", slug: "kashmiri-female-pherans", description: "Elegant Kashmiri female pherans with Tilla embroidery", sortOrder: 14, mainImage: { url: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124716/zaevyul/storefront/craft-grid-2.jpg" } },
  { name: "Ladies dresses", slug: "ladies-dresses", description: "Designer ladies dresses and ethnic ensembles", sortOrder: 15, mainImage: { url: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124709/zaevyul/storefront/cat-shawls.jpg" } },
  { name: "Ladies shirts", slug: "ladies-shirts", description: "Tailored ladies shirts and tops", sortOrder: 16, mainImage: { url: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124710/zaevyul/storefront/cat-stoles.jpg" } },
  { name: "Kaftans", slug: "kaftans", description: "Flowing, luxurious Kaftans", sortOrder: 17, mainImage: { url: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124707/zaevyul/storefront/cat-embroidered.jpg" } },
  { name: "Abaayaa", slug: "abaayaa", description: "Modest and elegant Abaayaa collections", sortOrder: 18, mainImage: { url: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124719/zaevyul/storefront/story-bg.jpg" } },
  { name: "Ladies headscarves", slug: "ladies-headscarves", description: "Soft, lightweight ladies headscarves", sortOrder: 19, mainImage: { url: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124708/zaevyul/storefront/cat-scarves.jpg" } },
];

const blogsData = [
  {
    title: "The Timeless Legacy of Pashmina",
    slug: "the-timeless-legacy-of-pashmina",
    excerpt: "Discover the rich history of Pashmina, its royal past and how it became a symbol of timeless luxury.",
    content: "<p>Discover the rich history of Pashmina, its royal past and how it became a symbol of timeless luxury.</p>",
    status: "published",
    category: "Heritage",
    readTime: "5 min read",
    mainImage: { url: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124719/zaevyul/storefront/story-bg.jpg" },
    featuredImage: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124719/zaevyul/storefront/story-bg.jpg",
    publishedAt: new Date("2025-05-10")
  },
  {
    title: "The Art of Handwoven Pashmina",
    slug: "the-art-of-handwoven-pashmina",
    excerpt: "Every weave tells a story. Explore the intricate process and the skilled hands behind every Zaevyul piece.",
    content: "<p>Every weave tells a story. Explore the intricate process and the skilled hands behind every Zaevyul piece.</p>",
    status: "published",
    category: "Craft",
    readTime: "6 min read",
    mainImage: { url: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124706/zaevyul/storefront/artisan.jpg" },
    featuredImage: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124706/zaevyul/storefront/artisan.jpg",
    publishedAt: new Date("2025-05-05")
  },
  {
    title: "Kashmir: Where Beauty Inspires Creation",
    slug: "kashmir-where-beauty-inspires-creation",
    excerpt: "From its breathtaking landscapes to its vibrant traditions, Kashmir continues to inspire our creations.",
    content: "<p>From its breathtaking landscapes to its vibrant traditions, Kashmir continues to inspire our creations.</p>",
    status: "published",
    category: "Culture",
    readTime: "4 min read",
    mainImage: { url: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124709/zaevyul/storefront/cat-shawls.jpg" },
    featuredImage: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124709/zaevyul/storefront/cat-shawls.jpg",
    publishedAt: new Date("2025-04-28")
  },
  {
    title: "Woven with Love, Meant to be Cherished",
    slug: "woven-with-love-meant-to-be-cherished",
    excerpt: "The emotions, stories and traditions woven into every Zaevyul Pashmina piece.",
    content: "<p>The emotions, stories and traditions woven into every Zaevyul Pashmina piece.</p>",
    status: "published",
    category: "Stories",
    readTime: "4 min read",
    mainImage: { url: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124711/zaevyul/storefront/color-palette.png" },
    featuredImage: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124711/zaevyul/storefront/color-palette.png",
    publishedAt: new Date("2025-04-20")
  },
  {
    title: "Caring for Your Pashmina",
    slug: "caring-for-your-pashmina",
    excerpt: "Simple tips to keep your Pashmina soft, beautiful and timeless for generations to come.",
    content: "<p>Simple tips to keep your Pashmina soft, beautiful and timeless for generations to come.</p>",
    status: "published",
    category: "Care",
    readTime: "3 min read",
    mainImage: { url: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124718/zaevyul/storefront/prod-stack.jpg" },
    featuredImage: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124718/zaevyul/storefront/prod-stack.jpg",
    publishedAt: new Date("2025-04-15")
  },
  {
    title: "Pashmina Across the World",
    slug: "pashmina-across-the-world",
    excerpt: "From royal courts to modern wardrobes, see how Pashmina remains a global symbol of elegance.",
    content: "<p>From royal courts to modern wardrobes, see how Pashmina remains a global symbol of elegance.</p>",
    status: "published",
    category: "Heritage",
    readTime: "5 min read",
    mainImage: { url: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124712/zaevyul/storefront/hero.png" },
    featuredImage: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124712/zaevyul/storefront/hero.png",
    publishedAt: new Date("2025-04-08")
  }
];

const mediaCoveragesData = [
  {
    title: "Kashmiri women handcraft Pashmina shawls with dignity in Srinagar",
    articleUrl: "https://example.com/article",
    sourceName: "Hindustan Times",
    excerpt: "An inspiring feature highlighting how artisanal collectives in Kashmir provide sustainable livelihood and artistic dignity through traditional Pashmina spinning.",
    imageUrl: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124706/zaevyul/storefront/artisan.jpg",
    image: { url: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124706/zaevyul/storefront/artisan.jpg" },
    status: "published",
    sortOrder: 1,
    publishedAt: new Date("2025-05-12"),
  },
  {
    title: "Preserving the Pristine Craft of Paradise – Wajahat Qazi",
    articleUrl: "https://example.com/article",
    sourceName: "Wajahat Qazi",
    excerpt: "Renowned commentary on the centuries-old cultural significance of genuine Kashmir Pashmina weaving and authentic craftsmanship.",
    imageUrl: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124707/zaevyul/storefront/cat-embroidered.jpg",
    image: { url: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124707/zaevyul/storefront/cat-embroidered.jpg" },
    status: "published",
    sortOrder: 2,
    publishedAt: new Date("2025-04-26"),
  },
  {
    title: "Threading the Needle",
    articleUrl: "https://example.com/article",
    sourceName: "The Craft Chronicle",
    excerpt: "How traditional Sozni needlework and master craftspeople bridge heritage artisanal values with contemporary global luxury standards.",
    imageUrl: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124714/zaevyul/storefront/craft-process.jpg",
    image: { url: "https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124714/zaevyul/storefront/craft-process.jpg" },
    status: "published",
    sortOrder: 3,
    publishedAt: new Date("2025-03-18"),
  },
];

export const seedDatabase = async () => {
  try {
    const categoryCount = await BlogCategory.countDocuments();
    if (categoryCount === 0) {
      await BlogCategory.insertMany(categoriesData);
      console.log("Blog categories seeded successfully!");
    }

    const productCategoryCount = await Category.countDocuments();
    if (productCategoryCount === 0) {
      await Category.insertMany(productCategoriesData);
      console.log("Product categories seeded successfully!");
    }

    const blogCount = await Blog.countDocuments();
    if (blogCount === 0) {
      await Blog.insertMany(blogsData);
      console.log("Blog posts seeded successfully!");
    }

    const mediaCoverageCount = await MediaCoverage.countDocuments();
    if (mediaCoverageCount === 0) {
      await MediaCoverage.insertMany(mediaCoveragesData);
      console.log("Media coverage entries seeded successfully!");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
};

