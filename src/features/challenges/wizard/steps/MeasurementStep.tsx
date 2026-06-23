import { SaveButton } from "../shared";
import type { LogFormData } from "../types";

type Props = {
  form: LogFormData;
  update: (k: keyof LogFormData, v: unknown) => void;
  onNext: () => void;
  nextLabel: string;
};

const AREA_UNITS = ["m²", "ha", "km²", "acres"] as const;

export default function MeasurementStep({ form, update, onNext, nextLabel }: Props) {
  const isArea = form.measurementType === "AREA";
  const unit = form.measurementType === "VOLUME" ? "L" : "kg";

  return (
    <>
      <div className="px-5 mt-7 mb-6">
        <h1 className="text-[32px] font-bold text-black">Measurement</h1>
      </div>

      <div className="flex flex-col gap-5 px-5">
        {/* Type toggle — hidden when locked to AREA */}
        {!isArea && (
          <div className="flex flex-col gap-2">
            <label className="text-base font-semibold text-text-primary">Type</label>
            <div className="flex gap-2">
              {(["VOLUME", "MASS"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => update("measurementType", type)}
                  className={`flex-1 h-11 rounded-full border text-base font-medium transition-colors ${
                    form.measurementType === type
                      ? "bg-black text-white border-black"
                      : "bg-white text-text-primary border-[rgba(26,26,24,0.28)]"
                  }`}
                >
                  {type === "VOLUME" ? "Volume (L)" : "Weight (kg)"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Measurement value */}
        <div className="flex flex-col gap-2">
          <label className="text-base font-semibold text-text-primary">
            Amount {!isArea && <span className="text-[#8f8f8c] font-normal">({unit})</span>}
          </label>
          <div className="flex items-center border border-[rgba(26,26,24,0.28)] rounded-[8px] overflow-hidden">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              value={form.measurementValue}
              onChange={(e) => update("measurementValue", e.target.value)}
              placeholder="0"
              className="flex-1 h-[44px] px-3 text-base text-text-primary placeholder:text-[rgba(26,26,24,0.5)] outline-none bg-white"
            />
            {isArea ? (
              <div className="relative h-[44px] shrink-0">
                <select
                  value={form.areaUnit}
                  onChange={(e) => update("areaUnit", e.target.value)}
                  className="h-full w-20 bg-[#f0efeb] border-l border-[rgba(26,26,24,0.14)] px-2 text-xs font-semibold text-[#5c5c59] outline-none appearance-none cursor-pointer pr-5"
                >
                  {AREA_UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#5c5c59] pointer-events-none text-[10px]">▾</div>
              </div>
            ) : (
              <div className="h-[44px] px-4 flex items-center bg-[#f0efeb] border-l border-[rgba(26,26,24,0.14)]">
                <span className="text-base font-semibold text-text-primary">{unit}</span>
              </div>
            )}
          </div>
        </div>

        {/* Description — not shown for area measurement */}
        {!isArea && (
          <div className="flex flex-col gap-2">
            <label className="text-base font-semibold text-text-primary">Description</label>
            <textarea
              value={form.impactDescription}
              onChange={(e) => update("impactDescription", e.target.value)}
              placeholder="e.g. Added yard waste and kitchen scraps to the compost bin."
              rows={4}
              className="border border-[rgba(26,26,24,0.28)] rounded-[8px] px-3 py-3 text-base text-text-primary placeholder:text-[rgba(26,26,24,0.5)] outline-none resize-none"
            />
          </div>
        )}
      </div>

      <div className="flex-1" />
      <SaveButton label={nextLabel} onClick={onNext} />
    </>
  );
}
