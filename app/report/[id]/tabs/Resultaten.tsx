import {
  calculateReportStats,
  calculatePrincipleStats,
  getStatusLabel,
  getStatusColor,
  getPrincipleLabel,
} from '@/lib/report-calculations';

export default function Resultaten({ project }: { project: any }) {
  const stats = calculateReportStats(project);
  const principleStats = calculatePrincipleStats(project);

  // Group assessments by criterion with finding count
  const criteriaWithResults = project.criterionAssessments.map((assessment: any) => {
    const findingsCount = project.findings.filter(
      (f: any) =>
        f.wcagCriterionId === assessment.wcagCriterion.id &&
        (f.status === 'published' || f.status === 'open')
    ).length;

    return {
      ...assessment,
      findingsCount,
    };
  });

  // Sort by code
  criteriaWithResults.sort((a: any, b: any) => a.wcagCriterion.code.localeCompare(b.wcagCriterion.code));

  return (
    <div className="grid grid-cols-3 gap-8">
      {/* Main content - Left column */}
      <div className="col-span-2 space-y-8">
        {/* Header */}
        <div className="mb-6">
          <div className="text-sm text-gray-600 mb-2">
            WCAG 2.2 AA – aanvullend deelonderzoek content – mijn.hhnk.nl
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Rapport digitale toegankelijkheid
          </h1>
          <p className="text-gray-700">
            Dit rapport toont de uitkomsten van het onderzoek digitale toegankelijkheid. De resultaten staan in twee overzichten: een per principe en een per succescriterium. Zo krijg je zowel een globaal overzicht als details over waar wel goed gaat en wat beter kan.
          </p>
        </div>

      {/* Summary stats and table - Resultaten per succescriterium */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          Resultaten per succescriterium
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </h2>

        {/* Stats boxes */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg border border-green-200 p-4 text-center">
            <div className="text-3xl font-bold text-green-700 mb-1">{stats.passed}</div>
            <div className="text-sm text-green-700 font-medium">Goedgekeurd</div>
          </div>
          <div className="bg-red-50 rounded-lg border border-red-200 p-4 text-center">
            <div className="text-3xl font-bold text-red-700 mb-1">{stats.failed}</div>
            <div className="text-sm text-red-700 font-medium">Afgekeurd</div>
          </div>
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-3xl font-bold text-gray-700 mb-1">{stats.notPresent}</div>
            <div className="text-sm text-gray-700 font-medium">Niet aanwezig</div>
          </div>
          <div className="bg-orange-50 rounded-lg border border-orange-200 p-4 text-center">
            <div className="text-3xl font-bold text-orange-700 mb-1">{stats.unknown}</div>
            <div className="text-sm text-orange-700 font-medium">Onbekend</div>
          </div>
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 text-center">
            <div className="text-3xl font-bold text-blue-700 mb-1">{stats.notTested}</div>
            <div className="text-sm text-blue-700 font-medium">Niet getoetst</div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  WCAG
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Niveau
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Beschrijving
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bevindingen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {criteriaWithResults.map((assessment: any) => {
                const isFailed = assessment.status === 'failed';
                return (
                  <tr key={assessment.wcagCriterion.id}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${isFailed ? 'font-bold' : ''}`}>
                      {assessment.wcagCriterion.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 ${isFailed ? 'font-bold' : ''}`}>
                        {assessment.wcagCriterion.level}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm text-gray-900 ${isFailed ? 'font-bold' : ''}`}>
                      <div className="hover:underline cursor-pointer">{assessment.wcagCriterion.titleNl}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${getStatusColor(
                          assessment.status
                        )} ${isFailed ? 'font-bold' : ''}`}
                      >
                        {getStatusLabel(assessment.status)}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${isFailed ? 'font-bold' : ''}`}>
                      {assessment.findingsCount > 0 ? (
                        <span className="text-red-600 font-medium">{assessment.findingsCount}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      </div>

      {/* Sidebar - Right column */}
      <div className="space-y-6">
        {/* Results per principle */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Resultaten per principe</h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    WCAG Principe
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Niveau A
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Niveau AA
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Totaal
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {principleStats.map((stat) => (
                  <tr key={stat.principle}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getPrincipleLabel(stat.principle)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {stat.levelA.passed} / {stat.levelA.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {stat.levelAA.passed} / {stat.levelAA.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                      {stat.total.passed} / {stat.total.total}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-bold">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    Totaal
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-center">
                    {principleStats.reduce((sum, stat) => sum + stat.levelA.passed, 0)} / {principleStats.reduce((sum, stat) => sum + stat.levelA.total, 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-center">
                    {principleStats.reduce((sum, stat) => sum + stat.levelAA.passed, 0)} / {principleStats.reduce((sum, stat) => sum + stat.levelAA.total, 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-center">
                    {principleStats.reduce((sum, stat) => sum + stat.total.passed, 0)} / {principleStats.reduce((sum, stat) => sum + stat.total.total, 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <h2 className="text-xl font-bold text-gray-900">Statistieken</h2>

        {/* Findings by status */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bevindingen</h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Openstaand</dt>
              <dd className="text-sm font-medium text-red-600">
                {project.findings.filter((f: any) => f.status === 'open').length}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Gepubliceerd</dt>
              <dd className="text-sm font-medium text-gray-900">
                {project.findings.filter((f: any) => f.status === 'published').length}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Opgelost</dt>
              <dd className="text-sm font-medium text-gray-900">
                {project.findings.filter((f: any) => f.status === 'resolved').length}
              </dd>
            </div>
          </dl>
        </div>

        {/* Impact */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Impact</h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Kritiek</dt>
              <dd className="text-sm font-medium text-red-600">
                {project.findings.filter((f: any) => f.impact === 'kritiek').length}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Matig</dt>
              <dd className="text-sm font-medium text-yellow-600">
                {project.findings.filter((f: any) => f.impact === 'matig').length}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Klein</dt>
              <dd className="text-sm font-medium text-green-600">
                {project.findings.filter((f: any) => f.impact === 'klein').length}
              </dd>
            </div>
          </dl>
        </div>

        {/* Responsibility */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Verantwoordelijkheid</h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Ontwikkelaar</dt>
              <dd className="text-sm font-medium text-gray-900">
                {project.findings.filter((f: any) => f.responsibility === 'ontwikkelaar').length}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Redacteur</dt>
              <dd className="text-sm font-medium text-gray-900">
                {project.findings.filter((f: any) => f.responsibility === 'redacteur').length}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Ontwerper</dt>
              <dd className="text-sm font-medium text-gray-900">
                {project.findings.filter((f: any) => f.responsibility === 'ontwerper').length}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
