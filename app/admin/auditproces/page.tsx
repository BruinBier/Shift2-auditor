import Navigation from '@/app/components/Navigation';
import Link from 'next/link';

export const dynamic = 'force-static';

export default function AuditprocesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-[900px] mx-auto px-8 py-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Auditproces</h1>
        <p className="text-sm text-gray-600 mb-8">
          Werkwijze en instructies voor het uitvoeren van een WCAG-onderzoek in Shift2 Auditor.
          Deze pagina groeit mee: als iets ontbreekt of verkeerd staat, geef het door in de chat
          en Claude past de tekst aan.
        </p>

        <div className="bg-white rounded-lg border border-gray-200 p-8 space-y-10 prose prose-sm max-w-none">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 !mt-0">Overzicht fases</h2>
            <ol className="list-decimal list-inside space-y-1 text-gray-700">
              <li><a href="#fase-1" className="text-shift2-primary hover:underline">Intake vanuit CRM</a></li>
              <li><a href="#fase-2" className="text-shift2-primary hover:underline">Planning en planningsmail</a> <span className="text-gray-400">(nog niet uitgewerkt)</span></li>
              <li><a href="#fase-3" className="text-shift2-primary hover:underline">Scope bepalen</a> <span className="text-gray-400">(nog niet uitgewerkt)</span></li>
              <li><a href="#fase-4" className="text-shift2-primary hover:underline">Steekproef samenstellen</a> <span className="text-gray-400">(nog niet uitgewerkt)</span></li>
              <li><a href="#fase-5" className="text-shift2-primary hover:underline">Testen op succescriteria per sample</a></li>
              <li><a href="#fase-6" className="text-shift2-primary hover:underline">Rapport opmaken</a> <span className="text-gray-400">(nog niet uitgewerkt)</span></li>
              <li><a href="#fase-7" className="text-shift2-primary hover:underline">Afronden</a></li>
            </ol>
          </section>

          <section id="fase-1">
            <h2 className="text-xl font-semibold text-gray-900">1. Intake vanuit CRM</h2>
            <p>
              Het auditproces begint met een intake vanuit het CRM. Daar krijg je een opdracht
              toegewezen met <strong>projectnummer, naam en opdrachtgever</strong>. Op basis van
              die drie gegevens bouw je het onderzoek op in de tool.
            </p>

            <h3 className="text-base font-semibold text-gray-900">Volgorde intake</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>
                <strong>Check opdrachtgever</strong> in{' '}
                <Link href="/admin/opdrachtgevers" className="text-shift2-primary hover:underline">
                  Beheer &gt; Opdrachtgevers
                </Link>
                . Bestaat de opdrachtgever al? Zo niet: eerst aanmaken.
              </li>
              <li>
                <strong>Project aanmaken</strong> onder die opdrachtgever. Het project komt
                overeen met wat CRM als "project" aanlevert (dus het klantproject, niet één
                specifiek onderzoek).
              </li>
              <li>
                <strong>Onderzoek aanmaken</strong> onder dat project. Elk klantproject kan
                meerdere onderzoeken hebben (bijvoorbeeld nulmeting v1, herinspectie v1.1,
                contentonderzoek v2).
              </li>
            </ol>

            <h3 className="text-base font-semibold text-gray-900">Terminologie</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li><strong>Opdrachtgever</strong> = klantorganisatie (gemeente, bedrijf)</li>
              <li><strong>Project</strong> = klantproject, groepering waaronder onderzoeken vallen</li>
              <li><strong>Onderzoek</strong> = individueel WCAG-onderzoek (nulmeting, herinspectie, deelonderzoek)</li>
            </ul>

            <h3 className="text-base font-semibold text-gray-900">Verplichte velden per niveau</h3>
            <p className="text-gray-500 italic">
              Nog te bespreken. Welke velden moeten minimaal ingevuld worden per niveau
              (opdrachtgever, project, onderzoek).
            </p>
          </section>

          <section id="fase-2">
            <h2 className="text-xl font-semibold text-gray-900">2. Planning en planningsmail</h2>
            <p className="text-gray-500 italic">
              Nog uit te werken. Uitleg over hoe je tot een planning komt (welke week, hoe reken
              je door, hoe stem je af met de klant) en hoe de planningsmail wordt opgesteld en
              verstuurd.
            </p>
          </section>

          <section id="fase-3">
            <h2 className="text-xl font-semibold text-gray-900">3. Scope bepalen</h2>
            <p>
              De scope van het onderzoek staat op tabblad <strong>Details</strong>, onderdeel{' '}
              <strong>Planning</strong>. Drie velden horen bij de scope:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li><strong>In scope</strong> — wat wordt onderzocht</li>
              <li><strong>Buiten scope</strong> — wat expliciet niet onderzocht wordt (kan leeg zijn)</li>
              <li><strong>Overige scope informatie</strong> — bij een gemeentelijk website-onderzoek de vaste standaardtekst met wettelijke uitzonderingen (zie hieronder)</li>
            </ul>
            <p className="text-sm text-gray-600 italic">
              Er is ook een veld <em>Klant-aangedragen pagina's</em>, maar dat hoort niet bij
              de scope-fase — dat komt pas in fase 4 (Steekproef samenstellen) aan bod bij het
              aanmaken van specifieke samples.
            </p>

            <p className="text-sm text-gray-600 italic">
              "In scope" is nooit leeg — er is altijd iets wat onderzocht wordt. "Buiten scope"
              kan wél leeg zijn als er niets specifieks uitgesloten is.
            </p>

            <h3 className="text-base font-semibold text-gray-900">Volgorde in het auditproces</h3>
            <p>
              De scope wordt in twee fases opgebouwd:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>
                <strong>Fase 2 (Planning)</strong> — daar wordt "In scope" al ingevuld (de URL
                van de te onderzoeken site of subsite). Dat is onderdeel van de planning en
                planningsmail die naar de klant gaat.
              </li>
              <li>
                <strong>Fase 3 (deze fase)</strong> — hier wordt de scope afgemaakt: "Overige
                scope informatie" invullen (standaardtekst wettelijke uitzonderingen), en
                eventueel "Buiten scope" als er specifieke uitsluitingen zijn (bijvoorbeeld na
                klantfeedback op de planningsmail).
              </li>
            </ul>

            <h3 className="text-base font-semibold text-gray-900">Twee "In scope"-plekken die synchroon moeten blijven</h3>
            <p>
              De URL wordt op twee plekken opgeslagen die niet automatisch synchroniseren:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>
                <strong>Details &gt; Planning &gt; In scope</strong> — een tekstveld, gebruikt
                voor de planningsmail, het rapport en templates.
              </li>
              <li>
                <strong>Scope-tab &gt; Binnen scope</strong> — een lijst met URL-records,
                gebruikt door de crawler en de samples-flow.
              </li>
            </ul>
            <p>
              Bij het afmaken van fase 3 altijd checken dat de URL uit Details &gt; Planning ook
              op de Scope-tab onder "Binnen scope" staat. Als dat niet zo is, voeg hem toe via de
              knop "URL toevoegen" op de Scope-tab.
            </p>

            <h3 className="text-base font-semibold text-gray-900">Standaardtekst "Overige scope informatie" bij een website-onderzoek</h3>
            <p>
              Voor een website-onderzoek (met name gemeentelijke sites) is de "Overige scope
              informatie"-tekst in principe altijd hetzelfde. Het gaat om de wettelijke
              uitzonderingen voor de overheid en inloggebonden content:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
              <li>Niet de online kaarten en karteringsdiensten, tenzij ze bedoeld zijn voor navigatie (wettelijke uitzondering voor de overheid)</li>
              <li>Niet de kantoorbestanden van vóór 23 september 2018, tenzij ze deel uitmaken van een administratief proces (wettelijke uitzondering voor de overheid)</li>
              <li>Niet de live video's (wettelijke uitzondering voor de overheid)</li>
              <li>Niet de audio- en videobestanden die vóór 23 september 2020 op het digitale kanaal zijn geplaatst (wettelijke uitzondering voor de overheid)</li>
              <li>Niet de van derden afkomstige inhoud (wettelijke uitzondering voor de overheid)</li>
              <li>Niet de inhoud van archieven (wettelijke uitzondering voor de overheid)</li>
              <li>Niet de inhoud achter een inlog</li>
            </ul>

          </section>

          <section id="fase-4">
            <h2 className="text-xl font-semibold text-gray-900">4. Steekproef samenstellen</h2>
            <p>
              In deze fase stel je op basis van de scope de samples samen die getest gaan worden.
              Uit fase 3 zijn deze velden hier relevant:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li><strong>In scope</strong> — de URL van de te onderzoeken site of subsite (startpunt voor de steekproef)</li>
              <li><strong>Buiten scope</strong> — indien gevuld: URLs die uitgesloten worden bij het samenstellen</li>
              <li><strong>Overige scope informatie</strong> — bevat de wettelijke uitzonderingen die de steekproef beïnvloeden</li>
            </ul>
            <p className="text-gray-500 italic">
              Verdere werkwijze (hoe je precies pagina's selecteert en aanmaakt in de tab
              Steekproef, en wanneer klant-aangedragen pagina's aan bod komen) volgt nog.
            </p>
          </section>

          <section id="fase-5">
            <h2 className="text-xl font-semibold text-gray-900">5. Testen op succescriteria per sample</h2>
            <p>
              Dit is de fase waarin je per sample uit de steekproef alle succescriteria van het
              onderzoekstype systematisch afwerkt. Voor een deelonderzoek content (WCAG 2.2 AA)
              zijn dat 30 succescriteria.
            </p>

            <h3 className="text-base font-semibold text-gray-900">Voorbereiding per sessie</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>
                <strong>Audit-sessie starten.</strong> Dubbelklik <code>Start audit-sessie.bat</code>{' '}
                in de projectroot (of draai <code>npm run chrome:debug</code>). Er opent een
                Chrome-venster met debug-poort dat de audit-CLI kan gebruiken om pagina's op te
                halen zoals jij ze ziet.
              </li>
              <li>
                <strong>In dat Chrome-venster de benodigde setup doen.</strong> Cookies accepteren,
                eventueel inloggen, bij een multi-step formulier ook naar het juiste punt in de
                flow navigeren. Pas als dit klaar staat, heeft de CLI zin. Zonder deze setup krijgt
                Claude de pre-cookie-versie en zie je banners/overlays die op de "echte" pagina
                al weg zijn.
              </li>
            </ol>

            <h3 className="text-base font-semibold text-gray-900">Werkwijze per sample</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>
                <strong>Claude biedt de volgende sample aan.</strong> Uit de tab Steekproef pakt
                Claude het eerstvolgende sample dat nog niet is aangeraakt en stelt dat voor.
                Jij hoeft geen URL te noemen.
              </li>
              <li>
                <strong>Jij geeft akkoord</strong> of stuurt bij (andere sample, sla over, etc.).
              </li>
              <li>
                <strong>Claude legt HTML en screenshot vast als auditbewijs</strong> via de
                audit-CLI (<code>capture-sample-evidence</code>). De workflow haalt de gerenderde
                DOM en een volledige screenshot zelf op, koppelt beide aan het steekproefitem en
                gebruikt bij voorkeur de actieve Chrome-sessie.
              </li>
              <li>
                <strong>Claude checkt systematisch alle succescriteria</strong> die bij het
                onderzoekstype horen op die sample. Niet alleen wat toevallig opvalt, maar
                de hele lijst.
              </li>
              <li>
                <strong>Claude loopt de bevindingen één voor één met jou door.</strong> Per
                bevinding: Claude stelt de tekst voor (beschrijving en advies), jij reageert met
                akkoord, aanpassen of niet loggen. Pas na akkoord logt Claude de bevinding en
                gaat door naar de volgende. Nooit een lijst met alle bevindingen tegelijk.
              </li>
              <li>
                <strong>Jij checkt zelf ook mee — sta open voor eigen observaties.</strong>{' '}
                Terwijl Claude systematisch een SC afwerkt, kijk jij in de browser en zie je
                dingen die niet uit HTML/screenshot te halen zijn (visueel gedrag, hoveren,
                zoomen, interactie, contrast). Op elk moment kun je onderbreken met een eigen
                observatie. Claude werkt jouw observatie meteen uit als bevinding, ongeacht welke
                SC hij zelf aan het doen was, en gaat daarna terug naar de SC waar hij was
                gebleven.
              </li>
            </ol>

            <h3 className="text-base font-semibold text-gray-900">Speciale checks die Claude altijd aan jou vraagt</h3>
            <p>
              Sommige succescriteria zijn niet uit HTML of screenshot af te leiden. Claude vraagt
              deze bij elke HTML- of formulier-pagina expliciet aan jou:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li><strong>2.1.2 Toetsenbordval</strong> — jij test met Tab-navigatie in de browser</li>
              <li><strong>1.4.10 Reflow</strong> — jij test op 320 pixel breed in de browser</li>
            </ul>
          </section>

          <section id="fase-6">
            <h2 className="text-xl font-semibold text-gray-900">6. Rapport opmaken</h2>
            <p className="text-gray-500 italic">
              Nog uit te werken. Onder andere: management-samenvatting, onderzoeker-feedback,
              conclusietekst, "over dit onderzoek"-teksten.
            </p>
          </section>

          <section id="fase-7">
            <h2 className="text-xl font-semibold text-gray-900">7. Afronden</h2>
            <p>
              Zodra alle bevindingen zijn gelogd en het rapport klaar is, wordt de status van
              het onderzoek op <strong>Gereed</strong> gezet via de finalize-endpoint. Als er
              een herinspectie-child bestaat, worden alle findings, samples en assessments
              daarheen gekopieerd en start daar de tussencheck-fase.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
