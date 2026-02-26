'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface FinalizeProps {
  project: any;
  allCriteria: any[];
}

export default function Finalize({ project, allCriteria }: FinalizeProps) {
  const router = useRouter();
  const [applicableCriteria, setApplicableCriteria] = useState(allCriteria);
  const [isControlDialogOpen, setIsControlDialogOpen] = useState(false);
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);

  // Load research type from localStorage and filter criteria
  useEffect(() => {
    console.log('=== FINALIZE FILTERING DEBUG ===');
    console.log('Project researchType:', project.researchType);
    console.log('Total criteria count:', allCriteria.length);

    if (typeof window !== 'undefined') {
      if (!project.researchType) {
        console.log('⚠️ No research type set on project - showing all criteria');
        setApplicableCriteria(allCriteria);
        return;
      }

      const saved = localStorage.getItem('researchTypes');
      console.log('LocalStorage researchTypes exists:', !!saved);

      if (saved) {
        try {
          const researchTypes = JSON.parse(saved);
          console.log('Number of research types in localStorage:', researchTypes.length);

          const researchType = researchTypes.find((rt: any) => rt.name === project.researchType);
          console.log('Found matching research type:', !!researchType);

          if (researchType) {
            console.log('Research type name:', researchType.name);
            console.log('Selected criteria count:', researchType.selectedCriteria?.length || 0);

            if (researchType.selectedCriteria && researchType.selectedCriteria.length > 0) {
              // Create a Set of selected criterion IDs for faster lookup
              const selectedIds = new Set(researchType.selectedCriteria);

              // Filter criteria: check both ID and code matching
              const filtered = allCriteria.filter((criterion: any) => {
                // Try matching by ID first
                if (selectedIds.has(criterion.id)) {
                  return true;
                }
                // Fallback: match by code if stored criteria are codes
                if (selectedIds.has(criterion.code)) {
                  return true;
                }
                return false;
              });

              console.log('✅ Filtered criteria count:', filtered.length);
              console.log('Sample selected IDs:', Array.from(selectedIds).slice(0, 5));
              console.log('Sample criterion IDs:', allCriteria.slice(0, 3).map((c: any) => ({ id: c.id, code: c.code })));

              setApplicableCriteria(filtered.length > 0 ? filtered : allCriteria);
            } else {
              console.log('⚠️ No selected criteria in research type - showing all');
              setApplicableCriteria(allCriteria);
            }
          } else {
            console.log('⚠️ Research type not found in localStorage - showing all');
            setApplicableCriteria(allCriteria);
          }
        } catch (error) {
          console.error('❌ Error loading research type:', error);
          setApplicableCriteria(allCriteria);
        }
      } else {
        console.log('⚠️ No researchTypes in localStorage - showing all');
        setApplicableCriteria(allCriteria);
      }
    } else {
      console.log('⚠️ Window not defined - showing all');
      setApplicableCriteria(allCriteria);
    }
    console.log('=== END DEBUG ===');
  }, [project.researchType, allCriteria]);

  // Get all criteria with their assessment status
  const criteriaWithAssessments = applicableCriteria.map((criterion) => {
    const assessment = project.criterionAssessments?.find(
      (a: any) => a.wcagCriterionId === criterion.id
    );
    return {
      criterion,
      status: assessment?.status || 'untested',
      notes: assessment?.notes || '',
    };
  });

  // Debug: Log principle breakdown
  useEffect(() => {
    console.log('=== PRINCIPLE BREAKDOWN ===');
    const perceivable = criteriaWithAssessments.filter((c: any) => c.criterion.principle === 'Perceivable' && c.status !== 'untested');
    console.log('Perceivable (beoordeeld):', perceivable.length);
    console.log('Perceivable criteria:', perceivable.map((c: any) => ({ code: c.criterion.code, principle: c.criterion.principle, status: c.status })));

    const allAssessed = criteriaWithAssessments.filter((c: any) => c.status !== 'untested');
    console.log('Alle beoordeelde criteria:', allAssessed.length);
    console.log('All assessed:', allAssessed.map((c: any) => ({ code: c.criterion.code, principle: c.criterion.principle, status: c.status })));
  }, [criteriaWithAssessments]);

  // For demo purposes, generate a simple criterion ID mapping
  const getCriterionId = (code: string) => {
    // This should ideally match the actual criterion IDs from the database
    // For now, we'll use a simple pattern
    return `criterion-${code.replace(/\./g, '-')}`;
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left column - Main content */}
      <div className="col-span-9">
        {/* Vraag om controle blok */}
        <div className="bg-green-50 rounded-lg border border-green-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Vraag om controle</h3>
          <p className="text-sm text-gray-700 mb-4">
            Frits Karskens controleert de resultaten van jouw toetsing. De controleur kan wijzigingen maken en het onderzoek voortzetten. De datum van vandaag wordt opgeslagen als onderzoeksdatum.
          </p>
          <button
            onClick={() => setIsControlDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#6b2d8f] text-white rounded-lg hover:bg-[#5a2578] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Controle aanvragen
          </button>
        </div>

        {/* Markeer als afgerond blok */}
        <div className="bg-green-50 rounded-lg border border-green-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Markeer als afgerond</h3>
          <p className="text-sm text-gray-700 mb-4">
            Het onderzoek wordt afgerond en online gepubliceerd. Een officieel rapport wordt gegenereerd in PDF, JSON en CSV.
          </p>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#6b2d8f] text-white rounded-lg hover:bg-[#5a2578] transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Beoordeling
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Onderzoek afronden
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-xl font-bold">Resultaten per succescriterium</h2>
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>

          {criteriaWithAssessments.length > 0 ? (
            <div className="mb-8">
              {/* Status badges */}
              <div className="grid grid-cols-5 gap-3 mb-6">
                <div className="bg-green-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-800">
                    {criteriaWithAssessments.filter((c: any) => c.status === 'passed').length}
                  </div>
                  <div className="text-xs text-green-700 mt-1">Goedgekeurd</div>
                </div>
                <div className="bg-red-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-800">
                    {criteriaWithAssessments.filter((c: any) => c.status === 'failed').length}
                  </div>
                  <div className="text-xs text-red-700 mt-1">Afgekeurd</div>
                </div>
                <div className="bg-gray-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-800">
                    {criteriaWithAssessments.filter((c: any) => c.status === 'not_present').length}
                  </div>
                  <div className="text-xs text-gray-700 mt-1">Niet aanwezig</div>
                </div>
                <div className="bg-orange-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-800">
                    {criteriaWithAssessments.filter((c: any) => c.status === 'unknown').length}
                  </div>
                  <div className="text-xs text-orange-700 mt-1">Niet beoordeeld</div>
                </div>
                <div className="bg-blue-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-800">
                    {criteriaWithAssessments.filter((c: any) => c.status === 'untested').length}
                  </div>
                  <div className="text-xs text-blue-700 mt-1">Niet getoetst</div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-2 px-3 font-medium text-gray-700">WCAG</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-700">Niveau</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-700">Beschrijving</th>
                      <th className="text-center py-2 px-3 font-medium text-gray-700">Status</th>
                      <th className="text-center py-2 px-3 font-medium text-gray-700">Bevindingen</th>
                      <th className="py-2 px-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {criteriaWithAssessments.map((item: any) => {
                      const criterion = item.criterion;
                      const getStatusColor = (status: string) => {
                        switch (status) {
                          case 'passed':
                            return 'bg-green-100 text-green-800';
                          case 'failed':
                            return 'bg-red-100 text-red-800';
                          case 'not_present':
                            return 'bg-gray-100 text-gray-800';
                          case 'unknown':
                            return 'bg-orange-100 text-orange-800';
                          case 'untested':
                            return 'bg-blue-100 text-blue-800';
                          default:
                            return 'bg-gray-100 text-gray-800';
                        }
                      };

                      const getStatusLabel = (status: string) => {
                        switch (status) {
                          case 'passed':
                            return 'Goedgekeurd';
                          case 'failed':
                            return 'Afgekeurd';
                          case 'not_present':
                            return 'Niet aanwezig';
                          case 'unknown':
                            return 'Niet beoordeeld';
                          case 'untested':
                            return 'Niet getoetst';
                          default:
                            return 'Niet beoordeeld';
                        }
                      };

                      const findingsCount = project.findings?.filter(
                        (f: any) => f.wcagCriterionId === criterion.id
                      ).length || 0;

                      return (
                        <tr
                          key={criterion.id}
                          className="border-t border-gray-100 criteria-list-button cursor-pointer"
                          onClick={() => {
                            router.push(`/admin/projects/${project.id}?tab=bevindingen#criterion-${criterion.id}`);
                          }}
                        >
                          <td className="py-2 px-3 text-gray-900">{criterion.code}</td>
                          <td className="py-2 px-3"><span className="text-xs">{criterion.level}</span></td>
                          <td className="py-2 px-3 text-gray-700">
                            <span className={`criterion-title ${item.status === 'failed' ? 'font-bold' : ''}`}>
                              {criterion.titleNl}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-2 py-1 rounded text-xs ${getStatusColor(item.status)}`}>
                              {getStatusLabel(item.status)}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center text-gray-900">
                            {findingsCount > 0 ? findingsCount : '-'}
                          </td>
                          <td className="py-2 px-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent row click
                                router.push(`/admin/projects/${project.id}?tab=bevindingen#criterion-${criterion.id}`);
                              }}
                              className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Geen criteria beoordeeld. Dit is een mock-pagina.
            </div>
          )}

          {/* Resultaten per principe */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-xl font-bold">Resultaten per principe</h2>
              <button className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-3 font-medium text-gray-700">WCAG Principe</th>
                    <th className="text-center py-3 px-3 font-medium text-gray-700">A</th>
                    <th className="text-center py-3 px-3 font-medium text-gray-700">AA</th>
                    <th className="text-center py-3 px-3 font-medium text-gray-700">Totaal</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Waarneembaar */}
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-3 text-gray-900">Waarneembaar</td>
                    <td className="py-3 px-3 text-center text-gray-700">
                      {criteriaWithAssessments.filter((c: any) => c.criterion.principle === 'Perceivable' && c.criterion.level === 'A' && (c.status === 'passed' || c.status === 'not_present')).length} / {criteriaWithAssessments.filter((c: any) => c.criterion.principle === 'Perceivable' && c.criterion.level === 'A' && (c.status === 'passed' || c.status === 'not_present' || c.status === 'failed')).length}
                    </td>
                    <td className="py-3 px-3 text-center text-gray-700">
                      {criteriaWithAssessments.filter((c: any) => c.criterion.principle === 'Perceivable' && c.criterion.level === 'AA' && (c.status === 'passed' || c.status === 'not_present')).length} / {criteriaWithAssessments.filter((c: any) => c.criterion.principle === 'Perceivable' && c.criterion.level === 'AA' && (c.status === 'passed' || c.status === 'not_present' || c.status === 'failed')).length}
                    </td>
                    <td className="py-3 px-3 text-center font-medium text-gray-900">
                      {criteriaWithAssessments.filter((c: any) => c.criterion.principle === 'Perceivable' && (c.status === 'passed' || c.status === 'not_present')).length} / {criteriaWithAssessments.filter((c: any) => c.criterion.principle === 'Perceivable' && (c.status === 'passed' || c.status === 'not_present' || c.status === 'failed')).length}
                    </td>
                  </tr>

                  {/* Bedienbaar */}
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-3 text-gray-900">Bedienbaar</td>
                    <td className="py-3 px-3 text-center text-gray-700">
                      {criteriaWithAssessments.filter((c: any) => c.criterion.principle === 'Operable' && c.criterion.level === 'A' && (c.status === 'passed' || c.status === 'not_present')).length} / {criteriaWithAssessments.filter((c: any) => c.criterion.principle === 'Operable' && c.criterion.level === 'A' && (c.status === 'passed' || c.status === 'not_present' || c.status === 'failed')).length}
                    </td>
                    <td className="py-3 px-3 text-center text-gray-700">
                      {criteriaWithAssessments.filter((c: any) => c.criterion.principle === 'Operable' && c.criterion.level === 'AA' && (c.status === 'passed' || c.status === 'not_present')).length} / {criteriaWithAssessments.filter((c: any) => c.criterion.principle === 'Operable' && c.criterion.level === 'AA' && (c.status === 'passed' || c.status === 'not_present' || c.status === 'failed')).length}
                    </td>
                    <td className="py-3 px-3 text-center font-medium text-gray-900">
                      {criteriaWithAssessments.filter((c: any) => c.criterion.principle === 'Operable' && (c.status === 'passed' || c.status === 'not_present')).length} / {criteriaWithAssessments.filter((c: any) => c.criterion.principle === 'Operable' && (c.status === 'passed' || c.status === 'not_present' || c.status === 'failed')).length}
                    </td>
                  </tr>

                  {/* Begrijpelijk */}
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-3 text-gray-900">Begrijpelijk</td>
                    <td className="py-3 px-3 text-center text-gray-700">
                      {criteriaWithAssessments.filter((c: any) => c.criterion.principle === 'Understandable' && c.criterion.level === 'A' && (c.status === 'passed' || c.status === 'not_present')).length} / {criteriaWithAssessments.filter((c: any) => c.criterion.principle === 'Understandable' && c.criterion.level === 'A' && (c.status === 'passed' || c.status === 'not_present' || c.status === 'failed')).length}
                    </td>
                    <td className="py-3 px-3 text-center text-gray-700">
                      {criteriaWithAssessments.filter((c: any) => c.criterion.principle === 'Understandable' && c.criterion.level === 'AA' && (c.status === 'passed' || c.status === 'not_present')).length} / {criteriaWithAssessments.filter((c: any) => c.criterion.principle === 'Understandable' && c.criterion.level === 'AA' && (c.status === 'passed' || c.status === 'not_present' || c.status === 'failed')).length}
                    </td>
                    <td className="py-3 px-3 text-center font-medium text-gray-900">
                      {criteriaWithAssessments.filter((c: any) => c.criterion.principle === 'Understandable' && (c.status === 'passed' || c.status === 'not_present')).length} / {criteriaWithAssessments.filter((c: any) => c.criterion.principle === 'Understandable' && (c.status === 'passed' || c.status === 'not_present' || c.status === 'failed')).length}
                    </td>
                  </tr>

                  {/* Robuust */}
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-3 text-gray-900">Robuust</td>
                    <td className="py-3 px-3 text-center text-gray-700">
                      {criteriaWithAssessments.filter((c: any) => c.criterion.principle === 'Robust' && c.criterion.level === 'A' && (c.status === 'passed' || c.status === 'not_present')).length} / {criteriaWithAssessments.filter((c: any) => c.criterion.principle === 'Robust' && c.criterion.level === 'A' && (c.status === 'passed' || c.status === 'not_present' || c.status === 'failed')).length}
                    </td>
                    <td className="py-3 px-3 text-center text-gray-700">
                      {criteriaWithAssessments.filter((c: any) => c.criterion.principle === 'Robust' && c.criterion.level === 'AA' && (c.status === 'passed' || c.status === 'not_present')).length} / {criteriaWithAssessments.filter((c: any) => c.criterion.principle === 'Robust' && c.criterion.level === 'AA' && (c.status === 'passed' || c.status === 'not_present' || c.status === 'failed')).length}
                    </td>
                    <td className="py-3 px-3 text-center font-medium text-gray-900">
                      {criteriaWithAssessments.filter((c: any) => c.criterion.principle === 'Robust' && (c.status === 'passed' || c.status === 'not_present')).length} / {criteriaWithAssessments.filter((c: any) => c.criterion.principle === 'Robust' && (c.status === 'passed' || c.status === 'not_present' || c.status === 'failed')).length}
                    </td>
                  </tr>

                  {/* Totaal */}
                  <tr className="border-t-2 border-gray-300 font-medium">
                    <td className="py-3 px-3 text-gray-900">Totaal</td>
                    <td className="py-3 px-3 text-center text-gray-900">
                      {criteriaWithAssessments.filter((c: any) => c.criterion.level === 'A' && (c.status === 'passed' || c.status === 'not_present')).length} / {criteriaWithAssessments.filter((c: any) => c.criterion.level === 'A' && (c.status === 'passed' || c.status === 'not_present' || c.status === 'failed')).length}
                    </td>
                    <td className="py-3 px-3 text-center text-gray-900">
                      {criteriaWithAssessments.filter((c: any) => c.criterion.level === 'AA' && (c.status === 'passed' || c.status === 'not_present')).length} / {criteriaWithAssessments.filter((c: any) => c.criterion.level === 'AA' && (c.status === 'passed' || c.status === 'not_present' || c.status === 'failed')).length}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-gray-900">
                      {criteriaWithAssessments.filter((c: any) => c.status === 'passed' || c.status === 'not_present').length} / {criteriaWithAssessments.filter((c: any) => c.status === 'passed' || c.status === 'not_present' || c.status === 'failed').length}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Right column - Stap 5. Onderzoek overzicht */}
      <div className="col-span-3">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-6 text-shift2-primary">Stap 5. Onderzoek overzicht</h3>

          <div className="space-y-6">
            {/* Succescriteria */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">Succescriteria</span>
                <span className="text-sm text-gray-600">
                  {criteriaWithAssessments.filter((c: any) => c.status !== 'untested').length} van {applicableCriteria.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-6">
                <div
                  className="h-6 rounded-full"
                  style={{ width: `${(criteriaWithAssessments.filter((c: any) => c.status !== 'untested').length / applicableCriteria.length) * 100}%`, backgroundColor: '#6b2d8f' }}
                />
              </div>
            </div>

            {/* Waarneembaar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">Waarneembaar</span>
                <span className="text-sm text-gray-600">
                  {criteriaWithAssessments.filter((c: any) => c.criterion.principle === 'Perceivable' && (c.status === 'passed' || c.status === 'not_present' || c.status === 'failed')).length} van {applicableCriteria.filter((c: any) => c.principle === 'Perceivable').length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${(criteriaWithAssessments.filter((c: any) => c.criterion.principle === 'Perceivable' && (c.status === 'passed' || c.status === 'not_present' || c.status === 'failed')).length / applicableCriteria.filter((c: any) => c.principle === 'Perceivable').length) * 100}%`,
                    backgroundColor: '#6b2d8f',
                  }}
                />
              </div>
            </div>

            {/* Bedienbaar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">Bedienbaar</span>
                <span className="text-sm text-gray-600">
                  {criteriaWithAssessments.filter((c: any) => c.criterion.principle === 'Operable' && (c.status === 'passed' || c.status === 'not_present' || c.status === 'failed')).length} van {applicableCriteria.filter((c: any) => c.principle === 'Operable').length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${(criteriaWithAssessments.filter((c: any) => c.criterion.principle === 'Operable' && (c.status === 'passed' || c.status === 'not_present' || c.status === 'failed')).length / applicableCriteria.filter((c: any) => c.principle === 'Operable').length) * 100}%`,
                    backgroundColor: '#6b2d8f',
                  }}
                />
              </div>
            </div>

            {/* Begrijpelijk */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">Begrijpelijk</span>
                <span className="text-sm text-gray-600">
                  {criteriaWithAssessments.filter((c: any) => c.criterion.principle === 'Understandable' && (c.status === 'passed' || c.status === 'not_present' || c.status === 'failed')).length} van {applicableCriteria.filter((c: any) => c.principle === 'Understandable').length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${(criteriaWithAssessments.filter((c: any) => c.criterion.principle === 'Understandable' && (c.status === 'passed' || c.status === 'not_present' || c.status === 'failed')).length / applicableCriteria.filter((c: any) => c.principle === 'Understandable').length) * 100}%`,
                    backgroundColor: '#6b2d8f',
                  }}
                />
              </div>
            </div>

            {/* Robuust */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">Robuust</span>
                <span className="text-sm text-gray-600">
                  {criteriaWithAssessments.filter((c: any) => c.criterion.principle === 'Robust' && (c.status === 'passed' || c.status === 'not_present' || c.status === 'failed')).length} van {applicableCriteria.filter((c: any) => c.principle === 'Robust').length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${(criteriaWithAssessments.filter((c: any) => c.criterion.principle === 'Robust' && (c.status === 'passed' || c.status === 'not_present' || c.status === 'failed')).length / applicableCriteria.filter((c: any) => c.principle === 'Robust').length) * 100}%`,
                    backgroundColor: '#6b2d8f',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controle Dialog Modal */}
      {isControlDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative">
            {/* Close button */}
            <button
              onClick={() => setIsControlDialogOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Content */}
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vraag om controle</h3>
            <p className="text-sm text-gray-700 mb-6">
              Frits Karskens controleert de resultaten van jouw toetsing. De controleur kan wijzigingen maken en het onderzoek voortzetten. De datum van vandaag wordt opgeslagen als onderzoeksdatum.
            </p>
            <button className="modal-save-button flex items-center gap-2 px-4 py-2 bg-[#6b2d8f] text-white rounded-lg hover:bg-[#5a2578] transition-colors w-full justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Controle aanvragen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}