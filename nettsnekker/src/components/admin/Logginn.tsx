'use client';

import { useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Logo } from '../Logo';

export function Logginn({ sb, feil: tilgangsfeil }: { sb: SupabaseClient | null; feil: string }) {
  const [epost, setEpost] = useState('');
  const [passord, setPassord] = useState('');
  const [modus, setModus] = useState<'inn' | 'ny' | 'glemt'>('inn');
  const [laster, setLaster] = useState(false);
  const [melding, setMelding] = useState('');
  const [feil, setFeil] = useState('');

  if (!sb) {
    return (
      <div className="grid min-h-screen place-items-center p-4">
        <div className="glass max-w-md rounded-[28px] p-8">
          <Logo />
          <h1 className="mt-6 text-2xl">Supabase er ikke koblet til</h1>
          <p className="mt-2 text-ink-600">
            Legg inn <code>NEXT_PUBLIC_SUPABASE_URL</code> og <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> i Vercel og deploy på nytt. Se OPPSETT.md.
          </p>
        </div>
      </div>
    );
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setLaster(true);
    setFeil('');
    setMelding('');
    try {
      if (modus === 'inn') {
        const { error } = await sb.auth.signInWithPassword({ email: epost, password: passord });
        if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Feil e-post eller passord.' : error.message);
      } else if (modus === 'ny') {
        const { error } = await sb.auth.signUp({ email: epost, password: passord, options: { emailRedirectTo: `${location.origin}/admin` } });
        if (error) throw new Error(error.message);
        setMelding('Kontoen er laget. Sjekk e-posten din hvis Supabase ber deg bekrefte adressen, og logg så inn.');
        setModus('inn');
      } else {
        const { error } = await sb.auth.resetPasswordForEmail(epost, { redirectTo: `${location.origin}/admin/nytt-passord` });
        if (error) throw new Error(error.message);
        setMelding('Hvis e-posten finnes, har vi sendt deg en lenke for å lage nytt passord.');
      }
    } catch (err) {
      setFeil(err instanceof Error ? err.message : 'Noe gikk galt');
    } finally {
      setLaster(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <form onSubmit={send} className="glass w-full max-w-sm rounded-[28px] p-7 sm:p-8">
        <Logo />
        <h1 className="mt-6 text-2xl">{modus === 'inn' ? 'Logg inn' : modus === 'ny' ? 'Lag admin-konto' : 'Glemt passord'}</h1>
        {tilgangsfeil && (
          <p className="mt-3 rounded-xl bg-harpiks-100 px-3 py-2 text-sm text-ink-800">
            {tilgangsfeil}{' '}
            <button type="button" className="font-semibold underline" onClick={() => sb.auth.signOut()}>
              Logg ut
            </button>
          </p>
        )}
        <div className="mt-5 space-y-3">
          <input className="field" type="email" placeholder="E-post" value={epost} onChange={(e) => setEpost(e.target.value)} required autoComplete="email" />
          {modus !== 'glemt' && (
            <input className="field" type="password" placeholder="Passord" value={passord} onChange={(e) => setPassord(e.target.value)} required minLength={6} autoComplete={modus === 'ny' ? 'new-password' : 'current-password'} />
          )}
        </div>
        {feil && <p className="mt-3 text-sm text-red-600">{feil}</p>}
        {melding && <p className="mt-3 text-sm text-gran-700">{melding}</p>}
        <button className="btn-primary mt-5 w-full" disabled={laster}>
          {laster ? 'Vent …' : modus === 'inn' ? 'Logg inn' : modus === 'ny' ? 'Lag konto' : 'Send lenke'}
        </button>
        <div className="mt-4 flex justify-between text-sm">
          <button type="button" className="text-ink-500 hover:text-gran-700" onClick={() => setModus(modus === 'glemt' ? 'inn' : 'glemt')}>
            {modus === 'glemt' ? 'Tilbake' : 'Glemt passord?'}
          </button>
          {modus !== 'glemt' && (
            <button type="button" className="text-ink-500 hover:text-gran-700" onClick={() => setModus(modus === 'ny' ? 'inn' : 'ny')}>
              {modus === 'ny' ? 'Har konto' : 'Første gang?'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
