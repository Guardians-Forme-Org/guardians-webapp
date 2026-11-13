"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";

// Pull distance (after resistance) that triggers a refresh, and the most it moves
const TRIGGER = 70;
const MAX = 110;

// True when the page is scrolled to the top and the touch didn't start in
// something with its own drag or scroll: a map, a sheet or a scrolled list
function canPull(target: EventTarget | null, scroller: HTMLElement | null): boolean {
  if (window.scrollY > 0 || (scroller?.scrollTop ?? 0) > 0) return false;
  for (let el = target as HTMLElement | null; el && el !== scroller; el = el.parentElement) {
    if (el.scrollTop > 0 || el.classList.contains("gm-style")) return false;
    if (getComputedStyle(el).position === "fixed") return false;
  }
  return true;
}

// Pull down at the top of a page to reload everything on it. Installed apps
// get no browser pull-to-refresh, so the app provides its own.
export default function PullToRefresh({
  scrollerRef,
  enabled,
}: {
  scrollerRef: RefObject<HTMLElement | null>;
  enabled: boolean;
}) {
  const queryClient = useQueryClient();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const pullRef = useRef(0);
  const busy = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    const setDistance = (d: number) => {
      pullRef.current = d;
      setPull(d);
    };
    const onStart = (e: TouchEvent) => {
      startY.current =
        !busy.current && e.touches.length === 1 && canPull(e.target, scrollerRef.current)
          ? e.touches[0].clientY
          : null;
    };
    const onMove = (e: TouchEvent) => {
      if (startY.current === null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) {
        if (pullRef.current) setDistance(0);
        return;
      }
      setDistance(Math.min(MAX, dy * 0.5));
      if (e.cancelable) e.preventDefault();
    };
    const onEnd = () => {
      if (startY.current === null) return;
      startY.current = null;
      const triggered = pullRef.current >= TRIGGER;
      setDistance(0);
      if (!triggered) return;
      busy.current = true;
      setRefreshing(true);
      queryClient.invalidateQueries().finally(() => {
        busy.current = false;
        setRefreshing(false);
      });
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
    document.addEventListener("touchcancel", onEnd);
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onEnd);
    };
  }, [enabled, queryClient, scrollerRef]);

  if (!pull && !refreshing) return null;
  const offset = refreshing ? TRIGGER - 30 : Math.max(pull - 30, 0);

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center"
      style={{ transform: `translateY(${offset}px)` }}
    >
      <div className="size-9 rounded-full bg-white shadow-md flex items-center justify-center">
        <RefreshCw
          size={18}
          className={`text-gotf-green ${refreshing ? "animate-spin" : ""}`}
          style={refreshing ? undefined : { transform: `rotate(${pull * 3}deg)`, opacity: Math.min(1, pull / TRIGGER) }}
        />
      </div>
    </div>
  );
}
