"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getUserSession, clearUserSession, getTimeUntilTokenExpiry } from "@/lib/auth";

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
  nextDueDate?: string;
  role: string;
  isActive: boolean;
}

interface RoomInfo {
  id: number;
  roomId: string;
  propertyType: string;
  rentAmount: number;
  meterNumber: string;
  baselineUnit: number;
  floorNumber: string;
  status: string;
  securityDeposit: number;
}

interface BillInfo {
  id: number;
  billingMonth: string;
  previousUnit: number;
  currentUnit: number;
  unitsConsumed: number;
  ratePerUnit: number;
  totalAmount: number;
  status: string;
  billDate: string;
  dueDate: string;
}

interface DuesInfo {
  paymentId: number | null;
  billingMonth: string;
  rentAmount: number;
  electricityAmount: number;
  totalAmount: number;
  amountPaid: number;
  pendingAmount: number;
  status: string;
  dueDate: string;
}

interface PaymentHistoryItem {
  id: number;
  invoiceNumber: string;
  billingMonth: string;
  rentAmount: number;
  electricityAmount: number;
  totalAmount: number;
  amountPaid: number;
  status: string;
  paymentMode: string;
  transactionReference: string;
  paymentDate: string | null;
  createdAt: string;
}

interface UserDashboardData {
  user: UserProfile;
  room: RoomInfo | null;
  latestBill: BillInfo | null;
  currentDues: DuesInfo | null;
  paymentHistory: PaymentHistoryItem[];
  wifiNetwork: string;
  wifiPassword: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<UserDashboardData | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentHistoryItem | null>(null);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);

  // Razorpay Gateway State
  const [isProcessingRazorpay, setIsProcessingRazorpay] = useState(false);
  const [isPaymentFailedModalOpen, setIsPaymentFailedModalOpen] = useState(false);
  const [paymentFailureDetails, setPaymentFailureDetails] = useState<{
    orderId?: string;
    reason?: string;
    amount?: number;
    code?: string;
  } | null>(null);

  // Payment form state
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMode, setPayMode] = useState<string>("UPI");
  const [payTxnRef, setPayTxnRef] = useState<string>("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Maintenance form state
  const [maintenanceIssue, setMaintenanceIssue] = useState("");
  const [maintenanceSubmitted, setMaintenanceSubmitted] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const logoutUserDueToDeletion = useCallback((reason: "deleted" | "expired" = "deleted") => {
    clearUserSession();
    router.replace(`/login?${reason}=true`);
  }, [router]);

  const fetchDashboardData = useCallback(async () => {
    const session = getUserSession();
    if (!session) {
      logoutUserDueToDeletion("expired");
      return;
    }

    try {
      const res = await fetch("http://localhost:8080/api/user/dashboard", {
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      });

      if (res.ok) {
        const resData = await res.json();
        if (resData?.data) {
          setDashboardData(resData.data);
          setUser(resData.data.user);
          if (resData.data.currentDues?.pendingAmount) {
            setPayAmount(resData.data.currentDues.pendingAmount);
          }
        }
      } else if (res.status === 401 || res.status === 403 || res.status === 404) {
        logoutUserDueToDeletion("deleted");
        return;
      } else {
        console.error("Non-OK response while fetching user dashboard:", res.status);
      }
    } catch (err) {
      console.error("Failed to fetch user dashboard telemetry:", err);
    } finally {
      setIsLoading(false);
    }
  }, [logoutUserDueToDeletion]);

  useEffect(() => {
    const session = getUserSession();
    if (!session) {
      logoutUserDueToDeletion("expired");
      return;
    }

    const remainingMs = getTimeUntilTokenExpiry(session.token);
    const expiryTimer = setTimeout(() => {
      logoutUserDueToDeletion("expired");
    }, remainingMs);

    // 1. Instant Cross-Tab Invalidation via BroadcastChannel (0 ms)
    let syncChannel: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        syncChannel = new BroadcastChannel("auth_sync");
        syncChannel.onmessage = (event) => {
          if (event.data?.type === "USER_DELETED") {
            logoutUserDueToDeletion("deleted");
          }
        };
      } catch (e) {
        console.warn("BroadcastChannel error:", e);
      }
    }

    // 2. Active Session Polling (Every 3 seconds) hitting /api/user/session-check
    const sessionPollInterval = setInterval(async () => {
      const current = getUserSession();
      if (!current) {
        logoutUserDueToDeletion("expired");
        return;
      }

      try {
        const checkRes = await fetch("http://localhost:8080/api/user/session-check", {
          headers: {
            Authorization: `Bearer ${current.token}`,
          },
        });
        if (checkRes.status === 401 || checkRes.status === 403 || checkRes.status === 404) {
          logoutUserDueToDeletion("deleted");
        }
      } catch {
        // Network blip, silently wait for next tick
      }
    }, 3000);

    // 3. Immediate window focus / tab switch check
    const handleFocus = async () => {
      const current = getUserSession();
      if (!current) {
        logoutUserDueToDeletion("expired");
        return;
      }
      try {
        const checkRes = await fetch("http://localhost:8080/api/user/session-check", {
          headers: {
            Authorization: `Bearer ${current.token}`,
          },
        });
        if (checkRes.status === 401 || checkRes.status === 403 || checkRes.status === 404) {
          logoutUserDueToDeletion("deleted");
        }
      } catch {}
    };
    window.addEventListener("focus", handleFocus);

    fetchDashboardData();

    return () => {
      clearTimeout(expiryTimer);
      clearInterval(sessionPollInterval);
      if (syncChannel) syncChannel.close();
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchDashboardData, logoutUserDueToDeletion]);

  const handleLogout = () => {
    clearUserSession();
    router.replace("/login");
  };

  const copyWifiPassword = () => {
    const pwd = dashboardData?.wifiPassword || "SinghNet@Secure_Vault";
    navigator.clipboard.writeText(pwd);
    showToast("Wi-Fi Password copied to clipboard!");
  };

  const getInitials = (name?: string) => {
    if (!name) return "SR";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getMaskedAadhaar = (aadhaar?: string) => {
    if (!aadhaar) return "XXXX - XXXX - 0000";
    const clean = aadhaar.replace(/\D/g, "");
    if (clean.length >= 4) {
      return `XXXX - XXXX - ${clean.slice(-4)}`;
    }
    return `XXXX - XXXX - ${clean}`;
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getDueDaysLabel = (dateStr?: string | null) => {
    if (!dateStr) return "30-Day Cycle Active";
    try {
      const due = new Date(dateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      due.setHours(0, 0, 0, 0);
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return "Payment Due Today";
      if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)}d`;
      return `Due in ${diffDays} days`;
    } catch {
      return "30-Day Cycle Active";
    }
  };

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const session = getUserSession();
    if (!session) {
      clearUserSession();
      router.replace("/login?expired=true");
      return;
    }

    if (payAmount <= 0) {
      showToast("Please enter a payment amount greater than zero.");
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const res = await fetch("http://localhost:8080/api/user/pay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          amount: payAmount,
          paymentMode: payMode,
          transactionReference: payTxnRef.trim() || `UPI-TXN-${Date.now()}`,
        }),
      });

      if (res.status === 401 || res.status === 403 || res.status === 404) {
        logoutUserDueToDeletion("deleted");
        return;
      }

      const resData = await res.json();
      if (res.ok && resData.success) {
        showToast(`Payment of ₹${payAmount.toLocaleString("en-IN")} recorded successfully!`);
        setIsPayModalOpen(false);
        setPayTxnRef("");
        await fetchDashboardData();
      } else {
        showToast(resData.message || "Failed to process payment. Please try again.");
      }
    } catch (err) {
      console.error("Payment error:", err);
      showToast("Network error while submitting payment.");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") return resolve(false);
      if ((window as any).Razorpay) return resolve(true);
      const existing = document.getElementById("razorpay-checkout-script");
      if (existing) return resolve(true);
      const script = document.createElement("script");
      script.id = "razorpay-checkout-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePaymentFailureReport = async (
    orderId?: string,
    code?: string,
    reason?: string,
    amount?: number
  ) => {
    const session = getUserSession();
    const finalReason = reason || "Payment transaction declined or cancelled by the user.";
    setPaymentFailureDetails({
      orderId: orderId || "ORD-PENDING",
      reason: finalReason,
      amount: amount || payAmount,
      code: code || "PAYMENT_FAILED",
    });
    setIsPayModalOpen(false);
    setIsPaymentFailedModalOpen(true);

    if (session?.token) {
      try {
        await fetch("http://localhost:8080/api/user/payment/razorpay/failure", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify({
            orderId: orderId || "UNKNOWN",
            paymentId: "N/A",
            errorCode: code || "TRANSACTION_FAILED",
            errorDescription: finalReason,
            amount: amount || payAmount,
          }),
        });
      } catch (err) {
        console.warn("Failed to notify server of payment failure:", err);
      }
    }
  };

  const verifyRazorpayPaymentOnBackend = async (
    razorpayResponse: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    },
    amount: number
  ) => {
    const session = getUserSession();
    if (!session) {
      clearUserSession();
      router.replace("/login?expired=true");
      return;
    }

    setIsProcessingRazorpay(true);
    try {
      const res = await fetch("http://localhost:8080/api/user/payment/razorpay/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          razorpayOrderId: razorpayResponse.razorpay_order_id,
          razorpayPaymentId: razorpayResponse.razorpay_payment_id,
          razorpaySignature: razorpayResponse.razorpay_signature,
          amount: amount,
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.success && resData.data) {
        showToast("Payment verified! Official rent receipt generated & emailed.");
        setIsPayModalOpen(false);
        setSelectedReceipt(resData.data);
        setIsReceiptModalOpen(true);
        await fetchDashboardData();
      } else {
        await handlePaymentFailureReport(
          razorpayResponse.razorpay_order_id,
          "SIGNATURE_VERIFY_FAILED",
          resData.message || "Payment verification failed on server",
          amount
        );
      }
    } catch (err) {
      console.error("Verification error:", err);
      await handlePaymentFailureReport(
        razorpayResponse.razorpay_order_id,
        "NETWORK_ERROR",
        "Network error while verifying payment with server",
        amount
      );
    } finally {
      setIsProcessingRazorpay(false);
    }
  };

  const handleRazorpayCheckout = async (amountToPay?: number) => {
    const session = getUserSession();
    if (!session) {
      clearUserSession();
      router.replace("/login?expired=true");
      return;
    }

    const finalAmount = amountToPay ?? payAmount ?? currentDues?.pendingAmount ?? 0;
    if (finalAmount <= 0) {
      showToast("Please specify a valid payment amount greater than zero.");
      return;
    }

    setIsProcessingRazorpay(true);
    try {
      const orderRes = await fetch("http://localhost:8080/api/user/payment/razorpay/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ amount: finalAmount }),
      });

      if (!orderRes.ok) {
        const errJson = await orderRes.json().catch(() => null);
        throw new Error(errJson?.message || "Failed to initialize payment gateway order.");
      }

      const orderDataWrap = await orderRes.json();
      const orderData = orderDataWrap.data;

      const loaded = await loadRazorpayScript();
      if (!loaded || !(window as any).Razorpay) {
        throw new Error("Unable to load Razorpay checkout script. Please check your internet connection.");
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amountInPaise,
        currency: orderData.currency || "INR",
        name: orderData.businessName || "Singh Rent House Enterprise",
        description: `Rent Settlement - Room ${orderData.roomUnit} (${orderData.billingMonth})`,
        image: "https://cdn-icons-png.flaticon.com/512/619/619153.png",
        order_id: orderData.orderId,
        prefill: {
          name: orderData.tenantName,
          email: orderData.tenantEmail,
          contact: orderData.tenantContact,
        },
        theme: {
          color: "#4f46e5",
          backdrop_color: "rgba(11, 19, 38, 0.85)",
        },
        modal: {
          ondismiss: async () => {
            setIsProcessingRazorpay(false);
            await handlePaymentFailureReport(
              orderData.orderId,
              "MODAL_CLOSED",
              "Payment window closed by user without completion.",
              finalAmount
            );
          },
        },
        handler: async (response: any) => {
          await verifyRazorpayPaymentOnBackend(response, finalAmount);
        },
      };

      const rzpInstance = new (window as any).Razorpay(options);
      rzpInstance.on("payment.failed", async (response: any) => {
        setIsProcessingRazorpay(false);
        const reason = response?.error?.description || response?.error?.reason || "Card/UPI transaction declined by issuing bank.";
        await handlePaymentFailureReport(
          orderData.orderId,
          response?.error?.code || "PAYMENT_DECLINED",
          reason,
          finalAmount
        );
      });

      rzpInstance.open();
    } catch (err: any) {
      console.error("Razorpay setup error:", err);
      showToast(err.message || "Failed to launch Razorpay gateway.");
      await handlePaymentFailureReport(
        "ORD-" + Date.now(),
        "CLIENT_INIT_ERROR",
        err.message || "Could not launch payment gateway",
        finalAmount
      );
    } finally {
      setIsProcessingRazorpay(false);
    }
  };

  const firstName = user?.fullName ? user.fullName.split(" ")[0] : "Resident";
  const room = dashboardData?.room;
  const latestBill = dashboardData?.latestBill;
  const currentDues = dashboardData?.currentDues;
  const paymentHistory = dashboardData?.paymentHistory || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center text-on-surface">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="font-mono text-[14px]">Loading Zero-Trust Database Vault...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface font-body text-[14px] min-h-screen relative overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-lg bg-tertiary-container text-on-tertiary-container shadow-[0_0_20px_rgba(78,222,163,0.5)] font-mono text-[12px] flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Atmospheric Glow Layer & Cyber Grid Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 cyber-grid opacity-60" />
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-primary-container/20 rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute top-1/3 -right-20 w-[480px] h-[480px] bg-secondary-container/15 rounded-full blur-[140px] animate-pulse-glow" />
        <div className="absolute bottom-10 left-1/3 w-[400px] h-[400px] bg-tertiary-container/15 rounded-full blur-[130px] animate-pulse-glow" />
      </div>

      {/* Main Unified Layout Container */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top Navigation Bar */}
        <header className="w-full fixed top-0 left-0 z-50 px-4 md:px-8 py-3.5 flex justify-between items-center bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/20 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.6)]">
          {/* Brand & Security Badge Cluster */}
          <div className="flex items-center gap-3 md:gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 group focus:outline-none">
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
                    LIVE VERIFIED
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation Links (Middle Cluster) */}
          <nav className="hidden md:flex items-center gap-7">
            <Link
              href="/dashboard"
              className="text-primary font-mono text-[13px] border-b-2 border-primary pb-1 flex items-center gap-1.5 transition-all duration-150 animate-float"
            >
              <span className="material-symbols-outlined text-[16px]">home</span>
              Dashboard
            </Link>
            <Link
              href="/about"
              className="text-on-surface-variant font-mono text-[13px] pb-1 hover:text-primary hover:bg-surface-container-high/40 px-2 py-1 rounded transition-all duration-150 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[15px]">info</span>
              About
            </Link>
            <Link
              href="/contact"
              className="text-on-surface-variant font-mono text-[13px] pb-1 hover:text-primary hover:bg-surface-container-high/40 px-2 py-1 rounded transition-all duration-150 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[15px]">support_agent</span>
              Contact
            </Link>
          </nav>

          {/* Trailing Profile & Actions */}
          <div className="flex items-center gap-2.5 md:gap-3.5 relative">
            {/* Notification Bell */}
            <button
              type="button"
              aria-label="Notifications"
              onClick={() => showToast("All database ledgers and room allocations are synchronized.")}
              className="relative w-9 h-9 rounded-lg bg-surface-container-high/50 hover:bg-surface-container-high text-on-surface-variant hover:text-primary border border-outline-variant/30 flex items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-secondary" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-secondary animate-ping opacity-75" />
            </button>

            {/* USER PROFILE PILL - Live Profile Image from Database */}
            <div
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/30 hover:border-outline-variant/60 transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-[0_0_15px_rgba(79,70,229,0.2)] select-none"
            >
              <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/20 bg-primary-container flex items-center justify-center">
                {user?.profileImagePath && !imageError ? (
                  <img
                    src={`http://localhost:8080${user.profileImagePath}`}
                    alt={user.fullName}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="text-on-primary-container font-mono text-xs font-semibold">
                    {getInitials(user?.fullName)}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-tertiary ring-2 ring-surface-container-low" />
              </div>

              <div className="hidden sm:flex flex-col text-left">
                <span className="font-semibold text-on-surface group-hover:text-primary transition-colors text-xs leading-none">
                  {user?.fullName || "Verified Resident"}
                </span>
                <span className="font-mono text-[10px] text-outline leading-none mt-1">
                  {room ? `Unit ${room.roomId}` : "Unallocated"} • {user?.role === "ROLE_ADMIN" ? "Admin" : "Resident"}
                </span>
              </div>
              <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-on-surface group-hover:translate-y-0.5 transition-all duration-200">
                expand_more
              </span>
            </div>

            {/* User Dropdown Menu */}
            <AnimatePresence>
              {isProfileDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-14 w-64 rounded-xl bg-surface-container border border-outline-variant/30 shadow-2xl p-3 z-50"
                >
                  <div className="pb-3 mb-2 border-b border-outline-variant/20">
                    <p className="font-semibold text-on-surface text-sm">{user?.fullName}</p>
                    <p className="text-outline text-xs truncate">{user?.email}</p>
                    <p className="font-mono text-[11px] text-secondary mt-1">@{user?.username}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="px-2 py-1.5 text-xs text-on-surface-variant flex items-center justify-between">
                      <span>Room / Unit:</span>
                      <span className="font-mono text-on-surface font-semibold">
                        {room ? `${room.roomId} (${room.propertyType})` : "Not Assigned"}
                      </span>
                    </div>
                    <div className="px-2 py-1.5 text-xs text-on-surface-variant flex items-center justify-between">
                      <span>Mobile:</span>
                      <span className="font-mono text-on-surface">{user?.mobileNumber || "N/A"}</span>
                    </div>
                    <div className="px-2 py-1.5 text-xs text-on-surface-variant flex items-center justify-between">
                      <span>Status:</span>
                      <span className="text-tertiary font-mono text-[11px] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary" /> Active
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 mt-2 border-t border-outline-variant/20">
                    <button
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
          </div>
        </header>

        {/* Main Content Canvas */}
        <main className="flex-grow pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Hero / Welcome Zero-Trust Banner Section */}
          <section className="relative rounded-xl bg-surface-container-low border border-white/10 p-6 md:p-8 overflow-hidden glass-specular transition-all duration-300 hover:border-white/20">
            <div className="absolute -right-8 -bottom-10 opacity-[0.03] select-none pointer-events-none text-[220px] font-mono leading-none">
              SRH
            </div>
            <div className="absolute top-0 right-1/4 w-72 h-32 bg-primary-container/20 blur-3xl rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="max-w-2xl space-y-3">
                {/* Floating Micro-Chips */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tertiary/10 border border-tertiary/30 text-tertiary font-mono text-xs shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                    Database-Connected Node
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container/20 border border-secondary/30 text-secondary font-mono text-xs shadow-sm">
                    <span className="material-symbols-outlined text-[13px]">lock</span>
                    Zero-Trust Ledger
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high border border-outline-variant/30 text-on-surface-variant font-mono text-xs tracking-wider">
                    <span className="text-primary font-bold">#</span>
                    User ID #{user?.id || "N/A"}
                  </span>
                </div>

                {/* Welcome Title */}
                <h1 className="text-[28px] md:text-[36px] font-semibold text-on-surface tracking-tight">
                  Welcome back, <span className="shimmer-text font-bold">{firstName}!</span>
                </h1>
                <p className="text-on-surface-variant max-w-xl leading-relaxed text-[14px]">
                  {room
                    ? `You are securely authenticated as tenant for Room ${room.roomId} (${room.propertyType}). Real-time rent records and sub-meter light bills are dynamically synchronized from the database.`
                    : "You are currently authenticated, but no room or shop has been assigned to your profile yet. Please contact the administrator for property allocation."}
                </p>
              </div>

              {/* Hero Quick Action CTAs */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsBreakdownModalOpen(true)}
                  className="group relative px-4 py-2.5 rounded-lg bg-surface-container-high/60 hover:bg-surface-container-high border border-white/10 hover:border-white/20 text-on-surface font-mono text-[13px] transition-all duration-150 active:scale-[0.98] flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] text-outline group-hover:text-primary group-hover:-translate-y-0.5 transition-transform duration-200">
                    calculate
                  </span>
                  <span>View Dues Breakdown</span>
                </button>

                {currentDues && currentDues.pendingAmount > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPayAmount(currentDues.pendingAmount);
                      setIsPayModalOpen(true);
                    }}
                    className="relative group px-5 py-2.5 rounded-lg bg-primary-container hover:bg-[#4338CA] text-white font-mono text-[13px] transition-all duration-150 active:scale-[0.98] flex items-center gap-2.5 glass-specular-primary hover:shadow-[0_0_24px_rgba(79,70,229,0.55)] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] group-hover:rotate-12 transition-transform duration-200">
                      account_balance_wallet
                    </span>
                    <span className="font-semibold tracking-wide">
                      Pay ₹{currentDues.pendingAmount.toLocaleString("en-IN")} Now
                    </span>
                    <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform duration-200">
                      arrow_forward
                    </span>
                  </button>
                ) : (
                  <div className="px-5 py-2.5 rounded-lg bg-tertiary/15 border border-tertiary/30 text-tertiary font-mono text-[13px] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span className="font-semibold">All Dues Settled</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* CARD 1: Property & Financial Due (Spans 7 cols on Desktop) */}
            <article className="md:col-span-7 rounded-xl bg-surface-container-low border border-white/10 p-6 glass-specular hover:border-white/20 transition-all duration-300 flex flex-col justify-between group">
              <div>
                {/* Top Property Descriptor Header */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-outline-variant/20">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary-container/20 text-primary border border-primary-container/40">
                        <span className="material-symbols-outlined text-[16px]">apartment</span>
                      </span>
                      <h2 className="text-[20px] text-on-surface font-semibold tracking-tight">
                        {room ? `Room ${room.roomId}, ${room.propertyType}` : "Room Allocation Pending"}
                      </h2>
                    </div>
                    <p className="text-[13px] text-outline flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">location_on</span>
                      {room
                        ? `Floor: ${room.floorNumber || "1st Floor"}, Singh Rent House, Unit ${room.roomId}`
                        : "No property allocated yet. Contact administrator for room key assignment."}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full font-mono text-[11px] font-semibold tracking-wider uppercase flex items-center gap-1.5 shrink-0 ${
                      room
                        ? "bg-tertiary/10 border border-tertiary/30 text-tertiary"
                        : "bg-secondary/10 border border-secondary/30 text-secondary"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-beacon" />
                    {room ? `${room.status} LEASE` : "UNASSIGNED"}
                  </span>
                </div>

                {/* 3-Column Key Financial Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 my-5">
                  {/* Monthly Rent */}
                  <div className="p-3.5 rounded-lg bg-surface-container/50 border border-outline-variant/15 hover:border-primary/40 transition-colors">
                    <div className="font-mono text-outline text-[11px] uppercase tracking-wider">
                      Monthly Rent
                    </div>
                    <div className="text-[20px] text-on-surface font-bold mt-1 tracking-tight">
                      ₹{(room?.rentAmount ?? 0).toLocaleString("en-IN")}
                    </div>
                    <div className="font-mono text-[10px] text-tertiary mt-0.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">check_circle</span>
                      Fixed Monthly Base
                    </div>
                  </div>

                  {/* Next Due Date / Status */}
                  <div className="p-3.5 rounded-lg bg-surface-container/50 border border-outline-variant/15 hover:border-secondary/40 transition-colors">
                    <div className="font-mono text-outline text-[11px] uppercase tracking-wider flex items-center justify-between">
                      <span>Next Due Date</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-tertiary/10 text-tertiary border border-tertiary/20">30-Day Cycle</span>
                    </div>
                    <div className="text-[18px] text-on-surface font-bold mt-1 tracking-tight">
                      {currentDues?.dueDate
                        ? formatDate(currentDues.dueDate)
                        : (user?.nextDueDate ? formatDate(user.nextDueDate) : "30 Days from Joining")}
                    </div>
                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary/10 text-secondary font-mono text-[10px] mt-0.5">
                      <span className="material-symbols-outlined text-[11px]">schedule</span>
                      {currentDues && currentDues.pendingAmount > 0
                        ? `Due: ₹${currentDues.pendingAmount.toLocaleString("en-IN")} • ${getDueDaysLabel(currentDues.dueDate || user?.nextDueDate)}`
                        : getDueDaysLabel(currentDues?.dueDate || user?.nextDueDate)}
                    </div>
                  </div>

                  {/* Security Deposit */}
                  <div className="p-3.5 rounded-lg bg-surface-container/50 border border-outline-variant/15 hover:border-outline transition-colors">
                    <div className="font-mono text-outline text-[11px] uppercase tracking-wider">
                      Security Deposit
                    </div>
                    <div className="text-[20px] text-on-surface font-bold mt-1 tracking-tight">
                      ₹{((room?.securityDeposit ?? (room?.rentAmount ? room.rentAmount * 2 : 0))).toLocaleString("en-IN")}
                    </div>
                    <div className="font-mono text-[10px] text-outline mt-0.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px] text-primary">security</span>
                      Escrow Vaulted
                    </div>
                  </div>
                </div>

                {/* Live Sub-Meter Telemetry Ticker */}
                <div className="rounded-lg bg-surface-container-high/40 border border-outline-variant/20 p-3.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-tertiary-container/30 border border-tertiary/40 flex items-center justify-center text-tertiary animate-electric">
                      <span className="material-symbols-outlined text-[18px]">bolt</span>
                    </div>
                    <div>
                      <div className="font-mono text-xs font-semibold text-on-surface flex items-center gap-2">
                        <span>
                          {latestBill
                            ? `Sub-meter #${room?.meterNumber || "MTR-N/A"}: ${latestBill.currentUnit} kWh`
                            : room
                            ? `Sub-meter #${room.meterNumber}: ${room.baselineUnit} kWh (Initial Baseline)`
                            : "Sub-meter Telemetry Unassigned"}
                        </span>
                        <span className="w-2 h-2 rounded-full bg-tertiary animate-ping" />
                      </div>
                      <div className="font-mono text-[11px] text-outline">
                        {latestBill
                          ? `Tariff ₹${latestBill.ratePerUnit || 6}.00/unit • Consumed ${latestBill.unitsConsumed} units (${latestBill.billingMonth})`
                          : "Formula: (Current Unit - Previous Unit) × ₹6.00 / unit"}
                      </div>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] text-secondary bg-secondary/10 px-2.5 py-1 rounded border border-secondary/20">
                    {latestBill ? `+${latestBill.unitsConsumed} kWh this cycle` : "0 kWh cycle"}
                  </span>
                </div>
              </div>

              {/* Bottom Action Buttons Strip */}
              <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsBreakdownModalOpen(true)}
                  className="px-3.5 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface-variant hover:text-on-surface font-mono text-[13px] transition-all duration-150 active:scale-95 cursor-pointer"
                >
                  Breakdown
                </button>
                {currentDues && currentDues.pendingAmount > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPayAmount(currentDues.pendingAmount);
                      setIsPayModalOpen(true);
                    }}
                    className="px-5 py-2 rounded-lg bg-primary-container hover:bg-[#4338CA] text-white font-mono text-[13px] transition-all duration-150 active:scale-95 flex items-center gap-2 glass-specular-primary cursor-pointer shadow-md"
                  >
                    <span className="material-symbols-outlined text-[16px]">credit_card</span>
                    <span>Pay ₹{currentDues.pendingAmount.toLocaleString("en-IN")}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="px-5 py-2 rounded-lg bg-surface-container-high text-tertiary font-mono text-[13px] flex items-center gap-2 opacity-80 cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>All Paid</span>
                  </button>
                )}
              </div>
            </article>

            {/* CARD 2: Identity & Digital Lease Vault (Spans 5 cols on Desktop) */}
            <article className="md:col-span-5 rounded-xl bg-surface-container-low border border-white/10 p-6 glass-specular hover:border-white/20 transition-all duration-300 flex flex-col justify-between group">
              <div>
                {/* Card Header */}
                <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-secondary/15 text-secondary border border-secondary/30">
                      <span className="material-symbols-outlined text-[16px]">badge</span>
                    </span>
                    <h2 className="text-[20px] text-on-surface font-semibold tracking-tight">
                      Identity & KYC
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-tertiary/10 border border-tertiary/30 text-tertiary font-mono text-[11px]">
                    <span className="material-symbols-outlined text-[12px]">verified</span>
                    {user?.aadhaarDocumentPath ? "KYC SUBMITTED" : "REGISTERED"}
                  </div>
                </div>

                {/* Aadhaar Cryptographic Card Snippet */}
                <div className="mt-4 p-4 rounded-lg bg-gradient-to-br from-surface-container via-surface-container-high to-surface-container border border-outline-variant/25 relative overflow-hidden group-hover:border-primary/40 transition-colors">
                  <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-primary/5 rounded-full blur-xl" />
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[10px] tracking-widest text-outline uppercase">
                      GOVT OF INDIA // UIDAI SECURED
                    </span>
                    <span className="material-symbols-outlined text-tertiary text-[18px]">lock</span>
                  </div>
                  <div className="space-y-1">
                    <div className="font-semibold text-on-surface text-[14px]">
                      {user?.fullName || "Registered Resident"}
                    </div>
                    <div className="font-mono text-primary tracking-widest text-sm flex items-center gap-2">
                      <span>{getMaskedAadhaar(user?.aadhaarNumber)}</span>
                      <span className="material-symbols-outlined text-[14px] text-tertiary">
                        check_circle
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-outline-variant/20 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-outline">Address: {user?.fullAddress || "Bengaluru, Karnataka"}</span>
                    <span className="text-tertiary font-medium">DB ID #{user?.id}</span>
                  </div>
                </div>

                {/* Aadhaar Document Inspection Preview Trigger */}
                <div
                  onClick={() => {
                    if (user?.aadhaarDocumentPath) {
                      setIsDocumentModalOpen(true);
                    } else {
                      showToast("No Aadhaar document uploaded for this user yet.");
                    }
                  }}
                  className="mt-3.5 p-3 rounded-lg bg-surface-container/50 border border-outline-variant/20 hover:border-outline transition-all flex items-center justify-between cursor-pointer group/file"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary text-[22px] group-hover/file:scale-110 transition-transform">
                      {user?.aadhaarDocumentPath ? "description" : "upload_file"}
                    </span>
                    <div>
                      <div className="font-semibold text-on-surface group-hover/file:text-primary transition-colors text-[13px]">
                        {user?.aadhaarDocumentPath ? "Resident Aadhaar KYC Document" : "Aadhaar Document Not Uploaded"}
                      </div>
                      <div className="font-mono text-[10px] text-outline">
                        {user?.aadhaarDocumentPath ? "Click to view uploaded credential" : "Contact admin to upload document"}
                      </div>
                    </div>
                  </div>
                  {user?.aadhaarDocumentPath && (
                    <span className="font-mono text-xs text-primary flex items-center gap-0.5 group-hover/file:translate-x-0.5 transition-transform">
                      Inspect
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Lease Duration Status Footer */}
              <div className="mt-5 pt-3 border-t border-outline-variant/20 flex items-center justify-between font-mono text-[11px] text-outline">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-secondary">event</span>
                  Joined: {formatDate(user?.dateOfJoining)}
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-bright/40 text-on-surface border border-outline-variant/30">
                  {room ? `🔒 Unit ${room.roomId} Active` : "Awaiting Room Allocation"}
                </span>
              </div>
            </article>

            {/* CARD 3: Payment History Ledger (Spans 7 cols on Desktop) */}
            <article className="md:col-span-7 rounded-xl bg-surface-container-low border border-white/10 p-6 glass-specular hover:border-white/20 transition-all duration-300">
              <div className="flex items-center justify-between pb-3.5 border-b border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary border border-primary/30">
                    <span className="material-symbols-outlined text-[16px]">receipt</span>
                  </span>
                  <h2 className="text-[20px] text-on-surface font-semibold tracking-tight">
                    Payment History & Ledger
                  </h2>
                </div>
                <span className="font-mono text-xs text-outline">
                  {paymentHistory.length} Database Records
                </span>
              </div>

              {/* Dynamic Transaction List */}
              <div className="divide-y divide-outline-variant/15 mt-2">
                {paymentHistory.length === 0 ? (
                  <div className="py-8 text-center text-outline font-mono text-xs">
                    <span className="material-symbols-outlined text-3xl mb-1 text-outline/50 block">
                      receipt_long
                    </span>
                    No payment history recorded yet in database. Once bills are generated or paid, your ledger will appear here.
                  </div>
                ) : (
                  paymentHistory.map((item) => (
                    <div
                      key={item.id}
                      className="py-3.5 flex items-center justify-between hover:bg-surface-container-high/30 px-2 rounded-lg transition-colors group/row"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                            item.status === "PAID"
                              ? "bg-tertiary/10 text-tertiary border-tertiary/30"
                              : item.status === "PARTIAL"
                              ? "bg-secondary/10 text-secondary border-secondary/30"
                              : "bg-error/10 text-error border-error/30"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {item.status === "PAID" ? "verified" : item.status === "PARTIAL" ? "hourglass_top" : "pending"}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-on-surface text-[13px]">
                            {item.invoiceNumber} ({item.billingMonth})
                          </div>
                          <div className="font-mono text-[11px] text-outline">
                            {item.paymentMode ? `Paid via ${item.paymentMode}` : "Pending Payment"} •{" "}
                            {item.paymentDate ? formatDateTime(item.paymentDate) : formatDateTime(item.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-mono font-semibold text-on-surface text-[14px]">
                            ₹{item.totalAmount.toLocaleString("en-IN")}
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-mono ${
                              item.status === "PAID"
                                ? "text-tertiary"
                                : item.status === "PARTIAL"
                                ? "text-secondary"
                                : "text-error"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.status === "PAID"
                                  ? "bg-tertiary"
                                  : item.status === "PARTIAL"
                                  ? "bg-secondary"
                                  : "bg-error"
                              }`}
                            />
                            {item.status}
                          </span>
                        </div>
                        <button
                          type="button"
                          aria-label="Download Invoice Receipt"
                          onClick={() => {
                            setSelectedReceipt(item);
                            setIsReceiptModalOpen(true);
                          }}
                          className="p-1.5 rounded text-outline hover:text-primary hover:bg-surface-container transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">download</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>

            {/* CARD 4: Maintenance & Caretaker Desk (Spans 5 cols on Desktop) */}
            <article className="md:col-span-5 rounded-xl bg-surface-container-low border border-white/10 p-6 glass-specular hover:border-white/20 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3.5 border-b border-outline-variant/20">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-secondary-container/20 text-secondary border border-secondary/30">
                      <span className="material-symbols-outlined text-[16px]">build</span>
                    </span>
                    <h2 className="text-[20px] text-on-surface font-semibold tracking-tight">
                      Maintenance
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-outline">
                    <span className="w-2 h-2 rounded-full bg-tertiary" />
                    24/7 Caretaker Service
                  </div>
                </div>

                {/* Active Maintenance Status */}
                <div className="mt-4 p-4 rounded-lg bg-surface-container border border-outline-variant/25">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-secondary">
                          home_repair_service
                        </span>
                        <span className="font-semibold text-on-surface text-[13px]">
                          {room ? `Unit ${room.roomId} Caretaker Protocol` : "Resident Services Desk"}
                        </span>
                      </div>
                      <p className="text-xs text-outline leading-relaxed">
                        Plumbing, electrical meter, or structural issues are attended by caretaker team.
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-tertiary/15 border border-tertiary/30 text-tertiary font-mono text-[10px] font-semibold tracking-wider shrink-0">
                      ONLINE
                    </span>
                  </div>
                  <div className="mt-3.5 pt-3 border-t border-outline-variant/15 flex items-center justify-between text-[11px] font-mono text-outline">
                    <span>Helpdesk: +91 99999 00000</span>
                    <span className="text-on-surface">Unit #{room?.roomId || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Raise Request Action */}
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => setIsMaintenanceModalOpen(true)}
                  className="w-full py-2.5 rounded-lg border border-dashed border-outline hover:border-primary hover:text-primary text-on-surface-variant font-mono text-[13px] transition-all duration-150 flex items-center justify-center gap-2 bg-surface-container-high/20 hover:bg-surface-container-high/50 active:scale-[0.99] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  <span>+ Raise Maintenance Request</span>
                </button>
              </div>
            </article>

            {/* CARD 5: Wi-Fi Credentials & Caretaker Support (Full-Width Span 12 cols) */}
            <article className="md:col-span-12 rounded-xl bg-surface-container-low border border-white/10 p-5 md:p-6 glass-specular hover:border-white/20 transition-all duration-300">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary-container/15 border border-secondary/30 flex items-center justify-center text-secondary shrink-0 shadow-inner">
                    <span className="material-symbols-outlined text-[26px]">wifi</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-[18px] text-on-surface font-semibold tracking-tight">
                        {room ? `Unit ${room.roomId} Dedicated High-Speed Fiber` : "Building High-Speed Fiber Mesh"}
                      </h3>
                      <span className="px-2 py-0.5 rounded bg-tertiary/10 border border-tertiary/30 text-tertiary font-mono text-[10px] font-semibold uppercase">
                        300 Mbps Unlimited
                      </span>
                    </div>
                    <div className="font-mono text-outline flex items-center gap-4 text-xs">
                      <span>
                        SSID: <strong className="text-on-surface">{dashboardData?.wifiNetwork || "SinghRentHouse_5G"}</strong>
                      </span>
                      <span>• Gateway: 192.168.1.1</span>
                      <span>• Zero-Trust Firewall Active</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  <button
                    type="button"
                    onClick={copyWifiPassword}
                    className="px-3.5 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface font-mono text-[13px] transition-all duration-150 active:scale-95 flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">content_copy</span>
                    <span>Copy Wi-Fi Key</span>
                  </button>
                  <Link
                    href="/contact"
                    className="px-5 py-2 rounded-lg bg-surface-container-high hover:bg-surface-bright border border-outline-variant/40 hover:border-secondary/50 text-on-surface font-mono text-[13px] transition-all duration-150 active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px] text-secondary">support_agent</span>
                    <span>Contact Property Desk</span>
                  </Link>
                </div>
              </div>
            </article>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full py-6 px-8 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-outline-variant/15 bg-surface-container-lowest mt-auto z-20">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[13px] text-on-surface-variant font-medium">
              SINGH RENT HOUSE
            </span>
            <span className="text-outline-variant/60">•</span>
            <span className="text-[12px] text-outline">
              Database-Driven Zero-Trust Resident Telemetry.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-[12px] font-mono">
            <Link href="/about" className="text-on-surface-variant hover:text-primary transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-on-surface-variant hover:text-primary transition-colors">
              Contact Desk
            </Link>
            <span className="text-on-surface-variant flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
              Live DB Synced
            </span>
          </div>
        </footer>
      </div>

      {/* ===================== MODALS ===================== */}

      {/* 1. PAY DUES MODAL */}
      <AnimatePresence>
        {isPayModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-low border border-outline-variant/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">payment</span>
                  <h3 className="font-semibold text-lg text-on-surface">Pay Outstanding Dues</h3>
                </div>
                <button
                  onClick={() => setIsPayModalOpen(false)}
                  className="p-1 rounded hover:bg-surface-container text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-3.5 rounded-lg bg-surface-container border border-outline-variant/20 space-y-1">
                  <div className="text-xs text-outline font-mono">Room / Unit Allocation</div>
                  <div className="font-semibold text-sm text-on-surface">
                    {room ? `Room ${room.roomId} (${room.propertyType})` : "Unassigned"}
                  </div>
                  <div className="text-xs text-outline font-mono mt-1">
                    Month: {currentDues?.billingMonth || "Current Cycle"} • Total Pending: ₹
                    {(currentDues?.pendingAmount ?? 0).toLocaleString("en-IN")}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-outline mb-1">
                    Settlement Amount (₹) <span className="text-primary">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={currentDues?.pendingAmount || 100000}
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-high border border-outline-variant/40 text-on-surface font-mono text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                {/* --- RAZORPAY PRIMARY PAYMENT SECTION --- */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-[#0c2340]/60 via-surface-container to-[#1a1c36]/60 border border-primary/40 shadow-[0_0_20px_rgba(79,70,229,0.15)] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[#0284c7]/20 border border-[#0284c7]/40 flex items-center justify-center text-[#38bdf8]">
                        <span className="material-symbols-outlined text-[16px]">bolt</span>
                      </div>
                      <span className="text-xs font-semibold text-white tracking-wide">Razorpay Instant Gateway</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                      SECURE 256-BIT
                    </span>
                  </div>
                  <p className="text-[11px] text-outline leading-relaxed">
                    Supports UPI (GPay, PhonePe, Paytm, BHIM), all Debit/Credit Cards & Net Banking with automated digital receipt.
                  </p>
                  <button
                    type="button"
                    disabled={isProcessingRazorpay || payAmount <= 0}
                    onClick={() => handleRazorpayCheckout(payAmount)}
                    className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-primary via-[#4338CA] to-[#0284c7] hover:brightness-110 text-white font-mono text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessingRazorpay ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>Initializing Razorpay...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">lock</span>
                        <span>Pay Online ₹{payAmount.toLocaleString("en-IN")} with Razorpay</span>
                      </>
                    )}
                  </button>
                </div>

                {/* --- MANUAL OFFLINE / CASH HANDOVER COLLAPSIBLE --- */}
                <details className="group rounded-lg bg-surface-container/50 border border-outline-variant/20 p-3">
                  <summary className="text-xs font-mono text-outline cursor-pointer flex items-center justify-between select-none">
                    <span>Or Record Offline / Cash Handover</span>
                    <span className="material-symbols-outlined text-[16px] group-open:rotate-180 transition-transform">
                      expand_more
                    </span>
                  </summary>
                  <form onSubmit={handleProcessPayment} className="mt-3 space-y-3 pt-2 border-t border-outline-variant/15">
                    <div>
                      <label className="block text-[11px] font-mono text-outline mb-1">
                        Manual Payment Mode
                      </label>
                      <select
                        value={payMode}
                        onChange={(e) => setPayMode(e.target.value)}
                        className="w-full px-3 py-2 rounded bg-surface-container-high border border-outline-variant/40 text-on-surface font-mono text-xs"
                      >
                        <option value="CASH">Direct Cash to Management</option>
                        <option value="UPI">Manual UPI Direct UTR</option>
                        <option value="NET_BANKING">Net Banking (IMPS/NEFT)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-outline mb-1">
                        Transaction Reference / Note
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. CASH-HANDOVER or UTR/420199401"
                        value={payTxnRef}
                        onChange={(e) => setPayTxnRef(e.target.value)}
                        className="w-full px-3 py-2 rounded bg-surface-container-high border border-outline-variant/40 text-on-surface font-mono text-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingPayment}
                      className="w-full py-2 rounded bg-surface-container-high hover:bg-surface-container border border-outline-variant/40 text-on-surface font-mono text-xs font-medium transition-all"
                    >
                      {isSubmittingPayment ? "Recording in DB..." : "Submit Manual Record"}
                    </button>
                  </form>
                </details>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 1.1. PAYMENT FAILED POPUP MODAL */}
      <AnimatePresence>
        {isPaymentFailedModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              className="bg-surface-container-low border border-red-500/40 rounded-2xl max-w-md w-full p-6 shadow-[0_0_50px_rgba(239,68,68,0.35)] space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
                    <span className="material-symbols-outlined text-[20px]">error</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-on-surface">Payment Failed</h3>
                    <p className="text-[11px] text-red-400 font-mono">Transaction Incomplete / Declined</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPaymentFailedModalOpen(false)}
                  className="p-1 rounded hover:bg-surface-container text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3.5 rounded-lg bg-surface-container border border-red-500/25 space-y-1.5">
                  <div className="flex justify-between items-center text-on-surface">
                    <span className="text-outline">Attempted Amount:</span>
                    <span className="text-sm font-bold text-red-400">
                      ₹{(paymentFailureDetails?.amount ?? payAmount).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-on-surface">
                    <span className="text-outline">Order Reference:</span>
                    <span className="text-[11px] text-outline">{paymentFailureDetails?.orderId || "ORD-N/A"}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-red-950/25 border border-red-500/20 text-red-200 text-[12px] leading-relaxed">
                  <span className="font-bold block text-red-300 mb-0.5">Failure Reason:</span>
                  {paymentFailureDetails?.reason || "The payment transaction was cancelled or declined by your bank."}
                </div>

                <div className="p-3 rounded-lg bg-surface-container border border-outline-variant/20 text-[11px] text-outline leading-relaxed flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary mt-0.5">mark_email_read</span>
                  <span>
                    A failure notification email has been dispatched to <strong className="text-on-surface">{user?.email}</strong>. If money was debited from your account, Razorpay will auto-refund within 2-5 banking days.
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPaymentFailedModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-outline hover:text-on-surface font-mono text-xs"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPaymentFailedModalOpen(false);
                    handleRazorpayCheckout(paymentFailureDetails?.amount || payAmount);
                  }}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-mono text-xs font-semibold flex items-center gap-2 shadow-lg shadow-red-900/30 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">replay</span>
                  <span>Retry Payment with Razorpay</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. DUES BREAKDOWN MODAL */}
      <AnimatePresence>
        {isBreakdownModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-low border border-outline-variant/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">calculate</span>
                  <h3 className="font-semibold text-lg text-on-surface">Itemized Dues Calculation</h3>
                </div>
                <button
                  onClick={() => setIsBreakdownModalOpen(false)}
                  className="p-1 rounded hover:bg-surface-container text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="space-y-3 font-mono text-xs">
                {/* Rent Row */}
                <div className="p-3 rounded-lg bg-surface-container border border-outline-variant/20 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-on-surface">Monthly Room Rent</div>
                    <div className="text-[11px] text-outline">Base rent for {room?.roomId || "Unit"}</div>
                  </div>
                  <div className="text-sm font-bold text-on-surface">
                    ₹{(currentDues?.rentAmount || room?.rentAmount || 0).toLocaleString("en-IN")}
                  </div>
                </div>

                {/* Electricity Row */}
                <div className="p-3 rounded-lg bg-surface-container border border-outline-variant/20 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-on-surface">Electricity Sub-Meter Bill</div>
                      <div className="text-[11px] text-outline">
                        {latestBill
                          ? `(${latestBill.currentUnit} - ${latestBill.previousUnit}) = ${latestBill.unitsConsumed} units`
                          : "No bill calculated yet"}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-on-surface">
                      ₹{(currentDues?.electricityAmount || latestBill?.totalAmount || 0).toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div className="text-[10px] text-outline bg-surface-container-high px-2 py-1 rounded">
                    Formula: (Current Unit - Previous Unit) × ₹6.00 per unit
                  </div>
                </div>

                {/* Total Row */}
                <div className="p-3.5 rounded-lg bg-primary-container/20 border border-primary/30 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-primary">Total Combined Amount</div>
                    <div className="text-[11px] text-outline">Rent + Light Bill</div>
                  </div>
                  <div className="text-base font-bold text-primary">
                    ₹{((currentDues?.rentAmount || room?.rentAmount || 0) + (currentDues?.electricityAmount || latestBill?.totalAmount || 0)).toLocaleString("en-IN")}
                  </div>
                </div>

                {/* Pending balance */}
                <div className="flex items-center justify-between pt-2 text-on-surface">
                  <span>Already Paid:</span>
                  <span className="text-tertiary">₹{(currentDues?.amountPaid ?? 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center justify-between text-on-surface font-semibold">
                  <span>Remaining Pending Due:</span>
                  <span className="text-secondary text-sm">₹{(currentDues?.pendingAmount ?? 0).toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-outline-variant/20 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsBreakdownModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-mono text-xs"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. RECEIPT INSPECTION MODAL */}
      <AnimatePresence>
        {isReceiptModalOpen && selectedReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-low border border-outline-variant/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">receipt_long</span>
                  <h3 className="font-semibold text-lg text-on-surface">Official Rent Receipt</h3>
                </div>
                <button
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="p-1 rounded hover:bg-surface-container text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-4 rounded-lg bg-surface-container border border-outline-variant/25 font-mono text-xs space-y-3">
                <div className="flex justify-between items-center border-b border-outline-variant/20 pb-2">
                  <div>
                    <div className="font-bold text-sm text-on-surface">SINGH RENT HOUSE</div>
                    <div className="text-[10px] text-outline">Automated Zero-Trust Receipt</div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-tertiary/15 text-tertiary font-bold">
                    {selectedReceipt.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-outline">Invoice No:</span>
                    <div className="text-on-surface font-semibold">{selectedReceipt.invoiceNumber}</div>
                  </div>
                  <div>
                    <span className="text-outline">Billing Month:</span>
                    <div className="text-on-surface font-semibold">{selectedReceipt.billingMonth}</div>
                  </div>
                  <div>
                    <span className="text-outline">Tenant Name:</span>
                    <div className="text-on-surface font-semibold">{user?.fullName}</div>
                  </div>
                  <div>
                    <span className="text-outline">Allocated Room:</span>
                    <div className="text-on-surface font-semibold">{room?.roomId || "Unit"}</div>
                  </div>
                  <div>
                    <span className="text-outline">Payment Mode:</span>
                    <div className="text-on-surface font-semibold">{selectedReceipt.paymentMode || "Online"}</div>
                  </div>
                  <div>
                    <span className="text-outline">Transaction Ref:</span>
                    <div className="text-on-surface font-semibold truncate">{selectedReceipt.transactionReference || "N/A"}</div>
                  </div>
                </div>

                <div className="border-t border-outline-variant/20 pt-2 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span>Rent Component:</span>
                    <span>₹{selectedReceipt.rentAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Electricity Sub-Meter Component:</span>
                    <span>₹{selectedReceipt.electricityAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-outline-variant/20 pt-1 text-on-surface text-sm">
                    <span>Total Amount:</span>
                    <span className="text-primary">₹{selectedReceipt.totalAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-tertiary">
                    <span>Amount Paid:</span>
                    <span>₹{selectedReceipt.amountPaid.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">print</span>
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-[#4338CA] text-white"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. AADHAAR KYC DOCUMENT PREVIEW MODAL */}
      <AnimatePresence>
        {isDocumentModalOpen && user?.aadhaarDocumentPath && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-low border border-outline-variant/40 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[22px]">verified_user</span>
                  <h3 className="font-semibold text-lg text-on-surface">Resident Aadhaar Credential</h3>
                </div>
                <button
                  onClick={() => setIsDocumentModalOpen(false)}
                  className="p-1 rounded hover:bg-surface-container text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="flex items-center justify-center bg-black/50 rounded-xl overflow-hidden p-2 max-h-[70vh]">
                <img
                  src={`http://localhost:8080${user.aadhaarDocumentPath}`}
                  alt="Aadhaar KYC Document"
                  className="max-h-[65vh] object-contain rounded-lg"
                />
              </div>

              <div className="flex items-center justify-between font-mono text-xs text-outline pt-2">
                <span>Aadhaar: {getMaskedAadhaar(user.aadhaarNumber)}</span>
                <a
                  href={`http://localhost:8080${user.aadhaarDocumentPath}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  <span>Open Full Resolution</span>
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. MAINTENANCE REQUEST MODAL */}
      <AnimatePresence>
        {isMaintenanceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-low border border-outline-variant/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[22px]">handyman</span>
                  <h3 className="font-semibold text-lg text-on-surface">Caretaker Maintenance Request</h3>
                </div>
                <button
                  onClick={() => {
                    setIsMaintenanceModalOpen(false);
                    setMaintenanceSubmitted(false);
                  }}
                  className="p-1 rounded hover:bg-surface-container text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {maintenanceSubmitted ? (
                <div className="py-6 text-center space-y-2 font-mono text-xs">
                  <span className="material-symbols-outlined text-4xl text-tertiary block">
                    task_alt
                  </span>
                  <div className="font-bold text-sm text-on-surface">Ticket Logged Successfully!</div>
                  <p className="text-outline">
                    Caretaker team has received your ticket for Unit {room?.roomId || "Registered Residence"}. Response within 2 hours.
                  </p>
                  <button
                    onClick={() => {
                      setIsMaintenanceModalOpen(false);
                      setMaintenanceSubmitted(false);
                    }}
                    className="mt-4 px-4 py-2 rounded-lg bg-primary text-white"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!maintenanceIssue.trim()) return;
                    setMaintenanceSubmitted(true);
                    setMaintenanceIssue("");
                  }}
                  className="space-y-4 font-mono text-xs"
                >
                  <div>
                    <label className="block text-outline mb-1">Assigned Property</label>
                    <div className="p-2.5 rounded-lg bg-surface-container font-semibold text-on-surface">
                      {room ? `Room ${room.roomId} (${room.propertyType})` : "Unassigned Residence"}
                    </div>
                  </div>

                  <div>
                    <label className="block text-outline mb-1">Issue Description</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Sub-meter issue, water leakage, switchboard problem..."
                      value={maintenanceIssue}
                      onChange={(e) => setMaintenanceIssue(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg bg-surface-container-high border border-outline-variant/40 text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="pt-2 border-t border-outline-variant/20 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsMaintenanceModalOpen(false)}
                      className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-outline"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-on-secondary font-semibold"
                    >
                      Dispatch Ticket
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
