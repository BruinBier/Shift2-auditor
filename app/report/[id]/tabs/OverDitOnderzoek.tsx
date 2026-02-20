'use client';

import { calculateReportStats } from '@/lib/report-calculations';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useState, useEffect } from 'react';

export default function OverDitOnderzoek({ project }: { project: any }) {
  const [teamName, setTeamName] = useState('Shift2');
  const [aboutOrgText, setAboutOrgText] = useState('');
  const [teamEmail, setTeamEmail] = useState('');

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

  const stats = calculateReportStats(project);
  // Use researchStartedOn instead of dateStart for the report
  const dateStart = project.researchStartedOn ? new Date(project.researchStartedOn) : (project.dateStart ? new Date(project.dateStart) : null);
  const dateEnd = project.dateEnd ? new Date(project.dateEnd) : null;
  const reportDate = new Date(project.reportDate);

  // Get the first manually added scope URL
  const firstScopeUrl = project.scopeUrls.find((url: any) => url.inScope === true && !url.parentUrlId);
  const scopeDomain = firstScopeUrl ? new URL(firstScopeUrl.url).hostname : '';
  const scopeUrl = firstScopeUrl?.url ? firstScopeUrl.url.replace(/\/$/, '') : '';

  // Generate automatic summary
  const generateAutoSummary = () => {
    const totalPages = project.sampleItems.length;
    const passedCriteria = stats.effectivePassed;
    const totalCriteria = stats.totalAssessed;
    const percentage = totalCriteria > 0 ? Math.round((passedCriteria / totalCriteria) * 100) : 0;
    const failedCriteria = stats.failed;
    const unknownCriteria = stats.unknown;
    const additionalRemarks = project.findings.length - stats.totalProblems;

    const dateStartFormatted = dateStart ? format(dateStart, 'd MMMM yyyy', { locale: nl }) : '[datum]';
    const dateEndFormatted = dateEnd ? format(dateEnd, 'd MMMM yyyy', { locale: nl }) : '[datum]';

    return (
      <>
        <p className="mb-4">
          Dit rapport beschrijft de resultaten van het deelonderzoek naar de toegankelijkheid van de redactionele content op de website{' '}
          <a
            href={scopeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline inline-flex items-center gap-1"
          >
            {scopeUrl}
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          . Het onderzoek is uitgevoerd conform WCAG 2.2 niveau A en AA (EN 301 549), volgens de evaluatiemethode WCAG-EM.
        </p>

        <p className="mb-4">
          Het onderzoek vond plaats in de periode van {dateStartFormatted} tot en met {dateEndFormatted}. Voor dit deelonderzoek is een representatieve steekproef samengesteld van {totalPages} gepubliceerde webpagina's met verschillende contenttypen.
        </p>

        <p className="mb-4">
          De onderzochte content voldoet {percentage === 100 ? 'volledig' : 'niet volledig'} aan WCAG 2.2 niveau A en AA.
          {' '}Er wordt voldaan aan {passedCriteria} van de {totalCriteria} succescriteria ({percentage}%).
          {failedCriteria > 0 && ` Bij ${failedCriteria} ${failedCriteria === 1 ? 'succescriterium' : 'succescriteria'} zijn afwijkingen vastgesteld.`}
          {additionalRemarks > 0 && ` Daarnaast zijn ${additionalRemarks} aanvullende ${additionalRemarks === 1 ? 'opmerking opgenomen' : 'opmerkingen opgenomen'} om de toegankelijkheid verder te optimaliseren.`}
        </p>

        <p>
          Wij adviseren om redactionele content periodiek te controleren op terugkerende patronen van toegankelijkheidsproblemen en toegankelijkheid structureel te borgen in het redactionele proces.
        </p>
      </>
    );
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .scope-info-content a {
          color: #2563eb !important;
          text-decoration: underline !important;
        }
        .scope-info-content a::after {
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
          font-weight: 400 !important;
          color: #111827 !important;
          margin-bottom: 1rem !important;
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
      `}} />
      <div className="grid grid-cols-3 gap-8">
      {/* Main content */}
      <div className="col-span-2 space-y-8">
        {/* Project header */}
        <section>
          <div className="mb-6">
            <div className="text-sm text-gray-600 mb-2">
              {project.title}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Rapport digitale toegankelijkheid
            </h1>
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
