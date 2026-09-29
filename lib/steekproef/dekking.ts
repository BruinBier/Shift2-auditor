/**
 * Van gemeten kenmerken naar de gebieden uit de dekkingslijst (steekproefselectie v2, fase 2).
 *
 * De dekkingslijst (`wcag-regels/Shift2_Dekkingslijst_Steekproef.md`) blijft de enige bron
 * voor WELKE gebieden er zijn; elk gebied in groep 2 heeft daar een vaste id
 * (`<!-- gebied: G21 -->`). Hier staat alleen HOE code een gebied herkent. Elk gebied valt
 * in precies één van drie soorten -- de test in dekking.test.ts bewaakt dat:
 *
 *   - CODE: de browsermeting stelt het vast, met bewijs;
 *   - ELDERS: een eigen meting doet het (beweging: get-beweging; een document zelf: de
 *     documentmeting), niet de paginameting;
 *   - SEMANTISCH: code kan het niet vaststellen. Wordt in fase 2 bewust NIET ingevuld;
 *     dat is werk voor de SemanticClassifier (fase 4).
 *
 * "Niet gevonden" is hier nooit "niet aanwezig": een gebied zonder treffer is alleen niet
 * door code gezien. Wat semantisch is, blijft open.
 */

export const DEKKING_VERSIE = 1;

export type GebiedId =
  | 'G01' | 'G02' | 'G03' | 'G04' | 'G05' | 'G06' | 'G07' | 'G08' | 'G09' | 'G10'
  | 'G11' | 'G12' | 'G13' | 'G14' | 'G15' | 'G16' | 'G17' | 'G18' | 'G19' | 'G20'
  | 'G21' | 'G22' | 'G23' | 'G24' | 'G25' | 'G26' | 'G27' | 'G28' | 'G29' | 'G30'
  | 'G31' | 'G32';

export interface GebiedTreffer {
  gebied: GebiedId;
  naam: string;
  /** Hoe zeker: `code` = rechtstreeks gemeten; `code-heuristiek` = afgeleid uit opbouw of maten. */
  bron: 'code' | 'code-heuristiek';
  bewijs: string;
  aantal: number;
}

type Kenmerken = any;

interface Regel {
  gebied: GebiedId;
  naam: string;
  bron: 'code' | 'code-heuristiek';
  /** Geeft [aantal, bewijs] terug, of null als niets gevonden. */
  herken: (k: Kenmerken, meta: { htmlTaal: string | null }) => [number, string] | null;
}

const kort = (s: string | null | undefined, n = 80) => (s || '').replace(/\s+/g, ' ').trim().slice(0, n);

