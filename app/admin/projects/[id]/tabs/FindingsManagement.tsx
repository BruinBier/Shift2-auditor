'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function FindingsManagement({ project, allCriteria }: { project: any; allCriteria: any[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    findingCode: '',
    wcagCriterionId: '',
    status: 'published' as 'open' | 'published' | 'resolved',
    impact: 'matig' as 'klein' | 'matig' | 'kritiek' | 'onbekend',
    responsibility: 'ontwikkelaar' as 'ontwikkelaar' | 'redacteur' | 'ontwerper' | 'onbekend',
    description: '',
    advice: '',
    evidence: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch(`/api/projects/${project.id}/findings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      setFormData({
        findingCode: '',
        wcagCriterionId: '',
        status: 'published',
        impact: 'matig',
        responsibility: 'ontwikkelaar',
        description: '',
        advice: '',
        evidence: '',
      });
      setShowForm(false);
      router.refresh();
    } else {
      alert('Fout bij toevoegen van bevinding');
    }
  };

  const handleDelete = async (findingId: string) => {
    if (!confirm('Weet je zeker dat je deze bevinding wilt verwijderen?')) return;

    // Note: We need to add this endpoint
    alert('Delete functionaliteit wordt nog toegevoegd');
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'kritiek': return 'bg-red-100 text-red-800';
      case 'matig': return 'bg-yellow-100 text-yellow-800';
      case 'klein': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Bevindingen beheren</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Annuleren' : '+ Bevinding toevoegen'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Nieuwe bevinding</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bevinding Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.findingCode}
                  onChange={(e) => setFormData({ ...formData, findingCode: e.target.value })}
                  placeholder="SHP-3-F5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WCAG Criterium <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.wcagCriterionId}
                  onChange={(e) => setFormData({ ...formData, wcagCriterionId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Selecteer criterium --</option>
                  {allCriteria.map((criterion) => (
                    <option key={criterion.id} value={criterion.id}>
                      {criterion.code} - {criterion.titleNl}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="open">Open</option>
                  <option value="published">Gepubliceerd</option>
                  <option value="resolved">Opgelost</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Impact</label>
                <select
                  value={formData.impact}
                  onChange={(e) => setFormData({ ...formData, impact: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="klein">Klein</option>
                  <option value="matig">Matig</option>
                  <option value="kritiek">Kritiek</option>
                  <option value="onbekend">Onbekend</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Verantwoordelijkheid</label>
                <select
                  value={formData.responsibility}
                  onChange={(e) => setFormData({ ...formData, responsibility: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ontwikkelaar">Ontwikkelaar</option>
                  <option value="redacteur">Redacteur</option>
                  <option value="ontwerper">Ontwerper</option>
                  <option value="onbekend">Onbekend</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Beschrijving <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Beschrijf het probleem..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Advies <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.advice}
                onChange={(e) => setFormData({ ...formData, advice: e.target.value })}
                rows={3}
                placeholder="Geef advies voor oplossing..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bewijs (optioneel)
              </label>
              <textarea
                value={formData.evidence}
                onChange={(e) => setFormData({ ...formData, evidence: e.target.value })}
                rows={2}
                placeholder="Code snippet of screenshot referentie..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Bevinding toevoegen
            </button>
          </form>
        </div>
      )}

      {/* Findings list */}
      {project.findings.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500">Nog geen bevindingen toegevoegd.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {project.findings.map((finding: any) => (
            <div key={finding.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{finding.findingCode}</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getImpactColor(finding.impact)}`}>
                    {finding.impact}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {finding.responsibility}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {finding.wcagCriterion.code} - {finding.wcagCriterion.titleNl}
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-700">Beschrijving:</span>
                  <p className="text-sm text-gray-600 mt-1">{finding.description}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Advies:</span>
                  <p className="text-sm text-gray-600 mt-1">{finding.advice}</p>
                </div>
                {finding.evidence && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Bewijs:</span>
                    <pre className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded">{finding.evidence}</pre>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
