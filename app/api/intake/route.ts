import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Intake: uit een handvol gegevens uit het CRM een onderzoek opbouwen.
 *
 * Wat hier wordt afgeleid in plaats van gevraagd:
 * - het kenmerk van de opdrachtgever, uit het onderzoekskenmerk (BUN-01 -> BUN)
 * - het klantproject, uit het domein van de URL
 * - de titel, uit datzelfde domein
 * - de vaste velden: Nederlands, WCAG 2.2 AA, onderzoeker en controleur
 *
 * Datums komen hier niet: die volgen uit het scopegesprek met de klant. Het
 * onderzoek start daarom op status "Intake".
 */

const ONDERZOEKER = 'Frits Karskens';
const STANDAARD_TYPE = 'WCAG 2.2 AA deelonderzoek content website';

/** Domein zonder protocol, www en slash — de basis voor titel en klantproject. */
function domeinVan(url: string): string {
  const schoon = url.trim();
  try {
    const u = new URL(schoon.startsWith('http') ? schoon : `https://${schoon}`);
    return u.host.replace(/^www\./i, '');
  } catch {
    return schoon.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/.*$/, '');
  }
}

/** Het voorvoegsel van het kenmerk: BUN-01 -> BUN. */
function opdrachtgeverKenmerk(kenmerk: string): string {
  return kenmerk.trim().split(/[-\s]/)[0].toUpperCase();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const kenmerk = (body.kenmerk || '').trim();
    const url = (body.url || '').trim();
    if (!kenmerk || !url) {
      return NextResponse.json(
        { error: 'Kenmerk en website-URL zijn nodig.' },
        { status: 400 }
      );
    }

    const bestaatAl = await prisma.project.findFirst({
      where: { kenmerk, version: 1 },
      select: { id: true },
    });
    if (bestaatAl) {
      return NextResponse.json(
        { error: `Er bestaat al een onderzoek met kenmerk ${kenmerk}.` },
        { status: 409 }
      );
    }

    const domein = domeinVan(url);
    const volledigeUrl = url.startsWith('http') ? url : `https://${url}`;

    // 1. Opdrachtgever: bestaande hergebruiken, anders aanmaken.
    let opdrachtgever = body.opdrachtgeverId
      ? await prisma.opdrachtgever.findUnique({ where: { id: body.opdrachtgeverId } })
      : null;

    if (!opdrachtgever) {
      const naam = (body.opdrachtgeverNaam || '').trim();
      if (!naam) {
        return NextResponse.json(
          { error: 'Kies een opdrachtgever of vul een nieuwe naam in.' },
          { status: 400 }
        );
      }
      opdrachtgever = await prisma.opdrachtgever.findFirst({ where: { naam } });
      if (!opdrachtgever) {
        opdrachtgever = await prisma.opdrachtgever.create({
          data: {
            kenmerk: opdrachtgeverKenmerk(kenmerk),
            naam,
            contactnaam: body.contactnaam?.trim() || null,
            contactEmail: body.contactEmail?.trim() || null,
            accountmanager: body.accountmanager?.trim() || null,
          },
        });
      }
    }

    // 2. Klantproject: op domein zoeken binnen deze opdrachtgever.
    let clientProject = await prisma.clientProject.findFirst({
      where: { opdrachtgeverId: opdrachtgever.id, name: { contains: domein } },
    });
    if (!clientProject) {
      clientProject = await prisma.clientProject.create({
        data: { name: domein, opdrachtgeverId: opdrachtgever.id },
      });
    }

    // 3. Het onderzoek zelf.
    const project = await prisma.project.create({
      data: {
        kenmerk,
        title: `website ${domein}`,
        subject: '',
        standard: 'WCAG 2.2',
        level: 'AA',
        researchType: STANDAARD_TYPE,
        version: 1,
        language: 'Nederlands',
        status: 'Intake',
        commissionedBy: opdrachtgever.naam,
        clientProjectId: clientProject.id,
        auditedByOrg: 'Shift2',
        researcherName: ONDERZOEKER,
        controllerName: ONDERZOEKER,
        reportDate: new Date(),
        scopeInScope: volledigeUrl,
      },
    });

    // De te onderzoeken site staat op twee plekken: als tekst voor het rapport
    // en als record voor de crawler. Allebei vullen scheelt handwerk later.
    await prisma.projectScopeUrl.create({
      data: { projectId: project.id, url: volledigeUrl, inScope: true },
    });

    return NextResponse.json({
      project: { id: project.id, kenmerk: project.kenmerk, title: project.title },
      opdrachtgever: { id: opdrachtgever.id, naam: opdrachtgever.naam },
      clientProject: { id: clientProject.id, name: clientProject.name },
    });
  } catch (error) {
    console.error('Error in intake:', error);
    return NextResponse.json({ error: 'Het aanmaken is niet gelukt.' }, { status: 500 });
  }
}
