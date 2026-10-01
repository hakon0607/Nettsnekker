import type { MetadataRoute } from 'next';
import { sideUrl } from '@/lib/settings';

export default function sitemap(): MetadataRoute.Sitemap {
  const u = sideUrl();
  return ['', '/bestill', '/vilkar', '/personvern'].map((s) => ({ url: `${u}${s}`, changeFrequency: 'weekly', priority: s === '' ? 1 : 0.6 }));
}
