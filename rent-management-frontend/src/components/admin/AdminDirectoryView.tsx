"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAdminSession } from "@/lib/auth";

export interface AdminItem {
  id: number;
  fullName: string;
  mobileNumber: string;
  gmail: string;
  profileImagePath: string | null;
  role: string;
  active: boolean;
  createdAt: string;
}

interface AdminDirectoryViewProps {
  showToast: (msg: string) => void;
}

export default function AdminDirectoryView({ showToast }: AdminDirectoryViewProps) {
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  // Modals
  const [previewAdmin, setPreviewAdmin] = useState<AdminItem | null>(null);
  const [editAdmin, setEditAdmin] = useState<AdminItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Form State
  const [addForm, setAddForm] = useState({
    fullName: "",
    gmail: "",
    mobileNumber: "",
    password: "",
    role: "ROLE_ADMIN",
    active: true,
  });

  // Edit Form State
  const [editForm, setEditForm] = useState({
    fullName: "",
    gmail: "",
    mobileNumber: "",
    role: "ROLE_ADMIN",
    active: true,
    newPassword: "",
  });

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const session = getAdminSession();
      const res = await fetch("http://localhost:8080/api/admin/directory", {
        headers: session?.token ? { Authorization: `Bearer ${session.token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.data) {
          setAdmins(json.data);
        }
      } else {
        showToast("Failed to fetch administrator directory from database.");
      }
    } catch (err) {
      console.error("Error fetching admins:", err);
      showToast("Backend connection error while loading administrators.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Filter & Search Logic
  const filteredAdmins = admins.filter((a) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      a.fullName.toLowerCase().includes(q) ||
      a.gmail.toLowerCase().includes(q) ||
      a.mobileNumber.toLowerCase().includes(q) ||
      a.role.toLowerCase().includes(q);

    const matchesRole =
      roleFilter === "ALL" ||
      (roleFilter === "ROLE_SUPER_ADMIN" && a.role === "ROLE_SUPER_ADMIN") ||
      (roleFilter === "ROLE_ADMIN" && a.role === "ROLE_ADMIN") ||
      (roleFilter === "ROLE_MANAGER" && (a.role === "ROLE_MANAGER" || a.role === "ROLE_PROPERTY_MANAGER"));

    return matchesSearch && matchesRole;
  });

  // Check if default seeded primary admin is present
  const defaultAdmin = admins.find(
    (a) => a.gmail.toLowerCase() === "admin@gmail.com"
  );

  // Handle Add Admin
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.fullName.trim() || !addForm.gmail.trim() || !addForm.mobileNumber.trim() || !addForm.password) {
      showToast("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const session = getAdminSession();
      const res = await fetch("http://localhost:8080/api/admin/directory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
        },
        body: JSON.stringify(addForm),
      });

      const json = await res.json();
      if (res.ok) {
        showToast(`Administrator "${addForm.fullName}" provisioned successfully!`);
        setIsAddModalOpen(false);
        setAddForm({
          fullName: "",
          gmail: "",
          mobileNumber: "",
          password: "",
          role: "ROLE_ADMIN",
          active: true,
        });
        fetchAdmins();
      } else {
        showToast(json?.message || "Failed to provision administrator.");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error while creating administrator.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (a: AdminItem) => {
    setEditAdmin(a);
    setEditForm({
      fullName: a.fullName,
      gmail: a.gmail,
      mobileNumber: a.mobileNumber,
      role: a.role,
      active: a.active,
      newPassword: "",
    });
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAdmin) return;

    if (!editForm.fullName.trim() || !editForm.gmail.trim() || !editForm.mobileNumber.trim()) {
      showToast("Name, email, and mobile are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const session = getAdminSession();
      const payload: any = {
        fullName: editForm.fullName,
        gmail: editForm.gmail,
        mobileNumber: editForm.mobileNumber,
        role: editForm.role,
        active: editForm.active,
      };
      if (editForm.newPassword.trim()) {
        payload.newPassword = editForm.newPassword.trim();
      }

      const res = await fetch(`http://localhost:8080/api/admin/directory/${editAdmin.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok) {
        showToast(`Administrator "${editForm.fullName}" updated successfully!`);
        setEditAdmin(null);
        fetchAdmins();
      } else {
        showToast(json?.message || "Failed to update administrator.");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error while updating administrator.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setIsSubmitting(true);
    try {
      const session = getAdminSession();
      const res = await fetch(`http://localhost:8080/api/admin/directory/${deleteTarget.id}`, {
        method: "DELETE",
        headers: session?.token ? { Authorization: `Bearer ${session.token}` } : {},
      });

      if (res.ok) {
        showToast(`Administrator "${deleteTarget.fullName}" deleted from database.`);
        setDeleteTarget(null);
        fetchAdmins();
      } else {
        const json = await res.json();
        showToast(json?.message || "Failed to delete administrator.");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error while deleting administrator.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Purge Default Primary Admin
  const handlePurgeDefault = async () => {
    if (!defaultAdmin) return;
    setDeleteTarget(defaultAdmin);
  };

  const getInitials = (name: string) => {
    if (!name) return "AD";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getRoleBadge = (role: string) => {
    if (role === "ROLE_SUPER_ADMIN") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <span className="material-symbols-outlined text-[13px]">military_tech</span>
          Super Admin
        </span>
      );
    } else if (role === "ROLE_MANAGER" || role === "ROLE_PROPERTY_MANAGER") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-purple-500/10 text-purple-400 border border-purple-500/30">
          <span className="material-symbols-outlined text-[13px]">manage_accounts</span>
          Manager
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-secondary/10 text-secondary border border-secondary/30">
        <span className="material-symbols-outlined text-[13px]">shield_person</span>
        Admin
      </span>
    );
  };

  const totalAdmins = admins.length;
  const activeAdmins = admins.filter((a) => a.active).length;
  const superAdmins = admins.filter((a) => a.role === "ROLE_SUPER_ADMIN").length;

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Provision Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-80 h-80 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/30 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[24px]">admin_panel_settings</span>
            </div>
            <div>
              <h1 className="text-[20px] font-semibold tracking-tight text-on-surface flex items-center gap-2">
                Administrator Directory & Authority Matrix
              </h1>
              <p className="text-[13px] text-on-surface-variant">
                100% database-backed administrative accounts, zero-trust credentials, and privilege control.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={fetchAdmins}
            title="Refresh database records"
            className="p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className={`material-symbols-outlined text-[18px] ${isLoading ? "animate-spin" : ""}`}>
              sync
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-on-secondary hover:brightness-110 font-medium text-[13px] transition-all shadow-[0_0_20px_rgba(78,222,163,0.3)] hover:shadow-[0_0_28px_rgba(78,222,163,0.45)] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>+ Add Administrator</span>
          </button>
        </div>
      </div>

      {/* 2. Default Primary Admin Notice Banner (If present) */}
      {defaultAdmin && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">warning</span>
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-amber-300">
                Default Primary Admin Detected: {defaultAdmin.fullName} ({defaultAdmin.gmail})
              </h2>
              <p className="text-[12px] text-amber-200/80 mt-0.5">
                Default primary account is currently in the database. Per your request, you can purge this default account permanently.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handlePurgeDefault}
            className="px-3.5 py-2 rounded-xl bg-error/20 hover:bg-error/30 text-error border border-error/40 font-mono text-[12px] flex items-center gap-2 transition-all shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">delete_forever</span>
            <span>Purge Default Admin</span>
          </button>
        </motion.div>
      )}

      {/* 3. Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-4.5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">group</span>
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
              Total Administrators
            </div>
            <div className="text-[22px] font-bold text-on-surface mt-0.5">
              {isLoading ? "..." : totalAdmins}
            </div>
          </div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-4.5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">check_circle</span>
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
              Active Accounts
            </div>
            <div className="text-[22px] font-bold text-secondary mt-0.5">
              {isLoading ? "..." : activeAdmins}
            </div>
          </div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-4.5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">military_tech</span>
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
              Super Admins
            </div>
            <div className="text-[22px] font-bold text-amber-400 mt-0.5">
              {isLoading ? "..." : superAdmins}
            </div>
          </div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-4.5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-tertiary-container/30 border border-tertiary/20 text-tertiary flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">security</span>
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
              Zero-Trust Level
            </div>
            <div className="text-[15px] font-semibold text-tertiary mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
              PostgreSQL Verified
            </div>
          </div>
        </div>
      </div>

      {/* 4. Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-container-low border border-outline-variant/30 rounded-xl p-3">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            placeholder="Search by name, gmail, mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-outline-variant/40 rounded-lg pl-9 pr-3 py-2 text-[13px] text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-secondary transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface text-[14px]"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-[11px] font-mono uppercase text-on-surface-variant shrink-0">
            Role Filter:
          </span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-surface border border-outline-variant/40 rounded-lg px-3 py-2 text-[13px] text-on-surface focus:outline-none focus:border-secondary cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            <option value="ROLE_SUPER_ADMIN">Super Admins</option>
            <option value="ROLE_ADMIN">Regular Admins</option>
            <option value="ROLE_MANAGER">Managers</option>
          </select>
        </div>
      </div>

      {/* 5. Administrators Dynamic Table */}
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-on-surface-variant font-mono text-[13px]">
            <div className="w-8 h-8 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
            <span>Fetching Administrator Matrix from Database...</span>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="py-16 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-[44px] text-outline-variant mb-2">
              shield
            </span>
            <p className="text-[14px] font-medium text-on-surface">No administrators found</p>
            <p className="text-[12px] text-on-surface-variant mt-1">
              {searchQuery ? "Try refining your search keywords or role filter." : "Click '+ Add Administrator' to register your first custom admin."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface-container/50 text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
                  <th className="py-3.5 px-4 font-medium">Administrator</th>
                  <th className="py-3.5 px-4 font-medium">Contact Details</th>
                  <th className="py-3.5 px-4 font-medium">Role & Clearance</th>
                  <th className="py-3.5 px-4 font-medium">Status</th>
                  <th className="py-3.5 px-4 font-medium">Joined On</th>
                  <th className="py-3.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-[13px]">
                {filteredAdmins.map((admin) => (
                  <tr
                    key={admin.id}
                    className="hover:bg-surface-container/40 transition-colors group"
                  >
                    {/* Administrator column */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-9 h-9 rounded-xl bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary font-mono font-bold text-[13px] shrink-0">
                          {getInitials(admin.fullName)}
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface-container-low ${
                              admin.active ? "bg-secondary" : "bg-outline"
                            }`}
                          />
                        </div>
                        <div>
                          <div className="font-medium text-on-surface flex items-center gap-2">
                            {admin.fullName}
                            {admin.gmail.toLowerCase() === "admin@gmail.com" && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                DEFAULT SEED
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-on-surface-variant">
                            ADMIN-ID: #{admin.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact Details */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5 font-mono text-[12px]">
                        <div className="text-on-surface flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[13px] text-on-surface-variant">
                            mail
                          </span>
                          {admin.gmail}
                        </div>
                        <div className="text-on-surface-variant flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[13px] text-on-surface-variant">
                            phone
                          </span>
                          {admin.mobileNumber}
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">{getRoleBadge(admin.role)}</td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {admin.active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-outline-variant/30 text-outline border border-outline/30">
                          SUSPENDED
                        </span>
                      )}
                    </td>

                    {/* Joined On */}
                    <td className="py-3.5 px-4 font-mono text-[12px] text-on-surface-variant">
                      {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }) : "N/A"}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewAdmin(admin)}
                          title="Preview Admin Dossier"
                          className="p-1.5 rounded-lg text-on-surface-variant hover:text-secondary hover:bg-secondary/10 border border-transparent hover:border-secondary/30 transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(admin)}
                          title="Edit Administrator"
                          className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/30 transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(admin)}
                          title="Delete Administrator from Database"
                          className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 border border-transparent hover:border-error/30 transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL 1: ADD / PROVISION NEW ADMINISTRATOR
      ======================================================== */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg bg-surface-container border border-outline-variant/40 rounded-2xl shadow-2xl p-6 relative overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-secondary/15 text-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">person_add</span>
                  </div>
                  <h2 className="text-[16px] font-semibold text-on-surface">Provision New Administrator</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-[12px] font-mono text-on-surface-variant mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Sharma"
                    value={addForm.fullName}
                    onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
                    className="w-full bg-surface border border-outline-variant/40 rounded-xl px-3.5 py-2.5 text-[13px] text-on-surface focus:outline-none focus:border-secondary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-mono text-on-surface-variant mb-1">
                      Gmail / Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="vikram@rent.com"
                      value={addForm.gmail}
                      onChange={(e) => setAddForm({ ...addForm, gmail: e.target.value })}
                      className="w-full bg-surface border border-outline-variant/40 rounded-xl px-3.5 py-2.5 text-[13px] text-on-surface focus:outline-none focus:border-secondary"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-mono text-on-surface-variant mb-1">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="9876543210"
                      value={addForm.mobileNumber}
                      onChange={(e) => setAddForm({ ...addForm, mobileNumber: e.target.value })}
                      className="w-full bg-surface border border-outline-variant/40 rounded-xl px-3.5 py-2.5 text-[13px] text-on-surface focus:outline-none focus:border-secondary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-mono text-on-surface-variant mb-1">
                      Access Role *
                    </label>
                    <select
                      value={addForm.role}
                      onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                      className="w-full bg-surface border border-outline-variant/40 rounded-xl px-3.5 py-2.5 text-[13px] text-on-surface focus:outline-none focus:border-secondary cursor-pointer"
                    >
                      <option value="ROLE_ADMIN">Regular Admin (Standard)</option>
                      <option value="ROLE_SUPER_ADMIN">Super Administrator (Full)</option>
                      <option value="ROLE_MANAGER">Property Manager</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-mono text-on-surface-variant mb-1">
                      Account Status
                    </label>
                    <select
                      value={addForm.active ? "true" : "false"}
                      onChange={(e) => setAddForm({ ...addForm, active: e.target.value === "true" })}
                      className="w-full bg-surface border border-outline-variant/40 rounded-xl px-3.5 py-2.5 text-[13px] text-on-surface focus:outline-none focus:border-secondary cursor-pointer"
                    >
                      <option value="true">Active / Operational</option>
                      <option value="false">Suspended / Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-mono text-on-surface-variant mb-1">
                    Initial Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    className="w-full bg-surface border border-outline-variant/40 rounded-xl px-3.5 py-2.5 text-[13px] text-on-surface focus:outline-none focus:border-secondary"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/30 mt-5">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-outline-variant/40 text-on-surface-variant hover:text-on-surface text-[13px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-secondary text-on-secondary hover:brightness-110 font-medium text-[13px] flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-on-secondary border-t-transparent animate-spin" />
                        <span>Provisioning...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">verified_user</span>
                        <span>Confirm & Provision</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          MODAL 2: EDIT ADMINISTRATOR
      ======================================================== */}
      <AnimatePresence>
        {editAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg bg-surface-container border border-outline-variant/40 rounded-2xl shadow-2xl p-6 relative overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </div>
                  <h2 className="text-[16px] font-semibold text-on-surface">
                    Edit Administrator (ID #{editAdmin.id})
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setEditAdmin(null)}
                  className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-[12px] font-mono text-on-surface-variant mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full bg-surface border border-outline-variant/40 rounded-xl px-3.5 py-2.5 text-[13px] text-on-surface focus:outline-none focus:border-secondary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-mono text-on-surface-variant mb-1">
                      Gmail / Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={editForm.gmail}
                      onChange={(e) => setEditForm({ ...editForm, gmail: e.target.value })}
                      className="w-full bg-surface border border-outline-variant/40 rounded-xl px-3.5 py-2.5 text-[13px] text-on-surface focus:outline-none focus:border-secondary"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-mono text-on-surface-variant mb-1">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={editForm.mobileNumber}
                      onChange={(e) => setEditForm({ ...editForm, mobileNumber: e.target.value })}
                      className="w-full bg-surface border border-outline-variant/40 rounded-xl px-3.5 py-2.5 text-[13px] text-on-surface focus:outline-none focus:border-secondary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-mono text-on-surface-variant mb-1">
                      Role Privilege
                    </label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      className="w-full bg-surface border border-outline-variant/40 rounded-xl px-3.5 py-2.5 text-[13px] text-on-surface focus:outline-none focus:border-secondary cursor-pointer"
                    >
                      <option value="ROLE_ADMIN">Regular Admin</option>
                      <option value="ROLE_SUPER_ADMIN">Super Administrator</option>
                      <option value="ROLE_MANAGER">Property Manager</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-mono text-on-surface-variant mb-1">
                      Status
                    </label>
                    <select
                      value={editForm.active ? "true" : "false"}
                      onChange={(e) => setEditForm({ ...editForm, active: e.target.value === "true" })}
                      className="w-full bg-surface border border-outline-variant/40 rounded-xl px-3.5 py-2.5 text-[13px] text-on-surface focus:outline-none focus:border-secondary cursor-pointer"
                    >
                      <option value="true">Active / Operational</option>
                      <option value="false">Suspended / Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-mono text-on-surface-variant mb-1">
                    New Password (Optional: Leave blank to keep unchanged)
                  </label>
                  <input
                    type="password"
                    placeholder="Enter new password if updating"
                    value={editForm.newPassword}
                    onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                    className="w-full bg-surface border border-outline-variant/40 rounded-xl px-3.5 py-2.5 text-[13px] text-on-surface focus:outline-none focus:border-secondary"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/30 mt-5">
                  <button
                    type="button"
                    onClick={() => setEditAdmin(null)}
                    className="px-4 py-2.5 rounded-xl border border-outline-variant/40 text-on-surface-variant hover:text-on-surface text-[13px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-primary text-on-primary hover:brightness-110 font-medium text-[13px] flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-on-primary border-t-transparent animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">save</span>
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          MODAL 3: PREVIEW ADMIN DOSSIER
      ======================================================== */}
      <AnimatePresence>
        {previewAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg bg-surface-container border border-outline-variant/40 rounded-2xl shadow-2xl p-6 relative overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-secondary/15 text-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">badge</span>
                  </div>
                  <h2 className="text-[16px] font-semibold text-on-surface">
                    Administrator Security Dossier
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewAdmin(null)}
                  className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <div className="mt-5 space-y-4">
                {/* ID Header Card */}
                <div className="p-4 rounded-xl bg-surface border border-outline-variant/30 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary font-mono font-bold text-[20px]">
                    {getInitials(previewAdmin.fullName)}
                  </div>
                  <div>
                    <h3 className="text-[16px] font-semibold text-on-surface">
                      {previewAdmin.fullName}
                    </h3>
                    <div className="text-[12px] font-mono text-on-surface-variant mt-0.5">
                      DB-ID: #{previewAdmin.id} • Registered: {previewAdmin.createdAt ? new Date(previewAdmin.createdAt).toLocaleDateString() : "N/A"}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      {getRoleBadge(previewAdmin.role)}
                      {previewAdmin.active ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-outline-variant/40 text-outline">
                          SUSPENDED
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-[12px] font-mono">
                  <div className="p-3 rounded-xl bg-surface border border-outline-variant/20">
                    <div className="text-on-surface-variant uppercase text-[10px]">Gmail / Email</div>
                    <div className="text-on-surface mt-1 font-medium break-all">{previewAdmin.gmail}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-surface border border-outline-variant/20">
                    <div className="text-on-surface-variant uppercase text-[10px]">Mobile Contact</div>
                    <div className="text-on-surface mt-1 font-medium">{previewAdmin.mobileNumber}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-surface border border-outline-variant/20">
                    <div className="text-on-surface-variant uppercase text-[10px]">System Authority</div>
                    <div className="text-on-surface mt-1 font-medium">
                      {previewAdmin.role === "ROLE_SUPER_ADMIN" ? "Level 4 (Unrestricted)" : "Level 3 (Standard Admin)"}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-surface border border-outline-variant/20">
                    <div className="text-on-surface-variant uppercase text-[10px]">Security Protocol</div>
                    <div className="text-secondary mt-1 font-medium">BCrypt Hashed & JWT</div>
                  </div>
                </div>

                {previewAdmin.gmail.toLowerCase() === "admin@gmail.com" && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[12px]">
                    <div className="font-semibold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">info</span>
                      Default Primary Admin
                    </div>
                    <p className="text-[11px] text-amber-200/80 mt-1">
                      This is the initial seeded administrator account. You can delete or edit it freely.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/30 mt-5">
                <button
                  type="button"
                  onClick={() => {
                    const target = previewAdmin;
                    setPreviewAdmin(null);
                    openEditModal(target);
                  }}
                  className="px-4 py-2 rounded-xl bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 text-[13px] flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  <span>Edit Profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewAdmin(null)}
                  className="px-4 py-2 rounded-xl border border-outline-variant/40 text-on-surface text-[13px]"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          MODAL 4: DELETE ADMINISTRATOR CONFIRMATION
      ======================================================== */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-surface-container border border-error/40 rounded-2xl shadow-2xl p-6 relative overflow-hidden"
            >
              <div className="flex items-center gap-3 text-error mb-4">
                <div className="w-10 h-10 rounded-xl bg-error/15 border border-error/30 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">delete_forever</span>
                </div>
                <div>
                  <h2 className="text-[16px] font-semibold text-on-surface">Delete Administrator?</h2>
                  <p className="text-[12px] text-error font-mono">Irreversible Database Action</p>
                </div>
              </div>

              <p className="text-[13px] text-on-surface-variant leading-relaxed">
                Are you sure you want to permanently delete administrator{" "}
                <span className="font-semibold text-on-surface">"{deleteTarget.fullName}"</span> (
                <span className="font-mono text-on-surface">{deleteTarget.gmail}</span>)?
              </p>

              {deleteTarget.gmail.toLowerCase() === "admin@gmail.com" && (
                <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[12px]">
                  <strong>Note:</strong> This is the default primary administrator. Once deleted, it will not be recreated automatically.
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/30 mt-5">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-outline-variant/40 text-on-surface-variant hover:text-on-surface text-[13px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-error text-on-error hover:brightness-110 font-medium text-[13px] flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(255,84,73,0.3)]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-on-error border-t-transparent animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                      <span>Permanently Delete</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
