"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminSettingsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/dashboard?tab=security");
  }, [router]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center text-on-surface font-mono">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="text-xs">Loading Security Settings...</span>
      </div>
    </div>
  );
}
