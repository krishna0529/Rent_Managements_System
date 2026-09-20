"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAdminSession, notifyUserDeleted } from "@/lib/auth";

export interface UserSummary {
  id: number;
  fullName: string;
  username: string;
  email: string;
  mobileNumber: string;
  fullAddress: string;
  aadhaarNumber: string;
  aadhaarDocumentPath: string | null;
  profileImagePath: string | null;
  dateOfJoining: string;
  nextDueDate?: string | null;
  role: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  active: boolean;
  assignedRoomCode?: string | null;
  assignedRoomId?: number | null;
  createdAt: string;
  updatedAt: string;
}

interface UserDirectoryViewProps {
  showToast: (msg: string) => void;
}

export default function UserDirectoryView({ showToast }: UserDirectoryViewProps) {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modals state
  const [previewUser, setPreviewUser] = useState<UserSummary | null>(null);
  const [editUser, setEditUser] = useState<UserSummary | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    mobileNumber: "",
    fullAddress: "",
    aadhaarNumber: "",
    status: "APPROVED",
    active: true,
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/admin/users");
      if (res.ok) {
        const json = await res.json();
        if (json?.data) {
          setUsers(json.data);
        }
      }
    } catch (err) {
      console.error("Failed to load users directory:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openEditModal = (u: UserSummary) => {
    setEditUser(u);
    setEditForm({
      fullName: u.fullName,
      email: u.email,
      mobileNumber: u.mobileNumber,
      fullAddress: u.fullAddress,
      aadhaarNumber: u.aadhaarNumber,
      status: u.status,
      active: u.active,
    });
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setIsSaving(true);
    const session = getAdminSession();
    try {
      const res = await fetch(`http://localhost:8080/api/admin/users/${editUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: session ? `Bearer ${session.token}` : "",
        },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        if (editForm.status === "REJECTED") {
          notifyUserDeleted(editUser.id, editUser.email);
          showToast(`User ${editForm.fullName} rejected & removed from database. Linked room marked VACANT.`);
        } else {
          showToast(`User ${editForm.fullName} updated successfully in database!`);
        }
        setEditUser(null);
        fetchUsers();
      } else {
        const errJson = await res.json();
        showToast(errJson?.message || "Failed to update user");
      }
    } catch {
      showToast("Network error updating user");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    const session = getAdminSession();
    try {
      const res = await fetch(`http://localhost:8080/api/admin/users/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: session ? `Bearer ${session.token}` : "",
        },
      });
      if (res.ok) {
        notifyUserDeleted(id);
        showToast("User account permanently removed from database.");
        setDeleteUserId(null);
        setPreviewUser(null);
        fetchUsers();
      } else {
        showToast("Failed to delete user.");
      }
    } catch {
      showToast("Network error deleting user.");
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.mobileNumber.includes(searchQuery) ||
      u.aadhaarNumber.includes(searchQuery) ||
      (u.assignedRoomCode && u.assignedRoomCode.toLowerCase().includes(searchQuery.toLowerCase()));

    if (statusFilter === "ACTIVE") return matchesSearch && u.active;
    if (statusFilter === "INACTIVE") return matchesSearch && !u.active;
    if (statusFilter === "PENDING") return matchesSearch && u.status === "PENDING";
    if (statusFilter === "APPROVED") return matchesSearch && u.status === "APPROVED";
    return matchesSearch;
  });

  const activeCount = users.filter((u) => u.active).length;
  const inactiveCount = users.length - activeCount;

  return (
    <div className="space-y-6">
      {/* 3.3.1 USER HEADER & KPI SUMMARY BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary-container/20 text-secondary border border-secondary/30">
              3.3 User Directory
            </span>
            <h1 className="text-[26px] font-bold text-on-surface tracking-tight">
              User & Tenant Directory Management
            </h1>
          </div>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Real-time PostgreSQL user directory with identity verification, property allocations, and full CRUD controls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchUsers}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface text-xs font-mono border border-outline-variant/40 transition-all cursor-pointer"
          >
            <span className={`material-symbols-outlined text-[16px] text-secondary ${isLoading ? "animate-spin" : ""}`}>
              sync
            </span>
            Refresh Users
          </button>
        </div>
      </div>

      {/* 3.3.1 METRIC COUNT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-on-surface-variant">
            <span>Total Registered</span>
            <span className="material-symbols-outlined text-secondary text-[18px]">group</span>
          </div>
          <div className="mt-2 text-[28px] font-bold text-on-surface">{users.length} Users</div>
          <span className="text-[11px] text-outline font-mono mt-1">Source: public.users</span>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-on-surface-variant">
            <span>Active Tenants</span>
            <span className="material-symbols-outlined text-tertiary text-[18px]">verified_user</span>
          </div>
          <div className="mt-2 text-[28px] font-bold text-tertiary">{activeCount} Active</div>
          <span className="text-[11px] text-tertiary font-mono mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" /> Keys Active
          </span>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-on-surface-variant">
            <span>Inactive / Pending</span>
            <span className="material-symbols-outlined text-amber-400 text-[18px]">hourglass_empty</span>
          </div>
          <div className="mt-2 text-[28px] font-bold text-amber-400">{inactiveCount} Inactive</div>
          <span className="text-[11px] text-amber-400 font-mono mt-1">Under verification / hold</span>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-on-surface-variant">
            <span>Rooms Allocated</span>
            <span className="material-symbols-outlined text-primary text-[18px]">apartment</span>
          </div>
          <div className="mt-2 text-[28px] font-bold text-primary">
            {users.filter((u) => u.assignedRoomCode).length} Assigned
          </div>
          <span className="text-[11px] text-outline font-mono mt-1">Linked in public.rooms</span>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {["ALL", "ACTIVE", "INACTIVE", "APPROVED", "PENDING"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                statusFilter === st
                  ? "bg-primary-container/25 text-secondary border border-secondary/40 font-semibold"
                  : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
              }`}
            >
              {st} ({st === "ALL" ? users.length : st === "ACTIVE" ? activeCount : st === "INACTIVE" ? inactiveCount : users.filter((u) => u.status === st).length})
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-3 top-2 text-outline text-[16px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search name, phone, Aadhaar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs font-body bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary transition-all"
          />
        </div>
      </div>

      {/* 3.3.2 USER TABLE WITH CRUD ACTIONS */}
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest border-b border-outline-variant/30 text-[11px] font-mono text-outline uppercase tracking-wider">
                <th className="py-3 px-4">User / Tenant</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Aadhaar Identification</th>
                <th className="py-3 px-4">Allocated Unit</th>
                <th className="py-3 px-4">Status & Access</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-outline font-mono">
                    <span className="material-symbols-outlined animate-spin text-[20px] text-secondary inline-block align-middle mr-2">
                      autorenew
                    </span>
                    Loading live user directory from PostgreSQL...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-outline font-mono">
                    No users matching the query found in database.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-container/60 transition-colors">
                    {/* User Identity */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary-container/25 border border-primary/40 flex items-center justify-center font-mono font-bold text-xs text-primary">
                          {u.fullName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-on-surface flex items-center gap-1">
                            {u.fullName}
                            {u.status === "APPROVED" && (
                              <span className="material-symbols-outlined text-tertiary text-[14px]">
                                verified
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-outline">@{u.username}</div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4 font-mono">
                      <div className="text-on-surface font-medium">+91 {u.mobileNumber}</div>
                      <div className="text-[11px] text-outline">{u.email}</div>
                    </td>

                    {/* Aadhaar Identification */}
                    <td className="py-3 px-4 font-mono">
                      <div className="text-secondary font-semibold">{u.aadhaarNumber}</div>
                      <div className="text-[10px] text-outline">
                        {u.aadhaarDocumentPath ? "Document Uploaded" : "No Scan Uploaded"}
                      </div>
                    </td>

                    {/* Allocated Unit */}
                    <td className="py-3 px-4 font-mono">
                      {u.assignedRoomCode ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary/10 border border-secondary/30 text-secondary font-bold text-[11px]">
                          <span className="material-symbols-outlined text-[13px]">apartment</span>
                          {u.assignedRoomCode}
                        </span>
                      ) : (
                        <span className="text-outline italic text-[11px]">No unit assigned</span>
                      )}
                    </td>

                    {/* Status & Active */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                            u.status === "APPROVED"
                              ? "bg-tertiary/15 text-tertiary border border-tertiary/30"
                              : u.status === "REJECTED"
                              ? "bg-error/15 text-error border border-error/30"
                              : "bg-amber-400/15 text-amber-400 border border-amber-400/30"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.status === "APPROVED"
                                ? "bg-tertiary"
                                : u.status === "REJECTED"
                                ? "bg-error"
                                : "bg-amber-400"
                            }`}
                          />
                          {u.status}
                        </span>

                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                            u.active
                              ? "bg-surface-container text-tertiary border border-outline-variant/30"
                              : "bg-surface-container text-outline border border-outline-variant/30"
                          }`}
                        >
                          {u.active ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>
                    </td>

                    {/* Actions: Preview, Edit, Delete */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Preview detail */}
                        <button
                          type="button"
                          onClick={() => setPreviewUser(u)}
                          className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-secondary transition-colors cursor-pointer"
                          title="Preview User Details"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>

                        {/* Edit / Update */}
                        <button
                          type="button"
                          onClick={() => openEditModal(u)}
                          className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                          title="Edit User Form"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => setDeleteUserId(u.id)}
                          className="p-1 rounded hover:bg-error/20 text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                          title="Delete User"
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

      {/* PREVIEW DETAIL USER MODAL (Section 3.3.2) */}
      <AnimatePresence>
        {previewUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-low border border-outline-variant/40 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center font-mono font-bold text-sm text-white">
                    {previewUser.fullName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface text-base">{previewUser.fullName}</h3>
                    <p className="font-mono text-xs text-outline">User ID: #{previewUser.id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewUser(null)}
                  className="p-1.5 rounded-lg hover:bg-surface-container text-outline hover:text-on-surface cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-outline-variant/20">
                  <span className="text-outline">Username:</span>
                  <span className="text-on-surface font-semibold">{previewUser.username}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-outline-variant/20">
                  <span className="text-outline">Mobile Number:</span>
                  <span className="text-on-surface font-semibold">+91 {previewUser.mobileNumber}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-outline-variant/20">
                  <span className="text-outline">Email:</span>
                  <span className="text-on-surface font-semibold">{previewUser.email}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-outline-variant/20">
                  <span className="text-outline">Aadhaar Card No:</span>
                  <span className="text-secondary font-bold">{previewUser.aadhaarNumber}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-outline-variant/20">
                  <span className="text-outline">Permanent Address:</span>
                  <span className="text-on-surface max-w-[280px] text-right">{previewUser.fullAddress}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-outline-variant/20">
                  <span className="text-outline">Allocated Room:</span>
                  <span className="text-primary font-semibold">
                    {previewUser.assignedRoomCode || "Unassigned"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-outline-variant/20">
                  <span className="text-outline">Date of Joining:</span>
                  <span className="text-on-surface">{previewUser.dateOfJoining}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-outline-variant/20">
                  <span className="text-outline">Next Due Date:</span>
                  <span className="text-secondary font-semibold">{previewUser.nextDueDate || "30 Days from Joining"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-outline-variant/20">
                  <span className="text-outline">Approval Status:</span>
                  <span className="text-tertiary font-bold">{previewUser.status}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-outline">Account Active:</span>
                  <span className={previewUser.active ? "text-tertiary" : "text-error"}>
                    {previewUser.active ? "YES" : "NO"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewUser(null);
                    openEditModal(previewUser);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface text-xs font-mono border border-outline-variant/40 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  Edit Details
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewUser(null)}
                  className="px-4 py-1.5 rounded-lg bg-primary-container hover:bg-indigo-600 text-white text-xs font-mono cursor-pointer"
                >
                  Close Dossier
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT USER FORM MODAL (Section 3.3.2) */}
      <AnimatePresence>
        {editUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-low border border-outline-variant/40 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[22px]">manage_accounts</span>
                  <h3 className="font-bold text-on-surface text-base">
                    Edit User Profile: {editUser.username}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="p-1.5 rounded-lg hover:bg-surface-container text-outline hover:text-on-surface cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-3.5 text-xs font-mono">
                <div>
                  <label className="block text-on-surface-variant mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface focus:border-secondary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-on-surface-variant mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface focus:border-secondary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-on-surface-variant mb-1">Mobile Number</label>
                    <input
                      type="text"
                      required
                      value={editForm.mobileNumber}
                      onChange={(e) => setEditForm({ ...editForm, mobileNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface focus:border-secondary focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-on-surface-variant mb-1">Aadhaar Card Number</label>
                  <input
                    type="text"
                    required
                    value={editForm.aadhaarNumber}
                    onChange={(e) => setEditForm({ ...editForm, aadhaarNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface focus:border-secondary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-on-surface-variant mb-1">Full Address</label>
                  <textarea
                    rows={2}
                    required
                    value={editForm.fullAddress}
                    onChange={(e) => setEditForm({ ...editForm, fullAddress: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface focus:border-secondary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-on-surface-variant mb-1">Verification Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface focus:border-secondary focus:outline-none"
                    >
                      <option value="APPROVED">APPROVED</option>
                      <option value="PENDING">PENDING</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-on-surface-variant mb-1">Account Active</label>
                    <select
                      value={editForm.active ? "true" : "false"}
                      onChange={(e) => setEditForm({ ...editForm, active: e.target.value === "true" })}
                      className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface focus:border-secondary focus:outline-none"
                    >
                      <option value="true">Active (Access Granted)</option>
                      <option value="false">Inactive (Suspended)</option>
                    </select>
                  </div>
                </div>

                {editForm.status === "REJECTED" && (
                  <div className="p-3 rounded-lg bg-error-container/20 border border-error/40 text-error flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">warning</span>
                    <div className="text-[11px] leading-relaxed">
                      <strong className="block font-semibold mb-0.5">Automatic Permanent Removal</strong>
                      Saving as <strong>REJECTED</strong> will permanently delete this user from the database and immediately set any assigned room to <strong>VACANT</strong>.
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-outline-variant/30">
                  <button
                    type="button"
                    onClick={() => setEditUser(null)}
                    className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary-container hover:bg-indigo-600 text-white font-semibold cursor-pointer shadow-[0_0_14px_rgba(79,70,229,0.4)]"
                  >
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    {isSaving ? "Saving to DB..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteUserId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-low border border-error/40 rounded-xl max-w-sm w-full p-5 shadow-2xl space-y-3 font-mono text-xs"
            >
              <div className="flex items-center gap-2 text-error font-bold text-sm">
                <span className="material-symbols-outlined text-[20px]">warning</span>
                Confirm Permanent Deletion
              </div>
              <p className="text-on-surface-variant">
                Are you sure you want to permanently delete user #{deleteUserId}? If this user is assigned to a room, the room will be vacated automatically.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setDeleteUserId(null)}
                  className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteUser(deleteUserId)}
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
