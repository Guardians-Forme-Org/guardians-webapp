import { FieldGroup, SaveButton } from "../shared";
import type { LogFormData } from "../types";

const GREEN_SURFACE_OPTIONS = [
  "Garden bed",
  "Food garden",
  "Lawn / grass",
  "Tree planting",
  "Shrub planting",
  "Wetland / pond",
  "Other",
];

const SURFACE_TYPE_OPTIONS = [
  "Concrete / paving",
  "Bare soil",
  "Gravel",
  "Asphalt",
  "Rubble",
  "Existing vegetation",
];

type Props = {
  form: LogFormData;
  update: (k: keyof LogFormData, v: unknown) => void;
  onNext: () => void;
  nextLabel: string;
};

export default function SiteConditionStep({ form, update, onNext, nextLabel }: Props) {
  return (
    <>
      <div className="px-5 mt-7 mb-6">
        <h1 className="text-[32px] font-bold text-black leading-tight">Site Description</h1>
      </div>

      <div className="flex flex-col gap-5 px-5">
        <FieldGroup label="Estimated Site Area" hint="Total footprint of the site boundary" required>
          <div className="flex">
            <input
              type="number"
              value={form.estimatedArea}
              onChange={(e) => update("estimatedArea", e.target.value)}
              placeholder="0"
              className="flex-1 h-[44px] bg-white border border-r-0 border-[rgba(26,26,24,0.28)] rounded-l-[8px] px-3 text-base text-text-primary outline-none"
            />
            <div className="relative h-[44px] shrink-0">
              <select
                value={form.areaUnit}
                onChange={(e) => update("areaUnit", e.target.value)}
                className="h-full w-20 bg-[#f0efeb] border border-[rgba(26,26,24,0.28)] rounded-r-[8px] px-2 text-xs font-semibold text-[#5c5c59] outline-none appearance-none cursor-pointer pr-5"
              >
                <option value="m²">m²</option>
                <option value="ha">ha</option>
                <option value="km²">km²</option>
                <option value="acres">acres</option>
              </select>
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#5c5c59] pointer-events-none text-[10px]">▾</div>
            </div>
          </div>
        </FieldGroup>

        <FieldGroup
          label="Current Site Condition"
          hint="Describe the site before any work begins — surface type, vegetation, litter, etc."
          required
        >
          <div className="relative">
            <textarea
              value={form.siteCondition}
              onChange={(e) => update("siteCondition", e.target.value)}
              maxLength={500}
              rows={5}
              className="w-full bg-white border border-[rgba(26,26,24,0.28)] rounded-[8px] px-3 py-3 text-base text-text-primary placeholder:text-[rgba(26,26,24,0.5)] outline-none resize-none"
              placeholder="Describe conditions before work begins"
            />
            <p className="text-right text-[11px] text-[#8f8f8c] mt-1">
              {form.siteCondition.length} / 500
            </p>
          </div>
        </FieldGroup>

        <FieldGroup label="Surface Type" hint="Dominant surface material before greening" required>
          <div className="relative">
            <select
              value={form.surfaceType}
              onChange={(e) => update("surfaceType", e.target.value)}
              className="w-full h-[44px] bg-white border border-[rgba(26,26,24,0.28)] rounded-[8px] px-3 text-base text-text-primary outline-none appearance-none"
            >
              <option value="">Select surface type</option>
              {SURFACE_TYPE_OPTIONS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 pointer-events-none text-text-muted">▾</div>
          </div>
        </FieldGroup>

        <FieldGroup label="Type of green surface created" hint="Primary category of the greened area" required>
          <div className="relative">
            <select
              value={form.greenSurfaceType}
              onChange={(e) => update("greenSurfaceType", e.target.value)}
              className="w-full h-[44px] bg-white border border-[rgba(26,26,24,0.28)] rounded-[8px] px-3 text-base text-text-primary outline-none appearance-none"
            >
              <option value="">Select green surface type</option>
              {GREEN_SURFACE_OPTIONS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 pointer-events-none text-text-muted">▾</div>
          </div>
        </FieldGroup>
      </div>

      <div className="flex-1" />
      <SaveButton label={nextLabel} onClick={onNext} />
    </>
  );
}