export const CODE_REGELS: Regel[] = [
  {
    gebied: 'G01',
    naam: 'Logo',
    bron: 'code',
    herken: (k) => (k.logo ? [1, `${k.logo.pad} alt="${kort(k.logo.alt, 60)}"`] : null),
  },
  {
    gebied: 'G02',
    naam: 'Hero- of headerafbeelding zonder tekst',
    bron: 'code-heuristiek',
    herken: (k) =>
      k.hero && !(k.hero.tekstErover || []).some((t: any) => !t.opVlak)
        ? [1, `${k.hero.pad} ${k.hero.vak.b}×${k.hero.vak.h}${k.hero.tekstErover?.length ? ', tekst staat op een eigen vlak' : ''}`]
        : null,
  },
  {
    gebied: 'G04',
    naam: 'Hero met tekst eroverheen',
    bron: 'code-heuristiek',
    herken: (k) => {
      const erover = (k.hero?.tekstErover || []).filter((t: any) => !t.opVlak);
      return erover.length ? [erover.length, `${k.hero.pad}: "${kort(erover[0].tekst, 50)}" staat op de afbeelding`] : null;
    },
  },
  {
    gebied: 'G05',
    naam: 'Teaser- of kaartafbeeldingen in een overzicht',
    bron: 'code-heuristiek',
    herken: (k) =>
      k.overzichten?.length
        ? [k.overzichten.length, `${k.overzichten[0].pad}: ${k.overzichten[0].kaartjes} kaartjes, ${k.overzichten[0].metAfbeelding} met afbeelding, ${k.overzichten[0].metDatum} met datum`]
        : null,
  },
  {
    gebied: 'G06',
    naam: 'Afbeelding in een link of knop (behalve het logo)',
    bron: 'code',
    herken: (k) =>
      k.aantalAfbeeldingInLinkOfKnop
        ? [k.aantalAfbeeldingInLinkOfKnop, `${k.afbeeldingInLinkOfKnop[0].pad} alt="${kort(k.afbeeldingInLinkOfKnop[0].alt, 50)}"`]
        : null,
  },
  {
    gebied: 'G07',
    naam: 'Iconen zonder tekst ernaast',
    bron: 'code',
    herken: (k) =>
      k.aantalIconenZonderTekst ? [k.aantalIconenZonderTekst, `${k.iconenZonderTekst[0].pad}${k.iconenZonderTekst[0].naam ? ` (naam "${kort(k.iconenZonderTekst[0].naam, 40)}")` : ''}`] : null,
  },
  {
    gebied: 'G10',
    naam: 'Afbeelding met een onderschrift, of in een figure',
    bron: 'code',
    herken: (k) => (k.aantalFiguren ? [k.aantalFiguren, `${k.figuren[0].pad}${k.figuren[0].onderschrift ? `: "${kort(k.figuren[0].onderschrift, 50)}"` : ''}`] : null),
  },
  {
    gebied: 'G11',
    naam: 'Foto in de lopende tekst',
    bron: 'code-heuristiek',
    herken: (k) => (k.fotoInTekst?.length ? [k.fotoInTekst.length, `${k.fotoInTekst[0].pad} ${k.fotoInTekst[0].vak.b}×${k.fotoInTekst[0].vak.h}`] : null),
  },
  {
    gebied: 'G12',
    naam: 'Fotogalerij',
    bron: 'code-heuristiek',
    herken: (k) => (k.galerijen?.length ? [k.galerijen.length, `${k.galerijen[0].pad}: ${k.galerijen[0].afbeeldingen} afbeeldingen`] : null),
  },
  {
    gebied: 'G15',
    naam: 'Grafiek of diagram met een legenda',
    bron: 'code-heuristiek',
    herken: (k) => (k.grafieken?.length ? [k.grafieken.length, k.grafieken[0].pad] : null),
  },
  {
    gebied: 'G16',
    naam: 'Tabel',
    bron: 'code',
    herken: (k) => {
      const echt = (k.tabellen || []).filter((t: any) => !t.mogelijkOpmaak);
      const aantal = k.aantalTabellen || 0;
      if (!aantal) return null;
      const t = echt[0] || k.tabellen[0];
      return [aantal, `${t.pad}: ${t.rijen}×${t.kolommen}, ${t.koppen} kopcellen${t.dichtgeklapt ? ', in een dichtgeklapt blok' : ''}${echt.length ? '' : ' (mogelijk opmaaktabel)'}`];
    },
  },
  {
    gebied: 'G17',
    naam: 'Lijst, en geneste lijst',
    bron: 'code',
    herken: (k) =>
      k.aantalLijsten ? [k.aantalLijsten, `${k.aantalLijsten} lijsten in de inhoud, waarvan ${k.aantalGenesteLijsten} genest`] : null,
  },
  {
    gebied: 'G18',
    naam: 'Citaat',
    bron: 'code',
    herken: (k) => (k.citaten?.length ? [k.citaten.length, k.citaten[0].pad] : null),
  },
  {
    gebied: 'G19',
    naam: 'Anderstalig tekstfragment',
    bron: 'code',
    herken: (k) => (k.anderstalig?.length ? [k.anderstalig.length, `${k.anderstalig[0].pad} lang="${k.anderstalig[0].lang}"`] : null),
  },
  {
    gebied: 'G20',
    naam: 'Anderstalige pagina',
    bron: 'code',
    herken: (_k, m) => (m.htmlTaal && !/^nl/.test(m.htmlTaal) ? [1, `html lang="${m.htmlTaal}"`] : null),
  },
  {
    gebied: 'G21',
    naam: 'Video met geluid',
    bron: 'code',
    // Of er geluid is, meet de pagina niet: elke video telt hier, behalve een
    // automatisch spelende, gedempte lus (die is G22).
    herken: (k) => {
      const v = (k.videos || []).filter((x: any) => !(x.soort === 'video-element' && x.gedempt && x.automatisch && x.herhaalt));
      return v.length || (k.aantalVideos && !k.videos?.length)
        ? [v.length || k.aantalVideos, `${v[0]?.soort}: ${v[0]?.provider || ''} ${v[0]?.videoId || kort(v[0]?.bron, 60)}`.trim()]
        : null;
    },
  },
  {
    gebied: 'G22',
    naam: 'Video zonder geluid, of een animerende GIF',
    bron: 'code-heuristiek',
    herken: (k) => {
      const lus = (k.videos || []).filter((x: any) => x.soort === 'video-element' && x.gedempt && x.automatisch && x.herhaalt);
      const n = lus.length + (k.gifs?.length || 0);
      return n ? [n, lus[0] ? `${lus[0].pad}: gedempte lus` : `${k.gifs[0].pad} (GIF; of hij beweegt, is hier niet gemeten)`] : null;
    },
  },
  {
    gebied: 'G23',
    naam: 'Audio of podcast',
    bron: 'code',
    herken: (k) => (k.audio?.length ? [k.audio.length, `${k.audio[0].soort}: ${kort(k.audio[0].bron || k.audio[0].pad, 60)}`] : null),
  },
  {
    gebied: 'G25',
    naam: 'Accordeon of tabbladen',
    bron: 'code',
    herken: (k) => {
      const u = k.uitklap || {};
      const n = (u.details || 0) + (u.tablist || 0) + (u.ariaExpanded || 0);
      return n ? [n, `${u.details || 0} details, ${u.ariaExpanded || 0} uitklapknoppen, ${u.tablist || 0} tabbladgroepen`] : null;
    },
  },
  {
    gebied: 'G26',
    naam: 'Formulier',
    bron: 'code',
    herken: (k) => {
      const n = (k.aantalFormulieren || 0) + (k.iframeSoorten?.formulier || 0);
      if (n) {
        const f = k.formulieren?.[0];
        return [n, f ? `${f.pad}: ${f.velden} velden${f.veldnamen?.length ? ` (${f.veldnamen.slice(0, 3).map((x: string) => kort(x, 25)).join(', ')})` : ''}` : 'formulier in een iframe'];
      }
      return k.losseVelden >= 2 ? [k.losseVelden, `${k.losseVelden} invoervelden buiten een form-element`] : null;
    },
  },
  {
    gebied: 'G29',
    naam: 'Kaart in een iframe',
    bron: 'code-heuristiek',
    herken: (k) => {
      const achterToestemming = (k.geblokkeerd || []).filter((g: any) => g.soort === 'kaart').length;
      const n = (k.iframeSoorten?.kaart || 0) + (k.kaartenZonderIframe?.length || 0) || achterToestemming;
      const f = (k.iframes || []).find((x: any) => x.soort === 'kaart');
      if (!n) return null;
      const waar = f
        ? `iframe ${f.host}${f.plaatshouder ? ' (plaatshouder, laadt na toestemming)' : ''}`
        : k.kaartenZonderIframe?.length
          ? `${k.kaartenZonderIframe[0].pad}`
          : 'kaart';
      return [n, `${waar}${achterToestemming ? ', achter een toestemmingsscherm: de kaart zelf is niet geladen' : ''}`];
    },
  },
  {
    gebied: 'G30',
    naam: 'Ander kader van een ander domein',
    bron: 'code',
    herken: (k) => {
      const f = (k.iframes || []).filter((x: any) => x.soort === 'overig' && !x.eigenDomein);
      return f.length ? [f.length, `iframe ${f[0].host}${f[0].titel ? ` "${kort(f[0].titel, 40)}"` : ''}`] : null;
    },
  },
  {
    gebied: 'G31',
    naam: 'PDF (links naar documenten)',
    bron: 'code',
    herken: (k) =>
      k.aantalDocumentlinks
        ? [k.aantalDocumentlinks, `${k.aantalDocumentlinks} documentlinks, bijvoorbeeld "${kort(k.documentlinks[0].tekst || k.documentlinks[0].url, 50)}"`]
        : null,
  },
];

