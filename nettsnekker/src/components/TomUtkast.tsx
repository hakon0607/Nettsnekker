'use client';

import { useEffect } from 'react';
import { UTKAST_NOKKEL } from './Kalkulator';

/** Sletter det lagrede bestillingsutkastet når bestillingen er sendt. */
export function TomUtkast() {
  useEffect(() => {
    try {
      localStorage.removeItem(UTKAST_NOKKEL);
    } catch {
      /* ignorer */
    }
  }, []);
  return null;
}
