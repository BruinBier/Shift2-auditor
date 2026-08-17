'use client';

/**
 * De taakstapel: één ding tegelijk. Beantwoordt "wat doe ik nu", niet "hoe staat
 * het ervoor" — daarvoor is de matrix.
 *
 * De stapel wordt altijd gevoed door een focus uit de matrix: een rij (criterium
 * over alle pagina's), een kolom (één pagina) of één cel.
 */

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Cel, Meting, Stand, Voorstel } from './gegevens';

type Taak =
  | { soort: 'vraag'; cel: Cel }
  | { soort: 'oordeel'; cel: Cel }
  | { soort: 'voorstel'; voorstel: Voorstel };

const OORDEEL_KLEUR: Record<string, string> = {
  voldoet: 'bg-green-100 text-green-800',
  afgekeurd: 'bg-red-100 text-red-800',
  opmerking: 'bg-amber-100 text-amber-800',
  niet_aanwezig: 'bg-gray-100 text-gray-600',
};

/** De statussen waar de onderzoeker een oordeel naartoe kan bijstellen. */
const OMZETBAAR: { waarde: 'voldoet' | 'afgekeurd' | 'opmerking' | 'niet_aanwezig' | 'niet_te_bepalen'; label: string }[] = [
  { waarde: 'voldoet', label: 'Voldoet' },
  { waarde: 'afgekeurd', label: 'Afgekeurd' },
  { waarde: 'opmerking', label: 'Opmerking' },
  { waarde: 'niet_aanwezig', label: 'Niet aanwezig' },
  { waarde: 'niet_te_bepalen', label: 'Moet ik zelf kijken' },
];

/** De huisregels die bij dit criterium horen, opgehaald zodat ze meekunnen. */
interface Huisregels {
  code: string;
  bestandsnaam: string;
  regels: string | null;
  schrijfregels: string | null;
  /** Welk deel van de pagina bij dit sample hoort. Bepaalt of de footer meetelt. */
  scope: string | null;
  /** Waarop een oordeel mag rusten, en wat je meelevert als bewijs. */
  bewijsvoering: string | null;
}

/**
 * Tekst naar het klembord, met een terugval.
 *
 * `navigator.clipboard` weigert zodra het document de focus kwijt is — en dat
 * gebeurt precies als je een nieuw tabblad opent. Het oude recept (een tekstvak
 * selecteren en execCommand) heeft die eis niet en vangt dat op.
 *
 * Geeft terug of het gelukt is, zodat de beller weet of hij het blok alsnog
 * zichtbaar moet maken. Stilzwijgend mislukken is hier het ergste wat er kan
 * gebeuren: je merkt het pas in het andere tabblad, als je niets kunt plakken.
 */
async function naarKlembord(tekst: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(tekst);
    return true;
  } catch {
    // Door naar de terugval.
  }
  try {
    const hulp = document.createElement('textarea');
    hulp.value = tekst;
    hulp.setAttribute('readonly', '');
    hulp.style.position = 'fixed';
    hulp.style.top = '0';
    hulp.style.opacity = '0';
    document.body.appendChild(hulp);
    hulp.select();
    const gelukt = document.execCommand('copy');
    document.body.removeChild(hulp);
    return gelukt;
  } catch {
    return false;
  }
}

/**
 * Het blok dat je meeneemt naar een AI als een oordeel of een voorstel niet deugt.
 *
 * "Klopt niet" bood alleen een andere status. Maar wat er mis is, is vaak niet de
 * status maar de tekst: een bevinding die twee dingen door elkaar haalt, een advies
 * dat het ene punt repareert door het andere kapot te maken. Daar is geen knop voor
 * te maken — daar moet je over praten.
 *
 * Het blok neemt de huisregels mee in plaats van ernaar te verwijzen. Een verwijzing
 * naar `wcag-regels/…` helpt alleen een assistent die in deze repository kan lezen;
 * plak je het in een gewoon chatvenster, dan is die verwijzing waardeloos. Zo werkt
 * het overal, en is het onderzoek van niemands gereedschap afhankelijk.
 *
 * Wat het gesprek oplevert hoort terug in wcag-regels/ — de chat waait weg, de regel
 * niet. Daarom vraagt het blok expliciet om een regel als uitkomst.
 */
function bespreekBlok(opties: {
  code: string;
  critTitel: string;
  sample: { title: string; url: string | null } | null;
  projectId: string;
  bezwaar: string;
  cel?: Cel | null;
  voorstellen: Voorstel[];
  huisregels: Huisregels | null;
}): string {
  const { code, critTitel, sample, projectId, bezwaar, cel, voorstellen, huisregels } =
    opties;
  const r: string[] = [];

  // De eerste regel wordt de naam van het gesprek: chatdiensten titelen een gesprek
  // naar het eerste bericht. Vandaar de bevindingcode vooraan — dan vind je het
  // gesprek later terug tussen twintig andere.
  const codes = voorstellen.map((v) => v.findingCode).filter(Boolean);
  r.push(
    `# Bezwaar ${codes.length ? `${codes.join(' en ')} — ` : ''}WCAG ${code} op ${
      sample?.title ?? 'een pagina'
    }`
  );
  r.push('');
  r.push(
    'Ik voer een WCAG 2.2-toegankelijkheidsonderzoek uit. Een geautomatiseerde auditor heeft'
  );
  r.push('hieronder een oordeel geveld dat volgens mij niet deugt. Denk met me mee.');
  r.push('');
  r.push('## Wat ik terug wil');
  r.push('');
  r.push('1. Klopt mijn bezwaar? Zeg het als ik ernaast zit — daar heb ik meer aan.');
  r.push(
    '2. Zo ja: een herschreven bevindingstekst en advies, of de conclusie dat het geen bevinding is.'
  );
  r.push(
    '3. Een regel van een paar zinnen die dit voor de volgende keer vastlegt, in de stijl van de huisregels hieronder.'
  );
  r.push('');
  r.push('Leg me je redenering gewoon uit — daar wil ik op kunnen reageren. Zet de');
  r.push('uitkomst daarna in twee losse blokken, want die lees ik machinaal terug in');
  r.push('mijn auditsysteem. Ze gaan elk naar een andere plek, dus houd ze gescheiden:');
  r.push('de regel geldt voor alle volgende audits, de tekst alleen voor dit geval.');
  r.push('Laat weg wat niet verandert.');
  r.push('');
  r.push('```regel');
  r.push('De regel die dit vastlegt voor de volgende keer, in lopende tekst.');
  r.push('Schrijf hem zo dat hij ook geldt voor een andere website en een');
  r.push('andere auditor. Noem de aanleiding niet — die voeg ik zelf toe.');
  r.push('```');
  r.push('');
  r.push('```tekst');
  r.push('bezwaar: terecht | onterecht');
  r.push('status: voldoet | afgekeurd | opmerking | niet_aanwezig | niet_te_bepalen');
  r.push('voorstel: behouden | herschrijven | afwijzen');
  r.push('type: bevinding | opmerking');
  r.push('impact: klein | matig | serieus | kritiek');
  r.push('bevinding: de herschreven bevindingstekst (mag over meer regels)');
  r.push('advies: het herschreven advies');
  r.push('```');
  r.push('');
  r.push('## De zaak');
  r.push('');
  r.push(`Criterium: ${code} — ${critTitel}`);
  r.push(`Pagina: ${sample?.title ?? '?'}${sample?.url ? ` — ${sample.url}` : ''}`);
  r.push(`Project: ${projectId}`);
  r.push('');
  r.push('### Mijn bezwaar');
  r.push('');
  r.push(bezwaar.trim() || '(nog niet ingevuld — ik licht het hieronder toe)');

  if (cel) {
    r.push('');
    r.push('### Het oordeel van de auditor');
    r.push('');
    r.push(`Status: ${cel.status}${cel.bron ? ` (via ${cel.bron})` : ''}`);
    r.push('');
    r.push(cel.reden ?? '(geen onderbouwing gegeven)');
  }

  for (const v of voorstellen) {
    r.push('');
    r.push(
      `### ${v.findingCode ?? 'Voorstel'} · ${v.type}${v.impact ? ` · impact ${v.impact}` : ''}`
    );
    r.push('');
    r.push(v.description || '(geen beschrijving)');
    if (v.advice) {
      r.push('');
      r.push('**Advies:**');
      r.push(v.advice);
    }
  }

  // De huisregels gaan integraal mee. Zonder die context beoordeelt een assistent
  // dit op algemene WCAG-kennis, en dan komt er iets uit dat hier niet past.
  r.push('');
  r.push('## De huisregels van dit onderzoeksbureau');
  r.push('');
  if (huisregels?.regels) {
    r.push(`Uit \`${huisregels.bestandsnaam}\`:`);
    r.push('');
    r.push(huisregels.regels.trim());
  } else {
    r.push(
      `Voor ${code} bestaat nog geen regelbestand. Als we het eens worden, is dat het eerste.`
    );
  }

  // Zonder de scoperegel is niet te beoordelen of de footer meetelt, en dat verandert
  // per sample: op de homepage wel, daarbuiten niet. Die werd wel opgehaald maar niet
  // meegestuurd, waardoor een assistent dat zelf moest verzinnen.
  if (huisregels?.scope) {
    r.push('');
    r.push('## Welk deel van de pagina hoort bij dit sample');
    r.push('');
    r.push(huisregels.scope.trim());
  }

  // Waarop een oordeel mag rusten. Zonder dit beoordeelt een assistent de bevinding
  // wel, maar niet of de onderbouwing eronder draagt — en juist daar zat vandaag de
  // helft van de problemen.
  if (huisregels?.bewijsvoering) {
    r.push('');
    r.push('## Waarop een oordeel mag rusten');
    r.push('');
    r.push(huisregels.bewijsvoering.trim());
  }

  if (huisregels?.schrijfregels) {
    r.push('');
    r.push('## Schrijfregels voor bevindingen');
    r.push('');
    r.push(huisregels.schrijfregels.trim());
  }

  return r.join('\n');
}

