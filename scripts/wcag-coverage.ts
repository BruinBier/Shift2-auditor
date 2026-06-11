/**
 * WCAG 2.2 dekkings-overzicht — welke succescriteria worden geraakt
 * door welke crawler-tests in lib/crawler/tests.ts.
 *
 * Bron:
 * - Hardcoded mapping per testName naar WCAG-SC's (gebaseerd op testdoel)
 * - WCAG 2.2 — 50 criteria op A en AA niveau
 *
 * Doel: zien per SC welke tests we hebben (volledig automatisch, deels, niet).
 *
 * Gebruik: npx tsx scripts/wcag-coverage.ts
 */

interface CoverageEntry {
  testName: string;
  scs: string[]; // WCAG SC codes, bv. ["1.1.1"]
  type: 'pass-fail' | 'informational';
  note?: string;
}

const COVERAGE: CoverageEntry[] = [
  // Principe 1 — Waarneembaar
  { testName: 'LangAttributeMissingTest', scs: ['3.1.1'], type: 'pass-fail' },
  { testName: 'TitleMissingTest', scs: ['2.4.2'], type: 'pass-fail' },
  { testName: 'TitleEmptyTest', scs: ['2.4.2'], type: 'pass-fail' },
  { testName: 'ImgMissingAltTest', scs: ['1.1.1'], type: 'pass-fail' },
  { testName: 'ImgAltTooLongTest', scs: ['1.1.1'], type: 'pass-fail', note: 'kwaliteit alt-tekst' },
  { testName: 'ImgAltTooShortTest', scs: ['1.1.1'], type: 'pass-fail', note: 'kwaliteit alt-tekst' },
  { testName: 'ImageLinkMissingAccessibleNameTest', scs: ['1.1.1', '2.4.4', '4.1.2'], type: 'pass-fail' },
  { testName: 'IframeMissingAccessibleNameTest', scs: ['4.1.2', '2.4.6'], type: 'pass-fail' },
  { testName: 'VideoMissingTitleAriaTest', scs: ['4.1.2'], type: 'pass-fail' },
  { testName: 'IframeIsYouTubeVideoWithKeysDisabledTest', scs: ['2.1.1'], type: 'pass-fail' },
  { testName: 'IframeIsVimeoVideoWithKeysDisabledTest', scs: ['2.1.1'], type: 'pass-fail' },
  { testName: 'AudioHasAutoplayTest', scs: ['1.4.2'], type: 'pass-fail' },
  { testName: 'VideoHasAutoplayTest', scs: ['1.4.2', '2.2.2'], type: 'pass-fail' },
  { testName: 'AudioControlsTest', scs: ['1.4.2'], type: 'pass-fail' },
  { testName: 'VideoControlsTest', scs: ['2.1.1'], type: 'pass-fail' },
  { testName: 'ViewportMetaRestrictsScalingTest', scs: ['1.4.4', '1.4.10'], type: 'pass-fail' },

  // Principe 1 — Info en relaties
  { testName: 'HeadingsAtLeastOneH1Test', scs: ['1.3.1', '2.4.6'], type: 'pass-fail' },
  { testName: 'HeadingEmptyTest', scs: ['1.3.1', '2.4.6'], type: 'pass-fail' },
  { testName: 'HeadingSkipLevelTest', scs: ['1.3.1'], type: 'pass-fail' },
  { testName: 'TableWithHeadingsTest', scs: ['1.3.1'], type: 'pass-fail' },
  { testName: 'TableWithoutHeadersTest', scs: ['1.3.1'], type: 'pass-fail' },
  { testName: 'FormMissingLabelsTest', scs: ['1.3.1', '3.3.2', '4.1.2'], type: 'pass-fail' },
  { testName: 'InputMissingLabelTest', scs: ['1.3.1', '3.3.2', '4.1.2'], type: 'pass-fail' },
  { testName: 'FormMissingFieldsetTest', scs: ['1.3.1'], type: 'pass-fail' },
  { testName: 'StrongHasMoreThanFourWordsTest', scs: ['1.3.1'], type: 'pass-fail', note: 'oneigenlijk gebruik strong' },
  { testName: 'ElementsStyledWithStrongOrEmTest', scs: ['1.3.1'], type: 'pass-fail', note: 'visuele opmaak met strong/em' },

  // Principe 2 — Bedienbaar
  { testName: 'SkipLinkTest', scs: ['2.4.1'], type: 'pass-fail' },
  { testName: 'AriaLandmarksTest', scs: ['2.4.1', '4.1.2'], type: 'pass-fail', note: 'SIA-R56 unieke landmark-namen' },
  { testName: 'LinkWithoutTextTest', scs: ['2.4.4', '4.1.2'], type: 'pass-fail' },
  { testName: 'EmptyLinkTest', scs: ['2.4.4', '4.1.2'], type: 'pass-fail' },
  { testName: 'LinkMissingHrefTest', scs: ['2.1.1', '2.4.4'], type: 'pass-fail' },
  { testName: 'PageContainsLinkReadMoreTest', scs: ['2.4.4'], type: 'pass-fail' },
  { testName: 'PageContainsMultipleSameLinksTest', scs: ['2.4.4'], type: 'pass-fail', note: 'hoge false-positive rate' },
  { testName: 'ButtonEmptyTest', scs: ['4.1.2'], type: 'pass-fail' },

  // Informational / inventarisatie
  { testName: 'TableTest', scs: [], type: 'informational' },
  { testName: 'FormTest', scs: [], type: 'informational' },
  { testName: 'ImgTest', scs: [], type: 'informational' },
  { testName: 'IframeTest', scs: [], type: 'informational' },
  { testName: 'AudioTest', scs: [], type: 'informational' },
  { testName: 'VideoTest', scs: [], type: 'informational' },
  { testName: 'ListTest', scs: [], type: 'informational' },
  { testName: 'DefinitionListTest', scs: [], type: 'informational' },
  { testName: 'IframeIsGoogleMapTest', scs: [], type: 'informational' },
  { testName: 'IframeIsScribitVideoTest', scs: [], type: 'informational' },
  { testName: 'IframeIsVimeoVideoTest', scs: [], type: 'informational' },
  { testName: 'IframeIsVimeoVideoWithKeysEnabledTest', scs: [], type: 'informational' },
  { testName: 'IframeIsYouTubeVideoWithKeysEnabledTest', scs: [], type: 'informational' },
  { testName: 'IframeIsHCaptchaTest', scs: ['3.3.7'], type: 'pass-fail', note: 'CAPTCHA-detectie' },
];

