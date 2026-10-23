import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ArrowLeft, Mail, ArrowRight, RefreshCw } from "lucide-react";
import { useCustomerAuth } from "../../context/CustomerAuthContext";
import { customerApi } from "../../lib/customerApi";
import { GoogleLogin } from "@react-oauth/google";
import PhoneNumberInput, { normalizePhoneInput } from "../../components/PhoneNumberInput";
import Logo from "../../components/Logo";

const RESEND_COOLDOWN = 60; // seconds

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export default function CustomerLoginPage() {
  const {
    loginWithEmailOTP,
    loginWithPhoneOTP,
    loginWithGoogle,
    isAuthenticated,
  } = useCustomerAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Where to redirect after login
  const from =
    new URLSearchParams(location.search).get("redirect") ||
    location.state?.from ||
    "/";

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  // ─── State ──────────────────────────────────────────────────────────────────
  const [step, setStep] = useState("input"); // 'input' | 'otp'
  const [loginMethod, setLoginMethod] = useState("email");
  const [inputValue, setInputValue] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("");
  const [inputType, setInputType] = useState("email"); // 'email' | 'phone'
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const otpRefs = useRef([]);

  // Keep input type aligned with the selected login method.
  useEffect(() => {
    setInputType(loginMethod);
  }, [loginMethod]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // ─── Send OTP ──────────────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setError("");
    setInfo("");

    if (!inputValue.trim()) {
      setError(loginMethod === "email" ? "Please enter your email address." : "Please enter your phone number.");
      return;
    }
    if (loginMethod === "email" && !isEmail(inputValue)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (loginMethod === "phone" && !phoneCountryCode) {
      setError("Please select your country code.");
      return;
    }

    setLoading(true);
    try {
      if (loginMethod === "email") {
        await customerApi.auth.sendEmailOtp(inputValue.trim());
        setInfo(`A 6-digit code has been sent to ${inputValue.trim()}.`);
      } else {
        const normalized = normalizePhoneInput({
          phone: inputValue.trim(),
          countryCode: phoneCountryCode,
        });
        await customerApi.auth.sendPhoneOtp(normalized.phone, normalized.countryCode);
        setInfo(`A 6-digit code has been sent to ${normalized.phone}.`);
      }
      setOtp(["", "", "", "", "", ""]);
      setStep("otp");
      setCountdown(RESEND_COOLDOWN);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.message || "Failed to send code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── OTP input handling ────────────────────────────────────────────────────
  const handleOtpChange = (idx, value) => {
    if (!/^\d?$/.test(value)) return; // digits only
    const next = [...otp];
    next[idx] = value;
    setOtp(next);
    setError("");
    if (value && idx < 5) {
      otpRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = [...otp];
    text.split("").forEach((ch, i) => {
      next[i] = ch;
    });
    setOtp(next);
    otpRefs.current[Math.min(text.length, 5)]?.focus();
  };

  // ─── Verify OTP ────────────────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter all 6 digits.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      if (inputType === "email") {
        await loginWithEmailOTP(inputValue.trim(), code);
      } else {
        const normalized = normalizePhoneInput({
          phone: inputValue.trim(),
          countryCode: phoneCountryCode,
        });
        await loginWithPhoneOTP(normalized.phone, code, normalized.countryCode);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Google ────────────────────────────────────────────────────────────────
  const handleGoogleSuccess = async ({ credential }) => {
    setLoading(true);
    setError("");
    try {
      await loginWithGoogle(credential);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Google login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex">
      {/* Left panel — decorative image */}
      <div
        className="hidden lg:flex w-1/2 relative flex-col items-start justify-end p-16"
        style={{
          backgroundImage: "url(/storefront/pashmina-banner.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C1916]/70 via-[#1C1916]/20 to-transparent" />
        <div className="relative z-10 text-white">
          <h1 className="font-serif text-[42px] font-light leading-tight mb-3">
            Welcome
            <br />
            Back
          </h1>
          <p className="font-sans text-[14px] font-light text-white/70 max-w-xs leading-relaxed">
            Sign in to continue
            <br />
            your journey with Zaevyul.
          </p>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-16">
        {/* Logo */}
        <Link
          to="/"
          className="mb-12 cursor-pointer flex items-center justify-center"
        >
          <Logo variant="header" />
        </Link>

        <div className="w-full max-w-[400px]">
          {step === "input" ? (
            <>
              <div className="mb-8">
                <h2 className="font-serif text-[26px] font-light text-[#1C1916] mb-1">
                  Sign in to your account
                </h2>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-5">
                <div className="grid grid-cols-2 gap-2 rounded-[2px] border border-[#E6DED4] bg-white p-1">
                  {["email", "phone"].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => {
                        setLoginMethod(method);
                        setInputValue("");
                        setError("");
                      }}
                      className={`py-2.5 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] rounded-[2px] transition-colors cursor-pointer ${
                        loginMethod === method
                          ? "bg-[#1C1916] text-white"
                          : "text-[#6B6560] hover:bg-[#FAF8F5]"
                      }`}
                    >
                      {method === "email" ? "Email" : "Mobile"}
                    </button>
                  ))}
                </div>

                {/* Email / Phone input */}
                {loginMethod === "email" ? (
                  <div>
                  <label className="block font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B6560] mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => {
                        setInputValue(e.target.value);
                        setError("");
                      }}
                      placeholder="Enter your email"
                      autoComplete="email"
                      autoFocus
                      className="w-full border border-[#E6DED4] bg-white px-4 py-3.5 font-sans text-[13px] text-[#1C1916] placeholder:text-[#B8AFA5] focus:outline-none focus:border-[#1C1916] rounded-[2px] transition-colors pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B58A5B]">
                      <Mail size={15} strokeWidth={1.5} />
                    </span>
                  </div>
                  <p className="mt-1.5 font-sans text-[11px] text-[#8A857E]">
                    We'll send a verification code via email
                  </p>
                  </div>
                ) : (
                  <div>
                    <PhoneNumberInput
                      countryCode={phoneCountryCode}
                      phone={inputValue}
                      onCountryChange={(code) => {
                        setPhoneCountryCode(code);
                        setError("");
                      }}
                      onPhoneChange={(value) => {
                        setInputValue(value);
                        setError("");
                      }}
                      label="Mobile Number"
                      showCountrySearch={false}
                    />
                    <p className="mt-1.5 font-sans text-[11px] text-[#8A857E]">
                      We'll send a verification code via SMS
                    </p>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-[2px] px-4 py-3 font-sans text-[12px] text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1C1916] hover:bg-[#B58A5B] text-white font-sans text-[11px] font-semibold tracking-[0.18em] uppercase py-4 rounded-[2px] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <>
                      Send Code <ArrowRight size={14} strokeWidth={1.5} />
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-4 my-2">
                  <div className="flex-1 h-px bg-[#E6DED4]" />
                  <span className="font-sans text-[10px] uppercase tracking-wider text-[#B8AFA5]">
                    or continue with
                  </span>
                  <div className="flex-1 h-px bg-[#E6DED4]" />
                </div>

                {/* Google Login */}
                {GOOGLE_CLIENT_ID ? (
                  <div className="flex justify-center">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() =>
                        setError("Google login failed. Please try again.")
                      }
                      shape="rectangular"
                      size="large"
                      text="continue_with"
                      theme="outline"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3 border border-[#E6DED4] bg-white rounded-[2px] py-3.5 px-4 cursor-not-allowed opacity-50">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path
                        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                        fill="#4285F4"
                      />
                      <path
                        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
                        fill="#34A853"
                      />
                      <path
                        d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                        fill="#EA4335"
                      />
                    </svg>
                    <span className="font-sans text-[13px] text-[#6B6560]">
                      Continue with Google
                    </span>
                  </div>
                )}
              </form>
            </>
          ) : (
            /* OTP Verification Step */
            <>
              <button
                onClick={() => {
                  setStep("input");
                  setError("");
                  setInfo("");
                }}
                className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#8A857E] hover:text-[#1C1916] transition-colors mb-8 cursor-pointer"
              >
                <ArrowLeft size={14} strokeWidth={1.5} /> Back
              </button>

              <div className="mb-8">
                <h2 className="font-serif text-[26px] font-light text-[#1C1916] mb-2">
                  Enter your code
                </h2>
                {info && (
                  <p className="font-sans text-[12.5px] text-[#6B6560] leading-relaxed">
                    {info}
                  </p>
                )}
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                {/* 6-digit OTP boxes */}
                <div className="flex gap-3 justify-center">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={idx === 0 ? handleOtpPaste : undefined}
                      className="w-12 h-14 text-center font-sans text-[22px] font-semibold text-[#1C1916] border border-[#E6DED4] bg-white focus:outline-none focus:border-[#1C1916] rounded-[2px] transition-colors"
                    />
                  ))}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-[2px] px-4 py-3 font-sans text-[12px] text-red-700 text-center">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.join("").length !== 6}
                  className="w-full bg-[#1C1916] hover:bg-[#B58A5B] text-white font-sans text-[11px] font-semibold tracking-[0.18em] uppercase py-4 rounded-[2px] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    "Verify & Sign In"
                  )}
                </button>

                {/* Resend */}
                <p className="text-center font-sans text-[12px] text-[#8A857E]">
                  Didn't receive a code?{" "}
                  {countdown > 0 ? (
                    <span className="text-[#B58A5B]">
                      Resend in {countdown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loading}
                      className="text-[#1C1916] font-semibold hover:text-[#B58A5B] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Resend code
                    </button>
                  )}
                </p>
              </form>
            </>
          )}

          {/* Footer note */}
          <p className="mt-10 text-center font-sans text-[10.5px] text-[#B8AFA5] leading-relaxed">
            Your data is secure and protected
          </p>
        </div>
      </div>
    </div>
  );
}
