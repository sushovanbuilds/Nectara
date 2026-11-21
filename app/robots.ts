import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // Individual verify results are personal scans and stay out of search (they also carry noindex).
    rules: { userAgent: "*", allow: ["/", "/verify$", "/login"], disallow: ["/api/", "/design", "/verify/", "/dashboard", "/hives", "/batches", "/harvests", "/lab", "/custody", "/shipments", "/risk", "/incidents", "/admin"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
