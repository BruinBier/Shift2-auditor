'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getAvailableTests } from '@/lib/crawler/tests';
import 'md-editor-rt/lib/style.css';
import { formatMultipleSameLinksReport } from '@/lib/formatter/multiple-same-links-formatter';
import { formatLinkMissingHrefReport } from '@/lib/formatter/link-missing-href-formatter';
import { formatImgMissingAltReport } from '@/lib/formatter/img-missing-alt-formatter';
import { formatImgAltTooShortReport } from '@/lib/formatter/img-alt-too-short-formatter';
import { formatAriaLandmarksReport } from '@/lib/formatter/aria-landmarks-formatter';
import { formatHCaptchaReport } from '@/lib/formatter/hcaptcha-formatter';
import { getTestDocumentation, hasTestDocumentation } from '@/lib/crawler/test-documentation';
import { marked } from 'marked';

// Configure marked to use synchronous mode
marked.use({ async: false });

const MdEditor = dynamic(() => import('md-editor-rt').then(mod => mod.MdEditor), {
  ssr: false,
  loading: () => <div className="border border-blue-300 rounded-lg p-4 text-blue-700">Editor laden...</div>
});

export default function CrawlerTestsPage() {
  const [url, setUrl] = useState('');
  const [html, setHtml] = useState('');
  const [selectedTest, setSelectedTest] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [allResults, setAllResults] = useState<any>(null);
  const [error, setError] = useState('');
  const [runMode, setRunMode] = useState<'single' | 'all'>('single');
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showExtendedInfo, setShowExtendedInfo] = useState(false);
  const [isEditingDocs, setIsEditingDocs] = useState(false);
  const [editedDocumentation, setEditedDocumentation] = useState('');
  const [isSavingDocs, setIsSavingDocs] = useState(false);
  const [showBeheerMenu, setShowBeheerMenu] = useState(false);
  const [showBevindingenMenu, setShowBevindingenMenu] = useState(false);

  const availableTests = getAvailableTests();

  // Close dropdown menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.beheer-button') && !target.closest('.beheer-menu')) {
        setShowBeheerMenu(false);
      }
      if (!target.closest('.bevindingen-button') && !target.closest('.bevindingen-menu')) {
        setShowBevindingenMenu(false);
      }
    };

    if (showBeheerMenu || showBevindingenMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBeheerMenu, showBevindingenMenu]);

  const handleRunSingleTest = async () => {
    if (!selectedTest) {
      setError('Selecteer eerst een test');
      return;
    }

    if (!url && !html) {
      setError('Voer een URL in of plak HTML');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);
    setAllResults(null);

    try {
      const response = await fetch('/api/extra/run-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url || undefined,
          html: html || undefined,
          testName: selectedTest,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Er ging iets mis');
      }

      setResult(data.result);
    } catch (err) {
      console.error('Error running test:', err);
      setError(err instanceof Error ? err.message : 'Er ging iets mis');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunAllTests = async () => {
    if (!url && !html) {
      setError('Voer een URL in of plak HTML');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);
    setAllResults(null);

    try {
      const response = await fetch('/api/extra/run-all-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url || undefined,
          html: html || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Er ging iets mis');
      }

      setAllResults(data);
    } catch (err) {
      console.error('Error running all tests:', err);
      setError(err instanceof Error ? err.message : 'Er ging iets mis');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleResultExpanded = (testId: string) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(testId)) {
      newExpanded.delete(testId);
    } else {
      newExpanded.add(testId);
    }
    setExpandedResults(newExpanded);
  };

  const handleGenerateAISummary = async () => {
    if (!allResults) return;

    setIsGeneratingAI(true);

    // Generate summary without AI - just with code
    const foundIssues = allResults.results.filter((r: any) => r.found);

    // Categorize by severity
    const critical = foundIssues.filter((r: any) => r.details?.critical === true);
    const serious = foundIssues.filter((r: any) =>
      r.details?.classification?.includes('serieus') ||
      (!r.details?.critical && !r.details?.informational)
    );
    const informational = foundIssues.filter((r: any) => r.details?.informational === true);

    // Build summary text
    let summary = `# Toegankelijkheidsaudit Samenvatting\n\n`;
    summary += `**URL:** ${allResults.testedUrl || 'Niet opgegeven'}\n`;
    summary += `**Datum:** ${new Date().toLocaleDateString('nl-NL')}\n\n`;

    summary += `## Overzicht\n\n`;
    summary += `- **Totaal aantal tests:** ${allResults.summary.totalTests}\n`;
    summary += `- **Gevonden problemen:** ${foundIssues.length}\n`;
    summary += `- **Kritieke issues:** ${critical.length}\n`;
    summary += `- **Serieuze issues:** ${serious.length}\n`;
    summary += `- **Informatieve issues:** ${informational.length}\n\n`;

    // Helper function to extract and format location info
    const getLocationSummary = (issue: any) => {
      if (!issue.details?.issues || !Array.isArray(issue.details.issues)) {
        return null;
      }

      const locationCounts = new Map<string, number>();
      issue.details.issues.forEach((item: any) => {
        if (item.location) {
          locationCounts.set(item.location, (locationCounts.get(item.location) || 0) + 1);
        }
      });

      if (locationCounts.size === 0) return null;

      const locationNames: Record<string, string> = {
        'header': 'Header',
        'nav': 'Navigatie',
        'main': 'Hoofdinhoud',
        'article': 'Artikel',
        'aside': 'Zijbalk',
        'footer': 'Footer',
        'body': 'Body (geen specifieke sectie)'
      };

      return Array.from(locationCounts.entries())
        .map(([loc, count]) => `${locationNames[loc] || loc} (${count}x)`)
        .join(', ');
    };

    // Critical issues
    if (critical.length > 0) {
      summary += `## 🔴 Kritieke Issues (${critical.length})\n\n`;
      critical.forEach((issue: any, i: number) => {
        summary += `### ${i + 1}. ${issue.testName}\n`;
        summary += `- **Test ID:** ${issue.testId}\n`;
        summary += `- **Aantal voorkomens:** ${issue.count}\n`;

        const locations = getLocationSummary(issue);
        if (locations) {
          summary += `- **📍 Waar op de pagina:** ${locations}\n`;
        }

        if (issue.details?.wcagLevel) {
          summary += `- **WCAG Level:** ${issue.details.wcagLevel}\n`;
        }
        if (issue.details?.wcagCriteria) {
          summary += `- **WCAG Criteria:** ${issue.details.wcagCriteria.join(', ')}\n`;
        }
        summary += `\n`;
      });
    }

    // Serious issues
    if (serious.length > 0) {
      summary += `## 🟠 Serieuze Issues (${serious.length})\n\n`;
      serious.forEach((issue: any, i: number) => {
        summary += `### ${i + 1}. ${issue.testName}\n`;
        summary += `- **Test ID:** ${issue.testId}\n`;
        summary += `- **Aantal voorkomens:** ${issue.count}\n`;

        const locations = getLocationSummary(issue);
        if (locations) {
          summary += `- **📍 Waar op de pagina:** ${locations}\n`;
        }

        if (issue.details?.wcagLevel) {
          summary += `- **WCAG Level:** ${issue.details.wcagLevel}\n`;
        }
        if (issue.details?.wcagCriteria) {
          summary += `- **WCAG Criteria:** ${issue.details.wcagCriteria.join(', ')}\n`;
        }
        summary += `\n`;
      });
    }

    // Informational issues
    if (informational.length > 0) {
      summary += `## 🔵 Informatieve Issues (${informational.length})\n\n`;
      informational.forEach((issue: any, i: number) => {
        summary += `### ${i + 1}. ${issue.testName}\n`;
        summary += `- **Test ID:** ${issue.testId}\n`;
        summary += `- **Aantal voorkomens:** ${issue.count}\n`;

        const locations = getLocationSummary(issue);
        if (locations) {
          summary += `- **📍 Waar op de pagina:** ${locations}\n`;
        }

        summary += `\n`;
      });
    }

    // Priority list
    summary += `## Prioriteiten voor Oplossing\n\n`;
    if (critical.length > 0) {
      summary += `**1. Kritieke issues eerst oplossen:**\n`;
      critical.slice(0, 5).forEach((issue: any) => {
        summary += `   - ${issue.testName} (${issue.count}x)\n`;
      });
      summary += `\n`;
    }
    if (serious.length > 0) {
      summary += `**2. Serieuze issues daarna:**\n`;
      serious.slice(0, 5).forEach((issue: any) => {
        summary += `   - ${issue.testName} (${issue.count}x)\n`;
      });
      summary += `\n`;
    }
    if (informational.length > 0) {
      summary += `**3. Informatieve issues als laatste:**\n`;
      informational.slice(0, 3).forEach((issue: any) => {
        summary += `   - ${issue.testName} (${issue.count}x)\n`;
      });
    }

    setAiSummary(summary);
    setIsGeneratingAI(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleEditDocs = () => {
    const currentDocs = getTestDocumentation(selectedTest) || '';
    setEditedDocumentation(currentDocs);
    setIsEditingDocs(true);
  };

  const handleSaveDocs = async () => {
    setIsSavingDocs(true);
    try {
      const response = await fetch('/api/tests/documentation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testName: selectedTest,
          documentation: editedDocumentation,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save documentation');
      }

      // Exit edit mode - documentation is saved
      setIsEditingDocs(false);
    } catch (err) {
      console.error('Error saving documentation:', err);
      alert('Er ging iets mis bij het opslaan. Probeer het opnieuw.');
    } finally {
      setIsSavingDocs(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingDocs(false);
    setEditedDocumentation('');
  };

  // Helper function to get test description
  const getTestDescription = (testName: string): string => {
    const descriptions: Record<string, string> = {
      'ImgMissingAltTest': 'Controleert of afbeeldingen een alt-attribuut hebben. Afbeeldingen zonder alt-attribuut zijn ontoegankelijk voor schermlezers. Let op: een leeg alt-attribuut (alt="") is wel toegestaan voor decoratieve afbeeldingen.',
      'LangAttributeMissingTest': 'Controleert of het HTML-element een lang-attribuut heeft. Dit helpt schermlezers de juiste uitspraak en taal te gebruiken.',
      'TitleMissingTest': 'Controleert of de pagina een <title> element heeft. De titel helpt gebruikers te begrijpen waar ze zijn en is belangrijk voor navigatie.',
      'TitleEmptyTest': 'Controleert of de paginatitel leeg is. Een lege titel biedt geen context over de pagina-inhoud.',
      'ImgAltTooShortTest': 'Controleert of alt-teksten van afbeeldingen te kort zijn (1-3 tekens). Te korte alt-teksten zijn vaak niet beschrijvend genoeg.',
      'LinkMissingHrefTest': 'Controleert of links een werkende href hebben. Links zonder href of met placeholders zoals "#" zijn niet functioneel.',
      'FormMissingLabelsTest': 'Controleert of formulieren labels hebben voor invoervelden. Labels zijn essentieel voor gebruikers met schermlezers.',
      'HeadingsAtLeastOneH1Test': 'Controleert of de pagina tenminste één H1-heading heeft. Een H1 geeft de hoofdstructuur van de pagina aan.',
      'IframeMissingAccessibleNameTest': 'Controleert of iframes een title-attribuut hebben. Dit helpt gebruikers te begrijpen wat het iframe bevat.',
      'PageContainsMultipleSameLinksTest': 'Controleert of dezelfde URL meerdere keren voorkomt met verschillende linkteksten. Dit kan verwarrend zijn voor gebruikers.',
      'ViewportMetaRestrictsScalingTest': 'Controleert of de viewport scaling beperkt is. Dit kan problemen veroorzaken voor gebruikers die willen inzoomen.',
      'HeadingEmptyTest': 'Controleert of er lege headings zijn. Lege headings hebben geen waarde voor gebruikers.',
      'HeadingSkipLevelTest': 'Controleert of heading-niveaus worden overgeslagen (bijv. van H1 naar H3). Dit verstoort de logische structuur.',
      'ButtonEmptyTest': 'Controleert of knoppen leeg zijn. Knoppen zonder tekst of aria-label zijn niet bruikbaar.',
      'InputMissingLabelTest': 'Controleert of invoervelden een label hebben. Zonder label weten gebruikers niet wat ze moeten invullen.',
      'LinkWithoutTextTest': 'Controleert of links zichtbare tekst hebben. Links zonder tekst zijn niet begrijpelijk.',
      'EmptyLinkTest': 'Controleert of er volledig lege links zijn. Deze zijn nutteloos en verwarrend.',
      'TableWithoutHeadersTest': 'Controleert of tabellen <th> elementen hebben. Headers helpen bij het begrijpen van tabelstructuur.',
      'IframeIsYouTubeVideoWithKeysDisabledTest': 'Controleert of YouTube video\'s toetsenbord navigatie hebben uitgeschakeld. Dit blokkeert toetsenbordgebruikers.',
      'IframeIsVimeoVideoWithKeysDisabledTest': 'Controleert of Vimeo video\'s toetsenbord navigatie hebben uitgeschakeld.',
      'AriaLandmarksTest': 'Controleert of de pagina juiste en herkenbare ARIA-landmarks bevat, zodat gebruikers van screenreaders en toetsenbord snel kunnen navigeren door de structuur van de pagina. De test controleert onder andere: of belangrijke gebieden zoals navigatie, hoofdinhoud en header als landmark zijn gemarkeerd; of meerdere landmarks van hetzelfde type (bijv. meerdere navigaties) een unieke toegankelijke naam hebben; of ARIA-rollen correct en geldig worden gebruikt. Ontbrekende, dubbele of niet-onderscheidbare landmarks maken het voor gebruikers lastig om herhalende content te omzeilen of snel naar het juiste paginadeel te springen.',
      'IframeIsHCaptchaTest': 'Controleert of hCaptcha-iframes (vaak gebruikt voor anti-spam verificatie) toegankelijk zijn voor alle gebruikers. De test detecteert hCaptcha-elementen en valideert of ze: een betekenisvol title-attribuut hebben (zoals "hCaptcha verificatie" of "Spam bescherming"), bereikbaar zijn met het toetsenbord (geen tabindex="-1" of aria-hidden="true"), en correct geïmplementeerd zijn volgens SIA-richtlijnen. Ontoegankelijke captchas kunnen gebruikers met een beperking volledig blokkeren van het gebruik van een website.',
    };
    return descriptions[testName] || 'Test controleert op specifieke toegankelijkheidsproblemen. Bekijk de test resultaten voor meer details.';
  };

  // Helper function to get test metadata
  const getTestMetadata = (testName: string): { wcagLevel?: string; critical?: boolean; serious?: boolean; informational?: boolean } | null => {
    const metadata: Record<string, { wcagLevel?: string; critical?: boolean; serious?: boolean; informational?: boolean }> = {
      'ImgMissingAltTest': { informational: true }, // Dynamisch: informatief als geen issues, kritiek (WCAG A) als wel issues
      'LangAttributeMissingTest': { wcagLevel: 'A', critical: true },
      'TitleMissingTest': { wcagLevel: 'A', critical: true },
      'TitleEmptyTest': { wcagLevel: 'A', critical: true },
      'ImgAltTooShortTest': { wcagLevel: 'A' },
      'LinkMissingHrefTest': { wcagLevel: 'A', critical: true },
      'FormMissingLabelsTest': { wcagLevel: 'A', critical: true },
      'HeadingsAtLeastOneH1Test': { wcagLevel: 'A', critical: true },
      'IframeMissingAccessibleNameTest': { wcagLevel: 'A', critical: true },
      'PageContainsMultipleSameLinksTest': { informational: true },
      'ViewportMetaRestrictsScalingTest': { wcagLevel: 'AA' },
      'HeadingEmptyTest': { wcagLevel: 'A', critical: true },
      'HeadingSkipLevelTest': { wcagLevel: 'AA' },
      'ButtonEmptyTest': { wcagLevel: 'A', critical: true },
      'InputMissingLabelTest': { wcagLevel: 'A', critical: true },
      'LinkWithoutTextTest': { wcagLevel: 'A', critical: true },
      'EmptyLinkTest': { wcagLevel: 'A', critical: true },
      'TableWithoutHeadersTest': { wcagLevel: 'A', critical: true },
      'IframeIsYouTubeVideoWithKeysDisabledTest': { wcagLevel: 'A', critical: true },
      'IframeIsVimeoVideoWithKeysDisabledTest': { wcagLevel: 'A', critical: true },
      'AriaLandmarksTest': { informational: true }, // Dynamisch: informatief als geen issues, serieus (WCAG A) als wel issues
      'IframeIsHCaptchaTest': { informational: true }, // Dynamisch: informatief als geen issues, kritiek (WCAG A) als wel issues
      'TableTest': { informational: true },
      'FormTest': { informational: true },
      'ImgTest': { informational: true },
      'IframeTest': { informational: true },
      'VideoTest': { informational: true },
      'AudioTest': { informational: true },
    };
    return metadata[testName] || null;
  };

  return (
    <>
      {/* Navigation Header */}
      <header className="border-b border-gray-200" style={{ backgroundColor: '#290047' }}>
        <div className="max-w-[1400px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/admin">
              <img
                src="/shift2-logo.svg"
                alt="Shift2"
                className="h-8"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </Link>
            <nav className="flex gap-8 text-sm">
              <Link
                href="/admin"
                className="flex items-center gap-2 text-white hover:text-gray-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </Link>
              <Link
                href="/onderzoeken"
                className="flex items-center gap-2 text-white hover:text-gray-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Onderzoeken
              </Link>
              <div className="relative">
                <button
                  onClick={() => setShowBevindingenMenu(!showBevindingenMenu)}
                  className="bevindingen-button flex items-center gap-2 text-white hover:text-gray-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Bevindingen
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showBevindingenMenu && (
                  <div className="bevindingen-menu absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <Link
                      href="/admin/bevindingen-zoeken"
                      onClick={() => setShowBevindingenMenu(false)}
                      className="bevindingen-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Bevindingen zoeken
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </Link>
                    <Link
                      href="/admin/snelle-bevindingen"
                      onClick={() => setShowBevindingenMenu(false)}
                      className="bevindingen-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Snelle bevindingen
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowBeheerMenu(!showBeheerMenu)}
                  className="beheer-button flex items-center gap-2 text-white hover:text-gray-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Beheer
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showBeheerMenu && (
                  <div className="beheer-menu absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <Link
                      href="/admin/onderzoekstypen"
                      onClick={() => setShowBeheerMenu(false)}
                      className="beheer-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Onderzoekstypen
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </Link>
                    <Link
                      href="/admin/projecten"
                      onClick={() => setShowBeheerMenu(false)}
                      className="beheer-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Projecten
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </Link>
                    <Link
                      href="/admin/opdrachtgevers"
                      onClick={() => setShowBeheerMenu(false)}
                      className="beheer-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Opdrachtgevers
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </Link>
                    <Link
                      href="/admin/crawler-tests"
                      onClick={() => setShowBeheerMenu(false)}
                      className="beheer-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 bg-gray-50"
                    >
                      Crawler tests
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>

      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 Crawler Test Playground
          </h1>
          <p className="text-gray-600">
            Draai individuele tests of alle tests zonder database. Perfect voor debuggen en ontwikkelen.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Input */}
          <div className="space-y-6">
            {/* Mode Selector */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                1. Kies test modus
              </h2>
              <div className="flex gap-4">
                <button
                  onClick={() => setRunMode('single')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                    runMode === 'single'
                      ? 'border-purple-500 bg-purple-50 text-purple-900'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">Enkele Test</div>
                  <div className="text-xs mt-1">Test één specifieke functie</div>
                </button>
                <button
                  onClick={() => setRunMode('all')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                    runMode === 'all'
                      ? 'border-purple-500 bg-purple-50 text-purple-900'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">Alle Tests (130+)</div>
                  <div className="text-xs mt-1">Draai volledige test suite</div>
                </button>
              </div>
            </div>

            {/* Test Selector - Only for single mode */}
            {runMode === 'single' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  2. Selecteer een test
                </h2>
                <select
                  value={selectedTest}
                  onChange={(e) => setSelectedTest(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Kies een test...</option>
                  {availableTests.map((test) => (
                    <option key={test} value={test}>
                      {test}
                    </option>
                  ))}
                </select>
                {selectedTest && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg relative">
                    <div className="flex items-start gap-2 mb-2">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-blue-900 mb-2">Wat test dit?</p>
                        <p className="text-sm text-blue-800">
                          {getTestDescription(selectedTest)}
                        </p>
                        {getTestMetadata(selectedTest) && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {getTestMetadata(selectedTest)?.wcagLevel && (
                              <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-800">
                                WCAG {getTestMetadata(selectedTest)?.wcagLevel}
                              </span>
                            )}
                            {getTestMetadata(selectedTest)?.critical && (
                              <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">
                                Kritiek
                              </span>
                            )}
                            {getTestMetadata(selectedTest)?.serious && (
                              <span className="px-2 py-1 text-xs font-medium rounded bg-orange-100 text-orange-800">
                                Serieus
                              </span>
                            )}
                            {getTestMetadata(selectedTest)?.informational && (
                              <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
                                Informatief
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Meer info button - bottom right */}
                    {hasTestDocumentation(selectedTest) && (
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => setShowExtendedInfo(!showExtendedInfo)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 hover:text-blue-900 bg-white border border-blue-300 rounded-md hover:bg-blue-100 transition-colors"
                        >
                          <svg className={`w-3.5 h-3.5 transition-transform ${showExtendedInfo ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          Meer info
                        </button>
                      </div>
                    )}

                    {/* Extended documentation - expandable */}
                    {showExtendedInfo && hasTestDocumentation(selectedTest) && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        {!isEditingDocs ? (
                          <>
                            <style dangerouslySetInnerHTML={{__html: `
                              .test-documentation-content h2 {
                                font-size: 1.1rem !important;
                                font-weight: 600 !important;
                                color: #1e3a8a !important;
                                margin-top: 1.25rem !important;
                                margin-bottom: 0.75rem !important;
                                display: block !important;
                              }
                              .test-documentation-content h2:first-child {
                                margin-top: 0 !important;
                              }
                              .test-documentation-content p {
                                margin-bottom: 0.75rem !important;
                                line-height: 1.6 !important;
                                display: block !important;
                              }
                              .test-documentation-content ul, .test-documentation-content ol {
                                margin-bottom: 0.75rem !important;
                                padding-left: 1.5rem !important;
                                display: block !important;
                              }
                              .test-documentation-content li {
                                margin-bottom: 0.375rem !important;
                                display: list-item !important;
                              }
                              .test-documentation-content strong {
                                font-weight: 600 !important;
                                color: #1e3a8a !important;
                              }
                              .test-documentation-content code {
                                background-color: #dbeafe !important;
                                padding: 0.125rem 0.25rem !important;
                                border-radius: 0.25rem !important;
                                font-size: 0.875rem !important;
                              }
                            `}} />
                            <div
                              className="text-sm text-blue-800 test-documentation-content"
                              dangerouslySetInnerHTML={{
                                __html: marked.parse(getTestDocumentation(selectedTest) || '') as string
                              }}
                            />
                            <div className="mt-4 flex justify-end">
                              <button
                                onClick={handleEditDocs}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 hover:text-blue-900 bg-white border border-blue-300 rounded-md hover:bg-blue-100 transition-colors"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Bewerken
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-blue-900 mb-2">
                                Documentatie bewerken (Markdown)
                              </label>
                              <MdEditor
                                modelValue={editedDocumentation}
                                onChange={(content) => setEditedDocumentation(content)}
                                language="en-US"
                                theme="light"
                                previewTheme="default"
                                codeTheme="github"
                                showCodeRowNumber={true}
                                toolbars={[
                                  'bold',
                                  'italic',
                                  'strikeThrough',
                                  '-',
                                  'title',
                                  'unorderedList',
                                  'orderedList',
                                  '-',
                                  'quote',
                                  'code',
                                  'link',
                                  '-',
                                  'revoke',
                                  'next',
                                  '-',
                                  'preview',
                                  'fullscreen'
                                ]}
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={handleCancelEdit}
                                disabled={isSavingDocs}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                              >
                                Annuleren
                              </button>
                              <button
                                onClick={handleSaveDocs}
                                disabled={isSavingDocs}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                              >
                                {isSavingDocs ? (
                                  <>
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Opslaan...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Opslaan
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* URL Input */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {runMode === 'single' ? '3a' : '2a'}. URL invoeren (optie 1)
              </h2>
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (e.target.value) setHtml('');
                }}
                placeholder="https://example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="mt-2 text-xs text-gray-500">
                De pagina wordt automatisch opgehaald met Puppeteer
              </p>
            </div>

            {/* HTML Input */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {runMode === 'single' ? '3b' : '2b'}. HTML plakken (optie 2)
              </h2>
              <textarea
                value={html}
                onChange={(e) => {
                  setHtml(e.target.value);
                  if (e.target.value) setUrl('');
                }}
                placeholder="<html>...</html>"
                rows={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
              />
              <p className="mt-2 text-xs text-gray-500">
                Plak HTML code direct om te testen
              </p>
            </div>

            {/* Run Button */}
            <button
              onClick={runMode === 'single' ? handleRunSingleTest : handleRunAllTests}
              disabled={isLoading || (runMode === 'single' && !selectedTest) || (!url && !html)}
              className="w-full px-6 py-3 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ backgroundColor: '#6b2d8f' }}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {runMode === 'all' ? 'Alle tests draaien...' : 'Test draaien...'}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {runMode === 'all' ? 'Run All Tests (130+)' : 'Run Test'}
                </>
              )}
            </button>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-800">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {/* All Tests Results */}
            {allResults ? (
              <>
                {/* Summary Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    📊 Samenvatting
                  </h2>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{allResults.summary.totalTests}</p>
                      <p className="text-sm text-gray-600">Totaal Tests</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{allResults.summary.testsFound}</p>
                      <p className="text-sm text-gray-600">Gevonden</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-400">{allResults.summary.testsPassed}</p>
                      <p className="text-sm text-gray-600">Geslaagd</p>
                    </div>
                  </div>
                </div>

                {/* Results List - Only show tests that found something */}
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                      🔍 Gevonden Issues ({allResults.summary.testsFound})
                    </h2>
                  </div>
                  <div className="max-h-[600px] overflow-y-auto">
                    {allResults.results.filter((r: any) => r.found).map((testResult: any) => (
                      <div key={testResult.testId} className="border-b border-gray-200 last:border-b-0">
                        <button
                          onClick={() => toggleResultExpanded(testResult.testId)}
                          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <svg
                              className={`w-4 h-4 text-gray-400 transition-transform ${expandedResults.has(testResult.testId) ? 'rotate-90' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <div>
                              <div className="font-medium text-gray-900">{testResult.testName}</div>
                              <div className="text-sm text-gray-500">ID: {testResult.testId}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              {testResult.count} gevonden
                            </span>
                          </div>
                        </button>

                        {expandedResults.has(testResult.testId) && testResult.details && (
                          <div className="p-4 bg-gray-50 border-t border-gray-200">
                            <pre className="text-xs bg-white p-3 rounded border border-gray-200 overflow-x-auto">
                              {JSON.stringify(testResult.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary Generation */}
                {allResults.summary.testsFound > 0 && (
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border-2 border-purple-200 p-6">
                    <h2 className="text-lg font-semibold text-purple-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Samenvatting voor Bevindingen
                    </h2>
                    <p className="text-sm text-purple-700 mb-4">
                      Genereer een gestructureerde samenvatting met prioriteiten en WCAG-criteria om bevindingen te maken.
                    </p>

                    {!aiSummary ? (
                      <button
                        onClick={handleGenerateAISummary}
                        disabled={isGeneratingAI}
                        className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isGeneratingAI ? (
                          <>
                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Samenvatting genereren...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            📋 Genereer Samenvatting
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg border border-purple-200 p-6 max-h-[500px] overflow-y-auto">
                          <div className="prose prose-sm max-w-none prose-headings:text-purple-900 prose-strong:text-purple-900">
                            <div className="whitespace-pre-wrap text-gray-800 text-sm leading-relaxed">
                              {aiSummary}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              copyToClipboard(aiSummary);
                              // Show a brief success message
                              const btn = document.activeElement as HTMLButtonElement;
                              const originalText = btn.innerHTML;
                              btn.innerHTML = '✓ Gekopieerd!';
                              setTimeout(() => {
                                btn.innerHTML = originalText;
                              }, 2000);
                            }}
                            className="flex-1 px-4 py-2 bg-white border-2 border-purple-300 text-purple-700 rounded-lg font-medium hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Kopieer naar Klembord
                          </button>
                          <button
                            onClick={() => setAiSummary('')}
                            className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                          >
                            Verberg
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : result ? (
              <>
                {/* Single Test Result */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    📊 Resultaat
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Test ID</p>
                      <p className="text-lg font-semibold text-gray-900">{result.testId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Test Naam</p>
                      <p className="text-lg font-semibold text-gray-900">{result.testName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Gevonden</p>
                      <p className="text-lg font-semibold">
                        {result.found ? (
                          <span className="text-green-600">✓ Ja</span>
                        ) : (
                          <span className="text-gray-400">✗ Nee</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Aantal</p>
                      <p className="text-lg font-semibold text-gray-900">{result.count}</p>
                    </div>
                  </div>
                </div>

                {/* Raw JSON */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    🔍 Raw Test Data
                  </h2>
                  <pre className="text-xs bg-gray-50 p-4 rounded border border-gray-200 overflow-x-auto max-h-96 overflow-y-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>

                {/* Formatted Reports */}
                {result.testName === 'PageContainsMultipleSameLinksTest' && result.details?.issues && (
                  <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                    <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      📝 Geformatteerde Rapportage
                    </h2>
                    <div className="space-y-4">
                      {formatMultipleSameLinksReport(result.details).map((report, idx) => (
                        <div key={idx} className="bg-white rounded border border-blue-100 p-4 space-y-3">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-2">Bevinding:</h3>
                            <p className="text-sm text-gray-700">{report.bevinding}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-2">Details:</h3>
                            <p className="text-sm text-gray-700">{report.details}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-2">Advies:</h3>
                            <p className="text-sm text-gray-700">{report.advies}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.testName === 'LinkMissingHrefTest' && result.details?.issues && (
                  <div className="bg-red-50 rounded-lg border border-red-200 p-6">
                    <h2 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      📝 Geformatteerde Rapportage (Kritiek)
                    </h2>
                    <div className="space-y-4">
                      {formatLinkMissingHrefReport(result.details).map((report, idx) => (
                        <div key={idx} className="bg-white rounded border border-red-100 p-4 space-y-3">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-2">Bevinding:</h3>
                            <p className="text-sm text-gray-700">{report.bevinding}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-2">Details:</h3>
                            <p className="text-sm text-gray-700">{report.details}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-2">Advies:</h3>
                            <p className="text-sm text-gray-700">{report.advies}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.testName === 'ImgMissingAltTest' && result.details?.images && result.details.images.length > 0 && (
                  <div className="bg-red-50 rounded-lg border border-red-200 p-6">
                    <h2 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      📝 Geformatteerde Rapportage (Kritiek - WCAG 1.1.1)
                    </h2>
                    <div className="space-y-4">
                      {formatImgMissingAltReport(result.details).map((report, idx) => (
                        <div key={idx} className="bg-white rounded border border-red-100 p-4 space-y-3">
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <h3 className="text-sm font-semibold text-gray-900">Bevinding:</h3>
                              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">
                                KRITIEK
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{report.bevinding}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-2">Details:</h3>
                            <p className="text-sm text-gray-700">{report.details}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-2">Advies:</h3>
                            <p className="text-sm text-gray-700">{report.advies}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.testName === 'ImgAltTooShortTest' && result.details?.images && (
                  <div className="bg-orange-50 rounded-lg border border-orange-200 p-6">
                    <h2 className="text-lg font-semibold text-orange-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      📝 Geformatteerde Rapportage (Serieus - WCAG 1.1.1)
                    </h2>
                    <div className="space-y-4">
                      {formatImgAltTooShortReport(result.details).map((report, idx) => (
                        <div key={idx} className="bg-white rounded border border-orange-100 p-4 space-y-3">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-2">Bevinding:</h3>
                            <p className="text-sm text-gray-700">{report.bevinding}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-2">Details:</h3>
                            <p className="text-sm text-gray-700 whitespace-pre-line">{report.details}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-2">Advies:</h3>
                            <p className="text-sm text-gray-700">{report.advies}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.testName === 'AriaLandmarksTest' && result.details?.issues && result.details.issues.length > 0 && (
                  <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6">
                    <h2 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      📝 Geformatteerde Rapportage (SIA-R56 - WCAG 2.4.1, 4.1.2)
                    </h2>
                    <div className="space-y-4">
                      {formatAriaLandmarksReport(result.details).map((report, idx) => (
                        <div key={idx} className="bg-white rounded border border-yellow-100 p-4 space-y-3">
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <h3 className="text-sm font-semibold text-gray-900">Bevinding:</h3>
                              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                                SERIEUS
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{report.bevinding}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-2">Details:</h3>
                            <p className="text-sm text-gray-700 whitespace-pre-line">{report.details}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-2">Advies:</h3>
                            <p className="text-sm text-gray-700 whitespace-pre-line">{report.advies}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.testName === 'IframeIsHCaptchaTest' && result.details?.issues && result.details.issues.length > 0 && (
                  <div className="bg-red-50 rounded-lg border border-red-200 p-6">
                    <h2 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      📝 Geformatteerde Rapportage (Kritiek - WCAG 4.1.2)
                    </h2>
                    <div className="space-y-4">
                      {formatHCaptchaReport(result.details).map((report, idx) => (
                        <div key={idx} className="bg-white rounded border border-red-100 p-4 space-y-3">
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <h3 className="text-sm font-semibold text-gray-900">Bevinding:</h3>
                              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">
                                KRITIEK
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{report.bevinding}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-2">Details:</h3>
                            <p className="text-sm text-gray-700 whitespace-pre-line">{report.details}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-2">Advies:</h3>
                            <p className="text-sm text-gray-700 whitespace-pre-line">{report.advies}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <p className="text-gray-500">
                  Nog geen resultaten. Kies een modus en klik op "Run Test" of "Run All Tests".
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Hoe werkt dit?
          </h3>
          <ul className="text-sm text-purple-800 space-y-1 ml-7">
            <li>• Deze pagina praat NIET met de database</li>
            <li>• Resultaten worden NIET opgeslagen</li>
            <li>• Perfect voor debuggen en testen van nieuwe tests</li>
            <li>• Je kunt een URL opgeven (wordt opgehaald met Puppeteer) OF HTML plakken</li>
            <li>• <strong>Enkele Test:</strong> Test één specifieke functie met geformatteerde rapportage</li>
            <li>• <strong>Alle Tests:</strong> Draai alle 130+ tests tegelijk en zie een overzicht</li>
          </ul>
        </div>
      </div>
    </div>
    </>
  );
}