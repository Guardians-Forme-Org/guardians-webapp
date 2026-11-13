"use client";

import { useEffect } from "react";
import LegalDocument from "@/components/LegalDocument";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "@/i18n/navigation";
import { isWhitelisted } from "@/lib/permissions";

// The admin guide, for whitelisted admins only. The check runs in the browser
// like every other admin check, so the guide holds nothing confidential.
export default function DocumentationPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const isAdmin = isWhitelisted(user?.email);

  useEffect(() => {
    if (!loading && !isAdmin) router.replace("/profile");
  }, [loading, isAdmin, router]);

  if (!isAdmin) return null;
  return <LegalDocument namespace="documentation" />;
}
