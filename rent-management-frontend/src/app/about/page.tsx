"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import PortalNavbar from "@/components/navigation/PortalNavbar";

export default function AboutPage() {
  return (
    <div className="bg-background text-on-surface font-body min-h-screen relative selection:bg-primary selection:text-on-primary antialiased cyber-grid overflow-x-hidden flex flex-col justify-between">
      {/* Glow Ambient Accent */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[700px] h-[550px] bg-primary-container/15 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 right-10 w-[500px] h-[450px] bg-secondary/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-10 left-1/4 w-[600px] h-[400px] bg-tertiary-container/10 rounded-full blur-[140px]" />
      </div>

      {/* Top Navigation Bar */}
      <PortalNavbar activeTab="about" />

      {/* Main Content Canvas */}
      <main className="relative z-10 pt-28 pb-20 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto w-full space-y-12">
        {/* 1. Header & Hero: System Architecture & Creator Dossier */}
        <section className="space-y-4 pt-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-sm bg-primary-container/20 border border-primary/40 text-primary font-mono text-[11px] tracking-wider uppercase flex items-center gap-1.5 shadow-[0_0_12px_rgba(79,70,229,0.3)]">
              <span className="material-symbols-outlined text-[13px]">terminal</span>
              SYSTEM ARCHITECTURE &amp; CREATOR DOSSIER
            </span>
            <span className="h-px bg-outline-variant/30 flex-1"></span>
            {/* <span className="font-mono text-[11px] text-outline">SEC_ID: 8092-SHR-AUTH</span> */}
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-[28px] sm:text-[36px] md:text-[40px] font-bold tracking-tight text-on-surface">
                Singh Rent House Portal
              </h1>
              <p className="mt-2 text-on-surface-variant text-[15px] sm:text-[16px] max-w-3xl leading-relaxed">
                A smart, automated zero-trust tenant management, sub-meter billing, and cryptographic rent settlement platform built for Singh Luxury Heights.
              </p>
            </div>
            <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
              <Link
                href="/contact"
                className="px-4 py-2 rounded-lg bg-surface-container-high border border-outline-variant/40 hover:border-outline-variant/80 font-mono text-[13px] text-on-surface flex items-center gap-2 transition-all hover:bg-surface-container-highest cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">bug_report</span>
                Audit Report
              </Link>
              <a
                href="#tech-stack"
                className="px-4 py-2 rounded-lg bg-primary-container text-white border border-primary/30 hover:bg-inverse-primary font-mono text-[13px] flex items-center gap-2 transition-all shadow-[0_0_16px_rgba(79,70,229,0.35)] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">layers</span>
                Inspect Stack
              </a>
            </div>
          </div>
        </section>

        {/* 2. Section 4.4.1: Developer Profile & Project Brief Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Developer Profile Card (5 Cols) */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5 rounded-xl bg-surface-container-low/90 backdrop-blur-md border border-outline-variant/30 p-6 md:p-8 flex flex-col justify-between relative overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.6)] group hover:border-outline-variant/60 transition-all duration-200"
          >
            {/* Top Tech Gradient Edge */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-secondary to-tertiary"></div>

            <div className="space-y-6">
              {/* Portrait Frame with Glow Rings */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <div className="relative">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border-2 border-secondary/60 p-0.5 shadow-[0_0_24px_-4px_rgba(6,182,212,0.5)] bg-surface-container-high">
                    <img
                      src="/developer.jpg"
                      alt="Er. Krishnapratap Singh"
                      className="w-full h-full object-cover object-top rounded-lg group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded bg-surface-container-lowest border border-secondary text-[9px] font-mono text-secondary font-bold shadow-sm">
                    LEAD
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-secondary font-mono text-[12px] font-semibold tracking-wide">
                    <span className="material-symbols-outlined text-[14px]">code</span>
                    CORE ARCHITECT
                  </div>
                  <h2 className="text-[20px] sm:text-[22px] font-bold text-on-surface">Mr. Krishnapratap Singh</h2>
                  <p className="text-on-surface-variant font-mono text-[12px]">Lead Full Stack Engineer &amp; Systems Architect</p>
                  <div className="pt-1 flex items-center gap-2 text-outline font-mono text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
                    Status: Deployed &amp; Active
                  </div>
                </div>
              </div>

              {/* Developer Badges */}
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="px-2.5 py-1 rounded bg-surface-container-high/80 border border-outline-variant/30 text-on-surface-variant font-mono text-[11px] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[14px]">developer_mode</span>
                  Full-Stack Developer
                </span>
                <span className="px-2.5 py-1 rounded bg-surface-container-high/80 border border-outline-variant/30 text-on-surface-variant font-mono text-[11px] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-[14px]">hub</span>
                  System Architect
                </span>
                <span className="px-2.5 py-1 rounded bg-surface-container-high/80 border border-outline-variant/30 text-on-surface-variant font-mono text-[11px] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-tertiary text-[14px]">deployed_code</span>
                  Open Source Contributor
                </span>
              </div>

              {/* Bio */}
              <p className="text-on-surface-variant text-[13px] sm:text-[14px] leading-relaxed border-t border-outline-variant/15 pt-4">
                Specialized in building resilient, secure real-estate enterprise solutions, zero-trust tenant workflows, automated billing ledgers, and seamless gateway integrations. Designed to eradicate discrepancies between tenants and administration through verifiable cryptography.
              </p>
            </div>

            {/* Social & Direct Dev Links */}
            <div className="pt-6 mt-6 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <a
                  className="px-3 py-1.5 rounded bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 hover:border-primary/40 text-on-surface font-mono text-[11px] flex items-center gap-1.5 transition-all"
                  href="https://github.com/krishna0529"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span className="material-symbols-outlined text-[15px]">terminal</span>
                  GitHub
                </a>
                <a
                  className="px-3 py-1.5 rounded bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 hover:border-secondary/40 text-on-surface font-mono text-[11px] flex items-center gap-1.5 transition-all"
                  href="https://www.linkedin.com/in/krishnapratap-sheshpal-singh-204ba9248"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span className="material-symbols-outlined text-[15px]">share</span>
                  LinkedIn
                </a>
                <a
                  className="px-3 py-1.5 rounded bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 hover:border-tertiary/40 text-on-surface font-mono text-[11px] flex items-center gap-1.5 transition-all"
                  href="https://wa.me/918866260281"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span className="material-symbols-outlined text-[15px]">chat</span>
                  WhatsApp
                </a>
              </div>
              <a
                className="text-primary hover:text-on-primary-container font-mono text-[11px] flex items-center gap-1 transition-colors"
                href="mailto:zoro05032002@gmail.com"
              >
                <span className="material-symbols-outlined text-[14px]">alternate_email</span>
                zoro05032002@gmail.com
              </a>
            </div>
          </motion.div>

          {/* Project Brief & Mission Card (7 Cols) */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-7 rounded-xl bg-surface-container-low/90 backdrop-blur-md border border-outline-variant/30 p-6 md:p-8 flex flex-col justify-between relative shadow-[0_20px_40px_-15px_rgba(0,0,0,0.6)]"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
                <div>
                  <span className="font-mono text-[11px] text-secondary uppercase tracking-widest font-semibold">
                    PROJECT BRIEF &amp; PROBLEM DEFINITION
                  </span>
                  <h3 className="text-[18px] sm:text-[20px] font-bold text-on-surface mt-0.5">
                    Engineering the Future of Tenancy Operations
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded bg-secondary/10 border border-secondary/30 text-secondary font-mono text-[11px]">
                  VERIFIED RELEASE
                </span>
              </div>

              {/* Problem vs Solution Bento Split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Problem Statement */}
                <div className="p-4 rounded-lg bg-surface-container-lowest/80 border border-error/20 space-y-2">
                  <div className="flex items-center gap-2 text-error font-mono text-[11px] font-semibold uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[16px]">warning</span>
                    The Legacy Friction
                  </div>
                  <p className="text-on-surface-variant text-[12px] sm:text-[13px] leading-relaxed">
                    Traditional rental setups suffer from manual sub-meter tracking, delayed payment reconciliation, disputed handwritten cash receipts, opaque tariff splits, and fragmented maintenance tickets across unmonitored chat threads.
                  </p>
                </div>

                {/* Solution & Purpose */}
                <div className="p-4 rounded-lg bg-surface-container-lowest/80 border border-tertiary/20 space-y-2">
                  <div className="flex items-center gap-2 text-tertiary font-mono text-[11px] font-semibold uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    The Modernized Platform
                  </div>
                  <p className="text-on-surface-variant text-[12px] sm:text-[13px] leading-relaxed">
                    Singh Rent House Portal transforms operations via zero-trust onboarding, mock UIDAI Aadhaar verification, real-time sub-meter unit calculations, 2-sec Razorpay settlement hooks, automated PDF tax receipts, and immutable admin audit trails.
                  </p>
                </div>
              </div>

              {/* Key Metrics / Impact stats Grid */}
              <div className="pt-2">
                <span className="font-mono text-[11px] text-outline uppercase tracking-wider font-semibold block mb-3">
                  Live Mission Benchmarks
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-lg bg-surface-container border border-outline-variant/25 text-center space-y-1">
                    <div className="text-[20px] font-bold text-tertiary font-mono">99.9%</div>
                    <div className="text-outline font-mono text-[11px]">Uptime SLA</div>
                  </div>
                  <div className="p-3.5 rounded-lg bg-surface-container border border-outline-variant/25 text-center space-y-1">
                    <div className="text-[20px] font-bold text-secondary font-mono">0</div>
                    <div className="text-outline font-mono text-[11px]">Disputed Bills</div>
                  </div>
                  <div className="p-3.5 rounded-lg bg-surface-container border border-outline-variant/25 text-center space-y-1">
                    <div className="text-[20px] font-bold text-primary font-mono">&lt; 2.0s</div>
                    <div className="text-outline font-mono text-[11px]">Razorpay Hook</div>
                  </div>
                  <div className="p-3.5 rounded-lg bg-surface-container border border-outline-variant/25 text-center space-y-1">
                    <div className="text-[20px] font-bold text-on-surface font-mono">100%</div>
                    <div className="text-outline font-mono text-[11px]">Digital Invoices</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footnote Status */}
            <div className="mt-6 pt-4 border-t border-outline-variant/15 flex flex-wrap items-center justify-between text-outline font-mono text-[11px] gap-2">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-tertiary">lock</span>
                Encrypted Tenant-Owner Communications Pipeline
              </span>
              <span className="font-mono text-secondary">BUILD_ENV: PROD-SECURE</span>
            </div>
          </motion.div>
        </section>

        {/* 3. Section 4.4.2: Complete Technology Stack Breakdown */}
        <section className="space-y-6 pt-6" id="tech-stack">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-outline-variant/20 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-primary rounded-sm"></span>
                <span className="font-mono text-[11px] text-primary uppercase tracking-widest font-semibold">
                  SECTION 4.4.2 ARCHITECTURE SPECIFICATION
                </span>
              </div>
              <h2 className="text-[22px] sm:text-[26px] font-bold text-on-surface mt-1">
                Complete Technology Stack Breakdown
              </h2>
            </div>
            <div className="font-mono text-[11px] text-outline flex items-center gap-2">
              {/* <span>SPECIFICATION STANDARD: IEEE-ZERO-TRUST-V2</span> */}
            </div>
          </div>

          {/* Tech Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Frontend Architecture */}
            <div className="rounded-xl bg-surface-container-low/80 border border-outline-variant/25 p-5 flex flex-col justify-between hover:border-primary/50 transition-all group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-primary-container/20 border border-primary/30 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">desktop_windows</span>
                  </div>
                  <span className="font-mono text-[11px] text-primary font-medium">TIER 01</span>
                </div>
                <h3 className="text-[17px] font-semibold text-on-surface">Frontend Architecture</h3>
                <p className="text-on-surface-variant text-[13px] leading-relaxed">
                  High-performance, SSR-rendered reactive layer built for instant latency response, fluid sub-meter animations, and touch-optimized tenant controls.
                </p>
                <ul className="space-y-2 pt-2 border-t border-outline-variant/15 font-mono text-[12px] text-on-surface-variant">
                  <li className="flex items-center justify-between">
                    <span className="text-on-surface font-sans">Next.js 14 / React 18</span>
                    <span className="text-outline">App Router</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-on-surface font-sans">Tailwind CSS 3.4</span>
                    <span className="text-outline">Fluid Tokens</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-on-surface font-sans">Framer Motion</span>
                    <span className="text-outline">Micro-tactile</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-on-surface font-sans">TypeScript &amp; Geist Font</span>
                    <span className="text-outline">Strict Typing</span>
                  </li>
                </ul>
              </div>
              <div className="mt-4 pt-3 border-t border-outline-variant/15 flex items-center gap-1.5 text-tertiary font-mono text-[11px]">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                Optimized Core Web Vitals (Score: 99)
              </div>
            </div>

            {/* Backend & APIs */}
            <div className="rounded-xl bg-surface-container-low/80 border border-outline-variant/25 p-5 flex flex-col justify-between hover:border-secondary/50 transition-all group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 border border-secondary/30 flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined">dns</span>
                  </div>
                  <span className="font-mono text-[11px] text-secondary font-medium">TIER 02</span>
                </div>
                <h3 className="text-[17px] font-semibold text-on-surface">Backend &amp; APIs</h3>
                <p className="text-on-surface-variant text-[13px] leading-relaxed">
                  Decoupled Spring Boot enterprise microservices orchestrating dynamic utility calculations, unit rate splitters, and asynchronous email OTP dispatches.
                </p>
                <ul className="space-y-2 pt-2 border-t border-outline-variant/15 font-mono text-[12px] text-on-surface-variant">
                  <li className="flex items-center justify-between">
                    <span className="text-on-surface font-sans">Spring Boot 4.1.1</span>
                    <span className="text-outline">Java 25</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-on-surface font-sans">RESTful API Endpoints</span>
                    <span className="text-outline">JSON Specs</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-on-surface font-sans">Jakarta Mail + Angus</span>
                    <span className="text-outline">Gmail SMTP</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-on-surface font-sans">Stateless JWT Auth</span>
                    <span className="text-outline">Zero-Trust</span>
                  </li>
                </ul>
              </div>
              <div className="mt-4 pt-3 border-t border-outline-variant/15 flex items-center gap-1.5 text-secondary font-mono text-[11px]">
                <span className="material-symbols-outlined text-[14px]">bolt</span>
                Rate Limiting: 120 req/min per tenant
              </div>
            </div>

            {/* Database & Storage */}
            <div className="rounded-xl bg-surface-container-low/80 border border-outline-variant/25 p-5 flex flex-col justify-between hover:border-tertiary/50 transition-all group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-tertiary/10 border border-tertiary/30 flex items-center justify-center text-tertiary">
                    <span className="material-symbols-outlined">database</span>
                  </div>
                  <span className="font-mono text-[11px] text-tertiary font-medium">TIER 03</span>
                </div>
                <h3 className="text-[17px] font-semibold text-on-surface">Database &amp; Storage</h3>
                <p className="text-on-surface-variant text-[13px] leading-relaxed">
                  ACID-compliant relational persistence for lease records, meter timestamps, and tamper-resistant filesystem storage for Aadhaar &amp; avatar files.
                </p>
                <ul className="space-y-2 pt-2 border-t border-outline-variant/15 font-mono text-[12px] text-on-surface-variant">
                  <li className="flex items-center justify-between">
                    <span className="text-on-surface font-sans">PostgreSQL 18.6</span>
                    <span className="text-outline">Relational Ledger</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-on-surface font-sans">Hibernate ORM 7.4</span>
                    <span className="text-outline">JPA 3.2</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-on-surface font-sans">HikariCP Pool</span>
                    <span className="text-outline">High Concurrency</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-on-surface font-sans">Point-in-Time Recovery</span>
                    <span className="text-outline">Hourly Sync</span>
                  </li>
                </ul>
              </div>
              <div className="mt-4 pt-3 border-t border-outline-variant/15 flex items-center gap-1.5 text-tertiary font-mono text-[11px]">
                <span className="material-symbols-outlined text-[14px]">shield_with_heart</span>
                BCrypt + Salted Credential Isolation
              </div>
            </div>

            {/* Payment Gateway & Sub-meter Billing (2 Cols on lg) */}
            <div className="lg:col-span-2 rounded-xl bg-surface-container-low/80 border border-outline-variant/25 p-5 flex flex-col justify-between hover:border-primary/50 transition-all group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-primary-container/20 border border-primary/30 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">payments</span>
                  </div>
                  <span className="font-mono text-[11px] text-primary font-medium">FINTECH ENGINE</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <h3 className="text-[17px] font-semibold text-on-surface">Payment Gateway &amp; Sub-meter Engine</h3>
                  <span className="text-secondary font-mono text-[11px]">AUTONOMOUS DISPATCH ACTIVE</span>
                </div>
                <p className="text-on-surface-variant text-[13px] leading-relaxed">
                  Integrates high-velocity payment processors with real-time webhook listeners to verify transactions before updating tenant account ledgers and triggering automated tax-compliant invoice generation.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-outline-variant/15 font-mono text-[12px] text-on-surface-variant">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-on-surface font-medium font-sans">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                      Razorpay SDK v2 Integration
                    </div>
                    <p className="text-outline text-[11px] pl-3.5 leading-relaxed font-sans">
                      Full UPI, NetBanking, Card Rails with HMAC-SHA256 signature verification on callbacks.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-on-surface font-medium font-sans">
                      <span className="w-1.5 h-1.5 bg-secondary rounded-full"></span>
                      Sub-meter Dynamic Tariff Engine
                    </div>
                    <p className="text-outline text-[11px] pl-3.5 leading-relaxed font-sans">
                      Algorithmic calculation: [Current Unit - Previous Unit] * Tier Rate + Fixed Maintenance.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-on-surface font-medium font-sans">
                      <span className="w-1.5 h-1.5 bg-tertiary rounded-full"></span>
                      Automated PDF Invoicing
                    </div>
                    <p className="text-outline text-[11px] pl-3.5 leading-relaxed font-sans">
                      Instant downloadable receipts with encrypted QR verification tokens.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-on-surface font-medium font-sans">
                      <span className="w-1.5 h-1.5 bg-on-surface rounded-full"></span>
                      Automated Reconciliation
                    </div>
                    <p className="text-outline text-[11px] pl-3.5 leading-relaxed font-sans">
                      Zero manual bookkeeping; updates owner payout dashboard instantaneously.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-outline-variant/15 flex items-center justify-between text-outline font-mono text-[11px]">
                <span>Webhook Latency: 1.84s median</span>
                <span className="text-tertiary">100% IDEMPOTENCY KEY ENFORCED</span>
              </div>
            </div>

            {/* Security & Authentication */}
            <div className="rounded-xl bg-surface-container-low/80 border border-outline-variant/25 p-5 flex flex-col justify-between hover:border-secondary/50 transition-all group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-high border border-outline-variant/30 flex items-center justify-center text-on-surface">
                    <span className="material-symbols-outlined">lock_open</span>
                  </div>
                  <span className="font-mono text-[11px] text-outline font-medium">SECURITY PROTOCOL</span>
                </div>
                <h3 className="text-[17px] font-semibold text-on-surface">Security &amp; Zero-Trust Auth</h3>
                <p className="text-on-surface-variant text-[13px] leading-relaxed">
                  Rigorous verification mechanisms ensuring that only authenticated tenants with signed apartment units can view private power readings.
                </p>
                <ul className="space-y-2 pt-2 border-t border-outline-variant/15 font-mono text-[12px] text-on-surface-variant">
                  <li className="flex items-center justify-between">
                    <span className="text-on-surface font-sans">SHA-256 + BCrypt</span>
                    <span className="text-outline">12 Salt Rounds</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-on-surface font-sans">UIDAI Aadhaar Engine</span>
                    <span className="text-outline">Mock Sandbox</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-on-surface font-sans">Encrypted Admin Relay</span>
                    <span className="text-outline">Direct Dispatch</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-on-surface font-sans">Role Separation</span>
                    <span className="text-outline">Tenant vs Landlord</span>
                  </li>
                </ul>
              </div>
              <div className="mt-4 pt-3 border-t border-outline-variant/15 flex items-center gap-1.5 text-primary font-mono text-[11px]">
                <span className="material-symbols-outlined text-[14px]">verified_user</span>
                Zero-Trust Architectural Compliance
              </div>
            </div>
          </div>
        </section>

        {/* 4. Operations Facility Banner */}
        <section className="rounded-xl bg-gradient-to-r from-surface-container-low via-surface-container to-surface-container-low border border-outline-variant/25 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 border border-secondary/30 flex items-center justify-center text-secondary shrink-0 shadow-[0_0_15px_rgba(76,215,246,0.3)]">
              <span className="material-symbols-outlined text-[28px]">apartment</span>
            </div>
            <div>
              <h4 className="text-[17px] sm:text-[18px] font-bold text-on-surface">Singh Luxury Heights Operations Facility</h4>
              <p className="text-on-surface-variant text-[13px] mt-0.5">
                Physical property integrated with smart IoT digital meters and automated high-voltage safety interlocks.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="font-mono text-[12px] text-on-surface font-semibold">Wing A &amp; B Connected</div>
              <div className="font-mono text-[11px] text-tertiary">36/36 Smart Meters Synchronized</div>
            </div>
            <div className="w-3 h-3 rounded-full bg-tertiary animate-pulse"></div>
          </div>
        </section>
      </main>

      {/* Version & System Status Footer */}
      <footer className="w-full py-8 px-6 sm:px-8 bg-surface-container-lowest border-t border-outline-variant/15 mt-12 relative z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Left: Copyright & Zero-Trust Notice */}
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[12px] text-on-surface font-semibold tracking-wider">AUTH//VAULT</span>
              <span className="text-outline text-xs">•</span>
              <span className="font-mono text-[12px] text-on-surface-variant">SINGH RENT HOUSE ENTERPRISE</span>
            </div>
            <p className="font-mono text-[11px] text-outline text-center md:text-left">
              &copy; 2025 AUTH//VAULT Enterprise Security Inc. Zero-Trust Architecture. All rights reserved.
            </p>
          </div>

          {/* Center: Version & Database Sync Meta */}
          <div className="flex items-center gap-4 px-4 py-2 rounded-lg bg-surface-container-low border border-outline-variant/20">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-ping"></span>
              <span className="font-mono text-[11px] text-tertiary font-medium">DB SYNC ACTIVE</span>
            </div>
            <span className="text-outline-variant">|</span>
            <div className="font-mono text-[11px] text-on-surface">
              VER: <span className="text-primary font-bold">v2.4.0-PROD</span>
            </div>
            <span className="text-outline-variant">|</span>
            <div className="font-mono text-[11px] text-outline">BUILD: 2026.09.17</div>
          </div>

          {/* Right: Protocol Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 font-mono text-[11px] text-on-surface-variant">
            <Link className="hover:text-primary transition-colors" href="/about">
              System Audit
            </Link>
            <Link className="hover:text-primary transition-colors" href="/contact">
              Admin Relay
            </Link>
            <Link className="hover:text-primary transition-colors" href="/login">
              Tenant Auth
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
