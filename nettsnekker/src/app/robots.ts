import type { MetadataRoute } from 'next';
import { sideUrl } from '@/lib/settings';

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/bestilt', '/takk'] }], sitemap: `${sideUrl()}/sitemap.xml` };
}
