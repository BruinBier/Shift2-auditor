'use client';

import { useId } from 'react';

/**
 * Eén bekende contactpersoon: naam en e-mail zoals ze ergens al zijn ingevuld, en bij
 * welke opdrachtgever dat was.
 */
export type Contactpersoon = {
  naam: string;
  email: string;
  opdrachtgeverId: string;
};

/**
 * Alle contactpersonen die al ergens staan: bij een opdrachtgever (voor de organisatie
 * als geheel) of bij een klantproject. Eén keer per naam-en-e-mail, en de mensen van de
 * eigen opdrachtgever bovenaan: bij een gemeente met vijf projecten wil je eerst de
 * collega's van die gemeente zien, niet die van twintig andere.
 */
export function contactpersonenUit(
  opdrachtgevers: Array<{ id: string; contactnaam?: string | null; contactEmail?: string | null }>,
  clientProjects: Array<{ opdrachtgeverId: string; contactnaam?: string | null; contactEmail?: string | null }>,
  eigenOpdrachtgeverId?: string | null,
): Contactpersoon[] {
  const gezien = new Set<string>();
  const lijst: Contactpersoon[] = [];
  const voeg = (naam: string | null | undefined, email: string | null | undefined, opdrachtgeverId: string) => {
    // Dubbele spaties samenvouwen: "Arnout  Geus" en "Arnout Geus" zijn dezelfde persoon.
    const n = (naam ?? '').trim().replace(/\s+/g, ' ');
    const e = (email ?? '').trim();
    if (!n && !e) return;
    const sleutel = `${n.toLowerCase()}|${e.toLowerCase()}`;
    if (gezien.has(sleutel)) return;
    gezien.add(sleutel);
    lijst.push({ naam: n, email: e, opdrachtgeverId });
  };
  for (const o of opdrachtgevers) voeg(o.contactnaam, o.contactEmail, o.id);
  for (const p of clientProjects) voeg(p.contactnaam, p.contactEmail, p.opdrachtgeverId);
  return lijst.sort((a, b) => {
    const ae = a.opdrachtgeverId === eigenOpdrachtgeverId ? 0 : 1;
    const be = b.opdrachtgeverId === eigenOpdrachtgeverId ? 0 : 1;
    return ae - be || a.naam.localeCompare(b.naam, 'nl');
  });
}

/**
 * Naam en e-mail van een contactpersoon, elk met een keuzelijst van wat er al bekend is.
 *
 * Kies je een naam die één e-mailadres heeft en staat het e-mailveld nog leeg, dan wordt
 * dat adres ingevuld; andersom net zo. Alleen bij een leeg veld: wie al iets heeft
 * ingetypt, wordt niet overschreven. Vrij typen blijft kunnen, want een nieuwe
 * contactpersoon staat nog nergens.
 */
export default function ContactpersoonVelden({
  naam,
  email,
  contacten,
  onChange,
}: {
  naam: string;
  email: string;
  contacten: Contactpersoon[];
  onChange: (waarde: { naam: string; email: string }) => void;
}) {
  const id = useId();
  const namen = Array.from(new Set(contacten.map((c) => c.naam).filter(Boolean)));
  const emails = Array.from(new Set(contacten.map((c) => c.email).filter(Boolean)));
  const invoer =
    'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary';

  const naamGekozen = (waarde: string) => {
    let nieuwEmail = email;
    if (!email.trim()) {
      const adressen = new Set(
        contacten.filter((c) => c.email && c.naam.toLowerCase() === waarde.trim().toLowerCase()).map((c) => c.email),
      );
      if (adressen.size === 1) nieuwEmail = Array.from(adressen)[0];
    }
    onChange({ naam: waarde, email: nieuwEmail });
  };

  const emailGekozen = (waarde: string) => {
    let nieuweNaam = naam;
    if (!naam.trim()) {
      const namenBij = new Set(
        contacten.filter((c) => c.naam && c.email.toLowerCase() === waarde.trim().toLowerCase()).map((c) => c.naam),
      );
      if (namenBij.size === 1) nieuweNaam = Array.from(namenBij)[0];
    }
    onChange({ naam: nieuweNaam, email: waarde });
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label htmlFor={`${id}-naam`} className="block text-sm font-medium text-gray-700 mb-1">
          Contactpersoon
        </label>
        <input
          id={`${id}-naam`}
          type="text"
          list={`${id}-namen`}
          autoComplete="off"
          value={naam}
          onChange={(e) => naamGekozen(e.target.value)}
          className={invoer}
          placeholder="Voor- en achternaam"
        />
        <datalist id={`${id}-namen`}>
          {namen.map((n) => {
            // Het adres erbij in de lijst, zodat twee mensen met dezelfde naam uit
            // elkaar te houden zijn. Browsers tonen dat als grijze toelichting.
            const adressen = contacten.filter((c) => c.naam === n && c.email).map((c) => c.email);
            return <option key={n} value={n}>{adressen.join(', ')}</option>;
          })}
        </datalist>
      </div>
      <div>
        <label htmlFor={`${id}-email`} className="block text-sm font-medium text-gray-700 mb-1">
          E-mail contactpersoon
        </label>
        <input
          id={`${id}-email`}
          type="email"
          list={`${id}-emails`}
          autoComplete="off"
          value={email}
          onChange={(e) => emailGekozen(e.target.value)}
          className={invoer}
          placeholder="naam@gemeente.nl"
        />
        <datalist id={`${id}-emails`}>
          {emails.map((e) => {
            const namenBij = contacten.filter((c) => c.email === e && c.naam).map((c) => c.naam);
            return <option key={e} value={e}>{namenBij.join(', ')}</option>;
          })}
        </datalist>
      </div>
    </div>
  );
}