// Alle WCAG 2.2 A + AA criteria
const ALL_AA_SCS = [
  // Perceivable
  '1.1.1',
  '1.2.1', '1.2.2', '1.2.3', '1.2.4', '1.2.5',
  '1.3.1', '1.3.2', '1.3.3', '1.3.4', '1.3.5',
  '1.4.1', '1.4.2', '1.4.3', '1.4.4', '1.4.5', '1.4.10', '1.4.11', '1.4.12', '1.4.13',
  // Operable
  '2.1.1', '2.1.2', '2.1.4',
  '2.2.1', '2.2.2',
  '2.3.1',
  '2.4.1', '2.4.2', '2.4.3', '2.4.4', '2.4.5', '2.4.6', '2.4.7', '2.4.11',
  '2.5.1', '2.5.2', '2.5.3', '2.5.4', '2.5.7', '2.5.8',
  // Understandable
  '3.1.1', '3.1.2',
  '3.2.1', '3.2.2', '3.2.3', '3.2.4', '3.2.6',
  '3.3.1', '3.3.2', '3.3.3', '3.3.4', '3.3.7', '3.3.8',
  // Robust
  '4.1.2', '4.1.3',
];

interface SCRow {
  sc: string;
  tests: { name: string; type: string; note?: string }[];
}

const scMap = new Map<string, { name: string; type: string; note?: string }[]>();
for (const sc of ALL_AA_SCS) scMap.set(sc, []);

for (const entry of COVERAGE) {
  for (const sc of entry.scs) {
    if (!scMap.has(sc)) scMap.set(sc, []);
    scMap.get(sc)!.push({ name: entry.testName, type: entry.type, note: entry.note });
  }
}

function printTable() {
  const rows: SCRow[] = [];
  for (const sc of ALL_AA_SCS) {
    rows.push({ sc, tests: scMap.get(sc) || [] });
  }

  console.log('# WCAG 2.2 AA — dekking door onze crawler-tests\n');

  let coveredCount = 0;
  let totalTests = 0;

  for (const row of rows) {
    const has = row.tests.length > 0;
    if (has) coveredCount++;
    totalTests += row.tests.length;

    const mark = has ? '✓' : '·';
    console.log(`${mark} ${row.sc.padEnd(7)} ${has ? row.tests.map((t) => t.name).join(', ') : '— (geen automatische test)'}`);
    for (const t of row.tests) {
      if (t.note) console.log(`           ↳ ${t.name}: ${t.note}`);
    }
  }

  console.log(`\nDekking: ${coveredCount}/${ALL_AA_SCS.length} SC's (${Math.round((coveredCount / ALL_AA_SCS.length) * 100)}%)`);
  console.log(`Tests gemapt: ${COVERAGE.filter((c) => c.type === 'pass-fail').length} pass/fail, ${COVERAGE.filter((c) => c.type === 'informational').length} informational`);
}

function printJSON() {
  const out: Record<string, any> = {};
  for (const sc of ALL_AA_SCS) {
    const tests = scMap.get(sc) || [];
    out[sc] = {
      covered: tests.length > 0,
      tests: tests,
    };
  }
  console.log(JSON.stringify(out, null, 2));
}

const flag = process.argv[2];
if (flag === '--json') {
  printJSON();
} else {
  printTable();
}
