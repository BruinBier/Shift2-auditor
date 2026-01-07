import { calculateReportStats } from '@/lib/report-calculations';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

export default function OverDitOnderzoek({ project }: { project: any }) {
  const stats = calculateReportStats(project);
  const dateStart = project.dateStart ? new Date(project.dateStart) : null;
  const dateEnd = project.dateEnd ? new Date(project.dateEnd) : null;
  const reportDate = new Date(project.reportDate);

  return (
    <div className="grid grid-cols-3 gap-8">
      {/* Main content */}
      <div className="col-span-2 space-y-8">
        {/* Summary */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Samenvatting</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {project.summaryText ? (
              <div className="text-gray-700 whitespace-pre-line">{project.summaryText}</div>
            ) : (
              <p className="text-gray-700">
                Dit onderzoek is door {project.auditedByOrg} uitgevoerd tussen{' '}
                {dateStart ? format(dateStart, 'd MMMM yyyy', { locale: nl }) : 'n.v.t.'} en{' '}
                {dateEnd ? format(dateEnd, 'd MMMM yyyy', { locale: nl }) : 'n.v.t.'}. Tijdens dit
                onderzoek zijn {stats.pagesInvestigated} pagina's onderzocht. Er wordt voldaan aan{' '}
                {stats.passed} van {stats.totalAssessed} succescriteria (
                {stats.totalAssessed > 0
                  ? Math.round((stats.passed / stats.totalAssessed) * 100)
                  : 0}
                %). Onze onderzoeker heeft {stats.totalProblems} problemen opgeschreven waarbij
                gebruikers met een functiebeperking mogelijk tegen problemen aanlopen. Ook geeft de
                onderzoeker {project.findings.filter((f: any) => f.status === 'open').length} andere
                opmerkingen om de toegankelijkheid te verbeteren.
              </p>
            )}
          </div>
        </section>

        {/* Researcher feedback */}
        {project.researcherFeedbackText && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Feedback van onderzoeker</h2>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-gray-700 whitespace-pre-line">
                {project.researcherFeedbackText}
              </div>
            </div>
          </section>
        )}

        {/* About research */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Over dit onderzoek</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {project.aboutResearchText ? (
              <div className="text-gray-700 whitespace-pre-line">{project.aboutResearchText}</div>
            ) : (
              <p className="text-gray-700">
                We hebben een {project.researchType} uitgevoerd op de klantspecifieke content binnen
                de Mijn-omgeving. Het onderzoek is uitgevoerd als aanvulling op de standaard
                PIP-omgeving, dat in december 2024 is uitgevoerd door Cardan.
                <br />
                <br />
                Dit onderzoek is uitgevoerd conform {project.standard} zoals opgenomen in de Europese
                norm EN 301 549.
              </p>
            )}
          </div>
        </section>

        {/* What was tested */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Wat is onderzocht?</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {project.whatWasTestedText ? (
              <div className="text-gray-700 whitespace-pre-line">{project.whatWasTestedText}</div>
            ) : (
              <div>
                <p className="text-gray-700 mb-4">
                  Binnen de gegarandeerde aanvullende en afgebakende steekproef is beoordeeld in
                  hoeverre de klantspecifieke invulling van de aanwezige hoogcontrastfunctie binnen de
                  aanwezige hoogcontrastfunctie. Deze hoogcontrastfunctie is in dit aanvullende
                  onderzoek beoordeeld.
                </p>
                <p className="text-gray-700">
                  Het kleurcontrast is in dit aanvullende onderzoek beoordeeld binnen de aanwezige
                  hoogcontrastfunctie.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* About organization */}
        {project.aboutOrgText && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Over {project.auditedByOrg}</h2>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-gray-700 whitespace-pre-line">{project.aboutOrgText}</div>
            </div>
          </section>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Project details */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Onderzoeksdetails</h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Onderzoeksnorm</dt>
              <dd className="text-sm text-gray-900">
                {project.standard} niveau {project.level}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Project</dt>
              <dd className="text-sm text-gray-900">{project.subject}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Versie</dt>
              <dd className="text-sm text-gray-900">{project.version}</dd>
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
              <dd className="text-sm text-gray-900">{project.auditedByOrg}</dd>
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
              <div className="text-sm font-medium text-gray-500 mb-1">
                Bij de URL staat de reden waarom een gedeelte van de site niet is meegenomen. Dit is
                conform de regels voor het bepalen van de scope in de evaluatiemethode WCAG-EM.
              </div>
            </div>
            {project.scopeUrls.length > 0 ? (
              <ul className="space-y-2">
                {project.scopeUrls.map((scopeUrl: any, index: number) => (
                  <li key={index} className="text-sm">
                    <a
                      href={scopeUrl.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {scopeUrl.url}
                    </a>
                    {scopeUrl.note && (
                      <div className="text-gray-600 mt-1 text-xs">{scopeUrl.note}</div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600">
                De scope van dit onderzoek betreft aanvullend deelonderzoek (mijn.urk.nl).
              </p>
            )}
          </div>
        </div>

        {/* Research method */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Onderzoeksmethode</h3>
          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium text-gray-500">Methode</div>
              <a
                href="https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                {project.methodName || 'WCAG-EM'}
              </a>
            </div>
          </div>
        </div>

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

        {/* User agents */}
        {project.userAgents && project.userAgents.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User agents</h3>
            <ul className="space-y-1">
              {project.userAgents.map((agent: string, index: number) => (
                <li key={index} className="text-sm text-gray-700">
                  {agent}
                </li>
              ))}
            </ul>
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
  );
}
