import { prisma } from '@/lib/prisma';
import { marked } from 'marked';
import {
  groupFindingsByHierarchy,
  calculateReportStats,
  calculatePrincipleStats,
  getPrincipleLabel,
  AssessmentStatus,
  type ProjectWithRelations,
} from '@/lib/report-calculations';
import { formatUserAgentsHtml } from '@/lib/format-user-agents';
import { isOpmerking, hoortInRapport } from '@/lib/finding-classification';
import { getReportData } from '@/lib/report-data';

function escapeHtml(text: string | null | undefined): string {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return String(html).replace(/<[^>]+>/g, '').trim();
}

function paragraphsFromText(text: string | null | undefined): string {
  if (!text) return '';
  const plain = String(text).trim();
  if (!plain) return '';
  if (/<\w+[^>]*>/.test(plain)) return plain;
  return plain
    .split(/\n\s*\n/)
    .map((p) => `<p>${escapeHtml(p.trim()).replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

/**
 * Render finding description/advice op dezelfde manier als de rapport-pagina en
 * admin-pagina: eerst alle HTML-tags escapen (zodat <p>, <br>, <figure> als
 * tekst verschijnen), daarna markdown parsen met breaks+gfm.
 */
function renderFindingMarkdown(input: string | null | undefined): string {
  if (!input) return '';
  const escaped = String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  let html: string;
  try {
    html = marked.parse(escaped, {
      breaks: true,
      gfm: true,
      async: false,
    } as any) as string;
  } catch {
    html = escaped;
  }
  return html.replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" ');
}

function formatDateNl(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function statusLabel(status: AssessmentStatus | string): { label: string; klass: string } {
  switch (status) {
    case 'passed':
      return { label: 'Voldoet', klass: '' };
    case 'failed':
      return { label: 'Voldoet niet', klass: 'fail' };
    case 'not_present':
      return { label: 'niet aanwezig', klass: '' };
    case 'not_tested':
      return { label: 'niet getoetst', klass: '' };
    case 'unknown':
    default:
      return { label: 'onbekend', klass: '' };
  }
}

function buildReportTitle(project: any, website: string): string {
  // Gelijk aan de "Over dit onderzoek"-tab: onderzoekstype + domein.
  // Het researchType bevat doorgaans al "... website", dus we voegen dat woord
  // niet nogmaals toe (voorkomt "website website www.beverwijk.nl").
  const rt = String(project.researchType || 'Deelonderzoek').trim();
  return [rt, website].filter(Boolean).join(' ').trim();
}

function compareWcagCodes(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10));
  const pb = b.split('.').map((n) => parseInt(n, 10));
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x !== y) return x - y;
  }
  return 0;
}

export async function generateReportHtml(projectId: string): Promise<string> {
  const data = await getReportData(projectId);
  if (!data) throw new Error('Project not found');

  const { project, researchTypeData, isHeronderzoek, nulmeting } = data;

  const nulmetingPeriode =
    nulmeting?.dateStart && nulmeting?.dateEnd
      ? `${formatDateNl(nulmeting.dateStart)} en ${formatDateNl(nulmeting.dateEnd)}`
      : null;

  const projectForCalc = data.projectForCalc as unknown as ProjectWithRelations;

  const grouped = await groupFindingsByHierarchy(projectForCalc);
  const stats = calculateReportStats(projectForCalc);
  const principleStats = calculatePrincipleStats(projectForCalc);

  const firstScopeUrl = project.scopeUrls.find(
    (u) => u.inScope === true && !u.parentUrlId
  );
  const scopeDomain = firstScopeUrl ? new URL(firstScopeUrl.url).hostname : '';

  const opdrachtgever =
    project.commissionedBy || project.clientProject?.name || 'n.v.t.';
  const website = scopeDomain || project.subject || '';
  const version = Number(project.version).toFixed(1);
  const datum = formatDateNl(project.reportDate);
  const title = buildReportTitle(project, website);
  // Gelijk aan de "Over dit onderzoek"-tab: kort "deelonderzoek" + type + URL met protocol.
  const introUrl = website ? `https://${website.replace(/^https?:\/\//, '')}` : '';
  // De URL als echte link opnemen. Een kale URL in lopende tekst wordt bij de
  // PDF-export niet als link herkend, wat een toegankelijkheidsfout oplevert.
  const introLink = introUrl
    ? `<a href="${escapeHtml(introUrl)}">${escapeHtml(introUrl)}</a>`
    : '';
  // In de introzin het hoogste niveau kort noemen ("AA"), niet de volledige
  // reeks "A en AA" die elders in het rapport wordt gebruikt.
  const introLevel = (researchTypeData?.level || project.level || 'AA')
    .split(/\s+en\s+/i)
    .pop()!
    .trim();
  const onderzoekLabel = `${
    researchTypeData?.version || project.standard || 'WCAG 2.2'
  } ${introLevel}-content${isHeronderzoek ? 'her' : ''}onderzoek`;
  const introOpdrachtgever =
    opdrachtgever && opdrachtgever !== 'n.v.t.'
      ? `, uitgevoerd in opdracht van ${escapeHtml(opdrachtgever)}.`
      : '.';
  const intro = `Dit rapport beschrijft de resultaten van het ${escapeHtml(
    onderzoekLabel
  )} naar de digitale toegankelijkheid van ${introLink}${introOpdrachtgever}`;

  // Flat list of all criteria for "Resultaten per SC"
  const allCriteriaRows: Array<{
    code: string;
    title: string;
    level: string;
    status: AssessmentStatus | string;
  }> = [];
  for (const group of grouped) {
    for (const gl of group.guidelines) {
      for (const crit of gl.criteria) {
        allCriteriaRows.push({
          code: crit.code,
          title: crit.title,
          level: crit.level,
          status: crit.assessment?.status || AssessmentStatus.not_tested,
        });
      }
    }
  }
  allCriteriaRows.sort((a, b) => compareWcagCodes(a.code, b.code));

  const sampleItems = project.sampleItems.filter((s) => s.url || s.title);
  const scopeIn = project.scopeUrls.filter(
    (s) => s.inScope === true && !s.parentUrlId
  );
  const scopeOut = project.scopeUrls.filter((s) => s.inScope === false);

  const samenvattingHtml = renderSamenvatting(
    project,
    stats,
    researchTypeData,
    nulmetingPeriode
  );
  const overOnderzoekHtml = renderOverOnderzoek(project, researchTypeData);
  const overzichtHtml = renderOverzichtResultaten(
    allCriteriaRows,
    principleStats
  );
  const bevindingenHtml = renderBevindingenSectie(
    grouped,
    'bevinding',
    isHeronderzoek
  );
  const opmerkingenHtml = renderBevindingenSectie(
    grouped,
    'opmerking',
    isHeronderzoek
  );
  const borgingHtml = renderBorging();
  const detailsHtml = renderOnderzoeksdetails(
    project,
    sampleItems,
    scopeIn,
    scopeOut
  );

  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="https://cuatro.sim-cdn.nl/assets/fonts/shift2/brockmann/stylesheet.css">
<style>${REPORT_CSS}</style>
</head>
<body>
<header class="logo-header">
  <img src="/shift2-logo.png" alt="Logo Shift2">
</header>
<main class="container">
  <h1>${escapeHtml(title)}</h1>
  <p class="intro">${intro}</p>
  <ul class="project-info">
    <li><b>Opdrachtgever:</b> ${escapeHtml(opdrachtgever)}</li>
    <li><b>Website:</b> ${escapeHtml(website)}</li>
    <li><b>Rapportversie:</b> ${escapeHtml(version)}</li>
    <li><b>Datum:</b> ${escapeHtml(datum)}</li>
  </ul>
  ${samenvattingHtml}
  ${overOnderzoekHtml}
  ${overzichtHtml}
  ${bevindingenHtml}
  ${opmerkingenHtml}
  ${borgingHtml}
  ${detailsHtml}
</main>
</body>
</html>`;
}

function renderSamenvatting(
  project: any,
  stats: any,
  researchTypeData: any,
  nulmetingPeriode?: string | null
): string {
  // Bij een heronderzoek spreken we van heronderzoek en noemen we de nulmeting
  const isHeronderzoek = project.checkPhase === 'herinspectie';
  const dateStartFormatted = project.dateStart
    ? formatDateNl(project.dateStart)
    : '[datum]';
  const dateEndFormatted = project.dateEnd
    ? formatDateNl(project.dateEnd)
    : '[datum]';

  const totalPages = project.sampleItems?.length || 0;
  const passedCriteria = stats.effectivePassed || 0;
  const totalCriteria = stats.totalAssessed || 0;
  const percentage =
    totalCriteria > 0 ? Math.round((passedCriteria / totalCriteria) * 100) : 0;
  const failedCriteria = stats.failed || 0;

  const isFormulieren = researchTypeData?.type === 'formulieren';
  const uniqueForms =
    isFormulieren && project.scopeUrls
      ? project.scopeUrls.filter((u: any) => u.inScope).length
      : totalPages;

  let mainHtml: string;

  if (researchTypeData?.summaryTemplate) {
    let summaryTemplate = String(researchTypeData.summaryTemplate);

    // Bij een heronderzoek: spreek van heronderzoek en noem de periode van de nulmeting
    if (isHeronderzoek) {
      summaryTemplate = summaryTemplate
        .replace(/Dit onderzoek is/g, 'Dit heronderzoek is')
        .replace(/\bdit deelonderzoek\b/g, 'dit heronderzoek');

      if (nulmetingPeriode) {
        summaryTemplate = summaryTemplate.replace(
          /(Dit heronderzoek is door Shift2 uitgevoerd tussen \{dateStart\} en \{dateEnd\}\.)/,
          `$1 De nulmeting vond plaats tussen ${escapeHtml(nulmetingPeriode)}.`
        );
      }
    }

    mainHtml = summaryTemplate
      .replace(/\{dateStart\}/g, dateStartFormatted)
      .replace(/\{dateEnd\}/g, dateEndFormatted)
      .replace(/\{totalPages\}/g, String(totalPages))
      .replace(/\{uniqueForms\}/g, String(uniqueForms))
      .replace(/\{totalCriteria\}/g, String(totalCriteria))
      .replace(/\{passedCriteria\}/g, String(passedCriteria))
      .replace(/\{percentage\}/g, String(percentage))
      .replace(/\{failedCriteria\}/g, String(failedCriteria))
      .replace(
        /\{compliesFully\}/g,
        percentage === 100 ? 'volledig' : 'niet volledig'
      )
      .replace(
        /\{formsSingularPlural\}/g,
        uniqueForms === 1 ? 'formulier' : 'formulieren'
      )
      .replace(
        /\{pagesSingularPlural\}/g,
        totalPages === 1 ? 'processtap' : 'processtappen'
      )
      .replace(
        /\{criteriaFailedSingularPlural\}/g,
        failedCriteria === 1 ? 'succescriterium' : 'succescriteria'
      )
      .replace(/\{standard\}/g, researchTypeData?.version || 'WCAG 2.2')
      .replace(/\{level\}/g, researchTypeData?.level || 'A en AA');
  } else {
    const criteriaWord =
      failedCriteria === 1 ? 'succescriterium' : 'succescriteria';
    const onderzoekWoord = isHeronderzoek ? 'heronderzoek' : 'deelonderzoek';
    const nulmetingZin =
      isHeronderzoek && nulmetingPeriode
        ? ` De nulmeting vond plaats tussen ${escapeHtml(nulmetingPeriode)}.`
        : '';
    mainHtml = `<p>Dit ${
      isHeronderzoek ? 'heronderzoek' : 'onderzoek'
    } is door Shift2 uitgevoerd tussen ${escapeHtml(
      dateStartFormatted
    )} en ${escapeHtml(
      dateEndFormatted
    )}.${nulmetingZin} Voor dit ${onderzoekWoord} is een representatieve steekproef samengesteld van ${totalPages} gepubliceerde webpagina's met verschillende contenttypen.</p>
<p>De onderzochte content voldoet ${
      percentage === 100 ? 'volledig' : 'niet volledig'
    } aan WCAG 2.2 niveau A en AA. In dit ${onderzoekWoord} zijn ${totalCriteria} succescriteria beoordeeld. Er wordt voldaan aan ${passedCriteria} van deze ${totalCriteria} succescriteria (${percentage}%). Bij ${failedCriteria} ${criteriaWord} zijn afwijkingen vastgesteld.</p>`;
  }

  const feedbackHtml = project.researcherFeedback
    ? `<div class="researcher-feedback">${project.researcherFeedback}</div>`
    : '';

  const closingAdvice = isFormulieren
    ? 'Wij adviseren om content periodiek te controleren op terugkerende patronen van toegankelijkheidsproblemen en toegankelijkheid structureel te borgen in het beheer- en publicatieproces van formulieren.'
    : 'Wij adviseren om content periodiek te controleren op terugkerende patronen van toegankelijkheidsproblemen en toegankelijkheid structureel te borgen in het publicatieproces.';

  return `<section class="content-block">
  <h2 id="samenvatting">Samenvatting</h2>
  ${mainHtml}
  ${feedbackHtml}
  <p>${closingAdvice}</p>
</section>`;
}

function renderOverOnderzoek(project: any, researchTypeData?: any): string {
  const standard = escapeHtml(project.standard || 'WCAG 2.2');
  const level = escapeHtml(
    researchTypeData?.level || project.level || 'A en AA'
  );
  const researchType = escapeHtml(project.researchType || 'onderzoek');
  const isContentOnderzoek = (project.researchType || '')
    .toLowerCase()
    .includes('content');

  // Het aantal beoordeelde criteria komt uit het onderzoekstype, niet uit een vast getal:
  // een contentonderzoek telt 30 criteria, de variant met formulieren in contentpagina's 33.
  const aantalBeoordeeld = researchTypeData?.criteria?.length || 30;
  const aantalOverig = 55 - aantalBeoordeeld;

  // 3.3.1, 3.3.3 en 3.3.7 horen inhoudelijk bij content, maar worden bij centraal beheerde
  // formulieren in het technisch deelonderzoek getoetst. Zitten ze wél in het onderzoekstype,
  // dan is die uitsluiting niet aan de orde en vervalt de tabel.
  const UITGESLOTEN = [
    { code: '3.3.1', naam: 'Foutidentificatie', niveau: 'A', reden: 'Formuliervalidatie wordt volledig door het systeem afgehandeld' },
    { code: '3.3.3', naam: 'Foutsuggestie', niveau: 'AA', reden: 'Foutsuggesties worden door het systeem gegenereerd' },
    { code: '3.3.7', naam: 'Overbodige invoer', niveau: 'A', reden: 'Het hergebruik van eerder ingevoerde gegevens binnen processen is technisch ingericht en wordt centraal beheerd' },
  ];
  const beoordeeldeCodes = new Set(
    (researchTypeData?.criteria || [])
      .map((c: any) => c.wcagCriterion?.code)
      .filter(Boolean),
  );
  const toonUitsluiting = beoordeeldeCodes.size > 0
    ? UITGESLOTEN.every((u) => !beoordeeldeCodes.has(u.code))
    : true;

  const uitsluitingHtml = toonUitsluiting
    ? `
    <h4>Uitgesloten succescriteria</h4>
    <p>Onderstaande succescriteria hebben raakvlakken met content, maar zijn in dit onderzoek niet beoordeeld:</p>
    <table>
      <thead>
        <tr><th>SC</th><th>Naam</th><th>Niveau</th><th>Reden van uitsluiting</th></tr>
      </thead>
      <tbody>
${UITGESLOTEN.map((u) => `        <tr><th scope="row">${u.code}</th><td>${u.naam}</td><td>${u.niveau}</td><td>${u.reden}</td></tr>`).join('\n')}
      </tbody>
    </table>`
    : '';

  const tweedeAlinea = toonUitsluiting
    ? `<p>De overige ${aantalOverig} succescriteria worden beoordeeld in het afzonderlijke deelonderzoek techniek. Daarvan gaan er ${aantalOverig - UITGESLOTEN.length} over de technische basis van de website. De overige ${UITGESLOTEN.length} zijn hieronder toegelicht.</p>`
    : `<p>De overige ${aantalOverig} succescriteria worden beoordeeld in het afzonderlijke deelonderzoek techniek. Zij gaan over de technische basis van de website.</p>`;

  const afbakeningPanel = isContentOnderzoek
    ? `<div class="panel"><div class="panel-title"><h3>Afbakening van het onderzoek</h3></div><div class="panel-body">
    <p>Dit deelonderzoek heeft uitsluitend betrekking op de content van de website die door de organisatie via het CMS kan worden ingevoerd of aangepast.</p>
    <p>Bij dit onderzoek zijn ${aantalBeoordeeld} van de 55 succescriteria van WCAG 2.2 niveau A en AA beoordeeld.</p>
    ${tweedeAlinea}
    <p>Beide deelonderzoeken vormen gezamenlijk de volledige beoordeling van de website.</p>${uitsluitingHtml}
  </div></div>`
    : '';

  return `<section class="content-block">
  <h2 id="over-dit-onderzoek">Over dit onderzoek</h2>
  <p>Voor de website is een ${researchType} uitgevoerd naar de toegankelijkheid, om vast te stellen in hoeverre deze voldoet aan ${standard} niveau ${level} (EN 301 549).</p>
  <p>De geldigheid van dit onderzoeksrapport bedraagt drie jaar. Bij substantiële wijzigingen in de content adviseren wij een aanvullend of nieuw onderzoek uit te laten voeren.</p>

  ${afbakeningPanel}

  <div class="panel"><div class="panel-title"><h3>Reikwijdte en werkwijze</h3></div><div class="panel-body">
    <p>Het onderzoek is uitgevoerd op basis van een representatieve steekproef. Binnen deze steekproef zijn de aangetroffen toegankelijkheidsproblemen zo concreet mogelijk beschreven. Waar mogelijk is een aanbeveling opgenomen om de afwijking te verhelpen.</p>
    <p>Dit onderzoek biedt geen uitputtend overzicht van alle mogelijke toegankelijkheidsproblemen. De bevindingen vormen een momentopname van de situatie ten tijde van het onderzoek.</p>
  </div></div>

  <div class="panel"><div class="panel-title"><h3>Wat is WCAG?</h3></div><div class="panel-body">
    <p>WCAG (<span lang="en">Web Content Accessibility Guidelines</span>) zijn internationaal erkende richtlijnen voor digitale toegankelijkheid, opgebouwd rond vier principes: Waarneembaar, Bedienbaar, Begrijpelijk en Robuust. Binnen deze principes zijn meetbare succescriteria vastgesteld.</p>
    <p><a href="https://www.w3.org/Translations/WCAG22-nl" target="_blank" rel="noopener">Meer informatie: WCAG 2.2 (Nederlandse vertaling)</a></p>
  </div></div>
</section>`;
}

function renderOverzichtResultaten(
  rows: Array<{ code: string; title: string; level: string; status: any }>,
  principleStats: any[]
): string {
  const tableRows = rows
    .map((r) => {
      const s = statusLabel(r.status);
      const thClass = r.status === 'failed' ? 'class="bold"' : '';
      return `<tr>
        <th scope="row" ${thClass}>${escapeHtml(r.code)} ${escapeHtml(r.title)}</th>
        <td ${thClass}>${escapeHtml(r.level)}</td>
        <td class="${s.klass}">${escapeHtml(s.label)}</td>
      </tr>`;
    })
    .join('\n');

  const scoreRows = principleStats
    .map((p: any) => {
      const aP = p.levelA?.passed || 0;
      const aT = p.levelA?.total || 0;
      const aaP = p.levelAA?.passed || 0;
      const aaT = p.levelAA?.total || 0;
      const tP = p.total?.passed || (aP + aaP);
      const tT = p.total?.total || (aT + aaT);
      return `<tr>
        <th scope="row">${escapeHtml(getPrincipleLabel(p.principle))}</th>
        <td>${aP} / ${aT}</td>
        <td>${aaP} / ${aaT}</td>
        <td>${tP} / ${tT}</td>
      </tr>`;
    })
    .join('\n');

  const totA = principleStats.reduce((s: number, p: any) => s + (p.levelA?.total || 0), 0);
  const totAA = principleStats.reduce((s: number, p: any) => s + (p.levelAA?.total || 0), 0);
  const passA = principleStats.reduce((s: number, p: any) => s + (p.levelA?.passed || 0), 0);
  const passAA = principleStats.reduce((s: number, p: any) => s + (p.levelAA?.passed || 0), 0);

  return `<section class="content-block">
  <h2 id="overzicht-resultaten">Overzicht resultaten</h2>
  <p>De resultaten zijn weergegeven in twee overzichten: per succescriterium en per WCAG-principe.</p>

  <div class="panel"><div class="panel-title"><h3>Resultaten per succescriterium</h3></div><div class="panel-body">
    <table>
      <thead>
        <tr><th>Succescriterium</th><th>Niveau</th><th>Resultaat</th></tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
  </div></div>

  <div class="panel"><div class="panel-title"><h3>Onderzoeksscores</h3></div><div class="panel-body">
    <p>De tabel hieronder laat per WCAG-principe en per WCAG-niveau zien hoeveel succescriteria zijn getoetst en hoeveel daarvan goedgekeurd zijn.</p>
    <table>
      <thead>
        <tr><th>WCAG Principe</th><th>Niveau A</th><th>Niveau AA</th><th>Totaal</th></tr>
      </thead>
      <tbody>
        ${scoreRows}
        <tr>
          <th scope="row" class="bold">Totaal</th>
          <td class="bold">${passA} / ${totA}</td>
          <td class="bold">${passAA} / ${totAA}</td>
          <td class="bold">${passA + passAA} / ${totA + totAA}</td>
        </tr>
      </tbody>
    </table>
  </div></div>
</section>`;
}

function renderBevindingenSectie(
  grouped: any[],
  kind: 'bevinding' | 'opmerking',
  isHeronderzoek = false
): string {
  const isOpmerkingen = kind === 'opmerking';
  const heading = isOpmerkingen ? 'Opmerkingen' : 'Bevindingen';
  const intro = isOpmerkingen
    ? 'De onderstaande opmerkingen leiden niet tot een afkeuring, maar bevatten suggesties die de toegankelijkheid of gebruiksvriendelijkheid verder kunnen verbeteren.'
    : 'Hieronder worden de vastgestelde afwijkingen beschreven. Per bevinding is de locatie en een beschrijving van het probleem opgenomen gevolgd door de impact op de gebruiker en een advies om de afwijking te verhelpen.';
  const resultLabel = isOpmerkingen
    ? 'Voldoet maar met opmerking'
    : 'Voldoet niet';
  const resultClass = isOpmerkingen ? 'result-note' : 'result-fail';
  const itemLabel = isOpmerkingen ? 'Opmerking' : 'Bevinding';

  const criteriaBlocks: string[] = [];
  // Flatten all criteria from all principles/guidelines and sort numerically by WCAG code
  const flatCriteria: any[] = [];
  for (const group of grouped) {
    for (const gl of group.guidelines) {
      for (const crit of gl.criteria) {
        flatCriteria.push(crit);
      }
    }
  }
  flatCriteria.sort((a, b) => compareWcagCodes(a.code, b.code));

  for (const crit of flatCriteria) {
    {
      {
        const findings = ((crit as any).findings || []).filter((f: any) => {
          // Bevinding of opmerking staat in het type-veld.
          // Status (open/resolved) wordt elders gebruikt voor het label.
          //
          // Bij een heronderzoek vervalt wat is opgelost. Filter daarvoor NIET op
          // status alleen: een opmerking staat óók op 'resolved' zonder dat dat iets
          // over opgelost zijn zegt. hoortInRapport() maakt dat onderscheid:
          // opgeloste afkeuringen vallen weg, opmerkingen alleen als ze in de
          // tussencheck zijn nagelopen en opgelost bevonden (interimReviewed).
          if (isHeronderzoek && !hoortInRapport(f)) return false;
          return isOpmerkingen ? isOpmerking(f) : !isOpmerking(f);
        });
        if (findings.length === 0) continue;

        const findingsHtml = findings
          .map((f: any, idx: number) => {
            const urls = Array.from(
              new Set(
                (f.occurrences || [])
                  .map((o: any) => o.sampleItem?.url)
                  .filter((u: any) => !!u)
              )
            ) as string[];
            const locHtml =
              urls.length === 0
                ? ''
                : urls.length === 1
                ? `<p><a href="${escapeHtml(urls[0])}" target="_blank" rel="noopener">${escapeHtml(urls[0])}</a></p>`
                : `<ul>${urls
                    .map(
                      (u) =>
                        `<li><a href="${escapeHtml(u)}" target="_blank" rel="noopener">${escapeHtml(u)}</a></li>`
                    )
                    .join('')}</ul>`;
            const descHtml = renderFindingMarkdown(f.description);
            const adviceHtml = f.advice
              ? `<h5>Advies</h5><div class="finding-text">${renderFindingMarkdown(f.advice)}</div>`
              : '';
            return `<div class="panel"><div class="panel-title"><h4>${itemLabel} ${
              idx + 1
            } (SC ${escapeHtml(crit.code)})</h4></div><div class="panel-body">
              ${locHtml}
              <div class="finding-text">${descHtml}</div>
              ${adviceHtml}
            </div></div>`;
          })
          .join('\n');

        const understandingUrl = (crit as any).understandingUrl || '';
        const critDesc = (crit as any).description || '';
        const descLine = critDesc
          ? `<p>${escapeHtml(stripHtml(critDesc))}</p>`
          : '';

        criteriaBlocks.push(`<h3>${escapeHtml(crit.code)} ${escapeHtml(crit.title)} ${escapeHtml(crit.level)}</h3>
${descLine}
${
  understandingUrl
    ? `<p><a href="${escapeHtml(understandingUrl)}" target="_blank" rel="noopener">${escapeHtml(crit.code)} ${escapeHtml(crit.title)}</a></p>`
    : ''
}
<p><span class="bold">Resultaat:</span> <span class="result-label ${resultClass}">${resultLabel}</span></p>
${findingsHtml}`);
      }
    }
  }

  if (criteriaBlocks.length === 0) {
    return `<section class="content-block">
  <h2 id="${isOpmerkingen ? 'opmerkingen' : 'bevindingen'}">${heading}</h2>
  <p>Er zijn geen ${heading.toLowerCase()} vastgesteld.</p>
</section>`;
  }

  return `<section class="content-block">
  <h2 id="${isOpmerkingen ? 'opmerkingen' : 'bevindingen'}">${heading}</h2>
  <p>${intro}</p>
  ${criteriaBlocks.join('\n')}
</section>`;
}

function renderBorging(): string {
  return `<section class="content-block">
  <h2 id="borging-en-vervolg">Borging en vervolg</h2>
  <p>Omdat het onderzoek is uitgevoerd op basis van een steekproef, kunnen vergelijkbare afwijkingen ook voorkomen in pagina's die niet zijn onderzocht. Het is daarom raadzaam om de volledige website te controleren op vergelijkbare patronen en deze structureel te monitoren.</p>
  <p>Daarnaast kunnen wijzigingen in de content of het publicatieproces nieuwe toegankelijkheidsrisico's met zich meebrengen. Structurele aandacht voor toegankelijkheid en periodieke herbeoordeling blijven daarom noodzakelijk.</p>
</section>`;
}

function renderOnderzoeksdetails(
  project: any,
  sampleItems: any[],
  scopeIn: any[],
  scopeOut: any[]
): string {
  const scopeInHtml =
    scopeIn.length > 0
      ? scopeIn
          .map(
            (s: any) =>
              `<p><a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.url)}</a>${
                s.note ? ' (' + escapeHtml(s.note) + ')' : ' (URI-basis)'
              }</p>`
          )
          .join('')
      : '<p>Geen scope-URLs vastgelegd.</p>';

  const scopeOutHtml =
    scopeOut.length > 0
      ? `<ul>${scopeOut
          .map(
            (s: any) =>
              `<li><a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.url)}</a>${
                s.note ? ' (' + escapeHtml(s.note) + ')' : ''
              }</li>`
          )
          .join('')}</ul>`
      : '';

  const sampleHtml =
    sampleItems.length > 0
      ? `<ul>${sampleItems
          .map((s: any) => {
            if (s.url) {
              return `<li><a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.url)}</a></li>`;
            }
            return `<li>${escapeHtml(s.title || 'Onbenoemd')}</li>`;
          })
          .join('')}</ul>`
      : '<p>Geen sample-items vastgelegd.</p>';

  const techList =
    (project.technologies || []).length > 0
      ? `<ul>${(project.technologies || [])
          .map((t: string) => `<li>${escapeHtml(t)}</li>`)
          .join('')}</ul>`
      : '<p>Niet opgegeven.</p>';

  const userAgents = project.userAgents
    ? formatUserAgentsHtml(project.userAgents) || '<p>Niet opgegeven.</p>'
    : '<p>Niet opgegeven.</p>';

  const scopeInfoHtml = project.scopeInfo
    ? `<h4>Overige scope informatie</h4>${renderFindingMarkdown(project.scopeInfo)}`
    : '';

  return `<section class="content-block">
  <h2 id="onderzoeksdetails">Onderzoeksdetails</h2>
  <p>Dit hoofdstuk bevat de onderzoeksverantwoording: de scope en steekproef van het onderzoek, de gehanteerde methode en de hulpmiddelen waarmee is getest.</p>

  <div class="panel"><div class="panel-title"><h3>Scope</h3></div><div class="panel-body">
    <p>Bij de URL staat de reden waarom een gedeelte wel of niet is meegenomen. Dit is conform de regels voor het bepalen van de scope in de evaluatiemethode WCAG-EM.</p>
    ${scopeInHtml}
    ${scopeOut.length > 0 ? '<h4>Buiten scope</h4>' + scopeOutHtml : ''}
    ${scopeInfoHtml}
  </div></div>

  <div class="panel"><div class="panel-title"><h3>Steekproef</h3></div><div class="panel-body">
    <p>Dit onderzoek is uitgevoerd op basis van een steekproef. De wijze waarop de steekproef is bepaald staat voorgeschreven in het evaluatiedocument WCAG-EM. Zie: <a href="https://www.digitoegankelijk.nl/toegankelijkheidsverklaring/onderzoek" target="_blank" rel="noopener">digitoegankelijk.nl/toegankelijkheidsverklaring/onderzoek</a></p>
    <h4>Volledige steekproef</h4>
    ${sampleHtml}
  </div></div>

  <div class="panel"><div class="panel-title"><h3>Onderzoeksmethode en technieken</h3></div><div class="panel-body">
    <p>Dit onderzoek is uitgevoerd conform de evaluatiemethode <a href="https://www.w3.org/WAI/test-evaluate/conformance/wcag-em" target="_blank" rel="noopener">WCAG-EM</a>. Deze methode is aanbevolen door <a href="https://www.digitoegankelijk.nl" target="_blank" rel="noopener">DigiToegankelijk (Logius)</a>. Bij het uitvoeren van dit onderzoek is ervan uitgegaan dat alle technieken van het W3C ondersteund worden en dus gebruikt mogen worden.</p>
  </div></div>

  <div class="panel"><div class="panel-title"><h3>Testomgeving</h3></div><div class="panel-body">
    ${userAgents}
  </div></div>

  <div class="panel"><div class="panel-title"><h3>Technologieën</h3></div><div class="panel-body">
    ${techList}
  </div></div>
