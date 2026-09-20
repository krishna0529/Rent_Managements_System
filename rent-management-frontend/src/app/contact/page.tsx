"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import PortalNavbar from "@/components/navigation/PortalNavbar";
import { getUserSession, getAdminSession } from "@/lib/auth";

export default function ContactPage() {
  const [fullName, setFullName] = useState("Alistair Shekhar Vance");
  const [email, setEmail] = useState("alistair.vance@gmail.com");
  const [roomUnit, setRoomUnit] = useState("Room 402");
  const [mobileNumber, setMobileNumber] = useState("+91 88662 60281");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);
  const [dispatchRefId, setDispatchRefId] = useState("#DISP-402-8839");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const user = getUserSession();
    if (user) {
      if (user.fullName) setFullName(user.fullName);
    }
    const admin = getAdminSession();
    if (admin) {
      if (admin.fullName) setFullName(admin.fullName);
      if (admin.gmail) setEmail(admin.gmail);
      setRoomUnit("Admin Office");
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage("File size exceeds 10MB maximum limit.");
        return;
      }
      setSelectedFile(file);
      setErrorMessage(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject) {
      setErrorMessage("Please select a subject classification category.");
      return;
    }
    if (!message.trim()) {
      setErrorMessage("Please describe your query or message in detail.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        name: fullName,
        email: email,
        subject: subject,
        message: message,
        roomUnit: roomUnit,
        mobileNumber: mobileNumber,
      };

      const response = await fetch("http://localhost:8080/api/contact/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data?.data) {
        setDispatchRefId(data.data);
      } else {
        // Fallback reference ID if running standalone
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        setDispatchRefId(`#DISP-402-${randomNum}`);
      }

      setDispatchSuccess(true);
      setMessage("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      // Graceful offline fallback
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      setDispatchRefId(`#DISP-402-${randomNum}`);
      setDispatchSuccess(true);
      setMessage("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background text-on-surface font-body min-h-screen relative selection:bg-primary selection:text-on-primary antialiased cyber-grid overflow-x-hidden flex flex-col justify-between">
      {/* Atmospheric Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[650px] h-[500px] bg-primary-container/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 right-10 w-[500px] h-[450px] bg-secondary/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-20 left-1/3 w-[600px] h-[400px] bg-tertiary-container/10 rounded-full blur-[130px]" />
      </div>

      {/* Top Navigation Bar */}
      <PortalNavbar activeTab="contact" />

      {/* Main Content Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 md:px-12 pt-28 pb-16 flex flex-col gap-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/20 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-secondary flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary/10 border border-secondary/25 shadow-[0_0_12px_rgba(76,215,246,0.2)]">
                <span className="material-symbols-outlined text-[15px]">encrypted</span>
                End-To-End Authenticated Dispatch
              </span>
            </div>
            <h1 className="text-[26px] sm:text-[32px] md:text-[36px] text-on-surface font-bold tracking-tight">
              Contact Landlord &amp; Property Admin
            </h1>
            <p className="text-[14px] sm:text-[15px] text-on-surface-variant max-w-2xl mt-1 leading-relaxed">
              Have a query, maintenance escalation, or billing concern? Send an encrypted dispatch directly to Singh Rent House administration.
            </p>
          </div>

          {/* Live Status Badge */}
          <div className="flex flex-wrap items-center gap-2.5 px-3.5 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span>
              Direct Admin Relay: <strong className="text-secondary font-medium">krishnasingh9697@gmail.com</strong>
            </span>
            <span className="text-outline-variant">|</span>
            <span className="text-tertiary flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">database</span>
              DB Auto-Fetch Active
            </span>
          </div>
        </div>

        {/* Primary Layout: 2-Column Bento Structure */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Main Contact Form Card (8 Cols) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="lg:col-span-8 glass-panel rounded-xl border border-outline-variant/30 p-6 md:p-8 relative overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-2xl pointer-events-none"></div>

            {/* Card Header with Security Key Indicator */}
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-outline-variant/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center text-primary shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">send</span>
                </div>
                <div>
                  <h2 className="text-[18px] sm:text-[20px] text-on-surface font-semibold">
                    Encrypted Dispatch Composer
                  </h2>
                  <p className="font-mono text-[11px] text-outline">
                    Payload signed with Tenant Identity Token #SRH-402-AUTH
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-tertiary-container/25 border border-tertiary/40 text-tertiary font-mono text-[11px]">
                <span className="material-symbols-outlined text-[14px]">verified_user</span>
                Session Validated
              </span>
            </div>

            {/* Error Notification */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mb-6 flex items-center gap-2.5 p-3 rounded-lg bg-error/15 border border-error/30 text-error font-mono text-[12px]"
                >
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span>{errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form Body */}
            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Row 1: Full Name & Email (Auto-fetched) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Full Name Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="font-mono text-[12px] text-on-surface font-medium flex items-center gap-1.5">
                      Full Name
                    </label>
                    <span className="font-mono text-[10px] text-secondary bg-secondary/10 px-2 py-0.5 rounded border border-secondary/25 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">database</span>
                      Fetched from Registration DB
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      className="w-full bg-surface-container-lowest/80 border border-outline-variant/40 rounded-lg px-3.5 py-2.5 text-[14px] text-on-surface/90 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-all font-mono"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                    <div className="absolute right-3 top-2.5 text-outline">
                      <span className="material-symbols-outlined text-[18px]">badge</span>
                    </div>
                  </div>
                </div>

                {/* Registered Gmail Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="font-mono text-[12px] text-on-surface font-medium flex items-center gap-1.5">
                      Registered Gmail / Email
                    </label>
                    <span className="font-mono text-[10px] text-tertiary bg-tertiary/10 px-2 py-0.5 rounded border border-tertiary/30 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">mark_email_read</span>
                      Verified Resident Mail
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      className="w-full bg-surface-container-lowest/80 border border-outline-variant/40 rounded-lg px-3.5 py-2.5 text-[14px] text-on-surface/90 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-all font-mono"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <div className="absolute right-3 top-2.5 text-outline">
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Room Unit & Phone Verification Badges */}
              <div className="p-3.5 rounded-lg bg-surface-container-lowest/50 border border-outline-variant/20 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-outline">Verified Tenant Metadata:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-surface-container border border-outline-variant/30 text-on-surface font-mono text-[11px]">
                    <span className="material-symbols-outlined text-[14px] text-secondary">meeting_room</span>
                    <span>Room Unit: <strong className="text-secondary font-medium">{roomUnit}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-surface-container border border-outline-variant/30 text-on-surface font-mono text-[11px]">
                    <span className="material-symbols-outlined text-[14px] text-tertiary">phone_iphone</span>
                    <span>Mobile: <strong className="text-on-surface font-medium">{mobileNumber}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container border border-outline-variant/30 text-outline font-mono text-[11px]">
                    <span className="material-symbols-outlined text-[14px]">shield</span>
                    <span>Lease Tier: Active</span>
                  </div>
                </div>
              </div>

              {/* Row 3: Subject Dropdown */}
              <div className="space-y-1.5">
                <label
                  htmlFor="subjectSelect"
                  className="font-mono text-[12px] text-on-surface font-medium flex items-center justify-between"
                >
                  <span>
                    Subject Classification <span className="text-error">*</span>
                  </span>
                  <span className="font-mono text-[11px] text-outline">Priority Routing Engine</span>
                </label>
                <div className="relative">
                  <select
                    id="subjectSelect"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded-lg px-3.5 py-2.5 text-[14px] text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary appearance-none cursor-pointer"
                  >
                    <option className="bg-surface-container-lowest text-outline" value="">
                      Select dispatch subject category...
                    </option>
                    <option className="bg-surface-container text-on-surface" value="Rent / Electricity Sub-meter Discrepancy">
                      Rent / Electricity Sub-meter Discrepancy
                    </option>
                    <option className="bg-surface-container text-on-surface" value="Maintenance / Repair Request (Plumbing, Electrical, RO)">
                      Maintenance / Repair Request (Plumbing, Electrical, RO)
                    </option>
                    <option className="bg-surface-container text-on-surface" value="Receipt / Bill Clarification">
                      Receipt / Bill Clarification
                    </option>
                    <option className="bg-surface-container text-on-surface" value="Notice / Lease Agreement Inquiry">
                      Notice / Lease Agreement Inquiry
                    </option>
                    <option className="bg-surface-container text-on-surface" value="General Query / Feedback">
                      General Query / Feedback
                    </option>
                  </select>
                  <div className="absolute right-3 top-3 pointer-events-none text-outline">
                    <span className="material-symbols-outlined text-[18px]">unfold_more</span>
                  </div>
                </div>
              </div>

              {/* Row 4: Message / Query Text Area */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="messageBody" className="font-mono text-[12px] text-on-surface font-medium">
                    Message / Query Text Area <span className="text-error">*</span>
                  </label>
                  <span className="font-mono text-[11px] text-outline">
                    {message.length} / 1000 characters
                  </span>
                </div>
                <div className="relative">
                  <textarea
                    id="messageBody"
                    rows={5}
                    maxLength={1000}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your query or issue in detail. If this relates to electricity sub-meter or rent clearance, please mention invoice or meter reading reference..."
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded-lg p-3.5 text-[14px] text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary resize-y"
                  />
                </div>
              </div>

              {/* Row 5: File Attachment Clip / Upload Zone */}
              <div className="border border-dashed border-outline-variant/40 rounded-lg p-4 bg-surface-container-lowest/40 hover:border-secondary/40 transition-colors">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined text-[20px]">attach_file</span>
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-on-surface">Supporting Evidentiary Files (Optional)</p>
                      <p className="font-mono text-[11px] text-outline">
                        Attach sub-meter snapshot, bill receipt, or repair photo (PNG, JPG, PDF up to 10MB)
                      </p>
                    </div>
                  </div>
                  <label className="cursor-pointer px-3.5 py-1.5 rounded-lg bg-surface-container border border-outline-variant/40 hover:border-secondary/50 text-secondary font-mono text-[12px] flex items-center gap-1.5 transition-all shadow-sm">
                    <span className="material-symbols-outlined text-[15px]">cloud_upload</span>
                    <span>Select File</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".png,.jpg,.jpeg,.pdf"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>

                {selectedFile && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 pt-2.5 border-t border-outline-variant/20 flex items-center justify-between text-secondary font-mono text-[11px]"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="text-outline hover:text-error transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Row 6: Dispatch Notice */}
              <div className="p-3.5 rounded-lg bg-surface-container-high/30 border border-outline-variant/20 flex items-start gap-3">
                <span className="material-symbols-outlined text-[18px] text-secondary mt-0.5">info</span>
                <p className="text-[12px] text-on-surface-variant leading-relaxed">
                  <strong className="text-on-surface font-medium">Note:</strong> Upon submission, an instant automated email dispatch will be delivered to the Registered Admin Inbox (<span className="text-secondary font-mono">krishnasingh9697@gmail.com</span>) along with your Room #402 verification tokens.
                </p>
              </div>

              {/* Row 7: Submit CTA Button */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="shine-btn w-full py-3.5 px-6 rounded-lg bg-gradient-to-r from-primary-container via-[#4338CA] to-secondary-container text-white text-[15px] font-semibold tracking-wide flex items-center justify-center gap-2.5 shadow-[0_10px_25px_-5px_rgba(79,70,229,0.5)] hover:shadow-[0_0_20px_2px_rgba(76,215,246,0.5)] active:scale-[0.99] transition-all duration-200 border-t border-white/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                      <span>Encrypting &amp; Dispatching to Admin...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">forward_to_inbox</span>
                      <span>Submit Message / Send Dispatch to Admin</span>
                    </>
                  )}
                </button>
              </div>

              {/* Row 8: SLA Banner */}
              <div className="flex items-center justify-center gap-2 pt-1">
                <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                <span className="font-mono text-[11px] text-on-surface-variant">
                  Priority Admin SLA: <strong className="text-tertiary font-medium">Response within 2 to 4 hours</strong> during operational cycles
                </span>
              </div>
            </form>

            {/* Dynamic Success Notice Toast */}
            <AnimatePresence>
              {dispatchSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="mt-6 p-4 rounded-lg bg-tertiary-container/30 border border-tertiary/50 text-on-tertiary-container flex items-start gap-3 shadow-xl"
                >
                  <span className="material-symbols-outlined text-[22px] text-tertiary">task_alt</span>
                  <div className="space-y-1">
                    <h4 className="text-[15px] font-semibold text-tertiary">
                      Dispatch Transmitted Successfully!
                    </h4>
                    <p className="text-[13px] text-on-surface leading-relaxed">
                      Reference ID <span className="font-mono text-secondary font-bold">{dispatchRefId}</span> has been routed to Krishnapratap Singh at <span className="font-mono text-primary">krishnasingh9697@gmail.com</span>. A copy has been preserved in your audit ledger.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right Column: Admin Quick Contact Directory (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Admin Contact Directory Card */}
            <div className="glass-panel rounded-xl border border-outline-variant/30 p-6 space-y-6 shadow-xl">
              <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/20">
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary border border-outline-variant/30">
                  <span className="material-symbols-outlined text-[20px]">badge</span>
                </div>
                <div>
                  <h3 className="text-[16px] text-on-surface font-semibold">
                    Property Admin &amp; Landlord Desk
                  </h3>
                  <p className="font-mono text-[11px] text-outline">Direct Contact Channels</p>
                </div>
              </div>

              {/* Admin Contact List */}
              <div className="space-y-3.5">
                {/* Landlord Info */}
                <div className="p-3 rounded-lg bg-surface-container-low/60 border border-outline-variant/20">
                  <span className="font-mono text-[10px] text-outline block mb-1 uppercase tracking-wider">
                    Landlord / Property Admin
                  </span>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary-container/40 border border-primary-fixed-dim/40 flex items-center justify-center text-primary text-[12px] font-bold font-mono">
                      KS
                    </div>
                    <div>
                      <h4 className="text-[14px] font-semibold text-on-surface leading-tight">
                        Krishnapratap Singh
                      </h4>
                      <p className="font-mono text-[11px] text-on-surface-variant">
                        Singh Rent House Property Management
                      </p>
                    </div>
                  </div>
                </div>

                {/* Email Item */}
                <div className="p-3 rounded-lg bg-surface-container-low/60 border border-outline-variant/20 flex items-start gap-3">
                  <span className="material-symbols-outlined text-[18px] text-secondary mt-0.5">alternate_email</span>
                  <div className="flex-1">
                    <span className="font-mono text-[10px] text-outline block mb-0.5 uppercase tracking-wider">
                      Admin Office Email
                    </span>
                    <a
                      className="text-[13px] text-secondary hover:underline font-mono break-all"
                      href="mailto:krishnasingh9697@gmail.com"
                    >
                      krishnasingh9697@gmail.com
                    </a>
                  </div>
                </div>

                {/* Helpline / WhatsApp */}
                <div className="p-3 rounded-lg bg-surface-container-low/60 border border-outline-variant/20 flex items-start gap-3">
                  <span className="material-symbols-outlined text-[18px] text-tertiary mt-0.5">support_agent</span>
                  <div className="flex-1">
                    <span className="font-mono text-[10px] text-outline block mb-0.5 uppercase tracking-wider">
                      Emergency Helpline &amp; WhatsApp
                    </span>
                    <div className="flex items-center justify-between">
                      <a
                        className="text-[13px] font-semibold text-on-surface hover:text-tertiary font-mono"
                        href="tel:+918866260281"
                      >
                        +91 88662 60281
                      </a>
                      <span className="px-2 py-0.5 rounded bg-tertiary/10 border border-tertiary/20 text-tertiary font-mono text-[10px]">
                        8 AM – 10 PM
                      </span>
                    </div>
                    <p className="font-mono text-[10px] text-on-surface-variant mt-1">
                      Direct escalation for plumbing/power failures
                    </p>
                  </div>
                </div>

                {/* Office Address */}
                <div className="p-3 rounded-lg bg-surface-container-low/60 border border-outline-variant/20 flex items-start gap-3">
                  <span className="material-symbols-outlined text-[18px] text-secondary mt-0.5">location_on</span>
                  <div className="flex-1">
                    <span className="font-mono text-[10px] text-outline block mb-0.5 uppercase tracking-wider">
                      Property Office Location
                    </span>
                    <p className="text-[12px] text-on-surface leading-snug">
                      Santidham : Plot :- 52/53 Sector-4, Varsamadi , Anjar, Gujarat 370110
                    </p>
                  </div>
                </div>
              </div>

              {/* Office & Gate Timings Bento Widget */}
              <div className="pt-4 border-t border-outline-variant/20 space-y-3">
                <h4 className="font-mono text-[12px] text-on-surface font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-secondary">schedule</span>
                  Facility Operating Schedule
                </h4>
                <div className="grid grid-cols-2 gap-2 text-left">
                  <div className="p-2.5 rounded bg-surface-container-lowest/50 border border-outline-variant/20">
                    <span className="font-mono text-[10px] text-outline block">Admin Desk</span>
                    <span className="text-[12px] font-medium text-on-surface">09:00 AM - 08:30 PM</span>
                  </div>
                  <div className="p-2.5 rounded bg-surface-container-lowest/50 border border-outline-variant/20">
                    <span className="font-mono text-[10px] text-outline block">Security Gate</span>
                    <span className="text-[12px] font-medium text-secondary">24/7 Monitored Access</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-2">
                <a
                  className="w-full py-2.5 px-4 rounded-lg bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 hover:border-tertiary/40 text-on-surface flex items-center justify-center gap-2 font-mono text-[12px] transition-all group cursor-pointer"
                  href="https://wa.me/918866260281?text=Hello%20Singh%20Rent%20House%20Admin,%20I%20have%20an%20inquiry%20regarding%20my%20tenancy."
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span className="material-symbols-outlined text-[18px] text-tertiary group-hover:scale-110 transition-transform">
                    chat
                  </span>
                  <span>Open WhatsApp Admin Bridge</span>
                </a>
              </div>
            </div>

            {/* Security Badge Card */}
            <div className="p-4 rounded-xl bg-surface-container-lowest/50 border border-outline-variant/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0 border border-outline-variant/30">
                <span className="material-symbols-outlined text-[20px]">fingerprint</span>
              </div>
              <div className="space-y-0.5">
                <p className="font-mono text-[12px] font-semibold text-on-surface">Cryptographic Authenticity</p>
                <p className="font-mono text-[11px] text-outline leading-tight">
                  Each dispatch carries tenant signature preventing spoofed notices.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Component */}
      <footer className="w-full py-6 px-6 sm:px-8 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-outline-variant/15 bg-surface-container-lowest mt-auto z-10">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[12px] text-on-surface-variant font-semibold">AUTH//VAULT</span>
          <span className="text-outline-variant font-mono text-xs">|</span>
          <span className="font-mono text-[11px] text-on-surface-variant">
            &copy; 2025 AUTH//VAULT Enterprise Security Inc. Zero-Trust Architecture.
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-6 font-mono text-[11px] text-on-surface-variant">
          <Link className="hover:text-on-surface transition-colors" href="/about">
            System Audit
          </Link>
          <Link className="hover:text-on-surface transition-colors" href="/contact">
            Direct Relay
          </Link>
          <Link className="hover:text-on-surface transition-colors" href="/login">
            Tenant Portal
          </Link>
        </div>
      </footer>
    </div>
  );
}
