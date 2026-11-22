"use client";

import { useEffect, useState } from "react";

const EVENT = "nectara:toast";

/** Brief success message. Pair it with an inline change on the page; never use a modal for routine success. */
export const toast = (message: string) => window.dispatchEvent(new CustomEvent(EVENT, { detail: message }));

export function Toaster() {
  const [items, setItems] = useState<{ id: number; message: string }[]>([]);
  useEffect(() => {
    const on = (e: Event) => {
      const id = Date.now() + Math.random();
      setItems((xs) => [...xs, { id, message: (e as CustomEvent<string>).detail }]);
      setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 4000);
    };
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6">
      {items.map((t) => (
        <p key={t.id} className="t-small pointer-events-auto rounded-[10px] bg-ink px-4 py-3 text-ivory">{t.message}</p>
      ))}
    </div>
  );
}
