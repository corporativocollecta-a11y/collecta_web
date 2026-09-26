import type { MetadataRoute } from "next";

const SITE = "https://collectaproduce.com";

export default function sitemap(): MetadataRoute.Sitemap {
  // the home page in both languages (English at the root), plus the Spanish legal pages
  const languages = { en: `${SITE}/`, es: `${SITE}/es` };
  return [
    { url: `${SITE}/`, changeFrequency: "monthly", priority: 1, alternates: { languages } },
    { url: `${SITE}/es`, changeFrequency: "monthly", priority: 0.9, alternates: { languages } },
    { url: `${SITE}/privacidad`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE}/terminos`, changeFrequency: "yearly", priority: 0.4 },
  ];
}
