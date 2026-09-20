"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getAdminSession, getUserSession, saveAdminSession } from "@/lib/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
    rememberDevice: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authStatus, setAuthStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [alertMessage, setAlertMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState("");
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    // 1. If already logged in, redirect away from admin login page
    const admin = getAdminSession();
    if (admin) {
      router.replace("/admin/dashboard");
      return;
    }

    const user = getUserSession();
    if (user) {
      router.replace("/dashboard");
      return;
    }

    // 2. Check if redirected due to 12-hour session expiry
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("expired") === "true") {
        setAuthStatus("error");
        setAlertMessage("Your 12-hour administrator session has ended. Please sign in again.");
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.identifier || !formData.password) {
      setAuthStatus("error");
      setAlertMessage("Please provide your admin email/gmail or mobile, and password.");
      return;
    }

    setIsSubmitting(true);
    setAuthStatus("loading");

    try {
      const response = await fetch("http://localhost:8080/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: formData.identifier,
          password: formData.password,
          rememberDevice: formData.rememberDevice,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        setAuthStatus("error");
        setAlertMessage(resData?.message || "Invalid admin credentials.");
        setIsSubmitting(false);
        return;
      }

      if (resData?.data?.token) {
        saveAdminSession({
          token: resData.data.token,
          role: resData.data.role || "ROLE_ADMIN",
          fullName: resData.data.fullName || "Admin",
          email: resData.data.email || resData.data.username || "",
          profileImagePath: resData.data.profileImagePath,
        });
      }

      setAuthStatus("success");
      setAlertMessage(`Credentials verified. Welcome, Lead Admin ${resData?.data?.fullName || "Harpreet Singh"}. Redirecting to Sovereign Portal...`);

      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 1200);
    } catch (err: any) {
      setAuthStatus("error");
      setAlertMessage(err?.message || "Failed to connect to backend server.");
      setIsSubmitting(false);
    }
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (resetIdentifier) {
      setResetSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col justify-between selection:bg-primary selection:text-on-primary font-body text-[14px] overflow-x-hidden relative">
      {/* Ambient glow dynamics */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] bg-primary-container/15 blur-[140px] rounded-full pointer-events-none z-0 animate-ambient-pulse" />
      <div className="fixed top-[-80px] right-[-80px] w-[460px] h-[460px] bg-secondary-container/10 blur-[130px] rounded-full pointer-events-none z-0 animate-ambient-mesh" />
      <div className="fixed bottom-[-60px] left-[-60px] w-[380px] h-[380px] bg-tertiary-container/10 blur-[110px] rounded-full pointer-events-none z-0" />

      {/* Top App Header */}
      <header className="w-full fixed top-0 left-0 z-50 px-8 py-4 flex justify-between items-center bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/20 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            title="Quick-Nav Back Home"
            className="group relative flex items-center justify-center w-10 h-10 rounded-xl bg-surface-container-low border border-outline-variant/30 hover:border-primary/50 text-on-surface hover:text-primary transition-all duration-300 animate-float shadow-lg hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:scale-105 active:scale-95"
          >
            <span className="absolute inset-0 rounded-xl bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
            <span className="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:scale-110">
              home
            </span>
            <span className="absolute top-1 right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
            </span>
          </Link>
          <div className="h-5 w-px bg-outline-variant/25 mx-1 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="font-mono text-[14px] tracking-widest text-on-surface uppercase font-semibold">
              SINGH RENT HOUSE
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-container/20 border border-primary-container/40 text-primary font-mono text-[10px] uppercase">
              ADMIN GATEWAY
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs font-mono text-outline hover:text-primary transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[15px]">person</span>
            Resident Portal
          </Link>
        </div>
      </header>

      {/* Main Form Center Canvas */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-28 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="w-full max-w-[440px] glass-panel rounded-xl p-6 sm:p-8 relative overflow-hidden transition-all duration-300 shadow-2xl"
        >
          {/* Top Decorative Perimeter Accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

          {/* Header Zone */}
          <div className="mb-8 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-container border border-outline-variant/30 mb-3 shadow-inner">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary" />
              </span>
              <span className="font-mono text-[11px] text-tertiary tracking-wider uppercase font-semibold">
                Admin Login Page
              </span>
            </div>
            <h1 className="text-[28px] sm:text-[32px] font-semibold text-on-surface tracking-tight leading-tight">
              Welcome Back
            </h1>
            <p className="text-[14px] text-on-surface-variant mt-1.5">
              Sign in using your verified credentials
            </p>
          </div>

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Admin Email/Identifier */}
            <div className="space-y-1.5 rounded-lg transition-all duration-200">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="identifier"
                  className="font-mono text-[12px] text-on-surface transition-colors duration-150"
                >
                  Admin / Email
                </label>
                <span className="font-mono text-[10px] text-outline">
                  admin@gmail.com
                </span>
              </div>
              <div className="relative group field-glow-box rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors duration-200">
                  <span className="material-symbols-outlined text-[18px]">
                    alternate_email
                  </span>
                </div>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  required
                  autoComplete="username"
                  value={formData.identifier}
                  onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                  placeholder="username or user@gmail.com"
                  className="w-full bg-[rgba(15,23,42,0.7)] border border-white/10 rounded-lg pl-10 pr-10 py-2.5 font-body text-[14px] text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-primary-container transition-all duration-200"
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-outline/50 group-focus-within:text-primary transition-colors duration-200">
                  <span className="material-symbols-outlined text-[18px]">
                    person
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Password Input */}
            <div className="space-y-1.5 rounded-lg transition-all duration-200">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="passwordField"
                  className="font-mono text-[12px] text-on-surface transition-colors duration-150"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="animated-underline font-mono text-[11px] text-primary hover:text-on-surface transition-colors cursor-pointer focus:outline-none"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative group field-glow-box rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors duration-200">
                  <span className="material-symbols-outlined text-[18px]">lock</span>
                </div>
                <input
                  id="passwordField"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full bg-[rgba(15,23,42,0.7)] border border-white/10 rounded-lg pl-10 pr-11 py-2.5 font-body text-[14px] text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-primary-container transition-all duration-200"
                />
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-outline hover:text-primary transition-colors duration-200 focus:outline-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* 3. Remember device & 2FA badge */}
            <div className="flex items-center justify-between pt-1 select-none">
              <label
                htmlFor="rememberDevice"
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <div className="relative flex items-center justify-center">
                  <input
                    id="rememberDevice"
                    type="checkbox"
                    checked={formData.rememberDevice}
                    onChange={(e) => setFormData({ ...formData, rememberDevice: e.target.checked })}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded-[3px] border transition-all duration-200 flex items-center justify-center shadow-inner ${
                      formData.rememberDevice
                        ? "bg-primary-container border-primary-container shadow-[0_0_12px_rgba(79,70,229,0.5)]"
                        : "bg-white/5 border-white/20 group-hover:border-primary/60"
                    }`}
                  >
                    {formData.rememberDevice && (
                      <span className="material-symbols-outlined text-[14px] text-on-primary font-bold">
                        check
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[12px] text-on-surface-variant group-hover:text-on-surface transition-colors">
                  Remember this device
                </span>
              </label>

              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-tertiary/10 border border-tertiary/25 text-tertiary font-mono text-[11px] shadow-[0_0_12px_rgba(78,222,163,0.15)] transition-all duration-200 hover:border-tertiary/40">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-tertiary" />
                </span>
                <span className="font-medium">2FA Active</span>
              </div>
            </div>

            {/* Dynamic Notification Alert */}
            {alertMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-2 p-3 rounded-lg text-xs font-mono border ${
                  authStatus === "error"
                    ? "bg-error-container/20 border-error/30 text-error"
                    : "bg-tertiary/10 border-tertiary/30 text-tertiary"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {authStatus === "error" ? "error" : "verified_user"}
                </span>
                <span>{alertMessage}</span>
              </motion.div>
            )}

            {/* Primary Submit Button */}
            <div className="pt-2">
              <button
                id="submitBtn"
                type="submit"
                disabled={isSubmitting}
                className="btn-shine-effect group relative w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-primary-container hover:bg-[#4338CA] text-white font-mono text-[13px] tracking-wide shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_0_24px_rgba(79,70,229,0.45)] transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] overflow-hidden cursor-pointer disabled:opacity-75 disabled:cursor-wait"
              >
                <span className="relative z-10 flex items-center justify-center gap-2 w-full">
                  <span>
                    {isSubmitting ? "Verifying Zero-Trust Node..." : "Admin Sign In to Account"}
                  </span>
                  <span
                    className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${
                      isSubmitting ? "animate-spin" : "group-hover:translate-x-1.5"
                    }`}
                  >
                    {isSubmitting ? "progress_activity" : "arrow_forward"}
                  </span>
                </span>
              </button>
            </div>
          </form>
        </motion.div>
      </main>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md transition-all duration-300"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-[440px] glass-panel rounded-xl p-6 sm:p-8 overflow-hidden shadow-2xl border border-white/10"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

              <div className="flex justify-between items-start mb-6">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-container border border-outline-variant/30 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                    <span className="font-mono text-[11px] text-primary tracking-wider uppercase font-semibold">
                      Account Recovery
                    </span>
                  </div>
                  <h2 className="text-[20px] font-semibold text-on-surface tracking-tight">
                    Reset Admin Password
                  </h2>
                  <p className="text-[12px] text-on-surface-variant">
                    Enter your registered admin email and we will dispatch a secure recovery token.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close modal"
                  onClick={() => {
                    setIsModalOpen(false);
                    setResetSent(false);
                  }}
                  className="text-outline hover:text-on-surface transition-colors p-1.5 rounded-lg hover:bg-surface-container-high/40 focus:outline-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <form onSubmit={handleRecoverySubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label
                    htmlFor="resetIdentifier"
                    className="block font-mono text-[12px] text-on-surface"
                  >
                    Admin Email
                  </label>
                  <div className="relative group field-glow-box rounded-lg">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[18px]">mail</span>
                    </div>
                    <input
                      id="resetIdentifier"
                      type="text"
                      required
                      value={resetIdentifier}
                      onChange={(e) => setResetIdentifier(e.target.value)}
                      placeholder="admin@gmail.com"
                      className="w-full bg-[rgba(15,23,42,0.7)] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 font-body text-[14px] text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-primary-container transition-all duration-150"
                    />
                  </div>
                </div>

                {resetSent && (
                  <div className="flex items-center gap-2.5 p-3 rounded-lg bg-tertiary/10 border border-tertiary/25 text-tertiary text-xs font-mono">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span>Recovery instructions and OTP dispatched to your admin endpoint.</span>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <button
                    type="submit"
                    className="btn-shine-effect w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-primary-container hover:bg-[#4338CA] text-white font-mono text-[13px] tracking-wide shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all duration-150 active:scale-[0.98] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    <span>Send Reset Link</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setResetSent(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-outline-variant/30 hover:border-primary/50 text-on-surface hover:text-primary transition-all duration-150 font-mono text-[12px] cursor-pointer hover:bg-white/5 active:scale-[0.99]"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    <span>Back to Sign In</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="w-full py-6 px-8 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-outline-variant/15 bg-surface-container-lowest relative z-10">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[12px] text-on-surface-variant font-semibold tracking-wider">
            SINGH RENT HOUSE
          </span>
          <span className="text-outline-variant/40">|</span>
          <p className="text-[12px] text-outline">
            © 2025 RIGHT SINGH RENT HOUSE
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-6 text-xs font-mono text-on-surface-variant">
          <span className="hover:text-on-surface cursor-pointer">Privacy Protocol</span>
          <span className="hover:text-on-surface cursor-pointer">Terms of Authentication</span>
          <span className="hover:text-on-surface cursor-pointer">System Audit</span>
        </nav>
      </footer>
    </div>
  );
}
