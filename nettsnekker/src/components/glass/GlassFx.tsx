'use client';

import { useEffect, useRef } from 'react';

const GLASS = '.glass,.btn,.glass-nav,.glass-soft';

/**
 * Oppførselen til liquid glass:
 * - ekte lysbrytning i Chrome/Edge
 * - speilblink som følger musa
 * - magnetiske knapper ([data-mag])
 * - fremdriftslinje øverst
 */
export function GlassFx() {
  const rail = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const brands: { brand: string }[] =
      (navigator as unknown as { userAgentData?: { brands: { brand: string }[] } }).userAgentData?.brands ?? [];
    if (brands.some((b) => /Chromium|Google Chrome|Microsoft Edge/.test(b.brand))) {
      document.documentElement.classList.add('refract');
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let current: HTMLElement | null = null;
    let spec: HTMLElement | null = null;

    const getSpec = (el: HTMLElement) => {
      let s = el.querySelector<HTMLElement>(':scope > .spec');
      if (!s) {
        s = document.createElement('span');
        s.className = 'spec';
        s.setAttribute('aria-hidden', 'true');
        el.appendChild(s);
      }
      return s;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(GLASS) ?? null;
      if (target !== current) {
        spec?.classList.remove('on');
        current = target;
        spec = target ? getSpec(target) : null;
        spec?.classList.add('on');
      }
      if (current && spec) {
        const r = current.getBoundingClientRect();
        spec.style.setProperty('--sx', `${e.clientX - r.left}px`);
        spec.style.setProperty('--sy', `${e.clientY - r.top}px`);
      }
      if (!reduce) {
        const mag = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-mag]');
        document.querySelectorAll<HTMLElement>('[data-mag].is-mag').forEach((m) => {
          if (m !== mag) {
            m.classList.remove('is-mag');
            m.style.transform = '';
          }
        });
        if (mag) {
          const r = mag.getBoundingClientRect();
          mag.classList.add('is-mag');
          mag.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.2}px,${(e.clientY - r.top - r.height / 2) * 0.28}px)`;
        }
      }
    };

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        if (rail.current) rail.current.style.transform = `scaleX(${h > 0 ? window.scrollY / h : 0})`;
      });
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={rail} className="scroll-rail" aria-hidden />;
}

/** Fargerik bakgrunn + SVG-filteret som gir lysbrytning i glasset. */
export function GlassBackdrop() {
  return (
    <>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <filter id="lg-refract" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.010" numOctaves={2} seed={7} result="n" />
          <feGaussianBlur in="n" stdDeviation="3" result="nb" />
          <feDisplacementMap in="SourceGraphic" in2="nb" scale="40" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <div className="aurora" aria-hidden>
        <i className="a1" />
        <i className="a2" />
        <i className="a3" />
        <i className="a4" />
        <i className="a5" />
        <div className="grain" />
      </div>
    </>
  );
}
