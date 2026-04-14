"use client";

import { FC } from "react";

interface DataProps {
  data: unknown;
}

const RAINBOW_REPEAT = 10;

const highlightJson = (json: string | unknown) => {
  if (typeof json !== "string") {
    json = JSON.stringify(json, null, 2);
  }

  const lines = String(json).split("\n");

  return lines
    .map((line, index) => {
      // Calculate a hue value for rainbow effect
      const hue = (index * ((360 * RAINBOW_REPEAT) / lines.length)) % 360;

      return line.replace(
        /"(.*?)":\s("(.*?)"|\d+|true|false|null)/g,
        (match: unknown, key: unknown, value: unknown) => {
          return `<span style="color: white">"${key}"</span>: <span style="color: hsl(${hue}, 70%, 50%)">${value}</span>`;
        },
      );
    })
    .join("\n");
};

export const RainbowJSON: FC<DataProps> = ({ data }) => {
  const formattedJson = highlightJson(data);

  return (
    <div className="p-4 bg-black text-white rounded-md shadow-lg overflow-y-scroll overflow-x-scroll max-h-96">
      <button
        onClick={() =>
          navigator.clipboard.writeText(JSON.stringify(data, null, 2))
        }
        className="cursor-pointer border border-orange text-orange rounded-md px-2 py-1 mb-4 flex items-center gap-1 hover:bg-orange/10 transition-colors"
      >
        COPY
      </button>
      <pre className="text-right text-orange font-bold animate-pulse -skew-x-12">
        Guardians
      </pre>
      <pre
        className="overflow-x-auto text-sm leading-relaxed overflow-scroll"
        dangerouslySetInnerHTML={{ __html: formattedJson }}
      />
    </div>
  );
};
