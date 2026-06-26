"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { getToken } from "@/lib/auth";

const SPLASH_SEEN_KEY = "gotf_splash_seen";

export default function LocaleRootPage() {
  const router = useRouter();

  useEffect(() => {
    if (getToken()) {
      router.replace("/home");
    } else if (localStorage.getItem(SPLASH_SEEN_KEY)) {
      router.replace("/get-started");
    } else {
      router.replace("/splash");
    }
  }, [router]);

  return null;
}
