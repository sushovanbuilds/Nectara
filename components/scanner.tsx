"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { buttonClass } from "@/components/ui/button";

/** Accepts a bare code or a full verify URL. */
const toCode = (raw: string) => raw.trim().split("/").filter(Boolean).pop() ?? "";

export function Scanner() {
  const router = useRouter();
  const video = useRef<HTMLVideoElement>(null);
  const [camera, setCamera] = useState<"off" | "on" | "denied">("off");
  const [manual, setManual] = useState("");

  useEffect(() => {
    if (camera !== "on") return;
    let stream: MediaStream | undefined;
    let raf = 0;
    let stopped = false;
    const canvas = document.createElement("canvas");
    (async () => {
      // The decoder (about 130 KB) loads only once someone opens the camera, in parallel with the permission prompt.
      const decoder = import("jsqr");
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      } catch {
        setCamera("denied");
        return;
      }
      const { default: jsQR } = await decoder;
      // Closed while the permission prompt was open: release the camera.
      if (stopped) { stream.getTracks().forEach((t) => t.stop()); return; }
      const v = video.current!;
      v.srcObject = stream;
      await v.play();
      const tick = () => {
        if (stopped) return;
        if (v.readyState === v.HAVE_ENOUGH_DATA) {
          canvas.width = v.videoWidth;
          canvas.height = v.videoHeight;
          const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
          ctx.drawImage(v, 0, 0);
          const hit = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
          if (hit?.data) {
            stopped = true;
            router.push(`/verify/${toCode(hit.data)}`);
            return;
          }
        }
        raf = requestAnimationFrame(tick);
      };
      tick();
    })();
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [camera, router]);

  return (
    <div className="space-y-5">
      {camera === "on" ? (
        <video ref={video} playsInline muted className="aspect-square w-full rounded-[10px] bg-ink object-cover" aria-label="Camera view for scanning a QR code" />
      ) : (
        <button onClick={() => setCamera("on")} className={buttonClass("primary", "lg", "w-full")}>Scan with camera</button>
      )}
      {camera === "denied" && <p role="alert" className="text-sm text-terra">Camera not available. Type the code printed on the jar instead.</p>}
      <form onSubmit={(e) => { e.preventDefault(); const c = toCode(manual); if (c) router.push(`/verify/${c}`); }} className="space-y-2">
        <label className="t-body block" htmlFor="code">Or enter the code on the jar</label>
        <input id="code" value={manual} onChange={(e) => setManual(e.target.value)} placeholder="e.g. AbCdEf123456.…" autoCapitalize="off" autoCorrect="off" className="block min-h-12 w-full rounded-[10px] border border-line2 bg-paper px-4 font-mono text-sm" />
        <button className={buttonClass("secondary", "lg", "w-full")}>Check code</button>
      </form>
    </div>
  );
}
