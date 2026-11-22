import type { MetadataRoute } from "next";

// The hosted demo is private: no crawler may fetch any page. Every response also carries
// X-Robots-Tag: noindex, nofollow (next.config.ts), which keeps out pages a crawler reaches through outside links.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
