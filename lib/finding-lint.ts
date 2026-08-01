/**
 * Schrijfregel-linter voor bevindingen.
 *
 * Controleert een concept-bevinding tegen de vaste Shift2-schrijfregels voordat
 * hij wordt weggeschreven. Vangt de mechanische fouten af (gedachtestreepje,
 * verkeerde term, URL in de description) zodat de review over de inhoud kan
 * gaan in plaats van over de vorm.
 *
 * `error`  = harde regel, altijd fout.
 * `warn`   = richtlijn, kan in context kloppen. Beoordeel zelf.
 *
 * Bewust NIET gecontroleerd: of de bevinding inhoudelijk klopt, of het juiste
 * criterium is gekozen, of de toon goed is. Dat is vakinhoudelijk werk.
 */

export type LintSeverity = 'error' | 'warn';

export interface LintIssue {
  severity: LintSeverity;
  rule: string;
  field: 'description' | 'advice' | 'impact' | 'responsibility' | 'algemeen';
  message: string;
  /** Het stukje tekst dat de melding veroorzaakte, als dat aanwijsbaar is. */
  excerpt?: string;
  /** Concrete vervanging, waar die eenduidig is. */
  suggestion?: string;
}

export interface FindingDraft {
  description?: string;
  advice?: string;
  impact?: string | null;
  responsibility?: string | null;
  status?: string | null;
  /** 'bevinding' of 'opmerking'. Bepaalt of impact en verantwoordelijkheid horen. */
  type?: string | null;
  /** SC-code zoals "1.1.1". Alleen gebruikt voor criterium-specifieke regels. */
  criterionCode?: string | null;
  /** Zet op true bij een bevinding over een PDF; activeert de tag-jargonregels. */
  isPdf?: boolean;
}

/** Eén match van een verboden term, met positie zodat we een excerpt kunnen tonen. */
interface TermRule {
  rule: string;
  pattern: RegExp;
  message: string;
  suggestion?: string;
  severity: LintSeverity;
  /** Alleen toepassen op deze velden. Default: description + advice. */
  fields?: Array<'description' | 'advice'>;
  /** Alleen toepassen wanneer de bevinding over een PDF gaat. */
  pdfOnly?: boolean;
}

const TEXT_RULES: TermRule[] = [
  {
    rule: 'no-em-dash',
    pattern: /[—–]/g,
    severity: 'error',
    message:
      'Gedachtestreepje gevonden. Splits de zin in twee zinnen of gebruik een komma.',
  },
  {
    rule: 'term-tekstalternatief',
    pattern: /tekstbeschrijving(en)?/gi,
    severity: 'error',
    message: 'Gebruik "tekstalternatief", niet "tekstbeschrijving".',
    suggestion: 'tekstalternatief',
  },
  {
    rule: 'geen-naam-niet-webadres',
    pattern: /\b(hoort|leest|krijgt)\b[^.]{0,60}\b(het\s+)?(webadres|de\s+url|de\s+link)\b[^.]{0,30}\b(voor|te horen)\b/gi,
    severity: 'warn',
    message:
      'Bij een leeg tekstalternatief hoort een schermlezergebruiker geen naam. Schrijf niet dat de URL wordt voorgelezen.',
    suggestion: 'hoort geen naam',
  },
  {
    rule: 'hulpsoftware-leest-voor',
    pattern: /\b(hulpsoftware|schermlezer(s)?|screenreader(s)?)\b[^.]{0,50}\b(laat\s+zien|toont|laten\s+zien)\b/gi,
    severity: 'error',
    message:
      'Hulpsoftware leest voor, die laat niets zien. Formuleer vanuit voorlezen of horen.',
    suggestion: 'leest ... voor',
  },
  {
    rule: 'hulpsoftware-gebruikers-zien',
    pattern: /gebruikers\s+van\s+(hulpsoftware|een\s+schermlezer)\s+zien\b/gi,
    severity: 'error',
    message: 'Formuleer vanuit horen, niet zien.',
    suggestion: 'gebruikers van hulpsoftware horen',
  },
  {
    rule: 'contrast-niet-afsteken',
    pattern: /steek?t?\s+(er\s+)?(voldoende\s+)?(van\s+)?af\b|afsteken\s+tegen/gi,
    severity: 'error',
    message:
      '"Afsteken" is beeldspraak vanuit het zien. Schrijf dat de tekst voldoende contrast heeft.',
    suggestion: 'voldoende contrast heeft',
  },
  {
    rule: 'jargon-dom',
    pattern: /\bDOM(-volgorde)?\b/g,
    severity: 'error',
    message: 'Vermijd "DOM". Schrijf "de code" of "de volgorde in de code".',
    suggestion: 'de volgorde in de code',
  },
  {
    rule: 'jargon-markup',
    pattern: /\bmarkup\b|\bnode(s)?\b/gi,
    severity: 'warn',
    message: 'Technisch jargon. Overweeg "code", "opmaak" of "element".',
  },
  {
    rule: 'alt-beschrijven',
    pattern: /beschrijft\s+niet\s+wat\s+er|niet\s+beschrijft\s+wat|de\s+afbeelding\s+te\s+beschrijven/gi,
    severity: 'warn',
    message:
      'Een tekstalternatief brengt informatie over, het beschrijft de afbeelding niet. Herformuleer richting "brengt de informatie niet over".',
  },
  {
    rule: 'pdf-tag-jargon',
    pattern: /<\/?(Figure|LBody|Lbl|ImageData|Artifact|StructElem)>?|\bImageData\b|\bAlt-attribuut\b/gi,
    severity: 'error',
    pdfOnly: true,
    message:
      'Geen PDF-tagjargon in de bevinding. Schrijf "afbeelding" en "tekstalternatief" in gewone taal.',
  },
  {
    rule: 'geen-toolnamen',
    pattern: /\b(Canva|InDesign|Microsoft\s+Word|\bWord\b)\b/g,
    severity: 'warn',
    fields: ['advice'],
    message:
      'Noem geen specifieke tool in het advies. Spreek over "het brondocument". (Acrobat mag wel bij concrete tag-stappen.)',
    suggestion: 'het brondocument',
  },
];

