"use client";

import { useEffect, useState } from "react";
import FrequencyBadge from "@/components/FrequencyBadge";
import StatusBadge from "@/components/StatusBadge";

import { fmt$ } from "@/lib/format";

const ADMIN_PASSWORD = (process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "").trim();

export default function AdminPage() {
  /* ── auth ── */
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");

  /* ── form ── */
  const [formOpen, setFormOpen] = useState(true);
  const [clientName, setClientName] = useState("");
  const [clientType, setClientType] = useState("DFY");
  const [automationType, setAutomationType] = useState("");
  const [deploymentDate, setDeploymentDate] = useState("");
  const [projectCost, setProjectCost] = useState("");
  const [logFrequency, setLogFrequency] = useState("weekly");
  const [notes, setNotes] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  /* ── client list ── */
  const [clients, setClients] = useState([]);
  const [listLoading, setListLoading] = useState(false);

  /* ── confirmation dialog ── */
  const [confirmAction, setConfirmAction] = useState(null); // { code, action, label }

  /* ── restore session ── */
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (sessionStorage.getItem("reflexity_admin") === "true") {
        setAuthenticated(true);
      }
    }
  }, []);

  /* ── load clients once authenticated ── */
  useEffect(() => {
    if (authenticated) loadClients();
  }, [authenticated]);

  async function loadClients() {
    setListLoading(true);
    try {
      const res = await fetch("/api/clients/all", {
        headers: { "X-Admin-Key": ADMIN_PASSWORD },
      });
      const data = await res.json();
      setClients(data.clients || []);
    } catch {
      console.error("Failed to load clients");
    } finally {
      setListLoading(false);
    }
  }

  /* ── password check ── */
  function handleLogin(e) {
    e.preventDefault();
    if (password.trim() === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setAuthError("");
      sessionStorage.setItem("reflexity_admin", "true");
    } else {
      setAuthError("Incorrect password.");
    }
  }

  function handleSignOut() {
    setAuthenticated(false);
    sessionStorage.removeItem("reflexity_admin");
    setPassword("");
  }

  /* ── submit new client ── */
  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setSuccess(null);
    setSaving(true);

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": ADMIN_PASSWORD,
        },
        body: JSON.stringify({
          action: "create",
          client_name: clientName,
          client_type: clientType,
          automation_type: automationType,
          deployment_date: deploymentDate,
          project_cost: Number(projectCost),
          log_frequency: logFrequency,
          notes: notes || null,
          email: clientEmail || null,
        }),
      });
      const data = await res.json();
      if (!data.code) throw new Error(data.error || "Insert failed");

      const baseUrl =
        typeof window !== "undefined" ? window.location.origin : "";
      setSuccess({
        code: data.code,
        url: `${baseUrl}/dashboard/${data.slug}`,
      });

      // Reset form
      setClientName("");
      setClientType("DFY");
      setAutomationType("");
      setDeploymentDate("");
      setProjectCost("");
      setLogFrequency("weekly");
      setNotes("");
      setClientEmail("");

      loadClients();
    } catch (err) {
      console.error(err);
      setFormError("Failed to add client. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  /* ── client actions ── */
  async function runAction(code, action) {
    try {
      await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": ADMIN_PASSWORD,
        },
        body: JSON.stringify({ action, code }),
      });
      loadClients();
    } catch (err) {
      console.error(`Action ${action} failed`, err);
    }
    setConfirmAction(null);
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
  }

  /* ═══════════ INPUT CLASS (reused) ═══════════ */
  const inputCls =
    "w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600";

  /* ═══════════ PASSWORD GATE ═══════════ */
  if (!authenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm space-y-4 text-center"
        >
          <img
            src="/reflexity-logo.png"
            alt="Reflexity"
            className="h-[58px] md:h-[60px] w-auto mx-auto"
          />
          <p className="text-purple-400 text-xs font-medium tracking-wide">Admin</p>
          <h1 className="text-2xl font-bold text-white">Enter Password</h1>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              className={`${inputCls} text-center pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
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
          </div>
          {authError && (
            <p className="text-red-400 text-sm">{authError}</p>
          )}
          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors"
          >
            Unlock
          </button>
        </form>
      </main>
    );
  }

  /* ═══════════ ADMIN PANEL ═══════════ */
  return (
    <main className="min-h-screen max-w-4xl mx-auto px-4 pb-16">
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-30 bg-[#0F172A]/90 backdrop-blur-sm py-4 flex items-center justify-between border-b border-slate-800 mb-6">
        <div className="flex items-center gap-2">
          <img
            src="/reflexity-logo.png"
            alt="Reflexity"
            className="h-[58px] md:h-[60px] w-auto"
          />
          <span className="text-purple-400 text-xs font-medium">Admin</span>
        </div>
        <button
          onClick={handleSignOut}
          className="text-sm text-slate-400 hover:text-white transition-colors"
        >
          Sign out
        </button>
      </div>

      {/* ─────── SECTION 1 — Add New Client ─────── */}
      <section className="mb-8">
        <button
          onClick={() => setFormOpen((v) => !v)}
          className="flex items-center gap-2 text-white font-semibold text-lg mb-4 md:cursor-default"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 transition-transform md:hidden ${
              formOpen ? "rotate-90" : ""
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          Add New Client
        </button>

        {/* Collapsible on mobile, always open on md+ */}
        <div className={`${formOpen ? "block" : "hidden"} md:block`}>
          {/* Success banner */}
          {success && (
            <div className="bg-emerald-900/30 border border-emerald-700 rounded-xl p-5 space-y-3 mb-5">
              <p className="text-emerald-400 font-semibold text-lg">
                Client created!
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-white text-sm">Code:</span>
                <code className="bg-slate-800 px-3 py-1 rounded text-purple-400 font-mono font-bold">
                  {success.code}
                </code>
                <button
                  onClick={() => copyToClipboard(success.code)}
                  className="text-xs px-3 py-1 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                >
                  Copy Code
                </button>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-white text-sm">URL:</span>
                <code className="bg-slate-800 px-3 py-1 rounded text-slate-300 text-xs break-all">
                  {success.url}
                </code>
                <button
                  onClick={() => copyToClipboard(success.url)}
                  className="text-xs px-3 py-1 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                >
                  Copy URL
                </button>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="bg-slate-800/60 rounded-2xl p-5 md:p-6 space-y-5"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Client Name */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 text-sm font-medium">
                  Client name
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Acme Corp"
                  className={inputCls}
                />
              </div>

              {/* Client Type */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 text-sm font-medium">
                  Client type
                </label>
                <select
                  value={clientType}
                  onChange={(e) => setClientType(e.target.value)}
                  className={inputCls}
                >
                  <option value="DFY">DFY</option>
                  <option value="Template Buyer">Template Buyer</option>
                  <option value="Community Member">Community Member</option>
                </select>
              </div>

              {/* Automation Type */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 text-sm font-medium">
                  Automation type
                </label>
                <input
                  type="text"
                  required
                  value={automationType}
                  onChange={(e) => setAutomationType(e.target.value)}
                  placeholder="AI Report Generator"
                  className={inputCls}
                />
              </div>

              {/* Deployment Date */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 text-sm font-medium">
                  Deployment date
                </label>
                <input
                  type="date"
                  required
                  value={deploymentDate}
                  onChange={(e) => setDeploymentDate(e.target.value)}
                  className={inputCls}
                />
              </div>

              {/* Project Cost */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 text-sm font-medium">
                  Project cost ($)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={projectCost}
                  onChange={(e) => setProjectCost(e.target.value)}
                  placeholder="0 for community"
                  className={inputCls}
                />
              </div>

              {/* Log Frequency Toggle */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 text-sm font-medium">
                  Log frequency
                </label>
                <div className="flex rounded-lg overflow-hidden border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setLogFrequency("weekly")}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${
                      logFrequency === "weekly"
                        ? "bg-purple-600 text-white"
                        : "bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogFrequency("monthly")}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${
                      logFrequency === "monthly"
                        ? "bg-purple-600 text-white"
                        : "bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    Monthly
                  </button>
                </div>
              </div>
            </div>

            {/* Notes – full width */}
            <div className="space-y-1.5">
              <label className="block text-slate-300 text-sm font-medium">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any extra context…"
                className={`${inputCls} resize-none`}
              />
            </div>

            {/* Client Email – for code recovery */}
            <div className="space-y-1.5">
              <label className="block text-slate-300 text-sm font-medium">
                Client email (for code recovery)
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="client@company.com"
                className={inputCls}
              />
            </div>

            {formError && (
              <p className="text-red-400 text-sm">{formError}</p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Creating…" : "Add Client"}
            </button>
          </form>
        </div>
      </section>

      {/* ─────── SECTION 2 — Client List ─────── */}
      <section>
        <h2 className="text-white font-semibold text-lg mb-4">
          All Clients{" "}
          <span className="text-slate-500 font-normal text-sm">
            ({clients.length})
          </span>
        </h2>

        {listLoading ? (
          <p className="text-slate-400 animate-pulse">Loading…</p>
        ) : clients.length === 0 ? (
          <p className="text-slate-500">No clients yet.</p>
        ) : (
          <>
            {/* ─── Mobile cards ─── */}
            <div className="md:hidden space-y-3">
              {clients.map((c) => (
                <div
                  key={c.id}
                  className="bg-slate-800 rounded-xl p-4 mb-3 space-y-2"
                >
                  {/* Row 1 */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white">
                      {c.client_name}
                    </span>
                    <StatusBadge status={c.status} />
                    <FrequencyBadge
                      frequency={c.log_frequency || c.tracking_frequency || "weekly"}
                    />
                  </div>
                  {/* Row 2 */}
                  <div className="flex items-center gap-2 flex-wrap text-sm">
                    <code className="text-purple-400 font-mono font-bold">
                      {c.code}
                    </code>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                      {c.client_type || "—"}
                    </span>
                    <span className="text-slate-400">{c.automation_type}</span>
                  </div>
                  {/* Row 3 */}
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span>
                      {c.deployment_date
                        ? new Date(c.deployment_date).toLocaleDateString()
                        : "—"}
                    </span>
                    <span>{fmt$(c.project_cost)}</span>
                  </div>
                  {/* Row 4 – actions */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a
                      href={`/dashboard/${c.slug || c.code}`}
                      target="_blank"
                      rel="noopener"
                      className="text-xs px-3 py-1.5 rounded-lg bg-purple-600/20 text-purple-300 hover:bg-purple-600/40 transition-colors"
                    >
                      View Dashboard
                    </a>
                    {c.status === "active" && (
                      <button
                        onClick={() => runAction(c.code, "freeze")}
                        className="text-xs px-3 py-1.5 rounded-lg bg-amber-600/20 text-amber-300 hover:bg-amber-600/40 transition-colors"
                      >
                        Freeze
                      </button>
                    )}
                    {c.status === "frozen" && (
                      <button
                        onClick={() => runAction(c.code, "activate")}
                        className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/40 transition-colors"
                      >
                        Activate
                      </button>
                    )}
                    <button
                      onClick={() =>
                        setConfirmAction({
                          code: c.code,
                          action: "revoke",
                          label: c.client_name,
                        })
                      }
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-600/20 text-red-300 hover:bg-red-600/40 transition-colors"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ─── Desktop table ─── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="py-3 px-3">Client</th>
                    <th className="py-3 px-3">Code</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Automation</th>
                    <th className="py-3 px-3">Deployed</th>
                    <th className="py-3 px-3">Cost</th>
                    <th className="py-3 px-3">Freq</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-3 text-white font-medium">
                        {c.client_name}
                      </td>
                      <td className="py-3 px-3">
                        <code className="text-purple-400 font-mono">
                          {c.code}
                        </code>
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {c.client_type || "—"}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {c.automation_type}
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {c.deployment_date
                          ? new Date(c.deployment_date).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {fmt$(c.project_cost)}
                      </td>
                      <td className="py-3 px-3">
                        <FrequencyBadge
                          frequency={
                            c.log_frequency || c.tracking_frequency || "weekly"
                          }
                        />
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex gap-2">
                          <a
                            href={`/dashboard/${c.slug || c.code}`}
                            target="_blank"
                            rel="noopener"
                            className="text-xs px-2 py-1 rounded bg-purple-600/20 text-purple-300 hover:bg-purple-600/40 transition-colors"
                          >
                            View
                          </a>
                          {c.status === "active" && (
                            <button
                              onClick={() => runAction(c.code, "freeze")}
                              className="text-xs px-2 py-1 rounded bg-amber-600/20 text-amber-300 hover:bg-amber-600/40 transition-colors"
                            >
                              Freeze
                            </button>
                          )}
                          {c.status === "frozen" && (
                            <button
                              onClick={() => runAction(c.code, "activate")}
                              className="text-xs px-2 py-1 rounded bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/40 transition-colors"
                            >
                              Activate
                            </button>
                          )}
                          <button
                            onClick={() =>
                              setConfirmAction({
                                code: c.code,
                                action: "revoke",
                                label: c.client_name,
                              })
                            }
                            className="text-xs px-2 py-1 rounded bg-red-600/20 text-red-300 hover:bg-red-600/40 transition-colors"
                          >
                            Revoke
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* ─────── Revoke Confirmation Dialog ─────── */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-sm w-full space-y-4 text-center">
            <p className="text-white font-semibold">Revoke access?</p>
            <p className="text-slate-400 text-sm">
              This will permanently remove{" "}
              <span className="text-white">{confirmAction.label}</span> from the
              tracker. They will no longer be able to log in.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => runAction(confirmAction.code, "revoke")}
                className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
              >
                Yes, Revoke
              </button>
              <button
                onClick={() => setConfirmAction(null)}
                className="px-5 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
