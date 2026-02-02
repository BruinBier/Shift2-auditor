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
      `}} />
      <div className="grid grid-cols-3 gap-8">
      {/* Main content */}
      <div className="col-span-2 space-y-8">
        {/* Project header */}
        <section>
          <div className="mb-6">
            <div className="text-sm text-gray-600 mb-2">
              {project.standard} {project.level} – {project.title} – {scopeDomain || project.subject}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Rapport digitale toegankelijkheid
            </h1>
            <p className="text-gray-700">
              Dit onderzoek is door {teamName} uitgevoerd tussen{' '}
              {dateStart ? format(dateStart, 'd MMMM yyyy', { locale: nl }) : 'n.v.t.'} en{' '}
              {dateEnd ? format(dateEnd, 'd MMMM yyyy', { locale: nl }) : 'n.v.t.'}. Tijdens dit
              onderzoek zijn {stats.pagesInvestigated} pagina's onderzocht. Er wordt voldaan aan{' '}
              {stats.effectivePassed} van {stats.totalAssessed} succescriteria (
              {stats.totalAssessed > 0
                ? Math.round((stats.effectivePassed / stats.totalAssessed) * 100)
                : 0}
              %). In het onderzoek zijn {stats.totalProblems} toegankelijkheidsproblemen voor gebruikers met een functiebeperking vastgesteld. Daarnaast zijn {project.findings.length - stats.totalProblems} aanvullende opmerkingen benoemd.
            </p>
          </div>
        </section>

        {/* Summary */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Samenvatting</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {project.managementSummary ? (
              <div
                className="text-gray-700 prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_p]:mb-2"
                dangerouslySetInnerHTML={{ __html: project.managementSummary }}
              />
            ) : (
              <p className="text-sm text-gray-500 italic">Nog geen samenvatting toegevoegd</p>
            )}
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Over dit onderzoek</h2>
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
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Onderzoeksnorm</dt>
              <dd className="text-sm text-gray-900">
                {project.standard} niveau {project.level}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Project</dt>
              <dd className="text-sm text-gray-900">
                {project.clientProject?.name || project.subject || 'n.v.t.'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Versie</dt>
              <dd className="text-sm text-gray-900">{Number(project.version).toFixed(1)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Opdrachtgever</dt>
              <dd className="text-sm text-gray-900">{project.commissionedBy || 'n.v.t.'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Rapportdatum</dt>
              <dd className="text-sm text-gray-900">
                {format(reportDate, 'd MMMM yyyy', { locale: nl })}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Onderzocht door</dt>
              <dd className="text-sm text-gray-900">{teamName}</dd>
            </div>
            {project.researcherName && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Onderzoeker</dt>
                <dd className="text-sm text-gray-900">{project.researcherName}</dd>
              </div>
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
                      {scopeUrl.title && (
                        <div className="text-gray-900 mt-0.5">{scopeUrl.title}</div>
                      )}
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
                        {scopeUrl.title && (
                          <div className="text-sm font-medium text-gray-500 mt-0.5">{scopeUrl.title}</div>
                        )}
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
            <ul className="space-y-1">
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
