"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface AuthHeaderProps {
  actionType?: "login" | "register";
}

export default function AuthHeader({ actionType = "login" }: AuthHeaderProps) {
  return (
    <header className="w-full fixed top-0 left-0 z-50 px-6 sm:px-8 py-4 flex justify-between items-center border-b border-outline-variant/20 bg-surface-container-lowest/80 backdrop-blur-md shadow-[0_20px_40px_-15px_rgba(0,0,0,0.6)]">
      {/* Left: Brand Logo & Interactive Return Home Button */}
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="relative group flex items-center">
          <Link
            href="/"
            aria-label="Return to Dashboard/Home"
            className="home-spring-btn relative p-2.5 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:text-secondary hover:border-secondary/50 focus:outline-none focus:ring-2 focus:ring-secondary/40 flex items-center justify-center cursor-pointer shadow-sm group"
          >
            <span className="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:scale-110">
              home
            </span>
            {/* Active radar indicator ping */}
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary-container"></span>
            </span>
          </Link>

          {/* Floating Tooltip */}
          <div className="pointer-events-none absolute left-0 top-full mt-2.5 hidden group-hover:flex flex-col items-center z-50 whitespace-nowrap transition-all duration-200">
            <div className="bg-surface-container-highest text-on-surface font-mono text-[11px] px-2.5 py-1 rounded-lg border border-outline-variant/40 shadow-xl">
              Return to Dashboard/Home
            </div>
          </div>
        </div>

        <div className="h-5 w-[1px] bg-outline-variant/20 hidden sm:block"></div>

        <div className="font-mono text-[14px] tracking-widest text-on-surface uppercase font-semibold flex items-center gap-2">
          <span>Singh Rent House</span>
        </div>
      </div>

      {/* Trailing Action */}
      <div className="flex items-center gap-3">
        {actionType === "login" ? (
          <Link
            href="/login"
            className="font-mono text-[13px] text-on-surface-variant hover:text-on-surface px-3 py-1.5 rounded-lg border border-outline-variant/30 hover:border-outline hover:shadow-[0_0_12px_rgba(195,192,255,0.15)] transition-all active:scale-[0.98]"
          >
            Sign In
          </Link>
        ) : (
          <Link
            href="/register"
            className="shine-btn font-mono text-[13px] text-on-primary bg-primary-container hover:bg-inverse-primary px-3.5 py-1.5 rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_0_18px_rgba(79,70,229,0.45)] transition-all active:scale-[0.98] font-medium"
          >
            Create Account
          </Link>
        )}
      </div>
    </header>
  );
}
