import { FileThumb, ReadOnlyField } from "../shared";
import type { WizardStepType } from "../../stepFormConfig";
import type { LogFormData } from "../types";

type UserLike = {
  id: string;
  user_metadata: { firstName?: string; lastName?: string };
};

type Props = {
  form: LogFormData;
  stepTypes: WizardStepType[];
  onDelete: () => void;
  onUpload: () => void;
  isPending?: boolean;
  error?: string | null;
  users?: UserLike[];
};

export default function ReviewStep({ form, stepTypes, onDelete, onUpload, isPending, error, users }: Props) {
  const hasFileUpload = stepTypes.includes("file-upload");
  const hasSiteDetails = stepTypes.includes("site-details");

  return (
    <>
      <div className="px-5 mt-7 mb-6">
        <h1 className="text-[32px] font-bold text-black">Review</h1>
        <p className="text-[18px] text-black mt-1">Read Only</p>
      </div>

      <div className="flex flex-col gap-5 px-5">
        {hasFileUpload && (
          <>
            {form.evidenceFiles.length > 0 && (
              <div className="flex flex-col gap-3">
                <label className="text-base font-medium text-text-primary">Files</label>
                {form.evidenceFiles.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 border border-[rgba(26,26,24,0.14)] rounded-[12px] p-4"
                  >
                    <div
                      className={`size-10 rounded-[8px] overflow-hidden flex items-center justify-center shrink-0 ${
                        file.type.startsWith("image/") ? "bg-[#f0f0ee]" : file.type.includes("pdf") ? "bg-red-50" : "bg-[#f5f5f5]"
                      }`}
                    >
                      <FileThumb file={file} />
                    </div>
                    <p className="flex-1 text-base font-semibold text-text-primary truncate">{file.name}</p>
                  </div>
                ))}
              </div>
            )}
            {form.impactDescription && (
              <ReadOnlyField label="Impact" value={form.impactDescription} multiline />
            )}
            {form.contributors.length > 0 && (
              <ReadOnlyField
                label="Contributors"
                value={form.contributors
                  .map((id) => {
                    const u = users?.find((u) => u.id === id);
                    return u
                      ? `${u.user_metadata.firstName ?? ""} ${u.user_metadata.lastName ?? ""}`.trim() || id
                      : id;
                  })
                  .join(", ")}
              />
            )}
          </>
        )}

        {hasSiteDetails && (
          <>
            {form.siteName && <ReadOnlyField label="Site Name" value={form.siteName} />}
            {form.permissionHolder && (
              <ReadOnlyField label="Permission Holder" value={form.permissionHolder} />
            )}

            <div className="border border-[rgba(26,26,24,0.14)] rounded-[12px] p-[14.5px] flex gap-3 items-start">
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-text-primary">Written permission confirmed</p>
                <p className="text-xs text-[#5c5c59] mt-1">Confirm you have signed permission from the landowner.</p>
              </div>
              <div
                className={`relative shrink-0 w-11 h-[26px] rounded-full mt-0.5 ${
                  form.permissionConfirmed
                    ? "bg-gotf-green"
                    : "bg-[#f0efeb] border border-[rgba(26,26,24,0.28)]"
                }`}
              >
                <div
                  className={`absolute top-1 size-[18px] rounded-full ${
                    form.permissionConfirmed ? "bg-white translate-x-[18px]" : "bg-[#8f8f8c] translate-x-1"
                  }`}
                />
              </div>
            </div>

            {form.locationResult && (
              <div className="flex flex-col gap-2">
                <label className="text-base font-medium text-text-primary">Location</label>
                <div className="h-[44px] border border-[rgba(26,26,24,0.14)] rounded-[8px] px-3 flex items-center bg-[#f9f9f9]">
                  <p className="text-base text-text-primary truncate">{form.locationResult.formattedAddress}</p>
                </div>
                <iframe
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${form.locationResult.longitude - 0.015},${form.locationResult.latitude - 0.01},${form.locationResult.longitude + 0.015},${form.locationResult.latitude + 0.01}&layer=mapnik&marker=${form.locationResult.latitude},${form.locationResult.longitude}`}
                  className="w-full h-48 rounded-[8px] border border-[rgba(26,26,24,0.14)]"
                  title="Location map"
                />
              </div>
            )}

            {form.plantingPhoto && (
              <div className="flex flex-col gap-2">
                <label className="text-base font-medium text-text-primary">Planting Photo</label>
                <img
                  src={form.plantingPhoto}
                  alt=""
                  className="w-full h-48 object-cover rounded-[8px] border border-[rgba(26,26,24,0.14)]"
                />
              </div>
            )}

            {form.estimatedArea && (
              <ReadOnlyField
                label="Estimated Site Area"
                value={`${form.estimatedArea} ${form.areaUnit}`}
              />
            )}

            {form.siteCondition && (
              <ReadOnlyField label="Current Site Condition" value={form.siteCondition} multiline />
            )}
          </>
        )}
      </div>

      <div className="flex-1" />
      <div className="px-5 pb-8 pt-4 flex flex-col gap-3 shrink-0">
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        <button
          onClick={onDelete}
          disabled={isPending}
          className="w-full h-14 border border-[rgba(26,26,24,0.28)] rounded-full text-base font-medium text-text-primary disabled:opacity-50"
        >
          Delete Impact
        </button>
        <button
          onClick={onUpload}
          disabled={isPending}
          className="w-full h-14 bg-black text-white rounded-full text-xl font-medium disabled:opacity-50"
        >
          {isPending ? "Uploading…" : "Upload"}
        </button>
      </div>
    </>
  );
}
