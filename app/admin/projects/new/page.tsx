'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewProjectPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: 'Rapport digitale toegankelijkheid',
    subject: '',
    standard: 'WCAG 2.2',
    level: 'AA',
    researchType: 'aanvullend deelonderzoek content',
    clientName: '',
    commissionedBy: '',
    auditedByOrg: 'Shift2',
    researcherName: '',
    methodName: 'WCAG-EM',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      const project = await response.json();
      router.push(`/admin/projects/${project.id}`);
    } else {
      alert('Er is een fout opgetreden bij het aanmaken van het project.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Nieuw onderzoek aanmaken</h1>
          <p className="text-gray-600 mt-1">Vul de basisgegevens in voor je nieuwe onderzoek</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titel <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-shift2-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject (bijv. website URL) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="mijn.urk.nl"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-shift2-primary focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Standaard</label>
                <select
                  value={formData.standard}
                  onChange={(e) => setFormData({ ...formData, standard: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-shift2-primary focus:border-transparent"
                >
                  <option value="WCAG 2.0">WCAG 2.0</option>
                  <option value="WCAG 2.1">WCAG 2.1</option>
                  <option value="WCAG 2.2">WCAG 2.2</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Niveau</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-shift2-primary focus:border-transparent"
                >
                  <option value="A">A</option>
                  <option value="AA">AA</option>
                  <option value="AAA">AAA</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type onderzoek <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.researchType}
                onChange={(e) => setFormData({ ...formData, researchType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-shift2-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Klant naam</label>
              <input
                type="text"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-shift2-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                In opdracht van
              </label>
              <input
                type="text"
                value={formData.commissionedBy}
                onChange={(e) => setFormData({ ...formData, commissionedBy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-shift2-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Uitgevoerd door organisatie
              </label>
              <input
                type="text"
                value={formData.auditedByOrg}
                onChange={(e) => setFormData({ ...formData, auditedByOrg: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-shift2-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Naam onderzoeker
              </label>
              <input
                type="text"
                value={formData.researcherName}
                onChange={(e) => setFormData({ ...formData, researcherName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-shift2-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Methode</label>
              <input
                type="text"
                value={formData.methodName}
                onChange={(e) => setFormData({ ...formData, methodName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-shift2-primary focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <button
              type="submit"
              className="px-6 py-2 bg-shift2-primary text-white rounded-lg hover:bg-shift2-secondary transition-colors font-medium"
            >
              Project aanmaken
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Annuleren
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