/** Regex die een http(s)-URL of een kaal domein met www. herkent. */
const URL_PATTERN = /https?:\/\/\S+|\bwww\.[a-z0-9-]+\.[a-z]{2,}\S*/gi;

function contextFor(text: string, index: number, length: number): string {
  const start = Math.max(0, index - 30);
  const end = Math.min(text.length, index + length + 30);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < text.length ? '…' : '';
  return `${prefix}${text.slice(start, end).replace(/\s+/g, ' ')}${suffix}`;
}

/** Telt zinnen, met een ruwe correctie voor afkortingen en SC-nummers. */
function countSentences(text: string): number {
  const masked = text
    .replace(/\b\d+\.\d+\.\d+\b/g, 'SC') // 1.1.1 telt niet als drie zinseindes
    .replace(/\b(bijv|bv|o\.a|d\.w\.z|etc)\./gi, '$1');
  const parts = masked.split(/[.!?]+(?:\s|$)/).filter((s) => s.trim().length > 0);
  return parts.length;
}

function lintText(
  field: 'description' | 'advice',
  text: string,
  draft: FindingDraft,
  issues: LintIssue[],
): void {
  for (const rule of TEXT_RULES) {
    if (rule.pdfOnly && !draft.isPdf) continue;
    const fields = rule.fields ?? ['description', 'advice'];
    if (!fields.includes(field)) continue;

    // Fresh regex per run: /g-regexes houden lastIndex vast tussen aanroepen.
    const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match: RegExpExecArray | null;
    const seen = new Set<string>();
    while ((match = pattern.exec(text)) !== null) {
      if (match[0].length === 0) {
        pattern.lastIndex++;
        continue;
      }
      // Dezelfde term twee keer in hetzelfde veld levert één melding op.
      const key = match[0].toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      issues.push({
        severity: rule.severity,
        rule: rule.rule,
        field,
        message: rule.message,
        excerpt: contextFor(text, match.index, match[0].length),
        suggestion: rule.suggestion,
      });
    }
  }
}

