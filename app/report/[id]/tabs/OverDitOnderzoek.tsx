'use client';

import { calculateReportStats, calculatePrincipleStats, getStatusLabel, getPrincipleLabel } from '@/lib/report-calculations';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { parseMarkdownTabs } from '@/lib/parse-tabs';
import { formatProjectName } from '@/lib/format-project-name';
import { useSearchParams } from 'next/navigation';
import { getDriveFolderUrl } from '@/lib/drive-folders';
import { isOpmerking, isOpenBevinding } from '@/lib/finding-classification';
import { formatUserAgentsHtml } from '@/lib/format-user-agents';
import { marked } from 'marked';

/**
 * Render markdown of HTML als HTML-string. Als de input geen HTML-tags bevat
 * (typisch markdown zoals `[tekst](url)`), wordt het via marked() geparsed.
 * Links krijgen target="_blank" voor externe navigatie.
 */
function renderFindingHtml(input: string): string {
  if (!input) return '';
  // Eerst alle HTML-tags escapen zodat <p>, <br>, <figure> etc. als tekst
  // verschijnen. Daarna markdown parsen (matched het gedrag van de admin-pagina).
  const escaped = input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  let html: string;
  try {
    html = marked(escaped, { breaks: true, gfm: true }) as string;
  } catch {
    html = escaped;
  }
  // target="_blank" op alle links
  return html.replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" ');
}

