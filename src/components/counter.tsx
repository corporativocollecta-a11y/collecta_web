"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

type CounterProps = { to: number; prefix?: string; suffix?: string };

const fmt = (v: number) => Math.round(v).toLocaleString("en-US");

export function Counter({ to, prefix = "", suffix = "" }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();

  // SSR renders the real number; zero it on mount so the count-up starts clean.
  // The count writes straight to the text node: no re-render per frame.
  useEffect(() => {
    if (!reduce && num.current) num.current.textContent = fmt(0);
  }, [reduce]);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, to, {
      duration: 1.4,
      ease: [0.23, 1, 0.32, 1],
      onUpdate: (v) => {
        if (num.current) num.current.textContent = fmt(v);
      },
    });
    return () => controls.stop();
  }, [inView, reduce, to]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      <span ref={num}>{fmt(to)}</span>
      {suffix}
    </span>
  );
}