export function lintFinding(draft: FindingDraft): LintIssue[] {
  const issues: LintIssue[] = [];
  const description = (draft.description ?? '').trim();
  const advice = (draft.advice ?? '').trim();

  if (description) lintText('description', description, draft, issues);
  if (advice) lintText('advice', advice, draft, issues);

  // --- Regels die alleen op de description gelden -------------------------

  if (description) {
    // URL hoort niet in de description: die staat al bij het sample-item.
    const urlMatch = new RegExp(URL_PATTERN.source, URL_PATTERN.flags).exec(description);
    if (urlMatch) {
      issues.push({
        severity: 'error',
        rule: 'geen-url-in-description',
        field: 'description',
        message:
          'De URL staat al bij het sample-item. Begin met "Op de pagina", "In de footer" of een andere locatieaanduiding.',
        excerpt: contextFor(description, urlMatch.index, urlMatch[0].length),
      });
    }

    // Codeblok of losse HTML-dump onderaan de beschrijving.
    if (/```/.test(description) || /HTML\s+van\s+de/i.test(description)) {
      issues.push({
        severity: 'error',
        rule: 'geen-codeblok',
        field: 'description',
        message:
          'Geen codeblok of "HTML van de ..."-sectie. Noem de elementen inline in de lopende tekst.',
      });
    }

    // Opsomming van vindplaatsen: de sample-items tonen die al.
    const bulletLines = description
      .split('\n')
      .filter((l) => /^\s*[-*•]\s+/.test(l)).length;
    if (bulletLines >= 3) {
      issues.push({
        severity: 'warn',
        rule: 'geen-vindplaats-lijst',
        field: 'description',
        message: `${bulletLines} opsommingsregels gevonden. Houd het op één concreet voorbeeld; de sample-items tonen de rest. Maximaal twee à drie voorbeelden.`,
      });
    }

    const sentences = countSentences(description);
    if (sentences > 6) {
      issues.push({
        severity: 'warn',
        rule: 'kort-en-bondig',
        field: 'description',
        message: `De beschrijving telt ${sentences} zinnen. Richtlijn is drie zinnen bij een eenvoudig issue: locatie, kernprobleem, effect op de gebruiker. Kijk of er iets in zit dat onder een ander criterium hoort.`,
      });
    }
  } else {
    issues.push({
      severity: 'error',
      rule: 'description-verplicht',
      field: 'description',
      message: 'De beschrijving ontbreekt.',
    });
  }

  // --- Status, impact en verantwoordelijkheid -----------------------------

  // Bevinding of opmerking staat in het type-veld. Wordt dat niet meegegeven,
  // dan valt dit terug op de oude afleiding: een opmerking heeft geen impact.
  // Let op: status 'resolved' is géén signaal. Een afkeuring die bij de
  // herinspectie is opgelost staat ook op resolved en houdt zijn impact.
  const isOpmerking =
    draft.type != null ? draft.type === 'opmerking' : draft.impact == null;
  const hasImpact = !!draft.impact && draft.impact !== 'onbekend';
  const hasResponsibility = !!draft.responsibility && draft.responsibility !== 'onbekend';

  if (isOpmerking && hasImpact) {
    issues.push({
      severity: 'error',
      rule: 'opmerking-zonder-impact',
      field: 'impact',
      message: `Een opmerking krijgt geen impact. Nu ingevuld als "${draft.impact}". Laat leeg.`,
    });
  }
  if (isOpmerking && hasResponsibility) {
    issues.push({
      severity: 'error',
      rule: 'opmerking-zonder-verantwoordelijkheid',
      field: 'responsibility',
      message: `Een opmerking krijgt geen verantwoordelijkheid. Nu ingevuld als "${draft.responsibility}". Laat leeg.`,
    });
  }
  // Een afkeuring hoort impact en verantwoordelijkheid te hebben, ook als hij
  // inmiddels is opgelost: dat blijft een afkeuring, alleen met status resolved.
  if (!isOpmerking) {
    if (!draft.impact) {
      issues.push({
        severity: 'warn',
        rule: 'afkeuring-heeft-impact',
        field: 'impact',
        message: 'Een afkeuring hoort een impact te hebben.',
      });
    }
    if (!draft.responsibility) {
      issues.push({
        severity: 'warn',
        rule: 'afkeuring-heeft-verantwoordelijkheid',
        field: 'responsibility',
        message: 'Een afkeuring hoort een verantwoordelijkheid te hebben.',
      });
    }
  }

  // --- Criterium-specifiek ------------------------------------------------

  // Een niet-getagde PDF onder 1.1.1 is een opmerking, geen afkeuring: zonder
  // tags kun je niet vaststellen wat er ontbreekt.
  if (
    draft.criterionCode === '1.1.1' &&
    draft.status === 'open' &&
    /niet\s+getagd|geen\s+tags|ongetagd/i.test(description)
  ) {
    issues.push({
      severity: 'warn',
      rule: 'pdf-niet-getagd-is-opmerking',
      field: 'algemeen',
      message:
        'Een niet-getagde PDF onder 1.1.1 is een opmerking (status resolved), geen afkeuring. Zonder tags is niet vast te stellen wat er ontbreekt. De structuur onder 1.3.1 is wel een echte bevinding.',
    });
  }

  return issues;
}

/** Rendert het lint-resultaat als leesbare regels voor de terminal. */
export function formatLintIssues(issues: LintIssue[]): string {
  if (issues.length === 0) return 'Geen schrijfregel-problemen gevonden.';

  const errors = issues.filter((i) => i.severity === 'error');
  const warns = issues.filter((i) => i.severity === 'warn');
  const lines: string[] = [];

  const render = (issue: LintIssue) => {
    const label = issue.severity === 'error' ? 'FOUT' : 'LET OP';
    lines.push(`[${label}] ${issue.field} · ${issue.rule}`);
    lines.push(`  ${issue.message}`);
    if (issue.excerpt) lines.push(`  Gevonden: "${issue.excerpt}"`);
    if (issue.suggestion) lines.push(`  Beter: "${issue.suggestion}"`);
    lines.push('');
  };

  errors.forEach(render);
  warns.forEach(render);

  lines.push(
    `${errors.length} fout(en), ${warns.length} aandachtspunt(en). Aandachtspunten kunnen in context kloppen.`,
  );
  return lines.join('\n');
}
