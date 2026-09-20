"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthFooter from "@/components/auth/AuthFooter";
import AuthCard from "@/components/auth/AuthCard";
import AvatarUpload from "@/components/auth/AvatarUpload";
import DocumentDropzone from "@/components/auth/DocumentDropzone";
import PasswordInput from "@/components/auth/PasswordInput";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";
import { RegisterFormData } from "@/types/auth";
import { getAdminSession, getUserSession } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterFormData>({
    profileImage: null,
    fullName: "",
    username: "",
    email: "",
    mobileNumber: "",
    fullAddress: "",
    aadhaarNumber: "",
    aadhaarDocument: null,
    dateOfJoining: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

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
  }, [router]);

  // Format Aadhaar card number into XXXX-XXXX-XXXX
  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "").substring(0, 12);
    const parts: string[] = [];
    for (let i = 0; i < rawVal.length; i += 4) {
      parts.push(rawVal.substring(i, i + 4));
    }
    setFormData((prev) => ({ ...prev, aadhaarNumber: parts.join("-") }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.termsAccepted) {
      alert("Please accept the terms and authentication protocol.");
      return;
    }

    if (!formData.mobileNumber || formData.mobileNumber.length !== 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("loading");
    setStatusMessage("Saving user data to database & encrypting credentials...");

    try {
      const payload = new FormData();
      payload.append("fullName", formData.fullName);
      payload.append("username", formData.username);
      payload.append("email", formData.email);
      payload.append("mobileNumber", formData.mobileNumber);
      payload.append("fullAddress", formData.fullAddress);
      payload.append("aadhaarNumber", formData.aadhaarNumber);
      payload.append("dateOfJoining", formData.dateOfJoining);
      payload.append("password", formData.password);
      payload.append("confirmPassword", formData.confirmPassword);

      if (formData.profileImage) {
        payload.append("profileImage", formData.profileImage);
      }
      if (formData.aadhaarDocument) {
        payload.append("aadhaarDocument", formData.aadhaarDocument);
      }

      const response = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        body: payload,
      });

      const resData = await response.json();

      if (!response.ok) {
        setSubmitStatus("error");
        let errorMsg = resData?.message || "Registration failed. Please check your details.";
        if (resData?.data && typeof resData.data === "object") {
          errorMsg = Object.values(resData.data).join(", ");
        }
        setStatusMessage(errorMsg);
        setIsSubmitting(false);
        return;
      }

      setSubmitStatus("success");
      setStatusMessage("Account registered & saved in database! Redirecting to Login...");

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: any) {
      setSubmitStatus("error");
      setStatusMessage(
        err?.message || "Could not connect to backend server. Make sure backend is running on port 8080."
      );
      setIsSubmitting(false);
    }
  };

  // Framer motion variants for smooth staggered form entrance
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: "easeOut" as const },
    },
  };

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-primary-container selection:text-on-primary-container relative overflow-x-hidden">
      <AuthHeader actionType="login" />

      <main className="flex-grow flex items-center justify-center pt-28 pb-16 px-4 sm:px-6 lg:px-8 relative z-10">
        <AuthCard
          title="Create Member Account"
          subtitle="Complete verification and authentication details"
          badgeText="SECURITY PROTOCOL"
          maxWidth="max-w-2xl"
        >
          <motion.form
            variants={containerVariants}
            initial="hidden"
            animate="show"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* 1. Profile Image Upload with Preview */}
            <motion.div variants={itemVariants}>
              <AvatarUpload
                onImageSelected={(file) =>
                  setFormData((prev) => ({ ...prev, profileImage: file }))
                }
              />
            </motion.div>

            {/* 2. Full Name */}
            <motion.div variants={itemVariants} className="space-y-1.5 field-glow-box rounded-lg">
              <label
                htmlFor="fullName"
                className="block font-mono text-[12px] text-on-surface-variant transition-colors group-focus-within:text-primary"
              >
                Full Name
              </label>
              <div className="relative flex items-center group">
                <span className="material-symbols-outlined absolute left-3 text-outline pointer-events-none text-[20px] transition-colors group-focus-within:text-primary">
                  person
                </span>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, fullName: e.target.value }))
                  }
                  placeholder="e.g. Alistair Sterling Vance"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface-container-lowest/80 border border-outline-variant/40 text-on-surface placeholder:text-outline/60 text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none focus:shadow-[0_0_16px_rgba(195,192,255,0.15)] transition-all shadow-inner"
                />
              </div>
            </motion.div>

            {/* 3. Username & Gmail Address Dual Grid */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 field-glow-box rounded-lg">
                <label
                  htmlFor="username"
                  className="block font-mono text-[12px] text-on-surface-variant"
                >
                  Username
                </label>
                <div className="relative flex items-center group">
                  <span className="material-symbols-outlined absolute left-3 text-outline pointer-events-none text-[20px] transition-colors group-focus-within:text-primary">
                    alternate_email
                  </span>
                  <input
                    id="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, username: e.target.value }))
                    }
                    placeholder="ast_vance"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface-container-lowest/80 border border-outline-variant/40 text-on-surface placeholder:text-outline/60 font-mono text-[13px] focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none focus:shadow-[0_0_16px_rgba(195,192,255,0.15)] transition-all"
                  />
                </div>
                <p className="font-mono text-[11px] text-outline-variant">
                  Lowercase alphanumeric, min. 4 chars
                </p>
              </div>

              <div className="space-y-1.5 field-glow-box rounded-lg">
                <label
                  htmlFor="email"
                  className="block font-mono text-[12px] text-on-surface-variant"
                >
                  Gmail / Email
                </label>
                <div className="relative flex items-center group">
                  <span className="material-symbols-outlined absolute left-3 text-outline pointer-events-none text-[20px] transition-colors group-focus-within:text-primary">
                    mail
                  </span>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="alistair.vance@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface-container-lowest/80 border border-outline-variant/40 text-on-surface placeholder:text-outline/60 text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none focus:shadow-[0_0_16px_rgba(195,192,255,0.15)] transition-all"
                  />
                </div>
                <p className="font-mono text-[11px] text-outline-variant">
                  Requires 2FA verification link
                </p>
              </div>
            </motion.div>

            {/* Mobile Phone Number */}
            <motion.div variants={itemVariants} className="space-y-1.5 field-glow-box rounded-lg">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="mobileNumber"
                  className="block font-mono text-[12px] text-on-surface-variant"
                >
                  Mobile Number
                </label>
                <span className="font-mono text-[11px] text-secondary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">phone_in_talk</span>
                  SMS / Call Verification
                </span>
              </div>
              <div className="relative flex items-center group">
                <span className="material-symbols-outlined absolute left-3 text-outline pointer-events-none text-[20px] transition-colors group-focus-within:text-primary">
                  call
                </span>
                <span className="absolute left-10 text-outline font-mono text-[13px] pointer-events-none pl-0.5 border-r border-outline-variant/30 pr-2.5">
                  +91
                </span>
                <input
                  id="mobileNumber"
                  type="tel"
                  required
                  maxLength={10}
                  value={formData.mobileNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setFormData((prev) => ({ ...prev, mobileNumber: val }));
                  }}
                  placeholder="98765 43210"
                  className="w-full pl-24 pr-4 py-2.5 rounded-lg bg-surface-container-lowest/80 border border-outline-variant/40 text-on-surface placeholder:text-outline/60 font-mono text-[14px] tracking-wider focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none focus:shadow-[0_0_16px_rgba(195,192,255,0.15)] transition-all"
                />
              </div>
              <p className="font-mono text-[11px] text-outline-variant">
                10-digit primary mobile contact number for tenant authentication
              </p>
            </motion.div>

            {/* 4. Full Residential Address */}
            <motion.div variants={itemVariants} className="space-y-1.5 field-glow-box rounded-lg">
              <label
                htmlFor="fullAddress"
                className="block font-mono text-[12px] text-on-surface-variant"
              >
                Full Residential Address
              </label>
              <div className="relative">
                <textarea
                  id="fullAddress"
                  required
                  rows={3}
                  value={formData.fullAddress}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, fullAddress: e.target.value }))
                  }
                  placeholder="Building, Suite, Street name, City, State, ZIP / Postal Code..."
                  className="w-full p-3 rounded-lg bg-surface-container-lowest/80 border border-outline-variant/40 text-on-surface placeholder:text-outline/60 text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none focus:shadow-[0_0_16px_rgba(195,192,255,0.15)] transition-all resize-none shadow-inner"
                />
              </div>
              <div className="flex justify-between items-center font-mono text-[11px] text-outline">
                <span>Include official postal code & city jurisdiction</span>
                <span className="flex items-center gap-1 text-tertiary">
                  <span className="material-symbols-outlined text-[13px]">lock</span>
                  Zero-Trust Encrypted
                </span>
              </div>
            </motion.div>

            {/* 5. Aadhaar Card Number */}
            <motion.div variants={itemVariants} className="space-y-1.5 field-glow-box rounded-lg">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="aadhaarNumber"
                  className="block font-mono text-[12px] text-on-surface-variant"
                >
                  Aadhaar Card Number (12-Digit)
                </label>
                <span className="flex items-center gap-1 font-mono text-[11px] text-tertiary transition-transform hover:scale-105">
                  <span className="material-symbols-outlined text-[14px]">
                    verified_user
                  </span>
                  UIDAI Compliant
                </span>
              </div>
              <div className="relative flex items-center group">
                <span className="material-symbols-outlined absolute left-3 text-outline pointer-events-none text-[20px] transition-colors group-focus-within:text-primary">
                  shield
                </span>
                <input
                  id="aadhaarNumber"
                  type="text"
                  required
                  maxLength={14}
                  value={formData.aadhaarNumber}
                  onChange={handleAadhaarChange}
                  placeholder="XXXX-XXXX-XXXX"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface-container-lowest/80 border border-outline-variant/40 text-on-surface placeholder:text-outline/60 font-mono text-[14px] tracking-wider focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none focus:shadow-[0_0_16px_rgba(195,192,255,0.15)] transition-all"
                />
              </div>
            </motion.div>

            {/* 6. Aadhaar Verification Document Upload */}
            <motion.div variants={itemVariants}>
              <DocumentDropzone
                onDocumentSelected={(file) =>
                  setFormData((prev) => ({ ...prev, aadhaarDocument: file }))
                }
              />
            </motion.div>

            {/* 7. Date of Joining */}
            <motion.div variants={itemVariants} className="space-y-1.5 field-glow-box rounded-lg">
              <label
                htmlFor="doj"
                className="block font-mono text-[12px] text-on-surface-variant"
              >
                Date of Joining
              </label>
              <div className="relative flex items-center group">
                <span className="material-symbols-outlined absolute left-3 text-outline pointer-events-none text-[20px] transition-colors group-focus-within:text-primary">
                  calendar_today
                </span>
                <input
                  id="doj"
                  type="date"
                  required
                  value={formData.dateOfJoining}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, dateOfJoining: e.target.value }))
                  }
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface-container-lowest/80 border border-outline-variant/40 text-on-surface text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none focus:shadow-[0_0_16px_rgba(195,192,255,0.15)] transition-all cursor-pointer"
                />
              </div>
              <p className="font-mono text-[11px] text-outline-variant">
                Enterprise effective member initialization date
              </p>
            </motion.div>

            {/* 8. Password & Confirm Password */}
            <motion.div
              variants={itemVariants}
              className="space-y-4 pt-2 border-t border-outline-variant/15"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PasswordInput
                  id="password"
                  label="Access Password"
                  value={formData.password}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, password: val }))
                  }
                  iconName="lock_open"
                />
                <PasswordInput
                  id="confirmPassword"
                  label="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, confirmPassword: val }))
                  }
                  iconName="verified"
                />
              </div>

              {/* Real-time Entropy & Rules */}
              <PasswordStrengthMeter
                password={formData.password}
                confirmPassword={formData.confirmPassword}
                showMatchRule={true}
              />
            </motion.div>

            {/* 9. Terms & Conditions Agreement */}
            <motion.div variants={itemVariants} className="flex items-start gap-3 pt-2">
              <label
                htmlFor="terms"
                className="cursor-pointer flex items-center gap-3 select-none"
              >
                <input
                  id="terms"
                  type="checkbox"
                  required
                  checked={formData.termsAccepted}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      termsAccepted: e.target.checked,
                    }))
                  }
                  className="sr-only"
                />
                <span
                  className={`w-4 h-4 rounded-[3px] border flex items-center justify-center transition-all duration-200 ${
                    formData.termsAccepted
                      ? "bg-primary-container border-primary shadow-[0_0_10px_rgba(79,70,229,0.45)] scale-105"
                      : "bg-surface-container border-outline-variant/40"
                  }`}
                >
                  {formData.termsAccepted && (
                    <span className="material-symbols-outlined text-[14px] text-on-primary-container font-bold">
                      check
                    </span>
                  )}
                </span>
                <span className="text-[13px] text-on-surface-variant leading-relaxed">
                  I certify that the provided Aadhaar and credential details are legally authentic, and I agree to the{" "}
                  <Link href="#terms" className="text-primary hover:underline">
                    Terms of Authentication
                  </Link>{" "}
                  and{" "}
                  <Link href="#privacy" className="text-primary hover:underline">
                    Privacy Protocol
                  </Link>
                  .
                </span>
              </label>
            </motion.div>

            {/* Status Alert */}
            {submitStatus !== "idle" && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg font-mono text-[12px] flex items-center gap-2 border ${
                  submitStatus === "success"
                    ? "bg-tertiary-container/20 border-tertiary/40 text-tertiary shadow-[0_0_16px_rgba(78,222,163,0.2)]"
                    : "bg-primary-container/20 border-primary/40 text-primary animate-pulse"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {submitStatus === "success" ? "check_circle" : "progress_activity"}
                </span>
                <span>{statusMessage}</span>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.div variants={itemVariants} className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`shine-btn group w-full py-3 px-6 rounded-lg font-mono text-[14px] font-semibold tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  submitStatus === "success"
                    ? "bg-tertiary-container text-on-tertiary-container shadow-[0_0_30px_rgba(78,222,163,0.5)]"
                    : "bg-primary-container text-on-primary-container shadow-[0_0_20px_-4px_rgba(79,70,229,0.5)] hover:bg-inverse-primary hover:shadow-[0_0_28px_rgba(79,70,229,0.7)] active:scale-[0.98]"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-5 w-5 text-on-primary-container"
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
                    <span>Provisioning Security Keys...</span>
                  </>
                ) : submitStatus === "success" ? (
                  <>
                    <span className="material-symbols-outlined text-[20px]">
                      check_circle
                    </span>
                    <span>Registration Complete!</span>
                  </>
                ) : (
                  <>
                    <span>Register Account</span>
                    <span className="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:translate-x-1.5">
                      arrow_forward
                    </span>
                  </>
                )}
              </button>
            </motion.div>

            {/* Quick link to sign in */}
            <motion.div variants={itemVariants} className="text-center pt-2">
              <p className="text-[14px] text-on-surface-variant">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-primary font-medium hover:underline hover:text-on-primary-container transition-colors"
                >
                  Sign In
                </Link>
              </p>
            </motion.div>
          </motion.form>
        </AuthCard>
      </main>

      <AuthFooter />
    </div>
  );
}
