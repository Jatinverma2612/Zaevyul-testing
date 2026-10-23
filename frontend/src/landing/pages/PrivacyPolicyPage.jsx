import { useState, useEffect } from "react";
import { Mail } from "lucide-react";
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

const PRIVACY_SECTIONS = [
  {
    number: "01.",
    title: "INFORMATION WE COLLECT",
    paragraphs: [
      "When you interact with ZAEVYUL Pashmina, we collect personal information you voluntarily provide, such as your full name, email address, shipping address, billing details, phone number, and payment preferences.",
      "We automatically collect device information, IP addresses, browser types, operating systems, and browsing patterns through cookies and web analytics to improve website performance and user experience.",
      "We do not knowingly collect or solicit personal information from individuals under the age of 18 without parental consent.",
    ],
  },
  {
    number: "02.",
    title: "HOW WE USE YOUR INFORMATION",
    paragraphs: [
      "We use your personal data to process and fulfill your orders, verify payment details, arrange delivery, and provide responsive customer service support.",
      "With your explicit consent, we send curated communications regarding new collection launches, artisanal stories from Kashmir, and exclusive luxury offers.",
      "We analyze anonymized usage data to optimize website navigation, refine inventory forecasting, and maintain our high standards of customer satisfaction.",
    ],
  },
  {
    number: "03.",
    title: "PAYMENT & SECURITY",
    paragraphs: [
      "All online transactions on ZAEVYUL Pashmina are encrypted using Secure Socket Layer (SSL) protocol. We do not store or retain raw credit card numbers or sensitive banking credentials on our servers.",
      "Payment processing is handled exclusively through certified PCI-DSS compliant payment gateway partners adhering to international financial security standards.",
      "While we implement administrative, technical, and physical safeguards, no digital system or internet transmission can be guaranteed 100% immune from security threats.",
    ],
  },
  {
    number: "04.",
    title: "COOKIES & TRACKING TECHNOLOGIES",
    paragraphs: [
      "Cookies are small data files stored on your device that enable our platform to recognize your browser, maintain active sessions, and save your cart selections.",
      "We utilize essential session cookies required for core site functionality alongside performance analytics cookies to understand visitor engagement with our collections.",
      "You may modify your browser settings to decline cookies at any time, though certain interactive store features may operate with reduced functionality.",
    ],
  },
  {
    number: "05.",
    title: "SHARING YOUR INFORMATION",
    paragraphs: [
      "We share necessary shipping information with accredited international courier and logistics partners strictly to ensure safe delivery of your purchases.",
      "Third-party service providers assisting with website hosting, payment processing, and email infrastructure operate under strict data protection obligations.",
      "We may disclose personal information if required to do so by applicable laws, court orders, or to protect the rights, property, and safety of ZAEVYUL Pashmina.",
    ],
  },
  {
    number: "06.",
    title: "DATA RETENTION",
    paragraphs: [
      "Transaction records and invoice histories are retained in compliance with statutory financial, tax, and consumer protection requirements.",
      "Customer account information and marketing preferences are stored until you request account deletion or unsubscribe from our communications.",
      "Upon a valid erasure request, we securely delete or anonymize your personal records unless legal obligations mandate ongoing retention.",
    ],
  },
  {
    number: "07.",
    title: "YOUR RIGHTS & CHOICES",
    paragraphs: [
      "You can review, update, or edit your personal profile information at any time by logging into your My Account dashboard on our website.",
      "You may opt out of promotional emails by clicking the 'Unsubscribe' link at the bottom of any email communication or contacting care@zaevyul.com.",
      "You have the right to request a copy of the personal information we hold about you or request its erasure, subject to legal and operational retention exceptions.",
    ],
  },
  {
    number: "08.",
    title: "THIRD-PARTY LINKS",
    paragraphs: [
      "Our website features links to social media networks (such as Instagram and Pinterest) and logistics partners. Navigating to external sites subjects you to their privacy policies.",
      "We strongly encourage you to inspect the privacy guidelines of any third-party website you visit, as ZAEVYUL Pashmina exercises no administrative control over external platforms.",
    ],
  },
  {
    number: "09.",
    title: "INTERNATIONAL DATA TRANSFERS",
    paragraphs: [
      "When you access our platform or order from international locations, your data may be transferred to and processed in India or cloud servers hosted globally.",
      "We take technical, organizational, and contractual measures to ensure your personal data receives a level of protection consistent with international privacy regulations.",
    ],
  },
  {
    number: "10.",
    title: "UPDATES TO THIS POLICY",
    paragraphs: [
      "Any revisions to our privacy practices will be posted directly on this page with an updated effective date at the top of the policy.",
      "Significant policy changes will be communicated via prominent notices on our website or through direct email notifications to registered users.",
      "Continued use of our website following any policy updates constitutes your agreement to the revised Privacy Policy.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let active = true;
    api.settings
      .getPublic()
      .then((data) => {
        if (active) setSettings(data);
      })
      .catch((err) =>
        console.error("Error loading settings for Privacy Policy:", err),
      );
    return () => {
      active = false;
    };
  }, []);

  const contactEmail =
    settings?.storeEmail || settings?.email || "hello@zaevyul.com";

  return (
    <div className="bg-[#FAF8F5] text-[#1C1916] font-sans min-h-screen">
      <Navbar />
      {/* Main Content */}
      <main className="pt-24 pb-20 px-6 sm:px-10 lg:px-16 xl:px-20">
        <div className="max-w-[1040px] 2xl:max-w-[1240px] mx-auto">
          {/* Header Section */}
          <div className="text-center mb-14">
            <p className="font-sans text-[11px] font-semibold tracking-[0.25em] uppercase text-[#B58A5B] mb-3">
              PRIVACY POLICY
            </p>
            <h1 className="font-serif text-[36px] sm:text-[48px] font-normal leading-tight text-[#1C1916]">
              Privacy Policy
            </h1>
            <OrnamentDivider className="my-6" />
            <p className="font-sans text-[13.5px] sm:text-[14.5px] text-[#6B6560] leading-relaxed max-w-[540px] mx-auto font-light">
              Please read this Privacy Policy carefully to understand how we
              collect,
              <br className="hidden sm:inline" /> use, and protect your personal
              information.
              <br /> By accessing or using our site, you agree to these
              practices.
            </p>
          </div>

          {/* Privacy Document Sections (Non-Accordion open format) */}
          <div className="divide-y divide-[#E6DED4]/80 border-t border-b border-[#E6DED4]/80 mb-14">
            {PRIVACY_SECTIONS.map((section) => (
              <section key={section.number} className="py-7 sm:py-8">
                {/* Title */}
                <div className="flex items-baseline gap-3.5 sm:gap-5 mb-4">
                  <span className="font-serif text-[15px] sm:text-[16px] text-[#B58A5B] font-medium shrink-0">
                    {section.number}
                  </span>
                  <h2 className="font-sans text-[12.5px] sm:text-[13.5px] font-semibold tracking-[0.14em] uppercase text-[#1C1916]">
                    {section.title}
                  </h2>
                </div>

                {/* Paragraphs */}
                <div className="pl-7 sm:pl-9 space-y-3">
                  {section.paragraphs.map((paragraph, pIdx) => (
                    <p
                      key={pIdx}
                      className="font-sans text-[13px] sm:text-[13.5px] font-normal leading-[1.75] text-[#3D3833] tracking-[0.01em]"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
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
