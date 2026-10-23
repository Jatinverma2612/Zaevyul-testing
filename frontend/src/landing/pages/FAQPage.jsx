import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Truck,
  ShieldCheck,
  RotateCcw,
  CreditCard,
  HelpCircle,
  Headphones,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
} from "lucide-react";
import Navbar from "../components/Navbar";
import SiteFooter from "../components/SiteFooter";

const FAQ_CATEGORIES = [
  {
    id: "orders-shipping",
    label: "ORDERS & SHIPPING",
    icon: Truck,
  },
  {
    id: "product-care",
    label: "PRODUCT & CARE",
    icon: ShieldCheck,
  },
  {
    id: "returns-exchanges",
    label: "RETURNS & EXCHANGES",
    icon: RotateCcw,
  },
  {
    id: "payments",
    label: "PAYMENTS",
    icon: CreditCard,
  },
  {
    id: "general",
    label: "GENERAL",
    icon: HelpCircle,
  },
];

const FAQ_DATA = {
  "orders-shipping": [
    {
      q: "How long does it take to process my order?",
      a: "Orders are typically processed within 1–2 business days. Once dispatched, delivery time depends on your location (3–5 business days within India, 5–8 business days internationally). You will receive a confirmation email with tracking details as soon as your order is shipped.",
    },
    {
      q: "What are the shipping charges?",
      a: "We offer complimentary express shipping on all orders across India. For international orders, shipping charges are calculated at checkout based on your destination country and package weight.",
    },
    {
      q: "Do you offer international shipping?",
      a: "Yes, Zaevyul ships worldwide to over 120 countries via express courier partners like DHL and FedEx. All international shipments include end-to-end tracking and transit insurance.",
    },
    {
      q: "How can I track my order?",
      a: "You can track your order live using our Track Order page on the website or by clicking the tracking link included in your dispatch confirmation email.",
    },
    {
      q: "Can I modify or cancel my order after placing it?",
      a: "We process orders rapidly to ensure prompt delivery. If you need to make changes or cancel, please contact us within 2 hours of placing your order at hello@zaevyul.com or via WhatsApp.",
    },
    {
      q: "Will I have to pay import duties or customs charges?",
      a: "For domestic orders within India, all taxes (including 18% GST) are included. For international shipments, local customs duties or import taxes may apply depending on your country's regulations and are paid directly to the courier upon delivery.",
    },
    {
      q: "What happens if my package is delayed or lost in transit?",
      a: "All Zaevyul shipments are fully insured against transit loss or damage. If your shipment experiences an unusual delay, our customer support team will actively coordinate with the carrier to resolve it or dispatch an immediate replacement.",
    },
    {
      q: "Do you offer gift wrapping and personalized notes?",
      a: "Yes! Every Zaevyul piece is delivered in our signature gift box. You can also request a complimentary hand-written gift message at checkout under the order notes section.",
    },
    {
      q: "Can I ship to a PO Box address?",
      a: "Because our shipments require a physical signature upon delivery for security, we recommend providing a residential or business address rather than a PO Box.",
    },
  ],

  "product-care": [
    {
      q: "Are your products 100% authentic Kashmir Pashmina?",
      a: "Yes. Every Zaevyul shawl and stole is crafted from 100% pure Ladakhi Pashmina wool sourced from Changthangi goats, hand-spun and hand-woven by master artisans in Kashmir. Each piece carries an authenticity certificate.",
    },
    {
      q: "How do I care for and wash my pashmina?",
      a: "We strongly recommend professional dry cleaning to preserve the delicate fibers. For gentle home care, hand wash carefully in lukewarm water using a mild wool detergent, never wring, and lay flat to dry in shade.",
    },
    {
      q: "How do I store my Pashmina during off-seasons?",
      a: "Store your clean Pashmina in a breathable cotton or linen bag in a cool, dry place. Avoid sealed plastic bags, and place natural cedarwood blocks or lavender sachets inside to prevent moth damage.",
    },
    {
      q: "What is the difference between Pashmina and Kashmiri?",
      a: "Pashmina is a premium grade of fine Kashmiri produced exclusively by the Capra Hircus goats living at altitudes over 14,000 feet in Ladakh. Pashmina fibers are finer (12–15 microns) and warmer than standard commercial Kashmiri.",
    },
    {
      q: "What are the dimensions of your shawls, stoles, and scarves?",
      a: 'Our standard sizes are: Shawls (100 cm x 200 cm / 40" x 80"), Stoles (70 cm x 200 cm / 28" x 80"), and Scarves (35 cm x 180 cm / 14" x 70"). Handcrafted dimensions may vary slightly by 1–2 cm.',
    },
    {
      q: "What is Sozni Embroidery and Kani Weaving?",
      a: "Sozni is an intricate needle embroidery unique to Kashmir executed with fine silk threads. Kani weaving uses small wooden bobbins (kanis) to weave elaborate floral patterns directly into the fabric on traditional wooden looms.",
    },
    {
      q: "Does Pashmina pill or shed fibers?",
      a: "Pure hand-spun Pashmina contains natural fine fibers that may experience minor pilling initially due to friction. Pilling can be gently removed using a garment comb and decreases naturally with wear.",
    },
    {
      q: "Why is hand-woven Pashmina light or semi-sheer?",
      a: "Pure Pashmina fibers are incredibly fine and light yet possess remarkable thermal insulation properties. A true Pashmina shawl provides extreme warmth without being heavy or bulky.",
    },
    {
      q: "How can I test the purity of my Pashmina at home?",
      a: "Pure Pashmina passes the ring test (slides smoothly through a finger ring), has a subtle natural sheen without synthetic gloss, and produces an organic burnt hair smell if a loose thread fringe is burned.",
    },
  ],

  "returns-exchanges": [
    {
      q: "What is your return policy?",
      a: "We accept returns within 14 days of delivery for all unused, unwashed items in original condition with tags and gift packaging intact. Once inspected, refunds are processed to your original payment method.",
    },
    {
      q: "Can I exchange my order?",
      a: "Yes! Exchanges can be requested for any available product or color. Once we receive your returned item, your new selected piece will be dispatched immediately.",
    },
    {
      q: "How do I initiate a return or exchange?",
      a: "You can initiate a return directly from your account page under My Orders, or by emailing our team at returns@zaevyul.com with your order number and reason for return.",
    },
    {
      q: "Are return shipping fees covered by Zaevyul?",
      a: "We offer complimentary return pickup within India for eligible returns. For international returns, shipping costs and customs duties are the responsibility of the customer.",
    },
    {
      q: "How long does it take to receive my refund?",
      a: "Refunds are initiated within 48 hours after our quality team approves the returned item. Credit card and bank transfers typically reflect within 5–7 business days.",
    },
    {
      q: "Are customized or monogrammed items returnable?",
      a: "Items that have been personalized with custom embroidery, monograms, or bespoke sizing cannot be returned or exchanged unless there is a manufacturing defect.",
    },
    {
      q: "What if I receive a damaged or defective item?",
      a: "We inspect every piece carefully prior to dispatch. However, if you receive a damaged package or item, please notify us within 48 hours with photos for an immediate replacement or full refund.",
    },
    {
      q: "Can I return an item purchased during a sale or promotion?",
      a: "Standard sale items are eligible for exchange or store credit. Final clearance archive items marked non-returnable are non-refundable.",
    },
    {
      q: "Can I receive store credit instead of a bank refund?",
      a: "Yes, you can opt for Zaevyul Store Credit, which never expires and includes a bonus 5% promotional credit on your next purchase.",
    },
  ],

  payments: [
    {
      q: "What payment methods do you accept?",
      a: "We accept all major domestic and international credit/debit cards (Visa, MasterCard, American Express), Net Banking, UPI (GPay, PhonePe, Paytm), Razorpay, Apple Pay, and Cash on Delivery (COD) within India.",
    },
    {
      q: "Is Cash on Delivery (COD) available for my location?",
      a: "Cash on Delivery is available for orders up to ₹50,000 across 18,000+ pin codes in India. COD orders require OTP verification prior to dispatch.",
    },
    {
      q: "Is my payment information secure on your website?",
      a: "Yes. All transactions are processed through 256-bit SSL encryption certified by PCI-DSS Level 1 compliant payment gateways. We never store or log your card details on our servers.",
    },
    {
      q: "Can I pay in my local currency?",
      a: "Yes! You can use our top-bar Currency Selector to view prices and pay in INR, USD, EUR, GBP, AED, CAD, and AUD.",
    },
    {
      q: "Why was my payment declined at checkout?",
      a: "Payment declines may happen due to incorrect card details, insufficient funds, or international transaction restrictions imposed by your bank. Please verify details or try an alternate card or UPI.",
    },
    {
      q: "Do you issue a tax invoice for business purchases?",
      a: "Yes. A tax invoice with itemized 18% GST breakdown is automatically generated and emailed to you upon order completion. You can also download it from the My Account dashboard.",
    },
    {
      q: "Can I apply a promotional code or gift voucher to my order?",
      a: "Yes. Enter your coupon code or voucher string in the Promo Code field at checkout and click Apply to update your order total.",
    },
    {
      q: "What should I do if money was deducted but my order failed?",
      a: "If an amount was debited for an incomplete order, your bank will automatically reverse the transaction within 3–5 business days. You can also email support@zaevyul.com with payment reference numbers for verification.",
    },
    {
      q: "Do you offer installment payments or EMI options?",
      a: "Yes, No-Cost and Low-Cost EMI options are available for major Indian credit cards at checkout via Razorpay.",
    },
  ],

  general: [
    {
      q: "Where is Zaevyul located?",
      a: "Our brand headquarters and artisan workshops are based in Kashmir and New Delhi, India. We operate exclusively online with global shipping to serve patrons worldwide.",
    },
    {
      q: "Are Zaevyul products ethically sourced and cruelty-free?",
      a: "Yes. Pashmina wool is collected naturally by combing the goats' undercoat during spring shedding, causing zero harm to the animals. We practice fair-trade principles and directly support Kashmiri artisan families.",
    },
    {
      q: "Do you offer corporate or bulk gifting services?",
      a: "Yes! We create bespoke corporate gifts with custom luxury packaging, embossed logo boxes, and personalized notes for corporate events. Contact corporate@zaevyul.com for inquiries.",
    },
    {
      q: "Can I visit a physical store to see the collection?",
      a: "Zaevyul is a digital-first luxury house. We occasionally host private pop-up exhibitions and trunk shows in major cities. Subscribe to our newsletter to receive invitations.",
    },
    {
      q: "How can I subscribe to news and exclusive collection launches?",
      a: "Enter your email address in the newsletter signup box at the footer of any page to receive early access to new releases and private sales.",
    },
    {
      q: "How do I contact customer support?",
      a: "You can reach us via email at hello@zaevyul.com, call/WhatsApp at +91 98765 43210, or fill out the Contact Us form. Our concierge team is available Monday–Saturday (10 AM – 7 PM IST).",
    },
    {
      q: "Do you offer bespoke or custom Pashmina orders?",
      a: "Yes, we accept custom requests for specific colors, hand-embroidered monograms, or custom dimensions. Contact our concierge team to discuss your bespoke order.",
    },
    {
      q: "How do I know which Pashmina size is best for me?",
      a: "Shawls (100x200 cm) provide full body wrapping, Stoles (70x200 cm) offer versatile shoulder draping, and Scarves (35x180 cm) are ideal for neck accenting and daily wear.",
    },
    {
      q: "Can I buy a digital gift card for someone else?",
      a: "Yes! Digital gift cards are available in amounts from ₹5,000 to ₹1,000,000 and are delivered directly to the recipient's email address with instructions for online redemption.",
    },
  ],
};

