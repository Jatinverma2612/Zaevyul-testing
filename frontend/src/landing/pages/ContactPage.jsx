import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Mail, Phone, MapPin, Clock, Lock } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { api } from "../../lib/api";
import SiteFooter from "../components/SiteFooter";
import Navbar from "../components/Navbar";

const TABS = [
  { key: "form", label: "Contact Form" },
  { key: "info", label: "Contact Info" },
];

// Static fallback, only used for whichever fields Settings doesn't provide.
const DEFAULT_CONTACT = {
  email: "hello@zaevyul.com",
  emailNote: "We reply within 24 hours",
  phone: "+91 98765 43210",
  phoneHours: "Mon – Sat, 10:00 AM – 7:00 PM (IST)",
  addressLine1: "ZaeVyul Studio, Sector 21,",
  addressLine2: "Faridabad, Haryana 121001, India",
  hoursLine1: "Mon – Sat: 10:00 AM – 7:00 PM",
  hoursLine2: "Sunday: Closed",
};

// Settings field names aren't confirmed on the backend yet — this checks a
// few likely shapes (flat fields or a nested `contact` object) and falls
// back to DEFAULT_CONTACT per-field so nothing renders blank. Once the
// actual Settings schema is confirmed, trim this down to the real keys.
const buildContactDetails = (settings) => {
  const s = settings || {};
  const c = s.contact || {};

  const email = c.email || s.contactEmail || s.email || DEFAULT_CONTACT.email;
  const phone = c.phone || s.contactPhone || s.phone || DEFAULT_CONTACT.phone;
  const address = c.address || s.storeAddress || s.address || null;
  const hours = c.hours || s.storeHours || s.hours || null;

  return [
    {
      icon: Mail,
      label: "Email",
      lines: [email, DEFAULT_CONTACT.emailNote],
    },
    {
      icon: Phone,
      label: "Phone",
      lines: [phone, DEFAULT_CONTACT.phoneHours],
    },
    {
      icon: MapPin,
      label: "Studio",
      lines: address
        ? [address]
        : [DEFAULT_CONTACT.addressLine1, DEFAULT_CONTACT.addressLine2],
    },
    {
      icon: Clock,
      label: "Hours",
      lines: hours
        ? [hours]
        : [DEFAULT_CONTACT.hoursLine1, DEFAULT_CONTACT.hoursLine2],
    },
  ];
};

