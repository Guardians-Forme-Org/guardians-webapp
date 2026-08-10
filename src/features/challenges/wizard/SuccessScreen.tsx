import { useState } from "react";
import { Download, Link2 } from "lucide-react";

type Props = {
  joinLink: string;
  onDone: () => void;
};

export default function SuccessScreen({ joinLink, onDone }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(joinLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-dvh bg-white relative overflow-hidden">
      <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[rgba(86,192,43,0.08)] pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 relative z-10">
        <div className="size-12 rounded-full border-2 border-gotf-green flex items-center justify-center mb-8">
          <div className="size-5 rounded-full bg-gotf-green" />
        </div>

        <h1 className="text-[32px] font-bold text-gotf-green leading-tight mb-4">
          Activity Uploaded
        </h1>
        <p className="text-base text-[#5c5c59] leading-snug max-w-xs">
          Copy and share this link to invite people to join this challenge
        </p>

        <div className="w-full mt-8 flex flex-col gap-3">
          {joinLink && (
            <button
              onClick={handleCopy}
              className="w-full border border-[rgba(26,26,24,0.14)] rounded-[12px] p-4 flex items-center gap-3 text-left"
            >
              <Link2 size={20} className="text-[#8f8f8c] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-text-primary">
                  {copied ? "Copied!" : "Copy invitation link"}
                </p>
                <p className="text-sm text-[#8f8f8c] truncate">{joinLink}</p>
              </div>
            </button>
          )}
          <button className="w-full border border-[rgba(26,26,24,0.14)] rounded-[12px] p-4 flex items-center gap-3">
            <Download size={20} className="text-[#8f8f8c] shrink-0" />
            <p className="text-base font-semibold text-text-primary">Circle Details PDF</p>
          </button>
        </div>
      </div>

      <div className="px-5 pb-8 shrink-0 relative z-10">
        <button
          onClick={onDone}
          className="w-full h-14 bg-black text-white rounded-full text-xl font-medium"
        >
          Done
        </button>
      </div>
    </div>
  );
}
