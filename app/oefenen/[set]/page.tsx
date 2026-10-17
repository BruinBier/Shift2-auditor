import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { oordeelUitDatabase, pillTekst, teltMee } from '@/lib/bibliotheek/oefenen';
import Oefenpagina, { type OefenCasus } from './Oefenpagina';
import '../oefenen.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { set: string } }) {
  const set = await prisma.oefenset.findUnique({ where: { id: params.set }, select: { titel: true } });
  return { title: set ? `${set.titel} · Oefenen · Shift2` : 'Oefenen · Shift2' };
}

export default async function OefenenPage({ params }: { params: { set: string } }) {
  const set = await prisma.oefenset.findUnique({ where: { id: params.set } });
  if (!set) notFound();

  const rijen = await prisma.casus.findMany({
    where: { oefensets: { has: set.id } },
    orderBy: [{ volgorde: 'asc' }, { id: 'asc' }],
    include: {
      patroon: {
        select: { id: true, titel: true, oordeel: true, criteria: true, technieken: true, status: true },
      },
      rapportBevindingen: {
        select: {
          id: true,
          rapportOordeel: true,
          rapportCriteria: true,
          rapportSamenvatting: true,
          shift2Samenvatting: true,
        },
      },
    },
  });

  const alle: OefenCasus[] = rijen.map((c) => {
    const oordeel = oordeelUitDatabase(c.patroon.oordeel);
    return {
      id: c.id,
      titel: c.titel,
      html: c.html,
      css: c.css,
      js: c.js,
      correcteCode: c.correcteCode,
      uitleg: c.uitleg,
      isValkuil: c.isValkuil,
      oordeel,
      criteria: c.patroon.criteria,
      technieken: c.patroon.technieken,
      voorlopig: c.patroon.status !== 'vastgesteld',
      // Alleen wat het rapport zei: welke organisatie het schreef komt hier
      // nooit, ook niet bij een openbare bron. Ons oordeel komt altijd van het
      // patroon, niet uit de seedtekst, zodat het meeloopt als Frits het wijzigt.
      rapporten: c.rapportBevindingen.map((r) => ({
        id: r.id,
        rapport:
          r.rapportSamenvatting ??
          pillTekst(oordeelUitDatabase(r.rapportOordeel), r.rapportCriteria),
        ons: pillTekst(oordeel, c.patroon.criteria),
      })),
    };
  });

  // Twijfel heeft geen juist antwoord en doet niet mee (besluit 7).
  const casussen = alle.filter((c) => teltMee(c.oordeel));

  return (
    <Oefenpagina
      set={{ id: set.id, titel: set.titel, basisCss: set.paginaCss }}
      casussen={casussen}
      buitenBeschouwing={alle.length - casussen.length}
    />
  );
}
