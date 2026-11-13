"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "@/i18n/navigation";
import { isWhitelisted } from "@/lib/permissions";

// The admin guide is for whitelisted admins. The check runs in the browser
// like every other admin check, so the guide holds nothing confidential.
export function useAdminOnly(): boolean {
  const { user, loading } = useAuth();
  const router = useRouter();
  const isAdmin = isWhitelisted(user?.email);

  useEffect(() => {
    if (!loading && !isAdmin) router.replace("/profile");
  }, [loading, isAdmin, router]);

  return isAdmin;
}
