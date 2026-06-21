import LocationPicker from "@/components/ui/LocationPicker";
import { SaveButton } from "../shared";
import type { LogFormData } from "../types";

type Props = {
  form: LogFormData;
  update: (k: keyof LogFormData, v: unknown) => void;
  onNext: () => void;
  nextLabel: string;
};

export default function RegionStep({ form, update, onNext, nextLabel }: Props) {
  return (
    <>
      <div className="px-5 mt-7 mb-6">
        <h1 className="text-[32px] font-bold text-black">Region</h1>
      </div>

      <div className="flex flex-col gap-5 px-5">
        <div className="flex flex-col gap-2">
          <label className="text-base font-semibold text-text-primary">Where did this happen?</label>
          <LocationPicker
            defaultValue={form.locationResult?.formattedAddress ?? ""}
            onSelect={(place) => update("locationResult", place)}
            placeholder="Find the region"
            className="w-full h-[44px] bg-white border border-[rgba(26,26,24,0.28)] rounded-[8px] px-3 pr-10 text-base text-text-primary placeholder:text-[rgba(26,26,24,0.5)] outline-none"
          />
        </div>
      </div>

      <div className="flex-1" />
      <SaveButton label={nextLabel} onClick={onNext} />
    </>
  );
}
