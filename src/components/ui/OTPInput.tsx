"use client";

import { Fragment, useRef, useState } from "react";

type Props = { onChange?: (val: string) => void };

export default function OTPInput({ onChange }: Props) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));

  const update = (i: number, raw: string) => {
    const char = raw.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = char;
    setDigits(next);
    onChange?.(next.join(""));
    if (char && i < 5) refs.current[i + 1]?.focus();
  };

  const onKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  return (
    <div className="flex items-center gap-2.5 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <Fragment key={i}>
          {i === 3 && <span className="text-text-muted text-lg mx-0.5">–</span>}
          <input
            ref={(el) => { refs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digits[i]}
            onChange={(e) => update(i, e.target.value)}
            onKeyDown={(e) => onKey(i, e)}
            className="w-12 h-12 border border-[#d9d9d9] rounded-[8px] text-center text-xl font-medium outline-none focus:border-gotf-green transition-colors"
          />
        </Fragment>
      ))}
    </div>
  );
}
