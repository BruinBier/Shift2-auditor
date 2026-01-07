'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CriteriaAssessments({ project, allCriteria }: { project: any; allCriteria: any[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'A' | 'AA'>('all');
  const [saving, setSaving] = useState<string | null>(null);

  const filteredCriteria = filter === 'all'
    ? allCriteria
    : allCriteria.filter(c => c.level === filter);

  const handleStatusChange = async (criterionId: string, status: string) => {
    setSaving(criterionId);

    const response = await fetch(`/api/projects/${project.id}/assessments/${criterionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    setSaving(null);

    if (response.ok) {
      router.refresh();
    } else {
      alert('Fout bij opslaan van beoordeling');
    }
  };

  const getAssessmentStatus = (criterionId: string) => {
    const assessment = project.criterionAssessments.find(
      (a: any) => a.wcagCriterionId === criterionId
    );
    return assessment?.status || '';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'not_present': return 'bg-gray-100 text-gray-800';
      case 'unknown': return 'bg-yellow-100 text-yellow-800';
      case 'not_tested': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-50 text-gray-500';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Criteria beoordelen</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Alle ({allCriteria.length})
          </button>
          <button
            onClick={() => setFilter('A')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'A' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Niveau A ({allCriteria.filter(c => c.level === 'A').length})
          </button>
          <button
            onClick={() => setFilter('AA')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'AA' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Niveau AA ({allCriteria.filter(c => c.level === 'AA').length})
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Niveau</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titel</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredCriteria.map((criterion) => {
              const currentStatus = getAssessmentStatus(criterion.id);
              const isSaving = saving === criterion.id;

              return (
                <tr key={criterion.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{criterion.code}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {criterion.level}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{criterion.titleNl}</td>
                  <td className="px-4 py-3">
                    <select
                      value={currentStatus}
                      onChange={(e) => handleStatusChange(criterion.id, e.target.value)}
                      disabled={isSaving}
                      className={`text-sm px-3 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        currentStatus ? getStatusColor(currentStatus) : ''
                      } ${isSaving ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                    >
                      <option value="">-- Selecteer status --</option>
                      <option value="passed">Goedgekeurd</option>
                      <option value="failed">Afgekeurd</option>
                      <option value="not_present">Niet aanwezig</option>
                      <option value="unknown">Onbekend</option>
                      <option value="not_tested">Niet getest</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          💡 <strong>Tip:</strong> De status wordt automatisch opgeslagen zodra je een keuze maakt. Je kunt de voortgang zien in het rapport.
        </p>
      </div>
    </div>
  );
}
