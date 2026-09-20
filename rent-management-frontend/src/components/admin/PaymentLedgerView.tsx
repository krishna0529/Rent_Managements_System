"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAdminSession } from "@/lib/auth";

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
  totalAmount: number; // rent + electricity
  amountPaid: number;
  pendingAmount: number;
  paymentStatus: "PENDING" | "PAID" | "PARTIAL" | "FAILED";
  paymentMode: string | null;
  transactionReference: string | null;
  paymentDate: string | null;
  createdAt: string;
}

interface PaymentLedgerViewProps {
  showToast: (msg: string) => void;
}

export default function PaymentLedgerView({ showToast }: PaymentLedgerViewProps) {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"PENDING" | "ALL" | "PAID" | "FAILED">("PENDING");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [settlePayment, setSettlePayment] = useState<PaymentItem | null>(null);
  const [previewReceipt, setPreviewReceipt] = useState<PaymentItem | null>(null);
  const [deletePaymentId, setDeletePaymentId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Status Change Modal State
  const [statusPayment, setStatusPayment] = useState<PaymentItem | null>(null);
  const [targetStatus, setTargetStatus] = useState<"PENDING" | "FAILED" | "PAID">("PENDING");
  const [statusReason, setStatusReason] = useState<string>("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Settle form
  const [settleAmount, setSettleAmount] = useState<string>("");
  const [settleMode, setSettleMode] = useState<string>("UPI");
  const [settleTxnRef, setSettleTxnRef] = useState<string>("");

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/admin/payments");
      if (res.ok) {
        const json = await res.json();
        if (json?.data) setPayments(json.data);
      }
    } catch (err) {
      console.error("Failed to load payment ledger:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const openSettleModal = (p: PaymentItem) => {
    setSettlePayment(p);
    setSettleAmount(String(p.pendingAmount > 0 ? p.pendingAmount : p.totalAmount));
    setSettleMode("UPI");
    setSettleTxnRef(`UPI-${Date.now().toString().slice(-6)}`);
  };

  const openStatusModal = (p: PaymentItem, defaultStatus?: "PENDING" | "FAILED" | "PAID") => {
    setStatusPayment(p);
    setTargetStatus(defaultStatus || (p.paymentStatus === "PAID" ? "PENDING" : "PAID"));
    setStatusReason("");
  };

  const handleUpdateStatus = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!statusPayment) return;

    setIsUpdatingStatus(true);
    const session = getAdminSession();
    try {
      const res = await fetch(
        `http://localhost:8080/api/admin/payments/${statusPayment.id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: session ? `Bearer ${session.token}` : "",
          },
          body: JSON.stringify({
            status: targetStatus,
            reason: statusReason.trim() || `Admin set status to ${targetStatus}`,
          }),
        }
      );

      if (res.ok) {
        showToast(
          `Payment #PAY-${statusPayment.id} set to ${targetStatus}! ${
            targetStatus === "PENDING" || targetStatus === "FAILED"
              ? `₹${statusPayment.totalAmount.toLocaleString("en-IN")} pending dues restored for ${statusPayment.userName} to repay.`
              : "Payment marked as settled in full."
          }`
        );
        setStatusPayment(null);
        fetchPayments();
      } else {
        const errJson = await res.json();
        showToast(errJson?.message || "Failed to update payment status");
      }
    } catch {
      showToast("Network error updating payment status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleConfirmSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlePayment) return;

    setIsProcessing(true);
    const session = getAdminSession();
    const payload = {
      amountPaid: parseFloat(settleAmount) || 0,
      paymentMode: settleMode,
      transactionReference: settleTxnRef.trim(),
    };

    try {
      const res = await fetch(
        `http://localhost:8080/api/admin/payments/${settlePayment.id}/mark-paid`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: session ? `Bearer ${session.token}` : "",
          },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        showToast(
          `Payment of ₹${payload.amountPaid.toLocaleString(
            "en-IN"
          )} settled for ${settlePayment.userName}!`
        );
        setSettlePayment(null);
        fetchPayments();
      } else {
        const errJson = await res.json();
        showToast(errJson?.message || "Failed to settle payment");
      }
    } catch {
      showToast("Network error settling payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeletePayment = async (id: number) => {
    const session = getAdminSession();
    try {
      const res = await fetch(`http://localhost:8080/api/admin/payments/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: session ? `Bearer ${session.token}` : "",
        },
      });

      if (res.ok) {
        showToast("Payment record deleted from ledger.");
        setDeletePaymentId(null);
        setPreviewReceipt(null);
        fetchPayments();
      } else {
        showToast("Failed to delete payment record");
      }
    } catch {
      showToast("Network error deleting payment record");
    }
  };

  const pendingPayments = payments.filter((p) => p.paymentStatus === "PENDING" || p.paymentStatus === "PARTIAL");
  const failedPayments = payments.filter((p) => p.paymentStatus === "FAILED");
  const paidPayments = payments.filter((p) => p.paymentStatus === "PAID");

  const displayedPayments = payments.filter((p) => {
    const matchesSearch =
      p.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.roomCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.billingMonth.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "PENDING") return matchesSearch && (p.paymentStatus === "PENDING" || p.paymentStatus === "PARTIAL");
    if (activeTab === "FAILED") return matchesSearch && p.paymentStatus === "FAILED";
    if (activeTab === "PAID") return matchesSearch && p.paymentStatus === "PAID";
    return matchesSearch;
  });

  const totalPendingSum = payments.reduce((acc, p) => (p.paymentStatus !== "PAID" ? acc + (p.pendingAmount || 0) : acc), 0);
  const totalSettledSum = paidPayments.reduce((acc, p) => acc + (p.amountPaid || 0), 0);

  return (
    <div className="space-y-6">
      {/* 3.6 HEADER & SUMMARY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-error/15 text-error border border-error/30 font-semibold">
              3.6 Payment History &amp; Dues
            </span>
            <h1 className="text-[26px] font-bold text-on-surface tracking-tight">
              Payment Ledger &amp; Pending Dues Engine
            </h1>
          </div>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Real-time reconciliation of Rent Amount + Light Bill Amount = Total Amount directly from database.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPayments}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface text-xs font-mono border border-outline-variant/40 transition-all cursor-pointer"
        >
          <span className={`material-symbols-outlined text-[16px] text-secondary ${isLoading ? "animate-spin" : ""}`}>
            sync
          </span>
          Refresh Ledger
        </button>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 3.6.1 Highlight: Pending Amount Total */}
        <div className="bg-surface-container-low border border-error/40 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-on-surface-variant">
            <span>3.6.1 Pending Dues Sum</span>
            <span className="material-symbols-outlined text-error text-[18px]">pending_actions</span>
          </div>
          <div className="mt-2 text-[28px] font-bold text-error">
            ₹{totalPendingSum.toLocaleString("en-IN", { maximumFractionDigits: 1 })}
          </div>
          <span className="text-[11px] text-error font-mono mt-1">
            {pendingPayments.length} Tenants Pending Settlement
          </span>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-on-surface-variant">
            <span>Collected Revenue</span>
            <span className="material-symbols-outlined text-tertiary text-[18px]">check_circle</span>
          </div>
          <div className="mt-2 text-[28px] font-bold text-tertiary">
            ₹{totalSettledSum.toLocaleString("en-IN", { maximumFractionDigits: 1 })}
          </div>
          <span className="text-[11px] text-tertiary font-mono mt-1">Realized into Escrow Account</span>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-on-surface-variant">
            <span>Total Gross Ledger</span>
            <span className="material-symbols-outlined text-primary text-[18px]">account_balance</span>
          </div>
          <div className="mt-2 text-[28px] font-bold text-on-surface">
            ₹{(totalPendingSum + totalSettledSum).toLocaleString("en-IN", { maximumFractionDigits: 1 })}
          </div>
          <span className="text-[11px] text-outline font-mono mt-1">Rent + Electricity Invoiced</span>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-on-surface-variant">
            <span>Collection Velocity</span>
            <span className="material-symbols-outlined text-secondary text-[18px]">trending_up</span>
          </div>
          <div className="mt-2 text-[28px] font-bold text-secondary">
            {totalPendingSum + totalSettledSum > 0
              ? Math.round((totalSettledSum / (totalPendingSum + totalSettledSum)) * 100)
              : 100}
            %
          </div>
          <span className="text-[11px] text-secondary font-mono mt-1">On-Schedule Automated Ledger</span>
        </div>
      </div>

      {/* 3.6.1 PENDING DUES BANNER ALERT */}
      {pendingPayments.length > 0 && (
        <div className="bg-error/10 border border-error/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-error text-[24px]">error_outline</span>
            <div>
              <span className="font-bold text-error text-sm">
                3.6.1 Action Required: {pendingPayments.length} Tenant(s) Have Pending Dues
              </span>
              <p className="text-on-surface-variant mt-0.5">
                Combined invoice showing: User Name + Rent Amount + Light Bill Amount = Total Amount to collect.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("PENDING")}
            className="px-3.5 py-1.5 rounded-lg bg-error hover:bg-red-700 text-white font-bold transition-all cursor-pointer whitespace-nowrap"
          >
            Filter Pending Dues
          </button>
        </div>
      )}

      {/* TAB FILTERS & SEARCH CONTROLS */}
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("PENDING")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "PENDING"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-sm"
                : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            3.6.1 Pending Dues ({pendingPayments.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "ALL"
                ? "bg-primary-container/25 text-secondary border border-secondary/40 font-bold"
                : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
            }`}
          >
            All Ledger Records ({payments.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("PAID")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "PAID"
                ? "bg-tertiary/20 text-tertiary border border-tertiary/40 font-bold"
                : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-tertiary" />
            Settled / Paid ({paidPayments.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("FAILED")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "FAILED"
                ? "bg-error/20 text-error border border-error/40 font-bold"
                : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
            }`}
          >
            <span className="material-symbols-outlined text-[14px] text-error">cancel</span>
            Failed ({failedPayments.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-3 top-2 text-outline text-[16px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search Tenant, Room ID, Month..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs font-body bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary transition-all"
          />
        </div>
      </div>

      {/* 3.6 PAYMENT HISTORY TABLE */}
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest border-b border-outline-variant/30 text-[11px] font-mono text-outline uppercase tracking-wider">
                <th className="py-3 px-4">Transaction / Month</th>
                <th className="py-3 px-4">Tenant Name</th>
                <th className="py-3 px-4">Room / Shop</th>
                <th className="py-3 px-4">Rent Amount</th>
                <th className="py-3 px-4">Light Bill Amount</th>
                <th className="py-3 px-4">Total Amount (Rent + Light)</th>
                <th className="py-3 px-4">Status &amp; Dues</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-xs font-mono">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-outline">
                    <span className="material-symbols-outlined animate-spin text-[20px] text-secondary inline-block align-middle mr-2">
                      autorenew
                    </span>
                    Loading payment records from PostgreSQL...
                  </td>
                </tr>
              ) : displayedPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-outline">
                    No payment records found in this category.
                  </td>
                </tr>
              ) : (
                displayedPayments.map((p) => (
                  <tr
                    key={p.id}
                    className={`transition-colors hover:bg-surface-container/60 ${
                      p.paymentStatus === "PENDING" ? "bg-error/5" : ""
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-on-surface">#PAY-{p.id}</div>
                      {p.billingMonth === "Security Deposit" ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 mt-0.5 rounded bg-amber-500/15 text-amber-400 font-semibold text-[10px] border border-amber-500/30">
                          <span className="material-symbols-outlined text-[12px]">security</span>
                          Security Deposit
                        </span>
                      ) : (
                        <div className="text-[10px] text-outline">{p.billingMonth}</div>
                      )}
                    </td>

                    {/* 3.6.1 Tenant Name */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-on-surface font-body">{p.userName}</div>
                      <div className="text-[10px] text-outline">+91 {p.userMobile}</div>
                    </td>

                    {/* Room */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-surface-container border border-outline-variant/40 font-bold text-secondary">
                        {p.roomCode}
                      </span>
                    </td>

                    {/* Rent Amount */}
                    <td className="py-3 px-4 text-on-surface font-bold">
                      ₹{p.rentAmount.toLocaleString("en-IN")}
                    </td>

                    {/* Light Bill Amount */}
                    <td className="py-3 px-4 text-secondary font-bold">
                      {p.billingMonth === "Security Deposit" ? (
                        <span className="text-outline text-[11px] font-normal">—</span>
                      ) : (
                        `₹${p.electricityAmount.toLocaleString("en-IN", { minimumFractionDigits: 1 })}`
                      )}
                    </td>

                    {/* 3.6.1 Total Amount (Rent + Light Bill) */}
                    <td className="py-3 px-4">
                      <div className="text-sm font-bold text-tertiary">
                        ₹{p.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-outline">
                        {p.billingMonth === "Security Deposit" ? (
                          <span className="text-amber-400 font-medium">Security Escrow (CASH)</span>
                        ) : (
                          `(₹${p.rentAmount} + ₹${p.electricityAmount.toFixed(1)})`
                        )}
                      </div>
                    </td>

                    {/* Payment Status & Pending Amount / Paid Details */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {p.paymentStatus === "PAID" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-tertiary/15 text-tertiary border border-tertiary/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                            PAID
                          </span>
                        )}
                        {p.paymentStatus === "PENDING" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            PENDING
                          </span>
                        )}
                        {p.paymentStatus === "FAILED" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-error/20 text-error border border-error/40">
                            <span className="material-symbols-outlined text-[13px]">cancel</span>
                            FAILED
                          </span>
                        )}
                        {p.paymentStatus === "PARTIAL" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary/15 text-secondary border border-secondary/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                            PARTIAL
                          </span>
                        )}

                        {p.paymentStatus === "PAID" ? (
                          <div className="text-[11px] font-semibold text-tertiary">
                            Paid: ₹{p.amountPaid.toLocaleString("en-IN")}
                            <div className="text-[10px] text-outline font-normal flex items-center gap-1 mt-0.5">
                              <span
                                className={`px-1.5 py-0.2 rounded font-bold text-[9px] ${
                                  p.paymentMode === "CASH"
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                    : "bg-surface-container text-on-surface border border-outline-variant/30"
                                }`}
                              >
                                {p.paymentMode || "CASH"}
                              </span>
                              {p.paymentDate ? (
                                <span>
                                  •{" "}
                                  {new Date(p.paymentDate).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        ) : p.paymentStatus === "FAILED" ? (
                          <div className="text-error text-[11px] font-bold">
                            Failed • Due: ₹{p.pendingAmount.toLocaleString("en-IN")}
                          </div>
                        ) : (
                          <div className="text-amber-400 text-[11px] font-bold">
                            Due: ₹{p.pendingAmount.toLocaleString("en-IN")}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap sm:flex-nowrap">
                        {/* If PAID: Allow Admin to Revert to Pending or Mark Failed */}
                        {p.paymentStatus === "PAID" && (
                          <>
                            <button
                              type="button"
                              onClick={() => openStatusModal(p, "PENDING")}
                              className="px-2 py-1 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                              title="Revert payment to PENDING dues so tenant can pay again"
                            >
                              <span className="material-symbols-outlined text-[13px]">history</span>
                              Revert Pending
                            </button>
                            <button
                              type="button"
                              onClick={() => openStatusModal(p, "FAILED")}
                              className="px-2 py-1 rounded-md bg-error/15 hover:bg-error/25 text-error border border-error/40 text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                              title="Mark transaction as Failed"
                            >
                              <span className="material-symbols-outlined text-[13px]">cancel</span>
                              Mark Failed
                            </button>
                          </>
                        )}

                        {/* If PENDING: Allow Admin to Mark Paid or Mark Failed */}
                        {p.paymentStatus === "PENDING" && (
                          <>
                            <button
                              type="button"
                              onClick={() => openSettleModal(p)}
                              className="px-2.5 py-1 rounded-lg bg-primary-container hover:bg-indigo-600 text-white font-bold text-[11px] transition-all cursor-pointer shadow-sm"
                              title="Settle Payment"
                            >
                              Mark Paid
                            </button>
                            <button
                              type="button"
                              onClick={() => openStatusModal(p, "FAILED")}
                              className="px-2 py-1 rounded-md bg-error/15 hover:bg-error/25 text-error border border-error/40 text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                              title="Mark transaction as Failed"
                            >
                              <span className="material-symbols-outlined text-[13px]">cancel</span>
                              Mark Failed
                            </button>
                          </>
                        )}

                        {/* If FAILED: Allow Admin to Set to Pending or Mark Paid */}
                        {p.paymentStatus === "FAILED" && (
                          <>
                            <button
                              type="button"
                              onClick={() => openStatusModal(p, "PENDING")}
                              className="px-2 py-1 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                              title="Set status to Pending"
                            >
                              <span className="material-symbols-outlined text-[13px]">pending_actions</span>
                              Set Pending
                            </button>
                            <button
                              type="button"
                              onClick={() => openSettleModal(p)}
                              className="px-2.5 py-1 rounded-lg bg-primary-container hover:bg-indigo-600 text-white font-bold text-[11px] transition-all cursor-pointer shadow-sm"
                              title="Settle Payment"
                            >
                              Mark Paid
                            </button>
                          </>
                        )}

                        {/* If PARTIAL */}
                        {p.paymentStatus === "PARTIAL" && (
                          <button
                            type="button"
                            onClick={() => openSettleModal(p)}
                            className="px-2.5 py-1 rounded-lg bg-primary-container hover:bg-indigo-600 text-white font-bold text-[11px] transition-all cursor-pointer shadow-sm"
                            title="Settle Remaining"
                          >
                            Clear Dues
                          </button>
                        )}

                        {/* Status Change Selector Modal Button */}
                        <button
                          type="button"
                          onClick={() => openStatusModal(p)}
                          className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-amber-300 transition-colors cursor-pointer"
                          title="Change Payment Status (Pending / Failed / Paid)"
                        >
                          <span className="material-symbols-outlined text-[18px]">published_with_changes</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPreviewReceipt(p)}
                          className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-secondary transition-colors cursor-pointer"
                          title="View Voucher"
                        >
                          <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletePaymentId(p.id)}
                          className="p-1 rounded hover:bg-error/20 text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                          title="Delete Record"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SETTLE / MARK AS PAID MODAL */}
      <AnimatePresence>
        {settlePayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-low border border-outline-variant/40 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 font-mono text-xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary text-[22px]">payments</span>
                  <h3 className="font-bold text-on-surface text-base">Record Payment Settlement</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSettlePayment(null)}
                  className="p-1.5 rounded-lg hover:bg-surface-container text-outline hover:text-on-surface cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="p-3 rounded-lg bg-surface-container space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-outline">Tenant:</span>
                  <span className="text-on-surface font-bold">{settlePayment.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Room Allocated:</span>
                  <span className="text-secondary font-bold">{settlePayment.roomCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Rent Component:</span>
                  <span className="text-on-surface">₹{settlePayment.rentAmount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Light Bill Component:</span>
                  <span className="text-on-surface">₹{settlePayment.electricityAmount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-outline-variant/20 text-sm">
                  <span className="text-on-surface font-bold">Total Payable:</span>
                  <span className="text-tertiary font-bold">
                    ₹{settlePayment.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <form onSubmit={handleConfirmSettle} className="space-y-3">
                <div>
                  <label className="block text-on-surface-variant mb-1">Amount Received (₹)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface font-bold text-sm focus:border-secondary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-on-surface-variant mb-1">Payment Mode</label>
                    <select
                      value={settleMode}
                      onChange={(e) => setSettleMode(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface focus:border-secondary focus:outline-none cursor-pointer"
                    >
                      <option value="UPI">UPI / QR Code</option>
                      <option value="CASH">Cash in Hand</option>
                      <option value="BANK_TRANSFER">Bank IMPS / NEFT</option>
                      <option value="CHEQUE">Cheque Clearance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-on-surface-variant mb-1">Txn Ref / Note</label>
                    <input
                      type="text"
                      value={settleTxnRef}
                      onChange={(e) => setSettleTxnRef(e.target.value)}
                      placeholder="e.g. UPI Ref # / Receipt"
                      className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface focus:border-secondary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-outline-variant/30">
                  <button
                    type="button"
                    onClick={() => setSettlePayment(null)}
                    className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="px-4 py-1.5 rounded-lg bg-primary-container hover:bg-indigo-600 text-white font-bold cursor-pointer"
                  >
                    {isProcessing ? "Settling..." : "Confirm Settlement"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PAYMENT RECEIPT MODAL */}
      <AnimatePresence>
        {previewReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-low border border-outline-variant/40 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 font-mono text-xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                <div>
                  <h3 className="font-bold text-on-surface text-base">Payment Receipt Voucher</h3>
                  <p className="text-[10px] text-outline">Voucher #REC-{previewReceipt.id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewReceipt(null)}
                  className="p-1.5 rounded-lg hover:bg-surface-container text-outline hover:text-on-surface cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="space-y-2 p-3 bg-surface-container-lowest rounded-lg">
                <div className="flex justify-between">
                  <span className="text-outline">Tenant:</span>
                  <span className="text-on-surface font-bold">{previewReceipt.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Unit:</span>
                  <span className="text-secondary font-bold">{previewReceipt.roomCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Period / Type:</span>
                  <span className="text-on-surface font-semibold">
                    {previewReceipt.billingMonth === "Security Deposit" ? (
                      <span className="text-amber-400">Security Deposit (Escrow Holding)</span>
                    ) : (
                      previewReceipt.billingMonth
                    )}
                  </span>
                </div>
                {previewReceipt.billingMonth === "Security Deposit" ? (
                  <div className="flex justify-between py-1 border-t border-outline-variant/20">
                    <span className="text-outline">Security Deposit:</span>
                    <span className="text-on-surface font-bold">
                      ₹{previewReceipt.rentAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between py-1 border-t border-outline-variant/20">
                      <span className="text-outline">Base Rent:</span>
                      <span className="text-on-surface font-bold">
                        ₹{previewReceipt.rentAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-outline">Light Bill:</span>
                      <span className="text-on-surface font-bold">
                        ₹{previewReceipt.electricityAmount.toLocaleString("en-IN", { minimumFractionDigits: 1 })}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between py-1.5 border-t border-outline-variant/30 text-sm">
                  <span className="font-bold text-on-surface">Total Amount:</span>
                  <span className="font-bold text-tertiary">
                    ₹{previewReceipt.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Amount Paid:</span>
                  <span className="text-tertiary font-bold">
                    ₹{previewReceipt.amountPaid.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Pending Due:</span>
                  <span className={previewReceipt.pendingAmount > 0 ? "text-error font-bold" : "text-tertiary"}>
                    ₹{previewReceipt.pendingAmount.toLocaleString("en-IN")}
                  </span>
                </div>
                {previewReceipt.paymentMode && (
                  <div className="flex justify-between pt-1 border-t border-outline-variant/20">
                    <span className="text-outline">Mode &amp; Ref:</span>
                    <span className="text-secondary">
                      {previewReceipt.paymentMode} ({previewReceipt.transactionReference || "N/A"})
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end pt-2 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setPreviewReceipt(null)}
                  className="px-4 py-1.5 rounded-lg bg-primary-container text-white cursor-pointer"
                >
                  Close Receipt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PAYMENT STATUS CHANGE MODAL */}
      <AnimatePresence>
        {statusPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-low border border-outline-variant/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 font-mono text-xs"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <span className="material-symbols-outlined text-[20px]">published_with_changes</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface text-base">Update Payment Status</h3>
                    <p className="text-[11px] text-outline">Manage dues &amp; enable tenant repayment</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStatusPayment(null)}
                  className="p-1.5 rounded-lg hover:bg-surface-container text-outline hover:text-on-surface cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Payment Summary Box */}
              <div className="p-3.5 rounded-xl bg-surface-container/70 border border-outline-variant/25 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-outline">Tenant &amp; Unit:</span>
                  <span className="text-on-surface font-bold">
                    {statusPayment.userName} <span className="text-secondary font-mono">({statusPayment.roomCode})</span>
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-outline">Invoice Month / Type:</span>
                  <span className="text-on-surface font-medium">{statusPayment.billingMonth}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-outline">Current Status:</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      statusPayment.paymentStatus === "PAID"
                        ? "bg-tertiary/20 text-tertiary border border-tertiary/40"
                        : statusPayment.paymentStatus === "FAILED"
                        ? "bg-error/20 text-error border border-error/40"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    }`}
                  >
                    {statusPayment.paymentStatus}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-outline-variant/20 text-sm">
                  <span className="text-outline font-semibold">Total Amount:</span>
                  <span className="text-on-surface font-bold">
                    ₹{statusPayment.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Status Select Options */}
              <div className="space-y-2.5">
                <label className="block text-on-surface font-bold text-xs">
                  Select New Payment Status:
                </label>

                {/* OPTION 1: PENDING */}
                <div
                  onClick={() => setTargetStatus("PENDING")}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    targetStatus === "PENDING"
                      ? "bg-amber-500/15 border-amber-500/70 shadow-[0_0_18px_rgba(245,158,11,0.2)]"
                      : "bg-surface-container/40 border-outline-variant/20 hover:border-outline-variant/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                      <span className="font-bold text-amber-300 text-xs">PENDING (Revert to Unpaid Dues)</span>
                    </div>
                    {targetStatus === "PENDING" && (
                      <span className="material-symbols-outlined text-amber-400 text-[18px]">check_circle</span>
                    )}
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                    Resets amount paid to ₹0.0 and restores ₹{statusPayment.totalAmount.toLocaleString("en-IN")} pending dues. The tenant can immediately pay again via Razorpay on their portal!
                  </p>
                </div>

                {/* OPTION 2: FAILED */}
                <div
                  onClick={() => setTargetStatus("FAILED")}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    targetStatus === "FAILED"
                      ? "bg-error/15 border-error/70 shadow-[0_0_18px_rgba(239,68,68,0.2)]"
                      : "bg-surface-container/40 border-outline-variant/20 hover:border-outline-variant/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-error text-[16px]">cancel</span>
                      <span className="font-bold text-error text-xs">FAILED (Transaction Failed)</span>
                    </div>
                    {targetStatus === "FAILED" && (
                      <span className="material-symbols-outlined text-error text-[18px]">check_circle</span>
                    )}
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                    Marks payment attempt as failed. Outstanding dues remain active for the tenant to retry repayment.
                  </p>
                </div>

                {/* OPTION 3: PAID */}
                <div
                  onClick={() => setTargetStatus("PAID")}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    targetStatus === "PAID"
                      ? "bg-tertiary/15 border-tertiary/70 shadow-[0_0_18px_rgba(16,185,129,0.2)]"
                      : "bg-surface-container/40 border-outline-variant/20 hover:border-outline-variant/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-tertiary" />
                      <span className="font-bold text-tertiary text-xs">PAID (Mark Settled / Cleared)</span>
                    </div>
                    {targetStatus === "PAID" && (
                      <span className="material-symbols-outlined text-tertiary text-[18px]">check_circle</span>
                    )}
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                    Marks the invoice cleared and settled in full (₹{statusPayment.totalAmount.toLocaleString("en-IN")}).
                  </p>
                </div>
              </div>

              {/* Reason / Admin Remark */}
              <div>
                <label className="block text-outline text-[11px] mb-1">
                  Audit Reason / Note <span className="text-outline-variant">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="e.g. Bank chargeback, payment bounced, user requested repayment option"
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-on-surface text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setStatusPayment(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={handleUpdateStatus}
                  className={`px-4 py-1.5 rounded-lg font-bold text-white cursor-pointer transition-all flex items-center gap-2 ${
                    targetStatus === "PENDING"
                      ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/30"
                      : targetStatus === "FAILED"
                      ? "bg-error hover:bg-red-700 shadow-error/30"
                      : "bg-tertiary hover:bg-emerald-600 shadow-tertiary/30"
                  } shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isUpdatingStatus ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">check</span>
                      <span>Apply {targetStatus} Status</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deletePaymentId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-low border border-error/40 rounded-xl max-w-sm w-full p-5 shadow-2xl space-y-3 font-mono text-xs"
            >
              <div className="flex items-center gap-2 text-error font-bold text-sm">
                <span className="material-symbols-outlined text-[20px]">warning</span>
                Delete Payment Ledger Entry
              </div>
              <p className="text-on-surface-variant">
                Are you sure you want to permanently delete payment record #{deletePaymentId}?
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setDeletePaymentId(null)}
                  className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePayment(deletePaymentId)}
                  className="px-4 py-1.5 rounded-lg bg-error hover:bg-red-700 text-white font-semibold cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
