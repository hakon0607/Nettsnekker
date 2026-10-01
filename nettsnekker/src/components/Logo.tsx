export function Logo({ navn = 'Nettsnekker', className = '' }: { navn?: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 64 64" className="h-8 w-8 shrink-0 drop-shadow-[0_6px_10px_rgba(31,111,92,.35)]" aria-hidden>
        <rect width="64" height="64" rx="16" fill="#1F6F5C" />
        <rect width="64" height="32" rx="16" fill="#fff" opacity=".1" />
        <path d="M18 46V18l28 28V18" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="40" y="10" width="14" height="5" rx="2.5" fill="#F2B33D" transform="rotate(20 47 12)" />
      </svg>
      <span className="font-display text-[19px] font-bold tracking-tight text-ink-900">{navn}</span>
    </span>
  );
}