/**
 * Waar je het overleg voert. Geen voorkeur van het systeem: de lijst staat hier
 * zodat je hem kunt uitbreiden, en het blok werkt overal hetzelfde.
 *
 * Het blok gaat via het klembord, niet via de URL — 17 KB past niet in een
 * adresbalk. De dienst opent dus leeg en jij plakt. De naam van het gesprek komt
 * van de eerste regel van het blok, want daar titelen chatdiensten op.
 */
const DIENSTEN: { naam: string; url: string }[] = [
  { naam: 'Claude', url: 'https://claude.ai/new' },
  { naam: 'ChatGPT', url: 'https://chatgpt.com/' },
  { naam: 'Gemini', url: 'https://gemini.google.com/app' },
];

const DIENST_SLEUTEL = 'shift2:overleg-dienst';

function onthoudDienst(naam: string) {
  try {
    window.localStorage.setItem(DIENST_SLEUTEL, naam);
  } catch {
    // Opslag geweigerd; dan onthouden we het gewoon niet.
  }
}

function laatsteDienst(): string | null {
  try {
    return window.localStorage.getItem(DIENST_SLEUTEL);
  } catch {
    return null;
  }
}

export interface Uitkomst {
  bezwaar?: string;
  status?: string;
  voorstel?: string;
  type?: string;
  impact?: string;
  bevinding?: string;
  advies?: string;
  regel?: string;
}

const UITKOMST_SLEUTELS = [
  'bezwaar',
  'status',
  'voorstel',
  'type',
  'impact',
  'bevinding',
  'advies',
  'regel',
] as const;

/**
 * Haalt de inspringing van vervolgregels weg.
 *
 * Een taalmodel laat een lange waarde vaak inspringen zodat je ziet dat hij bij de
 * sleutel erboven hoort. Die spaties zouden anders letterlijk in de bevindingstekst
 * belanden, en die wordt met behoud van witruimte weergegeven — dan staat de tekst
 * scheef in het rapport.
 *
 * Alleen de gemeenschappelijke inspringing gaat eraf, zodat een opsomming die
 * werkelijk dieper staat dat blijft.
 */
function ontspring(regels: string[]): string[] {
  const [eerste, ...rest] = regels;
  const gevuld = rest.filter((r) => r.trim());
  if (!gevuld.length) return regels;

  const kleinste = Math.min(
    ...gevuld.map((r) => (r.match(/^[ \t]*/)?.[0].length ?? 0))
  );
  if (!kleinste) return regels;

  return [eerste, ...rest.map((r) => (r.trim() ? r.slice(kleinste) : r))];
}

/**
 * Laat een alinea weer aaneenlopen.
 *
 * Een taalmodel breekt lopende tekst af op zo'n zeventig tekens. Die afbrekingen
 * zitten in de tekst en blijven staan in het rapport, dat witruimte behoudt — dan
 * loopt een bevinding rafelig af halverwege elke zin, op plekken die niets met de
 * inhoud te maken hebben.
 *
 * Lege regels blijven alineagrenzen. Een opsommingsregel wordt niet aangeplakt, en
 * een regel die eindigt op een dubbele punt houdt zijn afbreking: daar is de
 * opmaak wel bedoeld.
 */
function laatDoorlopen(tekst: string): string {
  return tekst
    .split(/\n\s*\n/)
    .map((alinea) => {
      const regels = alinea.split('\n').map((r) => r.trim()).filter(Boolean);
      return regels.reduce((samen, regel) => {
        if (!samen) return regel;
        const opsomming = /^([-*•]|\d+[.)])\s/.test(regel);
        const naDubbelePunt = samen.endsWith(':');
        return opsomming || naDubbelePunt ? `${samen}\n${regel}` : `${samen} ${regel}`;
      }, '');
    })
    .join('\n\n');
}

/**
 * Leest het antwoordblok dat uit een overleg terugkomt.
 *
 * Vergevingsgezind met opzet: het komt uit een taalmodel, en een strikte lezer die
 * struikelt over een ontbrekende regel maakt het overleg waardeloos. Onbekende
 * sleutels worden genegeerd, een waarde loopt door tot de volgende bekende sleutel
 * (zodat een bevindingstekst over meer regels mag), en de omheining eromheen mag
 * ontbreken.
 *
 * Wat er niet in staat, verandert niet. Zo kun je ook alleen een regel terugsturen.
 */
/**
 * Leest het regelveld.
 *
 * Vrije tekst mag: wat je in dat veld plakt ís de regel. Staat er toch een
 * `regel:`-sleutel of een omheining omheen, dan wordt die eraf gehaald — je zult
 * nu eenmaal soms het hele antwoord in het verkeerde vak plakken.
 */
export function leesRegel(tekst: string): string | null {
  const omheind = tekst.match(/```(?:regel|uitkomst)?\s*\n([\s\S]*?)```/);
  let body = (omheind ? omheind[1] : tekst).trim();

  const metSleutel = body.match(/^\s*regel\s*:\s*([\s\S]*)$/i);
  if (metSleutel) body = metSleutel[1].trim();

  // De sjabloontekst uit het blok, ongewijzigd teruggeplakt.
  if (!body || body.startsWith('De regel die dit vastlegt')) return null;
  return laatDoorlopen(body);
}

export function leesUitkomst(tekst: string): Uitkomst | null {
  const omheind = tekst.match(/```(?:tekst|uitkomst)?\s*\n([\s\S]*?)```/);
  const body = omheind ? omheind[1] : tekst;

  const uit: Record<string, string[]> = {};
  let huidig: string | null = null;

  for (const regel of body.split('\n')) {
    const m = regel.match(/^\s*([a-z]+)\s*:\s*(.*)$/i);
    const sleutel = m ? m[1].toLowerCase() : null;
    if (sleutel && (UITKOMST_SLEUTELS as readonly string[]).includes(sleutel)) {
      huidig = sleutel;
      uit[huidig] = [m![2]];
    } else if (huidig) {
      uit[huidig].push(regel);
    }
  }

  const resultaat: Record<string, string> = {};
  for (const [k, regels] of Object.entries(uit)) {
    const waarde = ontspring(regels).join('\n').trim();
    // De sjabloonregels uit het blok zelf, ongewijzigd teruggeplakt.
    if (!waarde || waarde.includes(' | ')) continue;
    // Alleen lopende tekst herstellen; de korte keuzewaarden hebben het niet nodig.
    const lopend = k === 'bevinding' || k === 'advies' || k === 'regel';
    resultaat[k] = lopend ? laatDoorlopen(waarde) : waarde;
  }

  return Object.keys(resultaat).length ? (resultaat as Uitkomst) : null;
}

/**
 * Wat voor antwoord er bij een vraag past, per criterium.
 *
 * Hier stond één vast voorbeeld over een test met NVDA, en dat verscheen dus ook op een
 * contrastvraag — waar een schermlezer niets te zoeken heeft. Een voorbeeld dat niet
 * past stuurt de verkeerde kant op. Staat een criterium hier niet in, dan komt er een
 * neutrale aanwijzing; dat is beter dan een misleidende.
 */
const VOORBEELD_PER_CRITERIUM: Record<string, string> = {
  '1.4.3': 'Bijvoorbeeld: knop gemeten met de pipet, #ffffff op #007373 = 5,68:1',
  '1.4.11': 'Bijvoorbeeld: rand van het zoekveld tegen de foto, slechtste punt 2,4:1',
  '1.4.10': 'Bijvoorbeeld: op 320px geen horizontaal schuiven, menu klapt in en opent',
  '1.4.4': 'Bijvoorbeeld: op 200% zoom blijft alles leesbaar, niets valt weg',
  '2.1.1': 'Bijvoorbeeld: met Tab door het menu, alles bereikbaar, geen val',
  '2.1.2': 'Bijvoorbeeld: met Tab uit de mediaspeler gekomen zonder de muis',
  '2.4.3': 'Bijvoorbeeld: tabvolgorde loopt gelijk met de zichtbare volgorde',
  '2.4.7': 'Bijvoorbeeld: focusrand zichtbaar op alle links en knoppen',
  '2.5.3': 'Bijvoorbeeld: met NVDA voorgelezen, de naam bevat de zichtbare tekst',
  '4.1.2': 'Bijvoorbeeld: met NVDA getest, de suggesties worden aangekondigd',
  '4.1.3': 'Bijvoorbeeld: met NVDA getest, de melding wordt voorgelezen',
};

const IMPACT_KLEUR: Record<string, string> = {
  klein: 'bg-gray-100 text-gray-700',
  matig: 'bg-yellow-100 text-yellow-800',
  serieus: 'bg-orange-100 text-orange-800',
  kritiek: 'bg-red-100 text-red-800',
  onbekend: 'bg-gray-100 text-gray-700',
};

