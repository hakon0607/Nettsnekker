import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { GlassBackdrop, GlassFx } from '@/components/glass/GlassFx';
import { hentInnstillinger } from '@/lib/settings';

export const revalidate = 60;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { bedrift } = await hentInnstillinger();
  return (
    <>
      <GlassBackdrop />
      <GlassFx />
      <Nav navn={bedrift.navn} />
      <main className="relative">{children}</main>
      <Footer b={bedrift} />
    </>
  );
}
