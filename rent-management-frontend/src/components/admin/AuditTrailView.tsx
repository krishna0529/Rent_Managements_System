"use client";

import React, { useState, useEffect } from "react";

export interface AuditLogItem {
  id: number;
  action: string;
  performedBy: string;
  targetEntity: string;
  targetId: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

interface AuditTrailViewProps {
  showToast: (msg: string) => void;
}

export default function AuditTrailView({ showToast }: AuditTrailViewProps) {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/admin/audit-logs");
      if (res.ok) {
        const json = await res.json();
        if (json?.data) setLogs(json.data);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.performedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.targetEntity && l.targetEntity.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getActionBadgeColor = (action: string) => {
    if (action.includes("CREATE") || action.includes("APPROVE") || action.includes("SETTLE")) {
      return "bg-tertiary/15 text-tertiary border-tertiary/30";
    }
    if (action.includes("DELETE") || action.includes("REJECT")) {
      return "bg-error/15 text-error border-error/30";
    }
    if (action.includes("UPDATE") || action.includes("BILL")) {
      return "bg-secondary/15 text-secondary border-secondary/30";
    }
    return "bg-primary-container/20 text-primary border-primary/30";
  };

  return (
    <div className="space-y-6">
      {/* 3.8 HEADER & SUMMARY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary-container/20 text-secondary border border-secondary/30">
              3.8 Audit Trail
            </span>
            <h1 className="text-[26px] font-bold text-on-surface tracking-tight">
              Cryptographic System Audit Log
            </h1>
          </div>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            3.8.1 Tamper-evident ledger documenting all admin operations: room creations, power bills, payment settlements, and identity approvals.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface text-xs font-mono border border-outline-variant/40 transition-all cursor-pointer"
        >
          <span className={`material-symbols-outlined text-[16px] text-secondary ${isLoading ? "animate-spin" : ""}`}>
            sync
          </span>
          Refresh Audit Trail
        </button>
      </div>

      {/* SEARCH AND CONTROLS */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-2 text-outline text-[16px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search action, actor, target entity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs font-body bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary transition-all"
          />
        </div>
        <span className="text-xs font-mono text-outline">
          Showing {filteredLogs.length} audit entries from public.audit_logs
        </span>
      </div>

      {/* 3.8.1 AUDIT LOG TABLE */}
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest border-b border-outline-variant/30 text-[11px] font-mono text-outline uppercase tracking-wider">
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Operation Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Admin Operator</th>
                <th className="py-3 px-4">Activity Description</th>
                <th className="py-3 px-4">IP Node</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-xs font-mono">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-outline">
                    <span className="material-symbols-outlined animate-spin text-[20px] text-secondary inline-block align-middle mr-2">
                      autorenew
                    </span>
                    Loading audit trail from database...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-outline">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-container/60 transition-colors">
                    <td className="py-3 px-4 text-outline font-bold">#LOG-{log.id}</td>

                    <td className="py-3 px-4 text-on-surface whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-surface-container border border-outline-variant/40 font-bold text-secondary">
                        {log.targetEntity} {log.targetId ? `(#${log.targetId})` : ""}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-on-surface font-semibold">{log.performedBy}</td>

                    <td className="py-3 px-4 text-on-surface max-w-md font-body text-xs">
                      {log.details}
                    </td>

                    <td className="py-3 px-4 text-outline text-[11px]">{log.ipAddress || "127.0.0.1"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
