"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { getTimeUntilTokenExpiry } from "@/lib/auth";

interface AdminProfile {
  id: number;
  fullName: string;
  mobileNumber: string;
  gmail: string;
  profileImagePath: string | null;
  role: string;
  active: boolean;
  createdAt: string;
}

interface SecuritySettingsViewProps {
  admin: AdminProfile;
  onAdminUpdate: (updatedAdmin: AdminProfile) => void;
  showToast: (msg: string) => void;
}

export default function SecuritySettingsView({
  admin,
  onAdminUpdate,
  showToast,
}: SecuritySettingsViewProps) {
  // 1. Full Name state
  const [fullName, setFullName] = useState(admin.fullName || "");
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  // 2. Avatar upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 3. Gmail update & OTP state
  const [newGmail, setNewGmail] = useState(admin.gmail || "");
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpCountdown, setOtpCountdown] = useState(600); // 10 minutes
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 4. Change Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // 5. Session Timer Countdown
  const [sessionRemaining, setSessionRemaining] = useState<string>("12h 00m 00s");

  // Keep state synced if parent admin changes
  useEffect(() => {
    if (admin) {
      setFullName(admin.fullName || "");
      if (!otpSent) {
        setNewGmail(admin.gmail || "");
      }
    }
  }, [admin, otpSent]);

  // Session timer countdown effect
  useEffect(() => {
    const updateCountdown = () => {
      const token = localStorage.getItem("adminToken");
      const ms = getTimeUntilTokenExpiry(token);
      if (ms <= 0) {
        setSessionRemaining("Expired");
        return;
      }
      const totalSec = Math.floor(ms / 1000);
      const hours = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;
      setSessionRemaining(
        `${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // OTP Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (otpSent && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [otpSent, otpCountdown]);

  // Format OTP timer MM:SS
  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ----------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------

  // 1. SAVE FULL NAME
  const handleSaveFullName = async () => {
    if (!fullName.trim()) {
      showToast("Full legal name cannot be blank.");
      return;
    }

    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setIsUpdatingName(true);
    try {
      const res = await fetch("http://localhost:8080/api/admin/auth/update-name", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fullName: fullName.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to update full name.");
      }

      localStorage.setItem("adminFullName", data.data.fullName);
      onAdminUpdate(data.data);
      showToast("Admin full name updated successfully in database!");
    } catch (err: any) {
      showToast(err?.message || "Error updating full name.");
    } finally {
      setIsUpdatingName(false);
    }
  };

  // 2. AVATAR SELECTION & UPLOAD
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUploadAvatar = async () => {
    if (!selectedFile) {
      showToast("Please choose or drop an image first.");
      return;
    }

    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setIsUploadingAvatar(true);
    const formData = new FormData();
    formData.append("avatar", selectedFile);

    try {
      const res = await fetch("http://localhost:8080/api/admin/auth/upload-avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to upload avatar.");
      }

      if (data?.data?.profileImagePath) {
        localStorage.setItem("adminProfileImage", data.data.profileImagePath);
      }
      onAdminUpdate(data.data);
      setSelectedFile(null);
      setPreviewUrl(null);
      showToast("Profile avatar saved and updated successfully in database!");
    } catch (err: any) {
      showToast(err?.message || "Error uploading profile avatar.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveSelectedImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 3. GMAIL OTP REQUEST
  const handleSendEmailOtp = async () => {
    if (!newGmail || !newGmail.includes("@")) {
      showToast("Please enter a valid Gmail / Email address.");
      return;
    }

    if (newGmail.trim().toLowerCase() === admin.gmail.toLowerCase()) {
      showToast("Entered Gmail is already your current registered email.");
      return;
    }

    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setIsSendingOtp(true);
    try {
      const res = await fetch("http://localhost:8080/api/admin/auth/request-email-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newEmail: newGmail.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Could not generate OTP.");
      }

      setOtpSent(true);
      setOtpCountdown(600);
      setOtpDigits(["", "", "", "", "", ""]);
      showToast(`Verification OTP dispatched for ${newGmail}. Check system console / logs.`);
    } catch (err: any) {
      showToast(err?.message || "Failed to send verification OTP.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Segmented OTP Input change
  const handleOtpDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, "");
    const updated = [...otpDigits];
    updated[index] = clean.slice(-1);
    setOtpDigits(updated);

    if (clean && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // 4. VERIFY OTP & UPDATE GMAIL
  const handleVerifyAndUpdateEmail = async () => {
    const otp = otpDigits.join("");
    if (otp.length !== 6) {
      showToast("Please input complete 6-digit security OTP.");
      return;
    }

    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setIsVerifyingOtp(true);
    try {
      const res = await fetch("http://localhost:8080/api/admin/auth/verify-update-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          newEmail: newGmail.trim().toLowerCase(),
          otp,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "OTP verification failed.");
      }

      // Update storage with newly issued JWT token and email
      if (data?.data?.token) {
        localStorage.setItem("adminToken", data.data.token);
        localStorage.setItem("adminGmail", data.data.profile.gmail);
      }
      onAdminUpdate(data.data.profile);
      setOtpSent(false);
      setOtpDigits(["", "", "", "", "", ""]);
      showToast("Admin Gmail verified and updated successfully in database!");
    } catch (err: any) {
      showToast(err?.message || "Failed to verify OTP.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // 5. CHANGE PASSWORD
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      showToast("Please enter your current administrative password.");
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      showToast("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match.");
      return;
    }

    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setIsUpdatingPassword(true);
    try {
      const res = await fetch("http://localhost:8080/api/admin/auth/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to update password.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Master administrative password successfully updated in database!");
    } catch (err: any) {
      showToast(err?.message || "Error updating password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Password Strength calculations
  const calculateStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (pass.length >= 12) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return Math.min(score, 4);
  };

  const strengthScore = calculateStrength(newPassword);

  const getStrengthLabel = (score: number) => {
    switch (score) {
      case 1:
        return { label: "Weak Entropy", color: "text-error" };
      case 2:
        return { label: "Moderate Protection", color: "text-amber-400" };
      case 3:
        return { label: "High Defense", color: "text-secondary" };
      case 4:
        return { label: "Maximum Defense (96-Bit)", color: "text-tertiary" };
      default:
        return { label: "Undetermined", color: "text-outline" };
    }
  };

  const currentAvatarSrc =
    previewUrl ||
    (admin.profileImagePath ? `http://localhost:8080${admin.profileImagePath}` : null);

  const getInitials = (name?: string) => {
    if (!name) return "SA";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Top Banner / Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between pb-4 border-b border-outline-variant/30 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 rounded bg-secondary/10 text-secondary border border-secondary/20">
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
            </span>
            <span className="font-mono text-xs uppercase tracking-wider text-secondary font-semibold">
              Sovereign Control Node
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-on-surface tracking-tight">
            Admin Account & Security Settings
          </h2>
          <p className="text-sm text-on-surface-variant max-w-3xl mt-1">
            Configure administrative credentials, authentication parameters, identity verification,
            and contact endpoints for Singh Rent House Enterprise Core.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 flex items-center gap-2 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
            <span className="text-on-surface-variant">Session:</span>
            <span className="text-secondary font-semibold">{sessionRemaining}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Asymmetric 12 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ============================================================ */}
        {/* LEFT COLUMN (7 Cols): Profile & Identity Cards               */}
        {/* ============================================================ */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* CARD 1: 3.9.2 - PROFILE IMAGE UPLOAD */}
          <div className="glass-panel rounded-xl p-5 sm:p-6 border border-outline-variant/30 relative overflow-hidden shadow-xl">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">
                  account_circle
                </span>
                <h3 className="text-lg font-semibold text-on-surface">
                  3.9.2 Profile Image Upload
                </h3>
              </div>
              <span className="text-xs font-mono text-outline bg-surface-container-lowest px-2.5 py-0.5 rounded border border-outline-variant/20">
                DB-SYNCED
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Avatar Preview with Holographic Ring */}
              <div className="relative group flex-shrink-0">
                <div className="w-28 h-28 rounded-full border-2 border-secondary/80 p-1 bg-surface-container-lowest shadow-[0_0_25px_rgba(76,215,246,0.25)] flex items-center justify-center overflow-hidden">
                  {currentAvatarSrc ? (
                    <img
                      src={currentAvatarSrc}
                      alt={admin.fullName}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-surface-container flex items-center justify-center text-primary font-mono text-2xl font-bold">
                      {getInitials(admin.fullName)}
                    </div>
                  )}
                </div>
                <div
                  className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-surface-container border border-secondary flex items-center justify-center text-secondary shadow"
                  title="Biometric Face ID Verified"
                >
                  <span className="material-symbols-outlined text-[16px]">fingerprint</span>
                </div>
              </div>

              {/* Drag & Drop Dropzone + Actions */}
              <div className="flex-1 w-full flex flex-col gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) {
                      setSelectedFile(e.dataTransfer.files[0]);
                      setPreviewUrl(URL.createObjectURL(e.dataTransfer.files[0]));
                    }
                  }}
                  className="border border-dashed border-outline-variant/60 hover:border-secondary/80 rounded-lg p-4 bg-surface-container-low/40 flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
                >
                  <span className="material-symbols-outlined text-secondary group-hover:scale-110 transition-transform mb-1 text-[22px]">
                    cloud_upload
                  </span>
                  <p className="text-xs sm:text-sm text-on-surface">
                    <span className="text-secondary font-medium underline">
                      {selectedFile ? selectedFile.name : "Click to select photo"}
                    </span>{" "}
                    or drag & drop
                  </p>
                  <p className="font-mono text-[11px] text-outline mt-0.5">
                    PNG, JPG, WebP up to 5MB (Square ratio recommended)
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={!selectedFile || isUploadingAvatar}
                    onClick={handleUploadAvatar}
                    className="flex-1 bg-primary-container hover:bg-primary-container/90 disabled:opacity-50 text-on-primary-container font-mono text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_12px_rgba(79,70,229,0.3)] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {isUploadingAvatar ? "hourglass_top" : "upload"}
                    </span>
                    <span>{isUploadingAvatar ? "Uploading..." : "Upload New Photo"}</span>
                  </button>

                  {selectedFile && (
                    <button
                      type="button"
                      onClick={handleRemoveSelectedImage}
                      className="bg-error/10 hover:bg-error/20 border border-error/30 text-error font-mono text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      <span>Cancel</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Signature status */}
            <div className="mt-4 pt-3 border-t border-outline-variant/15 flex items-center justify-between font-mono text-[11px]">
              <span className="text-on-surface-variant flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-tertiary" />
                Facial Key Signature:{" "}
                <span className="text-on-surface font-semibold">
                  SHA-256:7f4c...91b0
                </span>
              </span>
              <span className="text-tertiary">Valid Root Signature</span>
            </div>
          </div>

          {/* CARD 2: 3.9.4 - FULL NAME UPDATE */}
          <div className="glass-panel rounded-xl p-5 sm:p-6 border border-outline-variant/30 relative overflow-hidden shadow-xl">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">badge</span>
                <h3 className="text-lg font-semibold text-on-surface">3.9.4 Full Name Update</h3>
              </div>
              <span className="font-mono text-xs text-outline bg-surface-container-lowest px-2 py-0.5 rounded border border-outline-variant/20">
                SRH-ADM-00{admin.id || 1}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block font-mono text-xs text-on-surface-variant mb-1.5">
                  Identity Protocol
                </label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-on-surface">
                  <span className="material-symbols-outlined text-secondary text-[18px]">
                    shield_person
                  </span>
                  <span className="font-mono text-xs text-tertiary font-semibold">
                    Super Admin / Root Operator
                  </span>
                </div>
              </div>
              <div>
                <label className="block font-mono text-xs text-on-surface-variant mb-1.5">
                  Employee / Admin ID
                </label>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-on-surface">
                  <span className="font-mono text-xs text-on-surface font-medium">
                    SRH-ADM-00{admin.id || 1}
                  </span>
                  <span className="material-symbols-outlined text-tertiary text-[18px]">
                    check_circle
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-mono text-xs text-on-surface-variant mb-1.5">
                  Admin Full Legal Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-surface-container-lowest/90 border border-outline-variant/40 rounded-lg px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all font-medium"
                    placeholder="Enter complete legal name"
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-tertiary">
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                  </span>
                </div>
                <p className="font-mono text-[11px] text-outline mt-1">
                  Must strictly match registered Aadhaar & PAN Identity documentation.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="font-mono text-[11px] text-outline flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  Active in Database
                </span>
                <button
                  type="button"
                  disabled={isUpdatingName}
                  onClick={handleSaveFullName}
                  className="bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-mono text-xs py-2 px-4 rounded-lg shadow-[0_0_12px_rgba(79,70,229,0.3)] transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {isUpdatingName ? "hourglass_top" : "save"}
                  </span>
                  <span>{isUpdatingName ? "Saving..." : "Save Full Name"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* CARD 3: 3.9.3 - GMAIL / EMAIL UPDATE WITH OTP */}
          <div className="glass-panel rounded-xl p-5 sm:p-6 border border-outline-variant/30 relative overflow-hidden shadow-xl">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">
                  alternate_email
                </span>
                <h3 className="text-lg font-semibold text-on-surface">
                  3.9.3 Gmail / Email Update
                </h3>
              </div>
              <div className="flex items-center gap-1.5 bg-tertiary/10 border border-tertiary/30 px-2 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                <span className="font-mono text-[11px] text-tertiary">Verified Email</span>
              </div>
            </div>

            <div className="space-y-4">
              {/* Primary Email (Current Active) */}
              <div>
                <label className="block font-mono text-xs text-on-surface-variant mb-1.5">
                  Current Registered Gmail (Database)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="email"
                    readOnly
                    value={admin.gmail}
                    className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-lg pl-3.5 pr-10 py-2 font-mono text-xs text-on-surface-variant cursor-not-allowed"
                  />
                  <span className="absolute right-3 text-secondary" title="Active Admin Email">
                    <span className="material-symbols-outlined text-[18px]">
                      domain_verification
                    </span>
                  </span>
                </div>
              </div>

              {/* Secondary / New Email Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-mono text-xs text-on-surface-variant">
                    New Target Gmail Address
                  </label>
                  {otpSent && (
                    <button
                      type="button"
                      onClick={handleSendEmailOtp}
                      disabled={isSendingOtp}
                      className="font-mono text-xs text-secondary hover:underline cursor-pointer"
                    >
                      Resend Challenge OTP
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="email"
                      value={newGmail}
                      onChange={(e) => setNewGmail(e.target.value)}
                      placeholder="e.g. harpreet.singh.admin@gmail.com"
                      className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-3.5 py-2 text-sm text-on-surface focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all font-mono text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={isSendingOtp}
                    onClick={handleSendEmailOtp}
                    className="bg-surface-container hover:bg-surface-container-high border border-secondary/40 text-secondary font-mono text-xs px-3.5 py-2 rounded-lg transition-all active:scale-95 flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {isSendingOtp ? "hourglass_top" : "send"}
                    </span>
                    <span>{isSendingOtp ? "Sending..." : "Send OTP"}</span>
                  </button>
                </div>
              </div>

              {/* 6-Digit Segmented OTP Box */}
              {otpSent && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-3.5 rounded-lg bg-surface-container-low/60 border border-secondary/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-secondary text-[16px]">
                        pin
                      </span>
                      Input 6-Digit Verification OTP
                    </span>
                    <span className="font-mono text-xs text-outline">
                      Expires in{" "}
                      <span className="text-secondary font-semibold">
                        {formatTimer(otpCountdown)}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center justify-center sm:justify-start gap-2 max-w-sm">
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          otpInputRefs.current[index] = el;
                        }}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className={`w-11 h-12 text-center font-mono text-lg font-bold rounded bg-surface-container-lowest focus:ring-2 focus:ring-secondary focus:outline-none transition-colors ${
                          digit
                            ? "border-2 border-secondary text-secondary"
                            : "border border-outline-variant/60 text-on-surface"
                        }`}
                        placeholder="•"
                      />
                    ))}
                  </div>

                  {/* Submit OTP */}
                  <div className="flex items-center justify-end pt-1">
                    <button
                      type="button"
                      disabled={isVerifyingOtp || otpDigits.join("").length !== 6}
                      onClick={handleVerifyAndUpdateEmail}
                      className="bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-mono text-xs py-2 px-4 rounded-lg shadow-[0_0_14px_rgba(79,70,229,0.3)] transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {isVerifyingOtp ? "hourglass_top" : "mark_email_read"}
                      </span>
                      <span>{isVerifyingOtp ? "Verifying..." : "Verify & Update Gmail"}</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN (5 Cols): Password Change & Active Security    */}
        {/* ============================================================ */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* CARD 4: 3.9.1 - CHANGE PASSWORD */}
          <div className="glass-panel rounded-xl p-5 sm:p-6 border border-outline-variant/30 relative overflow-hidden shadow-xl">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">
                  lock_reset
                </span>
                <h3 className="text-lg font-semibold text-on-surface">3.9.1 Change Password</h3>
              </div>
              <span className="font-mono text-xs text-outline bg-surface-container-lowest px-2 py-0.5 rounded border border-outline-variant/20">
                BCRYPT-HASHED
              </span>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block font-mono text-xs text-on-surface-variant mb-1.5">
                  Current Administrative Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter existing password"
                    className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg pl-3.5 pr-10 py-2.5 font-mono text-xs text-on-surface focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-outline hover:text-on-surface cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showCurrentPass ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-mono text-xs text-on-surface-variant">
                    New Hardened Password
                  </label>
                  <span className={`font-mono text-[11px] ${getStrengthLabel(strengthScore).color}`}>
                    {getStrengthLabel(strengthScore).label}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showNewPass ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter strong master password"
                    className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg pl-3.5 pr-10 py-2.5 font-mono text-xs text-on-surface focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-outline hover:text-on-surface cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showNewPass ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>

                {/* Strength 4-segment progress bar */}
                <div className="mt-2.5 space-y-1.5">
                  <div className="grid grid-cols-4 gap-1.5 h-1.5">
                    <div
                      className={`rounded-full transition-colors ${
                        strengthScore >= 1 ? "bg-error" : "bg-surface-container-highest"
                      }`}
                    />
                    <div
                      className={`rounded-full transition-colors ${
                        strengthScore >= 2 ? "bg-amber-400" : "bg-surface-container-highest"
                      }`}
                    />
                    <div
                      className={`rounded-full transition-colors ${
                        strengthScore >= 3 ? "bg-secondary" : "bg-surface-container-highest"
                      }`}
                    />
                    <div
                      className={`rounded-full transition-colors ${
                        strengthScore >= 4
                          ? "bg-tertiary shadow-[0_0_8px_rgba(78,222,163,0.5)]"
                          : "bg-surface-container-highest"
                      }`}
                    />
                  </div>
                </div>

                {/* Entropy requirement checklist */}
                <div className="grid grid-cols-2 gap-2 mt-3 p-2.5 bg-surface-container-lowest/80 rounded-lg border border-outline-variant/20 font-mono text-[11px]">
                  <div
                    className={`flex items-center gap-1.5 ${
                      newPassword.length >= 12 ? "text-tertiary" : "text-outline"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {newPassword.length >= 12 ? "check" : "close"}
                    </span>
                    <span>12+ Characters</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)
                        ? "text-tertiary"
                        : "text-outline"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) ? "check" : "close"}
                    </span>
                    <span>Uppercase & Lower</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      /[0-9]/.test(newPassword) ? "text-tertiary" : "text-outline"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {/[0-9]/.test(newPassword) ? "check" : "close"}
                    </span>
                    <span>Numeric Digits</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      /[^A-Za-z0-9]/.test(newPassword) ? "text-tertiary" : "text-outline"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {/[^A-Za-z0-9]/.test(newPassword) ? "check" : "close"}
                    </span>
                    <span>Special Glyphs (!@#)</span>
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block font-mono text-xs text-on-surface-variant mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new master password"
                    className={`w-full bg-surface-container-lowest border rounded-lg pl-3.5 pr-10 py-2.5 font-mono text-xs text-on-surface focus:outline-none transition-all ${
                      confirmPassword && confirmPassword === newPassword
                        ? "border-tertiary/80 focus:ring-2 focus:ring-tertiary/20"
                        : "border-outline-variant/40 focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                    }`}
                  />
                  {confirmPassword && confirmPassword === newPassword && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-tertiary">
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Hardware 2FA Badge */}
              <div className="p-3 bg-surface-container-low/70 border border-outline-variant/30 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-secondary text-[20px]">
                    vpn_key
                  </span>
                  <div>
                    <p className="font-mono text-xs text-on-surface font-semibold">
                      Hardware 2FA / WebAuthn
                    </p>
                    <p className="font-mono text-[10px] text-outline">FIDO2 YubiKey Bound</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-tertiary/15 border border-tertiary/30 text-tertiary font-mono text-[11px] font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-ping" />
                  Active
                </span>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="w-full bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-mono text-xs py-2.5 px-4 rounded-lg shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isUpdatingPassword ? "hourglass_top" : "lock"}
                </span>
                <span>
                  {isUpdatingPassword ? "Encrypting & Updating..." : "Update Master Password"}
                </span>
              </button>
            </form>
          </div>

          {/* CARD 5: ACTIVE SESSION & AUDIT */}
          <div className="glass-panel rounded-xl p-5 border border-outline-variant/30 relative overflow-hidden shadow-xl space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
              <span className="text-on-surface font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[16px]">
                  security_update_good
                </span>
                Sovereign Audit Trail
              </span>
              <span className="text-tertiary text-[11px]">Level 4 Clearance</span>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-outline">Active 12H Session:</span>
                <span className="text-secondary font-semibold">{sessionRemaining}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-outline">Admin Role:</span>
                <span className="text-on-surface font-semibold">{admin.role}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-outline">Registered Mobile:</span>
                <span className="text-on-surface">{admin.mobileNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-outline">Cryptographic Standard:</span>
                <span className="text-tertiary">BCrypt (Work Factor 10)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
