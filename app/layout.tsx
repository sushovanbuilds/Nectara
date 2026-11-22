import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

const fraunces = localFont({
  src: [{ path: "./fonts/Fraunces.woff2", style: "normal" }, { path: "./fonts/Fraunces-Italic.woff2", style: "italic" }],
  variable: "--font-fraunces", weight: "100 900", display: "swap",
});
const inter = localFont({ src: "./fonts/Inter.woff2", variable: "--font-inter", weight: "100 900", display: "swap" });

const DESCRIPTION = "Honey traceability and smart beekeeping. Scan the QR on a jar to see which hives the honey came from, who handled it after harvest, and whether a lab tested that exact batch.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Nectara: proof in every jar",
  description: DESCRIPTION,
  applicationName: "Nectara",
  openGraph: { type: "website", siteName: "Nectara", title: "Nectara: proof in every jar", description: DESCRIPTION, locale: "en_IN" },
  twitter: { card: "summary_large_image", title: "Nectara: proof in every jar", description: DESCRIPTION },
  // Private demo: never indexed. Backed by robots.txt and an X-Robots-Tag header on every response.
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } },
};

export const viewport = { themeColor: "#F6F1E7" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <a href="#main" className="sr-only rounded-[10px] bg-ink px-4 py-2 text-ivory focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50">Skip to main content</a>
        {children}
      </body>
    </html>
  );
}
