import { medStandard, type Priser } from './pricing';
import {
  STANDARD_AI,
  STANDARD_BEDRIFT,
  STANDARD_EKSEMPLER,
  STANDARD_FAQ,
  STANDARD_PERSONVERN,
  STANDARD_TEKSTER,
  STANDARD_VILKAR,
  type AiOppsett,
  type Bedrift,
  type Eksempel,
  type Faq,
  type Tekster,
} from './innhold';

export type Innstillinger = {
  priser: Priser;
  bedrift: Bedrift;
  tekster: Tekster;
  faq: Faq;
  eksempler: Eksempel[];
  vilkar: string;
  personvern: string;
  ai: AiOppsett;
};

/** Slår sammen rader fra tabellen settings med standardverdiene. Brukes både på server og i admin. */
export function slaSammen(rader: Record<string, unknown>): Innstillinger {
  const obj = <T extends object>(k: string, std: T): T =>
    rader[k] && typeof rader[k] === 'object' && !Array.isArray(rader[k]) ? { ...std, ...(rader[k] as object) } : std;
  const arr = <T,>(k: string, std: T[]): T[] => (Array.isArray(rader[k]) ? (rader[k] as T[]) : std);
  const txt = (k: string, std: string): string => (typeof rader[k] === 'string' && rader[k] ? (rader[k] as string) : std);
  return {
    priser: medStandard(rader.priser as Partial<Priser> | undefined),
    bedrift: obj('bedrift', STANDARD_BEDRIFT),
    tekster: obj('tekster', STANDARD_TEKSTER),
    faq: arr('faq', STANDARD_FAQ),
    eksempler: arr('eksempler', STANDARD_EKSEMPLER),
    vilkar: txt('vilkar', STANDARD_VILKAR),
    personvern: txt('personvern', STANDARD_PERSONVERN),
    ai: obj('ai', STANDARD_AI),
  };
}

