"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { UserPlus, X } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import type { AuthUser } from "@/lib/types/auth";

// A circle's leads or a challenge's facilitators: everyone who holds the role,
// with adding and removing for the people allowed to (see canManageLeads /
// canManageFacilitators). Anyone can step down from their own role. The last
// holder can't be removed — the BE refuses it too.

type Kind = "lead" | "facilitator";

type Holder = { userId: string; avatarUrl?: string | null };

type Props = {
  kind: Kind;
  holders: Holder[];
  users: AuthUser[];
  // Who can be added (already filtered: no minors, members only for facilitators)
  candidates: AuthUser[];
  currentUserId?: string | null;
  canManage: boolean;
  onAdd: (userId: string) => void;
  onRemove: (userId: string, onDone: () => void) => void;
  isPending?: boolean;
  error?: string | null;
};

const fullName = (u: AuthUser | undefined) =>
  u ? [u.user_metadata.firstName, u.user_metadata.lastName].filter(Boolean).join(" ") : "";

export default function RoleHoldersSection({
  kind,
  holders,
  users,
  candidates,
  currentUserId,
  canManage,
  onAdd,
  onRemove,
  isPending,
  error,
}: Props) {
  const t = useTranslations("roles");
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState("");
  const [confirming, setConfirming] = useState<Holder | null>(null);

  const roleLabel = kind === "lead" ? t("lead") : t("facilitator");
  const holderIds = new Set(holders.map((h) => h.userId));
  const isLast = holders.length <= 1;

  const query = search.trim().toLowerCase();
  const options = candidates.filter(
    (u) =>
      !holderIds.has(u.id) &&
      (!query || `${fullName(u)} ${u.email ?? ""}`.toLowerCase().includes(query)),
  );

  const nameOf = (h: Holder) => fullName(users.find((u) => u.id === h.userId)) || roleLabel;
  const isSelf = (h: Holder) => !!currentUserId && h.userId === currentUserId;

  const confirmTexts = (h: Holder) => {
    const name = nameOf(h);
    if (isSelf(h)) {
      return kind === "lead"
        ? { title: t("stepDownLeadTitle"), body: t("stepDownLeadBody"), action: t("stepDown") }
        : { title: t("stepDownFacilitatorTitle"), body: t("stepDownFacilitatorBody"), action: t("stepDown") };
    }
    return kind === "lead"
      ? { title: t("removeLeadTitle", { name }), body: t("removeLeadBody", { name }), action: t("remove") }
      : { title: t("removeFacilitatorTitle", { name }), body: t("removeFacilitatorBody", { name }), action: t("remove") };
  };

  return (
    <div className="border-t border-progress-track border-b border-progress-track">
      {holders.length === 0 && (
        <p className="px-7.5 pt-5 text-base text-text-secondary">
          {kind === "lead" ? t("noLeadYet") : t("noFacilitatorYet")}
        </p>
      )}

      {holders.map((h) => {
        const name = nameOf(h);
        const avatar = h.avatarUrl || users.find((u) => u.id === h.userId)?.user_metadata?.avatarUrl;
        const removable = (canManage || isSelf(h)) && !isLast;
        return (
          <div key={h.userId} className="flex items-center gap-5 px-7.5 py-5">
            <Avatar src={avatar} alt={name} className="size-10 rounded-full border border-border shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xl font-semibold text-text-primary break-words">{name}</p>
              <p className="text-base font-medium text-text-secondary">
                {roleLabel}
                {isSelf(h) && <span className="text-gotf-green"> · {t("you")}</span>}
              </p>
            </div>
            {removable && (
              <button
                onClick={() => setConfirming(h)}
                disabled={isPending}
                aria-label={isSelf(h) ? t("stepDown") : t("remove")}
                className="size-9 rounded-full flex items-center justify-center text-text-muted hover:bg-surface disabled:opacity-50 shrink-0"
              >
                <X size={18} />
              </button>
            )}
          </div>
        );
      })}

      {canManage && isLast && holders.length === 1 && (
        <p className="px-7.5 -mt-2 pb-3 text-xs text-text-muted">
          {kind === "lead" ? t("lastLeadHint") : t("lastFacilitatorHint")}
        </p>
      )}

      {canManage && (
        <div className="px-7.5 pb-5 pt-1 relative">
          {!showPicker ? (
            <button
              onClick={() => setShowPicker(true)}
              disabled={isPending}
              className="flex items-center gap-2 px-4 h-10 bg-surface border border-border rounded-full text-sm font-medium text-text-primary disabled:opacity-50"
            >
              <UserPlus size={14} />
              {kind === "lead" ? t("addLead") : t("addFacilitator")}
            </button>
          ) : (
            <div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchGuardians")}
                autoFocus
                className="w-full h-[44px] border border-[#d9d9d9] rounded-[8px] px-4 text-base placeholder:text-[#bfbfbf] outline-none"
              />
              <div className="absolute left-7.5 right-7.5 mt-1 bg-white border border-[#d9d9d9] rounded-[8px] shadow-lg z-50 max-h-[200px] overflow-y-auto">
                {options.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-text-muted">{t("noMatches")}</p>
                ) : (
                  options.map((u) => (
                    <button
                      key={u.id}
                      disabled={isPending}
                      onClick={() => {
                        onAdd(u.id);
                        setShowPicker(false);
                        setSearch("");
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-[#f5f5f5] disabled:opacity-50"
                    >
                      <Avatar
                        src={u.user_metadata.avatarUrl}
                        alt={fullName(u)}
                        className="size-8 rounded-full shrink-0"
                      />
                      <div>
                        <p className="text-sm font-medium text-text-primary">{fullName(u)}</p>
                        <p className="text-xs text-text-muted">{u.email}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
              <button
                onClick={() => { setShowPicker(false); setSearch(""); }}
                className="mt-2 text-sm text-text-muted"
              >
                {t("cancel")}
              </button>
            </div>
          )}
        </div>
      )}

      {error && <p className="px-7.5 pb-4 text-sm text-red-600">{error}</p>}

      {confirming && (() => {
        const { title, body, action } = confirmTexts(confirming);
        return (
          <>
            <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setConfirming(null)} aria-hidden />
            <div className="fixed inset-0 z-50 flex items-center justify-center px-6 pointer-events-none">
              <div role="dialog" aria-modal="true" className="w-full max-w-sm bg-white rounded-2xl shadow-xl pointer-events-auto">
                <div className="px-6 pt-5 pb-4 border-b border-progress-track">
                  <p className="text-base font-semibold text-black">{title}</p>
                </div>
                <div className="px-6 py-5 flex flex-col gap-5">
                  <p className="text-sm text-text-secondary leading-relaxed">{body}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setConfirming(null)}
                      className="flex-1 h-11 rounded-full border border-border text-sm font-medium text-text-primary"
                    >
                      {t("cancel")}
                    </button>
                    <button
                      onClick={() => onRemove(confirming.userId, () => setConfirming(null))}
                      disabled={isPending}
                      className="flex-1 h-11 rounded-full bg-red-600 text-white text-sm font-medium disabled:opacity-50"
                    >
                      {action}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}
