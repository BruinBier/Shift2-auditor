'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import type { Change, Owner } from '@/lib/project-excel';

type Preview = { changes: Change[]; owners: Owner[]; token: string };
const labels = { name: 'Projectnaam', opdrachtgeverId: 'Opdrachtgever', projectnummer: 'CRM-projectnummer', cardanKenmerk: 'Cardan-kenmerk' };
const fields = ['name', 'opdrachtgeverId', 'projectnummer', 'cardanKenmerk'] as const;
export default function ProjectExcelPage() {
  const router = useRouter();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('alle');
  const input = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const clear = () => { setPreview(null); setErrors([]); setMessage(''); };
  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clear();
    const file = input.current?.files?.[0];
    if (!file || file.size > 5 * 1024 * 1024 || !file.name.toLowerCase().endsWith('.xlsx')) { setErrors(['Kies een .xlsx-bestand van maximaal 5 MB.']); return; }
    setBusy(true);
    try {
      const form = new FormData(); form.append('file', file);
      const response = await fetch('/api/client-projects/excel', { method: 'POST', body: form });
      const result = await response.json();
      if (!response.ok) { setErrors(result.errors || [result.error]); return; }
      setFilter('alle'); setPreview(result);
      requestAnimationFrame(() => heading.current?.focus());
    } catch { setErrors(['Het controlevoorbeeld kon niet worden geladen. Er is niets toegepast. Probeer opnieuw.']); }
    finally { setBusy(false); }
  }
  async function apply() {
    if (!preview || busy) return;
    setBusy(true); setErrors([]);
    try {
      const response = await fetch('/api/client-projects/excel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'apply', token: preview.token }) });
      const result = await response.json();
      setPreview(null);
      if (!response.ok) { setErrors(result.errors || [result.error]); return; }
      setMessage(`Opgeslagen: ${result.added} toegevoegd, ${result.changed} gewijzigd, ${result.unchanged} ongewijzigd.`);
      if (input.current) input.current.value = '';
      router.refresh();
    } catch {
      setPreview(null);
      setErrors(['De verbinding is verbroken. Controleer het projectenoverzicht en exporteer opnieuw om vast te stellen of alles is opgeslagen.']);
    } finally { setBusy(false); }
  }
  const display = (field: typeof fields[number], value: string | null) => {
    if (value === null) return '(leeg)';
    if (field === 'opdrachtgeverId') { const owner = preview?.owners.find(o => o.id === value); return owner ? `${owner.kenmerk} — ${owner.naam} (${value})` : value; }
    return value;
  };
  const additions = preview?.changes.filter(c => c.kind === 'toegevoegd').length || 0;
  const modifications = preview?.changes.filter(c => c.kind === 'gewijzigd').length || 0;
  return <main className="min-h-screen bg-gray-50 p-8">
    <div className="max-w-[1400px] mx-auto space-y-6">
      <Link href="/admin/projecten" className="text-shift2-primary underline">Terug naar projecten</Link>
      <h1 className="text-2xl font-semibold">Projectgegevens via Excel</h1>
      <section className="bg-white border rounded-lg p-6 space-y-4" aria-labelledby="export-title">
        <h2 id="export-title" className="text-xl font-semibold">1. Exporteren en bewerken</h2>
        <p>Download alle klantprojecten. Neem de gewenste gegevens uit je Dynamics-overzicht handmatig over. Het bestand werkt zelfstandig; er is geen verbinding met Dynamics.</p>
        <p>Behoud project_id en versie. Laat beide leeg voor een nieuw project. Kies een bestaande opdrachtgever uit het tabblad Opdrachtgevers. Lege CRM- en Cardan-velden wissen de bestaande waarde. Ontbrekende rijen verwijderen niets.</p>
        <p>Alle zes kolommen zijn verplicht: project_id, versie, projectnaam, opdrachtgever_id, crm_projectnummer en cardan_kenmerk. Gebruik tekst zonder formules. Projectdetails en onderzoeken worden niet meegenomen.</p>
        <a href="/api/client-projects/excel" className="inline-block px-4 py-2 bg-shift2-primary text-white rounded-lg">Excel exporteren (.xlsx)</a>
      </section>
      <section className="bg-white border rounded-lg p-6 space-y-4" aria-labelledby="upload-title">
        <h2 id="upload-title" className="text-xl font-semibold">2. Uploaden en controleren</h2>
        <form onSubmit={upload} className="flex flex-wrap gap-4 items-end">
          <div><label htmlFor="excel-file" className="block font-medium mb-2">Aangepast Excelbestand (maximaal 5 MB, 2000 projectrijen)</label>
          <input ref={input} id="excel-file" type="file" accept=".xlsx" required disabled={busy} onChange={clear} /></div>
          <button disabled={busy} className="px-4 py-2 border rounded-lg disabled:opacity-50">{busy ? 'Bezig…' : 'Controlevoorbeeld tonen'}</button>
        </form>
        <p>Uploaden slaat niets op. Bij fouten wordt het hele bestand afgekeurd. Een controlevoorbeeld blijft 15 minuten geldig.</p>
      </section>
      {errors.length > 0 && <div role="alert" className="bg-red-50 border border-red-700 p-4 rounded-lg"><p className="font-semibold">Controleer de volgende punten:</p><ul className="list-disc pl-6">{errors.map((e,i) => <li key={i}>{e}</li>)}</ul></div>}
      <p role="status" aria-live="polite">{message}</p>
      {preview && <section className="bg-white border rounded-lg p-6 space-y-4" aria-labelledby="preview-title">
        <h2 ref={heading} tabIndex={-1} id="preview-title" className="text-xl font-semibold">3. Controlevoorbeeld en toepassen</h2>
        <p>{additions} toegevoegd · {modifications} gewijzigd · {preview.changes.length - additions - modifications} ongewijzigd. Alle records in dit voorbeeld worden samen toegepast.</p>
        <label htmlFor="preview-filter">Toon records: </label><select id="preview-filter" value={filter} onChange={e => setFilter(e.target.value)} className="border rounded p-2">
          <option value="alle">Alle</option><option value="toegevoegd">Toegevoegd</option><option value="gewijzigd">Gewijzigd</option><option value="ongewijzigd">Ongewijzigd</option>
        </select>
        <div className="overflow-x-auto"><table className="w-full text-left border-collapse text-sm">
          <caption className="text-left py-2">Oude en nieuwe waarden per project (rij verwijst naar Excel)</caption>
          <thead><tr>{['Excelrij / resultaat', 'Project-ID', 'Veld', 'Huidige waarde', 'Nieuwe waarde'].map(h => <th key={h} scope="col" className="border p-2">{h}</th>)}</tr></thead>
          <tbody>{preview.changes.filter(c => filter === 'alle' || c.kind === filter).flatMap(c => fields.map(field => <tr key={`${c.id}-${field}`} className={c.before && c.before[field] !== c.after[field] ? 'bg-yellow-50' : ''}>
            <td className="border p-2">Rij {c.row} — {c.kind}</td><td className="border p-2 break-all">{c.id}</td><th scope="row" className="border p-2">{labels[field]}</th>
            <td className="border p-2 whitespace-pre-wrap">{c.before ? display(field,c.before[field]) : '(nieuw project)'}</td><td className="border p-2 whitespace-pre-wrap">{display(field,c.after[field])}{c.before && c.before[field] !== c.after[field] && <strong className="block">Gewijzigd</strong>}</td>
          </tr>))}</tbody>
        </table></div>
        <div className="flex gap-4"><button onClick={apply} disabled={busy || additions + modifications === 0} className="px-4 py-2 bg-shift2-primary text-white rounded-lg disabled:opacity-50">Alles toepassen ({additions + modifications} projecten)</button>
        <button onClick={clear} disabled={busy} className="px-4 py-2 border rounded-lg">Annuleren</button></div>
        <p>Als gegevens ondertussen wijzigen, wordt niets opgeslagen en moet je opnieuw uploaden.</p>
      </section>}
    </div>
  </main>;
}
