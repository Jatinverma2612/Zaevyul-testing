import { useState, useEffect } from "react";
import { ChevronDown, Mail } from "lucide-react";
import Navbar from "../components/Navbar";
import SiteFooter from "../components/SiteFooter";
import { api } from "../../lib/api";

/* Ornamental motif divider under main title */
function OrnamentDivider({ className = "" }) {
  return (
    <div className={`flex items-center justify-center gap-3.5 ${className}`}>
      <span className="h-px w-10 sm:w-14 bg-[#D9C4B1]" />
      <div className="flex items-center justify-center">
        {/* Diamond ornament motif */}
        <svg
          width="14"
          height="14"
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
      </div>
      <span className="h-px w-10 sm:w-14 bg-[#D9C4B1]" />
    </div>
  );
}

const TERMS_SECTIONS = [
  {
    number: "01.",
    title: "ACCEPTANCE OF TERMS",
    summary:
      "By accessing this website and/or purchasing from ZAEVYUL Pashmina, you agree to be bound by these Terms and Conditions, our Privacy Policy, and any other policies referenced herein.",
    details: [
      "Welcome to ZAEVYUL Pashmina. By accessing, browsing, or placing an order on our website, you acknowledge that you have read, understood, and agreed to be legally bound by these Terms and Conditions.",
      "These terms apply to all visitors, registered users, customers, and others who access or use our services. If you do not agree with any part of these terms, you must immediately cease using our website and services.",
      "We reserve the right to modify, amend, or replace any portion of these Terms and Conditions at our sole discretion. It is your responsibility to check this page periodically for updates.",
    ],
  },
  {
    number: "02.",
    title: "PRODUCT INFORMATION",
    summary:
      "We strive to ensure that all product descriptions, images, and pricing are accurate. However, we do not warrant that product information is error-free, complete, or current.",
    details: [
      "Each ZAEVYUL piece is handcrafted by master artisans in Kashmir using authentic, pure Pashmina wool. Due to the handcrafted nature of our products, subtle variations in weave, embroidery pattern, and color tone may occur. These nuances are a hallmark of authentic artisanal craft, not defects.",
      "While we endeavour to display product colors as accurately as possible, actual shades may vary slightly depending on your personal display settings, device resolution, and studio lighting.",
      "All prices are listed in your selected currency and are inclusive or exclusive of applicable taxes as indicated at checkout. We reserve the right to correct pricing errors or update product availability without prior notice.",
    ],
  },
  {
    number: "03.",
    title: "ORDERS & PAYMENTS",
    summary:
      "All orders are subject to availability and confirmation of the order price. We reserve the right to refuse or cancel any order at our sole discretion.",
    details: [
      "Placing an order on ZAEVYUL Pashmina constitutes an offer to purchase our products. All orders are subject to stock availability, order verification, and payment authorization.",
      "We accept major credit/debit cards, net banking, UPI, and authorized digital payment gateways. Payment must be processed in full before an order is dispatched from our workshop.",
      "In the event of suspected fraudulent activity, stock unavailability, or pricing discrepancies, ZAEVYUL Pashmina reserves the right to decline or cancel any order. If your order is canceled after payment has been processed, a full refund will be issued to your original payment method.",
    ],
  },
  {
    number: "04.",
    title: "SHIPPING & DELIVERY",
    summary:
      "Delivery timelines are estimates and may vary based on location and courier delays. We are not responsible for delays caused by third-party shipping partners.",
    details: [
      "We offer worldwide shipping via insured premium courier partners. Delivery estimates range between 3–7 business days for domestic orders and 7–14 business days for international shipments.",
      "Transit times are estimates and cannot be guaranteed. Delays caused by customs clearance, weather conditions, peak holiday seasons, or local logistics disruptions are beyond our direct control.",
      "Customers are responsible for providing complete and accurate shipping addresses. Any additional re-routing fees or customs duties levied by destination authorities are the buyer's responsibility.",
    ],
  },
  {
    number: "05.",
    title: "RETURNS & EXCHANGES",
    summary:
      "Please refer to our Returns & Exchanges Policy for detailed information on eligibility, timeframes, and process.",
    details: [
      "We take immense pride in the craftsmanship of our Pashmina. If you are not entirely satisfied with your purchase, eligible items may be returned or exchanged within 7 days of delivery.",
      "To qualify for a return or exchange, products must be unused, unwashed, unaltered, and returned in their original luxury packaging with all security tags intact.",
      "Bespoke, customized, or final-sale items are non-returnable unless received in a damaged or defective state. Return shipping costs are borne by the customer unless the return is due to an error on our part.",
    ],
  },
  {
    number: "06.",
    title: "USE OF THE WEBSITE",
    summary:
      "You agree to use our website only for lawful purposes and in a way that does not infringe on the rights of others or restrict their use of the site.",
    details: [
      "You are granted a limited, non-exclusive, non-transferable license to access and use our website strictly for personal, non-commercial purposes.",
      "You agree not to engage in unauthorized data harvesting, scraping, reverse engineering, or submitting malicious code to our platform infrastructure.",
      "Any unauthorized commercial use, tampering with website security features, or violation of these terms will result in immediate termination of access and potential legal action.",
    ],
  },
  {
    number: "07.",
    title: "INTELLECTUAL PROPERTY",
    summary:
      "All content on this website, including text, images, logos, and designs, is the property of ZAEVYUL Pashmina and is protected by copyright laws.",
    details: [
      "All trademarks, brand names, product designs, photography, text, artwork, and website codebase featured on this site are the exclusive property of ZAEVYUL Pashmina.",
      "No content or imagery from this website may be copied, reproduced, republished, downloaded, uploaded, posted, or transmitted in any form without our express written consent.",
      "Unauthorized reproduction or distribution of ZAEVYUL's intellectual property is strictly prohibited and protected under international copyright and trademark laws.",
    ],
  },
  {
    number: "08.",
    title: "LIMITATION OF LIABILITY",
    summary:
      "ZAEVYUL Pashmina shall not be liable for any indirect, incidental, or consequential damages arising from the use of our website or products.",
    details: [
      "To the maximum extent permitted by applicable law, ZAEVYUL Pashmina and its directors, employees, or partners shall not be held liable for any direct, indirect, incidental, punitive, or consequential damages resulting from your use of the website or purchased items.",
      "Our maximum aggregate liability for any claim arising out of or related to your purchase shall not exceed the total price paid by you for the specific product giving rise to the claim.",
      "We do not guarantee that our website will operate uninterrupted, error-free, or completely secure from third-party disruptions.",
    ],
  },
  {
    number: "09.",
    title: "CHANGES TO TERMS",
    summary:
      "We may update these Terms and Conditions from time to time. Any changes will be posted on this page with an updated effective date.",
    details: [
      "We reserve the right, at our sole discretion, to modify, update, or replace these Terms and Conditions at any time without prior individual notification.",
      "All modifications take effect immediately upon being posted on this website. Continued use of our site following any changes signifies your acceptance of the updated terms.",
      "We encourage you to review this page regularly to remain informed of our operational policies and legal terms.",
    ],
  },
  {
    number: "10.",
    title: "GOVERNING LAW",
    summary:
      "These Terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Delhi, India.",
    details: [
      "These Terms and Conditions and any separate agreements under which we provide you services shall be governed by and construed in accordance with the laws of India.",
      "In the event of any legal dispute, claim, or controversy arising out of or relating to your use of the site or purchases made, such matters shall be submitted to the exclusive jurisdiction of the courts located in Delhi, India.",
      "If any provision of these Terms is held to be invalid or unenforceable by a court of competent jurisdiction, that provision shall be severed without affecting the validity and enforceability of remaining provisions.",
    ],
  },
];

