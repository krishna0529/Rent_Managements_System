"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthFooter from "@/components/auth/AuthFooter";
import { getAdminSession, getUserSession } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // OTP states
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Submit states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetStatus, setResetStatus] = useState<"idle" | "loading" | "success">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
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

    // Pre-fill email from URL search params if present
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const emailParam = params.get("email");
      if (emailParam) {
        setEmail(emailParam);
      }
    }
  }, [router]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerActive && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsTimerActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, countdown]);

  const handleSendOtp = async () => {
    if (!email || !email.includes("@")) {
      setErrorMessage("Please enter a valid registered email address first.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSendingOtp(true);

    try {
      const response = await fetch("http://localhost:8080/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to dispatch verification code.");
      }

      setOtpSent(true);
      setOtpMessage("6-digit verification code has been dispatched to " + email.trim());
      setCountdown(60);
      setIsTimerActive(true);

      // Focus first OTP input
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error dispatching OTP code. Make sure backend is running.";
      setErrorMessage(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResendOtp = () => {
    if (!isTimerActive) {
      handleSendOtp();
    }
  };

  const handleOtpChange = (val: string, index: number) => {
    const cleanVal = val.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = cleanVal;
    setOtp(newOtp);

    // Auto-focus next input
    if (cleanVal && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Password entropy analysis
  const ruleLen = newPassword.length >= 8;
  const ruleUpper = /[A-Z]/.test(newPassword);
  const ruleLower = /[a-z]/.test(newPassword);
  const ruleSpecial = /[@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword);
  const entropyScore = [ruleLen, ruleUpper, ruleLower, ruleSpecial].filter(Boolean).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const fullOtp = otp.join("");

    if (!email || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (fullOtp.length < 6) {
      setErrorMessage("Please enter the complete 6-digit OTP verification code.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("New password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirmation password do not match.");
      return;
    }

    setIsSubmitting(true);
    setResetStatus("loading");

    try {
      const response = await fetch("http://localhost:8080/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          otp: fullOtp,
          newPassword: newPassword,
          confirmPassword: confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid or expired OTP. Password reset failed.");
      }

      setResetStatus("success");
      setSuccessMessage("Password reset successfully! Redirecting to login...");

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Password reset failed. Please check your OTP and try again.";
      setErrorMessage(msg);
      setResetStatus("idle");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBarColor = (barIndex: number) => {
    if (barIndex <= entropyScore) {
      if (entropyScore <= 1) return "bg-error shadow-[0_0_8px_rgba(255,180,171,0.5)]";
      if (entropyScore === 2) return "bg-secondary-container shadow-[0_0_8px_rgba(3,181,211,0.5)]";
      if (entropyScore === 3) return "bg-secondary shadow-[0_0_8px_rgba(76,215,246,0.5)]";
      return "bg-tertiary shadow-[0_0_10px_rgba(78,222,163,0.7)]";
    }
    return "bg-outline-variant/30";
  };

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-primary-container selection:text-on-primary font-body text-[14px] antialiased overflow-x-hidden cyber-grid relative">
      {/* Ambient floating orbs */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[520px] bg-primary-container/20 blur-[130px] rounded-full pointer-events-none -z-10 animate-ambient-pulse" />
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[420px] h-[320px] bg-[#06b6d4]/15 blur-[100px] rounded-full pointer-events-none -z-10" />
      <div className="fixed top-[55%] left-1/2 -translate-x-1/2 w-[340px] h-[260px] bg-[#4f46e5]/15 blur-[85px] rounded-full pointer-events-none -z-10" />

      {/* Header */}
      <AuthHeader actionType="login" />

      {/* Main Viewport */}
      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 py-28 md:py-24 z-10">
        <div className="w-full max-w-[480px]">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="relative rounded-xl bg-surface-container/85 backdrop-blur-xl border border-white/10 p-6 sm:p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8),0_0_30px_rgba(79,70,229,0.08)] transition-all duration-300 hover:border-white/20 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(79,70,229,0.15)]"
          >
            {/* Top Specular Edge Line */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

            {/* Node Status Badge */}
            <div className="flex items-center justify-between mb-5">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-surface-container-lowest border border-outline-variant/30 text-secondary font-mono text-[11px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-secondary shadow-[0_0_6px_#4cd7f6]" />
                </span>
                <span>ZERO-TRUST RECOVERY NODE 01</span>
              </div>
              <div className="flex items-center text-outline text-[11px] font-mono tracking-wider">
                <span>TLS v1.3</span>
              </div>
            </div>

            {/* Header Content */}
            <div className="mb-6">
              <h1 className="text-[22px] sm:text-[24px] font-semibold text-on-surface tracking-tight flex items-center gap-2">
                Reset Account Password
              </h1>
              <p className="mt-1 text-on-surface-variant text-[14px] leading-relaxed">
                Enter your registered Gmail and establish a hardened cryptographic key.
              </p>
            </div>

            {/* Error and Success Notifications */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mb-4 flex items-center gap-2.5 p-3 rounded-lg bg-error/15 border border-error/30 text-error text-[13px] font-mono"
                >
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span>{errorMessage}</span>
                </motion.div>
              )}

              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mb-4 flex items-center gap-2.5 p-3 rounded-lg bg-tertiary/15 border border-tertiary/35 text-tertiary text-[13px] font-mono"
                >
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  <span>{successMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 1. Gmail / Email Address */}
              <div className="space-y-1.5 field-glow-box rounded-lg">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="resetEmail"
                    className="block font-mono text-[12px] text-on-surface font-medium"
                  >
                    Gmail / Email Address
                  </label>
                  <span className="font-mono text-[11px] text-tertiary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px] animate-pulse">
                      mark_email_read
                    </span>
                    OTP Channel
                  </span>
                </div>
                <div className="relative group flex gap-2">
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline group-focus-within:text-secondary transition-colors duration-200">
                      <span className="material-symbols-outlined text-[18px]">
                        mail
                      </span>
                    </div>
                    <input
                      id="resetEmail"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. yourname@gmail.com"
                      className="w-full pl-10 pr-3 py-2.5 rounded bg-surface-container-lowest/80 border border-white/10 text-on-surface placeholder:text-outline/70 text-[14px] focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/25 transition-all duration-200 hover:border-white/20"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isSendingOtp || (isTimerActive && countdown > 0)}
                    className="px-3.5 py-2.5 rounded bg-secondary/15 hover:bg-secondary/25 text-secondary border border-secondary/30 font-mono text-[12px] font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap flex items-center gap-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]"
                  >
                    {isSendingOtp ? (
                      <>
                        <span className="material-symbols-outlined text-[16px] animate-spin">
                          progress_activity
                        </span>
                        <span>Sending...</span>
                      </>
                    ) : otpSent ? (
                      <>
                        <span className="material-symbols-outlined text-[16px]">
                          check
                        </span>
                        <span>Code Sent</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">
                          send
                        </span>
                        <span>Send OTP</span>
                      </>
                    )}
                  </button>
                </div>

                {otpMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -3 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-2 rounded bg-tertiary/10 border border-tertiary/20 text-tertiary font-mono text-[11px] flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    <span>{otpMessage}</span>
                  </motion.div>
                )}

                <p className="font-mono text-[11px] text-outline flex items-center gap-1.5 pt-0.5">
                  <span className="material-symbols-outlined text-[13px]">
                    info
                  </span>
                  6-digit verification code will be sent to your Gmail inbox.
                </p>
              </div>

              {/* 2. 6-Digit OTP Section */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block font-mono text-[12px] text-on-surface font-medium">
                    Verification Code (6-Digit OTP)
                  </label>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isTimerActive || isSendingOtp}
                    className={`font-mono text-[11px] transition-all duration-200 flex items-center gap-1 group cursor-pointer ${
                      isTimerActive
                        ? "text-secondary cursor-not-allowed opacity-80"
                        : "text-secondary hover:text-primary active:scale-95 underline"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[13px] group-hover:rotate-180 transition-transform duration-500">
                      cached
                    </span>
                    <span>
                      {isTimerActive
                        ? `Resend OTP (${String(Math.floor(countdown / 60)).padStart(2, "0")}:${String(countdown % 60).padStart(2, "0")})`
                        : "Resend OTP"}
                    </span>
                  </button>
                </div>

                {/* 6 OTP Boxes */}
                <div className="grid grid-cols-6 gap-2 pt-1">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputsRef.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, idx)}
                      onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                      placeholder="-"
                      className="w-full h-11 text-center font-mono text-[16px] font-semibold rounded bg-surface-container-lowest/80 border border-white/10 text-primary placeholder:text-outline/40 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/25 hover:border-secondary/40 transition-all duration-200 focus:scale-[1.04]"
                    />
                  ))}
                </div>
                <p className="font-mono text-[11px] text-outline flex items-center gap-1.5 pt-0.5">
                  <span className="material-symbols-outlined text-[13px]">
                    verified
                  </span>
                  Enter the 6-digit verification code sent to your registered Gmail address.
                </p>
              </div>

              {/* 3. New Password */}
              <div className="space-y-1.5 pt-1 field-glow-box rounded-lg">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="newPassword"
                    className="block font-mono text-[12px] text-on-surface font-medium"
                  >
                    New Password
                  </label>
                  <span
                    className={`font-mono text-[11px] transition-colors duration-200 ${
                      entropyScore === 4
                        ? "text-tertiary font-semibold"
                        : entropyScore >= 2
                        ? "text-secondary font-medium"
                        : "text-outline"
                    }`}
                  >
                    Entropy: {entropyScore}/4
                  </span>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors duration-200">
                    <span className="material-symbols-outlined text-[18px]">
                      lock
                    </span>
                  </div>
                  <input
                    id="newPassword"
                    type={showNewPass ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter cryptographically secure key"
                    className="w-full pl-10 pr-10 py-2.5 rounded bg-surface-container-lowest/80 border border-white/10 text-on-surface placeholder:text-outline/70 text-[14px] focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/25 transition-all duration-200 font-mono tracking-tight hover:border-white/20"
                  />
                  <button
                    type="button"
                    aria-label="Toggle password visibility"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-surface transition-all duration-200 focus:outline-none hover:scale-110 active:scale-95 cursor-pointer"
                  >
                    <span
                      className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${
                        showNewPass ? "text-primary" : ""
                      }`}
                    >
                      {showNewPass ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>

                {/* Segmented Entropy Bar */}
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  <div className={`h-1 rounded-full transition-all duration-300 ease-out ${getBarColor(1)}`} />
                  <div className={`h-1 rounded-full transition-all duration-300 ease-out ${getBarColor(2)}`} />
                  <div className={`h-1 rounded-full transition-all duration-300 ease-out ${getBarColor(3)}`} />
                  <div className={`h-1 rounded-full transition-all duration-300 ease-out ${getBarColor(4)}`} />
                </div>

                {/* Cryptographic Validation Checklist */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 pt-1.5 text-outline font-mono text-[11px]">
                  <div className={`flex items-center gap-1.5 transition-all duration-200 ${ruleLen ? "text-tertiary" : ""}`}>
                    <span className="material-symbols-outlined text-[13px]">
                      {ruleLen ? "check_circle" : "radio_button_unchecked"}
                    </span>
                    <span>8-12+ characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 transition-all duration-200 ${ruleUpper ? "text-tertiary" : ""}`}>
                    <span className="material-symbols-outlined text-[13px]">
                      {ruleUpper ? "check_circle" : "radio_button_unchecked"}
                    </span>
                    <span>Capital letter (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 transition-all duration-200 ${ruleLower ? "text-tertiary" : ""}`}>
                    <span className="material-symbols-outlined text-[13px]">
                      {ruleLower ? "check_circle" : "radio_button_unchecked"}
                    </span>
                    <span>Small letter (a-z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 transition-all duration-200 ${ruleSpecial ? "text-tertiary" : ""}`}>
                    <span className="material-symbols-outlined text-[13px]">
                      {ruleSpecial ? "check_circle" : "radio_button_unchecked"}
                    </span>
                    <span>Special symbol (@, #, $)</span>
                  </div>
                </div>
              </div>

              {/* 4. Confirm New Password */}
              <div className="space-y-1.5 pt-1 field-glow-box rounded-lg">
                <label
                  htmlFor="confirmResetPassword"
                  className="block font-mono text-[12px] text-on-surface font-medium"
                >
                  Confirm New Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors duration-200">
                    <span className="material-symbols-outlined text-[18px]">
                      key
                    </span>
                  </div>
                  <input
                    id="confirmResetPassword"
                    type={showConfirmPass ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="w-full pl-10 pr-10 py-2.5 rounded bg-surface-container-lowest/80 border border-white/10 text-on-surface placeholder:text-outline/70 text-[14px] focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/25 transition-all duration-200 font-mono tracking-tight hover:border-white/20"
                  />
                  <button
                    type="button"
                    aria-label="Toggle password visibility"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-surface transition-all duration-200 focus:outline-none hover:scale-110 active:scale-95 cursor-pointer"
                  >
                    <span
                      className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${
                        showConfirmPass ? "text-primary" : ""
                      }`}
                    >
                      {showConfirmPass ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* 5. Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full relative overflow-hidden group flex items-center justify-center gap-2 py-3 px-4 rounded font-mono text-[13px] font-semibold tracking-wide transition-all duration-200 active:scale-[0.98] border-t border-white/25 cursor-pointer ${
                    resetStatus === "success"
                      ? "bg-tertiary-container text-on-tertiary-container shadow-[0_0_24px_rgba(0,110,75,0.7)]"
                      : "bg-primary-container hover:bg-inverse-primary text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_28px_rgba(79,70,229,0.65)]"
                  }`}
                >
                  <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer pointer-events-none" />
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">
                        progress_activity
                      </span>
                      <span className="relative z-10 font-mono tracking-tight">
                        Updating Password...
                      </span>
                    </>
                  ) : resetStatus === "success" ? (
                    <>
                      <span className="material-symbols-outlined text-[18px]">
                        check_circle
                      </span>
                      <span className="relative z-10 font-semibold">
                        Password Reset Verified!
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="relative z-10">Reset & Change Password</span>
                      <span className="material-symbols-outlined text-[18px] transition-transform duration-200 ease-out group-hover:translate-x-1.5 relative z-10">
                        arrow_forward
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Auxiliary Navigation */}
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[13px]">
              <Link
                href="/login"
                className="group font-body text-on-surface-variant hover:text-primary transition-colors duration-200 flex items-center gap-1.5 active:scale-98"
              >
                <span className="material-symbols-outlined text-[15px] transition-transform duration-200 ease-out group-hover:-translate-x-1">
                  arrow_back
                </span>
                <span>
                  Remember your password?{" "}
                  <span className="text-primary font-medium group-hover:underline ml-0.5">
                    Sign In
                  </span>
                </span>
              </Link>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <AuthFooter />
    </div>
  );
}
