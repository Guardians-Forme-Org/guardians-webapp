"use client";

type Props = {
  question: string;
  options: { value: string; label: string }[];
  selected: string | null;
  onSelect: (value: string) => void;
};

export function GuidedFinderStep({ question, options, selected, onSelect }: Props) {
  return (
    <div className="space-y-4">
      <p className="font-medium text-sm">{question}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              selected === opt.value
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
