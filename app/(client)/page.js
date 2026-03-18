"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/* ── Eye icon SVG (white #FFF, toggles visibility) ── */
function EyeToggle({ visible, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 focus:outline-none"
      aria-label={visible ? "Hide code" : "Show code"}
    >
      {visible ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );
}

export default function CodeEntryPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const router = useRouter();

  /* ── Forgot code state ── */
  const [forgotOpen, setForgotOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [recovering, setRecovering] = useState(false);
  const [recoveryResult, setRecoveryResult] = useState(null);
  const [recoveryError, setRecoveryError] = useState("");

  /* ── Submit client code ── */
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const trimmed = code.trim().toUpperCase();
    if (!trimmed || trimmed.length < 3) {
      setError("Please enter your client code (e.g. RFX-****).");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/clients?code=${trimmed}`);
      const data = await res.json();

      if (!data.client) {
        setError("Code not found. Check with Reflexity.");
        setLoading(false);
        return;
      }

      router.push(`/dashboard/${trimmed}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  /* ── Recover code by email ── */
  async function handleRecover(e) {
    e.preventDefault();
    setRecoveryError("");
    setRecoveryResult(null);

    if (!email.trim() || !email.includes("@")) {
      setRecoveryError("Please enter a valid email address.");
      return;
    }

    setRecovering(true);
    try {
      const res = await fetch("/api/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (data.error) {
        setRecoveryError(data.error);
      } else if (data.code) {
        setRecoveryResult({ code: data.code });
      }
    } catch {
      setRecoveryError("Something went wrong. Please try again.");
    } finally {
      setRecovering(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-6">
        {/* Logo */}
        <img
          src="/reflexity-logo.png"
          alt="Reflexity"
          className="h-[70px] md:h-[80px] w-auto mx-auto"
        />

        {/* Heading */}
        <h1 className="text-4xl font-bold text-white">ROI Tracker</h1>

        {/* Subheading */}
        <p className="text-slate-400">
          Track your automation results every week/month.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="relative">
            <input
              type={showCode ? "text" : "password"}
              maxLength={8}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError("");
              }}
              placeholder="e.g. RFX-****"
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-center text-lg tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent pr-12"
            />
            <EyeToggle visible={showCode} onClick={() => setShowCode((v) => !v)} />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Checking…" : "View My Dashboard"}
          </button>
        </form>

        {/* Forgot code link */}
        <button
          type="button"
          onClick={() => {
            setForgotOpen((v) => !v);
            setRecoveryError("");
            setRecoveryResult(null);
          }}
          className="text-[#7C3AED] hover:text-[#6D28D9] text-sm font-medium transition-colors"
        >
          Forgot my code?
        </button>

        {/* Forgot code panel */}
        {forgotOpen && (
          <div className="bg-slate-800/70 rounded-xl p-5 space-y-4 text-left animate-slide-up">
            <p className="text-white text-sm font-semibold">Recover your code</p>
            <p className="text-slate-400 text-xs">
              Enter the email address associated with your account.
            </p>
            <form onSubmit={handleRecover} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setRecoveryError("");
                  setRecoveryResult(null);
                }}
                placeholder="you@company.com"
                className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
              />
              {recoveryError && (
                <p className="text-red-400 text-sm">{recoveryError}</p>
              )}
              {recoveryResult && (
                <div className="bg-emerald-900/30 border border-emerald-700 rounded-lg p-4 text-center space-y-2">
                  <p className="text-emerald-400 text-sm font-semibold">
                    Your code:
                  </p>
                  <p className="text-white text-2xl font-mono font-bold tracking-widest">
                    {recoveryResult.code}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(recoveryResult.code)}
                    className="text-xs px-4 py-1.5 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                  >
                    Copy Code
                  </button>
                </div>
              )}
              <button
                type="submit"
                disabled={recovering}
                className="w-full py-2.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {recovering ? "Looking up…" : "Recover Code"}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
