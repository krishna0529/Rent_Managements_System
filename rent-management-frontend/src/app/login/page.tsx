"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthFooter from "@/components/auth/AuthFooter";
import ForgotPasswordModal from "@/components/auth/ForgotPasswordModal";
import { LoginFormData } from "@/types/auth";
import { getAdminSession, getUserSession, saveUserSession } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormData>({
    identifier: "",
    password: "",
    rememberDevice: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authStatus, setAuthStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [alertMessage, setAlertMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // 1. If already logged in, redirect away from login page to dashboard
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

    // 2. Check if redirected here due to account deletion or session expiry
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("deleted") === "true") {
        setAuthStatus("error");
        setAlertMessage("Your account has been deleted or deactivated by the administrator. Session terminated.");
      } else if (params.get("expired") === "true") {
        setAuthStatus("error");
        setAlertMessage("Your 12-hour session has ended. Please log in again to continue.");
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.identifier || !formData.password) {
      setAuthStatus("error");
      setAlertMessage("Please provide both username/email and your password.");
      return;
    }

    setIsSubmitting(true);
    setAuthStatus("loading");

    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
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
        setAlertMessage(resData?.message || "Invalid username/email or password.");
        setIsSubmitting(false);
        return;
      }

      if (resData?.data?.token) {
        saveUserSession({
          token: resData.data.token,
          role: resData.data.role,
          fullName: resData.data.fullName,
          profileImagePath: resData.data.profileImagePath,
        });
      }

      setAuthStatus("success");
      setAlertMessage("Credentials validated! Welcome back, " + (resData?.data?.fullName || "User") + ". Redirecting to Dashboard...");

      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch (err: any) {
      setAuthStatus("error");
      setAlertMessage(err?.message || "Could not connect to backend server.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-primary selection:text-on-primary font-body text-[14px] overflow-x-hidden relative">
      {/* Ambient background glow dynamics */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] bg-primary-container/15 blur-[140px] rounded-full pointer-events-none z-0 animate-ambient-pulse" />
      <div className="fixed top-[-80px] right-[-80px] w-[460px] h-[460px] bg-secondary-container/10 blur-[130px] rounded-full pointer-events-none z-0 animate-ambient-mesh" />
      <div className="fixed bottom-[-60px] left-[-60px] w-[380px] h-[380px] bg-tertiary-container/10 blur-[110px] rounded-full pointer-events-none z-0" />

      {/* Header */}
      <AuthHeader actionType="register" />

      {/* Main Form Viewport */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-28 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="w-full max-w-[440px] glass-panel rounded-xl p-6 sm:p-8 relative overflow-hidden transition-all duration-300"
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
                Zero-Trust Node 01
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
            {/* 1. Username or Gmail Login Input */}
            <div className="space-y-1.5 field-glow-box rounded-lg">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="identifier"
                  className="font-mono text-[12px] text-on-surface transition-colors"
                >
                  Username / Email
                </label>
                <span className="font-mono text-[11px] text-outline">
                  RFC-822 / UUID
                </span>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors duration-200">
                  <span className="material-symbols-outlined text-[18px]">
                    alternate_email
                  </span>
                </div>
                <input
                  id="identifier"
                  type="text"
                  required
                  autoComplete="username"
                  value={formData.identifier}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, identifier: e.target.value }))
                  }
                  placeholder="username or user@gmail.com"
                  className="w-full bg-[rgba(15,23,42,0.7)] border border-white/10 rounded-lg pl-10 pr-10 py-2.5 text-[14px] text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/25 transition-all"
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-outline/50 group-focus-within:text-primary transition-colors duration-200">
                  <span className="material-symbols-outlined text-[18px]">
                    person
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Password Input */}
            <div className="space-y-1.5 field-glow-box rounded-lg">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="passwordField"
                  className="font-mono text-[12px] text-on-surface transition-colors"
                >
                  Password
                </label>
                <Link
                  href={formData.identifier ? `/forgot-password?email=${encodeURIComponent(formData.identifier)}` : "/forgot-password"}
                  className="animated-underline font-mono text-[11px] text-primary hover:text-on-surface transition-colors cursor-pointer focus:outline-none rounded px-1 -mr-1"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors duration-200">
                  <span className="material-symbols-outlined text-[18px]">
                    lock
                  </span>
                </div>
                <input
                  id="passwordField"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="••••••••••••"
                  className="w-full bg-[rgba(15,23,42,0.7)] border border-white/10 rounded-lg pl-10 pr-11 py-2.5 text-[14px] text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/25 transition-all font-mono tracking-tight"
                />
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-outline hover:text-primary transition-colors duration-200 focus:outline-none cursor-pointer"
                >
                  <span
                    className={`material-symbols-outlined text-[18px] transition-transform duration-200 active:scale-125 ${
                      showPassword ? "text-primary" : ""
                    }`}
                  >
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember Device & 2FA Badge */}
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
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        rememberDevice: e.target.checked,
                      }))
                    }
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded-[3px] border transition-all duration-200 flex items-center justify-center ${
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
                <span className="text-[13px] text-on-surface-variant group-hover:text-on-surface transition-colors">
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

            {/* Dynamic Status Alert */}
            {authStatus !== "idle" && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-start gap-2.5 p-3.5 rounded-lg text-[13px] border ${
                  authStatus === "success"
                    ? "bg-tertiary/10 border-tertiary/30 text-tertiary shadow-[0_0_12px_rgba(78,222,163,0.15)]"
                    : alertMessage.includes("ACCOUNT_PENDING")
                    ? "bg-secondary/15 border-secondary/40 text-secondary shadow-[0_0_16px_rgba(76,215,246,0.2)]"
                    : alertMessage.includes("ACCOUNT_REJECTED")
                    ? "bg-error/15 border-error/40 text-error"
                    : authStatus === "error"
                    ? "bg-error/10 border-error/30 text-error"
                    : "bg-primary/10 border-primary/30 text-primary animate-pulse"
                }`}
              >
                <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">
                  {authStatus === "success"
                    ? "verified_user"
                    : alertMessage.includes("ACCOUNT_PENDING")
                    ? "hourglass_top"
                    : alertMessage.includes("ACCOUNT_REJECTED")
                    ? "block"
                    : authStatus === "error"
                    ? "error"
                    : "progress_activity"}
                </span>
                <div className="flex flex-col">
                  {alertMessage.includes("ACCOUNT_PENDING") ? (
                    <>
                      <span className="font-bold text-secondary font-mono text-[12px] uppercase tracking-wider">
                        Approval In Progress
                      </span>
                      <span className="text-on-surface text-xs mt-0.5 leading-relaxed">
                        Your registration is currently under review by Property Administration. You will gain full portal access once your Aadhaar KYC is verified by the landlord.
                      </span>
                    </>
                  ) : alertMessage.includes("ACCOUNT_REJECTED") ? (
                    <>
                      <span className="font-bold text-error font-mono text-[12px] uppercase tracking-wider">
                        Application Rejected
                      </span>
                      <span className="text-on-surface text-xs mt-0.5 leading-relaxed">
                        {alertMessage.replace("ACCOUNT_REJECTED: ", "")}
                      </span>
                    </>
                  ) : (
                    <span>{alertMessage}</span>
                  )}
                </div>
              </motion.div>
            )}

            {/* Primary Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`shine-btn group relative w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-mono text-[14px] font-semibold tracking-wide shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] overflow-hidden cursor-pointer ${
                  authStatus === "success"
                    ? "bg-tertiary-container text-on-tertiary-container shadow-[0_0_24px_rgba(78,222,163,0.4)]"
                    : "bg-primary-container hover:bg-inverse-primary text-on-primary hover:shadow-[0_0_24px_rgba(79,70,229,0.45)]"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-5 w-5 text-on-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Verifying Zero-Trust Node...</span>
                  </>
                ) : authStatus === "success" ? (
                  <>
                    <span className="material-symbols-outlined text-[18px]">
                      check
                    </span>
                    <span>Authorized</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Account</span>
                    <span className="material-symbols-outlined text-[18px] transition-transform duration-200 group-hover:translate-x-1.5">
                      arrow_forward
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Switch Link */}
            <div className="pt-2 text-center">
              <p className="text-[13px] text-on-surface-variant">
                Don&apos;t have an account yet?{" "}
                <Link
                  href="/register"
                  className="animated-underline text-primary hover:text-on-surface font-semibold ml-1 transition-all"
                >
                  Register here
                </Link>
              </p>
            </div>
          </form>
        </motion.div>
      </main>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Footer */}
      <AuthFooter />
    </div>
  );
}
