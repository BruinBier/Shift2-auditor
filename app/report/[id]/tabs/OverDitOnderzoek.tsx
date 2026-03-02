'use client';

import { calculateReportStats, calculatePrincipleStats, getStatusLabel, getPrincipleLabel } from '@/lib/report-calculations';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { parseMarkdownTabs } from '@/lib/parse-tabs';
import { formatProjectName } from '@/lib/format-project-name';
import { useSearchParams } from 'next/navigation';

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

  const handleDownloadDocx = async () => {
    try {
      const button = document.querySelector('[data-docx-button]') as HTMLButtonElement;
      if (button) {
        button.disabled = true;
        button.textContent = 'Word wordt gegenereerd...';
      }

      // Call the server-side Word document generation API
      const response = await fetch(`/api/reports/${project.id}/docx`);

      if (!response.ok) {
        throw new Error('Word generatie mislukt');
      }

      // Get the Word document blob
      const docxBlob = await response.blob();

      // Download the Word document
      const url = window.URL.createObjectURL(docxBlob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = `rapport-${project.subject || project.title}-v${project.version}.docx`.replace(/[^a-zA-Z0-9.-]/g, '_');
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      if (button) {
        button.disabled = false;
        button.textContent = 'Download Word';
      }
    } catch (error) {
      console.error('Word generation error:', error);
      alert('Er is een fout opgetreden bij het genereren van het Word document. Probeer het opnieuw.');

      const button = document.querySelector('[data-docx-button]') as HTMLButtonElement;
      if (button) {
        button.disabled = false;
        button.textContent = 'Download Word';
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

  // Prepare criteria data sorted by code
  const sortedCriteria = [...project.criterionAssessments].sort((a: any, b: any) =>
    a.wcagCriterion.code.localeCompare(b.wcagCriterion.code)
  );

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
          const findings = project.findings?.filter((f: any) => f.wcagCriterionId === assessment.wcagCriterion.id && f.status === 'open') || [];
          findings.forEach((finding: any) => {
            findingKeys.add(`${assessment.wcagCriterion.id}-${finding.id}`);
          });
        });

      // Open all remarks accordions
      sortedCriteria
        .filter((assessment: any) => {
          const hasRemark = project.findings?.some((f: any) => f.wcagCriterionId === assessment.wcagCriterion.id && f.status !== 'open');
          return hasRemark;
        })
        .forEach((assessment: any) => {
          const findings = project.findings?.filter((f: any) => f.wcagCriterionId === assessment.wcagCriterion.id && f.status !== 'open') || [];
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

    // Special template for "WCAG 2.2 AA deelonderzoek content"
    if (project.researchTypeData?.name === 'WCAG 2.2 AA deelonderzoek content') {
      return (
        <>
          <p className="mb-4">
            Dit onderzoek is door Shift2 uitgevoerd tussen {dateStartFormatted} en {dateEndFormatted}. Voor dit deelonderzoek is een representatieve steekproef samengesteld van {totalPages} gepubliceerde webpagina's met verschillende contenttypen.
          </p>

          <p className="mb-4">
            De onderzochte content voldoet {percentage === 100 ? '' : 'niet '}volledig aan WCAG 2.2 niveau A en AA. In dit deelonderzoek zijn 30 succescriteria beoordeeld. Er wordt voldaan aan {passedCriteria} van deze 30 succescriteria ({percentage}%). Bij {failedCriteria} {failedCriteria === 1 ? 'succescriterium' : 'succescriteria'} zijn afwijkingen vastgesteld.
          </p>

          <p>
            Wij adviseren om content periodiek te controleren op terugkerende patronen van toegankelijkheidsproblemen en toegankelijkheid structureel te borgen in het publicatieproces.
          </p>
        </>
      );
    }

    // Check if research type has a custom summary template
    if (project.researchTypeData?.summaryTemplate) {
      const template = project.researchTypeData.summaryTemplate;

      // Replace placeholders with actual values
      const summaryHtml = template
        .replace(/\{dateStart\}/g, dateStartFormatted)
        .replace(/\{dateEnd\}/g, dateEndFormatted)
        .replace(/\{totalPages\}/g, String(totalPages))
        .replace(/\{totalCriteria\}/g, String(totalCriteria))
        .replace(/\{passedCriteria\}/g, String(passedCriteria))
        .replace(/\{percentage\}/g, String(percentage))
        .replace(/\{failedCriteria\}/g, String(failedCriteria))
        .replace(/\{compliesFully\}/g, percentage === 100 ? 'volledig' : 'niet volledig');

      return (
        <div dangerouslySetInnerHTML={{ __html: summaryHtml }} />
      );
    }

    // Fallback to default template
    return (
      <>
        <p className="mb-4">
          Het onderzoek vond plaats in de periode van {dateStartFormatted} tot en met {dateEndFormatted}. Voor dit deelonderzoek is een representatieve steekproef samengesteld van {totalPages} gepubliceerde webpagina's met verschillende contenttypen.
        </p>

        <p className="mb-4">
          De onderzochte content voldoet {percentage === 100 ? 'volledig' : 'niet volledig'} aan WCAG 2.2 niveau A en AA. In dit deelonderzoek zijn {totalCriteria} succescriteria beoordeeld. Er wordt voldaan aan {passedCriteria} van deze {totalCriteria} succescriteria ({percentage}%). Bij {failedCriteria} {failedCriteria === 1 ? 'succescriterium' : 'succescriteria'} zijn afwijkingen vastgesteld.
        </p>

        <p>
          Wij adviseren om content periodiek te controleren op terugkerende patronen van toegankelijkheidsproblemen en toegankelijkheid structureel te borgen in het publicatieproces.
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
              Toegankelijkheidsonderzoek {formatProjectName(project.subject || project.title, project.researchTypeData?.type)}
            </h1>
          </div>
        </section>

        {/* Report intro */}
        <section>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {project.researchTypeData?.name === 'WCAG 2.2 AA deelonderzoek content' ? (
              <>
                <p className="text-gray-700 leading-relaxed mb-3">
                  WCAG 2.2 AA - deelonderzoek content
                </p>
                <p className="text-gray-700 leading-relaxed">
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
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-700 leading-relaxed mb-3">
                  {(() => {
                    // Use reportIntroHeader if available
                    const template = project.researchTypeData?.reportIntroHeader;

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
                          Dit rapport beschrijft de resultaten van het deelonderzoek naar de toegankelijkheid van de content op de {project.researchTypeData?.type || 'website'}{' '}
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
              </>
            )}
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

        {/* Researcher feedback */}
        {project.researcherFeedback && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Feedback van onderzoeker</h2>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div
                className="text-gray-700 prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_p]:mb-2"
                dangerouslySetInnerHTML={{ __html: project.researcherFeedback }}
              />
            </div>
          </section>
        )}

        {/* What was tested */}
        <section>
          {project.researchTypeData?.name === 'WCAG 2.2 AA deelonderzoek content' ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Over dit onderzoek</h2>

              <p className="text-gray-700 mb-6">
                Voor deze website is een deelonderzoek uitgevoerd naar de toegankelijkheid van de content, om vast te stellen in hoeverre deze voldoet aan WCAG 2.2 niveau A en AA (EN 301 549). De geldigheid van dit onderzoeksrapport bedraagt maximaal drie jaar. Bij substantiële wijzigingen in de content of het publicatieproces adviseren wij een aanvullend of nieuw onderzoek uit te laten voeren.
              </p>

              {/* 4 separate accordions */}
              <div className="space-y-0 border border-gray-300 rounded-lg overflow-hidden">
                {/* Accordion 1: Afbakening van het deelonderzoek */}
                <div>
                  <button
                    onClick={() => {
                      const newOpen = new Set(openAfbakeningAccordions);
                      if (newOpen.has('afbakening-main')) {
                        newOpen.delete('afbakening-main');
                      } else {
                        newOpen.add('afbakening-main');
                      }
                      setOpenAfbakeningAccordions(newOpen);
                    }}
                    className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                    aria-expanded={openAfbakeningAccordions.has('afbakening-main')}
                  >
                    <h3 className="text-lg font-semibold text-gray-900">Afbakening van het deelonderzoek</h3>
                    <span className="text-2xl text-gray-600 flex-shrink-0 ml-4">
                      {openAfbakeningAccordions.has('afbakening-main') ? '−' : '+'}
                    </span>
                  </button>

                  {openAfbakeningAccordions.has('afbakening-main') && (
                    <div className="px-6 py-4 bg-white">
                      <p className="text-gray-700 mb-4">
                        Dit deelonderzoek heeft uitsluitend betrekking op de content van de website: teksten, koppen, afbeeldingen, alternatieve teksten, linkteksten, video's, PDF-documenten, tabellen en overige door de organisatie beheerde inhoud.
                      </p>

                      <p className="text-gray-700 mb-4">
                        Bij dit onderzoek zijn 30 van de 55 succescriteria van WCAG 2.2 niveau A en AA beoordeeld, voor zover deze betrekking hebben op de content van de website.
                      </p>

                      <p className="text-gray-700 mb-4">
                        De overige 25 succescriteria hebben betrekking op de technische basis van de website en worden beoordeeld in het afzonderlijk deelonderzoek techniek.
                      </p>

                      <p className="text-gray-700 mb-6">
                        Beide deelonderzoeken vormen gezamenlijk de volledige beoordeling van de website.
                      </p>

                      <h4 className="text-base font-bold text-gray-900 mb-3">Succescriteria beoordeeld in het technisch deelonderzoek</h4>

                      <p className="text-gray-700 mb-4">
                        Onderstaande succescriteria zijn in dit contentonderzoek niet beoordeeld en vallen onder het afzonderlijke deelonderzoek techniek:
                      </p>

                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">SC</th>
                              <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">Naam</th>
                              <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">Niveau</th>
                              <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">Reden van uitsluiting</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 text-sm">3.3.1</td>
                              <td className="border border-gray-300 px-4 py-2 text-sm">Foutidentificatie</td>
                              <td className="border border-gray-300 px-4 py-2 text-sm">A</td>
                              <td className="border border-gray-300 px-4 py-2 text-sm">Formuliervalidatie wordt volledig door het systeem afgehandeld</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 text-sm">3.3.3</td>
                              <td className="border border-gray-300 px-4 py-2 text-sm">Foutsuggestie</td>
                              <td className="border border-gray-300 px-4 py-2 text-sm">AA</td>
                              <td className="border border-gray-300 px-4 py-2 text-sm">Foutsuggesties worden door het systeem gegenereerd</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 text-sm">3.3.7</td>
                              <td className="border border-gray-300 px-4 py-2 text-sm">Overbodige invoer</td>
                              <td className="border border-gray-300 px-4 py-2 text-sm">A</td>
                              <td className="border border-gray-300 px-4 py-2 text-sm">Het hergebruik van eerder ingevoerde gegevens binnen processen is binnen het platform technisch ingericht en wordt centraal beheerd.</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Accordion 2: Embedded content en content van derden */}
                <div className="border-t border-gray-300">
                  <button
                    onClick={() => {
                      const newOpen = new Set(openAfbakeningAccordions);
                      if (newOpen.has('embedded')) {
                        newOpen.delete('embedded');
                      } else {
                        newOpen.add('embedded');
                      }
                      setOpenAfbakeningAccordions(newOpen);
                    }}
                    className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                    aria-expanded={openAfbakeningAccordions.has('embedded')}
                  >
                    <h3 className="text-lg font-semibold text-gray-900">Embedded content en content van derden</h3>
                    <span className="text-2xl text-gray-600 flex-shrink-0 ml-4">
                      {openAfbakeningAccordions.has('embedded') ? '−' : '+'}
                    </span>
                  </button>

                  {openAfbakeningAccordions.has('embedded') && (
                    <div className="px-6 py-4 bg-white">
                      <p className="text-sm text-gray-700 mb-3">
                        Wanneer op de website content is opgenomen via embedded elementen (zoals iframes met formulieren, kaarten of andere applicaties), wordt in dit onderzoek uitsluitend beoordeeld hoe de embed op de pagina is geplaatst. Dit omvat de aanwezigheid van een beschrijvende title en of de embed een toetsenbordval veroorzaakt.
                      </p>
                      <p className="text-sm text-gray-700">
                        De inhoud van de embedded applicatie zelf valt niet onder dit onderzoek. De organisatie wordt geadviseerd om de betreffende applicatie apart te laten toetsen op WCAG 2.2 AA.
                      </p>
                    </div>
                  )}
                </div>

                {/* Accordion 3: Reikwijdte en werkwijze */}
                <div className="border-t border-gray-300">
                  <button
                    onClick={() => {
                      const newOpen = new Set(openAfbakeningAccordions);
                      if (newOpen.has('reikwijdte')) {
                        newOpen.delete('reikwijdte');
                      } else {
                        newOpen.add('reikwijdte');
                      }
                      setOpenAfbakeningAccordions(newOpen);
                    }}
                    className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                    aria-expanded={openAfbakeningAccordions.has('reikwijdte')}
                  >
                    <h3 className="text-lg font-semibold text-gray-900">Reikwijdte en werkwijze</h3>
                    <span className="text-2xl text-gray-600 flex-shrink-0 ml-4">
                      {openAfbakeningAccordions.has('reikwijdte') ? '−' : '+'}
                    </span>
                  </button>

                  {openAfbakeningAccordions.has('reikwijdte') && (
                    <div className="px-6 py-4 bg-white">
                      <p className="text-sm text-gray-700 mb-3">
                        Het onderzoek is uitgevoerd op basis van een representatieve steekproef van webpagina's. Binnen deze steekproef zijn de aangetroffen toegankelijkheidsproblemen zo concreet mogelijk beschreven, inclusief verwijzing naar de betreffende pagina. Waar mogelijk is een aanbeveling opgenomen om de afwijking te verhelpen.
                      </p>
                      <p className="text-sm text-gray-700">
                        Dit onderzoek biedt geen uitputtend overzicht van alle mogelijke toegankelijkheidsproblemen. De bevindingen vormen een momentopname van de situatie ten tijde van het onderzoek.
                      </p>
                    </div>
                  )}
                </div>

                {/* Accordion 4: Wat is WCAG? */}
                <div className="border-t border-gray-300">
                  <button
                    onClick={() => {
                      const newOpen = new Set(openAfbakeningAccordions);
                      if (newOpen.has('wcag')) {
                        newOpen.delete('wcag');
                      } else {
                        newOpen.add('wcag');
                      }
                      setOpenAfbakeningAccordions(newOpen);
                    }}
                    className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                    aria-expanded={openAfbakeningAccordions.has('wcag')}
                  >
                    <h3 className="text-lg font-semibold text-gray-900">Wat is WCAG?</h3>
                    <span className="text-2xl text-gray-600 flex-shrink-0 ml-4">
                      {openAfbakeningAccordions.has('wcag') ? '−' : '+'}
                    </span>
                  </button>

                  {openAfbakeningAccordions.has('wcag') && (
                    <div className="px-6 py-4 bg-white">
                      <p className="text-sm text-gray-700 mb-3">
                        WCAG (Web Content Accessibility Guidelines) zijn internationaal erkende richtlijnen voor digitale toegankelijkheid, opgebouwd rond vier principes: Waarneembaar, Bedienbaar, Begrijpelijk en Robuust. Binnen deze principes zijn meetbare succescriteria vastgesteld.
                      </p>
                      <p className="text-sm text-gray-700">
                        Meer informatie:{' '}
                        <a
                          href="https://www.w3.org/Translations/WCAG22-nl/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline inline-flex items-center gap-1"
                        >
                          WCAG 2.2 (Nederlandse vertaling)
                          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            (() => {
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
                              <h3 className="text-base font-medium text-gray-900">
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
            })()
          )}
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
                  <h3 className="text-lg font-semibold text-gray-900">Resultaten per succescriterium</h3>
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
                              <tr key={assessment.wcagCriterion.id} className={isFailed ? 'font-bold' : ''}>
                                <th scope="row" className="border border-gray-300 px-4 py-2 text-sm text-left font-normal">
                                  {assessment.wcagCriterion.code} {assessment.wcagCriterion.titleNl}
                                </th>
                                <td className="border border-gray-300 px-4 py-2 text-sm">
                                  {assessment.wcagCriterion.level}
                                </td>
                                <td className="border border-gray-300 px-4 py-2 text-sm">
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
                  <h3 className="text-lg font-semibold text-gray-900">Onderzoeksscores</h3>
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
                  // Get findings with status 'open' (Afgekeurd) for this criterion
                  const findings = project.findings?.filter((f: any) => f.wcagCriterionId === criterion.id && f.status === 'open') || [];

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
                            href={criterion.understandingUrl.replace(/\/Understanding\/(.+?)(?:\.html)?$/, (match, slug) =>
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
                                  <h4 className="font-medium text-sm text-gray-900">Bevinding {findingIndex + 1}</h4>
                                  <span className="text-2xl text-gray-600 flex-shrink-0 ml-4">
                                    {isOpen ? '−' : '+'}
                                  </span>
                                </button>

                                {isOpen && (
                                  <div className="px-4 py-3 bg-white text-sm text-gray-700">
                                    {/* Sample Items - URLs first on separate line */}
                                    {finding.occurrences && finding.occurrences.length > 0 && (
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

                                    {/* Description */}
                                    <div dangerouslySetInnerHTML={{ __html: finding.description }} />

                                    {/* Advice */}
                                    <h5 className="font-medium text-gray-900 mb-2 italic mt-3">Advies:</h5>
                                    <div dangerouslySetInnerHTML={{ __html: finding.advice }} />
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
          </div>
        </section>

        {/* Opmerkingen */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Opmerkingen</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-gray-700 mb-6">
              De onderstaande opmerkingen leiden niet tot een afkeuring, maar bevatten suggesties die de toegankelijkheid of gebruiksvriendelijkheid verder kunnen verbeteren.
            </p>

            {/* Criteria with remarks (findings with status !== 'open') */}
            <div className="space-y-6">
              {sortedCriteria
                .filter((assessment: any) => {
                  // Only show criteria that have findings with status !== 'open' (Opmerkingen)
                  const hasRemark = project.findings?.some((f: any) => f.wcagCriterionId === assessment.wcagCriterion.id && f.status !== 'open');
                  return hasRemark;
                })
                .map((assessment: any, index: number) => {
                  const criterion = assessment.wcagCriterion;
                  // Get findings with status !== 'open' (Opmerkingen) for this criterion
                  const findings = project.findings?.filter((f: any) => f.wcagCriterionId === criterion.id && f.status !== 'open') || [];

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
                            href={criterion.understandingUrl.replace(/\/Understanding\/(.+?)(?:\.html)?$/, (match, slug) =>
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
                                  <h4 className="font-medium text-sm text-gray-900">Opmerking {findingIndex + 1}</h4>
                                  <span className="text-2xl text-gray-600 flex-shrink-0 ml-4">
                                    {isOpen ? '−' : '+'}
                                  </span>
                                </button>

                                {isOpen && (
                                  <div className="px-4 py-3 bg-white text-sm text-gray-700">
                                    {/* Sample Items - URLs first on separate line */}
                                    {finding.occurrences && finding.occurrences.length > 0 && (
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

                                    {/* Description */}
                                    <div dangerouslySetInnerHTML={{ __html: finding.description }} />

                                    {/* Advice */}
                                    <h5 className="font-medium text-gray-900 mb-2 italic mt-3">Advies:</h5>
                                    <div dangerouslySetInnerHTML={{ __html: finding.advice }} />
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
              const hasRemark = project.findings?.some((f: any) => f.wcagCriterionId === assessment.wcagCriterion.id && f.status !== 'open');
              return hasRemark;
            }).length === 0 && (
              <p className="text-sm text-gray-500 italic">Er zijn geen opmerkingen voor dit onderzoek.</p>
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
                  <h3 className="text-lg font-semibold text-gray-900">Scope</h3>
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
                    {project.scopeUrls.filter((url: any) => url.inScope === true && !url.parentUrlId).length > 0 && (
                      <div className="mb-4">
                        {project.scopeUrls
                          .filter((scopeUrl: any) => scopeUrl.inScope === true && !scopeUrl.parentUrlId)
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
                              {' (URI-basis)'}
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Buiten scope */}
                    {project.scopeUrls.filter((url: any) => url.inScope === false).length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-base font-semibold text-gray-900 mb-3">Buiten scope</h4>
                        {project.scopeUrls
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
                          ))}
                      </div>
                    )}

                    {/* Wettelijke uitzonderingen */}
                    <div>
                      <h4 className="text-base font-semibold text-gray-900 mb-3">Wettelijke uitzonderingen</h4>
                      <p className="text-sm text-gray-700 mb-2">
                        De volgende content valt op grond van de Toegankelijkheidswet buiten de scope van dit onderzoek:
                      </p>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        <li>Online kaarten en karteringsdiensten, tenzij ze bedoeld zijn voor navigatie;</li>
                        <li>kantoorbestanden van vóór 23 september 2018, tenzij ze deel uitmaken van een administratief proces;</li>
                        <li>audio- en videobestanden die vóór 23 september 2020 op het digitale kanaal zijn geplaatst;</li>
                        <li>van derden afkomstige inhoud;</li>
                        <li>inhoud van archieven.</li>
                      </ul>
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
                  <h3 className="text-lg font-semibold text-gray-900">Steekproef</h3>
                  <span className="text-2xl text-gray-600 flex-shrink-0 ml-4">
                    {openDetailsAccordions.has('sample') ? '−' : '+'}
                  </span>
                </button>

                {openDetailsAccordions.has('sample') && (
                  <div className="px-6 py-4 bg-white">
                    <p className="text-sm text-gray-700 mb-4">
                      Dit onderzoek is uitgevoerd op basis van een steekproef. De wijze waarop de steekproef is bepaald staat voorgeschreven in het evaluatiedocument WCAG-EM. Als een proces is meegenomen in het onderzoek staan ook alle procespagina's in de steekproef vermeld. Zie:{' '}
                      <a
                        href="https://www.digitoegankelijk.nl/aanpak/toegankelijkheidsonderzoek"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline inline-flex items-center gap-1"
                      >
                        https://www.digitoegankelijk.nl/aanpak/toegankelijkheidsonderzoek
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
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
                        {project.sampleItems.map((item: any, index: number) => (
                          <li key={item.id}>
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
                  <h3 className="text-lg font-semibold text-gray-900">Onderzoeksmethode en technieken</h3>
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
                  <h3 className="text-lg font-semibold text-gray-900">Testomgeving</h3>
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
                        dangerouslySetInnerHTML={{ __html: project.userAgents }}
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
                  <h3 className="text-lg font-semibold text-gray-900">Technologieën</h3>
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

        {/* PDF & Word Download */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-normal text-gray-900 mb-4">Onderzoeksresultaten</h2>
          <p className="text-sm text-gray-600 mb-4">
            Download het rapport als PDF of Word document. Het document wordt automatisch gegenereerd.
          </p>
          <div className="space-y-2">
            <button
              onClick={handleDownloadPdf}
              data-pdf-button
              className="block w-full text-center px-4 py-2 bg-shift2-secondary text-white rounded-lg hover:bg-shift2-accent transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Download PDF
            </button>
            <button
              onClick={handleDownloadDocx}
              data-docx-button
              className="block w-full text-center px-4 py-2 bg-shift2-secondary text-white rounded-lg hover:bg-shift2-accent transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Download Word
            </button>
          </div>
        </div>

        {/* Scope */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Scope</h3>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Onderzoeksmethode</h3>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User agents</h3>
            <div
              className="text-sm text-gray-700 prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_p]:mb-2"
              dangerouslySetInnerHTML={{ __html: project.userAgents }}
            />
          </div>
        )}

        {/* Techniques */}
        {project.techniquesNote && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Technieken</h3>
            <div className="text-sm text-gray-700 whitespace-pre-line">
              {project.techniquesNote}
            </div>
          </div>
        )}

        {/* Support baseline */}
        {project.supportBaseline && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basisniveau van ondersteuning</h3>
            <div className="text-sm text-gray-700">{project.supportBaseline}</div>
          </div>
        )}

        {/* Technologies */}
        {project.technologies && project.technologies.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Technologieën</h3>
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
