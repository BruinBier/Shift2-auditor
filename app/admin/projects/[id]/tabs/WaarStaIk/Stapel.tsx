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
import { HERKOMST } from './gegevens';
import type { Cel, Meting, Stand, Voorstel } from './gegevens';
import type { Kaarttekst } from '@/lib/criterium-kaarttekst';
import { meetbaarVanafDeKaart, leesbareAanroep, isSitebreed, metingenVoorCriterium } from '@/lib/metingen';

type Taak =
  | { soort: 'vraag'; cel: Cel }
  | { soort: 'oordeel'; cel: Cel }
  | { soort: 'voorstel'; voorstel: Voorstel };

/**
 * De eerste zin van een bevinding, voor op de dichtgeklapte regel.
 *
 * Niet zomaar op een punt afbreken: in een bevinding staat `alt=""`, staan afkortingen en
 * staan versienummers, en die dragen alle een punt. Er wordt daarom pas geknipt bij een punt
 * met een spatie én een hoofdletter erachter — en levert dat een onbruikbaar kort of lang
 * stuk op, dan wint een gewone afkapping.
 */
function eersteZin(tekst: string): string {
  const heel = (tekst ?? '').trim().replace(/\s+/g, ' ');
  if (heel.length <= 150) return heel;
  const knip = heel.search(/\.\s+[A-Z]/);
  if (knip >= 40 && knip <= 180) return heel.slice(0, knip + 1);
  return heel.slice(0, 147).trimEnd() + '…';
}

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
  /**
   * Eén onderdeel uit de vergelijking, als het overleg daarover gaat.
   *
   * Zonder dit gaat het blok over het hele criterium, en dan moet degene met wie je
   * overlegt raden welk van de vier onderdelen je bedoelt. Met de gemeten namen, hun
   * herkomst en de bevinding van de agent erbij is het gesprek meteen concreet.
   */
  onderdeel?: {
    sleutel: string;
    namen: { naam: string; aantal: number; bron?: string | null }[];
    bevinding?: string | null;
    notitie?: string | null;
  } | null;
}): string {
  const { code, critTitel, sample, projectId, bezwaar, cel, voorstellen, huisregels, onderdeel } =
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

  if (onderdeel) {
    r.push('## Het onderdeel waar het over gaat');
    r.push('');
    r.push('Sleutel in de vergelijking: ' + onderdeel.sleutel);
    r.push('');
    r.push('Gemeten namen:');
    for (const n of onderdeel.namen) {
      r.push(
        `- "${n.naam}" op ${n.aantal} pagina${n.aantal === 1 ? '' : "'s"}${
          n.bron ? ` (naam komt uit ${n.bron})` : ''
        }`
      );
    }
    r.push('');
    if (onderdeel.bevinding) {
      r.push('De geautomatiseerde auditor schreef hierover:');
      r.push('');
      r.push(`> ${onderdeel.bevinding}`);
      if (onderdeel.notitie) r.push(`> ${onderdeel.notitie}`);
      r.push('');
    }
  }
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
    r.push(`Status: ${cel.status}${cel.bron ? ` — ${HERKOMST[cel.bron] ?? cel.bron}` : ''}`);
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
  kaartteksten = {},
}: {
  stand: Stand;
  focus: string;
  terug: () => void;
  projectId: string;
  /** Uitleg per criterium, gelezen uit de regelbestanden. Zie lib/criterium-kaarttekst.ts. */
  kaartteksten?: Record<string, Kaarttekst>;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  /** Het formulier waarmee de onderzoeker zelf een onderdeel aan stap 3 toevoegt. */
  const [toevoegOpen, setToevoegOpen] = useState(false);
  /** Het formulier waarmee de onderzoeker een afkeuring toevoegt. */
  const [afkeurOpen, setAfkeurOpen] = useState(false);
  const [afkeurBezig, setAfkeurBezig] = useState(false);
  const [afkeurFout, setAfkeurFout] = useState<string | null>(null);
  const [afkeurTekst, setAfkeurTekst] = useState('');
  const [afkeurAdvies, setAfkeurAdvies] = useState('');
  const [afkeurImpact, setAfkeurImpact] = useState('matig');
  /** Over welke bevinding van de agent het overleg gaat, als er een openstaat. */
  const [overlegOver, setOverlegOver] = useState<string | null>(null);
  const [toevoegBezig, setToevoegBezig] = useState(false);
  const [toevoegFout, setToevoegFout] = useState<string | null>(null);
  const [nieuwOmschrijving, setNieuwOmschrijving] = useState('');
  const [nieuwNotitie, setNieuwNotitie] = useState('');
  const [nieuwVarianten, setNieuwVarianten] = useState<{ wat: string; waar: string }[]>([
    { wat: '', waar: '' },
    { wat: '', waar: '' },
  ]);
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
  /** Per criterium en commando: een meting die nu vanaf de kaart draait. */
  const [nieuweMetingen, setNieuweMetingen] = useState<
    Record<string, { bezig: boolean; fout?: string; stap?: string; nieuwOordeel?: boolean }>
  >({});

  /**
   * Een meting starten die er nog niet was, voor deze pagina en dit criterium.
   *
   * Hiermee is de onderzoeker niet meer afhankelijk van een agent om iets te laten
   * nameten. Dat is het verschil tussen een tool voor onze eigen sites — waar een agent de
   * hele ronde heeft gedraaid — en een tool waarmee je een willekeurige site kunt
   * onderzoeken: daar staan de kaarten leeg, en dan moet je zelf kunnen meten.
   *
   * De uitkomst komt onder het oordeel te staan; het oordeel zelf verandert er niet van.
   * Meten is bewijs verzamelen, geen uitspraak doen — en een akkoord dat de onderzoeker al
   * gegeven heeft, hoort niet te vervallen omdat er bewijs bij komt.
   */
  const startMeting = async (cel: Cel, commando: string) => {
    const sleutel = `${cel.sampleId}|${cel.code}|${commando}`;
    setNieuweMetingen((n) => ({ ...n, [sleutel]: { bezig: true } }));
    try {
      const res = await fetch('/api/meting/uitvoeren', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sampleItemId: cel.sampleId,
          criterionCode: cel.code,
          commando,
        }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) {
        setNieuweMetingen((n) => ({
          ...n,
          [sleutel]: { bezig: false, fout: j.error || 'De meting liep niet goed af' },
        }));
        return;
      }
      setNieuweMetingen((n) => ({
        ...n,
        [sleutel]: { bezig: false, stap: j.stap ?? '', nieuwOordeel: !!j.nieuwOordeel },
      }));
      // De meting staat nu in de database; de kaart eronder komt uit een servercomponent.
      router.refresh();
    } catch (e: any) {
      setNieuweMetingen((n) => ({ ...n, [sleutel]: { bezig: false, fout: e.message } }));
    }
  };

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

    const past = (c: { sampleId: string | null; code: string; status?: string | null }) => {
      if (soort === 'rij') {
        // Bij een sitebreed criterium is er één oordeel, niet twintig. De andere samples
        // staan op 'niet aanwezig' met een verwijzing; die als losse kaarten voorleggen
        // maakt van één beslissing twintig keer bladeren.
        if (isSitebreed(a)) return c.code === a && !!c.status && c.status !== 'niet_aanwezig';
        return c.code === a;
      }
      if (soort === 'kolom') {
        // Een sitebreed criterium hoort niet in de werklijst van één pagina: het gaat over
        // de hele set. Je bereikt het via het vakje in de kolom "alle pagina’s" in de matrix.
        return c.sampleId === a && !isSitebreed(c.code);
      }
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
  /**
   * Wat je voor dit criterium op deze pagina alsnog kunt laten meten.
   *
   * Staat er onder een oordeel niets, dan is er twee dingen aan de hand die er hetzelfde
   * uitzien: er viel niets te meten, of niemand heeft gemeten. Dit blok maakt het verschil
   * zichtbaar én oplosbaar — het noemt de meting die bij dit criterium hoort en start hem
   * op één klik. Voor een site die nooit door een agent is nagelopen is dit de enige weg
   * naar bewijs.
   *
   * Alleen wat er nog niet staat. Een meting die er al is, heeft haar eigen knop ("Nog
   * eens meten") en hoort niet twee keer aangeboden te worden.
   */
  const meetAanbod = (cel: Cel) => {
    const gedaan = new Set((cel.verantwoording ?? []).map((m) => m.commando));
    const teDoen = meetbaarVanafDeKaart(cel.code).filter((m) => !gedaan.has(m.commando));
    if (!teDoen.length) return null;

    const sample = sampleVoor(cel.sampleId);
    // Zonder adres valt er niets te openen. Dat is geen fout maar een eigenschap van het
    // sample; zeggen wat er aan de hand is scheelt een knop die niets doet.
    if (!sample?.url) {
      return (
        <p className="mt-3 rounded border border-gray-200 bg-gray-50 p-2 text-xs text-gray-600">
          Dit criterium is te meten ({teDoen.map((m) => m.commando).join(', ')}), maar deze
          pagina heeft geen adres om te openen.
        </p>
      );
    }

    return (
      <div className="mt-3 rounded border border-blue-200 bg-blue-50 p-3">
        <p className="mb-2 text-xs font-medium text-blue-900">
          {/* "Dit kun je hier ook laten meten" las als een tweede manier om hetzelfde te
              doen, naast de knop "Nog eens meten" die er al bij een bestaande meting staat.
              Die twee doen iets anders: de een herhaalt een meting, de ander voegt er een
              toe die er nog niet is. De kop hoort dat te zeggen. */}
          {(cel.verantwoording ?? []).length === 0
            ? 'Dit criterium is te meten. Er staat nog geen meting onder dit oordeel:'
            : 'Nog niet gemeten voor dit criterium:'}
        </p>
        <div className="space-y-2">
          {teDoen.map((opdracht) => {
            const sleutel = `${cel.sampleId}|${cel.code}|${opdracht.commando}`;
            const loopt = nieuweMetingen[sleutel];
            return (
              <div key={opdracht.commando} className="rounded border border-blue-200 bg-white p-2">
                <p className="text-sm text-gray-900">{opdracht.wat}</p>
                <code className="mt-1 block break-all font-mono text-xs text-gray-700">
                  {leesbareAanroep(opdracht.commando, sample.url!, opdracht.vlaggen ?? {})}
                </code>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={loopt?.bezig}
                    onClick={() => startMeting(cel, opdracht.commando)}
                    className="rounded bg-blue-700 px-3 py-1 text-xs font-medium text-white hover:bg-blue-800 disabled:opacity-40"
                  >
                    {loopt?.bezig ? 'Bezig met meten…' : 'Meet dit nu'}
                  </button>
                  <span className="text-xs text-gray-600">
                    {loopt?.bezig
                      ? `Dit duurt ${opdracht.duurt ?? 'even'}; het scherm wacht erop.`
                      : opdracht.duurt
                      ? `Duurt ${opdracht.duurt}.`
                      : ''}
                  </span>
                </div>
                {loopt?.fout && (
                  <p className="mt-1.5 rounded bg-red-50 px-2 py-1 text-xs text-red-800">
                    {loopt.fout}
                  </p>
                )}
                {loopt && !loopt.bezig && !loopt.fout && (
                  <div className="mt-1.5 rounded bg-green-50 px-2 py-1 text-xs text-green-900">
                    <p className="font-medium">Gemeten. De uitkomst staat nu hierboven.</p>
                    {loopt.stap && <p className="mt-0.5">{loopt.stap}</p>}
                    {loopt.nieuwOordeel && (
                      <p className="mt-0.5">
                        Er stond nog geen oordeel op deze combinatie. Die staat nu op &ldquo;niet
                        te bepalen&rdquo;, met de meting eronder — het oordeel is aan jou.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /**
   * Het blok "Zo is het vastgesteld": waarop dit oordeel rust, en wat je hier alsnog kunt
   * laten meten.
   *
   * Losgemaakt van het controleblok omdat de kaart "Jij moet kijken" het óók nodig heeft.
   * Juist daar: dat is de kaart waarop staat dat het criterium niet vast te stellen was, en
   * dan is de meting die dat wél kan het eerste wat je wilt zien. Het controleblok hoort er
   * niet bij — er is nog geen oordeel om na te kijken.
   */
  /**
   * Eén genummerde stap op de kaart. De nummering volgt de handmatige auditprocedure uit
   * `wcag-checklists/Checklist_SC_3_2_4.md`: eerst weten wat het criterium borgt, dan hoe je
   * het test, dan wat er gevonden is, dan pas oordelen.
   */
  const stapBlok = (nummer: number, titel: string, alineas: string[]) => (
    <section className="mb-4">
      <p className="mb-1 flex items-baseline gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
        <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[10px] font-semibold text-white">
          {nummer}
        </span>
        {titel}
      </p>
      {alineas.map((alinea, i) => (
        <p key={i} className="leading-relaxed text-gray-900">
          {alinea}
        </p>
      ))}
    </section>
  );

  /**
   * `pad:/melden|main` is een sleutel om onderdelen op te koppelen, geen tekst voor een mens.
   * Dit maakt er iets leesbaars van zonder te doen alsof het iets anders is.
   */
  const leesbaarOnderdeel = (sleutel: string) => {
    const [kern, gebied] = sleutel.split('|');
    const naam = kern
      .replace(/^pad:/, '')
      .replace(/^extern:/, '')
      .replace(/^sprong:/, '')
      .replace(/^klasse:/, 'knop .');
    return { naam, gebied: gebied ?? '' };
  };

  /**
   * Een onderdeel dat de onderzoeker zelf vond toevoegen aan de lijst van stap 3.
   *
   * Raakt het oordeel niet aan en laat het akkoord niet vervallen. Iets aan je eigen lijst
   * toevoegen is geen uitspraak dat het criterium zakt; dat weeg je in stap 4.
   */
  const voegOnderdeelToe = async (cel: Cel) => {
    setToevoegBezig(true);
    setToevoegFout(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/criterion-checks/zelf-gevonden`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sampleItemId: cel.sampleId,
          criterionCode: cel.code,
          omschrijving: nieuwOmschrijving,
          notitie: nieuwNotitie,
          varianten: nieuwVarianten,
        }),
      });
      const antwoord = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(antwoord.error || 'toevoegen mislukte');
      setNieuwOmschrijving('');
      setNieuwNotitie('');
      setNieuwVarianten([
        { wat: '', waar: '' },
        { wat: '', waar: '' },
      ]);
      setToevoegOpen(false);
      router.refresh();
    } catch (e: any) {
      setToevoegFout(e.message);
    } finally {
      setToevoegBezig(false);
    }
  };

  /**
   * Een lezing overnemen, afwijzen of terugzetten.
   *
   * Afwijzen wist niet. De lezing blijft staan met een merkteken erop, zodat het overzicht
   * heel blijft: je ziet later dat er iets is voorgesteld en dat jij het hebt weggewogen.
   */
  const zetLezing = async (cel: Cel, onderdeelId: string, status: 'open' | 'overgenomen' | 'afgewezen') => {
    setToevoegFout(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/criterion-checks/zelf-gevonden`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sampleItemId: cel.sampleId, criterionCode: cel.code, onderdeelId, status }),
      });
      const antwoord = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(antwoord.error || 'bijwerken mislukte');
      router.refresh();
    } catch (e: any) {
      setToevoegFout(e.message);
    }
  };

  const verwijderOnderdeel = async (cel: Cel, onderdeelId: string) => {
    setToevoegFout(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/criterion-checks/zelf-gevonden`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sampleItemId: cel.sampleId, criterionCode: cel.code, onderdeelId }),
      });
      const antwoord = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(antwoord.error || 'verwijderen mislukte');
      router.refresh();
    } catch (e: any) {
      setToevoegFout(e.message);
    }
  };

  /**
   * Stap 3: wat er gevonden is — door de meting én door jou.
   *
   * De meetuitkomst komt uit de meting zelf en niet uit een tekst die er ooit bij geschreven
   * is: die veroudert zodra het commando iets nieuws gaat meten, en dat is precies wat er bij
   * 3.2.4 gebeurde toen de icoonvergelijking erbij kwam.
   *
   * Maar een meting vindt niet alles. Een onderdeel dat pas na een klik verschijnt, een
   * pagina buiten de steekproef, twee elementen die de sleutel niet aan elkaar koppelt — die
   * ziet alleen een mens. Daarom staat wat jij toevoegt in dezelfde lijst, met erbij wie wat
   * vond. Anders bestaat het alleen in je hoofd of als losse zin in een notitieveld.
   */
  /**
   * `deel` volgt de instructies: deel 1 is wat er gevónden is (stap 1, in de
   * auditsessie), deel 2 is hoe die onderdelen héten (stap 2, in de code). Eén commando
   * levert allebei — het bezoekt elke pagina één keer — maar op de kaart hoort het bewijs
   * onder de stap die het beantwoordt. Stond het als één blok, dan is niet te zien welk
   * deel bij welke stap hoort.
   */
  const metingVondBlok = (cel: Cel, deel: 1 | 2) => {
    const metingen = cel.verantwoording ?? [];
    const meting = metingen.find((m) => Array.isArray((m.uitkomst as any)?.onderdelen));
    const u: any = meting ? meting.uitkomst : null;
    /**
     * Dit blok gaat over onderdelen die op meerdere pagina's terugkomen en over de namen
     * die ze daar dragen. Dat is de uitkomst van één soort meting, en die bestaat niet voor
     * elk criterium.
     *
     * Zonder deze grens verscheen op de 1.1.1-kaart "Er is nog niet gemeten met een commando
     * dat de gevonden onderdelen vastlegt" en daaronder "Geen onderdeel heet op de ene
     * pagina anders dan op de andere". Het eerste leest als een openstaande taak die niet
     * bestaat, het tweede als een bevinding over iets waar 1.1.1 niet over gaat.
     *
     * De grens is niet de criteriumcode maar de vraag of er iets te meten valt: is er niets
     * gemeten én is er voor dit criterium geen meting geregistreerd in lib/metingen.ts, dan
     * valt er ook niets te melden.
     */
    if (!u && !metingenVoorCriterium(cel.code).length) return null;
    const alleGemeten: any[] = u?.onderdelen ?? [];
    /**
     * Twee groepen, want ze wegen niet hetzelfde.
     *
     * Wat op meer dan de helft van de pagina’s staat komt uit het sjabloon: dáár gaat 3.2.4
     * over. Een link die op twee of drie pagina’s in een tekst staat is redactioneel, en dat
     * is volgens de regels bij dit criterium geen herhaald onderdeel. Stonden ze op één hoop,
     * dan begon deze kaart met vier vondsten waarvan er nul telde.
     *
     * De oudere metingen kennen dit onderscheid niet; die vallen terug op sjabloon, want dat
     * is de kant waar je naar kijkt.
     */
    const gemeten = alleGemeten.filter((o) => o.sjabloon !== false);
    const redactioneel = alleGemeten.filter((o) => o.sjabloon === false);
    const iconenPer = new Map<string, any[]>();
    for (const i of u?.iconen ?? []) iconenPer.set(i.sleutel, i.varianten);
    const alleEigen = cel.zelfGevonden ?? [];
    // Aantekeningen die bij een gemeten onderdeel horen, staan daaronder in plaats van
    // los in de lijst. Anders raakt de lezing los van het ding waar hij over gaat.
    const eigen = alleEigen.filter((o) => !o.overOnderdeel);
    const bijOnderdeel = new Map<string, typeof alleEigen>();
    for (const o of alleEigen) {
      if (!o.overOnderdeel) continue;
      const lijst = bijOnderdeel.get(o.overOnderdeel) ?? [];
      lijst.push(o);
      bijOnderdeel.set(o.overOnderdeel, lijst);
    }

    if (deel === 1) {
      return (
        <div className="mb-4 ml-5 mt-4 rounded bg-gray-50 px-3 py-2">
          {u ? (
            <p className="text-sm leading-relaxed text-gray-900">
              {u.onderdelenOpMeerderePaginas} onderdelen komen op meer dan één pagina voor,
              vergeleken over {u.paginas} van de {u.vanDeSteekproef} pagina&apos;s
              {u.omgeleid ? ' (' + u.omgeleid + ' omgeleid)' : ''}.
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              Er is nog niet gemeten met een commando dat de gevonden onderdelen vastlegt.
            </p>
          )}
        </div>
      );
    }

    return (
      <section className="mb-4 ml-5 mt-4">

        {gemeten.length > 0 && (
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Sjabloononderdelen — hier gaat 3.2.4 over
          </p>
        )}

        {gemeten.length === 0 && eigen.length === 0 ? (
          <p className="mb-2 text-sm text-gray-600">
            Geen onderdeel heet op de ene pagina anders dan op de andere.
          </p>
        ) : (
          <ul className="mb-3 space-y-3">
            {gemeten.map((o: any) => {
              const { naam, gebied } = leesbaarOnderdeel(o.sleutel);
              const iconen = iconenPer.get(o.sleutel);
              return (
                <li key={o.sleutel}>
                  {/* Inklapbaar: de samenvatting is om te scannen, de details om te lezen.
                      Zes onderdelen met alles uitgeklapt is een muur waarin je niets terugvindt.

                      Het kader zit om de <details> en niet om de <li>, want alleen daar weet de
                      opmaak of het onderdeel openstaat. Met de `open:`-variant kleurt de rand
                      mee zonder dat er toestand aan te pas komt: openstaand krijgt een donkere
                      rand en een schaduw, zodat je ziet welk onderdeel je open hebt. */}
                  <details className="group rounded border border-gray-200 open:border-blue-900 open:shadow-md">
                    {/* Lichtblauwe balk: de kop van een onderdeel moet er anders uitzien dan
                        de inhoud eronder, anders loopt het bij zes onderdelen in elkaar over.
                        Licht genoeg om de tekst donker te houden. */}
                    <summary className="cursor-pointer list-none rounded bg-blue-50 p-2 group-open:rounded-b-none group-open:bg-blue-100">
                      <span className="flex flex-wrap items-baseline gap-x-2 text-xs text-gray-600">
                        <span className="font-medium text-gray-900">{naam}</span>
                        {gebied && <span>· {gebied}</span>}
                        <span className="ml-auto rounded bg-white px-1.5 text-[10px] uppercase tracking-wide text-gray-500">
                          gemeten
                        </span>
                      </span>
                      <span className="mt-0.5 block text-xs text-gray-600">
                        {o.namen.length} namen
                        {iconen && iconen.length > 1 ? ' · ook een andere afbeelding' : ''}
                        {samenvattingLezing(bijOnderdeel.get(o.sleutel) ?? [])}
                      </span>
                    </summary>
                    <div className="border-t border-gray-200 bg-white px-3 py-2">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Namen
                  </p>
                  {/* In kolommen: de naam, op hoeveel pagina&apos;s, en waar hij vandaan komt.
                      Achter elkaar op één regel loopt dat in elkaar over. Bij het logo is de
                      bron het hele verschil: `title` op vijftien pagina's, `alt` op de zestiende. */}
                  <ul className="mb-3 space-y-1">
                    {o.namen.map((n: any, i: number) => (
                      <li key={i} className="grid grid-cols-[1fr_auto] gap-x-3 text-sm">
                        <span className="text-gray-900">&ldquo;{n.naam}&rdquo;</span>
                        <span className="whitespace-nowrap text-xs text-gray-500">
                          {n.aantal === 1 ? '1 pagina' : n.aantal + " pagina's"}
                        </span>
                        {n.bron && (
                          <span className="col-span-2 text-xs text-gray-500">uit {n.bron}</span>
                        )}
                        {/* Waar het staat, met adres. Een paginanaam alleen is een bewering
                            die je niet kunt natrekken; hiermee ga je erheen en kijk je zelf. */}
                        {Array.isArray(n.paginas) && n.paginas.length > 0 && (
                          <span className="col-span-2 flex flex-wrap gap-x-2 gap-y-0.5 text-xs">
                            {n.paginas.map((pg: any, j: number) =>
                              pg.url ? (
                                <a
                                  key={j}
                                  href={pg.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-800 underline"
                                  title={pg.url}
                                >
                                  {pg.titel}
                                </a>
                              ) : (
                                <span key={j} className="text-gray-500">
                                  {pg.titel}
                                </span>
                              )
                            )}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                  {/* Wat je ziet, apart van wat er in de code staat. De namen hierboven komen
                      uit `aria-label`, `alt` of `title` — dat is stap 2. Hoe het onderdeel er
                      in het echt bij staat is stap 1, en dat hoort niet in hetzelfde blok. Bij
                      /melden scheelt dat: drie namen blijken een grote knop met pictogram, een
                      kaal webadres in een alinea, en een link in een lopende zin. */}
                  {/* Niet tonen als het blok Afbeelding hieronder het beeld al laat zien: bij
                      het logo is de uitsnede van het element hetzelfde plaatje nog een keer.
                      De uitsneden blijven wel bij de meting bewaard, onderaan bij de
                      verantwoording. */}
                  {!(iconen && iconen.length > 1) && o.namen.some((n: any) => n.afdruk) && (
                    <div className="mb-3">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        Zo staat het op de pagina
                      </p>
                      <ul className="space-y-2">
                        {o.namen
                          .filter((n: any) => n.afdruk)
                          .map((n: any, i: number) => (
                            <li key={i}>
                              <p className="mb-0.5 text-xs text-gray-600">
                                &ldquo;{n.naam}&rdquo;
                                {n.afdrukPagina && (
                                  <span>
                                    {' op '}
                                    {(() => {
                                      const pg = (n.paginas ?? []).find(
                                        (x: any) => x.titel === n.afdrukPagina
                                      );
                                      return pg?.url ? (
                                        <a
                                          href={pg.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-blue-800 underline"
                                        >
                                          {n.afdrukPagina}
                                        </a>
                                      ) : (
                                        n.afdrukPagina
                                      );
                                    })()}
                                  </span>
                                )}
                              </p>
                              <img
                                src={`/api/meting/artefact?pad=${encodeURIComponent(n.afdruk)}`}
                                alt=""
                                className="max-h-20 max-w-full rounded border border-gray-200"
                              />
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                  {iconen && iconen.length > 1 && (
                    // Neutraal, niet in een waarschuwingskleur: dit is een meting en geen
                    // oordeel. Het voorbehoud staat in woorden, want kleur als enige drager
                    // van betekenis is nu juist wat we bij anderen afkeuren.
                    <div className="mb-3">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        Afbeelding
                      </p>
                      <ul className="space-y-2">
                        {iconen.map((b: any, i: number) => (
                          <li key={i} className="flex items-start gap-3 text-sm">
                            {/* Het plaatje zelf erbij. Zonder dat blijft "twee bestanden
                                kunnen hetzelfde tonen" een gok: pas als je ze naast elkaar
                                ziet weet je of het verschil er ook een is voor wie kijkt.
                                Een geruit vlak eronder, want een logo is vaak doorzichtig. */}
                            {b.artefact || b.adres ? (
                              <img
                                src={
                                  b.artefact
                                    ? `/api/meting/artefact?pad=${encodeURIComponent(b.artefact)}`
                                    : b.adres
                                }
                                alt=""
                                className="h-10 w-24 shrink-0 rounded border border-gray-200 bg-[repeating-conic-gradient(#f3f4f6_0_25%,#ffffff_0_50%)] bg-[length:12px_12px] object-contain p-0.5"
                              />
                            ) : (
                              <span className="h-10 w-24 shrink-0 rounded border border-dashed border-gray-300" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-gray-900">{leesbaarBeeld(b.icoon)}</p>
                              {/* Waar het vandaan komt. Zonder adres is een plaatje op een
                                  auditkaart een bewering: je ziet iets, maar niet waarvan. */}
                              {b.adres && (
                                <a
                                  href={b.adres}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block break-all text-[11px] leading-tight text-blue-800 underline"
                                >
                                  {b.adres}
                                </a>
                              )}
                              {b.artefact && (
                                <p className="text-[10px] leading-tight text-gray-400">
                                  Het beeld hierlinks is de kopie die bij deze meting is opgeslagen,
                                  niet het bestand dat nu op de site staat.
                                </p>
                              )}
                            </div>
                            <span className="whitespace-nowrap text-xs text-gray-500">
                              {b.aantal === 1 ? '1 pagina' : b.aantal + " pagina's"}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-1 text-xs text-gray-500">
                        Een aanwijzing, geen bewijs: twee bestanden kunnen hetzelfde tonen.
                      </p>
                    </div>
                  )}
                  {(bijOnderdeel.get(o.sleutel) ?? []).map((a) => {
                    const stand = a.status ?? 'open';
                    const afgehandeld = stand !== 'open';
                    return (
                      <div key={a.id} className="mt-2 border-t border-gray-200 pt-2">
                        <p className="mb-0.5 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wide">
                          <span className="text-blue-700">
                            {a.door === 'agent' ? 'Bevinding van de agent' : 'Jouw aantekening'}
                          </span>
                          {stand === 'overgenomen' && (
                            <span className="rounded bg-green-100 px-1.5 text-green-800">
                              overgenomen
                            </span>
                          )}
                          {stand === 'afgewezen' && (
                            <span className="rounded bg-gray-200 px-1.5 text-gray-700">
                              afgewezen
                            </span>
                          )}
                        </p>

                        {/* Afgehandeld? Dan hoef je de afweging niet meer te lezen. Eén regel met
                            wat je besloot, en de rest achter een klik. Uitgeklapt is het drie
                            alinea's over iets waar je al doorheen bent. */}
                        {afgehandeld ? (
                          <details>
                            <summary className="cursor-pointer text-sm text-gray-600">
                              {a.reactie
                                ? a.reactie.split('.')[0] + '.'
                                : 'Zonder toelichting afgehandeld.'}
                            </summary>
                            <div className="mt-2">
                              <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
                                {a.omschrijving}
                              </p>
                              {a.notitie && (
                                <p className="mt-1 whitespace-pre-line text-xs text-gray-600">
                                  {a.notitie}
                                </p>
                              )}
                              {a.reactie && (
                                <p className="mt-2 whitespace-pre-line text-xs text-gray-700">
                                  <span className="font-medium">Jouw reactie:</span> {a.reactie}
                                </p>
                              )}
                            </div>
                          </details>
                        ) : (
                          <>
                            <p className="whitespace-pre-line text-sm leading-relaxed text-gray-800">
                              {a.omschrijving}
                            </p>
                            {a.notitie && (
                              <p className="mt-1 whitespace-pre-line text-xs text-gray-600">
                                {a.notitie}
                              </p>
                            )}
                          </>
                        )}

                        {/* Afwijzen wist niet. De lezing blijft staan met een merkteken, zodat
                            later te zien is dat er iets is voorgesteld en dat jij het hebt
                            weggewogen. Dezelfde poort als bij een voorstel voor een bevinding. */}
                        {a.door === 'agent' ? (
                          <div className="mt-1 flex flex-wrap gap-3">
                            {stand !== 'overgenomen' && (
                              <button
                                type="button"
                                onClick={() => zetLezing(cel, a.id, 'overgenomen')}
                                className="text-xs text-green-800 underline hover:text-green-900"
                              >
                                Overnemen
                              </button>
                            )}
                            {stand !== 'afgewezen' && (
                              <button
                                type="button"
                                onClick={() => zetLezing(cel, a.id, 'afgewezen')}
                                className="text-xs text-gray-600 underline hover:text-gray-900"
                              >
                                Afwijzen
                              </button>
                            )}
                            {stand !== 'open' && (
                              <button
                                type="button"
                                onClick={() => zetLezing(cel, a.id, 'open')}
                                className="text-xs text-gray-500 underline hover:text-gray-800"
                              >
                                Terugzetten
                              </button>
                            )}
                            {/* Niet alleen ja of nee. Wat er mis is aan een bevinding is vaak
                                niet de uitkomst maar de redenering, en daar is geen knop voor
                                te maken. Ditzelfde paneel bestond al voor voorstellen; het
                                neemt de huisregels mee zodat het gesprek ook werkt in een
                                chatvenster dat deze repository niet kan lezen. */}
                            <button
                              type="button"
                              onClick={() =>
                                setOverlegOver(overlegOver === a.id ? null : a.id)
                              }
                              className="text-xs text-blue-800 underline hover:text-blue-900"
                            >
                              {overlegOver === a.id ? 'Overleg sluiten' : 'Overleggen'}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => verwijderOnderdeel(cel, a.id)}
                            className="mt-1 text-xs text-gray-500 underline hover:text-gray-800"
                          >
                            Deze aantekening verwijderen
                          </button>
                        )}
                        {overlegOver === a.id &&
                          overlegPaneel(
                            cel.code,
                            (huisregels) =>
                              bespreekBlok({
                                code: cel.code,
                                critTitel: critTitel(cel.code),
                                sample: sampleVoor(cel.sampleId),
                                projectId,
                                bezwaar: reden,
                                cel,
                                voorstellen: [],
                                huisregels,
                                onderdeel: {
                                  sleutel: a.overOnderdeel ?? '',
                                  namen: o.namen ?? [],
                                  bevinding: a.omschrijving,
                                  notitie: a.notitie ?? null,
                                },
                              }),
                            {
                              cel,
                              voorstellen: [],
                              aanleiding: `${cel.code} — ${leesbaarOnderdeel(o.sleutel).naam}`,
                            }
                          )}
                      </div>
                    );
                  })}
                    </div>
                  </details>
                </li>
              );
            })}

            {eigen.map((o) => (
              <li key={o.id} className="rounded border border-blue-200 bg-blue-50 p-2">
                <p className="mb-1 flex flex-wrap items-baseline gap-x-2 text-xs text-gray-600">
                  <span className="font-medium text-gray-900">{o.omschrijving}</span>
                  <span className="ml-auto rounded bg-white px-1.5 text-[10px] uppercase tracking-wide text-blue-700">
                    door jou gezien
                  </span>
                </p>
                <ul className="space-y-0.5">
                  {o.varianten.map((v, i) => (
                    <li key={i} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                      <span className="text-gray-900">&ldquo;{v.wat}&rdquo;</span>
                      <span className="text-xs text-gray-500">op {v.waar}</span>
                    </li>
                  ))}
                </ul>
                {o.notitie && <p className="mt-1 text-xs text-gray-600">{o.notitie}</p>}
                <button
                  type="button"
                  onClick={() => verwijderOnderdeel(cel, o.id)}
                  className="mt-1 text-xs text-gray-500 underline hover:text-gray-800"
                >
                  Dit onderdeel uit de lijst halen
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Redactionele links staan niet op de kaart: ze vallen buiten dit criterium, en wat
            buiten het onderzoek valt komt er niet als vondst uit. Ook geen telling — een
            aantal is ook iets voorleggen.

            Ze zijn niet weg: `redactioneel` hierboven houdt ze uit de lijst met
            sjabloononderdelen, en ze staan bij naam in het overzichtsbestand en in de uitkomst
            van de meting. */}
        {toevoegFout && (
          <p className="mb-2 rounded bg-red-50 px-3 py-2 text-sm text-red-800">{toevoegFout}</p>
        )}

        {/* De knop "+ Onderdeel toevoegen" is weg: "Bevinding toevoegen" hieronder doet
            hetzelfde werk, en twee toevoegknoppen onder elkaar is een keuze die niemand hoeft
            te maken.

            De rest blijft staan — de kolom `zelfGevonden`, de route en de weergave hierboven.
            Staat er een eigen vondst in, dan wordt hij gewoon getoond, en de knop is met dit
            blok terug. */}
      </section>
    );
  };

  /**
   * Waaraan het beeld in een onderdeel te herkennen is, leesbaar.
   *
   * De meting slaat het op als `afbeelding:logo.png`, `svg:...` of `klasse:fa-search` —
   * bruikbaar om te vergelijken, maar niet om te lezen. En "icoon" is het verkeerde woord
   * zodra het een logo of woordmerk is.
   */
  const leesbaarBeeld = (waarde: string) => {
    if (waarde.startsWith('afbeelding:')) return waarde.slice(11);
    if (waarde.startsWith('svg:')) return 'een tekening (svg)';
    if (waarde.startsWith('klasse:')) return 'een icoonlettertype (.' + waarde.slice(7) + ')';
    return waarde;
  };

  /**
   * Wat er in de samenvattingsregel over de bevindingen van de agent komt te staan.
   *
   * "Bevinding" is hier het woord van de onderzoeker, niet dat van het gegevensmodel. Een
   * echte `Finding` heeft een code en bepaalt het criteriumoordeel; deze telt nergens in
   * mee. Dat verschil staat in het label erbij en blijkt uit de knoppen: pas als de
   * onderzoeker hem overneemt en als afkeuring opschrijft, wordt het er een.
   */
  const samenvattingLezing = (lezingen: { status?: string; door?: string }[]) => {
    if (!lezingen.length) return '';
    const stand = lezingen[0].status ?? 'open';
    if (stand === 'overgenomen') return ' · bevinding van de agent overgenomen';
    if (stand === 'afgewezen') return ' · bevinding van de agent afgewezen';
    return '';
  };

  /**
   * Tekst uit een regelbestand, met de code-stukjes als code.
   *
   * In markdown betekenen backticks "dit is code". De kaart toonde ze als losse tekens,
   * dus er stond letterlijk `get-consistentie` op het scherm, inclusief de streepjes.
   */
  const metCode = (tekst: string) =>
    tekst.split(String.fromCharCode(96)).map((deel, i) =>
      i % 2 === 1 ? (
        <code key={i} className="rounded bg-gray-100 px-1 text-[0.9em]">
          {deel}
        </code>
      ) : (
        <span key={i}>{deel}</span>
      )
    );

  /** Het niveau van een criterium, voor de badge naast het succescriterium. */
  const critNiveau = (code: string) => stand.criteria.find((c) => c.code === code)?.level ?? '';

  /** Het interne id van een criterium; nodig om een bevinding aan te maken. */
  const critId = (code: string) => stand.criteria.find((c) => c.code === code)?.id ?? '';

  /**
   * Een afkeuring aanmaken vanaf de kaart.
   *
   * Dit is de plek waar het oordeel vandaan komt. Niet een knop "voldoet niet": in
   * `gegevens.ts` volgt `failed` uit de bevindingen, dus een status zonder bevinding leest
   * onderaan als geslaagd. Wie hier een afkeuring toevoegt, schrijft hem ook, en dat is
   * precies wat de poort bewaakt.
   */
  const voegAfkeuringToe = async (cel: Cel) => {
    setAfkeurBezig(true);
    setAfkeurFout(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/findings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          criterionId: critId(cel.code),
          description: afkeurTekst,
          advice: afkeurAdvies,
          impact: afkeurImpact,
          status: 'open',
          sampleItemIds: [cel.sampleId],
        }),
      });
      const antwoord = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(antwoord.error || 'de afkeuring kon niet worden opgeslagen');
      setAfkeurTekst('');
      setAfkeurAdvies('');
      setAfkeurOpen(false);
      router.refresh();
    } catch (e: any) {
      setAfkeurFout(e.message);
    } finally {
      setAfkeurBezig(false);
    }
  };

  /**
   * De afkeuringen bij dit criterium, met de knop om er een toe te voegen.
   *
   * Leeg is hier een volwaardige toestand en geen gebrek: "je hebt nog geen afkeuringen
   * toegevoegd" betekent dat je de instructies hebt gevolgd en niets vond. Het oordeel
   * onderaan volgt hieruit.
   */
  const afkeuringenBlok = (cel: Cel) => {
    const afkeuringen = cel.bevindingen.filter((b) => b.type !== 'opmerking');
    return (
      <section className="mb-4 border-t border-gray-200 pt-3">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">Bevindingen</h3>

        {/* Wat de meting vond en wat de agent ervan maakte. Stond eerst tussen de
            instructies; daar maakte het de kaart drie keer zo lang als een auditkaart hoort
            te zijn. Hier hoort het: het is het materiaal waaruit een bevinding volgt. */}
        {metingVondBlok(cel, 1)}
        {metingVondBlok(cel, 2)}

        {/* Elke bevinding staat ingeklapt, met de eerste zin in de samenvatting.

            Een bevinding is drie alinea's plus een advies. Staan er twee of drie op een
            kaart, dan verdwijnt de afsluiting eronder uit beeld en lijkt de kaart een
            rapport. Dichtgeklapt zie je hoeveel er zijn en waar ze over gaan; wat je moet
            weten om te beslissen staat in de eerste zin, en de rest is één klik weg.

            Lichtblauw en niet rood: rood is hier de kleur van een foutmelding — van iets dat
            misging in het scherm zelf, zoals bij afkeurFout hieronder. Een bevinding is geen
            storing maar de opbrengst van de kaart. */}
        {afkeuringen.length === 0 ? (
          <p className="border-y border-gray-100 py-3 text-center text-sm text-gray-500">
            Je hebt nog geen bevindingen toegevoegd.
          </p>
        ) : (
          <ul className="space-y-2">
            {afkeuringen.map((b) => (
              <li key={b.id} className="rounded bg-blue-50 text-sm text-blue-950">
                <details>
                  <summary className="cursor-pointer p-3">
                    <span className="mr-2 inline-flex flex-wrap items-center gap-2 text-xs align-middle">
                      {b.findingCode && (
                        <span className="rounded bg-white/70 px-1.5 py-0.5 font-mono font-medium">
                          {b.findingCode}
                        </span>
                      )}
                      {b.impact && (
                        <span className="rounded bg-white/70 px-1.5 py-0.5">{b.impact}</span>
                      )}
                    </span>
                    <span className="leading-relaxed">{eersteZin(b.description)}</span>
                  </summary>
                  <div className="px-3 pb-3">
                    <p className="whitespace-pre-line leading-relaxed">{b.description}</p>
                    {b.advice && (
                      <div className="mt-2 border-t border-black/10 pt-2">
                        <p className="mb-0.5 text-xs font-medium opacity-70">Advies</p>
                        <p className="whitespace-pre-line leading-relaxed">{b.advice}</p>
                      </div>
                    )}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}

        {/* De knop staat onder de lijst en niet naast de kop: je voegt iets toe nadat je
            hebt gezien wat er al staat, niet ervoor. */}
        {!afkeurOpen && (
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={() => setAfkeurOpen(true)}
              className="rounded bg-blue-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-800"
            >
              Bevinding toevoegen
            </button>
          </div>
        )}

        {afkeurFout && (
          <p className="mt-2 rounded bg-red-50 px-3 py-2 text-sm text-red-800">{afkeurFout}</p>
        )}

        {afkeurOpen && (
          <div className="mt-2 rounded border border-gray-300 p-3">
            <textarea
              value={afkeurTekst}
              onChange={(e) => setAfkeurTekst(e.target.value)}
              rows={3}
              placeholder="Wat is er mis? Noem het onderdeel, de betrokken pagina en de namen die je naast elkaar legde."
              className="mb-2 w-full rounded border border-gray-300 p-2 text-sm"
            />
            <textarea
              value={afkeurAdvies}
              onChange={(e) => setAfkeurAdvies(e.target.value)}
              rows={2}
              placeholder="Advies: welke naam moet het overal worden?"
              className="mb-2 w-full rounded border border-gray-300 p-2 text-sm"
            />
            <label className="mb-2 block text-xs text-gray-600">
              Impact
              <select
                value={afkeurImpact}
                onChange={(e) => setAfkeurImpact(e.target.value)}
                className="ml-2 rounded border border-gray-300 px-2 py-1 text-sm"
              >
                <option value="klein">klein</option>
                <option value="matig">matig</option>
                <option value="serieus">serieus</option>
                <option value="kritiek">kritiek</option>
              </select>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={afkeurBezig || !afkeurTekst.trim()}
                onClick={() => voegAfkeuringToe(cel)}
                className="rounded bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-40"
              >
                Opslaan
              </button>
              <button
                type="button"
                onClick={() => {
                  setAfkeurOpen(false);
                  setAfkeurFout(null);
                }}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Annuleren
              </button>
            </div>
          </div>
        )}
      </section>
    );
  };

  /**
   * Het lijstje waarover je beslist, vlak boven de knoppen.
   *
   * Dezelfde vondsten als bij stap 3, maar dan kort en op de plek waar je ze nodig hebt. De
   * instructie "weeg of een verschil aanvaardbaar is" stond los van de dingen die gewogen
   * moeten worden; dan moet je terugbladeren en onthouden wat er ook alweer stond.
   */
  const teWegenBlok = (cel: Cel) => {
    const metingen = cel.verantwoording ?? [];
    const meting = metingen.find((m) => Array.isArray((m.uitkomst as any)?.onderdelen));
    const gemeten: any[] = (meting ? (meting.uitkomst as any).onderdelen : []) ?? [];
    // Aantekeningen bij een gemeten onderdeel staan daar al; hier alleen de eigen vondsten.
    const eigen = (cel.zelfGevonden ?? []).filter((o) => !o.overOnderdeel);
    const regels: { wat: string; varianten: string[]; bron: string }[] = [
      ...gemeten.map((o: any) => ({
        wat: leesbaarOnderdeel(o.sleutel).naam,
        varianten: o.namen.map((n: any) => n.naam),
        bron: 'gemeten',
      })),
      ...eigen.map((o) => ({
        wat: o.omschrijving,
        varianten: o.varianten.map((v) => v.wat),
        bron: 'door jou',
      })),
    ];
    if (!regels.length) return null;

    return (
      <div className="mb-3 rounded border border-gray-200 p-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
          Te wegen — {regels.length} {regels.length === 1 ? 'onderdeel' : 'onderdelen'}
        </p>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm">
          {regels.map((r, i) => (
            <li key={i}>
              <span className="font-medium text-gray-900">{r.wat}</span>
              <span className="ml-1 text-xs text-gray-500">({r.bron})</span>
              <br />
              <span className="text-gray-700">
                {r.varianten.map((v) => '\u201C' + v + '\u201D').join(' tegen ')}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-xs text-gray-500">
          Per onderdeel: dezelfde functie? Zo ja, is dit aanvaardbare variatie of een afkeuring
          (F31)? Consistent hoeft niet identiek te zijn.
        </p>
      </div>
    );
  };

  const metingenBlok = (cel: Cel, metKop = true) => {
    const metingen = cel.verantwoording ?? [];

    return (
        <div className={metKop ? 'mb-4 border-t border-gray-200 pt-3' : 'mb-4'}>
          {metKop && (
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              Zo is het vastgesteld
            </p>
          )}
          {metingen.length === 0 ? (
            <p className="text-sm text-gray-500">
              {/* Op een vraagkaart is er nog geen oordeel, dus de zin erover klopt daar niet:
                  daar staat juist dát het niet vast te stellen was. */}
              {cel.status === 'niet_te_bepalen'
                ? 'Er is nog niet gemeten op deze pagina.'
                : 'Geen metingen vastgelegd. Dit oordeel is in overleg of met de hand tot stand gekomen.'}
            </p>
          ) : (
            <ul className="space-y-2">
              {metingen.map((m, i) => {
                // Een aan-uit-vlag schrijf je zonder waarde: --text, niet --text=true.
                // Beide werken, maar de regel is er om over te typen en zo typt niemand
                // het. Vlaggen met een echte waarde (--breedte=320) houden hun waarde.
                // `aanroep` staat erin als het commando iets anders meekrijgt dan een
                // pagina-adres — `get-consistentie` krijgt het onderzoeksnummer. Het veld
                // `url` is een koppelsleutel voor `koppel-logboek` en niet wat er gedraaid is.
                const regel =
                  m.aanroep ??
                  `npm run cli -- ${m.commando} ${m.url ?? ''}${Object.entries(
                    m.argumenten ?? {}
                  )
                    .map(([k, v]) => (v === 'true' ? ` --${k}` : ` --${k}=${v}`))
                    .join('')}`.trim();
                const sleutel = `${m.commando}-${m.tijd ?? i}`;
                const hermeting = hermetingen[sleutel];
                return (
                  <li key={sleutel} className="rounded border border-gray-200 bg-gray-50 p-2">
                    {/* De handeling bovenaan, de aanroep eronder. Wie zijn naam onder dit
                        onderzoek zet, moet kunnen zien of er gedaan is wat hij zelf gedaan
                        zou hebben; "bytes: 206393, scope: document" beantwoordt dat niet.
                        De zin komt uit de meting zelf (veld `stap`), niet van een agent.
                        Metingen van vóór dat veld hebben hem niet en tonen alleen de
                        aanroep, zoals voorheen. */}
                    {m.stap && (
                      <p className="mb-1.5 text-sm text-gray-900">{m.stap}</p>
                    )}
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
                            // Een lijst is inhoud en geen meetgetal: `onderdelen` en
                            // `iconen` staan uitgewerkt op de kaart zelf. Hier alleen
                            // hoeveel het er zijn, anders leest deze regel als
                            // "onderdelen: 0 [object Object] / 1 [object Object]".
                            .map(([k, v]) =>
                              Array.isArray(v)
                                ? `${k}: ${v.length}`
                                :
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
                      if (!beeld && !bestand && !m.schermafdrukken?.length) return null;

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
                          {/* Meer dan één beeld bij één meting.
                              Een sweep die veertig elementen afloopt en elk in twee
                              toestanden bekijkt, heeft aan één opname niet genoeg: dat een
                              pictogram op zweven verandert was daardoor wel gemeten maar
                              nergens te zien, en dan is het weer een bewering. */}
                          {!!m.schermafdrukken?.length && (
                            <div className="flex flex-wrap gap-2">
                              {m.schermafdrukken.map((b, j) => (
                                <a
                                  key={j}
                                  href={bron(b.pad)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block max-w-[12rem]"
                                >
                                  <img
                                    src={bron(b.pad)}
                                    alt={b.bijschrift}
                                    className="max-h-32 rounded border border-gray-300 bg-white"
                                  />
                                  <span className="mt-0.5 block text-xs text-gray-600">
                                    {b.bijschrift}
                                  </span>
                                </a>
                              ))}
                            </div>
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
                          {/* Ook de lijst telt mee. `get-consistentie` maakt geen afdruk van
                              "de pagina" — hij bezoekt er zestien — maar wel van elk onderdeel
                              dat afwijkt, en die komen in `schermafdrukken`. Keek deze regel
                              alleen naar het enkelvoud, dan meldde hij "geen schermafdruk"
                              terwijl er negen boven stonden. */}
                          {!beeld && !m.schermafdrukken?.length && (
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
          {meetAanbod(cel)}
        </div>
    );
  };

  /** De onderbouwing plus de controle erop. Samen, op de oordeelkaart. */
  /**
   * `metMetingen` uit betekent: alleen het akkoord, zonder de lijst met commando's.
   *
   * Op een auditkaart staat die lijst al onder "Zo is het vastgesteld". Stond hij hier ook,
   * dan verscheen dat kopje twee keer in hetzelfde uitklapblok, met dezelfde commando's
   * eronder.
   */
  const bewijsBlokken = (cel: Cel, metMetingen = true) => {
    const controle = cel.controle;
    const TEKEN: Record<string, string> = { ja: '✓', nee: '✗', nvt: '—' };

    return (
      <>
        {metMetingen && metingenBlok(cel)}

        <div className="mb-4 border-t border-gray-200 pt-3">
          {/* De onderzoeker is de controle. Niet een van twee.
              Hier stond eerst een kop over een tweede agent, met op elke kaart de melding
              dat die er niet langs was geweest. Dat zette het verkeerd om: de agent meet en
              Frits controleert, dat ís het proces, en zijn akkoord is de poort waar alles
              doorheen moet (docs/adr/0001-akkoord-als-poort.md). Die tweede agent is een
              hulpje voor een ronde over twintig paginas tegelijk, geen norm waar zijn
              oordeel bij achterblijft.

              Het argument om zijn afwezigheid te tonen — anders ziet niet-gecontroleerd
              eruit als gecontroleerd — gaat over de METINGEN, en die staan er nu allemaal,
              met beeld en met de weergave erbij. Dus alleen noemen als hij er werkelijk
              langs is geweest. */}
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

          {!!controle?.punten?.length && (
            <div className="mt-3">
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
            </div>
          )}
        </div>
      </>
    );
  };

  /**
   * De kop van een kaart, en bij een sitebreed criterium wat dat betekent.
   *
   * Staat er "3.2.4 · Home" boven, dan leest de knop "In orde" als een uitspraak over de
   * homepage. Maar 3.2.4 gaat over een set pagina's: je bevestigt een conclusie die over
   * zestien pagina's is getrokken, en die hier alleen wordt vástgelegd. Dat verschil hoort
   * op de kaart te staan, anders klikt iemand iets aan wat hij niet bedoelt.
   */
  const kaartkop = (cel: Cel) => (
    <>
      <p className="mb-1 text-sm text-gray-500">
        {cel.code} — {critTitel(cel.code)} ·{' '}
        {isSitebreed(cel.code) ? 'hele website' : sampleTitel(cel.sampleId)}
      </p>
      {isSitebreed(cel.code) && (
        <p className="mb-3 text-xs text-gray-500">
          Vastgelegd op {sampleTitel(cel.sampleId)}; op de andere pagina&apos;s staat een
          verwijzing hierheen.
        </p>
      )}
    </>
  );

  /** Boven de knoppen, zodat duidelijk is waarover je beslist. */
  const sitebreedMelding = (cel: Cel) => {
    if (!isSitebreed(cel.code)) return null;
    // Het aantal pagina's komt uit de meting zelf, niet uit een aanname.
    const meting = (cel.verantwoording ?? []).find(
      (m) => typeof (m.uitkomst as any)?.paginas === 'number'
    );
    const paginas = meting ? ((meting.uitkomst as any).paginas as number) : null;
    return (
      <p className="mb-3 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
        Je beslist hier over de hele set samples, niet over deze pagina alleen
        {paginas ? `. De vergelijking loopt over ${paginas} pagina's` : ''}.
      </p>
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
   * De uitleg boven aan deze kaart, uit het regelbestand van het criterium. Ontbreekt hij,
   * dan toont de kaart wat hij altijd toonde. Zie lib/criterium-kaarttekst.ts.
   */
  const kaarttekst = huidigeCode ? kaartteksten[huidigeCode] ?? null : null;

  /**
   * Is dit oordeel al door de onderzoeker goedgekeurd?
   *
   * Alleen bij een echt akkoord, niet bij een afwijzing: na "Klopt niet" is er nog iets te
   * kiezen, na "Klopt" niet meer.
   */
  const alAkkoord = huidig && huidig.soort !== 'voorstel' && huidig.cel.akkoord === 'akkoord';

  /**
   * Het lijf van een auditkaart: de naam van de toets, waar het op neerkomt, het
   * succescriterium met zijn niveau, de instructies, en de bevindingen.
   *
   * Dit staat op één plek omdat twee kaarten het tonen: een criterium dat nog openstaat, en
   * een oordeel dat op akkoord wacht. Die tweede had een eigen weergave — een blauw label,
   * de lopende tekst van de workflow, en daaronder een lijst bevindingen — en die leek in
   * niets op de kaart ernaast. Bij 1.1.1 op Home leverde dat twee verschillende schermen op
   * voor dezelfde vraag, terwijl 3.2.4 de nieuwe indeling had.
   *
   * Alleen aan te roepen als `kaarttekst` er is.
   */
  /**
   * Het criteriumnummer met zijn naam, bovenaan de kaart.
   *
   * De kaart begon met "Oordeel van de agent · voldoet niet" en daaronder de naam van de
   * toets in gewone taal. Waaróver dat oordeel ging stond pas verderop, onder
   * "Succescriterium". Bij het doorbladeren van twintig kaarten is dat precies het ene
   * gegeven dat je bij binnenkomst nodig hebt.
   */
  /**
   * Is dit criterium in een auditsessie bekeken, of headless?
   *
   * Het stond er altijd al — `browser: cdp | headless` per meting — maar als los woord
   * tussen een tijdstip en een aantal bytes, ingeklapt onder "Zo is het vastgesteld". Daar
   * leest niemand het, en dus valt het ook niemand op als het "headless" zegt terwijl de
   * instructies van het criterium om klikken vragen.
   *
   * Dat is geen theoretisch risico. 1.3.1 begint met "klap alle uitklapblokken open"; wat
   * dichtzit staat soms niet eens in de opgehaalde code, en dan ziet een pagina met
   * verborgen gebreken er hetzelfde uit als een pagina zonder. Op 23 augustus 2026 stond ik
   * op het punt 1.3.1 headless te beoordelen, en niets op het scherm hield me tegen.
   *
   * Geen metingen betekent geen badge: er valt dan niets te kwalificeren, en een rood kruis
   * op zeshonderd kaarten leert je alleen om het niet meer te zien.
   */
  const auditsessieBadge = (cel: Cel) => {
    const metingen = cel.verantwoording ?? [];
    if (!metingen.length) return null;
    // Het logboek schrijft 'auditsessie' of 'headless' (scripts/lib/audit-log.ts), niet de
    // ruwe browsermodus 'cdp'. Op die verkeerde vergelijking zette de badge een kruis bij
    // een meting die wél in een auditsessie was gedaan — een waarborg die het omgekeerde
    // beweert is erger dan geen waarborg.
    const inSessie = metingen.some((m) => m.browser === 'auditsessie' || m.browser === 'cdp');
    return (
      <span
        className={`rounded px-2 py-0.5 font-medium ${
          inSessie ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-900'
        }`}
        title={
          inSessie
            ? 'Ten minste één meting is gedaan in een auditsessie (npm run chrome:debug), dus met werkende cookies, sessies en klikbare onderdelen.'
            : 'Alle metingen zijn headless gedaan. Wat pas na een klik verschijnt — uitklapblokken, menus, formulierstappen — is dan niet beoordeeld.'
        }
      >
        {inSessie ? '✓ auditsessie' : '✗ zonder auditsessie'}
      </span>
    );
  };

  const criteriumRegel = (cel: Cel) =>
    kaarttekst ? (
      <p className="mb-2 text-sm font-medium text-gray-500">
        {cel.code} {critTitel(cel.code)}
      </p>
    ) : null;

  /**
   * Wat er per deelgebied is nagelopen — alleen bij een criterium dat er meerdere heeft.
   *
   * Dit lost het gat dat een lopende onderbouwing laat vallen. Bij BEV-03 stond 1.3.1 op
   * `opmerking` met een verhaal over de koppenstructuur, terwijl er op diezelfde pagina
   * `em`-elementen om gewone zinnen stonden. Niemand zag dat de andere twaalf gebieden niet
   * waren nagelopen, want een verhaal dat iets weglaat leest hetzelfde als een verhaal dat
   * niets te melden had.
   *
   * Een streepje is hier informatie en geen leegte: "geen tabellen op deze pagina" is iets
   * anders dan "niet naar tabellen gekeken". Dat laatste is de open ring.
   */
  const gebiedenBlok = (cel: Cel) => {
    const lijst = kaarttekst?.gebieden ?? [];
    if (!lijst.length) return null;
    const per = new Map((cel.gebieden ?? []).map((g) => [g.gebied, g]));
    const open = lijst.filter((g) => !per.has(g)).length;
    /**
     * Er ligt al een oordeel, maar er is niets per gebied vastgelegd.
     *
     * Dat is niet "niets nagekeken". Deze lijst bestaat sinds 2026-08-23; alles wat de
     * workflow daarvóór beoordeelde heeft een onderbouwing in lopende tekst en verder
     * niets. Op de 1.3.1-kaart van Home stond een bevinding over een footerrij die geen
     * lijst is — de agent had dus wel degelijk naar lijsten gekeken — terwijl er dertien
     * open ringen boven stonden met "nog niet nagelopen". Dat is een bewering die we niet
     * kunnen waarmaken, en ze maakt het werk van de agent onzichtbaar.
     */
    const nietVastgelegd = per.size === 0 && !!cel.status;

    return (
      <section className="mb-4 border-t border-gray-200 pt-3">
        <h3 className="mb-1 text-lg font-semibold text-gray-900">Nagelopen</h3>
        <p className="mb-2 text-sm text-gray-600">
          {nietVastgelegd
            ? 'Dit oordeel dateert van voordat deze lijst bestond. Wat er per gebied is nagekeken staat niet apart vastgelegd — kijk in de onderbouwing onder "Zo is het vastgesteld".'
            : open === 0
              ? `Alle ${lijst.length} gebieden zijn langsgelopen.`
              : `${lijst.length - open} van de ${lijst.length} gebieden zijn langsgelopen; ${open} nog niet.`}
        </p>
        <ul className="space-y-1">
          {lijst.map((gebied) => {
            const u = per.get(gebied);
            // Vier uitkomsten, vier tekens. Het uitroepteken is de opmerking: geen afkeuring,
            // maar wel iets dat gemeld is. Zou dat een kruis krijgen, dan leest een criterium
            // dat gewoon voldoet als afgekeurd.
            const teken = !u
              ? '○'
              : u.uitkomst === 'ok'
                ? '✓'
                : u.uitkomst === 'nvt'
                  ? '–'
                  : u.uitkomst === 'opmerking'
                    ? '!'
                    : '✗';
            const kleur = !u
              ? 'text-gray-400'
              : u.uitkomst === 'ok'
                ? 'text-green-700'
                : u.uitkomst === 'nvt'
                  ? 'text-gray-400'
                  : u.uitkomst === 'opmerking'
                    ? 'text-amber-700'
                    : 'text-red-700';
            return (
              <li key={gebied} className="flex gap-2 text-sm leading-relaxed">
                <span className={kleur} aria-hidden="true">
                  {teken}
                </span>
                <span className="flex-1">
                  <span className={u ? 'text-gray-900' : 'text-gray-500'}>{gebied}</span>
                  {u?.toelichting && (
                    <span className="text-gray-600"> — {u.toelichting}</span>
                  )}
                  {!u && (
                    <span className="text-gray-400">
                      {nietVastgelegd ? ' — niet apart vastgelegd' : ' — nog niet nagelopen'}
                    </span>
                  )}
                  {u && u.uitkomst === 'nvt' && !u.toelichting && (
                    <span className="text-gray-500"> — niet aanwezig op deze pagina</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    );
  };

  const auditkaartLijf = (cel: Cel) => (
    <>
      <h2 className="mb-1 text-2xl font-semibold text-gray-900">{kaarttekst!.titel}</h2>
      {kaarttekst!.inKort.map((alinea, i) => (
        <p key={i} className="mb-3 leading-relaxed text-gray-700">
          {metCode(alinea)}
        </p>
      ))}

      <h3 className="mb-1 mt-5 text-lg font-semibold text-gray-900">Succescriterium</h3>
      <p className="mb-4 flex flex-wrap items-center gap-2">
        <span className="font-medium text-gray-900">
          {cel.code} {critTitel(cel.code)}
        </span>
        {critNiveau(cel.code) && (
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-700">
            WCAG {critNiveau(cel.code)}
          </span>
        )}
        {isSitebreed(cel.code) && (
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-700">
            hele website
          </span>
        )}
      </p>

      <h3 className="mb-2 mt-5 text-lg font-semibold text-gray-900">Audit-instructies</h3>
      {/* De instructies staan in fasen: eerst wat je in de auditsessie doet (kijken,
          klikken, de functie vaststellen), dan wat je in de code leest (namen, alt,
          aria-label). Andersom vergelijk je namen van onderdelen waarvan je niet weet of
          ze hetzelfde doen. */}
      {kaarttekst!.instructies.map((groep, g) => (
        <div key={g} className="mb-4">
          {groep.titel && <p className="mb-1 font-medium text-gray-900">{groep.titel}</p>}
          <ul className="space-y-1">
            {groep.stappen.map((stap, i) => (
              <li key={i} className="flex gap-2 leading-relaxed">
                {/* Een vinkje bij wat de meting al deed, een open rondje bij wat nog van
                    jou wordt gevraagd. Zonder dat leest een gedane stap als een opdracht. */}
                <span
                  className={stap.door === 'jij' ? 'text-gray-400' : 'text-green-700'}
                  aria-hidden="true"
                >
                  {stap.door === 'jij' ? '○' : '✓'}
                </span>
                <span className="flex-1 text-gray-900">{metCode(stap.tekst)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {gebiedenBlok(cel)}
      {afkeuringenBlok(cel)}
    </>
  );

  /**
   * "Zo is het vastgesteld", ingeklapt onder aan de kaart.
   *
   * `redenTonen` staat alleen aan op de kaart van een oordeel dat op akkoord wacht. Daar is
   * de tekst van de workflow niet zomaar achtergrond: het is precies datgene waar je "Klopt"
   * tegen zegt, en die mag dan niet onvindbaar zijn. Op een kaart die nog openstaat blijft
   * hij weg — daar toont de meting zelf wat er gevonden is, en een oudere lezing ernaast
   * wordt een tweede verhaal dat uit elkaar loopt met het eerste.
   */
  const vastgesteldDetails = (cel: Cel, redenTonen = false) =>
    kaarttekst ? (
      <details className="mt-4 border-t border-gray-200 pt-3">
        <summary className="cursor-pointer text-xs font-medium uppercase tracking-wide text-gray-500">
          5 · Zo is het vastgesteld
        </summary>
        <div className="mt-3">
          {/* Eerst wat er gebeurt en waar de gegevens vandaan komen, dan pas de commando’s.
              Een lijst met tijdstippen zegt wat er gedraaid is, niet wat er gemeten is — en
              niet wat het gereedschap niet ziet. */}
          {kaarttekst.vastgesteld?.length ? (
            <div className="mb-4 space-y-2">
              {kaarttekst.vastgesteld.map((alinea, i) => (
                <p key={i} className="text-sm leading-relaxed text-gray-700">
                  {metCode(alinea)}
                </p>
              ))}
            </div>
          ) : null}

          {redenTonen && (
            <div className="mb-4">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                Wat de agent op deze pagina noteerde
              </p>
              <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
                {cel.reden ?? '(geen onderbouwing gegeven)'}
              </p>
            </div>
          )}

          {metingenBlok(cel, false)}
        </div>
      </details>
    ) : null;

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
          {criteriumRegel(huidig.cel)}
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded bg-blue-50 px-2 py-0.5 font-medium text-blue-900">
              Oordeel van de agent
            </span>
            <span
              className={`rounded px-2 py-0.5 font-medium ${
                OORDEEL_KLEUR[huidig.cel.status ?? ''] ?? 'bg-gray-100 text-gray-700'
              }`}
            >
              {/* Op een auditkaart staat dezelfde uitkomst in dezelfde woorden als op de
                  kaart van een criterium dat nog openstaat: "voldoet niet", niet
                  "afgekeurd". Twee woorden voor hetzelfde lezen als twee dingen. */}
              {kaarttekst
                ? huidig.cel.status === 'afgekeurd'
                  ? 'voldoet niet'
                  : huidig.cel.status
                : huidig.cel.status}
            </span>
            {huidig.cel.bron && (
              <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-600">
                {HERKOMST[huidig.cel.bron] ?? huidig.cel.bron}
              </span>
            )}
            {auditsessieBadge(huidig.cel)}
          </div>

          {/* Heeft dit criterium een `## Op de kaart`, dan is dit dezelfde kaart als die
              van een criterium dat nog openstaat: dezelfde kop, dezelfde instructies,
              dezelfde bevindingen. Alleen de afsluiting verschilt — hier zeg je ja of nee
              tegen een oordeel dat er al ligt. De lopende tekst van de workflow is niet weg
              maar verhuisd naar "Zo is het vastgesteld"; zie vastgesteldDetails. */}
          {kaarttekst ? (
            auditkaartLijf(huidig.cel)
          ) : (
            <>
              {kaartkop(huidig.cel)}
              <p className="mb-4 whitespace-pre-line leading-relaxed text-gray-900">
                {huidig.cel.reden ?? '(geen onderbouwing gegeven)'}
              </p>
            </>
          )}

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

          {!kaarttekst && huidig.cel.bevindingen.length > 0 && (
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

          {!kaarttekst && bewijsBlokken(huidig.cel)}

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
            <>
            {sitebreedMelding(huidig.cel)}
            {/* Ruim boven de afsluiting, en gecentreerd — net als op de kaart van een
                criterium dat nog openstaat. Wat je hierboven doet is het materiaal lezen;
                hier zeg je of het oordeel klopt. Zonder die ruimte lezen de drie knoppen als
                een vervolg op de bevindingenlijst. */}
            {/* De stand van het akkoord hoort hier, bij de knoppen die hem veranderen.

                Hij stond onderaan in "Zo is het vastgesteld", ingeklapt, achter de
                commando's en de artefacten. Daar is hij geen antwoord meer op de vraag die
                de kaart stelt maar een voetnoot — terwijl er bovenaan stond dat het oordeel
                nog op je akkoord wachtte en onderaan dat je het allang gegeven had. */}
            {kaarttekst && (
              <p
                className={`mb-2 mt-12 text-center text-sm font-medium ${
                  huidig.cel.akkoord === 'akkoord'
                    ? 'text-green-800'
                    : huidig.cel.akkoord === 'afgewezen'
                      ? 'text-red-800'
                      : 'text-gray-700'
                }`}
              >
                {huidig.cel.akkoord === 'akkoord'
                  ? '✓ Door jou nagekeken en akkoord bevonden.'
                  : huidig.cel.akkoord === 'afgewezen'
                    ? '✗ Door jou afgewezen.'
                    : 'De agent heeft dit criterium beoordeeld. Dat oordeel telt pas mee als jij het bevestigt.'}
              </p>
            )}
            {/* Heb je al akkoord gegeven, dan is er niets meer te kiezen: de drie knoppen
                gaan uit. Ze bleven aanstaan boven de regel dat je het had nagekeken, en dan
                staat er een vraag onder een antwoord. */}
            <div className={kaarttekst ? 'flex flex-wrap justify-center gap-2' : 'flex flex-wrap gap-2'}>
              <button
                type="button"
                disabled={bezig || alAkkoord}
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
                disabled={bezig || alAkkoord}
                onClick={() => setUitgang('corrigeren')}
                className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                Klopt niet
              </button>
              {/* Derde uitkomst, naast eens en oneens: je weet dat er iets niet
                  deugt maar nog niet wat het moet worden. */}
              <button
                type="button"
                disabled={bezig || alAkkoord}
                onClick={() => setUitgang('overleggen')}
                className="rounded border border-blue-300 px-4 py-2 text-sm text-blue-900 hover:bg-blue-50 disabled:opacity-40"
              >
                Overleggen
              </button>
            </div>
            </>
          )}

          {/* De verantwoording, ingeklapt. Hier mét de tekst die de workflow bij dit oordeel
              schreef: dát is waar "Klopt" ja tegen zegt, dus die mag niet onvindbaar zijn. */}
          {vastgesteldDetails(huidig.cel, true)}
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
          {/* Wat de agent ervan maakt, niet "jij moet nog kijken".
              
              De agent heeft de stappen afgelopen: gemeten, nagelopen wat hij zelf kon
              controleren, en bij elk gevonden onderdeel een bevinding voorgelegd. Wat overblijft
              is een oordeel — en dat hoort hij te geven, net als bij een bevinding, zodat jij
              iets hebt om ja of nee tegen te zeggen. "Jij moet kijken" verzweeg dat er al een
              uitkomst lag.

              Het volgt uit de bevindingen, niet uit een aparte knop: staat er een afkeuring,
              dan voldoet het criterium niet. Dezelfde rekensom als criteriumOordeel in
              gegevens.ts, en als de knop "Klaar" hieronder. */}
          {criteriumRegel(huidig.cel)}
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
            {kaarttekst ? (
              <>
                <span className="rounded bg-blue-50 px-2 py-0.5 font-medium text-blue-900">
                  Oordeel van de agent
                </span>
                <span
                  className={`rounded px-2 py-0.5 font-medium ${
                    huidig.cel.bevindingen.some((b) => b.type !== 'opmerking')
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {huidig.cel.bevindingen.some((b) => b.type !== 'opmerking')
                    ? 'voldoet niet'
                    : 'voldoet'}
                </span>
              </>
            ) : (
              <span className="rounded bg-blue-100 px-2 py-0.5 font-medium text-blue-800">
                Jij moet kijken
              </span>
            )}
            {huidig.cel.bron && (
              <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-600">
                {HERKOMST[huidig.cel.bron] ?? huidig.cel.bron}
              </span>
            )}
            {auditsessieBadge(huidig.cel)}
          </div>

          {/* Heeft dit criterium een `## Op de kaart` in zijn regelbestand, dan krijgt het de
              indeling van een auditkaart: de naam van de toets in gewone taal, waar het op
              neerkomt, het succescriterium met zijn niveau, en de instructies als lijst.
              Zonder die sectie blijft de kaart wat hij was. */}
          {kaarttekst ? (
            <>
              {auditkaartLijf(huidig.cel)}
            </>
          ) : (
            <>
              <p className="mb-4 leading-relaxed text-gray-900">
                {huidig.cel.reden ?? 'Dit criterium vergt een browsertest.'}
              </p>

              {/* Wat er al gemeten is, en wat je hier alsnog kunt laten meten.
                  Op déze kaart staat dat een criterium niet vast te stellen was. Kan het wel
                  gemeten worden, dan is dat het eerste wat je wilt zien — anders staat er een
                  vraag aan jou waar een knop het antwoord had kunnen geven. */}
              {metingenBlok(huidig.cel)}
            </>
          )}

          {verwerktMelding}
          {fout && <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-800">{fout}</p>}

          {!kaarttekst && (
            <label className="mb-1 block text-sm font-medium text-gray-800">
              Wat zag je? <span className="font-normal text-gray-500">(mag leeg)</span>
            </label>
          )}
          {!kaarttekst && (
            <p className="mb-2 text-xs text-gray-500">
              Wordt bewaard bij het oordeel, zodat later terug te zien is waarop het berust.
              Schrijf op wat je hebt gedaan en wat je zag, met de waarden die je hebt gemeten.
            </p>
          )}
          {/* Het notitieveld hoort niet op een auditkaart: daar leg je vast wat je vond,
              niet wat je deed. Wie toch iets kwijt wil doet dat in een bevinding. Op de
              kaarten zonder `## Op de kaart` blijft het staan, want daar is het het enige
              wat de onderzoeker kan opschrijven. */}
          {!kaarttekst && (
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
          )}

          {!kaarttekst && sitebreedMelding(huidig.cel)}
          {kaarttekst ? (
            <>
              {/* Zoals op een auditkaart: je kiest niet tussen "voldoet" en "voldoet niet".
                  Je voegt toe wat je vindt, en zegt wanneer je klaar bent. Het oordeel volgt
                  uit de afkeuringen — precies zoals criteriumOordeel in gegevens.ts rekent.
                  Daarmee kan de toestand "afgekeurd zonder bevinding" niet meer ontstaan, en
                  die las onderaan als geslaagd. */}
              {/* Ruim boven de afsluiting. Wat je hierboven doet is materiaal verzamelen;
                  hieronder sluit je de stap af. Zonder die ruimte lijkt "Bevinding toevoegen"
                  een van de drie antwoordknoppen. */}
              <p className="mb-2 mt-12 text-center text-sm font-medium text-gray-700">
                {huidig.cel.bevindingen.some((b) => b.type !== 'opmerking')
                  ? 'Je hebt een afkeuring toegevoegd. Markeer de stap als klaar om dat vast te leggen.'
                  : 'Deze stap staat nog open.'}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  disabled={bezig}
                  onClick={() => beantwoord(huidig.cel, 'niet_aanwezig')}
                  className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                >
                  Niet van toepassing
                </button>
                <button
                  type="button"
                  disabled={bezig}
                  onClick={() =>
                    beantwoord(
                      huidig.cel,
                      huidig.cel.bevindingen.some((b) => b.type !== 'opmerking')
                        ? 'afgekeurd'
                        : 'voldoet'
                    )
                  }
                  className="rounded-full border border-green-700 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-50 disabled:opacity-40"
                >
                  Klaar
                </button>
              </div>
            </>
          ) : (
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
          )}

          {/* Stap 5: de verantwoording. Belangrijk dat het er staat, niet belangrijk dat je
              het als eerste leest — vandaar ingeklapt. Hier zit ook "Meet dit nu".

              Zonder tweede argument: op een kaart die nog openstaat blijft de tekst van de
              workflow weg. Wat de meting vandaag vond staat bij de bevindingen, en een oudere
              lezing ernaast wordt een tweede verhaal dat daarmee uit elkaar loopt. */}
          {vastgesteldDetails(huidig.cel)}
          {/* Alleen op de oude kaarten. Deze zin gaat over de knop "Ik zie iets — noteren",
              die je wegstuurde naar het waarnemingenscherm, en over het veld "Wat zag je?".
              Op een kaart met eigen instructies bestaan die geen van beide: je schrijft een
              bevinding daar waar hij hoort. */}
          {!kaarttekst && (
            <p className="mt-3 text-xs text-gray-500">
              De vraag blijft openstaan tot je hem beantwoordt. Schrijf je een bevinding, kom dan
              terug om hier vast te leggen wat je zag.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