export default function ContactPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("form");
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const [settings, setSettings] = useState(null);
  useEffect(() => {
    let active = true;
    api.settings
      .getPublic()
      .then((data) => {
        if (active) setSettings(data);
      })
      .catch((err) =>
        console.error("Error loading settings in ContactPage:", err),
      );
    return () => {
      active = false;
    };
  }, []);

  const contactDetails = buildContactDetails(settings);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast("Please fill out your name, email, and message", "error");
      return;
    }
    setSubmitting(true);
    try {
      // Wire this up to a real endpoint when one exists, e.g.:
      // await publicRequest("/contact", { method: "POST", body: JSON.stringify(form) });
      await new Promise((r) => setTimeout(r, 600));
      toast("Message sent — we'll be in touch soon", "success");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      toast(err.message || "Could not send your message", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="bg-[#FAF8F5] pt-14 text-[#1C1916]">
        {/* Breadcrumb */}
        <div className="max-w-[1440px] 2xl:max-w-[1680px] mx-auto px-6 sm:px-10 pt-6">
          <div className="flex items-center gap-1.5 font-sans text-[11px] text-[#8A857E]">
            <Link to="/" className="hover:text-[#1C1916] transition-colors">
              Home
            </Link>
            <ChevronRight size={11} />
            <span className="text-[#3D3833]">Contact Us</span>
          </div>
        </div>

        {/* Hero */}
        <div className="max-w-[1440px] 2xl:max-w-[1680px] mx-auto px-6 sm:px-10 pt-10 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="font-sans text-[11px] font-semibold tracking-[0.2em] uppercase text-[#B58A5B] mb-4">
              Get in Touch
            </p>
            <h1 className="font-serif text-[42px] sm:text-[52px] leading-[1.08] text-[#1C1916]">
              We're Here
              <br />
              <span className="italic">To Help</span>
            </h1>
            <div className="w-12 h-px bg-[#B58A5B] my-6" />
            <p className="font-sans text-[14px] leading-relaxed text-[#6B6560] max-w-[420px]">
              Whether you have a question about our collections, need styling
              advice, or just want to say hello, we'd love to hear from you.
            </p>
          </div>
          <div className="relative rounded-[4px] overflow-hidden bg-[#EFE9E1] aspect-[4/3]">
            <img
              src="/storefront/pashmina-banner.png"
              alt="ZaeVyul Pashmina"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-[1440px] 2xl:max-w-[1680px] mx-auto px-6 sm:px-10">
          <div className="flex items-center justify-center gap-8 border-b border-[#E6DED4]">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative py-3.5 font-sans text-[12px] font-semibold tracking-[0.08em] uppercase transition-colors cursor-pointer ${
                  activeTab === tab.key
                    ? "text-[#1C1916]"
                    : "text-[#8A857E] hover:text-[#3D3833]"
                }`}
              >
                {tab.label}
                <span
                  className={`absolute left-0 right-0 -bottom-px h-[2px] transition-colors ${
                    activeTab === tab.key ? "bg-[#B58A5B]" : "bg-transparent"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="max-w-[1440px] 2xl:max-w-[1680px] mx-auto px-6 sm:px-10 py-12 flex flex-col items-center text-center">
          {activeTab === "form" && (
            <div className="w-full max-w-[640px] text-left">
              <h3 className="font-serif text-[22px] text-[#1C1916] mb-1">
                Send Us a Message
              </h3>
              <div className="w-10 h-px bg-[#B58A5B] mb-8" />
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={form.name}
                    onChange={handleChange("name")}
                    className="w-full border border-[#E6DED4] rounded-[3px] px-4 py-3 font-sans text-[13px] text-[#1C1916] placeholder:text-[#B0A99D] bg-white focus:outline-none focus:border-[#B58A5B] transition-colors"
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={form.email}
                    onChange={handleChange("email")}
                    className="w-full border border-[#E6DED4] rounded-[3px] px-4 py-3 font-sans text-[13px] text-[#1C1916] placeholder:text-[#B0A99D] bg-white focus:outline-none focus:border-[#B58A5B] transition-colors"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Subject"
                  value={form.subject}
                  onChange={handleChange("subject")}
                  className="w-full border border-[#E6DED4] rounded-[3px] px-4 py-3 font-sans text-[13px] text-[#1C1916] placeholder:text-[#B0A99D] bg-white focus:outline-none focus:border-[#B58A5B] transition-colors"
                />
                <textarea
                  placeholder="How can we help you?"
                  rows={5}
                  value={form.message}
                  onChange={handleChange("message")}
                  className="w-full border border-[#E6DED4] rounded-[3px] px-4 py-3 font-sans text-[13px] text-[#1C1916] placeholder:text-[#B0A99D] bg-white focus:outline-none focus:border-[#B58A5B] transition-colors resize-none"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#1C1916] text-white font-sans text-[11px] font-semibold tracking-[0.2em] uppercase py-4 rounded-[3px] hover:bg-[#3D3833] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submitting ? "Sending…" : "Send Message"}
                </button>
                <p className="flex items-center gap-2 font-sans text-[11px] text-[#8A857E] pt-1">
                  <Lock size={12} />
                  We value your privacy and never share your details.
                </p>
              </form>
            </div>
          )}

          {activeTab === "info" && (
            <div className="w-full max-w-[640px] text-left">
              <h3 className="font-serif text-[22px] text-[#1C1916] mb-1">
                Contact Details
              </h3>
              <div className="w-10 h-px bg-[#B58A5B] mb-2" />
              <div className="divide-y divide-[#E6DED4]/70">
                {contactDetails.map(({ icon: Icon, label, lines }) => (
                  <div key={label} className="flex items-start gap-4 py-6">
                    <div className="w-11 h-11 rounded-full bg-[#EFE9E1] flex items-center justify-center shrink-0">
                      <Icon
                        size={16}
                        strokeWidth={1.6}
                        className="text-[#1C1916]"
                      />
                    </div>
                    <div>
                      <p className="font-sans text-[13px] font-semibold text-[#1C1916] mb-1">
                        {label}
                      </p>
                      {lines.map((line, i) => (
                        <p
                          key={i}
                          className="font-sans text-[12.5px] text-[#6B6560] leading-relaxed"
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
