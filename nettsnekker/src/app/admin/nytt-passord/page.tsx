'use client';

import { useEffect, useState } from 'react';
import { getBrowserClient } from '@/lib/supabase/client';
import { GlassBackdrop } from '@/components/glass/GlassFx';
import { Logo } from '@/components/Logo';

export default function NyttPassord() {
  const sb = getBrowserClient();
  const [passord, setPassord] = useState('');
  const [klar, setKlar] = useState(false);
  const [melding, setMelding] = useState('');
  const [feil, setFeil] = useState('');

  useEffect(() => {
    if (!sb) return;
    const { data } = sb.auth.onAuthStateChange((e) => {
      if (e === 'PASSWORD_RECOVERY' || e === 'SIGNED_IN') setKlar(true);
    });
    sb.auth.getSession().then(({ data: s }) => s.session && setKlar(true));
    return () => data.subscription.unsubscribe();
  }, [sb]);

  const lagre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sb) return;
    const { error } = await sb.auth.updateUser({ password: passord });
    if (error) return setFeil(error.message);
    setMelding('Passordet er endret.');
    setTimeout(() => (location.href = '/admin'), 1200);
  };

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <GlassBackdrop />
      <form onSubmit={lagre} className="glass w-full max-w-sm rounded-[28px] p-8">
        <Logo />
        <h1 className="mt-6 text-2xl">Nytt passord</h1>
        {!klar ? (
          <p className="mt-3 text-ink-600">Åpne lenken fra e-posten for å lage nytt passord.</p>
        ) : (
          <>
            <input className="field mt-5" type="password" minLength={6} required placeholder="Nytt passord" value={passord} onChange={(e) => setPassord(e.target.value)} autoComplete="new-password" />
            {feil && <p className="mt-3 text-sm text-red-600">{feil}</p>}
            {melding && <p className="mt-3 text-sm text-gran-700">{melding}</p>}
            <button className="btn-primary mt-5 w-full">Lagre passord</button>
          </>
        )}
      </form>
    </div>
  );
}
