"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAdminSession } from "@/lib/auth";

export interface ElectricityBillItem {
  id: number;
  roomId: number;
  roomCode: string;
  propertyType: string;
  userId: number | null;
  userName: string;
  userMobile: string;
  billingMonth: string;
  previousUnit: number;
  currentUnit: number;
  unitsConsumed: number;
  ratePerUnit: number;
  totalAmount: number;
  status: string; // PENDING, PAID
  billDate: string;
  dueDate: string | null;
  createdAt: string;
}

export interface RoomOption {
  id: number;
  roomId: string;
  propertyType: string;
  assignedUserId: number | null;
  assignedUserName: string | null;
  baselineUnit: number;
}

export interface UserOption {
  id: number;
  fullName: string;
  mobileNumber: string;
}

interface RentBillingEngineViewProps {
  showToast: (msg: string) => void;
}

export default function RentBillingEngineView({ showToast }: RentBillingEngineViewProps) {
  const [bills, setBills] = useState<ElectricityBillItem[]>([]);
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Add Bill Form State (Section 3.5.2)
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [billingMonth, setBillingMonth] = useState<string>(() => {
    return new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  });
  const [previousUnit, setPreviousUnit] = useState<number>(0);
  const [currentUnit, setCurrentUnit] = useState<string>("");
  const [ratePerUnit, setRatePerUnit] = useState<string>("6.0");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals state (Section 3.5.3)
  const [previewBill, setPreviewBill] = useState<ElectricityBillItem | null>(null);
  const [editBill, setEditBill] = useState<ElectricityBillItem | null>(null);
  const [deleteBillId, setDeleteBillId] = useState<number | null>(null);

  // Edit Bill form
  const [editForm, setEditForm] = useState({
    previousUnit: 0,
    currentUnit: 0,
    ratePerUnit: 6.0,
    billingMonth: "",
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [billsRes, roomsRes, usersRes] = await Promise.all([
        fetch("http://localhost:8080/api/admin/bills"),
        fetch("http://localhost:8080/api/admin/rooms"),
        fetch("http://localhost:8080/api/admin/rooms/users-dropdown"),
      ]);

      if (billsRes.ok) {
        const bJson = await billsRes.json();
        if (bJson?.data) setBills(bJson.data);
      }

      if (roomsRes.ok) {
        const rJson = await roomsRes.json();
        if (rJson?.data) {
          setRooms(rJson.data);
        }
      }

      if (usersRes.ok) {
        const uJson = await usersRes.json();
        if (uJson?.data) setUsers(uJson.data);
      }
    } catch (err) {
      console.error("Failed to fetch billing engine data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 3.5.1 Room Selection changes: auto-fetch previous unit & auto-link user
  const handleRoomChange = async (roomIdStr: string) => {
    setSelectedRoomId(roomIdStr);
    const foundRoom = rooms.find((r) => String(r.id) === roomIdStr);
    if (foundRoom) {
      if (foundRoom.assignedUserId) {
        setSelectedUserId(String(foundRoom.assignedUserId));
      }

      // Auto-fetch latest / previous unit from database endpoint (Section 3.5.1 & 3.5.2.3)
      try {
        const res = await fetch(`http://localhost:8080/api/admin/bills/room/${foundRoom.id}/latest-unit`);
        if (res.ok) {
          const json = await res.json();
          if (json?.data !== undefined) {
            setPreviousUnit(Number(json.data));
            return;
          }
        }
      } catch (e) {
        console.error("Failed to fetch latest unit:", e);
      }
      setPreviousUnit(foundRoom.baselineUnit || 0);
    }
  };

  // 3.5.2.1 User Selection changes: auto-select room if tenant is assigned to one
  const handleUserChange = (userIdStr: string) => {
    setSelectedUserId(userIdStr);
    const roomForUser = rooms.find((r) => String(r.assignedUserId) === userIdStr);
    if (roomForUser) {
      handleRoomChange(String(roomForUser.id));
    }
  };

  // 3.5.2.5 Dynamic Calculation: (current - prev) * rate per unit
  const curNum = parseFloat(currentUnit) || 0;
  const rateNum = parseFloat(ratePerUnit) > 0 ? parseFloat(ratePerUnit) : 6.0;
  const unitsConsumed = Math.max(0, curNum - previousUnit);
  const calculatedTotal = unitsConsumed * rateNum;

  // 3.5.2.6 Save Button Handler
  const handleSaveBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId) {
      showToast("Please select a room for billing");
      return;
    }
    if (curNum < previousUnit) {
      showToast(`Current unit (${curNum}) cannot be less than previous unit (${previousUnit})`);
      return;
    }

    setIsSubmitting(true);
    const session = getAdminSession();
    const payload = {
      roomId: Number(selectedRoomId),
      userId: selectedUserId ? Number(selectedUserId) : null,
      billingMonth: billingMonth.trim(),
      previousUnit: previousUnit,
      currentUnit: curNum,
      ratePerUnit: rateNum,
    };

    try {
      const res = await fetch("http://localhost:8080/api/admin/bills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: session ? `Bearer ${session.token}` : "",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast(
          `Electricity bill of ₹${calculatedTotal.toLocaleString("en-IN")} (@ ₹${rateNum}/unit) saved! Room baseline updated.`
        );
        setCurrentUnit("");
        fetchData();
      } else {
        const errJson = await res.json();
        showToast(errJson?.message || "Failed to save electricity bill");
      }
    } catch {
      showToast("Network error saving electricity bill");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3.5.3 Edit Bill
  const openEditModal = (b: ElectricityBillItem) => {
    setEditBill(b);
    setEditForm({
      previousUnit: b.previousUnit,
      currentUnit: b.currentUnit,
      ratePerUnit: b.ratePerUnit || 6.0,
      billingMonth: b.billingMonth,
    });
  };

  const handleUpdateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBill) return;
    setIsSubmitting(true);
    const session = getAdminSession();
    const payload = {
      roomId: editBill.roomId,
      userId: editBill.userId,
      billingMonth: editForm.billingMonth,
      previousUnit: editForm.previousUnit,
      currentUnit: editForm.currentUnit,
      ratePerUnit: editForm.ratePerUnit > 0 ? editForm.ratePerUnit : 6.0,
    };

    try {
      const res = await fetch(`http://localhost:8080/api/admin/bills/${editBill.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: session ? `Bearer ${session.token}` : "",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast(`Bill #${editBill.id} updated in database!`);
        setEditBill(null);
        fetchData();
      } else {
        const errJson = await res.json();
        showToast(errJson?.message || "Failed to update bill");
      }
    } catch {
      showToast("Network error updating bill");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3.5.3 Delete Bill
  const handleDeleteBill = async (id: number) => {
    const session = getAdminSession();
    try {
      const res = await fetch(`http://localhost:8080/api/admin/bills/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: session ? `Bearer ${session.token}` : "",
        },
      });

      if (res.ok) {
        showToast("Electricity bill record removed from database.");
        setDeleteBillId(null);
        setPreviewBill(null);
        fetchData();
      } else {
        showToast("Failed to delete bill.");
      }
    } catch {
      showToast("Network error deleting bill");
    }
  };

  const totalInvoiced = bills.reduce((acc, b) => acc + (b.totalAmount || 0), 0);
  const totalKwh = bills.reduce((acc, b) => acc + (b.unitsConsumed || 0), 0);

  const filteredBills = bills.filter(
    (b) =>
      b.roomCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.billingMonth.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 3.5 HEADER & TELEMETRY SUMMARY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary-container/20 text-secondary border border-secondary/30">
              3.5 Light Bills Engine
            </span>
            <h1 className="text-[26px] font-bold text-on-surface tracking-tight">
              Electricity &amp; Power Billing Suite
            </h1>
          </div>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Automated meter delta calculator with fixed ₹6.00/kWh tariff, instant database ledger posting, and tenant invoice records.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface text-xs font-mono border border-outline-variant/40 transition-all cursor-pointer"
        >
          <span className={`material-symbols-outlined text-[16px] text-secondary ${isLoading ? "animate-spin" : ""}`}>
            sync
          </span>
          Refresh Bills
        </button>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-on-surface-variant">
            <span>Total Light Invoiced</span>
            <span className="material-symbols-outlined text-secondary text-[18px]">electric_bolt</span>
          </div>
          <div className="mt-2 text-[28px] font-bold text-on-surface">
            ₹{totalInvoiced.toLocaleString("en-IN", { maximumFractionDigits: 1 })}
          </div>
          <span className="text-[11px] text-secondary font-mono mt-1">Live DB public.electricity_bills</span>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-on-surface-variant">
            <span>Net Power Draw</span>
            <span className="material-symbols-outlined text-tertiary text-[18px]">speed</span>
          </div>
          <div className="mt-2 text-[28px] font-bold text-tertiary">
            {totalKwh.toLocaleString("en-IN", { maximumFractionDigits: 1 })} kWh
          </div>
          <span className="text-[11px] text-tertiary font-mono mt-1">Sub-Metered Consumption</span>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-on-surface-variant">
            <span>Configured Tariff</span>
            <span className="material-symbols-outlined text-primary text-[18px]">price_check</span>
          </div>
          <div className="mt-2 text-[28px] font-bold text-primary">₹{rateNum.toFixed(2)} / Unit</div>
          <span className="text-[11px] text-secondary font-mono mt-1">
            Dynamic Rate: (Curr - Prev) × ₹{rateNum.toFixed(0)}
          </span>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-on-surface-variant">
            <span>Invoices Generated</span>
            <span className="material-symbols-outlined text-on-surface text-[18px]">receipt</span>
          </div>
          <div className="mt-2 text-[28px] font-bold text-on-surface">{bills.length} Records</div>
          <span className="text-[11px] text-outline font-mono mt-1">
            {bills.filter((b) => b.status === "PAID").length} Paid /{" "}
            {bills.filter((b) => b.status === "PENDING").length} Pending
          </span>
        </div>
      </div>

      {/* 3.5.2 ADD BILL FORM ENGINE */}
      <section className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/10 border border-secondary/30 text-secondary">
              <span className="material-symbols-outlined text-[22px]">calculate</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-on-surface tracking-tight">
                  3.5.2 Add New Electricity Bill Form
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-tertiary/15 text-tertiary border border-tertiary/30">
                  REAL-TIME FORMULA ENGINE
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                Select tenant &amp; room, previous unit auto-fetches, enter current reading, system computes (current - previous) × ₹6.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Cols: The Form (3.5.2.1 - 3.5.2.6) */}
          <form onSubmit={handleSaveBill} className="lg:col-span-7 flex flex-col gap-4 text-xs font-mono">
            {/* 3.5.2.1 User Full Name Dropdown */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-on-surface flex items-center gap-1.5">
                  <span className="text-secondary font-bold">3.5.2.1</span> User Full Name (Tenant Dropdown)
                </label>
                <span className="text-[10px] text-secondary bg-secondary/10 px-2 py-0.5 rounded border border-secondary/20">
                  Auto-fetched from DB
                </span>
              </div>
              <select
                value={selectedUserId}
                onChange={(e) => handleUserChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface focus:border-secondary focus:outline-none cursor-pointer"
              >
                <option value="">-- Select Registered Tenant --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} (Phone: +91 {u.mobileNumber}) • UID: #{u.id}
                  </option>
                ))}
              </select>
            </div>

            {/* 3.5.2.2 Room ID Dropdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-on-surface flex items-center gap-1.5">
                  <span className="text-secondary font-bold">3.5.2.2</span> Room ID Dropdown
                </label>
                <select
                  required
                  value={selectedRoomId}
                  onChange={(e) => handleRoomChange(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface font-bold focus:border-secondary focus:outline-none cursor-pointer"
                >
                  <option value="">-- Select Room / Property --</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.roomId} ({r.propertyType}) {r.assignedUserName ? `• [${r.assignedUserName}]` : "• [Vacant]"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-on-surface">Billing Month</label>
                <input
                  type="text"
                  required
                  value={billingMonth}
                  onChange={(e) => setBillingMonth(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface font-bold focus:border-secondary focus:outline-none"
                  placeholder="e.g. October 2024"
                />
              </div>
            </div>

            {/* 3.5.2.3, 3.5.2.4 & Editable Rate Per Unit */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* 3.5.2.3 Previous Unit Auto-Fetched */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-on-surface flex items-center gap-1">
                    <span className="text-secondary font-bold">3.5.2.3</span> Previous Unit
                  </label>
                  <span className="text-[10px] text-tertiary font-bold">Auto-Fetched</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    readOnly
                    value={previousUnit}
                    className="w-full px-3 py-2.5 bg-surface-container border border-outline-variant/30 rounded-lg text-secondary font-bold cursor-not-allowed"
                  />
                  <span className="absolute right-3 top-2.5 text-[11px] text-outline">kWh</span>
                </div>
                <span className="text-[10px] text-outline truncate">
                  Latest meter reading in DB
                </span>
              </div>

              {/* 3.5.2.4 Current Unit Input */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-on-surface flex items-center gap-1">
                    <span className="text-secondary font-bold">3.5.2.4</span> Current Unit
                  </label>
                  <span className="text-[10px] text-secondary">Manual Reading</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="Enter Current kWh"
                    value={currentUnit}
                    onChange={(e) => setCurrentUnit(e.target.value)}
                    className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface font-bold focus:border-secondary focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-[11px] text-outline">kWh</span>
                </div>
                <span className="text-[10px] text-outline">Must be ≥ previous unit</span>
              </div>

              {/* Editable Rate Per Unit (₹6, ₹7, ₹8, etc.) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-on-surface flex items-center gap-1">
                    <span className="text-secondary font-bold">Rate / Unit</span> (₹)
                  </label>
                  <span className="text-[10px] text-amber-400 font-bold">Editable</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-[12px] text-outline font-bold">₹</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    placeholder="6, 7, 8..."
                    value={ratePerUnit}
                    onChange={(e) => setRatePerUnit(e.target.value)}
                    className="w-full pl-7 pr-12 py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface font-bold text-secondary focus:border-secondary focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-[11px] text-outline">/ unit</span>
                </div>
                {/* Quick Selection Chips */}
                <div className="flex items-center gap-1 pt-0.5">
                  {[6, 7, 8, 9, 10].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setRatePerUnit(String(rate))}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer ${
                        parseFloat(ratePerUnit) === rate
                          ? "bg-secondary text-on-secondary font-bold shadow-sm"
                          : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      ₹{rate}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3.5.2.5 FORMULA CALCULATION TEXT & TOTAL AMOUNT */}
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-secondary/30 space-y-2">
              <div className="text-secondary font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">functions</span>
                <span>3.5.2.5 Formula Text Calculation:</span>
              </div>
              <div className="text-[13px] text-on-surface font-mono flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-surface-container text-secondary">
                  (Current: {curNum.toFixed(1)} - Previous: {previousUnit.toFixed(1)})
                </span>
                <span>=</span>
                <span className="px-2 py-0.5 rounded bg-primary-container/20 text-primary font-bold">
                  {unitsConsumed.toFixed(1)} Units Consumed
                </span>
                <span>×</span>
                <span className="px-2 py-0.5 rounded bg-surface-container text-tertiary font-bold">
                  1 Unit = ₹{rateNum.toFixed(2)}
                </span>
                <span>=</span>
                <span className="px-2.5 py-0.5 rounded bg-tertiary/15 text-tertiary font-bold text-base border border-tertiary/30">
                  ₹{calculatedTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* 3.5.2.6 SAVE BUTTON */}
            <div className="flex items-center justify-end pt-2 border-t border-outline-variant/30">
              <button
                type="submit"
                disabled={isSubmitting || curNum < previousUnit}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary-container hover:bg-indigo-600 text-white font-semibold text-xs border border-primary/30 shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                {isSubmitting ? "Generating Bill in Database..." : "3.5.2.6 [Save & Generate Electricity Bill]"}
              </button>
            </div>
          </form>

          {/* Right 5 Cols: Live Bill Breakdown */}
          <div className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 flex flex-col justify-between shadow-inner font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-tertiary animate-pulse" />
                <span className="font-semibold text-on-surface">Sub-Meter Energy Invoice</span>
              </div>
              <span className="text-[10px] bg-secondary/15 text-secondary px-2 py-0.5 rounded border border-secondary/30">
                RATE ₹6/kWh
              </span>
            </div>

            <div className="my-3 p-4 rounded-lg bg-surface-container-low border border-outline-variant/20 space-y-2">
              <div className="flex justify-between">
                <span className="text-outline">Room Allocated:</span>
                <span className="text-on-surface font-bold">
                  {rooms.find((r) => String(r.id) === selectedRoomId)?.roomId || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Tenant Name:</span>
                <span className="text-on-surface font-semibold">
                  {users.find((u) => String(u.id) === selectedUserId)?.fullName || "Unassigned"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Previous Reading:</span>
                <span className="text-secondary">{previousUnit} kWh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Current Reading:</span>
                <span className="text-on-surface font-bold">{curNum} kWh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Units Consumed:</span>
                <span className="text-primary font-bold">{unitsConsumed.toFixed(1)} kWh</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-outline-variant/30 text-sm">
                <span className="text-on-surface font-bold">Total Invoiced:</span>
                <span className="text-tertiary font-bold">
                  ₹{calculatedTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-outline text-center">
              Saving this bill automatically updates the room&apos;s baseline unit and generates a linked pending payment entry for this tenant in Section 3.6.
            </p>
          </div>
        </div>
      </section>

      {/* 3.5.3 BILLS TABLE WITH EDIT / UPDATE / DELETE / PREVIEW */}
      <section className="bg-surface-container-low border border-outline-variant/30 rounded-xl flex flex-col shadow-sm overflow-hidden">
        <div className="p-4 border-b border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <h3 className="font-bold text-on-surface text-sm">
            Electricity Billing Records &amp; Invoices
          </h3>
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-outline text-[16px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search Room, Tenant, Month..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs font-body bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest border-b border-outline-variant/30 text-[11px] font-mono text-outline uppercase tracking-wider">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Room &amp; Tenant</th>
                <th className="py-3 px-4">Billing Month</th>
                <th className="py-3 px-4">Prev → Curr Units</th>
                <th className="py-3 px-4">Consumed (kWh)</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">3.5.3 Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-xs font-mono">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-outline">
                    <span className="material-symbols-outlined animate-spin text-[20px] text-secondary inline-block align-middle mr-2">
                      autorenew
                    </span>
                    Loading electricity bills from database...
                  </td>
                </tr>
              ) : filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-outline">
                    No electricity bill records found.
                  </td>
                </tr>
              ) : (
                filteredBills.map((b) => (
                  <tr key={b.id} className="hover:bg-surface-container/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-secondary">#EB-{b.id}</td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-on-surface">{b.roomCode}</div>
                      <div className="text-[10px] text-outline font-body">{b.userName}</div>
                    </td>

                    <td className="py-3 px-4 text-on-surface font-medium">{b.billingMonth}</td>

                    <td className="py-3 px-4">
                      <span className="text-outline">{b.previousUnit}</span> →{" "}
                      <span className="text-secondary font-bold">{b.currentUnit}</span>
                    </td>

                    <td className="py-3 px-4 text-primary font-bold">{b.unitsConsumed.toFixed(1)} kWh</td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-on-surface">
                        ₹{b.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-outline">@ ₹{b.ratePerUnit}/unit</div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                          b.status === "PAID"
                            ? "bg-tertiary/15 text-tertiary border border-tertiary/30"
                            : "bg-amber-400/15 text-amber-400 border border-amber-400/30"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            b.status === "PAID" ? "bg-tertiary" : "bg-amber-400"
                          }`}
                        />
                        {b.status}
                      </span>
                    </td>

                    {/* 3.5.3 Actions: Preview, Edit, Delete */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewBill(b)}
                          className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-secondary transition-colors cursor-pointer"
                          title="Preview Invoice"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(b)}
                          className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                          title="Edit Bill"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteBillId(b.id)}
                          className="p-1 rounded hover:bg-error/20 text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                          title="Delete Bill"
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
      </section>

      {/* 3.5.3 PREVIEW INVOICE MODAL */}
      <AnimatePresence>
        {previewBill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-low border border-outline-variant/40 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 font-mono text-xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                <div>
                  <h3 className="font-bold text-on-surface text-base">
                    Electricity Invoice #EB-{previewBill.id}
                  </h3>
                  <p className="text-[10px] text-outline">{previewBill.billingMonth}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewBill(null)}
                  className="p-1.5 rounded-lg hover:bg-surface-container text-outline hover:text-on-surface cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-outline-variant/20">
                  <span className="text-outline">Room Allocated:</span>
                  <span className="text-on-surface font-bold">{previewBill.roomCode}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-outline-variant/20">
                  <span className="text-outline">Tenant Name:</span>
                  <span className="text-on-surface font-semibold">{previewBill.userName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-outline-variant/20">
                  <span className="text-outline">Previous Unit Reading:</span>
                  <span className="text-secondary">{previewBill.previousUnit} kWh</span>
                </div>
                <div className="flex justify-between py-1 border-b border-outline-variant/20">
                  <span className="text-outline">Current Unit Reading:</span>
                  <span className="text-secondary font-bold">{previewBill.currentUnit} kWh</span>
                </div>
                <div className="flex justify-between py-1 border-b border-outline-variant/20">
                  <span className="text-outline">Units Consumed:</span>
                  <span className="text-primary font-bold">{previewBill.unitsConsumed.toFixed(1)} kWh</span>
                </div>
                <div className="flex justify-between py-1 border-b border-outline-variant/20">
                  <span className="text-outline">Tariff Rate:</span>
                  <span className="text-on-surface">₹{previewBill.ratePerUnit}.00 / kWh</span>
                </div>
                <div className="flex justify-between py-2 border-b border-outline-variant/30 text-sm">
                  <span className="font-bold text-on-surface">Total Light Bill Amount:</span>
                  <span className="font-bold text-tertiary">
                    ₹{previewBill.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-outline">Status:</span>
                  <span className={previewBill.status === "PAID" ? "text-tertiary font-bold" : "text-amber-400 font-bold"}>
                    {previewBill.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setPreviewBill(null)}
                  className="px-4 py-1.5 rounded-lg bg-primary-container text-white cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3.5.3 EDIT BILL MODAL */}
      <AnimatePresence>
        {editBill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-low border border-outline-variant/40 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 font-mono text-xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                <h3 className="font-bold text-on-surface text-base">
                  Edit Bill: #{editBill.id} ({editBill.roomCode})
                </h3>
                <button
                  type="button"
                  onClick={() => setEditBill(null)}
                  className="p-1.5 rounded-lg hover:bg-surface-container text-outline hover:text-on-surface cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <form onSubmit={handleUpdateBill} className="space-y-3">
                <div>
                  <label className="block text-on-surface-variant mb-1">Billing Month</label>
                  <input
                    type="text"
                    required
                    value={editForm.billingMonth}
                    onChange={(e) => setEditForm({ ...editForm, billingMonth: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface focus:border-secondary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-on-surface-variant mb-1">Previous Unit</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={editForm.previousUnit}
                      onChange={(e) => setEditForm({ ...editForm, previousUnit: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface focus:border-secondary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-on-surface-variant mb-1">Current Unit</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={editForm.currentUnit}
                      onChange={(e) => setEditForm({ ...editForm, currentUnit: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface focus:border-secondary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-on-surface-variant mb-1">Rate / Unit (₹)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      required
                      value={editForm.ratePerUnit}
                      onChange={(e) => setEditForm({ ...editForm, ratePerUnit: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface font-bold text-secondary focus:border-secondary focus:outline-none"
                    />
                  </div>
                </div>

                {/* Quick Rate Preset Chips in Edit Modal */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-outline">Quick Tariff:</span>
                  {[6, 7, 8, 9, 10].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, ratePerUnit: rate })}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer ${
                        editForm.ratePerUnit === rate
                          ? "bg-secondary text-on-secondary font-bold shadow-sm"
                          : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      ₹{rate}
                    </button>
                  ))}
                </div>

                <div className="p-2.5 rounded bg-surface-container text-outline flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span>Recomputed Amount:</span>
                    <span className="text-tertiary font-bold text-sm">
                      ₹{Math.max(0, (editForm.currentUnit - editForm.previousUnit) * editForm.ratePerUnit).toFixed(2)}
                    </span>
                  </div>
                  <div className="text-[10px] text-outline">
                    ({editForm.currentUnit} - {editForm.previousUnit}) = {(Math.max(0, editForm.currentUnit - editForm.previousUnit)).toFixed(1)} kWh × ₹{editForm.ratePerUnit}/unit
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-outline-variant/30">
                  <button
                    type="button"
                    onClick={() => setEditBill(null)}
                    className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-1.5 rounded-lg bg-primary-container text-white font-semibold cursor-pointer"
                  >
                    {isSubmitting ? "Saving..." : "Save Updates"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3.5.3 DELETE BILL CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteBillId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-low border border-error/40 rounded-xl max-w-sm w-full p-5 shadow-2xl space-y-3 font-mono text-xs"
            >
              <div className="flex items-center gap-2 text-error font-bold text-sm">
                <span className="material-symbols-outlined text-[20px]">warning</span>
                Delete Electricity Bill
              </div>
              <p className="text-on-surface-variant">
                Are you sure you want to permanently delete bill #{deleteBillId}? Linked pending dues will be removed.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setDeleteBillId(null)}
                  className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteBill(deleteBillId)}
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
