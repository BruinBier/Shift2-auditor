import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Intake: uit een handvol gegevens uit het CRM een onderzoek opbouwen.
 *
 * Drie soorten nummers die niet door elkaar mogen lopen:
 * - het opdrachtgeverkenmerk (BEV, HAR) hoort bij de klantorganisatie
 * - het projectkenmerk (HAR-02) bij dit onderzoek
 * - het CRM-nummer (P02645) bij het klantproject, en kan over meerdere
 *   websites van dezelfde opdracht gedeeld worden
 *
 * Wat hier wordt afgeleid in plaats van gevraagd: het klantproject en de
 * titel uit het domein, en de vaste velden (Nederlands, WCAG 2.2 AA).
 * Datums komen niet hier maar volgen uit het scopegesprek; het onderzoek
 * start daarom op status "Intake".
 */

const EIGEN_ORGANISATIE = 'Shift2';
const CONTROLEUR = 'Frits Karskens';
const STANDAARD_TYPE = 'WCAG 2.2 AA deelonderzoek content website';

/** Domein zonder protocol, www en slash — de basis voor titel en klantproject. */
function domeinVan(url: string): string {
  const schoon = url.trim();
  try {
    const u = new URL(schoon.startsWith('http') ? schoon : `https://${schoon}`);
    return u.host.replace(/^www\./i, '');
  } catch {
    return schoon
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .replace(/\/.*$/, '');
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const kenmerk = (body.kenmerk || '').trim();
    const url = (body.url || '').trim();
    if (!kenmerk || !url) {
      return NextResponse.json(
        { error: 'Projectkenmerk en website-URL zijn nodig.' },
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
    const crmNummer = (body.projectnummer || '').trim() || null;

    // 1. Opdrachtgever: bestaande hergebruiken, anders aanmaken.
    let opdrachtgever = body.opdrachtgeverId
      ? await prisma.opdrachtgever.findUnique({ where: { id: body.opdrachtgeverId } })
      : null;

    if (!opdrachtgever) {
      const naam = (body.opdrachtgeverNaam || '').trim();
      const ogKenmerk = (body.opdrachtgeverKenmerk || '').trim().toUpperCase();
      if (!naam || !ogKenmerk) {
        return NextResponse.json(
          { error: 'Vul de naam en het kenmerk van de nieuwe opdrachtgever in.' },
          { status: 400 }
        );
      }
      opdrachtgever = await prisma.opdrachtgever.findFirst({ where: { naam } });
      if (!opdrachtgever) {
        opdrachtgever = await prisma.opdrachtgever.create({
          data: {
            kenmerk: ogKenmerk,
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
    if (clientProject) {
      // Het CRM-nummer kan later bekend worden; vul het aan als het nog leeg is.
      if (crmNummer && !clientProject.projectnummer) {
        clientProject = await prisma.clientProject.update({
          where: { id: clientProject.id },
          data: { projectnummer: crmNummer },
        });
      }
    } else {
      clientProject = await prisma.clientProject.create({
        data: {
          name: domein,
          opdrachtgeverId: opdrachtgever.id,
          projectnummer: crmNummer,
        },
      });
    }

    // 3. Het onderzoek zelf.
    const uitvoerder = (body.uitgevoerdDoor || EIGEN_ORGANISATIE).trim();
    const isExtern = uitvoerder !== EIGEN_ORGANISATIE;
    const hertest = Boolean(body.hasReinspection);

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
        auditedByOrg: EIGEN_ORGANISATIE,
        // Voert een ander bureau de audit uit, dan is de onderzoeker nog
        // onbekend en houd jij de controle.
        isExternalProject: isExtern,
        externalBureau: isExtern ? uitvoerder : null,
        researcherName: isExtern ? null : CONTROLEUR,
        controllerName: CONTROLEUR,
        hasReinspection: hertest,
        reinspectionWeeks: hertest ? Number(body.reinspectionWeeks) || 12 : null,
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

/**
 * Stelt het volgende projectkenmerk voor bij een opdrachtgever: HAR-01 bestaat,
 * dus HAR-02. Zo hoef je niet op te zoeken welke er al zijn.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const opdrachtgeverId = searchParams.get('opdrachtgeverId');
    if (!opdrachtgeverId) {
      return NextResponse.json({ error: 'opdrachtgeverId ontbreekt.' }, { status: 400 });
    }

    const opdrachtgever = await prisma.opdrachtgever.findUnique({
      where: { id: opdrachtgeverId },
      select: { kenmerk: true },
    });
    if (!opdrachtgever) {
      return NextResponse.json({ error: 'Opdrachtgever niet gevonden.' }, { status: 404 });
    }

    const bestaande = await prisma.project.findMany({
      where: { kenmerk: { startsWith: `${opdrachtgever.kenmerk}-` } },
      select: { kenmerk: true },
    });
    const nummers = bestaande
      .map((p) => Number(p.kenmerk?.split('-').pop()))
      .filter((n) => Number.isFinite(n));
    const volgende = (nummers.length ? Math.max(...nummers) : 0) + 1;

    return NextResponse.json({
      kenmerk: `${opdrachtgever.kenmerk}-${String(volgende).padStart(2, '0')}`,
    });
  } catch (error) {
    console.error('Error suggesting kenmerk:', error);
    return NextResponse.json({ error: 'Voorstellen is niet gelukt.' }, { status: 500 });
  }
}
