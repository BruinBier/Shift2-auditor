'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * Intakeformulier: de handvol gegevens uit het CRM waaruit een onderzoek
 * wordt opgebouwd. De rest (klantproject, titel, taal, norm, onderzoeker)
 * wordt afgeleid, en de datums volgen pas na het scopegesprek.
 */
export default function IntakePage() {
  const router = useRouter();
  const [opdrachtgevers, setOpdrachtgevers] = useState<any[]>([]);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');

  const [kenmerk, setKenmerk] = useState('');
  const [url, setUrl] = useState('');
  const [opdrachtgeverId, setOpdrachtgeverId] = useState('');
  const [opdrachtgeverNaam, setOpdrachtgeverNaam] = useState('');
  const [contactnaam, setContactnaam] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [accountmanager, setAccountmanager] = useState('Katja');

  const nieuweOpdrachtgever = opdrachtgeverId === 'nieuw';

  useEffect(() => {
    fetch('/api/opdrachtgevers')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setOpdrachtgevers(Array.isArray(d) ? d : []))
      .catch(() => setOpdrachtgevers([]));
  }, []);

  const verstuur = async (e: React.FormEvent) => {
    e.preventDefault();
    setFout('');
    setBezig(true);
    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kenmerk,
          url,
          opdrachtgeverId: nieuweOpdrachtgever ? null : opdrachtgeverId,
          opdrachtgeverNaam: nieuweOpdrachtgever ? opdrachtgeverNaam : '',
          contactnaam: nieuweOpdrachtgever ? contactnaam : '',
          contactEmail: nieuweOpdrachtgever ? contactEmail : '',
          accountmanager: nieuweOpdrachtgever ? accountmanager : '',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/admin/projects/${data.project.id}`);
      } else {
        setFout(data.error || 'Het aanmaken is niet gelukt.');
      }
    } catch (error) {
      console.error('Error submitting intake:', error);
      setFout('Het aanmaken is niet gelukt.');
    } finally {
      setBezig(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="mb-6">
        <Link href="/onderzoeken" className="text-sm text-shift2-primary hover:underline">
          Terug naar onderzoeken
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Nieuwe intake</h1>
        <p className="text-sm text-gray-600 mt-1">
          De gegevens uit het CRM. Titel, klantproject en de vaste velden worden
          hieruit afgeleid; de planning volgt na het scopegesprek.
        </p>
      </div>

      <form onSubmit={verstuur} className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
        <div>
          <label htmlFor="kenmerk" className="block text-sm font-medium text-gray-700 mb-1">
            Kenmerk
          </label>
          <input
            id="kenmerk"
            value={kenmerk}
            onChange={(e) => setKenmerk(e.target.value)}
            placeholder="ZOET-01"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Zoals in het CRM. Het voorvoegsel wordt het kenmerk van een nieuwe opdrachtgever.
          </p>
        </div>

        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
            Website
          </label>
          <input
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.zoetermeer.nl"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="opdrachtgever" className="block text-sm font-medium text-gray-700 mb-1">
            Opdrachtgever
          </label>
          <select
            id="opdrachtgever"
            value={opdrachtgeverId}
            onChange={(e) => setOpdrachtgeverId(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Kies een opdrachtgever...</option>
            {opdrachtgevers.map((o) => (
              <option key={o.id} value={o.id}>
                {o.naam}
              </option>
            ))}
            <option value="nieuw">Nieuwe opdrachtgever...</option>
          </select>
        </div>

        {nieuweOpdrachtgever && (
          <div className="space-y-4 pl-4 border-l-2 border-gray-200">
            <div>
              <label htmlFor="naam" className="block text-sm font-medium text-gray-700 mb-1">
                Naam opdrachtgever
              </label>
              <input
                id="naam"
                value={opdrachtgeverNaam}
                onChange={(e) => setOpdrachtgeverNaam(e.target.value)}
                placeholder="gemeente Zoetermeer"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="contactnaam" className="block text-sm font-medium text-gray-700 mb-1">
                Contactpersoon
              </label>
              <input
                id="contactnaam"
                value={contactnaam}
                onChange={(e) => setContactnaam(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-mailadres <span className="text-gray-400">optioneel</span>
              </label>
              <input
                id="email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="am" className="block text-sm font-medium text-gray-700 mb-1">
                Accountmanager
              </label>
              <select
                id="am"
                value={accountmanager}
                onChange={(e) => setAccountmanager(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="Katja">Katja</option>
                <option value="Guus">Guus</option>
              </select>
            </div>
          </div>
        )}

        {fout && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            {fout}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/onderzoeken"
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Annuleren
          </Link>
          <button
            type="submit"
            disabled={bezig}
            className="px-4 py-2 text-sm bg-shift2-primary text-white rounded-lg hover:bg-shift2-accent disabled:opacity-50"
          >
            {bezig ? 'Bezig...' : 'Onderzoek aanmaken'}
          </button>
        </div>
      </form>
    </div>
  );
}
