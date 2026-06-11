"use client";

import { type LucideIcon, ArrowRight, Leaf, Waves, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

type Slide = {
  bg: string;
  bgImage?: string;
  iconSrc?: string;
  Icon?: LucideIcon;
  iconAlign: "left" | "center";
  iconPosition: "before-text" | "after-text";
  textPosition: "top" | "bottom";
  title: [string, string];
  body: string;
  cta: boolean;
};

// ── Slide data ─────────────────────────────────────────────────────────────────

const slides: Slide[] = [
  {
    bg: "#013818",
    bgImage: "/images/onb1.png",
    Icon: Leaf,
    iconAlign: "center",
    iconPosition: "after-text",
    textPosition: "top",
    title: ["Become a", "Guardian"],
    body: "Turn your eco-intentions into real-world impact. Join a global community taking measurable action to protect our shared home, footprint by footprint.",
    cta: false,
  },
  {
    bg: "#2C709B",
    bgImage: "/images/onb2.png",
    Icon: Waves,
    iconAlign: "left",
    iconPosition: "before-text",
    textPosition: "bottom",
    title: ["Act", "Together"],
    body: "Team up in Circles to tackle clear environmental challenges. Together, structure drives real change.",
    cta: false,
  },
  {
    bg: "#FD9742",
    bgImage: "/images/onb3.png",
    Icon: Leaf,
    iconAlign: "center",
    iconPosition: "before-text",
    textPosition: "bottom",
    title: ["Have an", "Impact"],
    body: "Complete challenges, log simple evidence, and see your verified efforts fuel your Circle's goals.",
    cta: true,
  },
];

// ── Icon renderer ──────────────────────────────────────────────────────────────

function SlideIcon({
  slide,
  position,
}: {
  slide: Slide;
  position: "before-text" | "after-text";
}) {
  const { iconSrc, Icon, iconAlign } = slide;
  if (!iconSrc && !Icon) return null;

  const margin = position === "before-text" ? "mb-7" : "mt-7";
  const wrapper =
    iconAlign === "center" ? `${margin} flex justify-center` : margin;

  if (iconSrc) {
    return (
      <div className={wrapper}>
        <img src={iconSrc} alt="" className="w-10 h-10 object-contain" />
      </div>
    );
  }

  const Comp = Icon!;
  return (
    <div className={wrapper}>
      <Comp size={40} className="text-white" strokeWidth={1.5} />
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [bgLoaded, setBgLoaded] = useState(false);
  const slide = slides[idx];

  const next = () => {
    setBgLoaded(false);
    if (idx < slides.length - 1) setIdx((i) => i + 1);
    else router.push("/get-started");
  };

  const skip = () => router.push("/get-started");

  const contentClass =
    slide.textPosition === "top"
      ? "relative z-10 flex-1 flex flex-col px-10 pt-12"
      : "relative z-10 flex-1 flex flex-col justify-end px-10 pb-10";

  return (
    <div
      className="min-h-dvh relative flex flex-col select-none overflow-hidden"
      style={{ backgroundColor: slide.bg }}
    >
      {slide.bgImage && (
        <>
          <img
            src={slide.bgImage}
            alt=""
            aria-hidden
            onLoad={() => setBgLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-300 ${bgLoaded ? "opacity-100" : "opacity-0"}`}
          />
          <div className="absolute inset-0 bg-black/20" />
        </>
      )}

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-10 pt-10">
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
      <div className={contentClass}>
        {slide.iconPosition === "before-text" && (
          <SlideIcon slide={slide} position="before-text" />
        )}

        <h1 className="text-[60px] font-bold text-white leading-[1.05]">
          {slide.title[0]}
          <br />
          {slide.title[1]}
        </h1>

        <p className="text-[#e6e6e6] text-xl mt-6 leading-relaxed tracking-[0.2px] w-80.5">
          {slide.body}
        </p>

        {slide.iconPosition === "after-text" && (
          <SlideIcon slide={slide} position="after-text" />
        )}
      </div>

      {/* Bottom actions */}
      <div className="relative z-20 flex flex-col items-center gap-8 pb-16 pt-8 px-5">
        {slide.cta ? (
          <button
            onClick={next}
            className="w-84.5 h-14 rounded-full text-white text-xl font-medium"
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
                i === idx ? "w-7 h-2.5" : "size-2.5 bg-white/40"
              }`}
              style={{ backgroundColor: i === idx ? slides[i].bg : "" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
