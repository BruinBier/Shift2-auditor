'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface CrawlerTest {
  id: string;
  name: string;
  description: string;
  status: 'passing' | 'failing' | 'pending';
  category?: string;
  bevindingen?: string[];
}

interface Badge {
  label: string;
  type: string;
  icon?: React.ReactNode;
}

interface Bevinding {
  id: string;
  title: string;
  badges: Badge[];
  description: string;
}

const warningIcon = (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const lightningIcon = (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const userIcon = (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const allBevindingen: Bevinding[] = [
  {
    id: 'ongeldige-html-structuur',
    title: 'Ongeldige HTML-structuur: lijst genest in p-element',
    badges: [
      { label: '1.3.1', type: 'wcag' },
      { label: 'Opmerking', type: 'status-opmerking', icon: warningIcon },
      { label: 'Klein', type: 'severity-klein', icon: lightningIcon },
      { label: 'Ontwikkelaar', type: 'role', icon: userIcon }
    ],
    description: 'De opsomming staat genest binnen een <p>-element. Dit is geen geldige HTML-structuur, waardoor de relatie tussen de inleidende tekst en de opsomming niet correct programmatisch is vastgelegd.'
  },
  {
    id: 'pdf-titel-niet-getoond',
    title: 'PDF - Titel niet getoond',
    badges: [
      { label: '2.4.2', type: 'wcag' },
      { label: 'Afgekeurd', type: 'status-afgekeurd' },
      { label: 'Klein', type: 'severity-klein', icon: lightningIcon },
      { label: 'Redacteur', type: 'role', icon: userIcon },
      { label: 'Premium', type: 'premium' }
    ],
    description: 'Voor PDF-documenten geldt dat zij een goede titel in de bestandseigenschappen nodig hebben en dat deze documenttitel wordt getoond in plaats van de bestandsnaam.\nHet PDF-document (URL) heeft wel een goede titel, maar deze wordt niet getoond in de titelbalk.'
  },
  {
    id: 'tekstalternatief-afbeelding-van',
    title: 'Tekstalternatief met "Afbeelding van..."',
    badges: [
      { label: '1.1.1', type: 'wcag' },
      { label: 'Afgekeurd', type: 'status-afgekeurd' },
      { label: 'Klein', type: 'severity-klein', icon: lightningIcon },
      { label: 'Redacteur', type: 'role', icon: userIcon },
      { label: 'Premium', type: 'premium' }
    ],
    description: 'Het tekstalternatief begint met onnodige tekst zoals "Afbeelding van" of "Foto van". Dit is niet nodig, want een schermlezer kondigt automatisch aan dat het om een afbeelding gaat.\n\nAdvies\nVerwijder deze overbodige tekst uit het tekstalternatief.'
  },
  {
    id: 'zichtbare-tekst-link-aria-label',
    title: 'Zichtbare tekst link niet in aria-label',
    badges: [
      { label: '2.5.3', type: 'wcag' },
      { label: 'Afgekeurd', type: 'status-afgekeurd' },
      { label: 'Klein', type: 'severity-klein', icon: lightningIcon },
      { label: 'Ontwikkelaar', type: 'role', icon: userIcon },
      { label: 'Premium', type: 'premium' }
    ],
    description: 'De visueel zichtbare tekst van een link moet onderdeel zijn van de toegankelijkheidsnaam. Dit zorgt ervoor dat mensen die spraakbesturing gebruiken de link kunnen activeren door de zichtbare tekst uit te spreken.\n\nDeze link heeft een aria-label attribuut, maar bevat niet de visueel zichtbare tekst "Aanmelden".\n\nAdvies\nPas het aria-label attribuut aan zodat deze begint met de visueel zichtbare tekst "Aanmelden".'
  },
  {
    id: 'vimeo-keyboard-0',
    title: 'Vimeo keyboard=0 ontbreekt',
    badges: [
      { label: '2.1.1', type: 'wcag' },
      { label: 'Afgekeurd', type: 'status-afgekeurd' },
      { label: 'Klein', type: 'severity-klein', icon: lightningIcon },
      { label: 'Ontwikkelaar', type: 'role', icon: userIcon },
      { label: 'Premium', type: 'premium' }
    ],
    description: 'Vimeo-video\'s bevatten standaard een toetsenbordinterface die kan interfereren met de toetsenbordnavigatie van de pagina. Door de parameter keyboard=0 toe te voegen aan de embed-URL wordt deze interface uitgeschakeld.\n\nDeze Vimeo-video mist de keyboard=0 parameter.\n\nAdvies\nVoeg keyboard=0 toe aan de Vimeo embed-URL.'
  },
  {
    id: 'pdf-afbeeldingen-niet-getagd',
    title: 'PDF - Afbeeldingen niet-getagde PDF',
    badges: [
      { label: '1.1.1', type: 'wcag' },
      { label: 'Afgekeurd', type: 'status-afgekeurd' },
      { label: 'Matig', type: 'severity-matig', icon: lightningIcon },
      { label: 'Redacteur', type: 'role', icon: userIcon },
      { label: 'Premium', type: 'premium' }
    ],
    description: 'PDF-documenten moeten getagd zijn zodat de structuur en inhoud toegankelijk is voor hulptechnologie.\n\nDit PDF-document bevat afbeeldingen die niet correct zijn getagd met alternatieven.\n\nAdvies\nTag alle afbeeldingen in het PDF-document met passende alternatieve tekst.'
  },
  {
    id: 'paginatitel-leeg',
    title: 'Paginatitel is leeg',
    badges: [
      { label: '2.4.2', type: 'wcag' },
      { label: 'Afgekeurd', type: 'status-afgekeurd' },
      { label: 'Matig', type: 'severity-matig', icon: lightningIcon },
      { label: 'Ontwikkelaar', type: 'role', icon: userIcon },
      { label: 'Premium', type: 'premium' }
    ],
    description: 'Elke webpagina moet een titel hebben die het onderwerp of doel beschrijft. Dit helpt gebruikers te begrijpen waar ze zich bevinden.\n\nDeze pagina heeft een lege <title> tag.\n\nAdvies\nGeef de pagina een beschrijvende titel die het onderwerp of doel aangeeft.'
  },
  {
    id: 'alt-bestandsnaam',
    title: 'Alt met bestandsnaam (min-tekens, underscore)',
    badges: [
      { label: '1.1.1', type: 'wcag' },
      { label: 'Afgekeurd', type: 'status-afgekeurd' },
      { label: 'Klein', type: 'severity-klein', icon: lightningIcon },
      { label: 'Redacteur', type: 'role', icon: userIcon },
      { label: 'Premium', type: 'premium' }
    ],
    description: 'Het alt-attribuut van een afbeelding moet de inhoud of functie beschrijven. Een bestandsnaam is geen geschikte beschrijving.\n\nDeze afbeelding heeft een alt-tekst die lijkt op een bestandsnaam (bevat underscores of min-tekens zonder spaties).\n\nAdvies\nVervang de bestandsnaam door een beschrijvende tekst die uitlegt wat de afbeelding toont.'
  },
  {
    id: 'iframe-titel-ontbreekt',
    title: 'Iframe - Titel ontbreekt',
    badges: [
      { label: '4.1.2', type: 'wcag' },
      { label: 'Afgekeurd', type: 'status-afgekeurd' },
      { label: 'Serieus', type: 'severity-serieus', icon: lightningIcon },
      { label: 'Ontwikkelaar', type: 'role', icon: userIcon },
      { label: 'Premium', type: 'premium' }
    ],
    description: 'Elk iframe-element moet een title attribuut hebben dat de inhoud beschrijft. Dit helpt gebruikers van hulptechnologie te begrijpen wat het iframe bevat.\n\nDit iframe mist een title attribuut.\n\nAdvies\nVoeg een title attribuut toe aan het iframe met een beschrijvende tekst.'
  },
  {
    id: 'link-geen-toegankelijkheidsnaam',
    title: 'Link heeft geen toegankelijkheidsnaam',
    badges: [
      { label: '4.1.2', type: 'wcag' },
      { label: 'Afgekeurd', type: 'status-afgekeurd' },
      { label: 'Serieus', type: 'severity-serieus', icon: lightningIcon },
      { label: 'Ontwikkelaar', type: 'role', icon: userIcon },
      { label: 'Premium', type: 'premium' }
    ],
    description: 'Elke link moet een toegankelijkheidsnaam hebben die het doel van de link beschrijft. Zonder naam kunnen gebruikers van hulptechnologie niet weten waar de link naartoe leidt.\n\nDeze link heeft geen toegankelijkheidsnaam.\n\nAdvies\nZorg dat de link tekst bevat, of voeg een aria-label of aria-labelledby attribuut toe.'
  },
  {
    id: 'knop-geen-toegankelijkheidsnaam',
    title: 'Knop heeft geen toegankelijkheidsnaam',
    badges: [
      { label: '4.1.2', type: 'wcag' },
      { label: 'Afgekeurd', type: 'status-afgekeurd' },
      { label: 'Serieus', type: 'severity-serieus', icon: lightningIcon },
      { label: 'Ontwikkelaar', type: 'role', icon: userIcon },
      { label: 'Premium', type: 'premium' }
    ],
    description: 'Elke knop moet een toegankelijkheidsnaam hebben die de functie beschrijft. Zonder naam kunnen gebruikers van hulptechnologie niet weten wat de knop doet.\n\nDeze knop heeft geen toegankelijkheidsnaam.\n\nAdvies\nZorg dat de knop tekst bevat, of voeg een aria-label of aria-labelledby attribuut toe.'
  },
  {
    id: 'heading-leeg',
    title: 'Lege heading',
    badges: [
      { label: '1.3.1', type: 'wcag' },
      { label: 'Afgekeurd', type: 'status-afgekeurd' },
      { label: 'Matig', type: 'severity-matig', icon: lightningIcon },
      { label: 'Redacteur', type: 'role', icon: userIcon },
      { label: 'Premium', type: 'premium' }
    ],
    description: 'Headings moeten tekst bevatten om betekenisvol te zijn voor gebruikers van hulptechnologie.\n\nDeze heading is leeg.\n\nAdvies\nVoeg beschrijvende tekst toe aan de heading, of verwijder het heading-element als het niet nodig is.'
  },
  {
    id: 'aria-label-leeg',
    title: 'Leeg aria-label attribuut',
    badges: [
      { label: '4.1.2', type: 'wcag' },
      { label: 'Afgekeurd', type: 'status-afgekeurd' },
      { label: 'Klein', type: 'severity-klein', icon: lightningIcon },
      { label: 'Ontwikkelaar', type: 'role', icon: userIcon },
      { label: 'Premium', type: 'premium' }
    ],
    description: 'Een leeg aria-label attribuut kan de toegankelijkheidsnaam van een element verwijderen, waardoor het ontoegankelijk wordt.\n\nDit element heeft een leeg aria-label attribuut.\n\nAdvies\nVoeg een beschrijvende waarde toe aan het aria-label attribuut, of verwijder het attribuut.'
  },
  {
    id: 'contrast-tekst-achtergrond',
    title: 'Onvoldoende contrast tussen tekst en achtergrond',
    badges: [
      { label: '1.4.3', type: 'wcag' },
      { label: 'Afgekeurd', type: 'status-afgekeurd' },
      { label: 'Matig', type: 'severity-matig', icon: lightningIcon },
      { label: 'Ontwerper', type: 'role', icon: userIcon },
      { label: 'Premium', type: 'premium' }
    ],
    description: 'Tekst moet voldoende contrast hebben met de achtergrond om leesbaar te zijn voor mensen met een visuele beperking. De minimale contrastratio is 4.5:1 voor normale tekst en 3:1 voor grote tekst.\n\nDeze tekst heeft onvoldoende contrast.\n\nAdvies\nPas de kleur van de tekst of achtergrond aan om aan de minimale contrastratio te voldoen.'
  },
  {
    id: 'form-label-ontbreekt',
    title: 'Formulierveld mist label',
    badges: [
      { label: '1.3.1', type: 'wcag' },
      { label: 'Afgekeurd', type: 'status-afgekeurd' },
      { label: 'Serieus', type: 'severity-serieus', icon: lightningIcon },
      { label: 'Ontwikkelaar', type: 'role', icon: userIcon },
      { label: 'Premium', type: 'premium' }
    ],
    description: 'Elk formulierveld moet een label hebben dat beschrijft welke informatie wordt gevraagd. Dit helpt alle gebruikers, maar is vooral belangrijk voor gebruikers van hulptechnologie.\n\nDit formulierveld heeft geen label.\n\nAdvies\nVoeg een <label> element toe dat gekoppeld is aan het formulierveld, of gebruik een aria-label of aria-labelledby attribuut.'
  },
  {
    id: 'heading-volgorde-overgeslagen',
    title: 'Heading-niveau overgeslagen',
    badges: [
      { label: '1.3.1', type: 'wcag' },
      { label: 'Opmerking', type: 'status-opmerking', icon: warningIcon },
      { label: 'Matig', type: 'severity-matig', icon: lightningIcon },
      { label: 'Ontwikkelaar', type: 'role', icon: userIcon }
    ],
    description: 'Headings moeten een logische structuur volgen zonder niveaus over te slaan. Het is prima om van een h2 naar een h4 te gaan als de visuele hiërarchie dat vereist, maar best practice is om geen niveaus over te slaan.\n\nOp deze pagina wordt een heading-niveau overgeslagen.\n\nAdvies\nOverweeg de heading-structuur aan te passen zodat geen niveaus worden overgeslagen.'
  },
  {
    id: 'table-geen-headers',
    title: 'Tabel mist header cellen',
    badges: [
      { label: '1.3.1', type: 'wcag' },
      { label: 'Afgekeurd', type: 'status-afgekeurd' },
      { label: 'Matig', type: 'severity-matig', icon: lightningIcon },
      { label: 'Ontwikkelaar', type: 'role', icon: userIcon },
      { label: 'Premium', type: 'premium' }
    ],
    description: 'Datatafels moeten <th> elementen bevatten om kolomkoppen of rijkoppen aan te geven. Dit helpt gebruikers van hulptechnologie de relaties tussen cellen te begrijpen.\n\nDeze tabel bevat geen <th> elementen.\n\nAdvies\nGebruik <th> elementen voor de eerste rij en/of kolom om headers aan te geven.'
  },
  {
    id: 'alt-decoratief-niet-leeg',
    title: 'Decoratieve afbeelding heeft alt-tekst',
    badges: [
      { label: '1.1.1', type: 'wcag' },
      { label: 'Opmerking', type: 'status-opmerking', icon: warningIcon },
      { label: 'Klein', type: 'severity-klein', icon: lightningIcon },
      { label: 'Redacteur', type: 'role', icon: userIcon }
    ],
    description: 'Decoratieve afbeeldingen die geen informatieve waarde hebben, moeten een leeg alt attribuut krijgen (alt="") zodat schermlezers ze overslaan.\n\nDeze afbeelding lijkt decoratief maar heeft toch alt-tekst.\n\nAdvies\nAls de afbeelding puur decoratief is, maak het alt attribuut dan leeg (alt="").'
  },
  {
    id: 'focus-niet-zichtbaar',
    title: 'Focus-indicator niet zichtbaar',
    badges: [
      { label: '2.4.7', type: 'wcag' },
      { label: 'Afgekeurd', type: 'status-afgekeurd' },
      { label: 'Matig', type: 'severity-matig', icon: lightningIcon },
      { label: 'Ontwikkelaar', type: 'role', icon: userIcon },
      { label: 'Premium', type: 'premium' }
    ],
    description: 'Wanneer een element toetsenbordfocus krijgt, moet dit visueel duidelijk zijn. Dit helpt toetsenbordgebruikers te zien waar ze zich bevinden op de pagina.\n\nDe focus-indicator is niet voldoende zichtbaar op dit element.\n\nAdvies\nZorg voor een duidelijke visuele focus-indicator met voldoende contrast.'
  },
  {
    id: 'lang-attribuut-ontbreekt',
    title: 'Lang attribuut ontbreekt op html element',
    badges: [
      { label: '3.1.1', type: 'wcag' },
      { label: 'Afgekeurd', type: 'status-afgekeurd' },
      { label: 'Matig', type: 'severity-matig', icon: lightningIcon },
      { label: 'Ontwikkelaar', type: 'role', icon: userIcon },
      { label: 'Premium', type: 'premium' }
    ],
    description: 'Het <html> element moet een lang attribuut hebben om de hoofdtaal van de pagina aan te geven. Dit helpt schermlezers de juiste uitspraak te gebruiken.\n\nHet <html> element mist een lang attribuut.\n\nAdvies\nVoeg een lang attribuut toe aan het <html> element, bijvoorbeeld lang="nl" voor Nederlands.'
  }
];

export default function CrawlerTestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [test, setTest] = useState<CrawlerTest | null>(null);
  const [activeTab, setActiveTab] = useState<'snelle' | 'premium'>('snelle');
  const [showBeheerMenu, setShowBeheerMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedBevindingen, setSelectedBevindingen] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bevindingToDelete, setBevindingToDelete] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // Load test from localStorage
    const savedTests = localStorage.getItem('crawlerTests');
    if (savedTests) {
      try {
        const tests = JSON.parse(savedTests);
        const foundTest = tests.find((t: CrawlerTest) => t.id === params.id);
        if (foundTest) {
          setTest(foundTest);
          setSelectedBevindingen(foundTest.bevindingen || []);
        }
      } catch (error) {
        console.error('Error loading test:', error);
      }
    }
  }, [params.id]);

  // Close dropdown on Escape key or click outside
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowBeheerMenu(false);
        setShowDropdown(false);
        setShowModal(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showBeheerMenu && !target.closest('.beheer-button') && !target.closest('.beheer-menu')) {
        setShowBeheerMenu(false);
      }
      if (showDropdown && !target.closest('.bevindingen-dropdown')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBeheerMenu, showDropdown]);

  const handleAddBevinding = (bevindingId: string) => {
    if (!test) return;
    if (selectedBevindingen.includes(bevindingId)) {
      setShowModal(false);
      return;
    }

    const newBevindingen = [...selectedBevindingen, bevindingId];

    // Update localStorage immediately
    const savedTests = localStorage.getItem('crawlerTests');
    if (savedTests) {
      try {
        const tests = JSON.parse(savedTests);
        const updatedTests = tests.map((t: CrawlerTest) =>
          t.id === test.id ? { ...t, bevindingen: newBevindingen } : t
        );
        localStorage.setItem('crawlerTests', JSON.stringify(updatedTests));

        // Update state
        setSelectedBevindingen(newBevindingen);
        setTest({ ...test, bevindingen: newBevindingen });

        setShowModal(false);
      } catch (error) {
        console.error('Error saving bevindingen:', error);
      }
    }
  };

  if (!mounted || !test) {
    return null;
  }

  // Separate bevindingen into snelle and premium based on the actual bevinding data
  const snelleBevindingen = selectedBevindingen.filter(bevindingId => {
    const bevinding = allBevindingen.find(b => b.id === bevindingId);
    if (!bevinding) return false;
    // Check if bevinding has a Premium badge
    return !bevinding.badges.some(badge => badge.type === 'premium');
  });

  const premiumBevindingen = selectedBevindingen.filter(bevindingId => {
    const bevinding = allBevindingen.find(b => b.id === bevindingId);
    if (!bevinding) return false;
    // Check if bevinding has a Premium badge
    return bevinding.badges.some(badge => badge.type === 'premium');
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-shift2-primary text-white">
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
              <Link
                href="/admin/bevindingen"
                className="flex items-center gap-2 text-white hover:text-gray-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Bevindingen
              </Link>
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
                      className="beheer-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700"
                      style={{ transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F0F0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Onderzoekstypen
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </Link>
                    <Link
                      href="/admin/projecten"
                      onClick={() => setShowBeheerMenu(false)}
                      className="beheer-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700"
                      style={{ transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F0F0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Projecten
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </Link>
                    <Link
                      href="/admin/opdrachtgevers"
                      onClick={() => setShowBeheerMenu(false)}
                      className="beheer-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700"
                      style={{ transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F0F0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Opdrachtgevers
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </Link>
                    <Link
                      href="/admin/crawler-tests"
                      onClick={() => setShowBeheerMenu(false)}
                      className="beheer-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700"
                      style={{ transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F0F0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Crawler tests
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </Link>
                    <Link
                      href="/admin/beoordelingen"
                      onClick={() => setShowBeheerMenu(false)}
                      className="beheer-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700"
                      style={{ transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F0F0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Beoordelingen
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </Link>
                    <Link
                      href="/admin/team"
                      onClick={() => setShowBeheerMenu(false)}
                      className="beheer-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700"
                      style={{ transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F0F0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Team
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        <div className="flex gap-6">
          {/* Left Column - Test Info (narrower, white background) */}
          <div className="w-80 bg-white rounded-lg shadow-sm border border-gray-200 p-6 self-start">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 p-2 hover:bg-gray-50 rounded back-button"
              style={{ backgroundColor: 'transparent' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <h1 className="text-base font-semibold text-gray-900 mb-4 break-words">{test.name}</h1>
            <p className="text-sm text-gray-600 mb-6">{test.description}</p>

            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="new-project-button flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border border-green-500 bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              Bevinding koppelen
            </button>
          </div>

          {/* Right Column - Bevindingen Tabs (wider, gray background) */}
          <div className="flex-1 bg-gray-50 rounded-lg">
            {/* Tabs */}
            <div className="flex bg-gray-50">
              <button
                onClick={() => setActiveTab('snelle')}
                className="px-6 py-4 text-sm font-medium transition-colors"
              >
                <span className={`border-b-2 transition-colors inline-block pb-1 ${
                  activeTab === 'snelle'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                  Snelle bevindingen ({snelleBevindingen.length})
                </span>
              </button>
              <button
                onClick={() => setActiveTab('premium')}
                className="px-6 py-4 text-sm font-medium transition-colors"
              >
                <span className={`border-b-2 transition-colors inline-block pb-1 ${
                  activeTab === 'premium'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                  Premium bevindingen ({premiumBevindingen.length})
                </span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'snelle' && snelleBevindingen.length === 0 && (
                <p className="text-gray-500 italic">Geen bevindingen.</p>
              )}
              {activeTab === 'premium' && premiumBevindingen.length === 0 && (
                <p className="text-gray-500 italic">Geen bevindingen.</p>
              )}

              {activeTab === 'snelle' && snelleBevindingen.length > 0 && (
                <div className="space-y-4">
                  {snelleBevindingen.map((bevindingId) => {
                    const bevindingData = allBevindingen.find(b => b.id === bevindingId);
                    if (!bevindingData) return null;

                    return (
                      <div key={bevindingId} className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-base font-semibold text-gray-900">{bevindingData.title}</h3>
                          <button
                            type="button"
                            onClick={() => {
                              setBevindingToDelete(bevindingId);
                              setShowDeleteModal(true);
                            }}
                            className="button button-size--md button-variant--danger icon-position--start button--icon-only delete-button"
                            title="Bevinding ontkoppelen"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1M3 21l18-18" />
                            </svg>
                            <span className="button-text visuallyhidden">Bevinding ontkoppelen</span>
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {bevindingData.badges.map((badge, index) => (
                            <span
                              key={index}
                              className={`px-2 py-0.5 text-xs rounded flex items-center gap-1 ${
                                badge.type === 'wcag'
                                  ? 'bg-purple-100 text-purple-800'
                                  : badge.type === 'status-afgekeurd'
                                  ? 'bg-red-100 text-red-800'
                                  : badge.type === 'status-opmerking'
                                  ? 'bg-gray-100 text-gray-800'
                                  : badge.type === 'severity-klein'
                                  ? 'bg-gray-100 text-gray-800'
                                  : badge.type === 'severity-matig'
                                  ? 'bg-orange-100 text-orange-800'
                                  : badge.type === 'severity-serieus'
                                  ? 'bg-red-100 text-red-800'
                                  : badge.type === 'role'
                                  ? 'bg-gray-100 text-gray-800'
                                  : badge.type === 'premium'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {badge.icon && badge.icon}
                              {badge.label}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                          {bevindingData.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'premium' && premiumBevindingen.length > 0 && (
                <div className="space-y-4">
                  {premiumBevindingen.map((bevindingId) => {
                    const bevindingData = allBevindingen.find(b => b.id === bevindingId);
                    if (!bevindingData) return null;

                    return (
                      <div key={bevindingId} className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-base font-semibold text-gray-900">{bevindingData.title}</h3>
                          <button
                            type="button"
                            onClick={() => {
                              setBevindingToDelete(bevindingId);
                              setShowDeleteModal(true);
                            }}
                            className="button button-size--md button-variant--danger icon-position--start button--icon-only delete-button"
                            title="Bevinding ontkoppelen"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1M3 21l18-18" />
                            </svg>
                            <span className="button-text visuallyhidden">Bevinding ontkoppelen</span>
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {bevindingData.badges.map((badge, index) => (
                            <span
                              key={index}
                              className={`px-2 py-0.5 text-xs rounded flex items-center gap-1 ${
                                badge.type === 'wcag'
                                  ? 'bg-purple-100 text-purple-800'
                                  : badge.type === 'status-afgekeurd'
                                  ? 'bg-red-100 text-red-800'
                                  : badge.type === 'status-opmerking'
                                  ? 'bg-gray-100 text-gray-800'
                                  : badge.type === 'severity-klein'
                                  ? 'bg-gray-100 text-gray-800'
                                  : badge.type === 'severity-matig'
                                  ? 'bg-orange-100 text-orange-800'
                                  : badge.type === 'severity-serieus'
                                  ? 'bg-red-100 text-red-800'
                                  : badge.type === 'role'
                                  ? 'bg-gray-100 text-gray-800'
                                  : badge.type === 'premium'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {badge.icon && badge.icon}
                              {badge.label}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                          {bevindingData.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal voor bevinding koppelen */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Kies een snelle bevinding</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search Box */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="relative">
                <input
                  type="text"
                  placeholder="zoeken"
                  className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={showDropdown ? '' : ''}
                  onChange={(e) => {
                    // Search functionality here
                  }}
                />
                <button className="absolute right-0 top-0 h-full px-3 bg-gray-900 text-white rounded-r-md hover:bg-gray-800">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">Resultaten (156)</p>
            </div>

            {/* Bevindingen List */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                {allBevindingen.map((bevinding) => (
                  <div key={bevinding.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-base font-semibold text-gray-900">{bevinding.title}</h3>
                      <button
                        type="button"
                        onClick={() => handleAddBevinding(bevinding.id)}
                        className="new-project-button flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border border-green-500 bg-white hover:bg-gray-50 transition-colors whitespace-nowrap"
                      >
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        Bevinding koppelen
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {bevinding.badges.map((badge, index) => (
                        <span
                          key={index}
                          className={`px-2 py-0.5 text-xs rounded flex items-center gap-1 ${
                            badge.type === 'wcag'
                              ? 'bg-purple-100 text-purple-800'
                              : badge.type === 'status-afgekeurd'
                              ? 'bg-red-100 text-red-800'
                              : badge.type === 'status-opmerking'
                              ? 'bg-gray-100 text-gray-800'
                              : badge.type === 'severity-klein'
                              ? 'bg-gray-100 text-gray-800'
                              : badge.type === 'severity-matig'
                              ? 'bg-orange-100 text-orange-800'
                              : badge.type === 'severity-serieus'
                              ? 'bg-red-100 text-red-800'
                              : badge.type === 'role'
                              ? 'bg-gray-100 text-gray-800'
                              : badge.type === 'premium'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {badge.icon && badge.icon}
                          {badge.label}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {bevinding.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && bevindingToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Bevinding ontkoppelen</h2>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setBevindingToDelete(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Weet je zeker dat je deze bevinding wilt ontkoppelen van de crawler test?
            </p>

            <div className="flex gap-3 justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setBevindingToDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuleren
              </button>
              <button
                type="button"
                onClick={() => {
                  if (bevindingToDelete) {
                    const newBevindingen = selectedBevindingen.filter(b => b !== bevindingToDelete);
                    setSelectedBevindingen(newBevindingen);
                    const savedTests = localStorage.getItem('crawlerTests');
                    if (savedTests) {
                      const tests = JSON.parse(savedTests);
                      const updatedTests = tests.map((t: CrawlerTest) =>
                        t.id === test.id ? { ...t, bevindingen: newBevindingen } : t
                      );
                      localStorage.setItem('crawlerTests', JSON.stringify(updatedTests));
                      setTest({ ...test, bevindingen: newBevindingen });
                    }
                    setShowDeleteModal(false);
                    setBevindingToDelete(null);
                  }
                }}
                className="delete-modal-button px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Bevinding ontkoppelen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}