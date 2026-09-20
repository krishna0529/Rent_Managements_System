"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAdminSession, getUserSession } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const admin = getAdminSession();
    if (admin) {
      router.replace("/admin/dashboard");
      return;
    }

    const user = getUserSession();
    if (user) {
      router.replace("/dashboard");
      return;
    }

    router.replace("/login");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex items-center gap-3 text-outline">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="text-lg font-medium">Resolving Session...</span>
      </div>
    </div>
  );
}
