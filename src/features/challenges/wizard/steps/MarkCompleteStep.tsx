import { SaveButton } from "../shared";

export default function MarkCompleteStep({ onSubmit }: { onSubmit: () => void }) {
  return (
    <>
      <div className="px-5 mt-7 mb-6">
        <h1 className="text-[32px] font-bold text-black leading-tight">Mark Complete</h1>
        <p className="text-[18px] text-black mt-2">Confirm this step is done.</p>
      </div>
      <div className="flex-1" />
      <SaveButton label="Mark Complete" onClick={onSubmit} />
    </>
  );
}
