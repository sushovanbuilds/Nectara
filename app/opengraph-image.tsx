import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Nectara: proof in every jar. A phone shows a verified honey label with separate lab evidence and record seal.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Self-hosted WOFF copies of the brand fonts (the renderer cannot read WOFF2).
const font = (f: string) => readFile(join(process.cwd(), "assets/og", f));

const row = (title: string, chip: string, bg: string, fg: string) => (
  <div style={{ display: "flex", flexDirection: "column", background: "#FCFAF5", border: "1px solid #E2D8C6", borderRadius: 14, padding: "14px 16px", marginTop: 12 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontFamily: "Fraunces", fontSize: 24, color: "#1F1D1A", whiteSpace: "nowrap" }}>{title}</span>
      <span style={{ display: "flex", background: bg, color: fg, borderRadius: 999, padding: "4px 12px", fontSize: 15, fontFamily: "Inter", whiteSpace: "nowrap" }}>{chip}</span>
    </div>
  </div>
);

export default async function Image() {
  const [fraunces, frauncesItalic, inter] = await Promise.all([font("Fraunces-400.woff"), font("Fraunces-400-italic.woff"), font("Inter-500.woff")]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#F6F1E7", padding: "64px 72px", position: "relative" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 640 }}>
          <div style={{ display: "flex", fontFamily: "Fraunces", fontSize: 44, color: "#1F1D1A" }}>Nectara</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontFamily: "Fraunces", fontSize: 92, lineHeight: 1, color: "#1F1D1A", letterSpacing: -2 }}>Proof in</div>
            <div style={{ display: "flex", fontFamily: "Fraunces", fontStyle: "italic", fontSize: 92, lineHeight: 1.05, color: "#8A5410", letterSpacing: -2 }}>every jar.</div>
            <div style={{ display: "flex", fontFamily: "Inter", fontSize: 28, color: "#5F594F", marginTop: 28 }}>Verified honey, from hive to shelf.</div>
          </div>
          <div style={{ display: "flex", fontFamily: "Inter", fontSize: 20, color: "#6F685C" }}>Lab evidence and record seal, never mixed.</div>
        </div>
        <div style={{ display: "flex", position: "absolute", right: 70, top: 120, width: 360, height: 360, borderRadius: 999, background: "#B8741A" }} />
        <div style={{ display: "flex", flexDirection: "column", position: "absolute", right: 150, top: 56, width: 330, height: 560, background: "#1F1D1A", borderRadius: 52, padding: 14, transform: "rotate(-4deg)" }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, background: "#F6F1E7", borderRadius: 40, padding: "48px 18px 18px" }}>
            <div style={{ display: "flex", flexDirection: "column", background: "#E1E8DA", borderRadius: 14, padding: "16px 18px" }}>
              <span style={{ fontFamily: "Fraunces", fontSize: 30, color: "#4F6B48" }}>Label verified</span>
              <span style={{ fontFamily: "Inter", fontSize: 15, color: "#4F6B48", marginTop: 4, whiteSpace: "nowrap" }}>HC-2026-00124 · sample data</span>
            </div>
            {row("Lab evidence", "In progress", "#F6E6C8", "#8A5410")}
            {row("Record seal", "Intact", "#E1E8DA", "#4F6B48")}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Fraunces", data: fraunces, style: "normal", weight: 400 },
        { name: "Fraunces", data: frauncesItalic, style: "italic", weight: 400 },
        { name: "Inter", data: inter, style: "normal", weight: 500 },
      ],
    },
  );
}