export default function TermsPage() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let active = true;
    api.settings
      .getPublic()
      .then((data) => {
        if (active) setSettings(data);
      })
      .catch((err) =>
        console.error("Error loading settings for TermsPage:", err),
      );
    return () => {
      active = false;
    };
  }, []);

  const contactEmail =
    settings?.storeEmail || settings?.email || "hello@zaevyul.com";

  // Accordion state: by default, all start closed or first section open
  const [openSections, setOpenSections] = useState({});

  const toggleSection = (index) => {
    setOpenSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="bg-[#FAF8F5] text-[#1C1916] font-sans min-h-screen">
      <Navbar />
      {/* Main Content */}
      <main className="pt-24 pb-20 px-6 sm:px-10 lg:px-16 xl:px-20">
        <div className="max-w-[1040px] 2xl:max-w-[1240px] mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <p className="font-sans text-[11px] font-semibold tracking-[0.25em] uppercase text-[#B58A5B] mb-3">
              TERMS & CONDITIONS
            </p>
            <h1 className="font-serif text-[36px] sm:text-[48px] font-normal leading-tight text-[#1C1916]">
              Terms and Conditions
            </h1>
            <OrnamentDivider className="my-6" />
            <p className="font-sans text-[13.5px] sm:text-[14.5px] text-[#6B6560] leading-relaxed max-w-[540px] mx-auto font-light">
              Please read these Terms and Conditions carefully
              <br className="hidden sm:inline" /> before using our website or
              placing an order.
              <br /> By accessing or using our site, you agree to these terms.
            </p>
          </div>

          {/* Accordion / Terms List */}
          <div className="divide-y divide-[#E6DED4]/80 border-t border-b border-[#E6DED4]/80 mb-14">
            {TERMS_SECTIONS.map((section, index) => {
              const isOpen = !!openSections[index];
              return (
                <div key={section.number} className="py-6 sm:py-7">
                  {/* Accordion Header Row */}
                  <button
                    onClick={() => toggleSection(index)}
                    className="w-full flex items-start justify-between text-left group cursor-pointer focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <div className="flex-1 pr-4">
                      {/* Title Row */}
                      <div className="flex items-baseline gap-3.5 sm:gap-5">
                        <span className="font-serif text-[15px] sm:text-[16px] text-[#B58A5B] font-medium shrink-0">
                          {section.number}
                        </span>
                        <h2 className="font-sans text-[12.5px] sm:text-[13.5px] font-semibold tracking-[0.14em] uppercase text-[#1C1916] group-hover:text-[#B58A5B] transition-colors">
                          {section.title}
                        </h2>
                      </div>

                      {/* Summary Sub-heading (Visible under heading when closed) */}
                      <p className="font-sans text-[12.5px] sm:text-[13px] text-[#6B6560] leading-relaxed mt-2.5 pl-7 sm:pl-9 font-normal">
                        {section.summary}
                      </p>
                    </div>

                    <div className="pt-0.5">
                      <ChevronDown
                        size={18}
                        strokeWidth={1.5}
                        className={`text-[#8A857E] group-hover:text-[#1C1916] transition-transform duration-250 shrink-0 ${
                          isOpen ? "rotate-180 text-[#B58A5B]" : "rotate-0"
                        }`}
                      />
                    </div>
                  </button>

                  {/* Expanded Detailed Data (Visible when open, matching the heading font family & style) */}
                  {isOpen && (
                    <div className="pl-7 sm:pl-9 pt-4 pb-2 space-y-3 transition-all duration-300 animate-fadeIn">
                      <div className="w-8 h-px bg-[#B58A5B]/40 mb-3" />
                      {section.details.map((paragraph, pIdx) => (
                        <p
                          key={pIdx}
                          className="font-sans text-[12.5px] sm:text-[13px] font-normal leading-[1.75] text-[#3D3833] tracking-[0.01em]"
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Still Have Questions Box */}
          <div className="bg-[#FAF6F0] border border-[#EAE3DA] rounded-[6px] p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-5 sm:gap-6 text-center sm:text-left">
            <div className="w-14 h-14 rounded-full bg-white border border-[#E6DED4] flex items-center justify-center shrink-0 shadow-xs">
              <Mail size={20} strokeWidth={1.25} className="text-[#1C1916]" />
            </div>
            <div>
              <p className="font-sans text-[11px] font-semibold tracking-[0.18em] uppercase text-[#1C1916]">
                STILL HAVE QUESTIONS?
              </p>
              <p className="font-sans text-[13px] text-[#6B6560] mt-1 font-light">
                We're here to help. Reach out to us anytime.
              </p>
              <a
                href={`mailto:${contactEmail}`}
                className="font-sans text-[13px] font-medium text-[#B58A5B] hover:underline mt-1 inline-block"
              >
                {contactEmail}
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