export default function FAQPage() {
  const [searchParams] = useSearchParams();
  const catParam = searchParams.get("category");
  const [activeCategory, setActiveCategory] = useState(
    catParam && FAQ_DATA[catParam] ? catParam : "orders-shipping",
  );
  const [openIndex, setOpenIndex] = useState(0); // First item open by default like reference image

  useEffect(() => {
    if (catParam && FAQ_DATA[catParam]) {
      setActiveCategory(catParam);
    }
  }, [catParam]);

  const currentQuestions = FAQ_DATA[activeCategory] || [];

  const toggleAccordion = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="bg-[#FAF8F5] text-[#1C1916] font-sans min-h-screen">
      <Navbar />

      <main className="pt-17 pb-30">
        {/* 1. Header Banner with Full-Bleed Luxury Pashmina Photography */}
        <section className="relative w-full bg-[#FAF8F5] border-b border-[#ECE7E1] overflow-hidden min-h-[280px] sm:min-h-[380px] lg:min-h-[480px] flex items-center">
          {/* Full-height background image filling the right side without gap or haze */}
          <div className="absolute inset-0 z-0 flex justify-end">
            <div className="relative w-full hidden md:block sm:w-[68%] lg:w-[62%] h-full">
              <img
                src="https://res.cloudinary.com/dfkkjncxc/image/upload/v1787124707/zaevyul/storefront/cat-embroidered.jpg"
                alt="Kashmiri Pashmina Embroidery Header"
                className="w-full h-full object-cover object-center"
              />
              {/* Tight crisp edge fade on the left edge only — zero haze over the photograph */}
              <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-36 bg-gradient-to-r from-[#FAF8F5] to-transparent pointer-events-none" />
            </div>
          </div>

          <div className="relative z-10 mx-auto max-w-[1720px] 2xl:max-w-[1920px] 3xl:max-w-[2200px] px-6 sm:px-10 lg:px-16 w-full py-12 sm:py-16">
            <div className="max-w-[580px]">
              <span className="font-sans text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.25em] text-[#B58A5B] block mb-3">
                FREQUENTLY ASKED
              </span>
              <h1 className="font-serif text-[42px] sm:text-[56px] lg:text-[66px] font-light text-[#1C1916] leading-[1.02] tracking-[0.04em] uppercase mb-4">
                QUESTIONS
              </h1>

              {/* Diamond Ornament Line */}
              <div className="flex items-center gap-3 my-5">
                <div className="h-[1px] w-12 bg-[#B58A5B]/40" />
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="7"
                    y="1"
                    width="2"
                    height="2"
                    transform="rotate(45 7 1)"
                    fill="#B58A5B"
                  />
                  <rect
                    x="2"
                    y="6"
                    width="2"
                    height="2"
                    transform="rotate(45 2 6)"
                    fill="#B58A5B"
                  />
                  <rect
                    x="12"
                    y="6"
                    width="2"
                    height="2"
                    transform="rotate(45 12 6)"
                    fill="#B58A5B"
                  />
                  <rect
                    x="7"
                    y="11"
                    width="2"
                    height="2"
                    transform="rotate(45 7 11)"
                    fill="#B58A5B"
                  />
                  <rect
                    x="7"
                    y="6"
                    width="2.5"
                    height="2.5"
                    transform="rotate(45 7 6)"
                    fill="#B58A5B"
                  />
                </svg>
                <div className="h-[1px] w-28 bg-[#B58A5B]/40" />
              </div>

              <p className="font-sans text-[14px] sm:text-[15px] font-light text-[#6B6560] leading-relaxed max-w-[480px]">
                Find answers to the most common questions about our pashmina,
                orders, shipping and more.
              </p>
            </div>
          </div>
        </section>

        {/* Mobile Sticky Horizontal Category Selector Bar */}
        <div className="lg:hidden sticky top-[68px] z-30 bg-[#FAF8F5]/96 backdrop-blur-md border-b border-[#ECE7E1] px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            {FAQ_CATEGORIES.map((cat) => {
              const IconComponent = cat.icon;
              const isActive = activeCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setOpenIndex(0);
                  }}
                  className={`shrink-0 flex items-center gap-2 px-3.5 py-2.5 rounded-full transition-all text-left whitespace-nowrap ${
                    isActive
                      ? "bg-[#1C1916] text-[#B58A5B] shadow-sm font-semibold"
                      : "bg-white text-[#1C1916] border border-[#E6DED4]"
                  }`}
                >
                  <IconComponent
                    size={14}
                    strokeWidth={1.75}
                    className={isActive ? "text-[#B58A5B]" : "text-[#8A857E]"}
                  />
                  <span className="font-sans text-[10px] uppercase tracking-[0.14em]">
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Main 2-Column FAQ Layout */}
        <section className="mx-auto max-w-[1720px] 2xl:max-w-[1920px] 3xl:max-w-[2200px] px-4 sm:px-10 lg:px-16 w-full pt-6 sm:pt-16">
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] xl:grid-cols-[360px_1fr] gap-8 lg:gap-14 xl:gap-20 items-start">
            {/* Desktop Left Sidebar: Categories & Still Need Help Box (Hidden on mobile) */}
            <aside className="hidden lg:block space-y-8">
              <div>
                <h3 className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#1C1916] mb-2">
                  WHAT WOULD YOU LIKE TO KNOW?
                </h3>
                <p className="font-sans text-[13px] font-light text-[#6B6560] leading-relaxed mb-6">
                  Choose a topic or browse through our most common questions.
                </p>

                {/* Category Navigation Menu */}
                <div className="flex flex-col gap-2">
                  {FAQ_CATEGORIES.map((cat) => {
                    const IconComponent = cat.icon;
                    const isActive = activeCategory === cat.id;

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setActiveCategory(cat.id);
                          setOpenIndex(0); // Reset accordion to first item
                        }}
                        className={`w-full flex items-center justify-between px-5 py-4 rounded-[2px] transition-all duration-200 cursor-pointer text-left ${
                          isActive
                            ? "bg-[#1C1916] text-[#B58A5B] shadow-md"
                            : "bg-[#FAF8F5] hover:bg-white text-[#1C1916] border border-[#E6DED4]/80"
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <IconComponent
                            size={16}
                            strokeWidth={1.75}
                            className={
                              isActive ? "text-[#B58A5B]" : "text-[#8A857E]"
                            }
                          />
                          <span className="font-sans text-[11px] font-bold uppercase tracking-[0.16em]">
                            {cat.label}
                          </span>
                        </div>
                        <ChevronRight
                          size={14}
                          strokeWidth={1.5}
                          className={
                            isActive ? "text-[#B58A5B]" : "text-[#8A857E]"
                          }
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STILL NEED HELP Card */}
              <div className="bg-[#FAF6F0] border border-[#E6DED4] p-6 rounded-[2px] flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#1C1916] text-[#B58A5B] flex items-center justify-center shrink-0">
                    <Headphones size={18} strokeWidth={1.75} />
                  </div>
                  <div>
                    <h4 className="font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-[#1C1916]">
                      STILL NEED HELP?
                    </h4>
                    <p className="font-sans text-[12px] text-[#6B6560] font-light">
                      Our support team is here to assist you.
                    </p>
                  </div>
                </div>
                <Link
                  to="/contact"
                  className="mt-2 inline-flex items-center gap-2 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-[#B58A5B] hover:text-[#1C1916] transition-colors"
                >
                  CONTACT US →
                </Link>
              </div>
            </aside>

            {/* Right Main Accordion List */}
            <div className="space-y-4">
              {currentQuestions.map((item, idx) => {
                const isOpen = openIndex === idx;

                return (
                  <div
                    key={idx}
                    className={`bg-white border rounded-[2px] transition-all duration-300 overflow-hidden ${
                      isOpen
                        ? "border-[#B58A5B]/60 shadow-xs"
                        : "border-[#E6DED4] hover:border-[#B58A5B]/40"
                    }`}
                  >
                    {/* Accordion Question Bar */}
                    <button
                      type="button"
                      onClick={() => toggleAccordion(idx)}
                      className="w-full px-4 py-4 sm:px-6 sm:py-5 flex items-center justify-between gap-3 sm:gap-4 text-left cursor-pointer transition-colors bg-[#FAF8F5] group"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        {/* Minus / Plus Round Icon Badge with smooth rotation */}
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 transform ${
                            isOpen
                              ? "bg-[#FAF8F5] text-[#1C1916] rotate-180"
                              : "bg-[#E6DED4]/60 text-[#1C1916] group-hover:bg-[#D9C2A7] rotate-0"
                          }`}
                        >
                          {isOpen ? (
                            <Minus size={13} strokeWidth={2} />
                          ) : (
                            <Plus size={13} strokeWidth={2} />
                          )}
                        </div>

                        <h3 className="font-serif text-[16px] sm:text-[18.5px] font-normal text-[#1C1916] leading-snug">
                          {item.q}
                        </h3>
                      </div>

                      <div
                        className={`text-[#8A857E] shrink-0 ml-1.5 transition-transform duration-300 ${isOpen ? "rotate-180 text-[#B58A5B]" : "rotate-0"}`}
                      >
                        <ChevronDown size={16} strokeWidth={1.5} />
                      </div>
                    </button>

                    {/* Smooth Expand/Collapse Container using CSS Grid Height Transition */}
                    <div
                      className={`grid bg-[#FAF8F5] transition-[grid-template-rows] duration-350 ease-in-out ${
                        isOpen
                          ? "grid-rows-[1fr] bg-[#FAF8F5] opacity-100"
                          : "grid-rows-[0fr] bg-[#FAF8F5] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-4 pb-5 pt-2 sm:px-6 sm:pb-6 sm:pt-1 border-t border-[#ECE7E1]/60">
                          <p className="font-sans  text-[13px] sm:text-[14.5px] text-[#3D3833] font-light leading-[1.75] pl-0 sm:pl-12">
                            {item.a}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* STILL NEED HELP Card (Visible on Mobile only at bottom of accordion) */}
              <div className="lg:hidden mt-8 bg-[#FAF6F0] border border-[#E6DED4] p-5 rounded-[2px] flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#1C1916] text-[#B58A5B] flex items-center justify-center shrink-0">
                    <Headphones size={18} strokeWidth={1.75} />
                  </div>
                  <div>
                    <h4 className="font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-[#1C1916]">
                      STILL NEED HELP?
                    </h4>
                    <p className="font-sans text-[12px] text-[#6B6560] font-light">
                      Our support team is here to assist you.
                    </p>
                  </div>
                </div>
                <Link
                  to="/contact"
                  className="mt-2 inline-flex items-center gap-2 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-[#B58A5B] hover:text-[#1C1916] transition-colors"
                >
                  CONTACT US →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
