'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * Intakeformulier: de gegevens uit het CRM waaruit een onderzoek wordt
 * opgebouwd. Klantproject, titel, taal, norm en controleur worden afgeleid;
 * de datums volgen pas na het scopegesprek met de klant.
 */

const BUREAUS = ['Shift2', 'Cardan'];
const ACCOUNTMANAGERS = ['Katja', 'Guus', 'Nick van de Venn'];

export default function IntakePage() {
  const router = useRouter();
  const [opdrachtgevers, setOpdrachtgevers] = useState<any[]>([]);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');

  const [opdrachtgeverId, setOpdrachtgeverId] = useState('');
  const [opdrachtgeverNaam, setOpdrachtgeverNaam] = useState('');
  const [opdrachtgeverKenmerk, setOpdrachtgeverKenmerk] = useState('');
  const [contactnaam, setContactnaam] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [accountmanager, setAccountmanager] = useState(ACCOUNTMANAGERS[0]);

  const [kenmerk, setKenmerk] = useState('');
  const [projectnummer, setProjectnummer] = useState('');
  const [url, setUrl] = useState('');
  const [uitgevoerdDoor, setUitgevoerdDoor] = useState('Shift2');
  const [anderBureau, setAnderBureau] = useState('');
  const [hasReinspection, setHasReinspection] = useState(false);
  const [reinspectionWeeks, setReinspectionWeeks] = useState('12');

  const nieuweOpdrachtgever = opdrachtgeverId === 'nieuw';
  const anders = uitgevoerdDoor === 'anders';

  useEffect(() => {
    fetch('/api/opdrachtgevers')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setOpdrachtgevers(Array.isArray(d) ? d : []))
      .catch(() => setOpdrachtgevers([]));
  }, []);

  // Bij een bestaande opdrachtgever het volgende kenmerk voorstellen (HAR-02).
  useEffect(() => {
    if (!opdrachtgeverId || opdrachtgeverId === 'nieuw') return;
    fetch(`/api/intake?opdrachtgeverId=${opdrachtgeverId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.kenmerk) setKenmerk(d.kenmerk);
      })
      .catch(() => {});
  }, [opdrachtgeverId]);

  // Bij een nieuwe opdrachtgever volgt het kenmerk uit wat je zelf invult.
  useEffect(() => {
    if (!nieuweOpdrachtgever) return;
    const code = opdrachtgeverKenmerk.trim().toUpperCase();
    setKenmerk(code ? `${code}-01` : '');
  }, [nieuweOpdrachtgever, opdrachtgeverKenmerk]);

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
          projectnummer,
          url,
          opdrachtgeverId: nieuweOpdrachtgever ? null : opdrachtgeverId,
          opdrachtgeverNaam: nieuweOpdrachtgever ? opdrachtgeverNaam : '',
          opdrachtgeverKenmerk: nieuweOpdrachtgever ? opdrachtgeverKenmerk : '',
          contactnaam: nieuweOpdrachtgever ? contactnaam : '',
          contactEmail: nieuweOpdrachtgever ? contactEmail : '',
          accountmanager: nieuweOpdrachtgever ? accountmanager : '',
          uitgevoerdDoor: anders ? anderBureau : uitgevoerdDoor,
          hasReinspection,
          reinspectionWeeks,
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

  const veld = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm';

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="mb-6">
        <Link href="/onderzoeken" className="text-sm text-shift2-primary hover:underline">
          Terug naar onderzoeken
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Nieuwe intake</h1>
        <p className="text-sm text-gray-600 mt-1">
          De gegevens uit het CRM. Titel en klantproject worden hieruit afgeleid;
          de planning volgt na het scopegesprek.
        </p>
      </div>

      <form onSubmit={verstuur} className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
        <div>
          <label htmlFor="opdrachtgever" className="block text-sm font-medium text-gray-700 mb-1">
            Opdrachtgever
          </label>
          <select
            id="opdrachtgever"
            value={opdrachtgeverId}
            onChange={(e) => setOpdrachtgeverId(e.target.value)}
            required
            className={veld}
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
                className={veld}
              />
            </div>
            <div>
              <label htmlFor="ogkenmerk" className="block text-sm font-medium text-gray-700 mb-1">
                Kenmerk opdrachtgever
              </label>
              <input
                id="ogkenmerk"
                value={opdrachtgeverKenmerk}
                onChange={(e) => setOpdrachtgeverKenmerk(e.target.value)}
                placeholder="ZOET"
                required
                className="w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase"
              />
              <p className="text-xs text-gray-500 mt-1">
                De code waarmee onderzoeken van deze klant genummerd worden, zoals BEV of HAR.
              </p>
            </div>
            <div>
              <label htmlFor="contactnaam" className="block text-sm font-medium text-gray-700 mb-1">
                Contactpersoon
              </label>
              <input
                id="contactnaam"
                value={contactnaam}
                onChange={(e) => setContactnaam(e.target.value)}
                className={veld}
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
                className={veld}
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
                className={veld}
              >
                {ACCOUNTMANAGERS.map((naam) => (
                  <option key={naam} value={naam}>
                    {naam}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="kenmerk" className="block text-sm font-medium text-gray-700 mb-1">
              Projectkenmerk
            </label>
            <input
              id="kenmerk"
              value={kenmerk}
              onChange={(e) => setKenmerk(e.target.value)}
              placeholder="HAR-02"
              required
              className={veld}
            />
            <p className="text-xs text-gray-500 mt-1">Voorgesteld, aan te passen.</p>
          </div>
          <div>
            <label htmlFor="projectnummer" className="block text-sm font-medium text-gray-700 mb-1">
              CRM-nummer
            </label>
            <input
              id="projectnummer"
              value={projectnummer}
              onChange={(e) => setProjectnummer(e.target.value)}
              placeholder="P02645"
              className={veld}
            />
          </div>
        </div>

        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
            Website
          </label>
          <input
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://samen.harlingen.nl"
            required
            className={veld}
          />
        </div>

        <div>
          <label htmlFor="uitvoerder" className="block text-sm font-medium text-gray-700 mb-1">
            Uitgevoerd door
          </label>
          <select
            id="uitvoerder"
            value={uitgevoerdDoor}
            onChange={(e) => setUitgevoerdDoor(e.target.value)}
            className={veld}
          >
            {BUREAUS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
            <option value="anders">Anders...</option>
          </select>
          {anders && (
            <input
              value={anderBureau}
              onChange={(e) => setAnderBureau(e.target.value)}
              placeholder="Naam van het bureau"
              required
              className={`${veld} mt-2`}
            />
          )}
          {(anders || uitgevoerdDoor !== 'Shift2') && (
            <p className="text-xs text-gray-500 mt-1">
              Een ander bureau voert de audit uit; jij blijft controleur.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Soort onderzoek</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-900">
              <input
                type="radio"
                name="soort"
                checked={!hasReinspection}
                onChange={() => setHasReinspection(false)}
              />
              Nulmeting
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-900">
              <input
                type="radio"
                name="soort"
                checked={hasReinspection}
                onChange={() => setHasReinspection(true)}
              />
              Nulmeting met hertest
            </label>
          </div>
          {hasReinspection && (
            <div className="mt-3 pl-6">
              <label htmlFor="weken" className="block text-sm text-gray-700 mb-1">
                Weken tot de hertest
              </label>
              <input
                id="weken"
                type="number"
                min={1}
                value={reinspectionWeeks}
                onChange={(e) => setReinspectionWeeks(e.target.value)}
                className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Gerekend vanaf de deadline, die je later bij de planning invult.
              </p>
            </div>
          )}
        </div>

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
