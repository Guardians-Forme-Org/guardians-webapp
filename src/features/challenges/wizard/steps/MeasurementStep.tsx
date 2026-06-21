import { SaveButton } from "../shared";
import type { LogFormData } from "../types";

type Props = {
  form: LogFormData;
  update: (k: keyof LogFormData, v: unknown) => void;
  onNext: () => void;
  nextLabel: string;
};

export default function MeasurementStep({ form, update, onNext, nextLabel }: Props) {
  const isVolume = form.measurementType === "VOLUME";
  const unit = isVolume ? "L" : "kg";

  return (
    <>
      <div className="px-5 mt-7 mb-6">
        <h1 className="text-[32px] font-bold text-black">Measurement</h1>
      </div>

      <div className="flex flex-col gap-5 px-5">
        {/* Volume / Weight toggle */}
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

        {/* Measurement value */}
        <div className="flex flex-col gap-2">
          <label className="text-base font-semibold text-text-primary">
            Amount <span className="text-[#8f8f8c] font-normal">({unit})</span>
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
            <div className="h-[44px] px-4 flex items-center bg-[#f0efeb] border-l border-[rgba(26,26,24,0.14)]">
              <span className="text-base font-semibold text-text-primary">{unit}</span>
            </div>
          </div>
        </div>

        {/* Description */}
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
      </div>

      <div className="flex-1" />
      <SaveButton label={nextLabel} onClick={onNext} />
    </>
  );
}
