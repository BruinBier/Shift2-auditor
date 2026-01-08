'use client';

export default function ProjectDetails({ project }: { project: any }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Project Details</h2>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
            <div className="text-gray-900">{project.title}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <div className="text-gray-900">{project.subject}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Standaard</label>
            <div className="text-gray-900">{project.standard}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Niveau</label>
            <div className="text-gray-900">{project.level}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type onderzoek</label>
            <div className="text-gray-900">{project.researchType}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organisatie</label>
            <div className="text-gray-900">{project.auditedByOrg}</div>
          </div>
          {project.researcherName && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Onderzoeker</label>
              <div className="text-gray-900">{project.researcherName}</div>
            </div>
          )}
          {project.clientName && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Klant</label>
              <div className="text-gray-900">{project.clientName}</div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          💡 <strong>Tip:</strong> Project details bewerken komt in een volgende versie. Voor nu kun je via de andere tabs steekproef, criteria en bevindingen beheren.
        </p>
      </div>
    </div>
  );
}
