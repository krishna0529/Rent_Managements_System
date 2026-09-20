"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserSummary } from "./UserDirectoryView";

interface TenantKYCDocumentsViewProps {
  showToast: (msg: string) => void;
}

export default function TenantKYCDocumentsView({ showToast }: TenantKYCDocumentsViewProps) {
  const [documents, setDocuments] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [zoomDoc, setZoomDoc] = useState<UserSummary | null>(null);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/admin/documents");
      if (res.ok) {
        const json = await res.json();
        if (json?.data) setDocuments(json.data);
      }
    } catch (err) {
      console.error("Failed to load tenant documents:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const filteredDocs = documents.filter(
    (d) =>
      d.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.aadhaarNumber.includes(searchQuery) ||
      d.mobileNumber.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* 3.7 HEADER & SUMMARY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-tertiary/15 text-tertiary border border-tertiary/30">
              3.7 Tenant Documents
            </span>
            <h1 className="text-[26px] font-bold text-on-surface tracking-tight">
              Aadhaar KYC &amp; Verification Vault
            </h1>
          </div>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            3.7.1 Real-time repository of user registered Aadhaar Card numbers and uploaded official identity documents.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchDocuments}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface text-xs font-mono border border-outline-variant/40 transition-all cursor-pointer"
        >
          <span className={`material-symbols-outlined text-[16px] text-secondary ${isLoading ? "animate-spin" : ""}`}>
            sync
          </span>
          Refresh Vault
        </button>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-on-surface-variant">
            <span>Aadhaar Records In DB</span>
            <span className="material-symbols-outlined text-tertiary text-[18px]">verified</span>
          </div>
          <div className="mt-2 text-[28px] font-bold text-on-surface">{documents.length} Users</div>
          <span className="text-[11px] text-outline font-mono mt-1">Source: public.users (aadhaar_number)</span>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-on-surface-variant">
            <span>Uploaded Identity Scans</span>
            <span className="material-symbols-outlined text-secondary text-[18px]">image</span>
          </div>
          <div className="mt-2 text-[28px] font-bold text-secondary">
            {documents.filter((d) => d.aadhaarDocumentPath).length} Files
          </div>
          <span className="text-[11px] text-secondary font-mono mt-1">Stored in uploads directory</span>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-on-surface-variant">
            <span>Verified Status Rate</span>
            <span className="material-symbols-outlined text-primary text-[18px]">shield</span>
          </div>
          <div className="mt-2 text-[28px] font-bold text-tertiary">
            {documents.length > 0
              ? Math.round(
                  (documents.filter((d) => d.status === "APPROVED").length / documents.length) * 100
                )
              : 100}
            %
          </div>
          <span className="text-[11px] text-tertiary font-mono mt-1">Admin KYC Authenticated</span>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-2 text-outline text-[16px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search Aadhaar number, tenant name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs font-body bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary transition-all"
          />
        </div>
      </div>

      {/* 3.7.1 DOCUMENTS GALLERY & TABLE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-outline font-mono">
            <span className="material-symbols-outlined animate-spin text-[24px] text-secondary inline-block align-middle mr-2">
              autorenew
            </span>
            Loading Aadhaar identification records from database...
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="col-span-full py-12 text-center text-outline font-mono">
            No tenant documents found.
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-surface-container-low border border-outline-variant/30 hover:border-secondary/50 rounded-xl p-5 shadow-sm transition-all flex flex-col justify-between font-mono text-xs"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary-container/20 border border-primary/40 flex items-center justify-center font-bold text-primary">
                      {doc.fullName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-on-surface text-sm font-body">{doc.fullName}</div>
                      <div className="text-[10px] text-outline">+91 {doc.mobileNumber}</div>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      doc.status === "APPROVED"
                        ? "bg-tertiary/15 text-tertiary border border-tertiary/30"
                        : "bg-amber-400/15 text-amber-400 border border-amber-400/30"
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>

                {/* 3.7.1 Aadhaar Card Number */}
                <div className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/20 mb-3">
                  <div className="text-[10px] text-outline uppercase tracking-wider mb-0.5">
                    3.7.1 Government Aadhaar Number:
                  </div>
                  <div className="text-base font-bold text-secondary tracking-widest">
                    {doc.aadhaarNumber || "NOT PROVIDED"}
                  </div>
                </div>

                {/* 3.7.1 Aadhaar Document Image Preview Thumbnail */}
                <div className="rounded-lg bg-surface-container border border-outline-variant/30 p-2.5 flex flex-col items-center justify-center min-h-[120px] relative overflow-hidden group">
                  {doc.aadhaarDocumentPath ? (
                    <div className="w-full flex flex-col items-center gap-1.5">
                      <div className="w-full h-24 rounded bg-surface-container-high border border-outline-variant/30 flex items-center justify-center overflow-hidden">
                        <img
                          src={`http://localhost:8080${doc.aadhaarDocumentPath}`}
                          alt="Aadhaar Scan"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            // Fallback to stylized document graphic if image not yet on disk
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                        <div className="text-center p-2 text-outline">
                          <span className="material-symbols-outlined text-[28px] text-secondary">
                            badge
                          </span>
                          <div className="text-[10px] text-on-surface-variant font-bold">
                            Official Aadhaar Card Scan
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-tertiary flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">check_circle</span>
                        Verified Document Bound
                      </span>
                    </div>
                  ) : (
                    <div className="text-center p-3 text-outline">
                      <span className="material-symbols-outlined text-[28px]">image_not_supported</span>
                      <div className="text-[10px] mt-1">No physical image upload on record</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button: View Full Image */}
              <div className="pt-3 border-t border-outline-variant/20 mt-4 flex items-center justify-between">
                <span className="text-[10px] text-outline">Joined: {doc.dateOfJoining}</span>
                <button
                  type="button"
                  onClick={() => setZoomDoc(doc)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-container hover:bg-indigo-600 text-white font-semibold text-xs transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">zoom_in</span>
                  View Aadhaar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3.7.1 AADHAAR FULL PREVIEW / ZOOM LIGHTBOX MODAL */}
      <AnimatePresence>
        {zoomDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-low border border-outline-variant/40 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 font-mono text-xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                <div>
                  <h3 className="font-bold text-on-surface text-base">
                    Aadhaar Identity Dossier: {zoomDoc.fullName}
                  </h3>
                  <p className="text-[10px] text-secondary">
                    Registered UID: #{zoomDoc.id} • @{zoomDoc.username}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setZoomDoc(null)}
                  className="p-1.5 rounded-lg hover:bg-surface-container text-outline hover:text-on-surface cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Aadhaar Number Big Banner */}
              <div className="p-4 rounded-xl bg-surface-container-lowest border border-secondary/40 text-center space-y-1">
                <div className="text-[10px] text-outline uppercase tracking-widest">
                  Unique Identification Authority of India (UIDAI)
                </div>
                <div className="text-xl font-bold text-secondary tracking-widest">
                  {zoomDoc.aadhaarNumber}
                </div>
                <div className="text-[10px] text-tertiary flex items-center justify-center gap-1 font-bold">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  Verified Record in Database
                </div>
              </div>

              {/* Document Image Container */}
              <div className="rounded-lg bg-surface-container-lowest border border-outline-variant/30 p-4 min-h-[200px] flex flex-col items-center justify-center relative overflow-hidden">
                {zoomDoc.aadhaarDocumentPath ? (
                  <div className="w-full flex flex-col items-center gap-2">
                    <img
                      src={`http://localhost:8080${zoomDoc.aadhaarDocumentPath}`}
                      alt={zoomDoc.aadhaarNumber}
                      className="max-h-60 w-auto rounded object-contain border border-outline-variant/40 shadow-md"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <a
                      href={`http://localhost:8080${zoomDoc.aadhaarDocumentPath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-secondary hover:underline flex items-center gap-1 mt-1 font-bold"
                    >
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                      Open Raw Document File in New Tab
                    </a>
                  </div>
                ) : (
                  <div className="text-center p-6 text-outline">
                    <span className="material-symbols-outlined text-[36px] text-outline mb-1">
                      contact_emergency
                    </span>
                    <p>No scanned image file uploaded during initial user registration.</p>
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="space-y-1.5 p-3 rounded-lg bg-surface-container text-[11px]">
                <div className="flex justify-between">
                  <span className="text-outline">Address on Record:</span>
                  <span className="text-on-surface font-semibold max-w-[280px] text-right">
                    {zoomDoc.fullAddress}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Contact Phone:</span>
                  <span className="text-on-surface">+91 {zoomDoc.mobileNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Email:</span>
                  <span className="text-on-surface">{zoomDoc.email}</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-2 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setZoomDoc(null)}
                  className="px-4 py-1.5 rounded-lg bg-primary-container text-white cursor-pointer"
                >
                  Close Document
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
