"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useCreateCircle } from "@/hooks/useCreateCircle";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
    <div className="max-w-lg mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-semibold">{t("circles.new.title")}</h1>

      {createCircle.isError && (
        <p className="text-sm text-destructive">{t("circles.new.errorTitle")}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="name" className="text-sm font-medium">
            {t("circles.new.nameLabel")}
          </label>
          <Input
            id="name"
            placeholder={t("circles.new.namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="description" className="text-sm font-medium">
            {t("circles.new.descriptionLabel")}
          </label>
          <Textarea
            id="description"
            placeholder={t("circles.new.descriptionPlaceholder")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="city" className="text-sm font-medium">
            {t("circles.new.cityLabel")}
          </label>
          <Input
            id="city"
            placeholder={t("circles.new.cityPlaceholder")}
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={createCircle.isPending}>
            {createCircle.isPending
              ? t("circles.new.submitting")
              : t("circles.new.submit")}
          </Button>
          <Link href="/circles" className={buttonVariants({ variant: "ghost" })}>
            {t("circles.new.cancelLink")}
          </Link>
        </div>
      </form>
    </div>
  );
}
