"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAdminSession } from "@/lib/auth";

export interface RoomItem {
  id: number;
  roomId: string;
  propertyType: string;
  assignedUserId: number | null;
  assignedUserName: string | null;
  assignedUserMobile: string | null;
  assignedUserAadhaar: string | null;
  rentAmount: number;
  meterNumber: string;
  baselineUnit: number;
  floorNumber: string | null;
  status: string; // VACANT, OCCUPIED, MAINTENANCE
  createdAt: string;
  updatedAt: string;
}

export interface UserDropdownItem {
  id: number;
  fullName: string;
  username: string;
  mobileNumber: string;
  aadhaarNumber: string;
  email: string;
  status: string;
  active: boolean;
}

interface RoomInventoryViewProps {
  showToast: (msg: string) => void;
}

export default function RoomInventoryView({ showToast }: RoomInventoryViewProps) {
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [users, setUsers] = useState<UserDropdownItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<"ALL" | "RESIDENTIAL" | "COMMERCIAL" | "VACANT">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [previewRoom, setPreviewRoom] = useState<RoomItem | null>(null);
  const [editRoom, setEditRoom] = useState<RoomItem | null>(null);
  const [deleteRoomId, setDeleteRoomId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State (Section 3.4.1)
  const [formTenantId, setFormTenantId] = useState<string>("vacant");
  const [formPropertyType, setFormPropertyType] = useState<string>("Residential Flat (2BHK)");
  const [formRoomId, setFormRoomId] = useState<string>("");
  const [formRentAmount, setFormRentAmount] = useState<string>("");
  const [formMeterNumber, setFormMeterNumber] = useState<string>("");
  const [formBaselineUnit, setFormBaselineUnit] = useState<string>("0");
  const [formFloorNumber, setFormFloorNumber] = useState<string>("1st Floor");

  // Edit Form State
  const [editForm, setEditForm] = useState({
    roomId: "",
    propertyType: "",
    assignedUserId: "vacant",
    rentAmount: "",
    meterNumber: "",
    baselineUnit: "",
    floorNumber: "",
    status: "VACANT",
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [roomsRes, usersRes] = await Promise.all([
        fetch("http://localhost:8080/api/admin/rooms"),
        fetch("http://localhost:8080/api/admin/rooms/users-dropdown"),
      ]);

      if (roomsRes.ok) {
        const roomsJson = await roomsRes.json();
        if (roomsJson?.data) setRooms(roomsJson.data);
      }

      if (usersRes.ok) {
        const usersJson = await usersRes.json();
        if (usersJson?.data) setUsers(usersJson.data);
      }
    } catch (err) {
      console.error("Failed to load rooms and users data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 3.4.1.5 Submit Button Handler
  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRoomId.trim()) {
      showToast("Please enter a Room/Property ID");
      return;
    }
    if (!formMeterNumber.trim()) {
      showToast("Please enter a Smart Sub-Meter ID");
      return;
    }

    setIsSubmitting(true);
    const session = getAdminSession();
    const payload = {
      roomId: formRoomId.trim().toUpperCase(),
      propertyType: formPropertyType,
      assignedUserId: formTenantId !== "vacant" ? Number(formTenantId) : null,
      rentAmount: parseFloat(formRentAmount) || 0.0,
      meterNumber: formMeterNumber.trim().toUpperCase(),
      baselineUnit: parseFloat(formBaselineUnit) || 0.0,
      floorNumber: formFloorNumber,
      status: formTenantId !== "vacant" ? "OCCUPIED" : "VACANT",
    };

    try {
      const res = await fetch("http://localhost:8080/api/admin/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: session ? `Bearer ${session.token}` : "",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast(`Property unit ${payload.roomId} provisioned & saved to database!`);
        setFormRoomId("");
        setFormMeterNumber("");
        setFormBaselineUnit("0.0");
        setFormTenantId("vacant");
        fetchData();
      } else {
        const errJson = await res.json();
        showToast(errJson?.message || "Failed to create property room");
      }
    } catch {
      showToast("Network error creating property unit");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3.4.2 Edit Form Handler
  const openEditModal = (r: RoomItem) => {
    setEditRoom(r);
    setEditForm({
      roomId: r.roomId,
      propertyType: r.propertyType,
      assignedUserId: r.assignedUserId ? String(r.assignedUserId) : "vacant",
      rentAmount: String(r.rentAmount),
      meterNumber: r.meterNumber,
      baselineUnit: String(r.baselineUnit),
      floorNumber: r.floorNumber || "",
      status: r.status,
    });
  };

  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRoom) return;
    setIsSubmitting(true);
    const session = getAdminSession();
    const payload = {
      roomId: editForm.roomId.trim().toUpperCase(),
      propertyType: editForm.propertyType,
      assignedUserId: editForm.assignedUserId !== "vacant" ? Number(editForm.assignedUserId) : null,
      rentAmount: parseFloat(editForm.rentAmount) || 0.0,
      meterNumber: editForm.meterNumber.trim().toUpperCase(),
      baselineUnit: parseFloat(editForm.baselineUnit) || 0.0,
      floorNumber: editForm.floorNumber,
      status: editForm.status,
    };

    try {
      const res = await fetch(`http://localhost:8080/api/admin/rooms/${editRoom.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: session ? `Bearer ${session.token}` : "",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast(`Property ${payload.roomId} updated successfully in database!`);
        setEditRoom(null);
        fetchData();
      } else {
        const errJson = await res.json();
        showToast(errJson?.message || "Failed to update property unit");
      }
    } catch {
      showToast("Network error updating property unit");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3.4.2 Delete Handler
  const handleDeleteRoom = async (id: number) => {
    const session = getAdminSession();
    try {
      const res = await fetch(`http://localhost:8080/api/admin/rooms/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: session ? `Bearer ${session.token}` : "",
        },
      });

      if (res.ok) {
        showToast("Property unit deleted from database inventory.");
        setDeleteRoomId(null);
        setPreviewRoom(null);
        fetchData();
      } else {
        showToast("Failed to delete property unit.");
      }
    } catch {
      showToast("Network error deleting property unit");
    }
  };

  const filteredRooms = rooms.filter((r) => {
    const matchesSearch =
      r.roomId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.propertyType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.assignedUserName && r.assignedUserName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      r.meterNumber.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterType === "RESIDENTIAL") return matchesSearch && !r.propertyType.toLowerCase().includes("shop");
    if (filterType === "COMMERCIAL") return matchesSearch && r.propertyType.toLowerCase().includes("shop");
    if (filterType === "VACANT") return matchesSearch && r.status === "VACANT";
    return matchesSearch;
  });

  const totalMonthlyRent = rooms.reduce((acc, r) => acc + (r.rentAmount || 0), 0);
  const occupiedCount = rooms.filter((r) => r.status === "OCCUPIED").length;
  const vacantCount = rooms.filter((r) => r.status === "VACANT").length;

  return (
    <div className="space-y-6">
      {/* 3.4 HEADER & METRICS BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-secondary/15 text-secondary border border-secondary/30">
              3.4 Room Inventory
            </span>
            <h1 className="text-[26px] font-bold text-on-surface tracking-tight">
              Room & Property Inventory Management
            </h1>
          </div>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Manage residential flats, commercial shops, smart meter baselines, and tenant unit allocations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="#unit-provision-engine"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-container hover:bg-indigo-600 text-white text-xs font-mono font-medium border border-primary/30 transition-all shadow-[0_0_16px_rgba(79,70,229,0.35)] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            + Add New Room / Property
          </a>
        </div>
      </div>

      {/* 4 METRIC KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-on-surface-variant">
            <span>Total Units In DB</span>
            <span className="material-symbols-outlined text-secondary text-[18px]">apartment</span>
          </div>
          <div className="mt-2 text-[28px] font-bold text-on-surface">{rooms.length} Units</div>
          <div className="flex items-center gap-2 mt-1 text-[11px] font-mono">
            <span className="text-tertiary flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary" /> {occupiedCount} Occupied
            </span>
            <span className="text-outline">/</span>
            <span className="text-secondary flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> {vacantCount} Vacant
            </span>
          </div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-on-surface-variant">
            <span>Monthly Rental Pipeline</span>
            <span className="material-symbols-outlined text-tertiary text-[18px]">currency_rupee</span>
          </div>
          <div className="mt-2 text-[28px] font-bold text-on-surface">
            ₹{totalMonthlyRent.toLocaleString("en-IN")}{" "}
            <span className="text-xs text-outline font-normal">/ mo</span>
          </div>
          <span className="text-[11px] text-tertiary font-mono mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
            Database Aggregate
          </span>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-on-surface-variant">
            <span>Sub-Meter Smart Nodes</span>
            <span className="material-symbols-outlined text-primary text-[18px]">offline_bolt</span>
          </div>
          <div className="mt-2 text-[28px] font-bold text-on-surface">{rooms.length} Active Nodes</div>
          <span className="text-[11px] text-secondary font-mono mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
            Zero-drift hardware sync
          </span>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-on-surface-variant">
            <span>Property Categorization</span>
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">storefront</span>
          </div>
          <div className="mt-2 text-[28px] font-bold text-on-surface">
            {rooms.filter((r) => !r.propertyType.toLowerCase().includes("shop")).length} Res /{" "}
            {rooms.filter((r) => r.propertyType.toLowerCase().includes("shop")).length} Comm
          </div>
          <span className="text-[11px] text-outline font-mono mt-1">Singh Enterprise Portfolio</span>
        </div>
      </div>

      {/* 3.4.1 ADD NEW ROOM / PROPERTY FORM CONSOLE */}
      <section
        id="unit-provision-engine"
        className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-6 shadow-xl relative overflow-hidden"
      >
        <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/10 border border-secondary/30 text-secondary">
              <span className="material-symbols-outlined text-[22px]">developer_board</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-on-surface tracking-tight">
                  3.4.1 Add New Room / Property
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-tertiary/15 text-tertiary border border-tertiary/30">
                  LIVE DATABASE BINDING
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                Tenant linking, property categorization, rent ledger initialization, and sub-meter baseline capture.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Columns: The Interactive Form (3.4.1.1 - 3.4.1.5) */}
          <form onSubmit={handleAddRoom} className="lg:col-span-7 flex flex-col gap-4 text-xs font-mono">
            {/* 3.4.1.1 Tenant Name / User Assignment */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-on-surface flex items-center gap-1.5" htmlFor="tenant-select">
                  <span className="text-secondary font-bold">3.4.1.1</span> Tenant Name (Registered Users Dropdown)
                </label>
                <span className="text-[10px] text-secondary bg-secondary/10 px-2 py-0.5 rounded border border-secondary/20 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">database</span>
                  Auto-fetched from users table
                </span>
              </div>
              <select
                id="tenant-select"
                value={formTenantId}
                onChange={(e) => setFormTenantId(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface focus:border-secondary focus:outline-none cursor-pointer"
              >
                <option value="vacant">-- Unassigned / Vacant Room (Hold in Ready Inventory) --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} (UID: #{u.id}) • Aadhaar: {u.aadhaarNumber} • Status: {u.status}
                  </option>
                ))}
              </select>
            </div>

            {/* 3.4.1.2 Rent / Shop Dropdown & Unique Room ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-on-surface flex items-center gap-1.5">
                  <span className="text-secondary font-bold">3.4.1.2A</span> Rent &amp; Shop Type Dropdown
                </label>
                <select
                  value={formPropertyType}
                  onChange={(e) => setFormPropertyType(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface focus:border-secondary focus:outline-none cursor-pointer"
                >
                  <option value="Residential Flat (1BHK)">Rent: Residential Flat (1BHK Deluxe)</option>
                  <option value="Residential Flat (2BHK)">Rent: Residential Flat (2BHK Executive)</option>
                  <option value="1BHK Studio Unit">Rent: Residential Studio (Self-Contained)</option>
                  <option value="Commercial Retail Space">Shop: Commercial Retail Space (Ground Floor)</option>
                  <option value="Commercial Office Space">Shop: Commercial Office Space (Mezzanine)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-on-surface flex items-center gap-1.5">
                  <span className="text-secondary font-bold">3.4.1.2B</span> Unique Room ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ROOM-405 or SHOP-02"
                  value={formRoomId}
                  onChange={(e) => setFormRoomId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface font-bold focus:border-secondary focus:outline-none"
                />
              </div>
            </div>

            {/* 3.4.1.3 Rent Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-on-surface flex items-center gap-1.5">
                  <span className="text-secondary font-bold">3.4.1.3</span> Base Monthly Rent Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-on-surface font-semibold">₹</span>
                  <input
                    type="number"
                    required
                    value={formRentAmount}
                    onChange={(e) => setFormRentAmount(e.target.value)}
                    className="w-full pl-8 pr-14 py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface font-bold focus:border-secondary focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-[11px] text-outline">/ month</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-on-surface">Floor / Cluster</label>
                <input
                  type="text"
                  placeholder="e.g. 4th Floor / Ground Floor"
                  value={formFloorNumber}
                  onChange={(e) => setFormFloorNumber(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface focus:border-secondary focus:outline-none"
                />
              </div>
            </div>

            {/* 3.4.1.4 Light Unit Meter Number & Baseline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-on-surface flex items-center gap-1.5">
                  <span className="text-secondary font-bold">3.4.1.4A</span> Light Meter Number / Serial
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HM-112-DIGITAL"
                  value={formMeterNumber}
                  onChange={(e) => setFormMeterNumber(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface focus:border-secondary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-on-surface flex items-center gap-1.5">
                  <span className="text-secondary font-bold">3.4.1.4B</span> Previous / Baseline Unit (kWh)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formBaselineUnit}
                  onChange={(e) => setFormBaselineUnit(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface font-bold focus:border-secondary focus:outline-none"
                />
              </div>
            </div>

            {/* 3.4.1.5 Submit Action Button */}
            <div className="flex items-center justify-end pt-3 border-t border-outline-variant/30 mt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary-container hover:bg-indigo-600 text-white font-semibold text-xs border border-primary/30 shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">task_alt</span>
                {isSubmitting ? "Provisioning in Database..." : "3.4.1.5 [+ Provision & Save Property Unit]"}
              </button>
            </div>
          </form>

          {/* Right 5 Columns: Live Digital Dossier Preview */}
          <div className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 flex flex-col justify-between shadow-inner font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
                <span className="font-semibold text-on-surface">Unit Digital Dossier Preview</span>
              </div>
              <span className="text-[10px] bg-secondary/15 text-secondary px-2 py-0.5 rounded border border-secondary/30">
                LIVE PREVIEW
              </span>
            </div>

            <div className="my-4 rounded-lg bg-surface-container-low border border-outline-variant/30 p-4 flex flex-col items-center justify-center min-h-[140px]">
              <div className="w-full border-2 border-dashed border-secondary/40 rounded-lg p-3 bg-surface-container-lowest">
                <div className="flex justify-between items-center mb-2 pb-1 border-b border-outline-variant/20">
                  <span className="text-secondary font-bold">{formRoomId || "ROOM-???"}</span>
                  <span className="text-tertiary">{formPropertyType}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-outline">
                  <div>Base Rent: <span className="text-white font-bold">₹{formRentAmount || "0"}/mo</span></div>
                  <div>Meter: <span className="text-secondary font-bold">{formMeterNumber || "PENDING"}</span></div>
                  <div>Baseline kWh: <span className="text-tertiary font-bold">{formBaselineUnit || "0.0"}</span></div>
                  <div>Floor: <span className="text-white">{formFloorNumber || "N/A"}</span></div>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-outline-variant/20">
              <div className="flex justify-between">
                <span className="text-outline">Assigned Occupant:</span>
                <span className="text-on-surface font-semibold">
                  {formTenantId !== "vacant"
                    ? users.find((u) => String(u.id) === formTenantId)?.fullName || "Assigned"
                    : "Vacant (Ready for Lease)"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Status Mode:</span>
                <span className={formTenantId !== "vacant" ? "text-tertiary font-bold" : "text-secondary font-bold"}>
                  {formTenantId !== "vacant" ? "OCCUPIED" : "VACANT"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3.4.2 INVENTORY TABLE WITH UPDATE / DELETE / EDIT / PREVIEW */}
      <section className="bg-surface-container-low border border-outline-variant/30 rounded-xl flex flex-col shadow-sm overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-outline-variant/30 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {["ALL", "RESIDENTIAL", "COMMERCIAL", "VACANT"].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilterType(f as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                  filterType === f
                    ? "bg-primary-container/25 text-secondary border border-secondary/30 font-semibold"
                    : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
                }`}
              >
                {f} (
                {f === "ALL"
                  ? rooms.length
                  : f === "RESIDENTIAL"
                  ? rooms.filter((r) => !r.propertyType.toLowerCase().includes("shop")).length
                  : f === "COMMERCIAL"
                  ? rooms.filter((r) => r.propertyType.toLowerCase().includes("shop")).length
                  : vacantCount}
                )
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-outline text-[16px]">
              search
            </span>
            <input
              type="text"
              placeholder="Filter Room ID, Tenant, Meter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs font-body bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary transition-all"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest border-b border-outline-variant/30 text-[11px] font-mono text-outline uppercase tracking-wider">
                <th className="py-3 px-4">Room / Shop ID</th>
                <th className="py-3 px-4">Type &amp; Floor</th>
                <th className="py-3 px-4">Assigned Occupant</th>
                <th className="py-3 px-4">Monthly Rent</th>
                <th className="py-3 px-4">Electricity Sub-Meter</th>
                <th className="py-3 px-4">Occupancy Status</th>
                <th className="py-3 px-4 text-right">3.4.2 Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-xs font-mono">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-outline">
                    <span className="material-symbols-outlined animate-spin text-[20px] text-secondary inline-block align-middle mr-2">
                      autorenew
                    </span>
                    Loading room inventory from database...
                  </td>
                </tr>
              ) : filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-outline">
                    No room properties match your filter.
                  </td>
                </tr>
              ) : (
                filteredRooms.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-container/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-on-surface px-2 py-0.5 rounded bg-surface-container border border-outline-variant/40">
                          {r.roomId}
                        </span>
                        <span className="text-[10px] text-outline">{r.floorNumber || "GF"}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-on-surface font-medium font-body">{r.propertyType}</div>
                      <div className="text-[10px] text-outline">Singh Rent House Cluster</div>
                    </td>

                    <td className="py-3 px-4">
                      {r.assignedUserName ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary-container/30 border border-primary/40 flex items-center justify-center text-[10px] font-bold text-primary">
                            {r.assignedUserName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-on-surface font-body">{r.assignedUserName}</div>
                            <div className="text-[10px] text-outline">{r.assignedUserMobile || "Verified"}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-outline italic text-[11px]">Unassigned / Vacant</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-on-surface">
                        ₹{r.rentAmount.toLocaleString("en-IN")}{" "}
                        <span className="text-outline text-[10px] font-normal">/mo</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-secondary font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">offline_bolt</span>
                        {r.meterNumber}
                      </div>
                      <div className="text-[10px] text-outline">Baseline: {r.baselineUnit} kWh</div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                          r.status === "OCCUPIED"
                            ? "bg-tertiary/15 text-tertiary border border-tertiary/30"
                            : r.status === "MAINTENANCE"
                            ? "bg-error/15 text-error border border-error/30"
                            : "bg-secondary/15 text-secondary border border-secondary/30"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            r.status === "OCCUPIED"
                              ? "bg-tertiary"
                              : r.status === "MAINTENANCE"
                              ? "bg-error"
                              : "bg-secondary animate-pulse"
                          }`}
                        />
                        {r.status}
                      </span>
                    </td>

                    {/* 3.4.2 Actions: Preview, Edit, Delete */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewRoom(r)}
                          className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-secondary transition-colors cursor-pointer"
                          title="Preview Room Details"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(r)}
                          className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                          title="Edit Property Details"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteRoomId(r.id)}
                          className="p-1 rounded hover:bg-error/20 text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                          title="Delete Property Unit"
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

      {/* PREVIEW ROOM MODAL (Section 3.4.2) */}
      <AnimatePresence>
        {previewRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-low border border-outline-variant/40 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 font-mono text-xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded bg-secondary/15 text-secondary border border-secondary/30 font-bold text-sm">
                    {previewRoom.roomId}
                  </span>
                  <h3 className="font-bold text-on-surface text-base">{previewRoom.propertyType}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewRoom(null)}
                  className="p-1.5 rounded-lg hover:bg-surface-container text-outline hover:text-on-surface cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-outline-variant/20">
                  <span className="text-outline">Assigned Tenant:</span>
                  <span className="text-on-surface font-semibold">{previewRoom.assignedUserName || "Vacant"}</span>
                </div>
                {previewRoom.assignedUserMobile && (
                  <div className="flex justify-between py-1 border-b border-outline-variant/20">
                    <span className="text-outline">Tenant Phone:</span>
                    <span className="text-on-surface font-semibold">+91 {previewRoom.assignedUserMobile}</span>
                  </div>
                )}
                {previewRoom.assignedUserAadhaar && (
                  <div className="flex justify-between py-1 border-b border-outline-variant/20">
                    <span className="text-outline">Tenant Aadhaar:</span>
                    <span className="text-secondary font-bold">{previewRoom.assignedUserAadhaar}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-outline-variant/20">
                  <span className="text-outline">Monthly Rent Amount:</span>
                  <span className="text-tertiary font-bold text-sm">
                    ₹{previewRoom.rentAmount.toLocaleString("en-IN")} / month
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-outline-variant/20">
                  <span className="text-outline">Smart Sub-Meter Serial:</span>
                  <span className="text-secondary font-bold">{previewRoom.meterNumber}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-outline-variant/20">
                  <span className="text-outline">Baseline Reading (kWh):</span>
                  <span className="text-on-surface font-semibold">{previewRoom.baselineUnit} kWh</span>
                </div>
                <div className="flex justify-between py-1 border-b border-outline-variant/20">
                  <span className="text-outline">Floor / Cluster:</span>
                  <span className="text-on-surface">{previewRoom.floorNumber || "N/A"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-outline">Occupancy Status:</span>
                  <span className={previewRoom.status === "OCCUPIED" ? "text-tertiary font-bold" : "text-secondary font-bold"}>
                    {previewRoom.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewRoom(null);
                    openEditModal(previewRoom);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface border border-outline-variant/40 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  Edit Unit
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewRoom(null)}
                  className="px-4 py-1.5 rounded-lg bg-primary-container text-white cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT ROOM MODAL (Section 3.4.2) */}
      <AnimatePresence>
        {editRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-low border border-outline-variant/40 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 font-mono text-xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[22px]">edit_note</span>
                  <h3 className="font-bold text-on-surface text-base">Edit Unit: {editRoom.roomId}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditRoom(null)}
                  className="p-1.5 rounded-lg hover:bg-surface-container text-outline hover:text-on-surface cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <form onSubmit={handleUpdateRoom} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-on-surface-variant mb-1">Room / Property ID</label>
                    <input
                      type="text"
                      required
                      value={editForm.roomId}
                      onChange={(e) => setEditForm({ ...editForm, roomId: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface focus:border-secondary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-on-surface-variant mb-1">Rent Amount (₹/mo)</label>
                    <input
                      type="number"
                      required
                      value={editForm.rentAmount}
                      onChange={(e) => setEditForm({ ...editForm, rentAmount: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface focus:border-secondary focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-on-surface-variant mb-1">Property Type</label>
                  <input
                    type="text"
                    required
                    value={editForm.propertyType}
                    onChange={(e) => setEditForm({ ...editForm, propertyType: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface focus:border-secondary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-on-surface-variant mb-1">Assigned Tenant</label>
                  <select
                    value={editForm.assignedUserId}
                    onChange={(e) => setEditForm({ ...editForm, assignedUserId: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface focus:border-secondary focus:outline-none cursor-pointer"
                  >
                    <option value="vacant">-- Vacant / Unassigned --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} (#{u.id}) • Aadhaar: {u.aadhaarNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-on-surface-variant mb-1">Smart Meter ID</label>
                    <input
                      type="text"
                      required
                      value={editForm.meterNumber}
                      onChange={(e) => setEditForm({ ...editForm, meterNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface focus:border-secondary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-on-surface-variant mb-1">Baseline Reading (kWh)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={editForm.baselineUnit}
                      onChange={(e) => setEditForm({ ...editForm, baselineUnit: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface focus:border-secondary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-on-surface-variant mb-1">Floor Number</label>
                    <input
                      type="text"
                      value={editForm.floorNumber}
                      onChange={(e) => setEditForm({ ...editForm, floorNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface focus:border-secondary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-on-surface-variant mb-1">Occupancy Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface focus:border-secondary focus:outline-none cursor-pointer"
                    >
                      <option value="OCCUPIED">OCCUPIED</option>
                      <option value="VACANT">VACANT</option>
                      <option value="MAINTENANCE">MAINTENANCE</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-outline-variant/30">
                  <button
                    type="button"
                    onClick={() => setEditRoom(null)}
                    className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary-container hover:bg-indigo-600 text-white font-semibold cursor-pointer shadow-[0_0_14px_rgba(79,70,229,0.4)]"
                  >
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    {isSubmitting ? "Updating..." : "Save Updates"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL (Section 3.4.2) */}
      <AnimatePresence>
        {deleteRoomId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-low border border-error/40 rounded-xl max-w-sm w-full p-5 shadow-2xl space-y-3 font-mono text-xs"
            >
              <div className="flex items-center gap-2 text-error font-bold text-sm">
                <span className="material-symbols-outlined text-[20px]">warning</span>
                Delete Property Unit
              </div>
              <p className="text-on-surface-variant">
                Are you sure you want to permanently delete this unit from inventory? Associated bill and payment histories will be unlinked.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setDeleteRoomId(null)}
                  className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteRoom(deleteRoomId)}
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
