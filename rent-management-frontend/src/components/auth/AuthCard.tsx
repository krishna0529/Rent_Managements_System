"use client";

import { motion } from "framer-motion";
import React from "react";

interface AuthCardProps {
  children: React.ReactNode;
  maxWidth?: string;
  badgeText?: string;
  title: string;
  subtitle: string;
}

export default function AuthCard({
  children,
  maxWidth = "max-w-2xl",
  badgeText,
  title,
  subtitle,
}: AuthCardProps) {
  return (
    <div className="relative w-full flex items-center justify-center">
      {/* Ambient Radial Glow Layer with floating movements */}
      <div className="absolute w-[640px] h-[640px] rounded-full bg-primary-container/15 blur-[140px] pointer-events-none -top-24 -right-24 animate-float-slow" />
      <div className="absolute w-[540px] h-[540px] rounded-full bg-secondary-container/10 blur-[130px] pointer-events-none -bottom-24 -left-24 animate-float-reverse" />
      <div className="absolute w-[360px] h-[360px] rounded-full bg-tertiary-container/5 blur-[100px] pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      {/* Glassmorphic Safe-Frame Card with Framer Motion */}
      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: "easeOut" }}
        className={`relative w-full ${maxWidth} bg-surface-container-low/90 backdrop-blur-xl border border-outline-variant/25 rounded-xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.6)] p-6 sm:p-8 hover:border-outline-variant/40 transition-colors duration-500`}
      >
        {/* Top Decorative Perimeter Gradient Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/70 to-transparent rounded-t-xl" />

        {/* Card Header */}
        <div className="border-b border-outline-variant/20 pb-6 mb-8 flex items-start justify-between">
          <div>
            {badgeText && (
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-primary-container/15 border border-primary/30 mb-3 hover:bg-primary-container/25 transition-colors">
                <span className="material-symbols-outlined text-primary text-[14px]">
                  lock
                </span>
                <span className="font-mono text-[11px] text-primary tracking-wider uppercase font-semibold">
                  {badgeText}
                </span>
              </div>
            )}
            <h1 className="text-[28px] sm:text-[32px] font-semibold text-on-surface tracking-tight leading-tight">
              {title}
            </h1>
            <p className="text-[14px] text-on-surface-variant mt-1">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Form Body */}
        {children}
      </motion.div>
    </div>
  );
}
