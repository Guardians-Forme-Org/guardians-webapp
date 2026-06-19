import { FieldGroup, GateBanner, SaveButton, TextInput, ToggleCard } from "../shared";
import type { LogFormData } from "../types";

type Props = {
  form: LogFormData;
  update: (k: keyof LogFormData, v: unknown) => void;
  onNext: () => void;
};

export default function SiteDetailsStep({ form, update, onNext }: Props) {
  return (
    <>
      <div className="px-5 mt-7 mb-6">
        <h1 className="text-[32px] font-bold text-black leading-tight">
          Site Details<br />&amp; Baseline
        </h1>
      </div>

      <div className="flex flex-col gap-5 px-5">
        <FieldGroup label="Site Name" hint="The official or colloquial name of this site" required>
          <TextInput
            value={form.siteName}
            onChange={(v) => update("siteName", v)}
            placeholder="e.g. Sandton Taxi Rank Verge"
          />
        </FieldGroup>

        <FieldGroup label="Permission Holder" hint="Name of the person or body that granted access">
          <TextInput
            value={form.permissionHolder}
            onChange={(v) => update("permissionHolder", v)}
            placeholder="Full name or organisation"
          />
        </FieldGroup>

        <ToggleCard
          label="Written permission confirmed"
          description="Confirm you have signed permission from the landowner before continuing."
          checked={form.permissionConfirmed}
          onChange={() => update("permissionConfirmed", !form.permissionConfirmed)}
        />

        <ToggleCard
          label="Mark challenge as complete"
          description="Unlocks after all three steps are validated."
          checked={form.markComplete}
          onChange={() => update("markComplete", !form.markComplete)}
          disabled={!form.permissionConfirmed}
          badge={!form.permissionConfirmed ? "Unlock after step 3" : undefined}
        />

        {!form.permissionConfirmed && (
          <GateBanner message="Written permission required. Toggle the switch above to continue to step 2." />
        )}
      </div>

      <div className="flex-1" />
      <SaveButton onClick={onNext} />
    </>
  );
}
