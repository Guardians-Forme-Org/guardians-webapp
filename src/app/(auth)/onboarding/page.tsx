"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, X, Leaf, Waves } from "lucide-react";

// ── Slide data ─────────────────────────────────────────────────────────────────

const slides = [
  {
    bg: "#003818",
    gradient: "linear-gradient(170deg, #003818 0%, #004d20 60%, #003010 100%)",
    Icon: Leaf,
    customIcon: null,
    title: ["Become a", "Guardian"],
    body: "Turn your eco-intentions into real-world impact. Join a global community taking measurable action to protect our shared home, footprint by footprint.",
    cta: false,
  },
  {
    bg: "#001440",
    gradient: "linear-gradient(170deg, #00113a 0%, #001f5c 50%, #000c28 100%)",
    Icon: Waves,
    customIcon: null,
    title: ["Act", "Together"],
    body: "Team up in Circles to tackle clear environmental challenges. Together, structure drives real change.",
    cta: false,
  },
  {
    bg: "#c87020",
    gradient: "linear-gradient(170deg, #d47a25 0%, #c06818 60%, #a85510 100%)",
    Icon: null,
    customIcon: (
      <svg width="44" height="32" viewBox="0 0 44 32" fill="none">
        <path d="M2 30 Q22 2 42 30" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
      </svg>
    ),
    title: ["Have an", "Impact"],
    body: "Complete challenges, log simple evidence, and see your verified efforts fuel your Circle's goals.",
    cta: true,
  },
] as const;

// ── Component ──────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const slide = slides[idx];

  const next = () => {
    if (idx < slides.length - 1) setIdx((i) => i + 1);
    else router.push("/get-started");
  };

  const skip = () => router.push("/get-started");

  const { Icon, customIcon } = slide;

  return (
    <div
      className="min-h-dvh relative flex flex-col select-none"
      style={{ background: slide.gradient }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-10 pt-10">
        <img
          src="/images/Guardians Logo-logo.png"
          alt=""
          className="w-8 h-8 object-contain"
          style={{ filter: "brightness(0) invert(1) opacity(0.9)" }}
        />
        <button onClick={skip} aria-label="Skip" className="text-white/60">
          <X size={22} />
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 px-10 pt-12">
        {Icon ? (
          <Icon size={40} className="text-white mb-7" strokeWidth={1.5} />
        ) : (
          <div className="mb-7">{customIcon}</div>
        )}

        <h1 className="text-[60px] font-bold text-white leading-[1.05]">
          {slide.title[0]}
          <br />
          {slide.title[1]}
        </h1>

        <p className="text-[#e6e6e6] text-xl mt-6 leading-relaxed tracking-[0.2px] w-[322px]">
          {slide.body}
        </p>
      </div>

      {/* Bottom actions */}
      <div className="flex flex-col items-center gap-5 pb-16 px-5">
        {slide.cta ? (
          <button
            onClick={next}
            className="w-[338px] h-14 rounded-full text-white text-xl font-medium"
            style={{ backgroundColor: "#fd9742" }}
          >
            Get Started
          </button>
        ) : (
          <button
            onClick={next}
            className="size-12 rounded-full border-2 border-white flex items-center justify-center"
            aria-label="Next"
          >
            <ArrowRight size={22} className="text-white" />
          </button>
        )}

        {/* Dot indicators */}
        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === idx ? "w-7 h-2.5 bg-white" : "size-2.5 bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
