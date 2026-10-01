/** Enkel Markdown → HTML for vilkår og personvern (##, ###, -, **fet**, lenker). */
export function markdownTilHtml(md: string): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (s: string) =>
    esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[(.+?)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g, '<a href="$2">$1</a>');
  const ut: string[] = [];
  let liste: string[] = [];
  const tomListe = () => {
    if (liste.length) ut.push(`<ul>${liste.map((l) => `<li>${inline(l)}</li>`).join('')}</ul>`);
    liste = [];
  };
  let avsnitt: string[] = [];
  const tomAvsnitt = () => {
    if (avsnitt.length) ut.push(`<p>${inline(avsnitt.join(' '))}</p>`);
    avsnitt = [];
  };
  for (const raw of md.replace(/\r/g, '').split('\n')) {
    const l = raw.trimEnd();
    if (/^###\s/.test(l)) { tomAvsnitt(); tomListe(); ut.push(`<h3>${inline(l.slice(4))}</h3>`); }
    else if (/^##\s/.test(l)) { tomAvsnitt(); tomListe(); ut.push(`<h2>${inline(l.slice(3))}</h2>`); }
    else if (/^\s*-\s/.test(l)) { tomAvsnitt(); liste.push(l.replace(/^\s*-\s/, '')); }
    else if (!l.trim()) { tomAvsnitt(); tomListe(); }
    else { tomListe(); avsnitt.push(l.trim()); }
  }
  tomAvsnitt();
  tomListe();
  return ut.join('\n');
}
