"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface PaymentItem {
  id: number;
  userId: number;
  userName: string;
  userMobile: string;
  roomId: number;
  roomCode: string;
  billingMonth: string;
  rentAmount: number;
  electricityAmount: number;
  totalAmount: number;
  amountPaid: number;
  pendingAmount: number;
  paymentStatus: "PENDING" | "PAID" | "PARTIAL" | string;
  paymentMode: string | null;
  transactionReference: string | null;
  paymentDate: string | null;
  createdAt: string;
}

interface MonthlyAnalysisPoint {
  month: string;
  rentInflow: number;
  powerUnitsKwh: number;
  lightBillAmount: number;
}

interface AnalyticsData {
  rentMonthlyTotal: number;
  lightBillMonthlyTotal: number;
  userActiveCount: number;
  userInactiveCount: number;
  userTotalCount: number;
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  pendingApprovalsCount: number;
  totalPendingDues: number;
  totalCollectedRevenue: number;
  monthlyAnalysis: MonthlyAnalysisPoint[];
  recentPayments?: PaymentItem[];
}

interface DashboardAnalyticsViewProps {
  showToast: (msg: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

export default function DashboardAnalyticsView({
  showToast,
  onNavigateToTab,
}: DashboardAnalyticsViewProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [recentPayments, setRecentPayments] = useState<PaymentItem[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentItem | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<"ALL" | "PAID">("PAID");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState("Live DB Telemetry");
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [showRentInflow, setShowRentInflow] = useState(true);
  const [showPowerDemand, setShowPowerDemand] = useState(true);

  const fetchAnalytics = async (periodOverride?: string) => {
    setIsLoading(true);
    const targetPeriod = periodOverride !== undefined ? periodOverride : activePeriod;
    try {
      const res = await fetch(`http://localhost:8080/api/admin/dashboard/analytics?period=${encodeURIComponent(targetPeriod)}`);
      if (res.ok) {
        const json = await res.json();
        if (json?.data) {
          setData(json.data);
          if (json.data.recentPayments && json.data.recentPayments.length > 0) {
            setRecentPayments(json.data.recentPayments);
          }
        }
      }
      // Also fetch payments to guarantee complete updated ledger
      const pRes = await fetch("http://localhost:8080/api/admin/payments");
      if (pRes.ok) {
        const pJson = await pRes.json();
        if (pJson?.data && pJson.data.length > 0) {
          setRecentPayments(pJson.data);
        }
      }
    } catch (err) {
      console.error("Failed to load dashboard analytics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCsv = async () => {
    setIsExportingCsv(true);
    showToast(`Generating ${activePeriod} CSV report...`);
    try {
      const url = `http://localhost:8080/api/admin/dashboard/export-csv?period=${encodeURIComponent(activePeriod)}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Export failed with status: ${res.status}`);
      }
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      const sanitizedPeriod = activePeriod.replace(/\s+/g, "_");
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      link.download = `Singh_Rent_House_${sanitizedPeriod}_${dateStr}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      showToast(`✓ CSV report downloaded: Singh_Rent_House_${sanitizedPeriod}_${dateStr}.csv`);
    } catch (err) {
      console.warn("Backend CSV export failed, triggering client-side generator:", err);
      exportClientSideCsv();
    } finally {
      setIsExportingCsv(false);
    }
  };

  const exportClientSideCsv = () => {
    try {
      const payments = recentPayments.length > 0 ? recentPayments : (data?.recentPayments || []);
      const headers = [
        "Transaction ID",
        "Tenant Name",
        "Mobile Number",
        "Room Code",
        "Billing Month",
        "Rent Amount (INR)",
        "Electricity Amount (INR)",
        "Total Amount (INR)",
        "Amount Paid (INR)",
        "Pending Amount (INR)",
        "Payment Status",
        "Payment Mode",
        "Transaction Reference",
        "Payment Date",
        "Created Date"
      ];

      const rows = payments.map((p) => [
        p.id,
        `"${(p.userName || "N/A").replace(/"/g, '""')}"`,
        `"${(p.userMobile || "N/A").replace(/"/g, '""')}"`,
        `"${(p.roomCode || "N/A").replace(/"/g, '""')}"`,
        `"${(p.billingMonth || "").replace(/"/g, '""')}"`,
        (p.rentAmount ?? 0).toFixed(2),
        (p.electricityAmount ?? 0).toFixed(2),
        (p.totalAmount ?? 0).toFixed(2),
        (p.amountPaid ?? 0).toFixed(2),
        (p.pendingAmount ?? 0).toFixed(2),
        `"${(p.paymentStatus || "PENDING").replace(/"/g, '""')}"`,
        `"${(p.paymentMode || "N/A").replace(/"/g, '""')}"`,
        `"${(p.transactionReference || "N/A").replace(/"/g, '""')}"`,
        `"${(p.paymentDate || "N/A").replace(/"/g, '""')}"`,
        `"${(p.createdAt || "N/A").replace(/"/g, '""')}"`
      ]);

      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      const sanitizedPeriod = activePeriod.replace(/\s+/g, "_");
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      link.download = `Singh_Rent_House_${sanitizedPeriod}_${dateStr}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      showToast(`✓ CSV report downloaded: Singh_Rent_House_${sanitizedPeriod}_${dateStr}.csv`);
    } catch (error) {
      console.error("Client CSV export error:", error);
      showToast("❌ Failed to download CSV file");
    }
  };

  useEffect(() => {
    fetchAnalytics("Live DB Telemetry");
  }, []);

  const formatRupees = (amt?: number) => {
    if (amt === undefined || amt === null) return "₹0";
    return "₹" + Math.round(amt).toLocaleString("en-IN");
  };

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "Just now";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "TN";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const displayedPayments = recentPayments.filter((p: PaymentItem) => {
    const q = paymentSearch.toLowerCase();
    const matchesSearch =
      !q ||
      (p.userName && p.userName.toLowerCase().includes(q)) ||
      (p.roomCode && p.roomCode.toLowerCase().includes(q)) ||
      (p.billingMonth && p.billingMonth.toLowerCase().includes(q)) ||
      (p.transactionReference && p.transactionReference.toLowerCase().includes(q));

    if (paymentFilter === "PAID") return matchesSearch && (p.paymentStatus === "PAID" || p.amountPaid > 0);
    return matchesSearch;
  });

  const points = data?.monthlyAnalysis || [];
  const rentValues = [
    ...points.map((p) => p.rentInflow || 0),
    data?.rentMonthlyTotal || 0,
    data?.totalCollectedRevenue || 0,
  ];
  const powerValues = [
    ...points.map((p) => p.powerUnitsKwh || 0),
    Math.round((data?.lightBillMonthlyTotal || 0) / 6),
  ];
  const maxRent = Math.max(...rentValues, 5000);
  const maxPower = Math.max(...powerValues, 50);

  // SVG Coordinates calculation
  const getCoordinates = (index: number, total: number, value: number, max: number) => {
    const x = total <= 1 ? 500 : 60 + (index / (total - 1)) * 880;
    const y = 280 - (value / Math.max(1, max)) * 220;
    return { x, y };
  };

  const rentCoords = points.map((p, i) =>
    getCoordinates(i, points.length, p.rentInflow, maxRent)
  );
  const powerCoords = points.map((p, i) =>
    getCoordinates(i, points.length, p.powerUnitsKwh, maxPower)
  );

  const createPath = (coords: { x: number; y: number }[]) => {
    if (coords.length === 0) return "";
    return coords.reduce(
      (acc, c, i) => (i === 0 ? `M ${c.x} ${c.y}` : `${acc} L ${c.x} ${c.y}`),
      ""
    );
  };

  const createAreaPath = (coords: { x: number; y: number }[]) => {
    if (coords.length === 0) return "";
    const first = coords[0];
    const last = coords[coords.length - 1];
    const line = createPath(coords);
    return `${line} L ${last.x} 290 L ${first.x} 290 Z`;
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION & TELEMETRY FILTERS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-outline-variant/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary-container/20 text-secondary border border-secondary/30">
              3.1 Dashboard Core
            </span>
            <h1 className="text-[26px] lg:text-[30px] font-bold text-on-surface tracking-tight">
              Dashboard & Telemetry Analytics
            </h1>
          </div>
          <p className="text-on-surface-variant text-sm mt-0.5">
            Real-time PostgreSQL database synchronization for rent collections, sub-meter light power, and tenant directory.
          </p>
        </div>

        {/* Filter & Export Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Period Selector */}
          <div className="flex items-center bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-1 text-xs font-mono">
            {["Live DB Telemetry", "Current Cycle", "Year-To-Date"].map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => {
                  setActivePeriod(period);
                  fetchAnalytics(period);
                  showToast(`Switched view to ${period}`);
                }}
                className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                  activePeriod === period
                    ? "bg-surface-container-high text-on-surface font-medium border border-outline-variant/40 shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {period}
              </button>
            ))}
          </div>

          {/* Export PDF/CSV */}
          <div className="flex items-center gap-1 bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-1 text-xs font-mono">
            <button
              type="button"
              disabled={isExportingCsv}
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 px-3 py-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded cursor-pointer font-medium disabled:opacity-50 transition-colors"
              title={`Download ${activePeriod} CSV Ledger`}
            >
              <span className={`material-symbols-outlined text-[16px] text-secondary ${isExportingCsv ? "animate-spin" : ""}`}>
                {isExportingCsv ? "progress_activity" : "file_download"}
              </span>
              <span>{isExportingCsv ? "Exporting..." : "CSV"}</span>
            </button>
          </div>

          {/* Live Refresh */}
          <button
            type="button"
            title="Force Refresh Data from Database"
            onClick={() => {
              fetchAnalytics(activePeriod);
              showToast("Sync refreshed from PostgreSQL database tables!");
            }}
            className="p-2 bg-surface-container-lowest hover:bg-surface-container border border-outline-variant/30 text-secondary rounded-lg active:scale-95 transition-all cursor-pointer"
          >
            <span className={`material-symbols-outlined text-[18px] ${isLoading ? "animate-spin" : ""}`}>
              autorenew
            </span>
          </button>
        </div>
      </div>

      {/* 3 PRIMARY TELEMETRY KPI TILES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* TILE 1: RENT MONTHLY TOTAL AMOUNT (Section 3.1.2) */}
        <div className="bg-surface-container-low rounded-xl p-6 relative overflow-hidden flex flex-col justify-between border border-outline-variant/30 shadow-lg">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-primary-container/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                  <span className="material-symbols-outlined text-[18px]">currency_rupee</span>
                </span>
                <span className="font-mono text-xs text-on-surface-variant">
                  3.1.2 Rent Monthly Total
                </span>
              </div>
              <span className="font-mono text-[11px] text-tertiary bg-tertiary/10 border border-tertiary/20 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-[12px]">database</span> {activePeriod}
              </span>
            </div>

            {/* Main Amount */}
            <div className="mt-2">
              <div className="text-[32px] sm:text-[36px] text-on-surface font-bold tracking-tight">
                {formatRupees(data?.rentMonthlyTotal)}
              </div>
              <div className="text-xs text-outline mt-0.5">
                Total monthly rental yield realized & expected
              </div>
            </div>
          </div>

          {/* Realized vs Pending */}
          <div className="mt-6 pt-4 border-t border-outline-variant/30 space-y-3">
            <div className="flex justify-between items-center font-mono text-[11px]">
              <span className="text-on-surface-variant">
                Realized: {formatRupees(data?.totalCollectedRevenue)}
              </span>
              <span className="text-error font-medium">
                Pending: {formatRupees(data?.totalPendingDues)}
              </span>
            </div>
            <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden flex">
              <div
                className="bg-primary-container h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      15,
                      ((data?.totalCollectedRevenue || 1) /
                        Math.max(1, (data?.totalCollectedRevenue || 0) + (data?.totalPendingDues || 0))) *
                        100
                    )
                  )}%`,
                }}
              />
              <div
                className="bg-error-container h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    85,
                    Math.max(
                      5,
                      ((data?.totalPendingDues || 0) /
                        Math.max(1, (data?.totalCollectedRevenue || 0) + (data?.totalPendingDues || 0))) *
                        100
                    )
                  )}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-outline font-mono">
              <span>{data?.occupiedRooms || 0} Occupied Units</span>
              <span>{data?.vacantRooms || 0} Vacant</span>
            </div>
          </div>
        </div>

        {/* TILE 2: POWER / LIGHT BILL TOTAL AMOUNT (Section 3.1.3) */}
        <div className="bg-surface-container-low rounded-xl p-6 relative overflow-hidden flex flex-col justify-between border border-outline-variant/30 shadow-lg">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-secondary/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-md bg-secondary/10 text-secondary border border-secondary/20">
                  <span className="material-symbols-outlined text-[18px]">electric_bolt</span>
                </span>
                <span className="font-mono text-xs text-on-surface-variant">
                  3.1.3 Light Bill Total Amount
                </span>
              </div>
              <span className="font-mono text-[11px] text-secondary bg-secondary/10 border border-secondary/20 px-2 py-0.5 rounded-full font-medium">
                ₹6.00 / kWh Unit
              </span>
            </div>

            {/* Main Amount & Power Aggregate */}
            <div className="mt-2">
              <div className="text-[32px] sm:text-[36px] text-on-surface font-bold tracking-tight">
                {formatRupees(data?.lightBillMonthlyTotal)}
              </div>
              <div className="text-xs text-outline mt-0.5">
                Calculated dynamically: (Units Consumed) × ₹6.00
              </div>
            </div>
          </div>

          {/* Submeter Telemetry Metric */}
          <div className="mt-6 pt-4 border-t border-outline-variant/30 space-y-3">
            <div className="flex justify-between items-center font-mono text-[11px]">
              <span className="text-on-surface-variant">
                Total Units: ~{Math.round((data?.lightBillMonthlyTotal || 0) / 6)} kWh
              </span>
              <span className="text-tertiary font-medium">Rate: Fixed ₹6/unit</span>
            </div>
            <div className="flex items-center justify-between bg-surface-container-lowest px-3 py-2 rounded-lg border border-outline-variant/30 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-tertiary" />
                <span className="text-on-surface-variant">Meter Sync Active</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                <span className="text-on-surface-variant">Formula Bound</span>
              </div>
            </div>
          </div>
        </div>

        {/* TILE 3: USER TOTAL COUNT ACTIVE AND INACTIVE (Section 3.1.4) */}
        <div className="bg-surface-container-low rounded-xl p-6 relative overflow-hidden flex flex-col justify-between border border-outline-variant/30 shadow-lg">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-tertiary/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-md bg-tertiary/10 text-tertiary border border-tertiary/20">
                  <span className="material-symbols-outlined text-[18px]">group</span>
                </span>
                <span className="font-mono text-xs text-on-surface-variant">
                  3.1.4 User Total Count
                </span>
              </div>
              <span className="font-mono text-[11px] text-tertiary bg-tertiary/10 border border-tertiary/20 px-2 py-0.5 rounded-full font-medium">
                {data?.userTotalCount || 0} Registered
              </span>
            </div>

            {/* Main Counts */}
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-[32px] sm:text-[36px] text-tertiary font-bold tracking-tight">
                {data?.userActiveCount || 0}
              </span>
              <span className="text-sm text-tertiary font-medium">Active</span>
              <span className="text-outline">/</span>
              <span className="text-[26px] text-on-surface-variant font-semibold">
                {data?.userInactiveCount || 0}
              </span>
              <span className="text-xs text-outline">Inactive / Pending</span>
            </div>
            <div className="text-xs text-outline mt-0.5">
              Fetched from PostgreSQL &quot;users&quot; table
            </div>
          </div>

          {/* Active/Inactive Bar */}
          <div className="mt-6 pt-4 border-t border-outline-variant/30 space-y-3">
            <div className="flex justify-between items-center font-mono text-[11px]">
              <span className="text-tertiary font-medium">
                {data?.userActiveCount || 0} Active
              </span>
              <span className="text-outline">
                {data?.userInactiveCount || 0} Inactive / Pending
              </span>
            </div>
            <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden flex">
              <div
                className="bg-tertiary h-full transition-all duration-500"
                style={{
                  width: `${
                    (data?.userTotalCount || 0) > 0
                      ? ((data?.userActiveCount || 0) / (data?.userTotalCount || 1)) * 100
                      : 50
                  }%`,
                }}
              />
              <div
                className="bg-outline-variant h-full transition-all duration-500"
                style={{
                  width: `${
                    (data?.userTotalCount || 0) > 0
                      ? ((data?.userInactiveCount || 0) / (data?.userTotalCount || 1)) * 100
                      : 50
                  }%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-outline font-mono">
              <button
                type="button"
                onClick={() => onNavigateToTab?.("Pending Approvals")}
                className="text-secondary hover:underline cursor-pointer"
              >
                {data?.pendingApprovalsCount || 0} Pending Approvals →
              </button>
              <button
                type="button"
                onClick={() => onNavigateToTab?.("User Directory")}
                className="text-on-surface-variant hover:underline cursor-pointer"
              >
                View Directory →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3.1.1 DATA ANALYSIS GRAPH (DUAL-AXIS TELEMETRY ENGINE) */}
      <div className="bg-surface-container-low rounded-xl p-6 xl:p-8 border border-outline-variant/30 relative shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-outline-variant/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-secondary/15 text-secondary border border-secondary/30">
                3.1.1 Data Analysis Graph
              </span>
              <h2 className="text-[20px] font-semibold text-on-surface">
                Rent Inflow vs. Electricity Load Telemetry
              </h2>
            </div>
            <p className="text-sm text-on-surface-variant mt-1">
              Multi-metric correlation tracking gross rupee collection (₹ INR) mapped against sub-metered unit consumption (kWh).
            </p>
          </div>

          {/* Series Toggle Pills */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer bg-surface-container-lowest border border-outline-variant/30 px-3 py-1.5 rounded-lg hover:border-primary-container transition-all">
              <input
                type="checkbox"
                checked={showRentInflow}
                onChange={(e) => setShowRentInflow(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-surface-container text-primary-container focus:ring-0"
              />
              <span className="w-2.5 h-2.5 rounded-full bg-primary-container" />
              <span className="font-mono text-xs text-on-surface">Rent Inflow (₹)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer bg-surface-container-lowest border border-outline-variant/30 px-3 py-1.5 rounded-lg hover:border-secondary transition-all">
              <input
                type="checkbox"
                checked={showPowerDemand}
                onChange={(e) => setShowPowerDemand(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-surface-container text-secondary focus:ring-0"
              />
              <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
              <span className="font-mono text-xs text-on-surface">Light Units (kWh)</span>
            </label>
          </div>
        </div>

        {/* SVG Interactive Telemetry Graph Display */}
        <div className="relative mt-6 w-full h-80 xl:h-96">
          {/* Background Grid Lines and Y-Axis Legends */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none font-mono text-[11px] text-outline-variant/60">
            <div className="border-b border-outline-variant/15 w-full flex justify-between pb-1">
              <span>{formatRupees(maxRent)}</span>
              <span>{Math.round(maxPower).toLocaleString()} kWh</span>
            </div>
            <div className="border-b border-outline-variant/15 w-full flex justify-between pb-1">
              <span>{formatRupees(maxRent * 0.75)}</span>
              <span>{Math.round(maxPower * 0.75).toLocaleString()} kWh</span>
            </div>
            <div className="border-b border-outline-variant/15 w-full flex justify-between pb-1">
              <span>{formatRupees(maxRent * 0.5)}</span>
              <span>{Math.round(maxPower * 0.5).toLocaleString()} kWh</span>
            </div>
            <div className="border-b border-outline-variant/15 w-full flex justify-between pb-1">
              <span>{formatRupees(maxRent * 0.25)}</span>
              <span>{Math.round(maxPower * 0.25).toLocaleString()} kWh</span>
            </div>
            <div className="flex justify-between pt-1">
              <span>₹0</span>
              <span>0 kWh</span>
            </div>
          </div>

          {/* SVG Data Visualizer */}
          <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 320">
            <defs>
              <linearGradient id="rentGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="powerGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#4cd7f6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#4cd7f6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Series 1: Rent Inflow */}
            {showRentInflow && rentCoords.length > 0 && (
              <>
                <path d={createAreaPath(rentCoords)} fill="url(#rentGradient)" />
                <path
                  d={createPath(rentCoords)}
                  fill="none"
                  stroke="#4f46e5"
                  strokeLinecap="round"
                  strokeWidth="3.5"
                />
                {rentCoords.map((c, i) => (
                  <circle
                    key={`rent-${i}`}
                    cx={c.x}
                    cy={c.y}
                    fill="#c3c0ff"
                    r="5"
                    stroke="#4f46e5"
                    strokeWidth="2"
                  />
                ))}
              </>
            )}

            {/* Series 2: Electricity Bill / Power */}
            {showPowerDemand && powerCoords.length > 0 && (
              <>
                <path d={createAreaPath(powerCoords)} fill="url(#powerGradient)" />
                <path
                  d={createPath(powerCoords)}
                  fill="none"
                  stroke="#4cd7f6"
                  strokeDasharray="4 3"
                  strokeLinecap="round"
                  strokeWidth="2.5"
                />
                {powerCoords.map((c, i) => (
                  <circle
                    key={`power-${i}`}
                    cx={c.x}
                    cy={c.y}
                    fill="#4cd7f6"
                    r="4.5"
                    stroke="#0b1326"
                    strokeWidth="2"
                  />
                ))}
              </>
            )}
          </svg>

          {/* Current Month Telemetry Tooltip */}
          <div className="absolute right-6 top-4 bg-surface-container border border-primary/40 shadow-2xl p-3.5 rounded-xl w-64 z-20 pointer-events-auto font-mono">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-1.5 mb-2">
              <span className="text-xs text-on-surface font-semibold uppercase">
                {points.length > 0 ? points[points.length - 1].month : "CURRENT CYCLE"} (ACTIVE)
              </span>
              <span className="text-[10px] text-tertiary bg-tertiary/15 px-1.5 py-0.5 rounded border border-tertiary/30">
                DB Live
              </span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary-container" /> Rent Realized:
                </span>
                <span className="text-on-surface font-semibold">
                  {formatRupees(data?.rentMonthlyTotal)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-secondary" /> Power Demand:
                </span>
                <span className="text-on-surface font-semibold">
                  {Math.round((data?.lightBillMonthlyTotal || 0) / 6).toLocaleString()} kWh
                </span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-outline-variant/20">
                <span className="text-outline">Net Power Invoiced:</span>
                <span className="text-secondary font-medium">
                  {formatRupees(data?.lightBillMonthlyTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* X-Axis Timeline Month Labels */}
        <div className="flex justify-between font-mono text-xs text-on-surface-variant pt-3 border-t border-outline-variant/20">
          {points.map((p, idx) => (
            <span
              key={p.month}
              className={idx === points.length - 1 ? "text-primary font-semibold" : ""}
            >
              {p.month}
            </span>
          ))}
        </div>
      </div>

      {/* 3.1.2 LIVE PAYMENT HISTORY & COMPLETED USER TRANSACTIONS */}
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-6 shadow-sm space-y-5">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-tertiary/15 text-tertiary border border-tertiary/30 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                Live Payment Stream
              </span>
              <h2 className="text-[20px] font-semibold text-on-surface">
                Completed Tenant Payments &amp; History
              </h2>
            </div>
            <p className="text-sm text-on-surface-variant mt-1">
              Real-time feed updating automatically as tenants complete rent and electricity bill payments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Toggle */}
            <div className="flex items-center bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-1 text-xs font-mono">
              <button
                type="button"
                onClick={() => setPaymentFilter("PAID")}
                className={`px-3 py-1 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                  paymentFilter === "PAID"
                    ? "bg-tertiary text-on-tertiary font-bold shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                Settled / Paid ({recentPayments.filter((p) => p.paymentStatus === "PAID" || p.amountPaid > 0).length})
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter("ALL")}
                className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                  paymentFilter === "ALL"
                    ? "bg-primary-container text-white font-bold shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                All Records ({recentPayments.length})
              </button>
            </div>

            {/* Sync DB Button */}
            <button
              type="button"
              onClick={() => {
                fetchAnalytics();
                showToast("Payment history refreshed from database.");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface text-xs font-mono border border-outline-variant/40 transition-all cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[16px] text-secondary ${isLoading ? "animate-spin" : ""}`}>
                sync
              </span>
              Sync DB
            </button>

            {/* Full Ledger Shortcut */}
            {onNavigateToTab && (
              <button
                type="button"
                onClick={() => onNavigateToTab("Payment Ledger")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-container/20 hover:bg-primary-container/30 text-secondary border border-secondary/30 text-xs font-mono transition-all cursor-pointer"
              >
                <span>Full Ledger (3.7)</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-mono text-outline uppercase">Total Realized Revenue</div>
              <div className="text-xl font-bold text-tertiary mt-0.5">
                {formatRupees(data?.totalCollectedRevenue)}
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-tertiary/10 border border-tertiary/20 flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-mono text-outline uppercase">Settled Payments</div>
              <div className="text-xl font-bold text-on-surface mt-0.5">
                {recentPayments.filter((p) => p.paymentStatus === "PAID" || p.amountPaid > 0).length} Transactions
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-primary-container/10 border border-primary-container/20 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[20px]">verified</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-mono text-outline uppercase">Latest Payment</div>
              <div className="text-sm font-bold text-on-surface mt-0.5 truncate max-w-[180px]">
                {recentPayments.length > 0 && recentPayments[0].amountPaid > 0
                  ? `₹${recentPayments[0].amountPaid.toLocaleString("en-IN")} by ${recentPayments[0].userName}`
                  : "No payments yet"}
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[20px]">schedule</span>
            </div>
          </div>
        </div>

        {/* Search Input Filter */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-2 text-outline text-[16px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search tenant name, room, month, txn ref..."
              value={paymentSearch}
              onChange={(e) => setPaymentSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs font-body bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary transition-all"
            />
          </div>
          <span className="text-xs font-mono text-outline">
            Showing {displayedPayments.length} of {recentPayments.length} transactions
          </span>
        </div>

        {/* Transactions Table */}
        <div className="border border-outline-variant/30 rounded-xl overflow-hidden bg-surface-container-lowest">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container border-b border-outline-variant/30 text-[11px] font-mono text-outline uppercase tracking-wider">
                  <th className="py-3 px-4">Txn / Voucher</th>
                  <th className="py-3 px-4">Tenant Name</th>
                  <th className="py-3 px-4">Room / Unit</th>
                  <th className="py-3 px-4">Billing Month</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Mode &amp; Reference</th>
                  <th className="py-3 px-4">Payment Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-xs font-mono">
                {displayedPayments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-outline">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <span className="material-symbols-outlined text-[28px] text-outline">
                          receipt_long
                        </span>
                        <span>No completed payment records found in this view.</span>
                        <span className="text-[11px] text-outline-variant">
                          When a tenant pays dues via online UPI or admin marks paid, it will appear here immediately.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedPayments.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-surface-container/60 transition-colors"
                    >
                      {/* Txn ID */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-on-surface">#PAY-{p.id}</span>
                        <div className="text-[10px] text-outline">
                          {p.transactionReference ? p.transactionReference.slice(0, 14) : `REC-${p.id}`}
                        </div>
                      </td>

                      {/* Tenant Details */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5 font-body">
                          <div className="w-7 h-7 rounded-full bg-primary-container/20 border border-primary-container/40 flex items-center justify-center text-[10px] font-bold text-secondary font-mono">
                            {getInitials(p.userName)}
                          </div>
                          <div>
                            <div className="font-semibold text-on-surface">{p.userName}</div>
                            <div className="text-[10px] text-outline font-mono">
                              +91 {p.userMobile}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Room Code */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-surface-container border border-outline-variant/40 font-bold text-secondary text-[11px]">
                          {p.roomCode}
                        </span>
                      </td>

                      {/* Month */}
                      <td className="py-3 px-4 text-on-surface">
                        {p.billingMonth === "Security Deposit" ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-semibold text-[10px] border border-amber-500/30">
                            <span className="material-symbols-outlined text-[12px]">security</span>
                            Security Deposit
                          </span>
                        ) : (
                          p.billingMonth
                        )}
                      </td>

                      {/* Amount Paid */}
                      <td className="py-3 px-4">
                        <div className="text-sm font-bold text-tertiary">
                          ₹{(p.amountPaid || 0).toLocaleString("en-IN")}
                        </div>
                        <div className="text-[10px] text-outline">
                          {p.billingMonth === "Security Deposit" ? (
                            <span className="text-amber-400 font-medium">Deposit Escrow (CASH)</span>
                          ) : (
                            `Rent: ₹${p.rentAmount} | Power: ₹${(p.electricityAmount || 0).toFixed(1)}`
                          )}
                        </div>
                      </td>

                      {/* Mode & Reference */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            p.paymentMode === "CASH"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                              : "bg-surface-container border border-outline-variant/30 text-on-surface"
                          }`}
                        >
                          {p.paymentMode || "CASH"}
                        </span>
                        {p.transactionReference && (
                          <div className="text-[10px] text-outline truncate max-w-[120px]" title={p.transactionReference}>
                            {p.transactionReference}
                          </div>
                        )}
                      </td>

                      {/* Payment Date & Time */}
                      <td className="py-3 px-4 text-on-surface-variant text-[11px]">
                        {formatDateTime(p.paymentDate || p.createdAt)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            p.paymentStatus === "PAID"
                              ? "bg-tertiary/15 text-tertiary border border-tertiary/30"
                              : p.paymentStatus === "PARTIAL"
                              ? "bg-secondary/15 text-secondary border border-secondary/30"
                              : "bg-error/15 text-error border border-error/30"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              p.paymentStatus === "PAID"
                                ? "bg-tertiary"
                                : p.paymentStatus === "PARTIAL"
                                ? "bg-secondary"
                                : "bg-error"
                            }`}
                          />
                          {p.paymentStatus}
                        </span>
                      </td>

                      {/* Receipt Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedReceipt(p)}
                          className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface hover:text-secondary border border-outline-variant/30 text-[11px] font-mono transition-all cursor-pointer flex items-center gap-1 ml-auto"
                          title="View Receipt Voucher"
                        >
                          <span className="material-symbols-outlined text-[15px] text-secondary">
                            receipt_long
                          </span>
                          Voucher
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* RECEIPT VOUCHER PREVIEW MODAL */}
      <AnimatePresence>
        {selectedReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-low border border-outline-variant/40 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 font-mono text-xs relative"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary text-[22px]">
                    verified
                  </span>
                  <div>
                    <h3 className="font-bold text-on-surface text-base">Payment Receipt Voucher</h3>
                    <p className="text-[10px] text-outline">Voucher #REC-{selectedReceipt.id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="p-1.5 rounded-lg hover:bg-surface-container text-outline hover:text-on-surface cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Voucher Content */}
              <div className="space-y-2 p-3.5 bg-surface-container-lowest rounded-lg border border-outline-variant/20">
                <div className="flex justify-between">
                  <span className="text-outline">Tenant Name:</span>
                  <span className="text-on-surface font-bold font-body">{selectedReceipt.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Contact Mobile:</span>
                  <span className="text-on-surface">+91 {selectedReceipt.userMobile}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Unit / Room:</span>
                  <span className="text-secondary font-bold">{selectedReceipt.roomCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Billing Period / Type:</span>
                  <span className="text-on-surface font-semibold">
                    {selectedReceipt.billingMonth === "Security Deposit" ? (
                      <span className="text-amber-400">Security Deposit (Escrow Holding)</span>
                    ) : (
                      selectedReceipt.billingMonth
                    )}
                  </span>
                </div>

                {selectedReceipt.billingMonth === "Security Deposit" ? (
                  <div className="flex justify-between py-1 border-t border-outline-variant/20">
                    <span className="text-outline">Security Deposit:</span>
                    <span className="text-on-surface font-bold">
                      ₹{selectedReceipt.rentAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between py-1 border-t border-outline-variant/20">
                      <span className="text-outline">Base Rent:</span>
                      <span className="text-on-surface font-bold">
                        ₹{selectedReceipt.rentAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-outline">Light Bill:</span>
                      <span className="text-on-surface font-bold">
                        ₹{selectedReceipt.electricityAmount.toLocaleString("en-IN", { minimumFractionDigits: 1 })}
                      </span>
                    </div>
                  </>
                )}

                <div className="flex justify-between py-1.5 border-t border-outline-variant/30 text-sm">
                  <span className="font-bold text-on-surface">Total Invoiced:</span>
                  <span className="font-bold text-on-surface">
                    ₹{selectedReceipt.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between bg-tertiary/10 p-2 rounded-md">
                  <span className="font-bold text-tertiary">Amount Received:</span>
                  <span className="font-bold text-tertiary text-sm">
                    ₹{selectedReceipt.amountPaid.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-outline">Outstanding Due:</span>
                  <span className={selectedReceipt.pendingAmount > 0 ? "text-error font-bold" : "text-tertiary font-bold"}>
                    ₹{selectedReceipt.pendingAmount.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex justify-between pt-1 border-t border-outline-variant/20">
                  <span className="text-outline">Payment Method:</span>
                  <span className="text-secondary font-semibold">
                    {selectedReceipt.paymentMode || "UPI"}
                  </span>
                </div>

                {selectedReceipt.transactionReference && (
                  <div className="flex justify-between">
                    <span className="text-outline">Txn Reference:</span>
                    <span className="text-on-surface font-mono text-[11px]">
                      {selectedReceipt.transactionReference}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-outline">Settled At:</span>
                  <span className="text-on-surface-variant">
                    {formatDateTime(selectedReceipt.paymentDate || selectedReceipt.createdAt)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">print</span>
                  Print
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="px-4 py-1.5 rounded-lg bg-primary-container hover:bg-indigo-600 text-white font-bold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
