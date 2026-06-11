"use client";

import { useState, type KeyboardEvent } from "react";
import { Search } from "lucide-react";

type Props = {
  placeholder?: string;
  defaultValue?: string;
  onSubmit?: (value: string) => void;
};

export default function SearchBar({
  placeholder = "Find challenges and circles near you",
  defaultValue = "",
  onSubmit,
}: Props) {
  const [value, setValue] = useState(defaultValue);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onSubmit?.(value);
  };

  return (
    <div className="mx-5 mb-3">
      <div className="flex items-center gap-2 bg-white shadow-sm rounded-full px-4 py-3">
        <Search size={15} className="text-text-muted shrink-0" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
        />
      </div>
    </div>
  );
}
