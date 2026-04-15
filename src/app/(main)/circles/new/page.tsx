"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useCreateCircle } from "@/hooks/useCreateCircle";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function FormField({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-semibold tracking-wide uppercase text-muted-foreground/70">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function CircleNewPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const createCircle = useCreateCircle();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const circle = await createCircle.mutateAsync({ name, description });
    router.push(`/circles/${circle.id}`);
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("circles.new.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("circles.new.descriptionPlaceholder")}
        </p>
      </div>

      {createCircle.isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-sm text-destructive">{t("circles.new.errorTitle")}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label={t("circles.new.nameLabel")} id="name">
          <Input
            id="name"
            placeholder={t("circles.new.namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </FormField>

        <FormField label={t("circles.new.descriptionLabel")} id="description">
          <Textarea
            id="description"
            placeholder={t("circles.new.descriptionPlaceholder")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </FormField>

        <FormField label={t("circles.new.cityLabel")} id="city">
          <Input
            id="city"
            placeholder={t("circles.new.cityPlaceholder")}
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </FormField>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={createCircle.isPending}>
            {createCircle.isPending
              ? t("circles.new.submitting")
              : t("circles.new.submit")}
          </Button>
          <Link
            href="/circles"
            className={cn(buttonVariants({ variant: "ghost" }), "text-muted-foreground")}
          >
            {t("circles.new.cancelLink")}
          </Link>
        </div>
      </form>
    </div>
  );
}
