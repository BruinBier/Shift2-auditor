'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { marked } from 'marked';
import {
  getStatusLabel,
  getStatusColor,
} from '@/lib/report-calculations';
import { formatProjectName } from '@/lib/format-project-name';

export default function Bevindingen({ project }: { project: any }) {
  console.log('🔵 Bevindingen component loaded!');
  console.log('🔵 Project data:', {
    id: project.id,
    hasGroupedFindings: !!project.groupedFindings,
    groupedFindingsLength: project.groupedFindings?.length
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [sampleItemFilter, setSampleItemFilter] = useState<string>('all');
  const [criteriumFilter, setCriteriumFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [responsibilityFilter, setResponsibilityFilter] = useState<string>('all');
  const [impactFilter, setImpactFilter] = useState<string>('all');
  const [resolvedFilter, setResolvedFilter] = useState<string>('all');
  const [flatReport, setFlatReport] = useState(false);
  const [hideEmptyCriteria, setHideEmptyCriteria] = useState(false);
  const [expandAllGuidelines, setExpandAllGuidelines] = useState(false);
  const [expandedAdvice, setExpandedAdvice] = useState<string | null>('all'); // 'all' means all advice sections are expanded by default
  const [expandedExplanations, setExpandedExplanations] = useState<Set<string>>(new Set());
  const [lightboxImage, setLightboxImage] = useState<{ url: string; caption: string } | null>(null);
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);

  // Escape key handler for lightbox
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && lightboxImage) {
        setLightboxImage(null);
      }
    };

    if (lightboxImage) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [lightboxImage]);

  // Use pre-grouped data from server
  const groupedData = project.groupedFindings || [];

  // Debug: Check if 1.3.5 exists in the data
  useEffect(() => {
    console.log('=== DEBUGGING 1.3.5 IN RAW GROUPED DATA ===');
    groupedData.forEach((principle: any) => {
      principle.guidelines.forEach((guideline: any) => {
        guideline.criteria.forEach((criterion: any) => {
          if (criterion.code === '1.3.5') {
            console.log('Found 1.3.5 in groupedData!');
            console.log('Assessment:', criterion.assessment);
            console.log('Findings:', criterion.findings?.length);
            criterion.findings?.forEach((f: any, i: number) => {
              console.log(`  Finding ${i + 1}:`, f.findingCode, 'Status:', f.status, 'Occurrences:', f.occurrences?.length);
            });
          }
        });
      });
    });
  }, [groupedData]);

  // Debug: Check filter states
  useEffect(() => {
    const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all' || impactFilter !== 'all' || sampleItemFilter !== 'all';
    console.log('=== FILTER STATES ===', {
      searchTerm,
      statusFilter,
      impactFilter,
      sampleItemFilter,
      hasActiveFilters
    });
  }, [searchTerm, statusFilter, impactFilter, sampleItemFilter]);

  // Extract unique sample items from all findings
  const sampleItems = useMemo(() => {
    const items = new Set<string>();
    groupedData.forEach((principle: any) => {
      principle.guidelines.forEach((guideline: any) => {
        guideline.criteria.forEach((criterion: any) => {
          criterion.findings.forEach((finding: any) => {
            if (finding.occurrences && Array.isArray(finding.occurrences)) {
              finding.occurrences.forEach((occurrence: any) => {
                if (occurrence.sampleItem?.title) {
                  items.add(occurrence.sampleItem.title);
                }
              });
            }
          });
        });
      });
    });
    return Array.from(items).sort();
  }, [groupedData]);

  // Add numbering to guidelines and criteria
  const numberedData = useMemo(() => {
    return groupedData.map((principle: any, principleIndex: number) => {
      const principleNumber = principleIndex + 1;

      return {
        ...principle,
        principleNumber,
        guidelines: principle.guidelines.map((guideline: any, guidelineIndex: number) => {
          const guidelineNumber = guidelineIndex + 1;

          return {
            ...guideline,
            number: `${principleNumber}.${guidelineNumber}`,
            criteria: guideline.criteria.map((criterion: any) => {
              // Extract number from criterion code (e.g., "1.4.11" -> 11)
              const codeParts = criterion.code.split('.');
              const criterionNumber = codeParts.length >= 3 ? parseInt(codeParts[2]) : 0;

              return {
                ...criterion,
                number: criterionNumber,
              };
            }),
          };
        }),
      };
    });
  }, [groupedData]);

  // Filter data
  const filteredData = useMemo(() => {
    const hasActiveFilters = searchTerm || statusFilter !== 'all' || impactFilter !== 'all' || sampleItemFilter !== 'all';

    return numberedData
      .map((principle: any) => ({
        ...principle,
        guidelines: principle.guidelines
          .map((guideline: any) => ({
            ...guideline,
            criteria: guideline.criteria
              .map((criterion: any) => {
                const filteredFindings = criterion.findings
                  .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0)) // Sort by sortOrder
                  .filter((finding: any) => {
                    if (searchTerm) {
                      const searchLower = searchTerm.toLowerCase();
                      if (
                        !finding.description.toLowerCase().includes(searchLower) &&
                        !finding.advice.toLowerCase().includes(searchLower) &&
                        !finding.findingCode.toLowerCase().includes(searchLower)
                      ) {
                        return false;
                      }
                    }

                    if (statusFilter !== 'all') {
                      if (finding.status !== statusFilter) {
                        return false;
                      }
                    } else {
                      // Bij het standaard "alle" filter: alleen opgeloste áfkeuringen verbergen —
                      // die horen niet in het herinspectie-rapport. Opmerkingen worden bewust
                      // met status 'resolved' opgeslagen (impact leeg) en moeten wél zichtbaar
                      // blijven. Onderscheid: afkeuring = impact != null, opmerking = impact == null.
                      // Alleen als de lezer expliciet op "Opgelost" filtert, worden opgeloste
                      // afkeuringen alsnog getoond.
                      if (finding.status === 'resolved' && finding.impact != null) {
                        return false;
                      }
                    }

                    if (impactFilter !== 'all' && finding.impact !== impactFilter) {
                      return false;
                    }

                    if (sampleItemFilter !== 'all') {
                      // Check if finding has any occurrence with the selected sample item
                      console.log('Filtering for:', sampleItemFilter);
                      console.log('Finding occurrences:', finding.occurrences);
                      const hasMatchingSampleItem = finding.occurrences?.some((occurrence: any) => {
                        console.log('Checking occurrence:', occurrence.sampleItem?.title, 'against', sampleItemFilter);
                        return occurrence.sampleItem?.title === sampleItemFilter;
                      });
                      console.log('hasMatchingSampleItem:', hasMatchingSampleItem);
                      if (!hasMatchingSampleItem) {
                        return false;
                      }
                    }

                    return true;
                  });

                return {
                  ...criterion,
                  filteredFindings,
                };
              })
              .filter((c: any) => !hasActiveFilters || c.filteredFindings.length > 0 || c.assessment),
          }))
          .filter((g: any) => !hasActiveFilters || g.criteria.length > 0),
      }))
      .filter((p: any) => !hasActiveFilters || p.guidelines.length > 0);
  }, [numberedData, searchTerm, statusFilter, impactFilter, sampleItemFilter]);

  // Debug: Check if 1.3.5 exists in FILTERED data
  useEffect(() => {
    console.log('=== CHECKING FOR 1.3.5 IN FILTERED DATA ===');
    let found = false;
    filteredData.forEach(principle => {
      principle.guidelines.forEach(guideline => {
        guideline.criteria.forEach(criterion => {
          if (criterion.code === '1.3.5') {
            found = true;
            console.log('FOUND 1.3.5 in filteredData:', {
              code: criterion.code,
              name: criterion.title,
              assessment: criterion.assessment,
              filteredFindings: criterion.filteredFindings,
              filteredFindingsCount: criterion.filteredFindings?.length
            });
          }
        });
      });
    });
    if (!found) {
      console.log('1.3.5 NOT FOUND in filteredData - it was filtered out!');
    }
  }, [filteredData]);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'kritiek':
        return 'bg-red-100 text-red-800';
      case 'serieus':
        return 'bg-orange-100 text-orange-800';
      case 'matig':
        return 'bg-yellow-100 text-yellow-800';
      case 'klein':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactLabel = (impact: string) => {
    const labels: Record<string, string> = {
      kritiek: 'Kritiek',
      serieus: 'Serieus',
      matig: 'Matig',
      klein: 'Klein',
      onbekend: 'Niet beoordeeld',
    };
    return labels[impact] || impact;
  };

  const getDisplayPrincipleName = (principleName: string) => {
    if (principleName === 'Begrijpbaar') return 'Begrijpelijk';
    return principleName;
  };

  const getPrincipleDescription = (principleName: string) => {
    const displayName = getDisplayPrincipleName(principleName);
    const descriptions: Record<string, string> = {
      'Waarneembaar': 'Informatie en componenten van de gebruikersinterface moeten toonbaar zijn aan gebruikers op voor hen waarneembare wijze.',
      'Bedienbaar': 'Componenten van de gebruikersinterface en navigatie moeten bedienbaar zijn.',
      'Begrijpelijk': 'Informatie en de bediening van de gebruikersinterface moeten begrijpelijk zijn.',
      'Robuust': 'Content moet voldoende robuust zijn om betrouwbaar geïnterpreteerd te kunnen worden door een breed scala van user agents, met inbegrip van hulptechnologieën.',
    };
    return descriptions[displayName] || '';
  };

  const getGuidelineDescription = (guidelineTitle: string) => {
    const descriptions: Record<string, string> = {
      'Tekstalternatieven': 'Lever tekstalternatieven voor alle niet-tekstuele content, zodat die veranderd kan worden in andere vormen die mensen nodig hebben, zoals grote letters, braille, spraak, symbolen of eenvoudigere taal.',
      'Op tijd gebaseerde media': 'Lever alternatieven voor op tijd gebaseerde media.',
      'Aanpasbaar': 'Maak content die op verschillende manieren gepresenteerd kan worden zonder dat informatie of structuur verloren gaat.',
      'Onderscheidbaar': 'Maak het makkelijker voor gebruikers om content te zien en te horen, waaronder het scheiden van voorgrond en achtergrond.',
      'Toetsenbordtoegankelijk': 'Maak alle functionaliteit beschikbaar vanaf een toetsenbord.',
      'Genoeg tijd': 'Geef gebruikers genoeg tijd om content te lezen en te gebruiken.',
      'Toevallen en fysieke reacties': 'Ontwerp content niet op een manier waarvan bekend is dat die toevallen of fysieke reacties veroorzaakt.',
      'Navigeerbaar': 'Lever manieren om gebruikers te helpen navigeren, content te vinden en te bepalen waar ze zijn.',
      'Input modaliteiten': 'Maak het makkelijker voor gebruikers om functionaliteit te bedienen via verschillende input methoden anders dan een toetsenbord.',
      'Leesbaar': 'Maak tekstcontent leesbaar en begrijpelijk.',
      'Voorspelbaar': 'Zorg dat webpagina\'s er op voorspelbare manieren uitzien en werken.',
      'Assistentie bij invoer': 'Help gebruikers om fouten te voorkomen en te herstellen.',
      'Compatibel': 'Maximaliseer de compatibiliteit met huidige en toekomstige user agents, inclusief hulptechnologieën.',
    };
    return descriptions[guidelineTitle] || `Lever ${guidelineTitle.toLowerCase()} voor alle content.`;
  };

  const getCriterionExplanation = (code: string) => {
    const explanations: Record<string, string> = {
      '1.1.1': 'Niet-tekstuele inhoud, zoals afbeeldingen, moet toegankelijk zijn met een tekstalternatief. Hierdoor kan hulpsoftware de informatie hoorbaar (voorleessoftware) of tastbaar (braille) maken. Dit is belangrijk voor mensen die blind, slechtziend of doofblind zijn, of andere beperkingen hebben bij het waarnemen van visuele content.\n\nBelangrijke informatie in niet-tekstuele content moet altijd voor iedereen waarneembaar zijn. Zonder tekstalternatieven missen sommige bezoekers deze informatie. Als de content alleen decoratief is, moet het door hulpsoftware genegeerd kunnen worden. Dit voorkomt dat gebruikers worden afgeleid door onnodige details.\n\nAls een afbeelding functioneel (bijvoorbeeld klikbaar) is, moet het tekstalternatief duidelijk wat het doel is van de afbeelding. Zo wordt ook voldaan aan andere succescriteria, bijvoorbeeld succescriterium 2.4.4 (linkdoel), 2.4.6 (koppen en labels) en 4.1.2 (naam, rol en waarde).',
    };
    return explanations[code] || '';
  };

  // Convert Understanding URL to Dutch WCAG URL
  const getDutchWCAGUrl = (understandingUrl: string | null | undefined) => {
    if (!understandingUrl) return null;

    // Extract the slug from the Understanding URL
    // e.g., https://www.w3.org/WAI/WCAG22/Understanding/non-text-content → non-text-content
    const match = understandingUrl.match(/\/Understanding\/(.+?)(?:\.html)?$/);
    if (match && match[1]) {
      const slug = match[1];
      return `https://www.w3.org/Translations/WCAG22-nl/#${slug}`;
    }

    return understandingUrl; // Fallback to original URL
  };

  const getPrincipleIcon = (principleName: string) => {
    switch (principleName) {
      case 'Waarneembaar':
        return (
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        );
      case 'Bedienbaar':
        return (
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
          </svg>
        );
      case 'Begrijpelijk':
        return (
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case 'Robuust':
        return (
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getCriterionBorderColor = (status: string) => {
    switch (status) {
      case 'failed':
        return '#fecaca'; // red-200
      case 'passed':
      case 'not_present':
        return '#bbf7d0'; // green-200
      default:
        return '#cbd5e1'; // gray-300
    }
  };

  // Function to render advice with proper markdown formatting
  const renderAdvice = useCallback((advice: string) => {
    try {
      const html = marked(advice, {
        breaks: true,
        gfm: true,
      });
      // Add target="_blank" to all links
      const htmlWithTargetBlank = (html as string).replace(
        /<a /g,
        '<a target="_blank" rel="noopener noreferrer" title="opent in nieuw venster" '
      );
      return <div className="finding-description space-y-3" dangerouslySetInnerHTML={{ __html: htmlWithTargetBlank }} />;
    } catch (error) {
      console.error('Error rendering markdown:', error);
      return <div className="text-sm text-gray-700">{advice}</div>;
    }
  }, []);

  return (
    <div className="grid grid-cols-4 gap-8">
      {/* Main content */}
      <div className="col-span-3 space-y-6">
        {/* Header */}
        <div className="mb-6">
          <div className="text-sm text-gray-600 mb-2">
            {project.title}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Toegankelijkheidsonderzoek {formatProjectName(project.subject || project.title, project.researchTypeData?.type)}
          </h1>
        </div>

        {filteredData.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-500">Geen bevindingen gevonden met de huidige filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredData.map((principle: any) => {
              // Calculate guideline statuses for each guideline
              const guidelinesWithStatus = principle.guidelines.map((guideline: any) => {
                const criteriaStatuses = guideline.criteria.map((c: any) => c.assessment?.status).filter(Boolean);
                const hasFailed = criteriaStatuses.some((s: string) => s === 'failed');
                const hasPassed = criteriaStatuses.some((s: string) => s === 'passed' || s === 'not_present');
                const allFailed = criteriaStatuses.length > 0 && criteriaStatuses.every((s: string) => s === 'failed');
                const allPassed = criteriaStatuses.length > 0 && criteriaStatuses.every((s: string) => s === 'passed' || s === 'not_present');

                let guidelineStatus = 'unknown';
                let guidelineStatusLabel = 'Niet getoetst';
                let guidelineStatusColor = 'bg-blue-100 text-blue-800';

                if (hasFailed && hasPassed) {
                  guidelineStatus = 'partial';
                  guidelineStatusLabel = 'Voldoet gedeeltelijk';
                  guidelineStatusColor = 'bg-orange-100 text-orange-800';
                } else if (allFailed) {
                  guidelineStatus = 'failed';
                  guidelineStatusLabel = 'Voldoet niet';
                  guidelineStatusColor = 'bg-red-100 text-red-800';
                } else if (allPassed) {
                  guidelineStatus = 'passed';
                  guidelineStatusLabel = 'Voldoet';
                  guidelineStatusColor = 'bg-green-100 text-green-800';
                } else if (hasFailed) {
                  guidelineStatus = 'failed';
                  guidelineStatusLabel = 'Voldoet niet';
                  guidelineStatusColor = 'bg-red-100 text-red-800';
                }

                return {
                  ...guideline,
                  guidelineStatusLabel,
                  guidelineStatusColor,
                };
              });

              return (
                <div key={principle.principle} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                  {/* Principle header */}
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-2">
                      {getPrincipleIcon(getDisplayPrincipleName(principle.principleName))}
                      <h2 className="text-2xl font-semibold text-gray-900">
                        {getDisplayPrincipleName(principle.principleName)}
                      </h2>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed mb-6">
                      {getPrincipleDescription(principle.principleName)}
                    </p>
                  </div>

                  {/* Guidelines as details/summary */}
                  {guidelinesWithStatus.map((guideline: any, index: number) => (
                    <details key={guideline.code} className={`group ${index > 0 ? 'mt-10' : ''}`} id={guideline.number} open={expandAllGuidelines}>
                      <summary className="cursor-pointer list-none">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700 text-sm group-open:rotate-90 transition-transform inline-block">
                            ▶
                          </span>
                          <h3 className="text-sm font-medium text-gray-900">
                            {guideline.number} {guideline.title}
                            {guideline.criteria.length > 0 && (
                              <span className="ml-1 text-gray-500">({guideline.criteria.length})</span>
                            )}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${guideline.guidelineStatusColor}`}>
                            {guideline.guidelineStatusLabel}
                          </span>
                        </div>
                      </summary>

                      {/* Guideline panel */}
                      <div className="mt-3 space-y-4">
                        {/* Guideline description */}
                        <p className="text-sm text-gray-700 leading-relaxed ml-6">
                          {guideline.description || guideline.title}
                        </p>

                        {/* Criteria */}
                        <div className="space-y-4">
                          {guideline.criteria.map((criterion: any) => {
                            const borderColor = getCriterionBorderColor(criterion.assessment?.status);
                            return (
                            <div
                              key={criterion.code}
                              id={criterion.code}
                              className="border-2 rounded-lg p-5 bg-white"
                              style={{
                                borderColor: borderColor,
                              }}
                            >
                              {/* Criterion header */}
                              <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2 mb-3">
                                <svg className="w-4 h-4 flex-shrink-0" fill="#000000" viewBox="0 0 492 492">
                                  <path d="M456,247c-2-10-8-15-18-15c-5.333,0-10,2-14,6l-68,64c-1.333,1.334-2.333,2.667-3,4c-3.333,4-4.5,8.667-3.5,14c1,5.334,3.5,9.667,7.5,13c1.333,1.333,3,2.333,5,3l17,6c-8,23.333-22.667,44.333-44,63s-44.333,30.667-69,36V133c13.333-5.335,24.833-14.168,34.5-26.5C310.167,94.166,315,81.333,315,68c0-18.667-6.667-34.667-20-48S265.667,0,247,0s-34.5,6.667-47.5,20S180,49.333,180,68c0,13.333,4.5,26.167,13.5,38.5s19.833,21.167,32.5,26.5v308c-25.333-4.667-48.5-16.333-69.5-35s-35.833-40-44.5-64l18-6c2-0.667,3.667-1.667,5-3c4-3.333,6.5-7.667,7.5-13s-0.167-10-3.5-14c-1.333-2-2.333-3.333-3-4l-68-64c-4-4-8.667-6-14-6c-10,0-16,5-18,15l-15,93v4c0,5.333,1.833,10,5.5,14s8.167,6,13.5,6c2.667,0,4.667-0.333,6-1l16-5c13.333,39.333,36.667,71.5,70,96.5S203.333,492,246,492s80.833-12.5,114.5-37.5s56.833-57.167,69.5-96.5l16,5c1.333,0.667,3.333,1,6,1c5.333,0,9.833-2,13.5-6s5.5-8.667,5.5-14v-4L456,247z M228,87.5c-5.333-5.667-8-12.333-8-20s2.667-14.167,8-19.5s11.833-8,19.5-8s14.167,2.667,19.5,8s8,12,8,20s-2.667,14.667-8,20s-11.833,8-19.5,8S233.333,93.167,228,87.5z"/>
                                </svg>
                                <span>
                                  {guideline.number}.{criterion.number} {criterion.title}
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  {criterion.level}
                                </span>
                              </h4>

                              {/* Criterion description and link */}
                              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                                {criterion.description || criterion.title}
                                <br />
                                {criterion.understandingUrl && (() => {
                                  const dutchUrl = getDutchWCAGUrl(criterion.understandingUrl);
                                  return dutchUrl ? (
                                    <a
                                      href={dutchUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline inline-flex items-center gap-1"
                                    >
                                      {criterion.code} {criterion.title}
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                    </a>
                                  ) : null;
                                })()}
                              </p>

                              {/* Resultaat */}
                              {criterion.assessment && (
                                <div className="mt-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h5 className="text-sm font-semibold text-gray-900">Resultaat</h5>
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${getStatusColor(
                                        criterion.assessment.status
                                      )}`}
                                    >
                                      {getStatusLabel(criterion.assessment.status)}
                                    </span>
                                  </div>
                                  {criterion.assessment.status === 'failed' && (
                                    <p className="text-sm text-gray-700">
                                      De onderzochte steekproef voldoet niet aan dit succescriterium.
                                    </p>
                                  )}
                                  {criterion.assessment.status === 'passed' && (
                                    <p className="text-sm text-gray-700">
                                      De onderzochte steekproef voldoet aan dit succescriterium.
                                    </p>
                                  )}
                                  {criterion.assessment.status === 'not_present' && (
                                    <p className="text-sm text-gray-700">
                                      Geen van de technieken bij dit succescriterium is van toepassing.
                                    </p>
                                  )}

                                  {/* Toelichting */}
                                  {criterion.assessment?.explanation && (
                                    <div className="mt-3">
                                      <button
                                        onClick={() => {
                                          setExpandedExplanations(prev => {
                                            const newSet = new Set(prev);
                                            if (newSet.has(criterion.code)) {
                                              newSet.delete(criterion.code);
                                            } else {
                                              newSet.add(criterion.code);
                                            }
                                            return newSet;
                                          });
                                        }}
                                        className="flex items-center gap-2 text-sm font-medium text-gray-900"
                                      >
                                        <svg
                                          className={`w-4 h-4 transition-transform ${expandedExplanations.has(criterion.code) ? 'rotate-90' : ''}`}
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                        Toelichting
                                      </button>
                                      {expandedExplanations.has(criterion.code) && (
                                        <div
                                          className="mt-2 pl-6 text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none [&_p]:mb-4 [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4"
                                          dangerouslySetInnerHTML={{ __html: criterion.assessment.explanation }}
                                        />
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Gevonden problemen */}
                              {criterion.filteredFindings.length > 0 && (() => {
                                // Split findings into rejected findings and remarks:
                                // echte bevinding = heeft een impact ingevuld
                                // opmerking       = impact is leeg (los van status)
                                const rejectedFindings = criterion.filteredFindings.filter((f: any) => f.impact != null);
                                const remarks = criterion.filteredFindings.filter((f: any) => f.impact == null);

                                if (criterion.code === '1.3.5') {
                                  console.log('Criterion 1.3.5 - Total findings:', criterion.filteredFindings.length);
                                  console.log('Criterion 1.3.5 - Rejected findings:', rejectedFindings.length);
                                  criterion.filteredFindings.forEach((f: any, i: number) => {
                                    console.log(`  Finding ${i + 1}:`, f.findingCode, 'Status:', f.status, 'Occurrences:', f.occurrences?.length);
                                  });
                                }

                                return (
                                  <>
                                    {/* Rejected findings section */}
                                    {rejectedFindings.length > 0 && (
                                      <div className="mt-4 pt-6 border-t border-gray-200">
                                        <h5 className="text-sm font-semibold text-gray-900 mb-3">
                                          Gevonden problemen ({rejectedFindings.length})
                                        </h5>

                                        <div className="space-y-3">
                                          {rejectedFindings.map((finding: any, index: number) => (
                                      <div key={finding.id}>
                                        {index > 0 && <hr className="border-gray-200 my-6" />}
                                        <article className="space-y-3">
                                          {/* Finding title */}
                                          <h6 className="text-sm font-bold text-gray-900">
                                            Bevinding {index + 1} (SC {criterion.code})
                                          </h6>

                                          {/* Badges row */}
                                          <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                                              {criterion.code}
                                            </span>
                                            {finding.status && (
                                              <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                                finding.impact != null && finding.status === 'open' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                              }`}>
                                                {finding.impact != null && finding.status === 'open' ? 'Afgekeurd' : 'Opmerking'}
                                              </span>
                                            )}
                                            {finding.impact && finding.impact !== 'onbekend' && (
                                              <span
                                                className="px-2 py-0.5 text-xs font-medium rounded flex items-center gap-1 border"
                                                style={{
                                                  borderColor: finding.impact === 'klein' ? '#d1d5db' :
                                                              finding.impact === 'matig' ? '#d4a574' :
                                                              finding.impact === 'serieus' ? '#ffa64d' :
                                                              '#ffb3b3',
                                                  color: finding.impact === 'klein' ? '#000000' :
                                                         finding.impact === 'matig' ? '#8b4513' :
                                                         finding.impact === 'serieus' ? '#994d00' :
                                                         '#bb2525'
                                                }}
                                              >
                                                <svg
                                                  className="w-3 h-3"
                                                  fill="currentColor"
                                                  viewBox="0 0 24 24"
                                                  style={{
                                                    color: finding.impact === 'klein' ? '#000000' :
                                                           finding.impact === 'matig' ? '#8b4513' :
                                                           finding.impact === 'serieus' ? '#994d00' :
                                                           '#bb2525'
                                                  }}
                                                >
                                                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                                                </svg>
                                                {finding.impact}
                                              </span>
                                            )}
                                            {finding.responsibility && finding.responsibility !== 'onbekend' && (
                                              <span
                                                className="px-2 py-0.5 text-xs font-medium rounded border bg-white"
                                                style={{
                                                  borderColor: '#d1d5db',
                                                  color: '#000000'
                                                }}
                                              >
                                                {finding.responsibility}
                                              </span>
                                            )}
                                          </div>

                                          {/* Sample Items (Steekproef) */}
                                          {finding.occurrences && finding.occurrences.length > 0 && (
                                            <div className="text-sm text-gray-700">
                                              {console.log('Finding:', finding.findingCode, 'Occurrences:', finding.occurrences.length)}
                                              {finding.occurrences.length >= 2 ? (
                                                <ul
                                                  className="occurrence-list-with-bullets space-y-1"
                                                  style={{
                                                    listStyleType: 'disc',
                                                    listStylePosition: 'outside',
                                                    paddingLeft: '2rem',
                                                    display: 'block'
                                                  }}
                                                >
                                                  {finding.occurrences.map((occurrence: any) => (
                                                    <li
                                                      key={occurrence.id}
                                                      style={{
                                                        display: 'list-item',
                                                        listStyleType: 'disc',
                                                        listStylePosition: 'outside'
                                                      }}
                                                    >

                                                      {occurrence.sampleItem?.title && (
                                                        <span className="font-medium">{occurrence.sampleItem.title}</span>
                                                      )}
                                                      {occurrence.sampleItem?.url && (
                                                        <>
                                                          {occurrence.sampleItem?.title && ' - '}
                                                          <a
                                                            href={occurrence.sampleItem.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:text-blue-800 underline break-all"
                                                          >
                                                            {occurrence.sampleItem.url}
                                                          </a>
                                                        </>
                                                      )}
                                                    </li>
                                                  ))}
                                                </ul>
                                              ) : (
                                                <div className="space-y-1">
                                                  {finding.occurrences.map((occurrence: any) => (
                                                    <div key={occurrence.id}>
                                                      {occurrence.sampleItem?.title && (
                                                        <div className="font-medium">{occurrence.sampleItem.title}</div>
                                                      )}
                                                      {occurrence.sampleItem?.url && (
                                                        <a
                                                          href={occurrence.sampleItem.url}
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800"
                                                        >
                                                          <span className="underline break-all">{occurrence.sampleItem.url}</span>
                                                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                          </svg>
                                                        </a>
                                                      )}
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          )}

                                          {/* Description */}
                                          <div className="text-sm text-gray-700 leading-relaxed finding-description">
                                            {renderAdvice(finding.description)}
                                          </div>

                                          {/* Advies section */}
                                          <div>
                                            <button
                                              onClick={() => setExpandedAdvice(
                                                expandedAdvice === finding.id ? null : finding.id
                                              )}
                                              className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2"
                                            >
                                              <svg
                                                className={`w-4 h-4 transition-transform ${(expandedAdvice === finding.id || expandedAdvice === 'all') ? 'rotate-90' : ''}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                              >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                              </svg>
                                              Advies
                                            </button>
                                            {(expandedAdvice === finding.id || expandedAdvice === 'all') && (
                                              <div className="pl-6">
                                                {renderAdvice(finding.advice)}
                                              </div>
                                            )}
                                          </div>

                                          {/* Attachments count */}
                                          {finding.evidence && (() => {
                                            try {
                                              const evidenceData = JSON.parse(finding.evidence);
                                              const attachmentCount = Array.isArray(evidenceData) ? evidenceData.length : 0;
                                              if (attachmentCount > 0) {
                                                return (
                                                  <div className="flex items-center gap-2 pt-3">
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                      </svg>
                                                      <span>bijlage ({attachmentCount})</span>
                                                    </span>
                                                  </div>
                                                );
                                              }
                                            } catch (e) {
                                              return null;
                                            }
                                            return null;
                                          })()}

                                          {/* Afbeeldingen section */}
                                          {finding.evidence && (() => {
                                            try {
                                              const evidenceData = JSON.parse(finding.evidence);
                                              if (Array.isArray(evidenceData) && evidenceData.length > 0) {
                                                return (
                                                  <div>
                                                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Afbeeldingen</h4>
                                                    <div className="space-y-3">
                                                      {evidenceData.map((item: any, idx: number) => (
                                                        <div key={idx} className="relative">
                                                          <div className="border border-gray-200 rounded-lg overflow-hidden mb-2 inline-block">
                                                            {item.type?.startsWith('image/') ? (
                                                              <div
                                                                className="relative cursor-pointer inline-block"
                                                                onMouseEnter={() => setHoveredImage(item.url)}
                                                                onMouseLeave={() => setHoveredImage(null)}
                                                                onMouseDown={(e) => {
                                                                  e.preventDefault();
                                                                  e.stopPropagation();
                                                                  setLightboxImage({ url: item.url, caption: item.caption || item.filename });
                                                                }}
                                                              >
                                                                <img
                                                                  src={item.url}
                                                                  alt={item.caption || item.filename}
                                                                  className="max-w-xs max-h-48 object-contain block"
                                                                />
                                                                <div className={`absolute inset-0 bg-black transition-all duration-200 flex items-center justify-center pointer-events-none ${hoveredImage === item.url ? 'bg-opacity-40' : 'bg-opacity-0'}`}>
                                                                  <div className={`transition-opacity duration-200 flex flex-col items-center gap-2 text-white ${hoveredImage === item.url ? 'opacity-100' : 'opacity-0'}`}>
                                                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                                    </svg>
                                                                    <span className="text-sm font-medium">Open grotere weergave</span>
                                                                  </div>
                                                                </div>
                                                              </div>
                                                            ) : (
                                                              <div className="bg-gray-50 p-4 flex items-center gap-2">
                                                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                                </svg>
                                                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                                                  {item.filename}
                                                                </a>
                                                              </div>
                                                            )}
                                                          </div>
                                                          <p className="text-xs text-gray-600">{item.caption || 'Screenshot'}</p>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  </div>
                                                );
                                              }
                                            } catch (e) {
                                              return null;
                                            }
                                            return null;
                                          })()}
                                        </article>
                                      </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Remarks section */}
                                    {remarks.length > 0 && (
                                      <div className="mt-4 pt-6 border-t border-gray-200">
                                        <h5 className="text-sm font-semibold text-gray-900 mb-2">
                                          Overige opmerkingen ({remarks.length})
                                        </h5>
                                        <p className="text-sm text-gray-600 mb-3 italic">
                                          Onderstaande opmerkingen leiden niet tot een afkeuring, maar kunnen de toegankelijkheid of gebruiksvriendelijkheid verbeteren.
                                        </p>

                                        <div className="space-y-3">
                                          {remarks.map((finding: any, index: number) => (
                                            <div key={finding.id}>
                                              {index > 0 && <hr className="border-gray-200 my-6" />}
                                              <article className="space-y-3">
                                                {/* Finding title */}
                                                <h6 className="text-sm font-bold text-gray-900">
                                                  Opmerking {index + 1} (SC {criterion.code})
                                                </h6>

                                                {/* Badges row */}
                                                <div className="flex items-center gap-2">
                                                  <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                                                    {criterion.code}
                                                  </span>
                                                  {finding.status && (
                                                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                                      finding.status === 'open' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                      {finding.status === 'open' ? 'Afgekeurd' : 'Opmerking'}
                                                    </span>
                                                  )}
                                                  {finding.impact && finding.impact !== 'onbekend' && (
                                                    <span
                                                      className="px-2 py-0.5 text-xs font-medium rounded flex items-center gap-1 border"
                                                      style={{
                                                        borderColor: finding.impact === 'klein' ? '#d1d5db' :
                                                                    finding.impact === 'matig' ? '#d4a574' :
                                                                    finding.impact === 'serieus' ? '#ffa64d' :
                                                                    '#ffb3b3',
                                                        color: finding.impact === 'klein' ? '#000000' :
                                                               finding.impact === 'matig' ? '#8b4513' :
                                                               finding.impact === 'serieus' ? '#994d00' :
                                                               '#bb2525'
                                                      }}
                                                    >
                                                      <svg
                                                        className="w-3 h-3"
                                                        fill="currentColor"
                                                        viewBox="0 0 24 24"
                                                        style={{
                                                          color: finding.impact === 'klein' ? '#000000' :
                                                                 finding.impact === 'matig' ? '#8b4513' :
                                                                 finding.impact === 'serieus' ? '#994d00' :
                                                                 '#bb2525'
                                                        }}
                                                      >
                                                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                                                      </svg>
                                                      {finding.impact}
                                                    </span>
                                                  )}
                                                  {finding.responsibility && finding.responsibility !== 'onbekend' && (
                                                    <span
                                                      className="px-2 py-0.5 text-xs font-medium rounded border bg-white"
                                                      style={{
                                                        borderColor: '#d1d5db',
                                                        color: '#000000'
                                                      }}
                                                    >
                                                      {finding.responsibility}
                                                    </span>
                                                  )}
                                                </div>

                                                {/* Sample Items (Steekproef) */}
                                                {finding.occurrences && finding.occurrences.length > 0 && (
                                                  <div className="text-sm text-gray-700">
                                                    {finding.occurrences.length >= 2 ? (
                                                      <ul className="list-disc list-inside space-y-1">
                                                        {finding.occurrences.map((occurrence: any) => (
                                                          <li key={occurrence.id}>
                                                            {occurrence.sampleItem?.title && (
                                                              <span className="font-medium">{occurrence.sampleItem.title}</span>
                                                            )}
                                                            {occurrence.sampleItem?.url && (
                                                              <>
                                                                {occurrence.sampleItem?.title && ' - '}
                                                                <a
                                                                  href={occurrence.sampleItem.url}
                                                                  target="_blank"
                                                                  rel="noopener noreferrer"
                                                                  className="text-blue-600 hover:text-blue-800 underline break-all"
                                                                >
                                                                  {occurrence.sampleItem.url}
                                                                </a>
                                                              </>
                                                            )}
                                                          </li>
                                                        ))}
                                                      </ul>
                                                    ) : (
                                                      <div className="space-y-1">
                                                        {finding.occurrences.map((occurrence: any) => (
                                                          <div key={occurrence.id}>
                                                            {occurrence.sampleItem?.title && (
                                                              <div className="font-medium">{occurrence.sampleItem.title}</div>
                                                            )}
                                                            {occurrence.sampleItem?.url && (
                                                              <a
                                                                href={occurrence.sampleItem.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800"
                                                              >
                                                                <span className="underline break-all">{occurrence.sampleItem.url}</span>
                                                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                </svg>
                                                              </a>
                                                            )}
                                                          </div>
                                                        ))}
                                                      </div>
                                                    )}
                                                  </div>
                                                )}

                                                {/* Description */}
                                                <div className="text-sm text-gray-700 leading-relaxed finding-description">
                                                  {renderAdvice(finding.description)}
                                                </div>

                                                {/* Advies section */}
                                                <div>
                                                  <button
                                                    onClick={() => setExpandedAdvice(
                                                      expandedAdvice === finding.id ? null : finding.id
                                                    )}
                                                    className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2"
                                                  >
                                                    <svg
                                                      className={`w-4 h-4 transition-transform ${(expandedAdvice === finding.id || expandedAdvice === 'all') ? 'rotate-90' : ''}`}
                                                      fill="none"
                                                      stroke="currentColor"
                                                      viewBox="0 0 24 24"
                                                    >
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                    Advies
                                                  </button>
                                                  {(expandedAdvice === finding.id || expandedAdvice === 'all') && (
                                                    <div className="pl-6">
                                                      {renderAdvice(finding.advice)}
                                                    </div>
                                                  )}
                                                </div>

                                                {/* Attachments count */}
                                                {finding.evidence && (() => {
                                                  try {
                                                    const evidenceData = JSON.parse(finding.evidence);
                                                    const attachmentCount = Array.isArray(evidenceData) ? evidenceData.length : 0;
                                                    if (attachmentCount > 0) {
                                                      return (
                                                        <div className="flex items-center gap-2 pt-3">
                                                          <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                            </svg>
                                                            <span>bijlage ({attachmentCount})</span>
                                                          </span>
                                                        </div>
                                                      );
                                                    }
                                                  } catch (e) {
                                                    return null;
                                                  }
                                                  return null;
                                                })()}

                                                {/* Afbeeldingen section */}
                                                {finding.evidence && (() => {
                                                  try {
                                                    const evidenceData = JSON.parse(finding.evidence);
                                                    if (Array.isArray(evidenceData) && evidenceData.length > 0) {
                                                      return (
                                                        <div>
                                                          <h4 className="text-sm font-semibold text-gray-900 mb-3">Afbeeldingen</h4>
                                                          <div className="space-y-3">
                                                            {evidenceData.map((item: any, idx: number) => (
                                                              <div key={idx} className="relative">
                                                                <div className="border border-gray-200 rounded-lg overflow-hidden mb-2 inline-block">
                                                                  {item.type?.startsWith('image/') ? (
                                                                    <div
                                                                      className="relative cursor-pointer inline-block"
                                                                      onMouseEnter={() => setHoveredImage(item.url)}
                                                                      onMouseLeave={() => setHoveredImage(null)}
                                                                      onMouseDown={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        setLightboxImage({ url: item.url, caption: item.caption || item.filename });
                                                                      }}
                                                                    >
                                                                      <img
                                                                        src={item.url}
                                                                        alt={item.caption || item.filename}
                                                                        className="max-w-xs max-h-48 object-contain block"
                                                                      />
                                                                      <div className={`absolute inset-0 bg-black transition-all duration-200 flex items-center justify-center pointer-events-none ${hoveredImage === item.url ? 'bg-opacity-40' : 'bg-opacity-0'}`}>
                                                                        <div className={`transition-opacity duration-200 flex flex-col items-center gap-2 text-white ${hoveredImage === item.url ? 'opacity-100' : 'opacity-0'}`}>
                                                                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                                          </svg>
                                                                          <span className="text-sm font-medium">Open grotere weergave</span>
                                                                        </div>
                                                                      </div>
                                                                    </div>
                                                                  ) : (
                                                                    <div className="bg-gray-50 p-4 flex items-center gap-2">
                                                                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                                      </svg>
                                                                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                                                        {item.filename}
                                                                      </a>
                                                                    </div>
                                                                  )}
                                                                </div>
                                                                <p className="text-xs text-gray-600">{item.caption || 'Screenshot'}</p>
                                                              </div>
                                                            ))}
                                                          </div>
                                                        </div>
                                                      );
                                                    }
                                                  } catch (e) {
                                                    return null;
                                                  }
                                                  return null;
                                                })()}
                                              </article>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                            );
                          })}
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sidebar filters */}
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Filter bevindingen (36)
          </h3>

          {/* Search */}
          <div className="mb-3">
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Zoeken"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-purple-400"
            />
          </div>

          {/* Steekproef filter */}
          <div className="mb-3">
            <label htmlFor="steekproef" className="block text-xs text-gray-600 mb-1">
              Steekproef
            </label>
            <select
              id="steekproef"
              value={sampleItemFilter}
              onChange={(e) => setSampleItemFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-purple-400 bg-white"
            >
              <option value="all"></option>
              {sampleItems.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          {/* Criterium filter */}
          <div className="mb-3">
            <label htmlFor="criterium" className="block text-xs text-gray-600 mb-1">
              Criterium
            </label>
            <select
              id="criterium"
              value={criteriumFilter}
              onChange={(e) => setCriteriumFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-purple-400 bg-white"
            >
              <option value="all"></option>
            </select>
          </div>

          {/* Status and Verantwoordelijkheid row */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label htmlFor="status" className="block text-xs text-gray-600 mb-1">
                Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-purple-400 bg-white"
              >
                <option value="all"></option>
                <option value="open">Open</option>
                <option value="published">Gepubliceerd</option>
                <option value="resolved">Opgelost</option>
              </select>
            </div>
            <div>
              <label htmlFor="responsibility" className="block text-xs text-gray-600 mb-1">
                Verantwoordelijkheid
              </label>
              <select
                id="responsibility"
                value={responsibilityFilter}
                onChange={(e) => setResponsibilityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-purple-400 bg-white"
              >
                <option value="all"></option>
              </select>
            </div>
          </div>

          {/* Impact filter */}
          <div className="mb-3">
            <label htmlFor="impact" className="block text-xs text-gray-600 mb-1">
              Impact
            </label>
            <select
              id="impact"
              value={impactFilter}
              onChange={(e) => setImpactFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-purple-400 bg-white"
            >
              <option value="all"></option>
              <option value="kritiek">Kritiek</option>
              <option value="serieus">Serieus</option>
              <option value="matig">Matig</option>
              <option value="klein">Klein</option>
            </select>
          </div>

          {/* Opgelost filter */}
          <div className="mb-4">
            <label htmlFor="resolved" className="block text-xs text-gray-600 mb-1">
              Opgelost
            </label>
            <select
              id="resolved"
              value={resolvedFilter}
              onChange={(e) => setResolvedFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-purple-400 bg-white"
            >
              <option value="all"></option>
            </select>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => {
                // Apply filters (in this case, filters are already applied via state)
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-medium transition-colors"
            >
              Toepassen
            </button>
            <button
              onClick={() => {
                setSearchTerm('');
                setSampleItemFilter('all');
                setCriteriumFilter('all');
                setStatusFilter('all');
                setResponsibilityFilter('all');
                setImpactFilter('all');
                setResolvedFilter('all');
              }}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm font-medium transition-colors"
            >
              Resetten
            </button>
          </div>

          {/* Toggle switches */}
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={flatReport}
                  onChange={(e) => setFlatReport(e.target.checked)}
                  className="sr-only"
                />
                <div className={`block w-10 h-6 rounded-full transition ${flatReport ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${flatReport ? 'translate-x-4' : ''}`}></div>
              </div>
              <span className="ml-3 text-sm text-purple-600">Platte rapportweergave</span>
            </label>

            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={hideEmptyCriteria}
                  onChange={(e) => setHideEmptyCriteria(e.target.checked)}
                  className="sr-only"
                />
                <div className={`block w-10 h-6 rounded-full transition ${hideEmptyCriteria ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${hideEmptyCriteria ? 'translate-x-4' : ''}`}></div>
              </div>
              <span className="ml-3 text-sm text-purple-600">Verberg criteria zonder bevindingen</span>
            </label>

            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={expandAllGuidelines}
                  onChange={(e) => setExpandAllGuidelines(e.target.checked)}
                  className="sr-only"
                />
                <div className={`block w-10 h-6 rounded-full transition ${expandAllGuidelines ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${expandAllGuidelines ? 'translate-x-4' : ''}`}></div>
              </div>
              <span className="ml-3 text-sm text-purple-600">Alle richtlijnen uitklappen</span>
            </label>
          </div>
        </div>
      </div>

      {/* Lightbox Modal via Portal */}
      {lightboxImage && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {/* Close button */}
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
              aria-label="Sluiten"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image */}
            <img
              src={lightboxImage.url}
              alt={lightboxImage.caption}
              style={{ width: '80vw', height: '80vh', objectFit: 'contain' }}
              onClick={(e) => e.stopPropagation()}
            />

            {/* Caption */}
            {lightboxImage.caption && (
              <p className="mt-4 text-white text-center text-sm absolute bottom-8">{lightboxImage.caption}</p>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}