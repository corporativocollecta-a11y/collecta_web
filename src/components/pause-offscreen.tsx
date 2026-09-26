"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/* Wraps ambient CSS animation and pauses it while the box is off screen, so looping
   background life only costs anything where someone can see it. */
export function PauseOffscreen({
  className,
  style,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => el.toggleAttribute("data-offscreen", !e.isIntersecting),
      { rootMargin: "200px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} style={style} data-offscreen="">
      {children}
    </div>
  );
}
