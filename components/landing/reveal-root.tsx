"use client";

import { useEffect } from "react";

/**
 * Turns on entrance motion for every `[data-reveal]` element once, from one observer.
 * Nothing is hidden before this runs, and reduced-motion users get no animation at all.
 */
export function RevealRoot() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || typeof IntersectionObserver === "undefined") return;
    const root = document.documentElement;
    root.classList.add("reveal-on");
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }, { rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
    return () => { io.disconnect(); root.classList.remove("reveal-on"); };
  }, []);
  return null;
}
