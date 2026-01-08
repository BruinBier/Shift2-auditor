import { PrismaClient } from '@prisma/client';
import { WCAGLevel, WCAGPrinciple } from '../lib/report-calculations';

const prisma = new PrismaClient();

const wcagCriteria = [
  // Principe 1: Perceivable (Waarneembaar)
  // Guideline 1.1: Tekstalternatieven
  {
    code: '1.1.1',
    titleNl: 'Niet-tekstuele content',
    level: WCAGLevel.A,
    principle: WCAGPrinciple.Perceivable,
    guidelineCode: '1.1',
    guidelineTitleNl: 'Tekstalternatieven',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html',
  },

  // Guideline 1.2: Op tijd gebaseerde media
  {
    code: '1.2.1',
    titleNl: 'Louter-geluid en louter-videobeeld (vooraf opgenomen)',
    level: WCAGLevel.A,
    principle: WCAGPrinciple.Perceivable,
    guidelineCode: '1.2',
    guidelineTitleNl: 'Op tijd gebaseerde media',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/audio-only-and-video-only-prerecorded.html',
  },
  {
    code: '1.2.2',
    titleNl: 'Ondertitels (vooraf opgenomen)',
    level: WCAGLevel.A,
    principle: WCAGPrinciple.Perceivable,
    guidelineCode: '1.2',
    guidelineTitleNl: 'Op tijd gebaseerde media',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html',
  },
  {
    code: '1.2.3',
    titleNl: 'Audiodescriptie of media-alternatief (vooraf opgenomen)',
    level: WCAGLevel.A,
    principle: WCAGPrinciple.Perceivable,
    guidelineCode: '1.2',
    guidelineTitleNl: 'Op tijd gebaseerde media',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/audio-description-or-media-alternative-prerecorded.html',
  },
  {
    code: '1.2.4',
    titleNl: 'Ondertitels (live)',
    level: WCAGLevel.AA,
    principle: WCAGPrinciple.Perceivable,
    guidelineCode: '1.2',
    guidelineTitleNl: 'Op tijd gebaseerde media',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/captions-live.html',
  },
  {
    code: '1.2.5',
    titleNl: 'Audiodescriptie (vooraf opgenomen)',
    level: WCAGLevel.AA,
    principle: WCAGPrinciple.Perceivable,
    guidelineCode: '1.2',
    guidelineTitleNl: 'Op tijd gebaseerde media',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/audio-description-prerecorded.html',
  },

  // Guideline 1.3: Aanpasbaar
  {
    code: '1.3.1',
    titleNl: 'Info en relaties',
    level: WCAGLevel.A,
    principle: WCAGPrinciple.Perceivable,
    guidelineCode: '1.3',
    guidelineTitleNl: 'Aanpasbaar',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html',
  },
  {
    code: '1.3.2',
    titleNl: 'Betekenisvolle volgorde',
    level: WCAGLevel.A,
    principle: WCAGPrinciple.Perceivable,
    guidelineCode: '1.3',
    guidelineTitleNl: 'Aanpasbaar',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/meaningful-sequence.html',
  },
  {
    code: '1.3.3',
    titleNl: 'Zintuiglijke eigenschappen',
    level: WCAGLevel.A,
    principle: WCAGPrinciple.Perceivable,
    guidelineCode: '1.3',
    guidelineTitleNl: 'Aanpasbaar',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/sensory-characteristics.html',
  },
  {
    code: '1.3.4',
    titleNl: 'Weergavestand',
    level: WCAGLevel.AA,
    principle: WCAGPrinciple.Perceivable,
    guidelineCode: '1.3',
    guidelineTitleNl: 'Aanpasbaar',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/orientation.html',
  },
  {
    code: '1.3.5',
    titleNl: 'Identificeer het doel van de input',
    level: WCAGLevel.AA,
    principle: WCAGPrinciple.Perceivable,
    guidelineCode: '1.3',
    guidelineTitleNl: 'Aanpasbaar',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/identify-input-purpose.html',
  },

  // Guideline 1.4: Onderscheidbaar
  {
    code: '1.4.1',
    titleNl: 'Gebruik van kleur',
    level: WCAGLevel.A,
    principle: WCAGPrinciple.Perceivable,
    guidelineCode: '1.4',
    guidelineTitleNl: 'Onderscheidbaar',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html',
  },
  {
    code: '1.4.2',
    titleNl: 'Geluidsbediening',
    level: WCAGLevel.A,
    principle: WCAGPrinciple.Perceivable,
    guidelineCode: '1.4',
    guidelineTitleNl: 'Onderscheidbaar',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/audio-control.html',
  },
  {
    code: '1.4.3',
    titleNl: 'Contrast (minimum)',
    level: WCAGLevel.AA,
    principle: WCAGPrinciple.Perceivable,
    guidelineCode: '1.4',
    guidelineTitleNl: 'Onderscheidbaar',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html',
  },
  {
    code: '1.4.4',
    titleNl: 'Herschalen van tekst',
    level: WCAGLevel.AA,
    principle: WCAGPrinciple.Perceivable,
    guidelineCode: '1.4',
    guidelineTitleNl: 'Onderscheidbaar',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html',
  },
  {
    code: '1.4.5',
    titleNl: 'Afbeeldingen van tekst',
    level: WCAGLevel.AA,
    principle: WCAGPrinciple.Perceivable,
    guidelineCode: '1.4',
    guidelineTitleNl: 'Onderscheidbaar',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/images-of-text.html',
  },
  {
    code: '1.4.10',
    titleNl: 'Reflow',
    level: WCAGLevel.AA,
    principle: WCAGPrinciple.Perceivable,
    guidelineCode: '1.4',
    guidelineTitleNl: 'Onderscheidbaar',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/reflow.html',
  },
  {
    code: '1.4.11',
    titleNl: 'Contrast van niet-tekstuele content',
    level: WCAGLevel.AA,
    principle: WCAGPrinciple.Perceivable,
    guidelineCode: '1.4',
    guidelineTitleNl: 'Onderscheidbaar',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html',
  },
  {
    code: '1.4.12',
    titleNl: 'Tekstafstand',
    level: WCAGLevel.AA,
    principle: WCAGPrinciple.Perceivable,
    guidelineCode: '1.4',
    guidelineTitleNl: 'Onderscheidbaar',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html',
  },
  {
    code: '1.4.13',
    titleNl: 'Content bij hover of focus',
    level: WCAGLevel.AA,
    principle: WCAGPrinciple.Perceivable,
    guidelineCode: '1.4',
    guidelineTitleNl: 'Onderscheidbaar',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html',
  },

  // Principe 2: Operable (Bedienbaar)
  // Guideline 2.1: Toetsenbordtoegankelijk
  {
    code: '2.1.1',
    titleNl: 'Toetsenbord',
    level: WCAGLevel.A,
    principle: WCAGPrinciple.Operable,
    guidelineCode: '2.1',
    guidelineTitleNl: 'Toetsenbordtoegankelijk',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html',
  },
  {
    code: '2.1.2',
    titleNl: 'Geen toetsenbordval',
    level: WCAGLevel.A,
    principle: WCAGPrinciple.Operable,
    guidelineCode: '2.1',
    guidelineTitleNl: 'Toetsenbordtoegankelijk',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html',
  },
  {
    code: '2.1.4',
    titleNl: 'Enkel teken sneltoetsen',
    level: WCAGLevel.A,
    principle: WCAGPrinciple.Operable,
    guidelineCode: '2.1',
    guidelineTitleNl: 'Toetsenbordtoegankelijk',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html',
  },

  // Guideline 2.2: Genoeg tijd
  {
    code: '2.2.1',
    titleNl: 'Timing aanpasbaar',
    level: WCAGLevel.A,
    principle: WCAGPrinciple.Operable,
    guidelineCode: '2.2',
    guidelineTitleNl: 'Genoeg tijd',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html',
  },
  {
    code: '2.2.2',
    titleNl: 'Pauzeren, stoppen of verbergen',
    level: WCAGLevel.A,
    principle: WCAGPrinciple.Operable,
    guidelineCode: '2.2',
    guidelineTitleNl: 'Genoeg tijd',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html',
  },

  // Guideline 2.3: Toevallen en fysieke reacties
  {
    code: '2.3.1',
    titleNl: 'Drie flitsen of beneden drempelwaarde',
    level: WCAGLevel.A,
    principle: WCAGPrinciple.Operable,
    guidelineCode: '2.3',
    guidelineTitleNl: 'Toevallen en fysieke reacties',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html',
  },

  // Guideline 2.4: Navigeerbaar
  {
    code: '2.4.1',
    titleNl: 'Blokken omzeilen',
    level: WCAGLevel.A,
    principle: WCAGPrinciple.Operable,
    guidelineCode: '2.4',
    guidelineTitleNl: 'Navigeerbaar',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html',
  },
  {
    code: '2.4.2',
    titleNl: 'Paginatitel',
    level: WCAGLevel.A,
    principle: WCAGPrinciple.Operable,
    guidelineCode: '2.4',
    guidelineTitleNl: 'Navigeerbaar',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/page-titled.html',
  },
  {
    code: '2.4.3',
    titleNl: 'Focus volgorde',
    level: WCAGLevel.A,
    principle: WCAGPrinciple.Operable,
    guidelineCode: '2.4',
    guidelineTitleNl: 'Navigeerbaar',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html',
  },
  {
    code: '2.4.4',
    titleNl: 'Linkdoel (in context)',
    level: WCAGLevel.A,
    principle: WCAGPrinciple.Operable,
    guidelineCode: '2.4',
    guidelineTitleNl: 'Navigeerbaar',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html',
  },
  {
    code: '2.4.5',
    titleNl: 'Meerdere manieren',
    level: WCAGLevel.AA,
    principle: WCAGPrinciple.Operable,
    guidelineCode: '2.4',
    guidelineTitleNl: 'Navigeerbaar',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/multiple-ways.html',
  },
  {
    code: '2.4.6',
    titleNl: 'Koppen en labels',
    level: WCAGLevel.AA,
    principle: WCAGPrinciple.Operable,
    guidelineCode: '2.4',
    guidelineTitleNl: 'Navigeerbaar',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html',
  },
  {
    code: '2.4.7',
    titleNl: 'Focus zichtbaar',
    level: WCAGLevel.AA,
    principle: WCAGPrinciple.Operable,
    guidelineCode: '2.4',
    guidelineTitleNl: 'Navigeerbaar',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html',
  },
  {
    code: '2.4.11',
    titleNl: 'Focus niet bedekt (minimum)',
    level: WCAGLevel.AA,
    principle: WCAGPrinciple.Operable,
    guidelineCode: '2.4',
    guidelineTitleNl: 'Navigeerbaar',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html',
  },

  // Guideline 2.5: Input Modaliteiten
  {
    code: '2.5.1',
    titleNl: 'Aanwijzergebaren',
    level: WCAGLevel.A,
    principle: WCAGPrinciple.Operable,
    guidelineCode: '2.5',
    guidelineTitleNl: 'Input Modaliteiten',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/pointer-gestures.html',
  },
  {
    code: '2.5.2',
    titleNl: 'Aanwijzerannulering',
    level: WCAGLevel.A,
    principle: WCAGPrinciple.Operable,
    guidelineCode: '2.5',
    guidelineTitleNl: 'Input Modaliteiten',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/pointer-cancellation.html',
  },
  {
    code: '2.5.3',
    titleNl: 'Label in naam',
    level: WCAGLevel.A,
    principle: WCAGPrinciple.Operable,
    guidelineCode: '2.5',
    guidelineTitleNl: 'Input Modaliteiten',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html',
  },
  {
    code: '2.5.4',
    titleNl: 'Bewegingsactivering',
    level: WCAGLevel.A,
    principle: WCAGPrinciple.Operable,
    guidelineCode: '2.5',
    guidelineTitleNl: 'Input Modaliteiten',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/motion-actuation.html',
  },
  {
    code: '2.5.7',
    titleNl: 'Sleepbewegingen',
    level: WCAGLevel.AA,
    principle: WCAGPrinciple.Operable,
    guidelineCode: '2.5',
    guidelineTitleNl: 'Input Modaliteiten',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html',
  },
  {
    code: '2.5.8',
    titleNl: 'Grootte van het aanwijsgebied (minimum)',
    level: WCAGLevel.AA,
    principle: WCAGPrinciple.Operable,
    guidelineCode: '2.5',
    guidelineTitleNl: 'Input Modaliteiten',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html',
  },

  // Principe 3: Understandable (Begrijpbaar)
  // Guideline 3.1: Leesbaar
  {
    code: '3.1.1',
    titleNl: 'Taal van de pagina',
    level: WCAGLevel.A,
    principle: WCAGPrinciple.Understandable,
    guidelineCode: '3.1',
    guidelineTitleNl: 'Leesbaar',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html',
  },
  {
    code: '3.1.2',
    titleNl: 'Taal van onderdelen',
    level: WCAGLevel.AA,
    principle: WCAGPrinciple.Understandable,
    guidelineCode: '3.1',
    guidelineTitleNl: 'Leesbaar',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html',
  },

  // Guideline 3.2: Voorspelbaar
  {
    code: '3.2.1',
    titleNl: 'Bij focus',
    level: WCAGLevel.A,
    principle: WCAGPrinciple.Understandable,
    guidelineCode: '3.2',
    guidelineTitleNl: 'Voorspelbaar',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/on-focus.html',
  },
  {
    code: '3.2.2',
    titleNl: 'Bij input',
    level: WCAGLevel.A,
    principle: WCAGPrinciple.Understandable,
    guidelineCode: '3.2',
    guidelineTitleNl: 'Voorspelbaar',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/on-input.html',
  },
  {
    code: '3.2.3',
    titleNl: 'Consistente navigatie',
    level: WCAGLevel.AA,
    principle: WCAGPrinciple.Understandable,
    guidelineCode: '3.2',
    guidelineTitleNl: 'Voorspelbaar',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/consistent-navigation.html',
  },
  {
    code: '3.2.4',
    titleNl: 'Consistente identificatie',
    level: WCAGLevel.AA,
    principle: WCAGPrinciple.Understandable,
    guidelineCode: '3.2',
    guidelineTitleNl: 'Voorspelbaar',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/consistent-identification.html',
  },
  {
    code: '3.2.6',
    titleNl: 'Consistente hulp',
    level: WCAGLevel.A,
    principle: WCAGPrinciple.Understandable,
    guidelineCode: '3.2',
    guidelineTitleNl: 'Voorspelbaar',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html',
  },

  // Guideline 3.3: Assistentie bij invoer
  {
    code: '3.3.1',
    titleNl: 'Foutidentificatie',
    level: WCAGLevel.A,
    principle: WCAGPrinciple.Understandable,
    guidelineCode: '3.3',
    guidelineTitleNl: 'Assistentie bij invoer',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html',
  },
  {
    code: '3.3.2',
    titleNl: 'Labels of instructies',
    level: WCAGLevel.A,
    principle: WCAGPrinciple.Understandable,
    guidelineCode: '3.3',
    guidelineTitleNl: 'Assistentie bij invoer',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html',
  },
  {
    code: '3.3.3',
    titleNl: 'Foutsuggestie',
    level: WCAGLevel.AA,
    principle: WCAGPrinciple.Understandable,
    guidelineCode: '3.3',
    guidelineTitleNl: 'Assistentie bij invoer',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html',
  },
  {
    code: '3.3.4',
    titleNl: 'Foutpreventie (wettelijk, financieel, gegevens)',
    level: WCAGLevel.AA,
    principle: WCAGPrinciple.Understandable,
    guidelineCode: '3.3',
    guidelineTitleNl: 'Assistentie bij invoer',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html',
  },
  {
    code: '3.3.7',
    titleNl: 'Overbodige invoer',
    level: WCAGLevel.A,
    principle: WCAGPrinciple.Understandable,
    guidelineCode: '3.3',
    guidelineTitleNl: 'Assistentie bij invoer',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html',
  },
  {
    code: '3.3.8',
    titleNl: 'Toegankelijke authenticatie (minimum)',
    level: WCAGLevel.AA,
    principle: WCAGPrinciple.Understandable,
    guidelineCode: '3.3',
    guidelineTitleNl: 'Assistentie bij invoer',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html',
  },

  // Principe 4: Robust (Robuust)
  // Guideline 4.1: Compatibel
  {
    code: '4.1.2',
    titleNl: 'Naam, rol, waarde',
    level: WCAGLevel.A,
    principle: WCAGPrinciple.Robust,
    guidelineCode: '4.1',
    guidelineTitleNl: 'Compatibel',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html',
  },
  {
    code: '4.1.3',
    titleNl: 'Statusberichten',
    level: WCAGLevel.AA,
    principle: WCAGPrinciple.Robust,
    guidelineCode: '4.1',
    guidelineTitleNl: 'Compatibel',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html',
  },
];

async function main() {
  console.log('Start seeding WCAG 2.2 criteria...');

  for (const criterion of wcagCriteria) {
    await prisma.wCAGCriterion.upsert({
      where: { code: criterion.code },
      update: criterion,
      create: criterion,
    });
  }

  console.log(`Seeded ${wcagCriteria.length} WCAG 2.2 criteria`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
