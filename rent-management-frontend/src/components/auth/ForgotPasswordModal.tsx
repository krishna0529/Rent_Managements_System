"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({
  isOpen,
  onClose,
}: ForgotPasswordModalProps) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("http://localhost:8080/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to dispatch recovery code.");
      }

      setIsSent(true);
      setTimeout(() => {
        handleModalClose();
        router.push(`/forgot-password?email=${encodeURIComponent(identifier.trim())}`);
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error contacting authentication server.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setIsSent(false);
    setIdentifier("");
    setErrorMessage(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleModalClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative w-full max-w-[440px] glass-panel rounded-xl p-6 sm:p-8 overflow-hidden shadow-2xl border border-white/10 z-10"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modalTitle"
          >
            {/* Top perimeter line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-container border border-outline-variant/30 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                  <span className="font-mono text-[11px] text-primary tracking-wider uppercase font-semibold">
                    Account Recovery
                  </span>
                </div>
                <h2
                  id="modalTitle"
                  className="text-[20px] font-semibold text-on-surface tracking-tight"
                >
                  Reset Your Password
                </h2>
                <p className="text-[13px] text-on-surface-variant leading-relaxed">
                  Enter your registered email or username and we will send you an
                  authentication recovery link or OTP.
                </p>
              </div>

              <button
                type="button"
                onClick={handleModalClose}
                aria-label="Close modal"
                className="text-outline hover:text-on-surface transition-colors p-1.5 rounded-lg hover:bg-surface-container-high/40 focus:outline-none cursor-pointer hover:rotate-90 duration-200"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5 field-glow-box rounded-lg">
                <label
                  htmlFor="resetIdentifier"
                  className="block font-mono text-[12px] text-on-surface font-medium"
                >
                  Email or Username
                </label>
                <div className="relative flex items-center group">
                  <span className="material-symbols-outlined absolute left-3.5 text-outline pointer-events-none text-[18px] transition-colors group-focus-within:text-primary">
                    mail
                  </span>
                  <input
                    id="resetIdentifier"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="user@gmail.com or username"
                    className="w-full bg-[rgba(15,23,42,0.7)] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-[14px] text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/25 transition-all"
                  />
                </div>
              </div>

              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2.5 p-3 rounded-lg bg-error/15 border border-error/30 text-error text-[13px] font-mono"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    error
                  </span>
                  <span>{errorMessage}</span>
                </motion.div>
              )}

              {isSent && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2.5 p-3 rounded-lg bg-tertiary/10 border border-tertiary/25 text-tertiary text-[13px]"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    check_circle
                  </span>
                  <span>
                    Recovery instructions and OTP dispatched! Redirecting to OTP page...
                  </span>
                </motion.div>
              )}

              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="shine-btn w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-primary-container hover:bg-inverse-primary text-on-primary font-mono text-[13px] font-semibold tracking-wide shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all active:scale-[0.98] cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">
                        progress_activity
                      </span>
                      <span>Dispatching Link...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">
                        send
                      </span>
                      <span>Send Reset Link</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between pt-1 text-[13px]">
                  <Link
                    href="/forgot-password"
                    onClick={handleModalClose}
                    className="text-primary hover:underline font-mono text-[12px] flex items-center gap-1"
                  >
                    <span>Use 6-Digit OTP Page</span>
                    <span className="material-symbols-outlined text-[14px]">
                      open_in_new
                    </span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleModalClose}
                    className="text-on-surface-variant hover:text-on-surface font-mono text-[12px] transition-colors cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