export default function OverDitOnderzoek({ project }: { project: any }) {
  const searchParams = useSearchParams();
  const isPdfMode = searchParams.get('pdf') === 'true';

  const [teamName, setTeamName] = useState('Shift2');
  const [aboutOrgText, setAboutOrgText] = useState('');
  const [teamEmail, setTeamEmail] = useState('');
  const [openAccordions, setOpenAccordions] = useState<Set<number>>(new Set());
  const [openResultsAccordions, setOpenResultsAccordions] = useState<Set<string>>(new Set());
  const [openFindingsAccordions, setOpenFindingsAccordions] = useState<Set<string>>(new Set());
  const [openDetailsAccordions, setOpenDetailsAccordions] = useState<Set<string>>(new Set());
  const [openAfbakeningAccordions, setOpenAfbakeningAccordions] = useState<Set<string>>(new Set());

  // Bij een heronderzoek betekent status 'resolved' dat het punt is opgelost;
  // die verdwijnt dan uit het rapport.
  const isHeronderzoekReport = project.checkPhase === 'herinspectie';
  const isOpenOpmerking = (f: any) =>
    isOpmerking(f) && !(isHeronderzoekReport && f.status === 'resolved');

  const handleDownloadPdf = async () => {
    try {
      const button = document.querySelector('[data-pdf-button]') as HTMLButtonElement;
      if (button) {
        button.disabled = true;
        button.textContent = 'PDF wordt gegenereerd...';
      }

      // Call the server-side PDF generation API
      const response = await fetch(`/api/reports/${project.id}/pdf`);

      if (!response.ok) {
        throw new Error('PDF generatie mislukt');
      }

      // Get the PDF blob
      const pdfBlob = await response.blob();

      // Download the PDF
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = `rapport-${project.subject || project.title}-v${project.version}.pdf`.replace(/[^a-zA-Z0-9.-]/g, '_');
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      if (button) {
        button.disabled = false;
        button.textContent = 'Download PDF';
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Er is een fout opgetreden bij het genereren van de PDF. Probeer het opnieuw.');

      const button = document.querySelector('[data-pdf-button]') as HTMLButtonElement;
      if (button) {
        button.disabled = false;
        button.textContent = 'Download PDF';
      }
    }
  };

  useEffect(() => {
    // Get team info from API
    const fetchTeamInfo = async () => {
      try {
        const response = await fetch('/api/team');
        if (response.ok) {
          const teamInfo = await response.json();
          setTeamName(teamInfo.name || 'Shift2');
          setAboutOrgText(teamInfo.about || '');
          setTeamEmail(teamInfo.email || '');
        }
      } catch (error) {
        console.error('Error fetching team info:', error);
      }
    };

    fetchTeamInfo();
  }, []);

  // Add target="_blank" and external icon to all links in markdown content
  useEffect(() => {
    const links = document.querySelectorAll('.report-markdown-content a');
    links.forEach((link) => {
      const anchor = link as HTMLAnchorElement;
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('rel', 'noopener noreferrer');
    });
  }, [project]);

  const stats = calculateReportStats(project);
  const principleStats = calculatePrincipleStats(project);

  // Use researchStartedOn instead of dateStart for the report
  const dateStart = project.researchStartedOn ? new Date(project.researchStartedOn) : (project.dateStart ? new Date(project.dateStart) : null);
  const dateEnd = project.dateEnd ? new Date(project.dateEnd) : null;
  const reportDate = new Date(project.reportDate);

  // Prepare criteria data sorted by code (numerically)
  const sortedCriteria = [...project.criterionAssessments].sort((a: any, b: any) => {
    const [aMajor, aMinor, aPatch] = a.wcagCriterion.code.split('.').map(Number);
    const [bMajor, bMinor, bPatch] = b.wcagCriterion.code.split('.').map(Number);

    if (aMajor !== bMajor) return aMajor - bMajor;
    if (aMinor !== bMinor) return aMinor - bMinor;
    return aPatch - bPatch;
  });

  // Auto-open all accordions in PDF mode
  useEffect(() => {
    if (isPdfMode) {
      // Open all report intro accordions
      const parsedContent = parseMarkdownTabs(project.researchTypeData?.reportIntro);
      if (parsedContent && parsedContent.tabs.length > 0) {
        const allIndices = new Set(parsedContent.tabs.map((_, index) => index));
        setOpenAccordions(allIndices);
      }

      // Open all results accordions
      setOpenResultsAccordions(new Set(['criteria', 'principles']));

      // Open all findings accordions
      const findingKeys = new Set<string>();
      sortedCriteria
        .filter((assessment: any) => assessment.status === 'failed')
        .forEach((assessment: any) => {
          const findings = project.findings?.filter((f: any) => f.wcagCriterionId === assessment.wcagCriterion.id && isOpenBevinding(f)) || [];
          findings.forEach((finding: any) => {
            findingKeys.add(`${assessment.wcagCriterion.id}-${finding.id}`);
          });
        });

      // Open all remarks accordions (opmerking = impact leeg, ongeacht status;
      // opmerkingen worden bewust met status 'resolved' opgeslagen)
      sortedCriteria
        .filter((assessment: any) => {
          const hasRemark = project.findings?.some((f: any) => f.wcagCriterionId === assessment.wcagCriterion.id && isOpenOpmerking(f));
          return hasRemark;
        })
        .forEach((assessment: any) => {
          const findings = project.findings?.filter((f: any) => f.wcagCriterionId === assessment.wcagCriterion.id && isOpenOpmerking(f)) || [];
          findings.forEach((finding: any) => {
            findingKeys.add(`opmerking-${assessment.wcagCriterion.id}-${finding.id}`);
          });
        });

      setOpenFindingsAccordions(findingKeys);

      // Open all details accordions
      setOpenDetailsAccordions(new Set(['scope', 'sample', 'method', 'environment', 'technologies']));

      // Open all afbakening accordions (including the main afbakening accordion and the nested ones)
      setOpenAfbakeningAccordions(new Set(['afbakening-main', 'embedded', 'reikwijdte', 'wcag']));
    }
  }, [isPdfMode, project.researchTypeData?.reportIntro, project.findings, sortedCriteria]);

  // Get the first manually added scope URL
  const firstScopeUrl = project.scopeUrls.find((url: any) => url.inScope === true && !url.parentUrlId);
  const scopeDomain = firstScopeUrl ? new URL(firstScopeUrl.url).hostname : '';
  const scopeUrl = firstScopeUrl?.url ? firstScopeUrl.url.replace(/\/$/, '') : '';

  // Extract domain from subject for intro text
  const getIntroUrl = () => {
    const subjectOrTitle = project.subject || project.title || '';
    if (subjectOrTitle.includes(' - ')) {
      const parts = subjectOrTitle.split(' - ');
      const lastPart = parts[parts.length - 1].trim();
      // Add protocol if not present
      if (lastPart && !lastPart.startsWith('http')) {
        return `https://${lastPart}`;
      }
      return lastPart;
    }
    return scopeUrl;
  };
  const introUrl = getIntroUrl();

  // Generate automatic summary
  const generateAutoSummary = () => {
    const totalPages = project.sampleItems.length;
    const passedCriteria = stats.effectivePassed;
    const totalCriteria = stats.totalAssessed;
    const percentage = totalCriteria > 0 ? Math.round((passedCriteria / totalCriteria) * 100) : 0;
    const failedCriteria = stats.failed;

    const dateStartFormatted = dateStart ? format(dateStart, 'd MMMM yyyy', { locale: nl }) : '[datum]';
    const dateEndFormatted = dateEnd ? format(dateEnd, 'd MMMM yyyy', { locale: nl }) : '[datum]';

    const isFormulieren = project.researchTypeData?.type === 'formulieren';

    // Bij een heronderzoek wordt de periode van de nulmeting erbij vermeld
    const isHeronderzoek = project.checkPhase === 'herinspectie';
    const nulmetingStart = project.nulmetingDates?.dateStart ? new Date(project.nulmetingDates.dateStart) : null;
    const nulmetingEnd = project.nulmetingDates?.dateEnd ? new Date(project.nulmetingDates.dateEnd) : null;
    const nulmetingPeriode = nulmetingStart && nulmetingEnd
      ? `${format(nulmetingStart, 'd MMMM yyyy', { locale: nl })} en ${format(nulmetingEnd, 'd MMMM yyyy', { locale: nl })}`
      : null;

    // For formulieren projects: count in-scope URLs (each URL = one form)
    // For other projects: use total sample items
    const uniqueForms = isFormulieren && project.scopeUrls
      ? project.scopeUrls.filter((url: any) => url.inScope).length
      : totalPages;

    // Check if research type has a custom summary template
    if (project.researchTypeData?.summaryTemplate) {
      let template = project.researchTypeData.summaryTemplate;

      // Bij een heronderzoek: spreek van heronderzoek en noem de periode van de nulmeting
      if (isHeronderzoek) {
        template = template
          .replace(/Dit onderzoek is/g, 'Dit heronderzoek is')
          .replace(/\bdit deelonderzoek\b/g, 'dit heronderzoek');

        if (nulmetingPeriode) {
          template = template.replace(
            /(Dit heronderzoek is door Shift2 uitgevoerd tussen \{dateStart\} en \{dateEnd\}\.)/,
            `$1 De nulmeting vond plaats tussen ${nulmetingPeriode}.`
          );
        }
      }

      // Replace placeholders with actual values
      const summaryHtml = template
        .replace(/\{dateStart\}/g, dateStartFormatted)
        .replace(/\{dateEnd\}/g, dateEndFormatted)
        .replace(/\{totalPages\}/g, String(totalPages))
        .replace(/\{uniqueForms\}/g, String(uniqueForms))
        .replace(/\{totalCriteria\}/g, String(totalCriteria))
        .replace(/\{passedCriteria\}/g, String(passedCriteria))
        .replace(/\{percentage\}/g, String(percentage))
        .replace(/\{failedCriteria\}/g, String(failedCriteria))
        .replace(/\{compliesFully\}/g, percentage === 100 ? 'volledig' : 'niet volledig')
        .replace(/\{formsSingularPlural\}/g, uniqueForms === 1 ? 'formulier' : 'formulieren')
        .replace(/\{pagesSingularPlural\}/g, totalPages === 1 ? 'processtap' : 'processtappen')
        .replace(/\{criteriaFailedSingularPlural\}/g, failedCriteria === 1 ? 'succescriterium' : 'succescriteria')
        .replace(/\{standard\}/g, project.researchTypeData?.version || 'WCAG 2.2')
        .replace(/\{level\}/g, project.researchTypeData?.level || 'A en AA');

      return (
        <>
          <div dangerouslySetInnerHTML={{ __html: summaryHtml }} />

          {/* Researcher feedback if available */}
          {project.researcherFeedback && (
            <div
              className="mt-4 prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_p]:mb-2"
              dangerouslySetInnerHTML={{ __html: project.researcherFeedback }}
            />
          )}

          {/* Closing advice - formulieren specific or default */}
          <p className="mt-4">
            {isFormulieren
              ? 'Wij adviseren om content periodiek te controleren op terugkerende patronen van toegankelijkheidsproblemen en toegankelijkheid structureel te borgen in het beheer- en publicatieproces van formulieren.'
              : 'Wij adviseren om content periodiek te controleren op terugkerende patronen van toegankelijkheidsproblemen en toegankelijkheid structureel te borgen in het publicatieproces.'
            }
          </p>
        </>
      );
    }

    // Fallback to default template
    return (
      <>
        <p className="mb-4">
          Dit {isHeronderzoek ? 'heronderzoek' : 'onderzoek'} is door Shift2 uitgevoerd tussen {dateStartFormatted} en {dateEndFormatted}.{isHeronderzoek && nulmetingPeriode ? ` De nulmeting vond plaats tussen ${nulmetingPeriode}.` : ''} Voor dit {isHeronderzoek ? 'heronderzoek' : 'deelonderzoek'} is een representatieve steekproef samengesteld van {totalPages} gepubliceerde webpagina's met verschillende contenttypen.
        </p>

        <p className="mb-4">
          De onderzochte content voldoet {percentage === 100 ? 'volledig' : 'niet volledig'} aan WCAG 2.2 niveau A en AA. In dit {isHeronderzoek ? 'heronderzoek' : 'deelonderzoek'} zijn {totalCriteria} succescriteria beoordeeld. Er wordt voldaan aan {passedCriteria} van deze {totalCriteria} succescriteria ({percentage}%). Bij {failedCriteria} {failedCriteria === 1 ? 'succescriterium' : 'succescriteria'} zijn afwijkingen vastgesteld.
        </p>

        {/* Researcher feedback if available */}
        {project.researcherFeedback && (
          <div
            className="mb-4 prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_p]:mb-2"
            dangerouslySetInnerHTML={{ __html: project.researcherFeedback }}
          />
        )}

        {/* Closing advice - formulieren specific or default */}
        <p>
          {isFormulieren
            ? 'Wij adviseren om content periodiek te controleren op terugkerende patronen van toegankelijkheidsproblemen en toegankelijkheid structureel te borgen in het beheer- en publicatieproces van formulieren.'
            : 'Wij adviseren om content periodiek te controleren op terugkerende patronen van toegankelijkheidsproblemen en toegankelijkheid structureel te borgen in het publicatieproces.'
          }
        </p>
      </>
    );
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .scope-info-content a,
        .report-markdown-content a {
          color: #2563eb !important;
          text-decoration: underline !important;
        }
        .scope-info-content a::after,
        .report-markdown-content a::after {
          content: '';
          display: inline-block;
          width: 12px;
          height: 12px;
          margin-left: 4px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%232563eb' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6'%3E%3C/path%3E%3Cpolyline points='15 3 21 3 21 9'%3E%3C/polyline%3E%3Cline x1='10' y1='14' x2='21' y2='3'%3E%3C/line%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-size: contain;
          vertical-align: middle;
        }
        .report-markdown-content h2 {
          font-size: 1.5rem !important;
          font-weight: 700 !important;
          color: #111827 !important;
          margin-bottom: 1rem !important;
          margin-top: 0 !important;
        }
        .scope-info-content h3,
        .report-markdown-content h3 {
          font-size: 1.125rem !important;
          font-weight: 700 !important;
          color: #111827 !important;
          margin-top: 1rem !important;
          margin-bottom: 0.5rem !important;
        }
        .scope-info-content h3:first-child,
        .report-markdown-content h3:first-child {
          margin-top: 0 !important;
        }
        .scope-info-content h4,
        .report-markdown-content h4 {
          font-size: 1rem !important;
          font-weight: 700 !important;
          color: #111827 !important;
          margin-top: 1rem !important;
          margin-bottom: 0.5rem !important;
        }
        .scope-info-content h4:first-child,
        .report-markdown-content h4:first-child {
          margin-top: 0 !important;
        }
        .report-markdown-content table {
          width: 100% !important;
          border-collapse: collapse !important;
          margin: 1rem 0 !important;
        }
        .report-markdown-content table th,
        .report-markdown-content table td {
          border: 1px solid #d1d5db !important;
          padding: 0.5rem !important;
          text-align: left !important;
        }
        .report-markdown-content table th {
          background-color: #f9fafb !important;
          font-weight: 600 !important;
        }
        .report-markdown-content table tr:nth-child(even) {
          background-color: #f9fafb !important;
        }

        /* Screen reader only - hide visually but keep for assistive tech */
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }

        /* Print styles */
        @media print {
          /* Hide sidebar when printing */
          .grid-cols-3 > div:last-child {
            display: none !important;
          }

          /* Make main content full width */
          .grid-cols-3 > div:first-child {
            grid-column: span 3 !important;
          }

          /* Ensure accordions are visible in print */
          button[aria-expanded] + div {
            display: block !important;
          }

          /* Hide accordion toggle buttons - decorative in PDF */
          button[aria-expanded] {
            pointer-events: none;
          }

          /* Hide accordion expand/collapse icons - decorative */
          button[aria-expanded] > span:last-child {
            display: none !important;
          }

          /* Remove ALL borders and shadows - no exceptions */
          * {
            border: none !important;
            box-shadow: none !important;
            outline: none !important;
          }

          /* Specifically target common border classes */
          .border, .border-t, .border-b, .border-l, .border-r,
          .border-gray-200, .border-gray-300, .border-gray-400,
          .shadow, .shadow-sm, .shadow-md, .shadow-lg,
          table, th, td, tr, thead, tbody,
          div, section, button {
            border: none !important;
            box-shadow: none !important;
            outline: none !important;
          }

          /* Add spacing between table cells instead of borders */
          table {
            border-spacing: 0 0.25rem !important;
            border-collapse: separate !important;
          }

          /* Add subtle background to table rows for readability */
          tbody tr {
            background-color: #f9fafb !important;
          }
          tbody tr:nth-child(even) {
            background-color: #f3f4f6 !important;
          }
          thead tr {
            background-color: #e5e7eb !important;
          }

          /* Add padding to table cells for better spacing without borders */
          table th, table td {
            padding: 0.5rem 1rem !important;
          }

          /* Better page breaks */
          section {
            page-break-inside: avoid;
          }

          h1, h2, h3 {
            page-break-after: avoid;
          }

          /* Ensure tables don't break awkwardly */
          table {
            page-break-inside: avoid;
          }

          /* Remove decorative rounded corners */
          .rounded, .rounded-lg, .rounded-md {
            border-radius: 0 !important;
          }

          /* Hide ALL SVG icons - they create padobjects */
          svg {
            display: none !important;
          }

          /* Remove ALL pseudo-elements (::before, ::after) */
          *::before, *::after {
            display: none !important;
            content: none !important;
            background-image: none !important;
            background: none !important;
          }

          /* Remove ALL decorative list styling */
          ul, ol {
            list-style: none !important;
            list-style-type: none !important;
            list-style-image: none !important;
          }

          /* Remove ALL text decorations */
          a, u {
            text-decoration: none !important;
          }

          /* Remove ALL background images */
          * {
            background-image: none !important;
          }

          /* Remove underlines from links */
          .text-blue-600, .underline {
            text-decoration: none !important;
          }
        }
      `}} />
      <div className="grid grid-cols-3 gap-8">
      {/* Main content */}
      <div className="col-span-2 space-y-8">
        {/* Project header */}
        <section>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {[project.researchType, scopeUrl.replace(/^https?:\/\//, '')].filter(Boolean).join(' ') || `Toegankelijkheidsonderzoek ${formatProjectName(project.subject || project.title, project.researchTypeData?.type)}`}
            </h1>
          </div>
        </section>

        {/* Report intro */}
        <section>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-gray-700 leading-relaxed mb-3">
              {(() => {
                // Use reportIntroHeader if available
                // Bij een heronderzoek spreken we van heronderzoek in plaats van deelonderzoek
                const rawTemplate = project.researchTypeData?.reportIntroHeader;
                const template = rawTemplate && project.checkPhase === 'herinspectie'
                  ? rawTemplate.replace(/\bdeelonderzoek\b/g, 'heronderzoek')
                  : rawTemplate;

                if (template) {
                  // Split the template by {url} placeholder
                  const parts = template.split('{url}');

                  return (
                    <>
                      {parts[0]}
                      <a
                        href={introUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline inline-flex items-center gap-1"
                      >
                        {introUrl}
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      {parts[1] || ''}
                    </>
                  );
                } else {
                  // Fallback to default text
                  return (
                    <>
                      Dit rapport beschrijft de resultaten van het {project.checkPhase === 'herinspectie' ? 'heronderzoek' : 'deelonderzoek'} naar de toegankelijkheid van de content op de {project.researchTypeData?.type || 'website'}{' '}
                      <a
                        href={introUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline inline-flex items-center gap-1"
                      >
                        {introUrl}
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </>
                  );
                }
              })()}
            </p>
            <p className="text-gray-700 leading-relaxed">
              Het onderzoek is uitgevoerd conform {project.researchTypeData?.version || 'WCAG 2.2'} niveau {project.researchTypeData?.level || 'A en AA'} (EN 301 549), volgens de evaluatiemethode WCAG-EM.
            </p>
            <dl className="mt-6 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="font-medium text-gray-600">Opdrachtgever:</dt>
              <dd className="text-gray-900">{project.commissionedBy || project.clientProject?.name || 'n.v.t.'}</dd>
              <dt className="font-medium text-gray-600">Website:</dt>
              <dd className="text-gray-900">{scopeDomain || introUrl || 'n.v.t.'}</dd>
              <dt className="font-medium text-gray-600">Rapportversie:</dt>
              <dd className="text-gray-900">{Number(project.version).toFixed(1)}</dd>
              <dt className="font-medium text-gray-600">Datum:</dt>
              <dd className="text-gray-900">{format(reportDate, 'd MMMM yyyy', { locale: nl })}</dd>
            </dl>
          </div>
        </section>

        {/* Summary */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Samenvatting</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-gray-700 whitespace-pre-line">
              {project.managementSummary ? (
                <div
                  className="prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_p]:mb-2"
                  dangerouslySetInnerHTML={{ __html: project.managementSummary }}
                />
              ) : (
                generateAutoSummary()
              )}
            </div>
          </div>
        </section>

        {/* What was tested */}
        <section>
          {(() => {
              const parsedContent = parseMarkdownTabs(project.researchTypeData?.reportIntro);

              if (parsedContent && parsedContent.tabs.length > 0) {
                // Toggle accordion function
                const toggleAccordion = (index: number) => {
                  const newOpenAccordions = new Set(openAccordions);
                  if (newOpenAccordions.has(index)) {
                    newOpenAccordions.delete(index);
                  } else {
                    newOpenAccordions.add(index);
                  }
                  setOpenAccordions(newOpenAccordions);
                };

                // Render accordion interface with optional intro
                return (
                  <div className="space-y-4">
                    {/* Intro section (if present) */}
                    {parsedContent.intro && (
                      <div className="report-markdown-content text-gray-700 prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_p]:mb-2 mb-4">
                        <div dangerouslySetInnerHTML={{ __html: parsedContent.intro }} />
                      </div>
                    )}

                    {/* Accordion section */}
                    <div className="space-y-0 border border-gray-300 rounded-lg overflow-hidden">
                      {parsedContent.tabs.map((tab, index) => {
                        const isOpen = openAccordions.has(index);
                        return (
                          <div key={index} className={index > 0 ? 'border-t border-gray-300' : ''}>
                            {/* Accordion header */}
                            <button
                              onClick={() => toggleAccordion(index)}
                              className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                              aria-expanded={isOpen}
                            >
                              <h3 className="text-lg font-bold text-gray-900">
                                {tab.title}
                              </h3>
                              <span className="text-2xl text-gray-600 flex-shrink-0 ml-4">
                                {isOpen ? '−' : '+'}
                              </span>
                            </button>

                            {/* Accordion content */}
                            {isOpen && (
                              <div className="px-6 py-4 bg-white">
                                <div
                                  className="report-markdown-content text-gray-700 prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_p]:mb-2"
                                  dangerouslySetInnerHTML={{ __html: tab.content }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              } else {
                // No tabs found, render regular content
                return (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    {project.researchTypeData?.reportIntro ? (
                      <div
                        className="report-markdown-content text-gray-700 prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_p]:mb-2"
                        dangerouslySetInnerHTML={{ __html: project.researchTypeData.reportIntro }}
                      />
                    ) : (
                      <p className="text-sm text-gray-500 italic">Nog geen informatie over dit onderzoek toegevoegd</p>
                    )}
                  </div>
                );
              }
            })()}
        </section>

        {/* Results Overview */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Overzicht resultaten</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-gray-700 mb-4">
              De resultaten zijn weergegeven in twee overzichten: per succescriterium en per WCAG-principe.
            </p>

            {/* Results Accordions */}
            <div className="space-y-0 border border-gray-300 rounded-lg overflow-hidden">
              {/* Accordion 1: Results per Criterion */}
              <div>
                <button
                  onClick={() => {
                    const newOpen = new Set(openResultsAccordions);
                    if (newOpen.has('criteria')) {
                      newOpen.delete('criteria');
                    } else {
                      newOpen.add('criteria');
                    }
                    setOpenResultsAccordions(newOpen);
                  }}
                  className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                  aria-expanded={openResultsAccordions.has('criteria')}
                >
                  <h3 className="text-lg font-bold text-gray-900">Resultaten per succescriterium</h3>
                  <span className="text-2xl text-gray-600 flex-shrink-0 ml-4">
                    {openResultsAccordions.has('criteria') ? '−' : '+'}
                  </span>
                </button>

                {openResultsAccordions.has('criteria') && (
                  <div className="px-6 py-4 bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse" aria-label="Resultaten per WCAG succescriterium">
                        <caption className="sr-only">Overzicht van alle geteste WCAG succescriteria met hun niveau en resultaat</caption>
                        <thead>
                          <tr className="bg-gray-50">
                            <th scope="col" className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">
                              Succescriterium
                            </th>
                            <th scope="col" className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">
                              Niveau
                            </th>
                            <th scope="col" className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">
                              Resultaat
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedCriteria.map((assessment: any) => {
                            const isFailed = assessment.status === 'failed';
                            return (
                              <tr key={assessment.wcagCriterion.id}>
                                <th scope="row" className={`border border-gray-300 px-4 py-2 text-sm text-left ${isFailed ? 'font-bold' : 'font-normal'}`}>
                                  {assessment.wcagCriterion.code} {assessment.wcagCriterion.titleNl}
                                </th>
                                <td className={`border border-gray-300 px-4 py-2 text-sm ${isFailed ? 'font-bold' : ''}`}>
                                  {assessment.wcagCriterion.level}
                                </td>
                                <td className={`border border-gray-300 px-4 py-2 text-sm ${isFailed ? 'font-bold' : ''}`}>
                                  {getStatusLabel(assessment.status)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 2: Results by Principle */}
              <div className="border-t border-gray-300">
                <button
                  onClick={() => {
                    const newOpen = new Set(openResultsAccordions);
                    if (newOpen.has('principles')) {
                      newOpen.delete('principles');
                    } else {
                      newOpen.add('principles');
                    }
                    setOpenResultsAccordions(newOpen);
                  }}
                  className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                  aria-expanded={openResultsAccordions.has('principles')}
                >
                  <h3 className="text-lg font-bold text-gray-900">Onderzoeksscores</h3>
                  <span className="text-2xl text-gray-600 flex-shrink-0 ml-4">
                    {openResultsAccordions.has('principles') ? '−' : '+'}
                  </span>
                </button>

                {openResultsAccordions.has('principles') && (
                  <div className="px-6 py-4 bg-white">
                    <p className="text-gray-700 mb-4 text-sm">
                      De tabel hieronder laat per WCAG-principe en per WCAG-niveau zien hoeveel succescriteria zijn getoetst en hoeveel daarvan goedgekeurd zijn.
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse" aria-label="Onderzoeksscores per WCAG principe en niveau">
                        <caption className="sr-only">Aantal goedgekeurde succescriteria per WCAG principe, uitgesplitst naar niveau A en AA</caption>
                        <thead>
                          <tr className="bg-gray-50">
                            <th scope="col" className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">
                              WCAG Principe
                            </th>
                            <th scope="col" className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900">
                              Niveau A
                            </th>
                            <th scope="col" className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900">
                              Niveau AA
                            </th>
                            <th scope="col" className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900">
                              Totaal
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {principleStats.map((stat) => (
                            <tr key={stat.principle}>
                              <th scope="row" className="border border-gray-300 px-4 py-2 text-sm font-medium text-left">
                                {getPrincipleLabel(stat.principle)}
                              </th>
                              <td className="border border-gray-300 px-4 py-2 text-sm text-center">
                                {stat.levelA.passed} / {stat.levelA.total}
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-sm text-center">
                                {stat.levelAA.passed} / {stat.levelAA.total}
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-sm font-medium text-center">
                                {stat.total.passed} / {stat.total.total}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50 font-bold">
                            <th scope="row" className="border border-gray-300 px-4 py-2 text-sm text-left">
                              Totaal
                            </th>
                            <td className="border border-gray-300 px-4 py-2 text-sm text-center">
                              {principleStats.reduce((sum, stat) => sum + stat.levelA.passed, 0)} / {principleStats.reduce((sum, stat) => sum + stat.levelA.total, 0)}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-sm text-center">
                              {principleStats.reduce((sum, stat) => sum + stat.levelAA.passed, 0)} / {principleStats.reduce((sum, stat) => sum + stat.levelAA.total, 0)}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-sm text-center">
                              {principleStats.reduce((sum, stat) => sum + stat.total.passed, 0)} / {principleStats.reduce((sum, stat) => sum + stat.total.total, 0)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Bevindingen */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Bevindingen</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-gray-700 mb-6">
              Hieronder worden de vastgestelde afwijkingen beschreven. Per bevinding is de locatie en een beschrijving van het probleem opgenomen, gevolgd door de impact op de gebruiker en een advies om de afwijking te verhelpen.
            </p>

            {/* Failed criteria */}
            <div className="space-y-6">
              {sortedCriteria
                .filter((assessment: any) => assessment.status === 'failed')
                .map((assessment: any, index: number) => {
                  const criterion = assessment.wcagCriterion;
                  // Get echte bevindingen (impact ingevuld) met status 'open' voor dit criterium
                  const findings = project.findings?.filter((f: any) => f.wcagCriterionId === criterion.id && isOpenBevinding(f)) || [];

                  return (
                    <div key={criterion.id} className="border-b border-gray-200 pb-6 last:border-0">
                      {/* Criterion title */}
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {criterion.code} {criterion.titleNl} {criterion.level}
                      </h3>

                      {/* Description and link */}
                      <p className="text-sm text-gray-700 mb-3">
                        {criterion.descriptionNl || criterion.titleNl}
                        <br />
                        {criterion.understandingUrl && (
                          <a
                            href={criterion.understandingUrl.replace(/^https:\/\/www\.w3\.org\/WAI\/WCAG22\/Understanding\/(.+?)(?:\.html)?$/, (_match: string, slug: string) =>
                              `https://www.w3.org/Translations/WCAG22-nl/#${slug}`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline inline-flex items-center gap-1"
                          >
                            {criterion.code} {criterion.titleNl}
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </p>

                      {/* Result */}
                      <p className="text-sm text-gray-700 mb-4">
                        <strong>Resultaat:</strong> Voldoet niet
                      </p>

                      {/* Findings */}
                      {findings.length > 0 && (
                        <div className="space-y-0 border border-gray-300 rounded-lg overflow-hidden">
                          {findings.map((finding: any, findingIndex: number) => {
                            const findingKey = `${criterion.id}-${finding.id}`;
                            const isOpen = openFindingsAccordions.has(findingKey);

                            return (
                              <div key={finding.id} className={findingIndex > 0 ? 'border-t border-gray-300' : ''}>
                                <button
                                  onClick={() => {
                                    const newOpen = new Set(openFindingsAccordions);
                                    if (newOpen.has(findingKey)) {
                                      newOpen.delete(findingKey);
                                    } else {
                                      newOpen.add(findingKey);
                                    }
                                    setOpenFindingsAccordions(newOpen);
                                  }}
                                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                                  aria-expanded={isOpen}
                                >
                                  <h4 className="font-medium text-sm text-gray-900">Bevinding {findingIndex + 1} (SC {criterion.code})</h4>
                                  <span className="text-2xl text-gray-600 flex-shrink-0 ml-4">
                                    {isOpen ? '−' : '+'}
                                  </span>
                                </button>

                                {isOpen && (
                                  <div className="px-4 py-3 bg-white text-sm text-gray-700">
                                    {/* Sample Items - URLs with bullets if 2+ occurrences */}
                                    {finding.occurrences && finding.occurrences.length > 0 && (
                                      <>
                                        {finding.occurrences.length >= 2 ? (
                                          <ul
                                            className="occurrence-list-with-bullets space-y-1 mb-3"
                                            style={{
                                              listStyleType: 'disc',
                                              listStylePosition: 'outside',
                                              paddingLeft: '2rem',
                                              display: 'block'
                                            }}
                                          >
                                            {finding.occurrences.map((occurrence: any) => (
                                              <li
                                                key={occurrence.id}
                                                style={{
                                                  display: 'list-item',
                                                  listStyleType: 'disc',
                                                  listStylePosition: 'outside'
                                                }}
                                              >
                                                {occurrence.sampleItem?.title && (
                                                  <div className="font-medium">{occurrence.sampleItem.title}</div>
                                                )}
                                                {occurrence.sampleItem?.url && (
                                                  <a
                                                    href={occurrence.sampleItem.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 underline break-all"
                                                  >
                                                    {occurrence.sampleItem.url}
                                                  </a>
                                                )}
                                              </li>
                                            ))}
                                          </ul>
                                        ) : (
                                          <>
                                            {finding.occurrences.map((occurrence: any) =>
                                              occurrence.sampleItem?.url && (
                                                <a
                                                  key={occurrence.id}
                                                  href={occurrence.sampleItem.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-blue-600 hover:underline flex items-center gap-1 mb-2"
                                                >
                                                  {occurrence.sampleItem.url}
                                                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                  </svg>
                                                </a>
                                              )
                                            )}
                                          </>
                                        )}
                                      </>
                                    )}

                                    {/* Description */}
                                    <div className="finding-description" dangerouslySetInnerHTML={{ __html: renderFindingHtml(finding.description) }} />

                                    {/* Advice */}
                                    <h5 className="font-medium text-gray-900 mb-2 italic mt-3">Advies:</h5>
                                    <div className="finding-description" dangerouslySetInnerHTML={{ __html: renderFindingHtml(finding.advice) }} />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* Show message if no findings */}
            {sortedCriteria.filter((a: any) => a.status === 'failed').length === 0 && (
              <p className="text-sm text-gray-500 italic">Er zijn geen bevindingen vastgesteld.</p>
            )}
          </div>
        </section>

        {/* Opmerkingen */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Opmerkingen</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-gray-700 mb-6">
              De onderstaande opmerkingen leiden niet tot een afkeuring, maar bevatten suggesties die de toegankelijkheid of gebruiksvriendelijkheid verder kunnen verbeteren.
            </p>

            {/* Criteria met opmerkingen (impact leeg, ongeacht status) */}
            <div className="space-y-6">
              {sortedCriteria
                .filter((assessment: any) => {
                  const criterion = assessment.wcagCriterion;
                  // Toon criteria die opmerkingen hebben (impact leeg, ongeacht status)
                  const hasRemark = project.findings?.some((f: any) => f.wcagCriterionId === criterion.id && isOpenOpmerking(f));
                  return hasRemark;
                })
                .map((assessment: any, index: number) => {
                  const criterion = assessment.wcagCriterion;
                  // Get opmerkingen (impact leeg, ongeacht status) voor dit criterium
                  const findings = project.findings?.filter((f: any) => f.wcagCriterionId === criterion.id && isOpenOpmerking(f)) || [];

                  return (
                    <div key={criterion.id} className="border-b border-gray-200 pb-6 last:border-0">
                      {/* Criterion title */}
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {criterion.code} {criterion.titleNl} {criterion.level}
                      </h3>

                      {/* Description and link */}
                      <p className="text-sm text-gray-700 mb-3">
                        {criterion.descriptionNl || criterion.titleNl}
                        <br />
                        {criterion.understandingUrl && (
                          <a
                            href={criterion.understandingUrl.replace(/^https:\/\/www\.w3\.org\/WAI\/WCAG22\/Understanding\/(.+?)(?:\.html)?$/, (_match: string, slug: string) =>
                              `https://www.w3.org/Translations/WCAG22-nl/#${slug}`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline inline-flex items-center gap-1"
                          >
                            {criterion.code} {criterion.titleNl}
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </p>

                      {/* Result */}
                      <p className="text-sm text-gray-700 mb-4">
                        <strong>Resultaat:</strong> {getStatusLabel(assessment.status)}
                      </p>

                      {/* Findings (Opmerkingen) */}
                      {findings.length > 0 && (
                        <div className="space-y-0 border border-gray-300 rounded-lg overflow-hidden">
                          {findings.map((finding: any, findingIndex: number) => {
                            const findingKey = `opmerking-${criterion.id}-${finding.id}`;
                            const isOpen = openFindingsAccordions.has(findingKey);

                            return (
                              <div key={finding.id} className={findingIndex > 0 ? 'border-t border-gray-300' : ''}>
                                <button
                                  onClick={() => {
                                    const newOpen = new Set(openFindingsAccordions);
                                    if (newOpen.has(findingKey)) {
                                      newOpen.delete(findingKey);
                                    } else {
                                      newOpen.add(findingKey);
                                    }
                                    setOpenFindingsAccordions(newOpen);
                                  }}
                                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                                  aria-expanded={isOpen}
                                >
                                  <h4 className="font-medium text-sm text-gray-900">Opmerking {findingIndex + 1} (SC {criterion.code})</h4>
                                  <span className="text-2xl text-gray-600 flex-shrink-0 ml-4">
                                    {isOpen ? '−' : '+'}
                                  </span>
                                </button>

                                {isOpen && (
                                  <div className="px-4 py-3 bg-white text-sm text-gray-700">
                                    {/* Sample Items - URLs with bullets if 2+ occurrences */}
                                    {finding.occurrences && finding.occurrences.length > 0 && (
                                      <>
                                        {finding.occurrences.length >= 2 ? (
                                          <ul
                                            className="occurrence-list-with-bullets space-y-1 mb-3"
                                            style={{
                                              listStyleType: 'disc',
                                              listStylePosition: 'outside',
                                              paddingLeft: '2rem',
                                              display: 'block'
                                            }}
                                          >
                                            {finding.occurrences.map((occurrence: any) => (
                                              <li
                                                key={occurrence.id}
                                                style={{
                                                  display: 'list-item',
                                                  listStyleType: 'disc',
                                                  listStylePosition: 'outside'
                                                }}
                                              >
                                                {occurrence.sampleItem?.title && (
                                                  <div className="font-medium">{occurrence.sampleItem.title}</div>
                                                )}
                                                {occurrence.sampleItem?.url && (
                                                  <a
                                                    href={occurrence.sampleItem.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 underline break-all"
                                                  >
                                                    {occurrence.sampleItem.url}
                                                  </a>
                                                )}
                                              </li>
                                            ))}
                                          </ul>
                                        ) : (
                                          <>
                                            {finding.occurrences.map((occurrence: any) =>
                                              occurrence.sampleItem?.url && (
                                                <a
                                                  key={occurrence.id}
                                                  href={occurrence.sampleItem.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-blue-600 hover:underline flex items-center gap-1 mb-2"
                                                >
                                                  {occurrence.sampleItem.url}
                                                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                  </svg>
                                                </a>
                                              )
                                            )}
                                          </>
                                        )}
                                      </>
                                    )}

                                    {/* Description */}
                                    <div className="finding-description" dangerouslySetInnerHTML={{ __html: renderFindingHtml(finding.description) }} />

                                    {/* Advice */}
                                    <h5 className="font-medium text-gray-900 mb-2 italic mt-3">Advies:</h5>
                                    <div className="finding-description" dangerouslySetInnerHTML={{ __html: renderFindingHtml(finding.advice) }} />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* Show message if no remarks */}
            {sortedCriteria.filter((assessment: any) => {
              const criterion = assessment.wcagCriterion;
              const hasRemark = project.findings?.some((f: any) => f.wcagCriterionId === criterion.id && isOpenOpmerking(f));
              return hasRemark;
            }).length === 0 && (
              <p className="text-sm text-gray-500 italic">Er zijn geen opmerkingen vastgesteld.</p>
            )}
          </div>
        </section>

        {/* Borging en vervolg */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Borging en vervolg</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-gray-700 mb-4">
              Omdat het onderzoek is uitgevoerd op basis van een steekproef, kunnen vergelijkbare afwijkingen ook voorkomen op pagina's die niet zijn onderzocht. Het is daarom raadzaam om de volledige website te controleren op vergelijkbare patronen en deze structureel te monitoren.
            </p>
            <p className="text-gray-700">
              Daarnaast kunnen wijzigingen in content of het publicatieproces nieuwe toegankelijkheidsrisico's met zich meebrengen. Structurele aandacht voor toegankelijkheid en periodieke herbeoordeling blijven daarom noodzakelijk.
            </p>
          </div>
        </section>

        {/* Onderzoeksdetails */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Onderzoeksdetails</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-gray-700 mb-4">
              Dit hoofdstuk bevat de onderzoeksverantwoording: de scope en steekproef van het onderzoek, de gehanteerde methode en de hulpmiddelen waarmee is getest.
            </p>

            {/* Details Accordions */}
            <div className="space-y-0 border border-gray-300 rounded-lg overflow-hidden">
              {/* Accordion 1: Scope */}
              <div>
                <button
                  onClick={() => {
                    const newOpen = new Set(openDetailsAccordions);
                    if (newOpen.has('scope')) {
                      newOpen.delete('scope');
                    } else {
                      newOpen.add('scope');
                    }
                    setOpenDetailsAccordions(newOpen);
                  }}
                  className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                  aria-expanded={openDetailsAccordions.has('scope')}
                >
                  <h3 className="text-lg font-bold text-gray-900">Scope</h3>
                  <span className="text-2xl text-gray-600 flex-shrink-0 ml-4">
                    {openDetailsAccordions.has('scope') ? '−' : '+'}
                  </span>
                </button>

                {openDetailsAccordions.has('scope') && (
                  <div className="px-6 py-4 bg-white">
                    <p className="text-sm text-gray-700 mb-4">
                      Bij de URL staat de reden waarom een gedeelte wel of niet is meegenomen. Dit is conform de regels voor het bepalen van de scope in de evaluatiemethode WCAG-EM.
                    </p>

                    {/* Binnen scope URLs */}
                    {(() => {
                      const inScopeUrls = project.scopeUrls.filter((url: any) => url.inScope === true && !url.parentUrlId);

                      if (inScopeUrls.length === 0) {
                        return (
                          <p className="text-sm text-gray-700">
                            Voor dit onderzoek is de scope nog niet bepaald.
                          </p>
                        );
                      }

                      if (inScopeUrls.length >= 2) {
                        // Render as bullet list when 2 or more URLs
                        return (
                          <ul
                            className="list-disc list-outside text-sm text-gray-700 space-y-2 mb-4"
                            style={{
                              listStyleType: 'disc',
                              listStylePosition: 'outside',
                              paddingLeft: '2rem',
                              display: 'block'
                            }}
                          >
                            {inScopeUrls.map((scopeUrl: any, index: number) => (
                              <li
                                key={index}
                                style={{
                                  display: 'list-item',
                                  listStyleType: 'disc',
                                  listStylePosition: 'outside'
                                }}
                              >
                                <a
                                  href={scopeUrl.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 underline inline-flex items-center gap-1"
                                >
                                  {scopeUrl.url}
                                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                                {' (URI-basis)'}
                              </li>
                            ))}
                          </ul>
                        );
                      }

                      // Single URL - render as regular paragraph
                      return (
                        <div className="mb-4">
                          {inScopeUrls.map((scopeUrl: any, index: number) => (
                            <div key={index} className="mb-2">
                              <a
                                href={scopeUrl.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline inline-flex items-center gap-1"
                              >
                                {scopeUrl.url}
                                <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                              {' (URI-basis)'}
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    {/* Buiten scope */}
                    <div className="mb-4 pt-5">
                      <h4 className="text-base font-semibold text-gray-900 mb-3">Buiten scope</h4>
                      {project.scopeUrls.filter((url: any) => url.inScope === false).length > 0 ? (
                        project.scopeUrls
                          .filter((scopeUrl: any) => scopeUrl.inScope === false)
                          .map((scopeUrl: any, index: number) => (
                            <div key={index} className="mb-2">
                              <a
                                href={scopeUrl.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline inline-flex items-center gap-1"
                              >
                                {scopeUrl.url}
                                <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                              {' (Andere URI-basis en/of stijlkenmerken)'}
                            </div>
                          ))
                      ) : (
                        <p className="text-sm text-gray-700">
                          Nog niet bepaald.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 2: Steekproef */}
              <div className="border-t border-gray-300">
                <button
                  onClick={() => {
                    const newOpen = new Set(openDetailsAccordions);
                    if (newOpen.has('sample')) {
                      newOpen.delete('sample');
                    } else {
                      newOpen.add('sample');
                    }
                    setOpenDetailsAccordions(newOpen);
                  }}
                  className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                  aria-expanded={openDetailsAccordions.has('sample')}
                >
                  <h3 className="text-lg font-bold text-gray-900">Steekproef</h3>
                  <span className="text-2xl text-gray-600 flex-shrink-0 ml-4">
                    {openDetailsAccordions.has('sample') ? '−' : '+'}
                  </span>
                </button>

                {openDetailsAccordions.has('sample') && (
                  <div className="px-6 py-4 bg-white">
                    <p className="text-sm text-gray-700 mb-4">
                      Dit onderzoek is uitgevoerd op basis van een steekproef. De wijze waarop de steekproef is bepaald staat voorgeschreven in het evaluatiedocument WCAG-EM. Als een proces is meegenomen in het onderzoek staan ook alle procespagina's in de steekproef vermeld. Zie:{' '}
                      <a
                        href="https://www.digitoegankelijk.nl/toegankelijkheidsverklaring/onderzoek"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline inline-flex items-center gap-1"
                      >
                        https://www.digitoegankelijk.nl/toegankelijkheidsverklaring/onderzoek
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </p>

                    {/* Overige steekproef informatie */}
                    {project.sampleInfo && (
                      <div className="mb-4 text-sm text-gray-700">
                        <div dangerouslySetInnerHTML={{ __html: project.sampleInfo }} />
                      </div>
                    )}

                    {/* Volledige steekproef */}
                    <h4 className="text-base font-semibold text-gray-900 mb-3">Volledige steekproef</h4>
                    {project.sampleItems && project.sampleItems.length > 0 ? (
                      <ul className="list-disc list-outside ml-5 text-sm text-gray-700 space-y-2">
                        {project.sampleItems.map((item: any, index: number) => (
                          <li key={item.id}>
                            {project.researchTypeData?.type === 'formulieren' ? (
                              <>
                                <div className="font-medium text-gray-900">{item.title}</div>
                                {item.url && (
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 underline inline-flex items-center gap-1"
                                  >
                                    {item.url}
                                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </a>
                                )}
                              </>
                            ) : (
                              <>
                                {item.url ? (
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 underline inline-flex items-center gap-1"
                                  >
                                    {item.url}
                                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </a>
                                ) : (
                                  <span>{item.title}</span>
                                )}
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Geen steekproef items toegevoegd</p>
                    )}
                  </div>
                )}
              </div>

              {/* Accordion 3: Onderzoeksmethode en technieken */}
              <div className="border-t border-gray-300">
                <button
                  onClick={() => {
                    const newOpen = new Set(openDetailsAccordions);
                    if (newOpen.has('method')) {
                      newOpen.delete('method');
                    } else {
                      newOpen.add('method');
                    }
                    setOpenDetailsAccordions(newOpen);
                  }}
                  className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                  aria-expanded={openDetailsAccordions.has('method')}
                >
                  <h3 className="text-lg font-bold text-gray-900">Onderzoeksmethode en technieken</h3>
                  <span className="text-2xl text-gray-600 flex-shrink-0 ml-4">
                    {openDetailsAccordions.has('method') ? '−' : '+'}
                  </span>
                </button>

                {openDetailsAccordions.has('method') && (
                  <div className="px-6 py-4 bg-white">
                    <p className="text-sm text-gray-700">
                      Dit onderzoek is uitgevoerd conform de evaluatiemethode{' '}
                      <a
                        href="https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline inline-flex items-center gap-1"
                      >
                        WCAG-EM
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      . Deze methode is aanbevolen door{' '}
                      <a
                        href="https://www.digitoegankelijk.nl/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline inline-flex items-center gap-1"
                      >
                        DigiToegankelijk (Logius)
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      . Bij het uitvoeren van dit onderzoek is ervan uitgegaan dat alle technieken van het W3C ondersteund worden en dus gebruikt mogen worden.
                    </p>
                  </div>
                )}
              </div>

              {/* Accordion 4: Testomgeving */}
              <div className="border-t border-gray-300">
                <button
                  onClick={() => {
                    const newOpen = new Set(openDetailsAccordions);
                    if (newOpen.has('environment')) {
                      newOpen.delete('environment');
                    } else {
                      newOpen.add('environment');
                    }
                    setOpenDetailsAccordions(newOpen);
                  }}
                  className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                  aria-expanded={openDetailsAccordions.has('environment')}
                >
                  <h3 className="text-lg font-bold text-gray-900">Testomgeving</h3>
                  <span className="text-2xl text-gray-600 flex-shrink-0 ml-4">
                    {openDetailsAccordions.has('environment') ? '−' : '+'}
                  </span>
                </button>

                {openDetailsAccordions.has('environment') && (
                  <div className="px-6 py-4 bg-white">
                    <p className="text-sm text-gray-700 mb-4">
                      Het basisniveau van ondersteuning bestaat uit gangbare webbrowsers en hulptechnologieën. Het onderzoek is uitgevoerd met:
                    </p>

                    {/* User agents */}
                    {project.userAgents ? (
                      <div
                        className="text-sm text-gray-700 prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_p]:mb-2"
                        dangerouslySetInnerHTML={{ __html: formatUserAgentsHtml(project.userAgents) }}
                      />
                    ) : (
                      <p className="text-sm text-gray-500 italic">Geen testomgeving informatie beschikbaar</p>
                    )}
                  </div>
                )}
              </div>

              {/* Accordion 5: Technologieën */}
              <div className="border-t border-gray-300">
                <button
                  onClick={() => {
                    const newOpen = new Set(openDetailsAccordions);
                    if (newOpen.has('technologies')) {
                      newOpen.delete('technologies');
                    } else {
                      newOpen.add('technologies');
                    }
                    setOpenDetailsAccordions(newOpen);
                  }}
                  className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                  aria-expanded={openDetailsAccordions.has('technologies')}
                >
                  <h3 className="text-lg font-bold text-gray-900">Technologieën</h3>
                  <span className="text-2xl text-gray-600 flex-shrink-0 ml-4">
                    {openDetailsAccordions.has('technologies') ? '−' : '+'}
                  </span>
                </button>

                {openDetailsAccordions.has('technologies') && (
                  <div className="px-6 py-4 bg-white">
                    {project.technologies && project.technologies.length > 0 ? (
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {project.technologies.map((tech: string, index: number) => (
                          <li key={index}>{tech}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Geen technologieën toegevoegd</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* About organization */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Over {teamName}</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-gray-700 whitespace-pre-line">
              {project.aboutOrgText || aboutOrgText || ''}
            </div>
          </div>
        </section>

        {/* Questions */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Vragen</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-gray-700">
              Heb je naar aanleiding van dit rapport inhoudelijke vragen, neem dan contact op met{' '}
              {teamEmail ? (
                <a href={`mailto:${teamEmail}`} className="text-blue-600 hover:underline">
                  {teamEmail}
                </a>
              ) : (
                'ons'
              )}
            </p>
          </div>
        </section>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Project details */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-normal text-gray-900 mb-4">Onderzoeksdetails</h2>
          <dl className="[&>dt]:text-sm [&>dt]:font-medium [&>dt]:text-gray-500 [&>dt]:mt-3 [&>dt]:first:mt-0 [&>dd]:text-sm [&>dd]:text-gray-900 [&>dd]:mt-1">
            <dt>Onderzoekstype</dt>
            <dd>
              {project.researchTypeData?.name || `${project.standard} niveau ${project.level}`}
            </dd>
            <dt>Project</dt>
            <dd>
              {project.clientProject?.name || project.subject || 'n.v.t.'}
            </dd>
            <dt>Versie</dt>
            <dd>{Number(project.version).toFixed(1)}</dd>
            <dt>Opdrachtgever</dt>
            <dd>{project.commissionedBy || 'n.v.t.'}</dd>
            <dt>Rapportdatum</dt>
            <dd>
              {format(reportDate, 'd MMMM yyyy', { locale: nl })}
            </dd>
            <dt>Onderzocht door</dt>
            <dd>{teamName}</dd>
            {project.researcherName && (
              <>
                <dt>Onderzoeker</dt>
                <dd>{project.researcherName}</dd>
              </>
            )}
          </dl>
        </div>

        {/* Downloads */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-normal text-gray-900 mb-4">Onderzoeksresultaten</h2>
          <p className="text-sm text-gray-600 mb-4">
            Download het rapport of bekijk de HTML-versie. De documenten worden automatisch gegenereerd.
          </p>
          <a
            href={`/api/reports/${project.id}/xlsx`}
            download
            className="block w-full text-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            Download Excel
          </a>
          <a
            href={`/api/reports/${project.id}/html`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center px-4 py-2 mt-3 bg-shift2-primary text-white rounded-lg hover:bg-shift2-accent transition-colors text-sm font-medium"
          >
            Bekijk HTML-versie
          </a>
          <a
            href={`/api/reports/${project.id}/word`}
            download
            className="block w-full text-center px-4 py-2 mt-3 bg-shift2-primary text-white rounded-lg hover:bg-shift2-accent transition-colors text-sm font-medium"
          >
            html to word
          </a>
          {(() => {
            const driveUrl = getDriveFolderUrl(project.title || '');
            if (!driveUrl) return null;
            return (
              <a
                href={driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center px-4 py-2 mt-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Open Drive-map
              </a>
            );
          })()}
        </div>

        {/* Scope */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Scope</h3>
          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium text-gray-500 mb-3">
                Bij de URL staat de reden waarom een gedeelte van de site niet is meegenomen. Dit is
                conform de regels voor het bepalen van de scope in de evaluatiemethode WCAG-EM.
              </div>
            </div>
            {project.scopeUrls.filter((url: any) => url.inScope === true && !url.parentUrlId).length > 0 ? (
              <ul className="space-y-3">
                {project.scopeUrls
                  .filter((scopeUrl: any) => scopeUrl.inScope === true && !scopeUrl.parentUrlId)
                  .map((scopeUrl: any, index: number) => (
                    <li key={index} className="text-sm">
                      <a
                        href={scopeUrl.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline break-all inline-flex items-center gap-1"
                      >
                        {scopeUrl.url}
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      <div className="text-sm font-medium text-gray-500 mt-1">
                        URI-basis
                      </div>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600">
                De scope van dit onderzoek betreft aanvullend deelonderzoek (mijn.urk.nl).
              </p>
            )}
          </div>

          {/* Niet in de scope */}
          {project.scopeUrls.filter((url: any) => !url.inScope).length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-base font-semibold text-gray-900 mb-3">Niet in de scope</h4>
              <div className="space-y-3">
                <ul className="space-y-3">
                  {project.scopeUrls
                    .filter((scopeUrl: any) => !scopeUrl.inScope)
                    .map((scopeUrl: any, index: number) => (
                      <li key={index} className="text-sm">
                        <a
                          href={scopeUrl.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline break-all inline-flex items-center gap-1"
                        >
                          {scopeUrl.url}
                          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                        <div className="text-sm font-medium text-gray-500 mt-1">
                          andere URI-basis
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          )}

          {/* Overige scope informatie */}
          {project.scopeInfo && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-base font-semibold text-gray-900 mb-3">Overige scope informatie</h4>
              <div
                className="scope-info-content text-sm text-gray-700 prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_p]:mb-4"
                dangerouslySetInnerHTML={{ __html: project.scopeInfo }}
              />
            </div>
          )}
        </div>

        {/* Research method */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Onderzoeksmethode</h3>
          <p className="text-sm text-gray-700 mb-6">
            Dit onderzoek is uitgevoerd conform de evaluatiemethode{' '}
            <a
              href="https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline inline-flex items-center gap-1"
            >
              WCAG-EM
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            . Deze methode is aanbevolen door{' '}
            <a
              href="https://www.digitoegankelijk.nl/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline inline-flex items-center gap-1"
            >
              DigiToegankelijk (Logius)
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>.
          </p>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Technieken</h4>
              <p className="text-sm text-gray-700">
                Bij het uitvoeren van dit onderzoek is er vanuit gegaan dat alle technieken van het W3C ondersteund worden en dus gebruikt mogen worden.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Basisniveau van ondersteuning</h4>
              <p className="text-sm text-gray-700">
                Gangbare webbrowsers en hulptechnologieën.
              </p>
            </div>
          </div>
        </div>

        {/* User agents */}
        {project.userAgents && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">User agents</h3>
            <div
              className="text-sm text-gray-700 prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_p]:mb-2"
              dangerouslySetInnerHTML={{ __html: project.userAgents }}
            />
          </div>
        )}

        {/* Techniques */}
        {project.techniquesNote && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Technieken</h3>
            <div className="text-sm text-gray-700 whitespace-pre-line">
              {project.techniquesNote}
            </div>
          </div>
        )}

        {/* Support baseline */}
        {project.supportBaseline && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Basisniveau van ondersteuning</h3>
            <div className="text-sm text-gray-700">{project.supportBaseline}</div>
          </div>
        )}

        {/* Technologies */}
        {project.technologies && project.technologies.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Technologieën</h3>
            <ul className="list-disc list-inside space-y-1">
              {project.technologies.map((tech: string, index: number) => (
                <li key={index} className="text-sm text-gray-700">
                  {tech}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
