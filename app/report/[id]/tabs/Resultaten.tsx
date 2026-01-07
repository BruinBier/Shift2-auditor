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
    <div className="space-y-8">
      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="text-4xl font-bold text-green-600 mb-2">{stats.passed}</div>
          <div className="text-sm text-gray-600">Goedgekeurd</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="text-4xl font-bold text-red-600 mb-2">{stats.failed}</div>
          <div className="text-sm text-gray-600">Afgekeurd</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="text-4xl font-bold text-gray-600 mb-2">{stats.notPresent}</div>
          <div className="text-sm text-gray-600">Niet aanwezig</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="text-4xl font-bold text-yellow-600 mb-2">{stats.unknown}</div>
          <div className="text-sm text-gray-600">Onbekend</div>
        </div>
      </div>

      {/* Results per criterion */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Resultaten per successcriterium
        </h2>
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
              {criteriaWithResults.map((assessment: any) => (
                <tr key={assessment.wcagCriterion.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {assessment.wcagCriterion.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {assessment.wcagCriterion.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>{assessment.wcagCriterion.titleNl}</div>
                    {assessment.wcagCriterion.understandingUrl && (
                      <a
                        href={assessment.wcagCriterion.understandingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Understanding SC {assessment.wcagCriterion.code}
                      </a>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        assessment.status
                      )}`}
                    >
                      {getStatusLabel(assessment.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {assessment.findingsCount > 0 ? (
                      <span className="text-red-600 font-medium">{assessment.findingsCount}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Results per principle */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Resultaten per principe</h2>
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
                <tr key={stat.principle} className="hover:bg-gray-50">
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
            </tbody>
          </table>
        </div>
      </section>

      {/* Statistics */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Statistieken</h2>
        <div className="grid grid-cols-3 gap-6">
          {/* Findings by status */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bevindingen</h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Openstaand</dt>
                <dd className="text-sm font-medium text-gray-900">
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
      </section>
    </div>
  );
}