/** Door een andere meting vastgesteld dan de paginameting. */
export const ELDERS_GEMETEN: Partial<Record<GebiedId, string>> = {
  G27: 'get-beweging: of iets uit zichzelf beweegt, zie je pas na een paar seconden kijken',
  G32: 'documentmeting (get-pdfstructuur): invulbare velden in de PDF zelf',
};

/** Code kan dit niet vaststellen. Fase 4 (SemanticClassifier). */
export const ALLEEN_SEMANTISCH: Partial<Record<GebiedId, string>> = {
  G03: 'tekst in een afbeelding gebrand: staat niet in de code',
  G08: 'complex beeld (schema, organogram, infographic): een oordeel over de inhoud van het beeld',
  G09: 'kaart of plattegrond als afbeelding: een oordeel over de inhoud van het beeld',
  G13: 'poster of aankondiging: een oordeel over de inhoud van het beeld',
  G14: 'afbeelding met tekst erin: staat niet in de code',
  G24: 'live uitzending: een speler zegt niet of hij live is',
  G28: 'eigen sjabloon (portaal, boekingsmodule): vraagt vergelijking met de rest van de site (fase 3)',
};

export function herkenGebieden(kenmerken: Kenmerken, meta: { htmlTaal: string | null }): GebiedTreffer[] {
  const uit: GebiedTreffer[] = [];
  for (const r of CODE_REGELS) {
    const t = r.herken(kenmerken || {}, meta);
    if (t) uit.push({ gebied: r.gebied, naam: r.naam, bron: r.bron, aantal: t[0], bewijs: t[1] });
  }
  return uit;
}
