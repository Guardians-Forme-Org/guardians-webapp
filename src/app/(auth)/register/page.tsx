"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [language, setLanguage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // POST /auth/register not live — mock locally with Zustand
      await new Promise((r) => setTimeout(r, 400));
      setUser({
        id: crypto.randomUUID(),
        full_name: fullName,
        city,
        language,
      });
      router.push("/onboarding");
    } catch {
      setError(t("auth.register.error"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-semibold">{t("auth.register.title")}</h1>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="fullName" className="text-sm font-medium">
              {t("auth.register.fullName")}
            </label>
            <Input
              id="fullName"
              placeholder={t("auth.register.fullNamePlaceholder")}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="city" className="text-sm font-medium">
              {t("auth.register.city")}
            </label>
            <Input
              id="city"
              placeholder={t("auth.register.cityPlaceholder")}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">
              {t("auth.register.language")}
            </label>
            <Select value={language} onValueChange={(v) => setLanguage(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder={t("auth.register.languagePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t("auth.register.languages.en")}</SelectItem>
                <SelectItem value="es">{t("auth.register.languages.es")}</SelectItem>
                <SelectItem value="zu">{t("auth.register.languages.zu")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting
              ? t("auth.register.submitting")
              : t("auth.register.submit")}
          </Button>
        </form>
      </div>
    </div>
  );
}