export default function Stapel({
  stand,
  focus,
  terug,
  projectId,
}: {
  stand: Stand;
  focus: string;
  terug: () => void;
  projectId: string;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  /** Welke uitgang de onderzoeker heeft aangeklikt, zolang de reden nog ontbreekt. */
  /**
   * `overleggen` is geen soort afkeuring maar een derde uitkomst. Het zat eerst in
   * het correctiepaneel, waardoor je eerst "klopt niet" moest zeggen en daarna in
   * een paneel met de kop "Wat moet het worden?" moest toegeven dat je dat juist
   * niet weet.
   */
  const [uitgang, setUitgang] = useState<
    'afwijzen' | 'doorzetten' | 'corrigeren' | 'overleggen' | null
  >(null);
  const [reden, setReden] = useState('');
  /** Het besprekingsblok, zichtbaar als het klembord niet beschikbaar is. */
  const [blok, setBlok] = useState<string | null>(null);
  const [gekopieerd, setGekopieerd] = useState(false);
  /** Wat er uit het overleg terugkomt, en wat ermee gebeurd is. */
  const [uitkomstTekst, setUitkomstTekst] = useState('');
  /** Het regelspoor apart, want het gaat naar een andere plek dan de tekst. */
  const [regelInvoer, setRegelInvoer] = useState('');
  const [gedaan, setGedaan] = useState<string[] | null>(null);
  /** Vooraf opgehaald, zodat de klik zelf niets meer hoeft af te wachten. */
  const [huisregels, setHuisregels] = useState<Huisregels | null>(null);
  /** Per meting de uitkomst van een hermeting, om naast de oude te zetten. */
  const [hermetingen, setHermetingen] = useState<
    Record<string, { bezig: boolean; toen?: string; nu?: string; gelijk?: boolean; fout?: string }>
  >({});

  /**
   * Een vastgelegde meting nog eens draaien.
   *
   * Vergelijkt op de samengevatte uitkomst uit het logboek, niet op het hele antwoord:
   * een tijdstempel of een bestandsnaam verschilt altijd, en dan zou elke hermeting
   * "afwijking" melden. Wat telt zijn de gemeten waarden — breedtes, kleuren, aantallen.
   */
  const meetOpnieuw = async (sleutel: string, m: Meting) => {
    setHermetingen((h) => ({ ...h, [sleutel]: { bezig: true } }));
    /**
     * De uitkomst als één regel, met de sleutels op alfabet.
     *
     * Dat sorteren is geen netheid maar noodzaak: PostgreSQL bewaart de sleutelvolgorde
     * van een JSONB-waarde niet. De opgeslagen meting komt er in een andere volgorde uit
     * dan hij erin ging, en zonder sorteren meldt de knop dan een afwijking terwijl er
     * niets is veranderd — bij elke klik.
     *
     * `alleenVergelijkbaar` laat de velden weg die vanzelf veranderen. De omvang van een
     * opgehaalde pagina of een schermafdruk schuift bij elk nieuw nieuwsbericht en bij
     * elke gewijzigde datum. Die meldden dan een afwijking die niets zegt over
     * toegankelijkheid, en een knop die bij elke redactionele wijziging alarm slaat kijkt
     * niemand meer na. Ze blijven wel zichtbaar op de kaart; ze bepalen alleen het
     * oordeel niet.
     */
    const VLUCHTIG = new Set(['bytes']);
    const samenvatting = (u: unknown, alleenVergelijkbaar = false) =>
      u && typeof u === 'object'
        ? Object.entries(u as Record<string, unknown>)
            .filter(([k]) => !(alleenVergelijkbaar && VLUCHTIG.has(k)))
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ') || '(niets vergelijkbaars)'
        : '(geen)';
    try {
      const res = await fetch('/api/meting/opnieuw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commando: m.commando, url: m.url, argumenten: m.argumenten ?? {} }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) {
        setHermetingen((h) => ({
          ...h,
          [sleutel]: { bezig: false, fout: j.error || 'De meting liep niet goed af' },
        }));
        return;
      }
      // Vergelijk de nieuwe LOGBOEKREGEL met de oude, niet met de weergave uit het
      // antwoord. Die weergave maakt waarden op — het logboek zegt paginabreedte 320,
      // de weergave "320px" — en dan meldt de knop bij elke klik een afwijking terwijl
      // er niets veranderd is. Zo'n knop is erger dan geen knop.
      // Tonen doen we alles, vergelijken alleen de velden die iets betekenen.
      const toenTekst = samenvatting(m.uitkomst);
      const nuTekst = samenvatting(j.logregel?.uitkomst);
      const gelijk =
        samenvatting(m.uitkomst, true) === samenvatting(j.logregel?.uitkomst, true);
      setHermetingen((h) => ({
        ...h,
        [sleutel]: { bezig: false, toen: toenTekst, nu: nuTekst, gelijk },
      }));
    } catch (e: any) {
      setHermetingen((h) => ({ ...h, [sleutel]: { bezig: false, fout: e.message } }));
    }
  };

  /**
   * Bouwt het besprekingsblok, zet het op het klembord en opent pas daarna de dienst.
   *
   * Die volgorde is het hele punt. Eerst openen leek logisch — dan is de klik nog
   * vers en houdt de popupblokkering niets tegen — maar het nieuwe tabblad pakt de
   * focus, en een document zonder focus mag niet naar het klembord schrijven. Het
   * gesprek opende dan met een leeg klembord, en dat merk je pas als je plakt.
   *
   * De huisregels zijn al opgehaald toen het paneel openging, zodat hier niets meer
   * te wachten valt: kopiëren en openen gebeuren ruim binnen de vijf seconden die
   * een klik geldig blijft.
   */
  const bespreek = async (
    code: string,
    bouw: (h: Huisregels | null) => string,
    dienst?: { naam: string; url: string }
  ) => {
    setBezig(true);
    try {
      let regels = huisregels?.code === code ? huisregels : null;
      if (!regels) {
        try {
          const res = await fetch(`/api/wcag-regels?code=${encodeURIComponent(code)}`);
          if (res.ok) {
            regels = await res.json();
            setHuisregels(regels);
          }
        } catch {
          // Netwerk weg; het blok gaat zonder regels mee.
        }
      }

      const tekst = bouw(regels);
      const gelukt = await naarKlembord(tekst);

      if (gelukt) {
        setGekopieerd(true);
        setBlok(null);
        setTimeout(() => setGekopieerd(false), 4000);
        if (dienst) {
          window.open(dienst.url, '_blank');
          onthoudDienst(dienst.naam);
        }
      } else {
        // Niet de dienst openen: je zou daar met een leeg klembord aankomen. Het
        // blok komt hier in beeld zodat je het zelf kunt selecteren.
        setBlok(tekst);
        setFout(
          'Kopiëren naar het klembord lukte niet. Selecteer het blok hieronder en kopieer het met Ctrl+C.'
        );
      }
    } finally {
      setBezig(false);
    }
  };

  /**
   * Het antwoord op een browservraag vastleggen.
   *
   * De workflow zet criteria die niet uit HTML te bepalen zijn op
   * 'niet_te_bepalen' met de vraag erbij. Tot nu toe was dat een leesscherm: je
   * ging kijken, en daarna stond de vraag er nog. Hier landt jouw antwoord, met
   * bron 'handmatig' — jij hebt gekeken, niet de agent.
   */
  /**
   * Schrijft een oordeel weg met een akkoord erop.
   *
   * `behoudReden` is voor het bevestigen van een bestaand oordeel: dan blijft de
   * onderbouwing van de auditor staan en zet jij er alleen je akkoord onder.
   * Bij een correctie of een antwoord op een vraag komt jouw eigen tekst erin.
   */
  const beantwoord = async (
    cel: Cel,
    status: 'voldoet' | 'afgekeurd' | 'opmerking' | 'niet_aanwezig' | 'niet_te_bepalen',
    opties: { behoudReden?: boolean; bron?: string; ookVoorstellen?: Voorstel[] } = {}
  ) => {
    setBezig(true);
    setFout(null);
    try {
      // Wachtende voorstellen op deze cel gaan mee: op de oordeelkaart staat hun
      // tekst en advies al, dus wie hier "Klopt" zegt heeft ze beoordeeld. Ze
      // eerst afhandelen, zodat een mislukking niet leidt tot een bevestigd
      // oordeel met een voorstel dat blijft hangen.
      for (const v of opties.ookVoorstellen ?? []) {
        const res = await fetch(`/api/projects/${projectId}/findings/${v.id}/beoordeling`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actie: 'akkoord', type: v.type }),
        });
        if (!res.ok) {
          const f = await res.json().catch(() => ({}));
          throw new Error(f.error || `Goedkeuren van ${v.findingCode ?? 'voorstel'} mislukte`);
        }
      }

      const res = await fetch(`/api/projects/${projectId}/criterion-checks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bron: opties.bron ?? 'handmatig',
          checks: [
            {
              sampleItemId: cel.sampleId,
              criterionCode: cel.code,
              status,
              reden: opties.behoudReden
                ? cel.reden ?? null
                : reden.trim() || cel.reden || null,
              akkoord: 'akkoord',
            },
          ],
        }),
      });
      const uitkomst = await res.json().catch(() => ({}));
      if (!res.ok || uitkomst.geschreven !== 1) {
        throw new Error(uitkomst.fouten?.[0] || uitkomst.error || 'Opslaan mislukt');
      }
      setUitgang(null);
      setReden('');
      router.refresh();
    } catch (e: any) {
      setFout(e.message);
    } finally {
      setBezig(false);
    }
  };

  const beoordeel = async (findingId: string, actie: string, type?: string) => {
    setBezig(true);
    setFout(null);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/findings/${findingId}/beoordeling`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actie, type, reden: reden.trim() || undefined }),
        }
      );
      if (!res.ok) {
        const f = await res.json().catch(() => ({}));
        throw new Error(f.error || 'Beoordelen mislukt');
      }
      setUitgang(null);
      setReden('');
      // De stand komt uit een server component; die moet opnieuw geladen worden.
      router.refresh();
    } catch (e: any) {
      setFout(e.message);
    } finally {
      setBezig(false);
    }
  };

  const stapel: Taak[] = useMemo(() => {
    const [soort, a, b] = focus.split(':');

    const past = (c: { sampleId: string | null; code: string }) => {
      if (soort === 'rij') return c.code === a;
      if (soort === 'kolom') return c.sampleId === a;
      if (soort === 'cel') return c.sampleId === a && c.code === b;
      return true;
    };

    const vragen = stand.cellen.filter((c) => c.status === 'niet_te_bepalen' && past(c));
    // Oordelen die de agent heeft geveld maar die nog geen akkoord hebben. Zonder
    // deze stap komt een agent-oordeel ongezien in het rapport terecht.
    // Ook de bevestigde oordelen blijven staan.
    //
    // Ze verdwenen zodra je op Klopt klikte, en daarmee verdween je werk uit het beeld:
    // terugkijken wat je hebt bevestigd kon alleen via de matrix of een adres. Een
    // afgevinkte regel hoort te blijven staan, zoals op een boodschappenlijst. De
    // stapel opent daarom wel op het eerste dat nog open is, anders scrol je eerst
    // langs alles wat al klaar is.
    const oordelen = stand.cellen.filter(
      (c) => c.status !== null && c.status !== 'niet_te_bepalen' && past(c)
    );

    // Hangt er een onbevestigd oordeel boven een voorstel, dan wordt dat voorstel
    // op de oordeelkaart afgehandeld: daar staat de onderbouwing, de bevindingtekst
    // en het advies al bij elkaar. Een losse voorstelkaart zou hetzelfde nog eens
    // vragen.
    const opOordeelkaart = new Set(oordelen.map((c) => `${c.sampleId}|${c.code}`));
    const voorstellen = stand.voorstellen.filter(
      (v) => past(v) && !opOordeelkaart.has(`${v.sampleId}|${v.code}`)
    );

    const alles: Taak[] = [
      ...oordelen.map((cel) => ({ soort: 'oordeel' as const, cel })),
      ...vragen.map((cel) => ({ soort: 'vraag' as const, cel })),
      ...voorstellen.map((voorstel) => ({ soort: 'voorstel' as const, voorstel })),
    ];

    // Op volgorde van succescriterium: 1.1.1, 1.2.1, 1.2.2, ... Zo loop je de
    // WCAG-lijst af zoals je hem kent, in plaats van per soort taak te springen.
    const codeVan = (t: Taak) => (t.soort === 'voorstel' ? t.voorstel.code : t.cel.code);
    const sampleVan = (t: Taak) => (t.soort === 'voorstel' ? t.voorstel.sampleId : t.cel.sampleId);
    const volgorde = new Map(stand.samples.map((s, i) => [s.id, i]));
    // Binnen dezelfde cel eerst het oordeel of de vraag, dan wat eruit voortkomt.
    const rang = { oordeel: 0, vraag: 0, voorstel: 1 } as const;

    return alles.sort((a, b) => {
      const ca = codeVan(a).split('.').map(Number);
      const cb = codeVan(b).split('.').map(Number);
      for (let i = 0; i < 3; i++) {
        const verschil = (ca[i] ?? 0) - (cb[i] ?? 0);
        if (verschil !== 0) return verschil;
      }
      const sa = volgorde.get(sampleVan(a) ?? '') ?? 999;
      const sb = volgorde.get(sampleVan(b) ?? '') ?? 999;
      if (sa !== sb) return sa - sb;
      return rang[a.soort] - rang[b.soort];
    });
  }, [stand, focus]);

  /**
   * Verwerkt de uitkomst van een overleg.
   *
   * Drie bestemmingen, en de derde is de reden dat dit bestaat: de regel gaat naar
   * wcag-regels/. Zonder die stap leert het systeem alleen bij als er toevallig
   * iemand met een editor meekijkt, en corrigeer je volgende maand dezelfde fout
   * opnieuw met de hand.
   *
   * Volgorde is niet willekeurig: eerst de regel (die staat los en is het meest
   * waard), dan de tekst van het voorstel, dan pas het oordeel. Zo leidt een fout
   * halverwege niet tot een bevestigd oordeel boven een tekst die niet is bijgewerkt.
   */
  const pasToe = async (
    uitkomst: Uitkomst,
    ctx: { code: string; cel?: Cel | null; voorstellen: Voorstel[]; aanleiding: string }
  ) => {
    setBezig(true);
    setFout(null);
    const stappen: string[] = [];
    try {
      if (uitkomst.regel) {
        const res = await fetch('/api/wcag-regels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: ctx.code,
            regel: uitkomst.regel,
            aanleiding: ctx.aanleiding,
          }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j.error || 'Regel vastleggen mislukte');
        stappen.push(
          `Regel toegevoegd aan ${j.bestandsnaam}${j.nieuwBestand ? ' (nieuw bestand)' : ''}`
        );
        // De opgeslagen huisregels zijn nu verouderd. Zonder dit weggooien zou een
        // volgende ronde overleg vertrekken met een briefing waarin de regel van
        // zojuist ontbreekt — en dan stelt de assistent hem doodleuk nog een keer
        // voor. Juist bij het slijpen van een bevinding, waar je een paar rondes
        // doet, is dat het verschil tussen bijleren en rondjes draaien.
        setHuisregels(null);
      }

      for (const v of ctx.voorstellen) {
        if (uitkomst.voorstel === 'afwijzen') {
          const res = await fetch(
            `/api/projects/${projectId}/findings/${v.id}/beoordeling`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                actie: 'afwijzen',
                reden: uitkomst.regel || reden.trim() || 'Afgewezen na overleg',
              }),
            }
          );
          if (!res.ok) throw new Error('Afwijzen mislukte');
          stappen.push(`${v.findingCode ?? 'Voorstel'} afgewezen`);
          continue;
        }

        const wijziging: Record<string, string> = {};
        if (uitkomst.bevinding) wijziging.description = uitkomst.bevinding;
        if (uitkomst.advies) wijziging.advice = uitkomst.advies;
        if (uitkomst.type) wijziging.type = uitkomst.type;
        if (uitkomst.impact && uitkomst.type !== 'opmerking')
          wijziging.impact = uitkomst.impact;

        if (Object.keys(wijziging).length) {
          const res = await fetch(`/api/projects/${projectId}/findings/${v.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(wijziging),
          });
          if (!res.ok) throw new Error(`Bijwerken van ${v.findingCode} mislukte`);
          stappen.push(
            `${v.findingCode ?? 'Voorstel'} bijgewerkt (${Object.keys(wijziging).join(', ')})`
          );
        }

        // De tekst is nu wat jullie hebben afgesproken, dus het voorstel is
        // beoordeeld. Alleen doorlaten als er ook een oordeel is meegekomen —
        // anders blijft het netjes wachten.
        if (uitkomst.status && uitkomst.status !== 'niet_te_bepalen') {
          const res = await fetch(
            `/api/projects/${projectId}/findings/${v.id}/beoordeling`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                actie: 'akkoord',
                type: uitkomst.type ?? v.type,
              }),
            }
          );
          if (!res.ok) throw new Error(`Akkoord op ${v.findingCode} mislukte`);
          stappen.push(`${v.findingCode ?? 'Voorstel'} akkoord bevonden`);
        }
      }

      if (uitkomst.status && ctx.cel) {
        const res = await fetch(`/api/projects/${projectId}/criterion-checks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bron: 'gesprek',
            checks: [
              {
                sampleItemId: ctx.cel.sampleId,
                criterionCode: ctx.cel.code,
                status: uitkomst.status,
                reden: ctx.cel.reden ?? null,
                akkoord: 'akkoord',
              },
            ],
          }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok || j.geschreven !== 1) {
          throw new Error(j.fouten?.[0] || j.error || 'Oordeel opslaan mislukte');
        }
        stappen.push(`Oordeel op ${ctx.code} gezet op ${uitkomst.status}`);
      }

      setGedaan(stappen);
      setUitkomstTekst('');
      setRegelInvoer('');
      // Paneel dicht: wat je hierna wilt is de nieuwe tekst lezen en beslissen, en
      // dat staat op de kaart eronder. Bleef het paneel open, dan moest je eerst een
      // knop "Terug" vinden voor je kon zien wat je zojuist had vastgelegd.
      setUitgang(null);
      setReden('');
      setBlok(null);
      router.refresh();
    } catch (e: any) {
      setFout(`${e.message}${stappen.length ? ` — wel gelukt: ${stappen.join('; ')}` : ''}`);
    } finally {
      setBezig(false);
    }
  };

  /**
   * Het overlegpaneel. Eén vorm voor de oordeelkaart en de voorstelkaart: waar je
   * ook vastloopt, je legt hetzelfde blok voor — en hier komt de uitkomst terug.
   */
  const overlegPaneel = (
    code: string,
    bouw: (h: Huisregels | null) => string,
    ctx: { cel?: Cel | null; voorstellen: Voorstel[]; aanleiding: string }
  ) => (
    <div className="mt-4 rounded border border-blue-300 bg-blue-50/40 p-3">
      <label className="mb-1 block text-sm font-medium text-gray-800">
        Wat klopt er niet aan?
      </label>
      <p className="mb-2 text-xs text-gray-600">
        Bijvoorbeeld: de bevinding haalt twee dingen door elkaar, het advies deugt niet,
        of dit is helemaal geen kwestie voor dit criterium. Mag ook leeg — dan licht je
        het in het gesprek toe.
      </p>
      <textarea
        value={reden}
        onChange={(e) => setReden(e.target.value)}
        rows={3}
        autoFocus
        className="w-full rounded border border-gray-300 p-2 text-sm"
        placeholder="Je bezwaar in je eigen woorden"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-700">Kopieer en open in:</span>
        {DIENSTEN.map((d) => (
          <button
            key={d.naam}
            type="button"
            disabled={bezig}
            onClick={() => bespreek(code, bouw, d)}
            className={`rounded px-3 py-1.5 text-sm font-medium disabled:opacity-40 ${
              d.naam === (laatsteDienst() ?? 'Claude')
                ? 'bg-blue-700 text-white hover:bg-blue-800'
                : 'border border-blue-300 text-blue-900 hover:bg-blue-100'
            }`}
          >
            {d.naam}
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={bezig}
          onClick={() => bespreek(code, bouw)}
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
        >
          {gekopieerd ? 'Gekopieerd' : 'Alleen kopiëren'}
        </button>
        <button
          type="button"
          onClick={() => {
            setUitgang(null);
            setReden('');
            setBlok(null);
          }}
          className="rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-white"
        >
          Terug
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-600">
        Het nieuwe gesprek opent leeg — plak het blok er met Ctrl+V in. Het krijgt dan
        vanzelf de naam{' '}
        <strong>
          Bezwaar{' '}
          {ctx.voorstellen.map((v) => v.findingCode).filter(Boolean).join(' en ') ||
            `WCAG ${code}`}
        </strong>
        . Je krijgt de zaak én de huisregels mee; er wordt niets opgeslagen.
      </p>
      {blok && (
        <textarea
          readOnly
          onFocus={(e) => e.currentTarget.select()}
          value={blok}
          rows={10}
          className="mt-2 w-full rounded border border-gray-300 p-2 font-mono text-xs"
        />
      )}

      {/* De terugweg. Zonder deze helft eindigt elk overleg in overtypen, en komt
          de regel alleen in wcag-regels/ als iemand daar met een editor bij kan. */}
      <div className="mt-4 border-t border-blue-200 pt-3">
        <p className="mb-1 text-sm font-medium text-gray-800">En terug: de uitkomst</p>
        <p className="mb-3 text-xs text-gray-600">
          Twee sporen, twee bestemmingen. De regel gaat naar{' '}
          <code className="rounded bg-white px-1">wcag-regels/</code> en geldt voor alle
          volgende audits; de tekst gaat naar deze ene bevinding.
        </p>

        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium text-gray-700">
            De regel — voor de volgende keer
          </label>
          <textarea
            value={regelInvoer}
            onChange={(e) => {
              setRegelInvoer(e.target.value);
              setGedaan(null);
            }}
            rows={4}
            className="w-full rounded border border-gray-300 p-2 text-xs"
            placeholder="Plak hier het regel-blok. Gewone tekst mag ook — wat hier staat, wordt de regel."
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            De tekst — voor deze bevinding
          </label>
          <textarea
            value={uitkomstTekst}
            onChange={(e) => {
              setUitkomstTekst(e.target.value);
              setGedaan(null);
            }}
            rows={5}
            className="w-full rounded border border-gray-300 p-2 font-mono text-xs"
            placeholder={'```tekst\nstatus: afgekeurd\nbevinding: …\nadvies: …\n```'}
          />
        </div>

        {(() => {
          const uitTekst = uitkomstTekst.trim() ? leesUitkomst(uitkomstTekst) : null;
          const regel = regelInvoer.trim() ? leesRegel(regelInvoer) : null;
          // Het regelveld wint: staat de regel in beide vakken, dan telt het vak dat
          // ervoor bedoeld is.
          const uitkomst: Uitkomst | null =
            uitTekst || regel ? { ...(uitTekst ?? {}), ...(regel ? { regel } : {}) } : null;

          if ((uitkomstTekst.trim() || regelInvoer.trim()) && !uitkomst) {
            return (
              <p className="mt-2 text-xs text-amber-800">
                Hier kan ik geen uitkomst in vinden. In het tekstvak horen regels als{' '}
                <code>sleutel: waarde</code>; in het regelvak mag gewone tekst.
              </p>
            );
          }
          if (!uitkomst) return null;
          return (
            <div className="mt-2">
              <p className="mb-1 text-xs font-medium text-gray-700">Dit ga ik doen:</p>
              <ul className="mb-2 list-inside list-disc space-y-0.5 text-xs text-gray-700">
                {uitkomst.regel && (
                  <li>
                    De regel vastleggen in{' '}
                    <code className="rounded bg-white px-1">
                      Shift2_Regels_SC_{code.replace(/\./g, '_')}.md
                    </code>
                  </li>
                )}
                {uitkomst.voorstel === 'afwijzen' ? (
                  ctx.voorstellen.map((v) => (
                    <li key={v.id}>{v.findingCode} afwijzen</li>
                  ))
                ) : (
                  <>
                    {(uitkomst.bevinding || uitkomst.advies) &&
                      ctx.voorstellen.map((v) => (
                        <li key={v.id}>
                          {v.findingCode} de nieuwe tekst geven
                          {uitkomst.type ? ` als ${uitkomst.type}` : ''}
                        </li>
                      ))}
                    {uitkomst.status &&
                      ctx.voorstellen.map((v) => (
                        <li key={`a-${v.id}`}>{v.findingCode} akkoord bevinden</li>
                      ))}
                  </>
                )}
                {uitkomst.status && ctx.cel && (
                  <li>
                    Het oordeel op <strong>{uitkomst.status}</strong> zetten en bevestigen
                  </li>
                )}
              </ul>
              {/* De teksten zelf erbij. Je overschrijft een bevinding en legt een
                  regel vast waar de volgende auditronde op afgaat; dat hoor je te
                  lezen voor je klikt, niet erna. */}
              {(
                [
                  ['Nieuwe bevindingstekst', uitkomst.bevinding],
                  ['Nieuw advies', uitkomst.advies],
                  ['Regel die wordt vastgelegd', uitkomst.regel],
                ] as const
              ).map(([kop, tekst]) =>
                tekst ? (
                  <div key={kop} className="mb-2">
                    <p className="mb-0.5 text-xs font-medium text-gray-500">{kop}</p>
                    <p className="max-h-40 overflow-y-auto whitespace-pre-line rounded border border-gray-200 bg-white p-2 text-xs leading-relaxed text-gray-800">
                      {tekst}
                    </p>
                  </div>
                ) : null
              )}
              <button
                type="button"
                disabled={bezig}
                onClick={() => pasToe(uitkomst, { code, ...ctx })}
                className="rounded bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-black disabled:opacity-40"
              >
                Toepassen
              </button>
            </div>
          );
        })()}

      </div>
    </div>
  );

  /** Wat het laatste overleg heeft opgeleverd, op de kaart zelf. */
  const verwerktMelding = gedaan && (
    <div className="mb-3 rounded border border-green-300 bg-green-50 p-3">
      <p className="mb-1 text-xs font-medium text-green-900">
        Verwerkt — kijk hieronder na of het klopt en beslis dan:
      </p>
      <ul className="list-inside list-disc space-y-0.5 text-xs text-green-900">
        {gedaan.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </div>
  );

  /**
   * De twee blokken onder de onderbouwing: waarop het oordeel rust, en of dat
   * standhoudt.
   *
   * Het commando staat er als leesbare regel, om te lezen en te kopiëren. "Nog eens
   * meten" stuurt die tekst NIET naar de server — dat zou betekenen dat iets uit de
   * database als code op deze machine kan draaien. De knop stuurt de commandonaam en
   * de losse argumenten, en de route houdt die tegen een vaste lijst.
   */
  const bewijsBlokken = (cel: Cel) => {
    const metingen = cel.verantwoording ?? [];
    const controle = cel.controle;
    const TEKEN: Record<string, string> = { ja: '✓', nee: '✗', nvt: '—' };

    return (
      <>
        <div className="mb-4 border-t border-gray-200 pt-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
            Zo is het vastgesteld
          </p>
          {metingen.length === 0 ? (
            <p className="text-sm text-gray-500">
              Geen metingen vastgelegd. Dit oordeel is in overleg of met de hand tot stand
              gekomen.
            </p>
          ) : (
            <ul className="space-y-2">
              {metingen.map((m, i) => {
                // Een aan-uit-vlag schrijf je zonder waarde: --text, niet --text=true.
                // Beide werken, maar de regel is er om over te typen en zo typt niemand
                // het. Vlaggen met een echte waarde (--breedte=320) houden hun waarde.
                const regel = `npm run cli -- ${m.commando} ${m.url ?? ''}${Object.entries(
                  m.argumenten ?? {}
                )
                  .map(([k, v]) => (v === 'true' ? ` --${k}` : ` --${k}=${v}`))
                  .join('')}`.trim();
                const sleutel = `${m.commando}-${m.tijd ?? i}`;
                const hermeting = hermetingen[sleutel];
                return (
                  <li key={sleutel} className="rounded border border-gray-200 bg-gray-50 p-2">
                    <code className="block break-all font-mono text-xs text-gray-800">
                      {regel}
                    </code>
                    <p className="mt-1 text-xs text-gray-500">
                      {m.tijd ? new Date(m.tijd).toLocaleString('nl-NL') : 'tijd onbekend'}
                      {m.keer && m.keer > 1 ? ` (${m.keer}e keer)` : ''}
                      {m.browser ? ` · ${m.browser}` : ''}
                      {m.uitkomst
                        ? ` · ${Object.entries(m.uitkomst)
                            // Een geneste waarde als tekst geeft "[object Object]", en dat
                            // is precies de plek waar de uitsplitsing per zijde staat — de
                            // interessantste helft van een randmeting.
                            .map(([k, v]) =>
                              v !== null && typeof v === 'object'
                                ? `${k}: ${Object.entries(v as Record<string, unknown>)
                                    .map(([z, w]) => `${z} ${w}`)
                                    .join(' / ')}`
                                : `${k}: ${v}`
                            )
                            .join(', ')}`
                        : ''}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => naarKlembord(regel)}
                        className="rounded border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        Kopieer
                      </button>
                      <button
                        type="button"
                        disabled={hermeting?.bezig}
                        onClick={() => meetOpnieuw(sleutel, m)}
                        className="rounded border border-blue-300 bg-blue-50 px-2 py-0.5 text-xs text-blue-900 hover:bg-blue-100 disabled:opacity-40"
                      >
                        {hermeting?.bezig ? 'Bezig…' : 'Nog eens meten'}
                      </button>
                    </div>
                    {/* Het beeld erbij, niet alleen de bestandsnaam. Een meting die
                        "nul elementen te breed" zegt is pas te vertrouwen als je ernaar
                        kunt kijken — dat is de reden dat get-reflow een schermafdruk
                        maakt. Klein weergegeven, klikken opent hem op ware grootte. */}
                    {(() => {
                      const bestandsnaam = (p: string) => p.split(/[\\/]/).pop()!;
                      const bron = (p: string) =>
                        `/api/meting/artefact?pad=${encodeURIComponent(bestandsnaam(p))}`;
                      const isBeeld = (p: string) => /\.(png|jpe?g)$/i.test(p);

                      // Het beeld en het bestand zijn twee dingen. Bij get-html is het
                      // artefact de opgehaalde tekst en de schermafdruk het beeld ernaast;
                      // bij get-reflow zijn ze hetzelfde bestand. Toonde de kaart alleen
                      // het artefact, dan stond er bij een tekst-ophaling een .txt en
                      // verder niets om naar te kijken.
                      const beeld =
                        m.schermafdruk ?? (m.artefact && isBeeld(m.artefact) ? m.artefact : null);
                      const bestand = m.artefact && !isBeeld(m.artefact) ? m.artefact : null;
                      if (!beeld && !bestand) return null;

                      return (
                        <div className="mt-2 space-y-1">
                          {beeld && (
                            <>
                              {/* In welke weergave, boven het beeld. Een oordeel dat op de
                                  hoogcontrastweergave rust met opnamen in gewone kleuren
                                  eronder leest als een fout, en dat is het soms ook. */}
                              <p
                                className={`text-xs ${
                                  !m.weergave
                                    ? 'text-amber-800'
                                    : m.weergave === 'standaardweergave'
                                    ? 'text-gray-500'
                                    : 'font-medium text-purple-800'
                                }`}
                              >
                                {!m.weergave
                                  ? 'Weergave niet vastgelegd'
                                  : m.weergave === 'standaardweergave'
                                  ? 'Standaardweergave'
                                  : `Hoogcontrastweergave — ${m.weergave}`}
                              </p>
                              <a
                                href={bron(beeld)}
                                target="_blank"
                                rel="noreferrer"
                                title={bestandsnaam(beeld)}
                                className="block"
                              >
                                <img
                                  src={bron(beeld)}
                                  alt={`Schermafdruk van de meting ${m.commando}${
                                    m.weergave ? `, ${m.weergave}` : ''
                                  }`}
                                  className="max-h-64 rounded border border-gray-300 bg-white"
                                />
                              </a>
                            </>
                          )}
                          {bestand && (
                            <a
                              href={bron(bestand)}
                              target="_blank"
                              rel="noreferrer"
                              className="block text-xs text-blue-800 underline"
                            >
                              {bestandsnaam(bestand)}
                            </a>
                          )}
                          {!beeld && (
                            <p className="text-xs text-gray-500">
                              Bij deze meting is geen schermafdruk vastgelegd. Draai hem opnieuw
                              met &ldquo;Nog eens meten&rdquo;; sinds 17 augustus laat elke meting
                              er een achter.
                            </p>
                          )}
                        </div>
                      );
                    })()}
                    {hermeting && !hermeting.bezig && (
                      <div className="mt-2 rounded border border-gray-200 bg-white p-2 text-xs">
                        {hermeting.fout ? (
                          <p className="text-red-800">{hermeting.fout}</p>
                        ) : (
                          <>
                            <p className="text-gray-500">Toen: {hermeting.toen}</p>
                            <p
                              className={
                                hermeting.gelijk ? 'text-green-800' : 'font-medium text-amber-800'
                              }
                            >
                              Nu: {hermeting.nu} {hermeting.gelijk ? '— gelijk' : '— AFWIJKING'}
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mb-4 border-t border-gray-200 pt-3">
          {/* Twee nakijkers, en die worden apart genoemd.
              Eerder stond hier één kop over de tweede agent, met "Niet door een tweede
              agent nagekeken" als er niets was — en dat las als "er is niet naar gekeken",
              ook op een oordeel dat de onderzoeker zelf had bevestigd. Zijn akkoord ís
              nakijken, en het zwaarste: zonder dat telt een oordeel nergens mee. Dus staat
              dat bovenaan, in eigen woorden, en de tweede agent eronder. */}
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
            Nagekeken
          </p>

          <p
            className={`text-sm ${
              cel.akkoord === 'akkoord'
                ? 'font-medium text-green-800'
                : cel.akkoord === 'afgewezen'
                  ? 'font-medium text-red-800'
                  : 'text-amber-800'
            }`}
          >
            {cel.akkoord === 'akkoord'
              ? '✓ Door jou nagekeken en akkoord bevonden.'
              : cel.akkoord === 'afgewezen'
                ? '✗ Door jou afgewezen.'
                : 'Nog niet door jou nagekeken — dit wacht op je akkoord.'}
          </p>

          <div className="mt-3">
            {/* Wat dit is, in plaats van een naam die niemand kan plaatsen.
                "Een tweede agent liep de bewijsvoering na — nee, dat is niet gebeurd"
                noemt eerst iets en ontkent het dan, en laat in het midden waar het over
                gaat. Het gaat om de tweede fase van de audit-workflow: een aparte agent
                legt de onderbouwing langs de checklist in Shift2_Bewijsvoering.md. Die
                draait alleen mee als de workflow het oordeel maakt.

                Weglaten kan niet: dan ziet "niet gecontroleerd" er hetzelfde uit als
                "gecontroleerd en in orde", en dat is de fout waar dit hele tabblad voor
                bestaat. */}
            {!controle?.punten?.length ? (
              <p className="text-sm text-gray-500">
                Er heeft niemand nagerekend of het verhaal hierboven klopt met wat er
                werkelijk is gemeten. Dat doet een tweede agent, maar alleen als een pagina
                in één ronde wordt nagelopen —{' '}
                {cel.bron === 'gesprek'
                  ? 'dit oordeel is hier in het gesprek ontstaan.'
                  : cel.bron === 'handmatig'
                    ? 'dit oordeel is met de hand gezet.'
                    : 'bij dit oordeel is dat niet gebeurd.'}
              </p>
            ) : (
              <>
                <p className="text-xs text-gray-500">
                  Een tweede agent heeft het verhaal hierboven naast de metingen gelegd
                  {controle.bevestigd === true && ' — het oordeel bleef staan'}
                  {controle.bevestigd === false && ' — het oordeel hield geen stand'}
                </p>
                <ul className="mt-1 space-y-1">
                  {controle.punten.map((p, i) => (
                  <li key={i} className="text-sm">
                    <span
                      className={
                        p.uitkomst === 'nee'
                          ? 'font-medium text-red-700'
                          : p.uitkomst === 'ja'
                            ? 'text-green-700'
                            : 'text-gray-400'
                      }
                    >
                      {TEKEN[p.uitkomst] ?? '—'}
                    </span>{' '}
                    <span className={p.uitkomst === 'nee' ? 'text-gray-900' : 'text-gray-600'}>
                      {p.punt}
                    </span>
                      {p.toelichting && (
                        <span className="text-gray-600"> — {p.toelichting}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </>
    );
  };

  const sampleVoor = (id: string | null) =>
    id ? stand.samples.find((s) => s.id === id) ?? null : null;
  const sampleTitel = (id: string | null) =>
    id ? stand.samples.find((s) => s.id === id)?.title ?? id : 'geen pagina';
  const critTitel = (code: string) => stand.criteria.find((c) => c.code === code)?.titleNl ?? '';

  const focusLabel = (() => {
    const [soort, a, b] = focus.split(':');
    if (soort === 'rij') return `${a} — ${critTitel(a)}, over alle pagina's`;
    if (soort === 'kolom') return sampleTitel(a);
    if (soort === 'cel') return `${b} op ${sampleTitel(a)}`;
    return focus;
  })();

  const positie = Math.min(index, Math.max(stapel.length - 1, 0));
  const huidig = stapel[positie];

  /** Is deze taak al afgehandeld? Een voorstel is dat nooit; die staat er tot je kiest. */
  const isAf = (t: Taak) => t.soort !== 'voorstel' && t.cel.akkoord === 'akkoord';
  const aantalAf = stapel.filter(isAf).length;

  /**
   * Open de stapel op het eerste dat nog open staat.
   *
   * Nu de bevestigde oordelen blijven staan, zou je anders bij elke werklijst eerst
   * langs alles moeten scrollen wat al klaar is — op Home zijn dat er veertien.
   * Eén keer per werklijst, zodat je daarna zelf kunt terugbladeren zonder dat de
   * stapel je terugduwt.
   */
  const [gepositioneerdVoor, setGepositioneerdVoor] = useState<string | null>(null);
  useEffect(() => {
    if (gepositioneerdVoor === focus || !stapel.length) return;
    const eerste = stapel.findIndex((t) => !isAf(t));
    setIndex(eerste >= 0 ? eerste : 0);
    setGepositioneerdVoor(focus);
  }, [focus, stapel, gepositioneerdVoor]);

  // De voorstellen die op deze cel wachten. Die staan op de oordeelkaart en gaan
  // mee met "Klopt" — een losse kaart zou hetzelfde nog eens vragen.
  const wachtendeVoorstellen =
    huidig?.soort === 'oordeel'
      ? stand.voorstellen.filter(
          (v) => v.sampleId === huidig.cel.sampleId && v.code === huidig.cel.code
        )
      : [];

  const huidigeCode = huidig
    ? huidig.soort === 'voorstel'
      ? huidig.voorstel.code
      : huidig.cel.code
    : null;

  /**
   * De huisregels ophalen zodra het overlegpaneel opengaat.
   *
   * Deden we dit tijdens de klik, dan zat er een netwerkverzoek tussen de klik en
   * het schrijven naar het klembord — en juist in dat gaatje gaat het mis met de
   * focus en de popupblokkering. Nu is bij de klik alles al binnen.
   */
  useEffect(() => {
    if (uitgang !== 'overleggen' || !huidigeCode) return;
    if (huisregels?.code === huidigeCode) return;

    let afgebroken = false;
    fetch(`/api/wcag-regels?code=${encodeURIComponent(huidigeCode)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!afgebroken && j) setHuisregels(j);
      })
      .catch(() => {
        // Zonder regels werkt het blok ook; dan valt bespreek() erop terug.
      });
    return () => {
      afgebroken = true;
    };
  }, [uitgang, huidigeCode, huisregels]);

  const balk = (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white">
      <span>
        Werklijst: <strong>{focusLabel}</strong>
      </span>
      <button
        type="button"
        onClick={terug}
        className="rounded bg-white/15 px-2 py-1 text-xs hover:bg-white/25"
      >
        Terug naar de matrix
      </button>
    </div>
  );

  if (!huidig) {
    return (
      <div className="mx-auto max-w-2xl">
        {balk}
        <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center">
          <p className="text-lg font-medium text-green-900">Hier ligt niets meer.</p>
          <p className="mt-1 text-sm text-green-700">
            Geen openstaande vragen en geen voorstellen binnen deze selectie.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {balk}

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {positie + 1} van <strong className="text-gray-900">{stapel.length}</strong>
          {aantalAf > 0 && (
            <span className="text-gray-500"> · {aantalAf} bevestigd</span>
          )}
        </span>
        <div className="flex gap-2">
          {/* Bij het wisselen van kaart moet de melding van de vorige weg: die gaat
              over een andere bevinding en zou hier iets beweren dat niet is gebeurd. */}
          <button
            type="button"
            onClick={() => {
              setIndex((i) => Math.max(0, i - 1));
              setGedaan(null);
              setFout(null);
            }}
            disabled={positie === 0}
            className="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-40"
          >
            Vorige
          </button>
          <button
            type="button"
            onClick={() => {
              setIndex((i) => Math.min(stapel.length - 1, i + 1));
              setGedaan(null);
              setFout(null);
            }}
            disabled={positie >= stapel.length - 1}
            className="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-40"
          >
            Volgende
          </button>
        </div>
      </div>

      {huidig.soort === 'oordeel' ? (
        <div className="rounded-lg border border-gray-300 bg-white p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded bg-blue-50 px-2 py-0.5 font-medium text-blue-900">
              Oordeel van de agent
            </span>
            <span
              className={`rounded px-2 py-0.5 font-medium ${
                OORDEEL_KLEUR[huidig.cel.status ?? ''] ?? 'bg-gray-100 text-gray-700'
              }`}
            >
              {huidig.cel.status}
            </span>
            {huidig.cel.bron && (
              <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-600">
                via {huidig.cel.bron}
              </span>
            )}
          </div>

          <p className="mb-1 text-sm text-gray-500">
            {huidig.cel.code} — {critTitel(huidig.cel.code)} · {sampleTitel(huidig.cel.sampleId)}
          </p>
          <p className="mb-4 whitespace-pre-line leading-relaxed text-gray-900">
            {huidig.cel.reden ?? '(geen onderbouwing gegeven)'}
          </p>

          {wachtendeVoorstellen.length > 0 && (
            <div className="mb-4 space-y-2 rounded border border-purple-200 bg-purple-50 p-3">
              <p className="text-xs font-medium text-purple-900">
                {wachtendeVoorstellen.length === 1
                  ? 'Dit voorstel wacht op akkoord en wordt goedgekeurd als je "Klopt" kiest:'
                  : `Deze ${wachtendeVoorstellen.length} voorstellen wachten op akkoord en worden goedgekeurd als je "Klopt" kiest:`}
              </p>
              {wachtendeVoorstellen.map((v) => (
                <div key={v.id} className="rounded bg-white p-3 text-sm">
                  <p className="mb-1 text-xs text-gray-500">
                    {v.findingCode} · {v.type}
                    {v.impact ? ` · ${v.impact}` : ''}
                  </p>
                  <p className="whitespace-pre-line text-gray-800">{v.description}</p>
                  {v.advice && (
                    <div className="mt-2 border-t border-gray-200 pt-2">
                      <p className="mb-0.5 text-xs font-medium text-gray-500">Advies</p>
                      <p className="whitespace-pre-line text-gray-700">{v.advice}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {huidig.cel.bevindingen.length > 0 && (
            <div className="mb-4 space-y-2">
              {huidig.cel.bevindingen.map((b) => (
                <div key={b.id} className="rounded bg-gray-50 p-3 text-sm">
                  <p className="mb-1 text-xs text-gray-500">
                    {b.findingCode} · {b.type}
                    {b.impact ? ` · ${b.impact}` : ''}
                  </p>
                  <p className="whitespace-pre-line text-gray-800">{b.description}</p>
                  {/* Het advies hoort erbij: een terechte bevinding met een
                      onbruikbaar advies is nog steeds niet goed. */}
                  {b.advice && (
                    <div className="mt-2 border-t border-gray-200 pt-2">
                      <p className="mb-0.5 text-xs font-medium text-gray-500">Advies</p>
                      <p className="whitespace-pre-line text-gray-700">{b.advice}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {bewijsBlokken(huidig.cel)}

          {verwerktMelding}
          {fout && <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-800">{fout}</p>}

          {uitgang === 'corrigeren' ? (
            <div className="rounded border border-gray-300 p-3">
              <p className="mb-2 text-sm font-medium text-gray-800">Wat moet het worden?</p>
              <textarea
                value={reden}
                onChange={(e) => setReden(e.target.value)}
                rows={2}
                className="mb-2 w-full rounded border border-gray-300 p-2 text-sm"
                placeholder="Toelichting (laat leeg om die van de agent te behouden)"
              />
              <div className="flex flex-wrap gap-2">
                {OMZETBAAR.filter((o) => o.waarde !== huidig.cel.status).map((o) => (
                  <button
                    key={o.waarde}
                    type="button"
                    disabled={bezig}
                    onClick={() => beantwoord(huidig.cel, o.waarde)}
                    className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                  >
                    {o.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setUitgang(null);
                    setReden('');
                  }}
                  className="rounded px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50"
                >
                  Annuleren
                </button>
              </div>

            </div>
          ) : uitgang === 'overleggen' ? (
            overlegPaneel(
              huidig.cel.code,
              (huisregels) =>
                bespreekBlok({
                  code: huidig.cel.code,
                  critTitel: critTitel(huidig.cel.code),
                  sample: sampleVoor(huidig.cel.sampleId),
                  projectId,
                  bezwaar: reden,
                  cel: huidig.cel,
                  voorstellen: wachtendeVoorstellen,
                  huisregels,
                }),
              {
                cel: huidig.cel,
                voorstellen: wachtendeVoorstellen,
                aanleiding: `${huidig.cel.code} op ${sampleTitel(huidig.cel.sampleId)}${
                  wachtendeVoorstellen.length
                    ? ` (${wachtendeVoorstellen.map((v) => v.findingCode).join(', ')})`
                    : ''
                }`,
              }
            )
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={bezig}
                onClick={() =>
                  beantwoord(huidig.cel, huidig.cel.status as any, {
                    behoudReden: true,
                    bron: huidig.cel.bron ?? 'workflow',
                    ookVoorstellen: wachtendeVoorstellen,
                  })
                }
                className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-40"
              >
                {wachtendeVoorstellen.length > 0
                  ? `Klopt — en keur ${wachtendeVoorstellen.length === 1 ? 'het voorstel' : 'de voorstellen'} goed`
                  : 'Klopt'}
              </button>
              <button
                type="button"
                disabled={bezig}
                onClick={() => setUitgang('corrigeren')}
                className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                Klopt niet
              </button>
              {/* Derde uitkomst, naast eens en oneens: je weet dat er iets niet
                  deugt maar nog niet wat het moet worden. */}
              <button
                type="button"
                disabled={bezig}
                onClick={() => setUitgang('overleggen')}
                className="rounded border border-blue-300 px-4 py-2 text-sm text-blue-900 hover:bg-blue-50 disabled:opacity-40"
              >
                Overleggen
              </button>
            </div>
          )}
        </div>
      ) : huidig.soort === 'voorstel' ? (
        <div className="rounded-lg border border-gray-300 bg-white p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded bg-purple-100 px-2 py-0.5 font-medium text-purple-800">
              Wacht op akkoord
            </span>
            <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-700">
              {huidig.voorstel.type === 'opmerking' ? 'Opmerking' : 'Bevinding'}
            </span>
            {huidig.voorstel.impact && (
              <span
                className={`rounded px-2 py-0.5 ${
                  IMPACT_KLEUR[huidig.voorstel.impact] ?? 'bg-gray-100 text-gray-700'
                }`}
              >
                {huidig.voorstel.impact}
              </span>
            )}
          </div>

          <p className="mb-1 text-sm text-gray-500">
            {huidig.voorstel.findingCode && (
              <span className="font-mono font-medium text-gray-900">
                {huidig.voorstel.findingCode} ·{' '}
              </span>
            )}
            {huidig.voorstel.code} — {critTitel(huidig.voorstel.code)} ·{' '}
            {sampleTitel(huidig.voorstel.sampleId)}
          </p>
          <p className="mb-4 whitespace-pre-line leading-relaxed text-gray-900">
            {huidig.voorstel.description}
          </p>
          {huidig.voorstel.advice && (
            <div className="rounded bg-gray-50 p-3">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                Advies
              </p>
              <p className="whitespace-pre-line leading-relaxed text-gray-800">
                {huidig.voorstel.advice}
              </p>
            </div>
          )}

          {verwerktMelding}
          {fout && (
            <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-800">{fout}</p>
          )}

          {uitgang === 'overleggen' ? (
            overlegPaneel(
              huidig.voorstel.code,
              (huisregels) =>
                bespreekBlok({
                  code: huidig.voorstel.code,
                  critTitel: critTitel(huidig.voorstel.code),
                  sample: sampleVoor(huidig.voorstel.sampleId),
                  projectId,
                  bezwaar: reden,
                  cel: stand.celVoor(huidig.voorstel.sampleId ?? '', huidig.voorstel.code),
                  voorstellen: [huidig.voorstel],
                  huisregels,
                }),
              {
                cel: stand.celVoor(huidig.voorstel.sampleId ?? '', huidig.voorstel.code),
                voorstellen: [huidig.voorstel],
                aanleiding: `${huidig.voorstel.code} op ${sampleTitel(
                  huidig.voorstel.sampleId
                )} (${huidig.voorstel.findingCode})`,
              }
            )
          ) : uitgang ? (
            <div className="mt-4 rounded border border-gray-300 p-3">
              <label className="mb-1 block text-sm font-medium text-gray-800">
                {uitgang === 'afwijzen'
                  ? 'Waarom is dit geen bevinding?'
                  : 'Toelichting (mag leeg)'}
              </label>
              <p className="mb-2 text-xs text-gray-500">
                {uitgang === 'afwijzen'
                  ? 'Deze reden blijft bewaard, zodat een volgende auditronde dezelfde vondst niet opnieuw voorstelt.'
                  : 'Er wordt een technisch issue aangemaakt voor de leverancier en dit voorstel wordt afgewezen met een verwijzing daarheen. Die verwijzing vertelt het verhaal al, dus een toelichting hoeft alleen als je iets wilt vastleggen dat er niet in staat.'}
              </p>
              <textarea
                value={reden}
                onChange={(e) => setReden(e.target.value)}
                rows={3}
                autoFocus
                className="w-full rounded border border-gray-300 p-2 text-sm"
                placeholder={
                  uitgang === 'afwijzen'
                    ? 'Korte toelichting'
                    : 'Optioneel — laat leeg om alleen de verwijzing vast te leggen'
                }
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={bezig || (uitgang === 'afwijzen' && !reden.trim())}
                  onClick={() => beoordeel(huidig.voorstel.id, uitgang)}
                  className="rounded bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
                >
                  {uitgang === 'afwijzen' ? 'Afwijzen' : 'Doorzetten naar techniek'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUitgang(null);
                    setReden('');
                  }}
                  className="rounded px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50"
                >
                  Annuleren
                </button>
              </div>

            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {/* Bevinding of opmerking is het oordeel van de onderzoeker. De
                  keuze van de agent staat vooraan; de andere ernaast, altijd —
                  je kunt vooraf niet weten welke hij verkeerd inschatte. */}
              {(huidig.voorstel.type === 'opmerking'
                ? ['opmerking', 'bevinding']
                : ['bevinding', 'opmerking']
              ).map((soort, i) => (
                <button
                  key={soort}
                  type="button"
                  disabled={bezig}
                  onClick={() => beoordeel(huidig.voorstel.id, 'akkoord', soort)}
                  className={`rounded px-4 py-2 text-sm font-medium disabled:opacity-40 ${
                    i === 0
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'border border-green-600 text-green-700 hover:bg-green-50'
                  }`}
                >
                  Akkoord als {soort}
                </button>
              ))}
              <button
                type="button"
                disabled={bezig}
                onClick={() => setUitgang('afwijzen')}
                className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                Afwijzen
              </button>
              <button
                type="button"
                disabled={bezig}
                onClick={() => setUitgang('doorzetten')}
                className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                Dit is techniek
              </button>
              <button
                type="button"
                disabled={bezig}
                onClick={() => setUitgang('overleggen')}
                className="rounded border border-blue-300 px-4 py-2 text-sm text-blue-900 hover:bg-blue-50 disabled:opacity-40"
              >
                Overleggen
              </button>

              {/* Het moment waarop je merkt dat de tekst niet deugt, is juist dit
                  moment. Eerst akkoord geven en daarna herstellen zou betekenen
                  dat je iets goedkeurt waarvan je weet dat het niet klopt. */}
              <a
                href={`/admin/projects/${projectId}/findings/${huidig.voorstel.id}`}
                className="rounded px-4 py-2 text-sm text-gray-500 underline hover:bg-gray-50"
              >
                Tekst aanpassen
              </a>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-300 bg-white p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded bg-blue-100 px-2 py-0.5 font-medium text-blue-800">
              Jij moet kijken
            </span>
            {huidig.cel.bron && (
              <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-600">
                via {huidig.cel.bron}
              </span>
            )}
          </div>

          <p className="mb-1 text-sm text-gray-500">
            {huidig.cel.code} — {critTitel(huidig.cel.code)} · {sampleTitel(huidig.cel.sampleId)}
          </p>
          <p className="mb-4 leading-relaxed text-gray-900">
            {huidig.cel.reden ?? 'Dit criterium vergt een browsertest.'}
          </p>

          {verwerktMelding}
          {fout && <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-800">{fout}</p>}

          <label className="mb-1 block text-sm font-medium text-gray-800">
            Wat zag je? <span className="font-normal text-gray-500">(mag leeg)</span>
          </label>
          <p className="mb-2 text-xs text-gray-500">
            Wordt bewaard bij het oordeel, zodat later terug te zien is waarop het berust.
            Schrijf op wat je hebt gedaan en wat je zag, met de waarden die je hebt gemeten.
          </p>
          <textarea
            value={reden}
            onChange={(e) => setReden(e.target.value)}
            rows={2}
            className="mb-3 w-full rounded border border-gray-300 p-2 text-sm"
            // Het voorbeeld hangt aan het criterium. Er stond vaste tekst over een test
            // met NVDA, en die stond dus ook op een contrastvraag — waar een schermlezer
            // niets te zoeken heeft. Een voorbeeld dat niet past, stuurt de verkeerde kant
            // op; dan is geen voorbeeld beter.
            placeholder={VOORBEELD_PER_CRITERIUM[huidig.cel.code] ?? 'Wat je hebt gedaan, en wat je zag'}
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={bezig}
              onClick={() => beantwoord(huidig.cel, 'voldoet')}
              className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-40"
            >
              In orde
            </button>
            <button
              type="button"
              disabled={bezig}
              onClick={() => beantwoord(huidig.cel, 'niet_aanwezig')}
              className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              Niet van toepassing
            </button>
            {/* Zag je wél iets, noteer het dan als waarneming: ruw, in je eigen
                woorden. De vraag blijft openstaan tot je hem beantwoordt — een
                afkeuring zonder onderbouwing is precies wat de poort voorkomt. */}
            <a
              href={`?tab=stand&weergave=waarnemingen&sample=${huidig.cel.sampleId}`}
              className="rounded border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
            >
              Ik zie iets — noteren
            </a>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            De vraag blijft openstaan tot je hem beantwoordt. Schrijf je een bevinding, kom dan
            terug om hier vast te leggen wat je zag.
          </p>
        </div>
      )}
    </div>
  );
}
