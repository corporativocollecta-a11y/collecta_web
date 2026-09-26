"use client";

import { useEffect } from "react";

/* First-visit intro: the isotipo lands in the middle of a plain brand screen, the name
   unfolds beside it, then the screen lifts off the hero (~2 s in all). Whether it runs is
   decided before first paint by a tiny script in the layout (first visit, motion welcome),
   which sets html[data-intro]; without it this markup is display:none, so the server and
   client render the same thing. Any click, key, wheel or touch skips it. */

export function HeroIntro() {
  useEffect(() => {
    const html = document.documentElement;
    if (!html.hasAttribute("data-intro")) return;
    const skip = () => {
      // only while the intro screen is still fully up: once it starts lifting, the hero
      // is already on its way and restarting it would flicker
      const el = document.querySelector<HTMLElement>(".intro");
      if (!el || Number(getComputedStyle(el).opacity) < 0.99) return;
      html.setAttribute("data-intro-ready", "");
      html.setAttribute("data-intro", "skip");
    };
    const opts = { once: true, passive: true } as const;
    const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    events.forEach((e) => addEventListener(e, skip, opts));
    return () => events.forEach((e) => removeEventListener(e, skip));
  }, []);

  return (
    <div className="intro" aria-hidden>
      <div className="intro-logo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/isotipo.png" alt="" width={79} height={48} className="intro-mark" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logotipo-word.png" alt="" width={140} height={29} className="intro-word" />
      </div>
    </div>
  );
}
