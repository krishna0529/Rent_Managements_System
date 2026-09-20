"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  getUserSession,
  getAdminSession,
  clearUserSession,
  clearAdminSession,
  UserSession,
  AdminSession,
} from "@/lib/auth";

interface UserProfile {
  id: number;
  fullName: string;
  username: string;
  email: string;
  mobileNumber: string;
  fullAddress: string;
  aadhaarNumber: string;
  profileImagePath: string | null;
  aadhaarDocumentPath: string | null;
  dateOfJoining: string;
  role: string;
  isActive: boolean;
}

interface PortalNavbarProps {
  activeTab?: "home" | "about" | "contact" | "dashboard";
}

export default function PortalNavbar({ activeTab = "about" }: PortalNavbarProps) {
  const router = useRouter();
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [dbUser, setDbUser] = useState<UserProfile | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch live user session and database profile fresh from backend
  useEffect(() => {
    const session = getUserSession();
    const admin = getAdminSession();
    setUserSession(session);
    setAdminSession(admin);

    if (session?.token) {
      fetch("http://localhost:8080/api/auth/me", {
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((resData) => {
          if (resData?.data) {
            setDbUser(resData.data);
          }
        })
        .catch((err) => {
          console.error("Failed to load user profile in navbar:", err);
        });
    }

    // Close dropdown on outside click
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLogout = () => {
    if (adminSession) {
      clearAdminSession();
      router.push("/admin/login");
    } else {
      clearUserSession();
      router.push("/login");
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "SR";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const displayName = dbUser?.fullName || userSession?.fullName || adminSession?.fullName || "Alistair S. Vance";
  const displayRole = adminSession ? "Master Admin" : dbUser?.role === "ROLE_ADMIN" ? "Admin" : "Verified Resident";
  const homeHref = userSession ? "/dashboard" : adminSession ? "/admin/dashboard" : "/";

  return (
    <>
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-4 md:right-8 z-50 px-4 py-2.5 rounded-lg bg-surface-container-high border border-outline-variant/40 shadow-2xl text-on-surface font-mono text-xs flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px] text-secondary">info</span>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation Bar */}
      <header className="w-full fixed top-0 left-0 z-50 px-4 md:px-8 py-3.5 flex justify-between items-center bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/20 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.6)]">
        {/* Brand & Security Badge Cluster */}
        <div className="flex items-center gap-3 md:gap-4">
          <Link href={homeHref} className="flex items-center gap-2 group focus:outline-none">
            <div className="w-9 h-9 rounded-lg bg-surface-container-high border border-outline-variant/30 flex items-center justify-center text-primary group-hover:border-primary/60 group-hover:text-secondary transition-all duration-200 group-hover:scale-105 shadow-sm">
              <span className="material-symbols-outlined text-[20px] group-hover:rotate-6 transition-transform duration-300">
                home
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[14px] tracking-widest text-on-surface uppercase font-semibold">
                  SINGH RENT HOUSE
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-tertiary/10 border border-tertiary/30 text-tertiary font-mono text-[10px] tracking-wider uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-ping" />
                  {displayRole.toUpperCase()}
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation Links (Middle Cluster) */}
        <nav className="hidden md:flex items-center gap-7">
          <Link
            href={homeHref}
            className={
              activeTab === "home" || activeTab === "dashboard"
                ? "text-primary font-mono text-[13px] border-b-2 border-primary pb-1 flex items-center gap-1.5 transition-all duration-150 animate-float"
                : "text-on-surface-variant font-mono text-[13px] pb-1 hover:text-primary hover:bg-surface-container-high/40 px-2 py-1 rounded transition-all duration-150 flex items-center gap-1.5"
            }
          >
            <span className="material-symbols-outlined text-[16px]">home</span>
            Home
          </Link>
          <Link
            href="/about"
            className={
              activeTab === "about"
                ? "text-primary font-mono text-[13px] border-b-2 border-primary pb-1 flex items-center gap-1.5 transition-all duration-150 animate-float"
                : "text-on-surface-variant font-mono text-[13px] pb-1 hover:text-primary hover:bg-surface-container-high/40 px-2 py-1 rounded transition-all duration-150 flex items-center gap-1.5"
            }
          >
            <span className="material-symbols-outlined text-[15px]">info</span>
            About
          </Link>
          <Link
            href="/contact"
            className={
              activeTab === "contact"
                ? "text-primary font-mono text-[13px] border-b-2 border-primary pb-1 flex items-center gap-1.5 transition-all duration-150 animate-float"
                : "text-on-surface-variant font-mono text-[13px] pb-1 hover:text-primary hover:bg-surface-container-high/40 px-2 py-1 rounded transition-all duration-150 flex items-center gap-1.5"
            }
          >
            <span className="material-symbols-outlined text-[15px]">support_agent</span>
            Contact
          </Link>
        </nav>

        {/* Trailing Profile & Actions */}
        <div className="flex items-center gap-2.5 md:gap-3.5 relative" ref={dropdownRef}>
          {/* Notification Ping Bell */}
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => showToast("All system authorizations are synchronized and up-to-date.")}
            className="relative w-9 h-9 rounded-lg bg-surface-container-high/50 hover:bg-surface-container-high text-on-surface-variant hover:text-primary border border-outline-variant/30 flex items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-secondary" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-secondary animate-ping opacity-75" />
          </button>

          {/* USER PROFILE PILL - Live Profile Image from Database */}
          {userSession || adminSession ? (
            <div
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/30 hover:border-outline-variant/60 transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-[0_0_15px_rgba(79,70,229,0.2)] select-none"
            >
              <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/20 bg-primary-container flex items-center justify-center">
                {dbUser?.profileImagePath && !imageError ? (
                  <img
                    src={`http://localhost:8080${dbUser.profileImagePath}`}
                    alt={displayName}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="text-on-primary-container font-mono text-xs font-semibold">
                    {getInitials(displayName)}
                  </div>
                )}
                {/* Live Status Beacon */}
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-tertiary ring-2 ring-surface-container-low" />
              </div>

              <div className="hidden sm:flex flex-col text-left">
                <span className="font-semibold text-on-surface group-hover:text-primary transition-colors text-xs leading-none">
                  {displayName}
                </span>
                <span className="font-mono text-[10px] text-outline leading-none mt-1">
                  Unit 402 • {adminSession ? "Master Admin" : dbUser?.role === "ROLE_ADMIN" ? "Admin" : "Verified"}
                </span>
              </div>
              <span className={`material-symbols-outlined text-[16px] text-outline group-hover:text-on-surface transition-transform duration-200 ${isProfileDropdownOpen ? "rotate-180" : ""}`}>
                expand_more
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="font-mono text-[12px] text-on-surface hover:text-primary px-3 py-1.5 rounded-lg border border-outline-variant/30 hover:border-primary/50 transition-all"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="hidden sm:inline-flex font-mono text-[12px] text-white bg-primary-container hover:bg-inverse-primary px-3 py-1.5 rounded-lg shadow-[0_0_12px_rgba(79,70,229,0.4)] transition-all font-medium"
              >
                Register
              </Link>
            </div>
          )}

          {/* User Dropdown Menu (Database-backed) */}
          <AnimatePresence>
            {isProfileDropdownOpen && (userSession || adminSession) && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-14 w-64 rounded-xl bg-surface-container border border-outline-variant/30 shadow-2xl p-3 z-50"
              >
                <div className="pb-3 mb-2 border-b border-outline-variant/20">
                  <p className="font-semibold text-on-surface text-sm">{displayName}</p>
                  <p className="text-outline text-xs truncate">
                    {dbUser?.email || adminSession?.gmail || "resident@singhrenthouse.com"}
                  </p>
                  <p className="font-mono text-[11px] text-secondary mt-1">
                    @{dbUser?.username || (adminSession ? "admin" : "resident402")}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="px-2 py-1.5 text-xs text-on-surface-variant flex items-center justify-between">
                    <span>Mobile:</span>
                    <span className="font-mono text-on-surface">{dbUser?.mobileNumber || "9876543210"}</span>
                  </div>
                  <div className="px-2 py-1.5 text-xs text-on-surface-variant flex items-center justify-between">
                    <span>Status:</span>
                    <span className="text-tertiary font-mono text-[11px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary" /> Active
                    </span>
                  </div>
                  <div className="px-2 py-1.5 text-xs text-on-surface-variant flex items-center justify-between">
                    <span>Assigned Unit:</span>
                    <span className="font-mono text-secondary font-medium">Room 402</span>
                  </div>
                </div>

                <div className="pt-2 mt-2 border-t border-outline-variant/20 space-y-1.5">
                  <Link
                    href={homeHref}
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-mono text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">dashboard</span>
                    <span>{adminSession ? "Admin Console" : "Resident Dashboard"}</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full px-3 py-2 rounded-lg bg-error/10 hover:bg-error/20 text-error font-mono text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">logout</span>
                    <span>Sign Out from Vault</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            className="md:hidden w-9 h-9 rounded-lg bg-surface-container-high/60 border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:text-primary transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">
              {mobileMenuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden fixed top-[60px] left-0 w-full bg-surface-container-lowest/95 backdrop-blur-xl border-b border-outline-variant/30 px-6 py-4 flex flex-col gap-3 shadow-2xl z-40"
          >
            <Link
              href={homeHref}
              onClick={() => setMobileMenuOpen(false)}
              className={`font-mono text-[13px] py-2 flex items-center gap-2 ${
                activeTab === "home" || activeTab === "dashboard"
                  ? "text-primary font-semibold"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">home</span>
              Home
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className={`font-mono text-[13px] py-2 flex items-center gap-2 ${
                activeTab === "about" ? "text-primary font-semibold" : "text-on-surface-variant hover:text-primary"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">info</span>
              About
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className={`font-mono text-[13px] py-2 flex items-center gap-2 ${
                activeTab === "contact" ? "text-primary font-semibold" : "text-on-surface-variant hover:text-primary"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">support_agent</span>
              Contact
            </Link>

            {(userSession || adminSession) && (
              <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary-container flex items-center justify-center font-mono text-xs text-on-primary-container">
                    {getInitials(displayName)}
                  </div>
                  <span className="font-mono text-xs text-on-surface">{displayName}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-2.5 py-1 rounded bg-error/10 text-error font-mono text-xs"
                >
                  Sign Out
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