</section>`;
}

const REPORT_CSS = `
:root {
  --shift2-purple: #2a0a4a;
  --shift2-accent: #8a2be2;
  --bg-odd: #ffffff;
  --bg-even: #f6f3fb;
  --border: #6d5a99;
  --text: #1a1a1a;
  --muted: #555;
}
* { box-sizing: border-box; }
body {
  font-family: 'brockmannregular', 'Helvetica Neue', Arial, sans-serif;
  color: var(--text); line-height: 1.6; margin: 0; padding: 0;
  background: #fff; font-size: 17px;
}
.container { max-width: 820px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
header.logo-header { padding: 2rem 1.5rem 1rem; max-width: 820px; margin: 0 auto; }
header.logo-header img { max-width: 200px; height: auto; }
h1 { font-family: 'brockmannbold', 'Helvetica Neue', Arial, sans-serif; color: var(--shift2-purple); font-size: 2.2rem; line-height: 1.2; margin: 1rem 0 1.5rem; }
h2 { font-family: 'brockmannbold', 'Helvetica Neue', Arial, sans-serif; color: var(--shift2-purple); font-size: 1.6rem; margin: 2.5rem 0 1rem; padding-bottom: 0.3rem; border-bottom: 2px solid var(--shift2-accent); }
h3 { font-family: 'brockmannbold', 'Helvetica Neue', Arial, sans-serif; color: var(--shift2-purple); font-size: 1.25rem; margin: 1.8rem 0 0.6rem; }
h4 { font-family: 'brockmannbold', 'Helvetica Neue', Arial, sans-serif; color: var(--shift2-purple); font-size: 1.05rem; margin: 1.2rem 0 0.4rem; }
h5 { font-family: 'brockmannbold', 'Helvetica Neue', Arial, sans-serif; font-size: 1rem; margin: 1rem 0 0.3rem; font-style: italic; }
p { margin: 0.6rem 0; }
a { color: var(--shift2-accent); }
a:hover { text-decoration: none; }
ul { padding-left: 1.4rem; }
li { margin: 0.3rem 0; }
section.content-block { padding: 1.5rem 0; }
section.content-block + section.content-block { border-top: 1px solid var(--border); }
.panel { border: 1px solid var(--border); border-radius: 6px; margin: 0.6rem 0; background: #fff; display: block; }
.panel > .panel-title { padding: 0.8rem 1rem; font-family: 'brockmannbold', 'Helvetica Neue', Arial, sans-serif; color: var(--shift2-purple); list-style: none; display: block; }
.panel > .panel-title h3, .panel > .panel-title h4 { display: inline; margin: 0; }
.panel > .panel-body { padding: 0 1rem 1rem; }
/* Normalise arbitrary HTML inside finding description/advice so that stray h1/h2/strong
   from the rich-text editor do not render as section headings. Scoped to .finding-text
   only, so legitieme H4's (zoals binnen het Afbakening-panel) blijven intact. */
.finding-text h1,
.finding-text h2,
.finding-text h3,
.finding-text h4,
.finding-text h5,
.finding-text h6 {
  font-family: 'brockmannregular', 'Helvetica Neue', Arial, sans-serif;
  font-size: 1rem;
  font-weight: normal;
  color: var(--text);
  margin: 0.6rem 0;
  border: 0;
  padding: 0;
}
.finding-text strong,
.finding-text b {
  font-weight: normal;
}
.panel-body a {
  overflow-wrap: anywhere;
  word-break: break-word;
}
table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.95rem; }
th, td { text-align: left; padding: 0.5rem 0.7rem; border-bottom: 1px solid var(--border); vertical-align: top; }
thead th { background: var(--bg-even); color: var(--shift2-purple); font-family: 'brockmannbold', 'Helvetica Neue', Arial, sans-serif; }
.bold { font-weight: bold; }
.fail { color: #b3261e; font-weight: bold; }
.result-label { display: inline-block; padding: 0.15rem 0.55rem; border-radius: 4px; font-size: 0.9rem; font-weight: bold; }
.result-fail { background: #fde0de; color: #b3261e; }
.result-note { background: #e6f5e7; color: #077D11; }
.intro { font-size: 1.1rem; color: var(--muted); }
.project-info { list-style: none; margin: 1.5rem 0 0; padding: 1rem 1.25rem; background: var(--bg-even); border-left: 4px solid var(--shift2-accent); border-radius: 4px; }
.project-info li { margin: 0 0 0.5rem; }
.project-info li:last-child { margin-bottom: 0; }
.project-info b { font-family: 'brockmannbold', 'Helvetica Neue', Arial, sans-serif; color: var(--shift2-purple); font-weight: normal; }
.researcher-feedback p { margin: 0.6rem 0; }
@media (max-width: 600px) {
  h1 { font-size: 1.7rem; }
  h2 { font-size: 1.3rem; }
  .container { padding: 1.5rem 1rem 3rem; }
}

/* Print- en PDF-opmaak.
   De schermweergave is ruim opgezet (17px basis) omdat je op een beeldscherm
   scrollt. Op papier kost die ruimte pagina's: dezelfde inhoud liep van 17 naar
   28 pagina's. Hieronder wordt de typografie teruggebracht naar drukwerkmaten
   en worden de marges rond koppen en blokken strakker gezet. */
@media print {
  body { font-size: 11pt; line-height: 1.45; }

  .container { max-width: none; padding: 0; margin: 0; }
  .logo-header { padding: 0 0 0.5rem; margin: 0; }
  .logo-header img { height: 34px; width: auto; }

  h1 { font-size: 19pt; line-height: 1.15; margin: 0 0 0.6rem; }
  h2 { font-size: 15pt; margin: 1.1rem 0 0.4rem; padding-bottom: 0.15rem; }
  h3 { font-size: 12.5pt; margin: 0.8rem 0 0.3rem; }
  h4 { font-size: 11.5pt; margin: 0.6rem 0 0.2rem; }
  h5 { font-size: 11pt; margin: 0.5rem 0 0.15rem; }

  p { margin: 0 0 0.45rem; }
  .intro { font-size: 11.5pt; margin-bottom: 0.6rem; }

  ul, ol { margin: 0.3rem 0 0.5rem; padding-left: 1.1rem; }
  li { margin-bottom: 0.15rem; }

  table { font-size: 9.5pt; margin: 0.5rem 0; }
  th, td { padding: 0.28rem 0.45rem; }

  section, .content-block { margin: 0 0 0.8rem; }
  .panel { margin: 0.5rem 0; }
  .panel-body { padding: 0.5rem 0.7rem; }
  .project-info { margin: 0.7rem 0 0; padding: 0.5rem 0.8rem; }
  .project-info li { margin-bottom: 0.2rem; }

  /* Koppen niet los aan de onderkant van een pagina laten staan, en
     tabelrijen niet over een paginabreuk splitsen. */
  h1, h2, h3, h4, h5 { page-break-after: avoid; break-after: avoid; }
  tr, li { page-break-inside: avoid; break-inside: avoid; }
  thead { display: table-header-group; }
}
`;
