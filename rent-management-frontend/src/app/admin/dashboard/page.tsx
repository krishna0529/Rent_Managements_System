"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getAdminSession, clearAdminSession, getTimeUntilTokenExpiry } from "@/lib/auth";

// 9 Dedicated Views for Sections 3.1 to 3.9
import DashboardAnalyticsView from "@/components/admin/DashboardAnalyticsView";
import PendingApprovalsView from "@/components/admin/PendingApprovalsView";
import UserDirectoryView from "@/components/admin/UserDirectoryView";
import RoomInventoryView from "@/components/admin/RoomInventoryView";
import RentBillingEngineView from "@/components/admin/RentBillingEngineView";
import PaymentLedgerView from "@/components/admin/PaymentLedgerView";
import TenantKYCDocumentsView from "@/components/admin/TenantKYCDocumentsView";
import AuditTrailView from "@/components/admin/AuditTrailView";
import SecuritySettingsView from "@/components/admin/SecuritySettingsView";
import AdminDirectoryView from "@/components/admin/AdminDirectoryView";

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

export default function AdminDashboardPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("Dashboard Analytics");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Sync tab with URL query parameter on mount (?tab=room-inventory)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam) {
        const lower = tabParam.toLowerCase();
        if (lower.includes("security")) {
          setActiveTab("Security Settings");
        } else if (lower.includes("approval") || lower.includes("pending")) {
          setActiveTab("Pending Approvals");
        } else if (lower.includes("user")) {
          setActiveTab("User Directory");
        } else if (lower.includes("admin")) {
          setActiveTab("Admin Directory");
        } else if (lower.includes("room")) {
          setActiveTab("Room Inventory");
        } else if (lower.includes("bill")) {
          setActiveTab("Rent Billing Engine");
        } else if (lower.includes("payment") || lower.includes("ledger")) {
          setActiveTab("Payment Ledger");
        } else if (lower.includes("doc") || lower.includes("aadhaar") || lower.includes("kyc")) {
          setActiveTab("Tenant KYC Aadhaar");
        } else if (lower.includes("audit")) {
          setActiveTab("System Audit Trail");
        }
      }
    }

    // Fetch initial live pending approvals count
    fetch("http://localhost:8080/api/admin/tenants/count")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.data !== undefined) setPendingCount(Number(d.data));
      })
      .catch(() => {});
  }, []);

  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName);
    setIsMobileSidebarOpen(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (tabName === "Dashboard Analytics") {
        url.searchParams.delete("tab");
      } else {
        url.searchParams.set("tab", tabName.toLowerCase().replace(/\s+/g, "-"));
      }
      window.history.replaceState(null, "", url.toString());
    }
  };

  useEffect(() => {
    // 1. Verify admin session
    const session = getAdminSession();
    if (!session) {
      clearAdminSession();
      router.replace("/admin/login?expired=true");
      return;
    }

    // 2. Auto logout timer when token expires
    const remainingMs = getTimeUntilTokenExpiry(session.token);
    const expiryTimer = setTimeout(() => {
      clearAdminSession();
      router.replace("/admin/login?expired=true");
    }, remainingMs);

    // 3. Periodic check every 30 seconds
    const intervalCheck = setInterval(() => {
      const current = getAdminSession();
      if (!current) {
        clearAdminSession();
        router.replace("/admin/login?expired=true");
      }
    }, 30000);

    // 4. Fetch admin profile fresh from database 'admin' table
    const fetchAdminProfile = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/admin/auth/me", {
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
        });

        if (res.ok) {
          const resData = await res.json();
          if (resData?.data) {
            setAdmin(resData.data);
          }
        } else {
          clearAdminSession();
          router.replace("/admin/login?expired=true");
        }
      } catch (err) {
        console.error("Failed to load admin profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminProfile();

    return () => {
      clearTimeout(expiryTimer);
      clearInterval(intervalCheck);
    };
  }, [router]);

  const handleLogout = () => {
    clearAdminSession();
    router.replace("/admin/login");
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getInitials = (name?: string) => {
    if (!name) return "SA";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const navItems = [
    { label: "Dashboard Analytics", icon: "dashboard", tag: "3.1" },
    { label: "Pending Approvals", icon: "pending_actions", tag: "3.2" },
    { label: "User Directory", icon: "badge", tag: "3.3" },
    { label: "Admin Directory", icon: "admin_panel_settings", tag: "3.4" },
    { label: "Room Inventory", icon: "apartment", tag: "3.5" },
    { label: "Rent Billing Engine", icon: "receipt_long", tag: "3.6" },
    { label: "Payment Ledger", icon: "account_balance", tag: "3.7" },
    { label: "Tenant KYC Aadhaar", icon: "verified", tag: "3.8" },
    { label: "System Audit Trail", icon: "history", tag: "3.9" },
    { label: "Security Settings", icon: "security", tag: "3.10" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center text-on-surface font-mono">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-[14px]">Loading Sovereign Enterprise Admin Portal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface antialiased min-h-screen flex flex-col font-body text-[14px] selection:bg-primary-container selection:text-on-primary-container relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-lg bg-tertiary-container text-on-tertiary-container shadow-[0_0_24px_rgba(78,222,163,0.5)] font-mono text-[12px] flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP APP BAR */}
      <header className="flex justify-between items-center w-full px-6 lg:px-8 h-16 sticky top-0 z-50 backdrop-blur-md bg-surface-container/90 border-b border-outline-variant/30 shadow-sm">
        {/* Brand & Global Navigation */}
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="lg:hidden p-2 text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[22px]">menu</span>
          </button>

          <Link href="/admin/dashboard" className="flex items-center gap-2.5 group">
            <span
              className="material-symbols-outlined text-secondary text-[24px] group-hover:scale-105 transition-transform"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              shield_with_house
            </span>
            <span className="text-[18px] font-semibold tracking-tight text-on-surface">
              Singh Rent House
            </span>
          </Link>
        </div>

        {/* Actions and Profile Shell */}
        <div className="flex items-center gap-4">
          {/* Sync Status Badge */}
          <div className="hidden sm:flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/30 px-2.5 py-1 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
            </span>
            <span className="font-mono text-[11px] text-on-surface-variant">DB Synced</span>
          </div>

          {/* Security Settings Direct Shortcut */}
          <button
            type="button"
            title="Admin Security & Account Settings (3.9)"
            onClick={() => handleTabChange("Security Settings")}
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              activeTab === "Security Settings"
                ? "bg-primary-container/25 text-secondary border border-secondary/40 shadow-[0_0_12px_rgba(76,215,246,0.3)]"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>

          {/* ADMIN PROFILE IDENTIFIER */}
          <div className="relative">
            <div
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-2.5 pl-2 border-l border-outline-variant/30 cursor-pointer group select-none"
            >
              <div className="relative w-8 h-8 rounded-full border border-primary/40 overflow-hidden bg-primary-container flex items-center justify-center">
                {admin?.profileImagePath && !imageError ? (
                  <img
                    src={`http://localhost:8080${admin.profileImagePath}`}
                    alt={admin.fullName}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <span className="text-on-primary-container font-mono text-xs font-semibold">
                    {getInitials(admin?.fullName)}
                  </span>
                )}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-tertiary ring-2 ring-surface-container" />
              </div>

              <div className="hidden xl:flex flex-col text-left">
                <span className="font-semibold text-on-surface leading-tight text-xs group-hover:text-primary transition-colors">
                  {admin?.fullName || "Harpreet Singh"}
                </span>
                <span className="font-mono text-[10px] text-outline leading-none mt-0.5">
                  Lead Admin • Sovereign
                </span>
              </div>

              <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-on-surface transition-transform">
                expand_more
              </span>
            </div>

            {/* Profile Dropdown Menu */}
            <AnimatePresence>
              {isProfileDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 w-64 rounded-xl bg-surface-container border border-outline-variant/30 shadow-2xl p-3 z-50 font-mono text-xs"
                >
                  <div className="pb-3 mb-2 border-b border-outline-variant/20">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center font-bold text-white">
                        {getInitials(admin?.fullName)}
                      </div>
                      <div className="truncate font-body">
                        <p className="font-semibold text-on-surface text-sm truncate">
                          {admin?.fullName || "Harpreet Singh"}
                        </p>
                        <p className="text-outline text-xs truncate">
                          {admin?.gmail || "admin@gmail.com"}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary-container/20 border border-primary-container/30 text-primary text-[10px]">
                      {admin?.role || "ROLE_ADMIN"}
                    </span>
                  </div>

                  <div className="space-y-1 text-on-surface-variant">
                    <div className="px-2 py-1 flex items-center justify-between">
                      <span>Mobile:</span>
                      <span className="text-on-surface">{admin?.mobileNumber || "9876543210"}</span>
                    </div>
                    <div className="px-2 py-1 flex items-center justify-between">
                      <span>Table Source:</span>
                      <span className="text-secondary text-[11px]">public.admin</span>
                    </div>
                  </div>

                  <div className="pt-2 mt-2 border-t border-outline-variant/20 space-y-1">
                    <button
                      onClick={() => handleTabChange("Security Settings")}
                      className="w-full px-3 py-2 rounded-lg hover:bg-surface-container-high text-on-surface flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px] text-secondary">security</span>
                      <span>3.9 Security Settings</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-3 py-2 rounded-lg bg-error/10 hover:bg-error/20 text-error flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">logout</span>
                      <span>Sign Out from Admin</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* BODY SHELL: Fixed Left Sidebar + Scrollable Main Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile Backdrop */}
        {isMobileSidebarOpen && (
          <div
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
          />
        )}

        {/* SIDE NAVIGATION BAR (Sections 3.1 to 3.9) */}
        <aside
          className={`fixed left-0 top-16 bottom-0 w-72 flex flex-col justify-between p-4 z-40 bg-surface-container-lowest border-r border-outline-variant/30 overflow-y-auto custom-scrollbar transition-transform duration-300 lg:translate-x-0 ${
            isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="space-y-4">
            {/* Sidebar Crest Header */}
            <div className="p-3 rounded-lg bg-surface-container/60 border border-outline-variant/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-container/20 border border-primary-container/50 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  apartment
                </span>
              </div>
              <div>
                <div className="font-semibold text-on-surface text-[15px] leading-tight">
                  SRH Enterprise Admin
                </div>
                <div className="font-mono text-[10px] text-outline mt-0.5">
                  Full Database Governance
                </div>
              </div>
            </div>

            {/* Navigation Tabs Cluster (3.1 to 3.9) */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.label;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleTabChange(item.label)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-xs font-mono transition-all duration-150 cursor-pointer ${
                      isActive
                        ? "bg-primary-container/20 text-secondary border-l-2 border-secondary font-semibold"
                        : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className={`material-symbols-outlined text-[19px] ${
                          isActive ? "text-secondary" : "text-outline"
                        }`}
                        style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {item.label === "Pending Approvals" && pendingCount > 0 ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-error/15 text-error border border-error/30 font-bold">
                          {pendingCount}
                        </span>
                      ) : (
                        <span className="text-[10px] text-outline opacity-60">
                          {item.tag}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="border-t border-outline-variant/30 pt-3 space-y-1 font-mono text-xs">
            <button
              type="button"
              onClick={() => handleTabChange("Rent Billing Engine")}
              className="w-full flex items-center justify-center gap-2 bg-primary-container hover:bg-indigo-600 text-white py-2 px-3 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">bolt</span>
              <span>Quick Bill Generate (3.5)</span>
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT CANVAS */}
        <main className="flex-1 lg:ml-72 p-6 xl:p-8 overflow-y-auto">
          <div className="max-w-[1440px] mx-auto">
            {/* 3.1 - Dashboard Analytics */}
            {activeTab === "Dashboard Analytics" && (
              <DashboardAnalyticsView
                showToast={showToast}
                onNavigateToTab={handleTabChange}
              />
            )}

            {/* 3.2 - Pending Approvals */}
            {activeTab === "Pending Approvals" && (
              <PendingApprovalsView
                showToast={showToast}
                onCountUpdate={(cnt) => setPendingCount(cnt)}
              />
            )}

            {/* 3.3 - User Directory */}
            {activeTab === "User Directory" && (
              <UserDirectoryView showToast={showToast} />
            )}

            {/* 3.4 - Admin Directory */}
            {activeTab === "Admin Directory" && (
              <AdminDirectoryView showToast={showToast} />
            )}

            {/* 3.5 - Room / Properties */}
            {activeTab === "Room Inventory" && (
              <RoomInventoryView showToast={showToast} />
            )}

            {/* 3.5 - Light Bills */}
            {activeTab === "Rent Billing Engine" && (
              <RentBillingEngineView showToast={showToast} />
            )}

            {/* 3.6 - Payment History */}
            {activeTab === "Payment Ledger" && (
              <PaymentLedgerView showToast={showToast} />
            )}

            {/* 3.7 - Document */}
            {activeTab === "Tenant KYC Aadhaar" && (
              <TenantKYCDocumentsView showToast={showToast} />
            )}

            {/* 3.8 - Audit Log */}
            {activeTab === "System Audit Trail" && (
              <AuditTrailView showToast={showToast} />
            )}

            {/* 3.9 - Settings */}
            {activeTab === "Security Settings" && admin && (
              <SecuritySettingsView
                admin={admin}
                onAdminUpdate={(updated) => setAdmin(updated)}
                showToast={showToast}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
