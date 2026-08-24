# Shift2-beoordelingsregels SC 1.3.1

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_1_3_1.md` als ze elkaar tegenspreken.

## 1.3.1 is meer dan koppen

Dit criterium gaat over álle structuur die visueel zichtbaar is en ook in de code moet staan.
Loop bij elk sample minstens deze punten langs; een pagina met een correcte koppenstructuur kan
op een ander punt gewoon een afkeuring hebben:

| Wat | Hoe je het meet |
|---|---|
| Koppen: niveau, nesting, echte kop-elementen | koppenlijst opvragen met de uitklapblokken open |
| Lijsten: `ul`/`ol` waar visueel een opsomming staat | `main.querySelectorAll('ul, ol, li')` |
| Tabellen: koprijen, of tabel voor vormgeving | `main.querySelectorAll('table th, table td')` |
| **`em` en `i` voor visuele cursivering** | `main.querySelectorAll('em, i')` |
| `strong` en `b` zonder inhoudelijk gewicht | `main.querySelectorAll('strong, b')` |
| Alinea's: losse regels met `br` in plaats van `p` | `main.querySelectorAll('br')` |

Schrijf in `reden` wat je op elk van deze punten hebt gevonden, niet alleen over de koppen. Een
onderbouwing die alleen de koppenstructuur beschrijft, dekt het criterium niet.

Aanleiding: BEV-03 (2026-08-04). De audit zette 1.3.1 op twee samples op `opmerking` met een
onderbouwing over de koppenstructuur, terwijl er op diezelfde pagina's `em`-elementen om gewone
zinnen stonden. Dat is een afkeuring (B011), en die stond er al.

## Landmarks en formulieren horen niet bij het contentonderzoek

Allebei vallen ze wél onder 1.3.1, maar het is techniek en geen inhoud. Ze staan daarom niet
in `### Deelgebieden` verderop: dat lijstje is de contentcontrole per pagina.

**Landmarks.** `header`, `nav`, `main` en `footer` komen uit het sjabloon. Ze staan op elke
pagina hetzelfde, een redacteur kan er niets aan doen, en het antwoord verandert niet als je
de volgende pagina opslaat.

**Formulieren.** Onder 1.3.1 gaat het bij een formulier om de koppeling van het label aan het
veld — `for` op het label tegen `id` op het invulveld, of `aria-labelledby`. Dat is
ontwikkelwerk. Of de tékst van het label deugt is een andere vraag en hoort onder 2.4.6 en
3.3.2. Blijft er onder dit criterium dus niets inhoudelijks over.

Beide zijn hier op 2026-08-23 uit gehaald. `wcag-checklists/Checklist_SC_1_3_1.md` noemt ze
nog wel, als gebied 8 en 9 van 13 — dat bestand beschrijft het criterium in zijn geheel, dit
bestand beschrijft wat er per pagina aan inhoud wordt nagelopen. Zet ze dus niet terug.

Let ook op wat dit betékent voor de streepjes op de kaart. Landmarks zijn er altijd, dus
`niet aanwezig op deze pagina` zou daar nooit waar zijn geweest: dat streepje zou "er is niet
gekeken" hebben betekend, precies de stilte die deze lijst moet wegnemen.

## Regels

- KOP ZONDER INHOUD: loop de koppenlijst van de pagina na en kijk of er twee koppen van HETZELFDE niveau direct achter elkaar staan, zonder tekst ertussen. Dat is een AFKEURING (klein tot matig, redacteur), QuickFinding a3fe111f-e625-4891-99b2-8b7792be6a4e.
  FORMULEER DIT ALS EEN LEGE SECTIE, NIET ALS EEN REGEL OVER KOPPEN. WCAG eist niet dat elke kop inhoud heeft: een `<h2>Tekst</h2>` is technisch correct, ook als er direct een andere h2 op volgt. Schrijf dus NOOIT "Een kop moet altijd inhoud hebben" — dat is een onjuiste WCAG-uitspraak. Beschrijf in plaats daarvan dat er geen content tussen de twee koppen staat, dat dit een lege sectie in de paginastructuur creëert, en dat wie via de koppen navigeert op een kop landt waar geen informatie onder staat.
  Kijk of de eerste kop bedoeld is als groepstitel boven de onderwerpen die erna komen: adviseer dan die volgende koppen een niveau lager te maken. Zijn de koppen IDENTIEK, dan is er meestal een dubbele kop die weg kan; speculeer niet over de oorzaak ("fout in de invoer") maar benoem wat er staat. Bij een uitklapblok: de titel van het blok is al een kop, en een tweede kop met dezelfde tekst daarbinnen kan weg.
  Voorbeelden: BEV-03 B023 (energietransitie), waar "Wat speelt er allemaal in de gemeente?" als h2 direct gevolgd werd door de h2 "Energietransitie (aardgasvrij Beverwijk)". UTHEU-01 B014 (Paspoort), waar de kop "Spoedaanvraag" twee keer achter elkaar stond in een uitklapblok.
- KOPPEN: 1.3.1 gaat over het kopniveau, de nesting en of het wel een echt kop-element is. Of de KOPTEKST beschrijft waar het onderdeel over gaat, hoort onder 2.4.6. Kom je een kop tegen die zowel niet-beschrijvend is als verkeerd genest ("TIP!" als h3 onder een niet-passende h2), maak dan BEIDE bevindingen. Zie Shift2_Regels_SC_2_4_6.md.
- TABELLEN ZIJN ALTIJD REDACTIE. Zowel een tabel zonder tabelkoppen als een tabel die voor vormgeving wordt gebruikt: responsibility is **redacteur**, niet ontwikkelaar. De redacteur maakt de tabel in het CMS en kan hem daar ook aanpassen. Vastgelegd door Frits op 2026-08-03 bij UTHEU-01 (B017 en B021).
- TABEL VOOR VORMGEVING: staan er afbeeldingen of tekstblokken in een tabel zonder dat er gegevens in rijen en kolommen aan elkaar gerelateerd zijn, dan is dat een AFKEURING (matig, redacteur). Formuleer het concreet: "Een tabel is bedoeld om gegevens te tonen die in rijen en kolommen bij elkaar horen, zoals openingstijden of tarieven." Schrijf niet alleen "een tabel is niet voor vormgeving" — dat is te abstract. Er bestaat hiervoor alleen een PDF-QuickFinding (a61a6bfd-...), geen HTML-variant. Voorbeeld: UTHEU-01 B017 (zes foto's in een tabel).
- TABELKOPPEN ONTBREKEN: is de bovenste rij visueel een koprij maar in de code gewone `td`-cellen, dan is dat een AFKEURING (klein, redacteur). QuickFindings fc7eeab0-... en e1dfc0a8-... (die twee overlappen). Voorbeeld: UTHEU-01 B021.
  RIJKOPPEN: eis die alleen als de eerste kolom de rij BENOEMT en de overige cellen eigenschappen daarvan zijn (bijvoorbeeld "Paspoort" met daarnaast kosten en geldigheidsduur). Is de eerste kolom een volgnummer of gewoon het eerste gegeven, dan zijn er geen rijkoppen nodig; dan zou hulpsoftware bij elke cel dat nummer voorlezen.
- LEGE KOP: concludeer nooit "lege kop" op basis van een regex als <h2></h2>. Check de werkelijke inhoud, want de tekst kan in een geneste <span>, <a> of <i18n> staan. Extra alert bij koppen met id="main-content" of vergelijkbare skip-targets.
- **`b` EN `i` ZIJN TOEGESTAAN, `strong` EN `em` NIET — voor puur visuele opmaak.** Dit is de kern en de andere regels hieronder volgen eruit. `strong` en `em` betekenen iets: belang en spraaknadruk. Staan ze om tekst die dat niet draagt, dan wordt er een verband beweerd dat er niet is, en dat hoort een schermlezer voor te lezen terwijl er niets te benadrukken valt. `b` en `i` beweren niets: het zijn de elementen voor tekst die om een andere reden vet of schuin staat. Keur `b` en `i` dus **niet** af, ook niet met een opmerking, en adviseer nooit om ze in `strong` of `em` te veranderen.
  LET OP, HIER ZIT EEN VALKUIL. Auditgereedschap van derden draait dit precies om. RAMP (Accessible Web) heeft een toets "Emphasized Text" met de regel *"Visually emphasized text must use `<strong>` for bold and `<em>` for italics"* en keurt `b` en `i` af. Dat is de opvatting van vóór HTML5. Neem die formulering niet over: hij draait deze regel om. Ook `wcag-checklists/Checklist_SC_1_3_1.md` (§10 NADRUK) zegt "gebruik daarvoor CSS" en noemt `b` en `i` niet; dit bestand gaat vóór.
  Vastgelegd door Frits op 2026-08-23, naar aanleiding van de RAMP-toetsen onder Semantics.
- em-element voor puur visuele cursivering (labels, titels van werken, namen, gewone zinnen): **AFKEURING**, impact klein, responsibility redacteur. Nooit een opmerking: het em-element is alleen voor spraaknadruk, en tekst die geen nadruk heeft hoort er niet in te staan. Advies: em verwijderen; wil de redacteur de tekst cursief tonen, dan via de stijl "schuingedrukt" in het CMS (niet via CSS, want dat kan een redacteur niet). Geen suggestie voor het cite-element toevoegen, en geen tussenzin als "terwijl dat niet past bij het doel van dat element". Meerdere voorkomens samenvoegen in één bevinding.
  DIE KNOP ZET EEN CSS-KLASSE, geen `em` en geen `i`. Het advies is dus uitvoerbaar én het levert geen nieuwe afkeuring op: er blijft geen element over dat nadruk beweert. Adviseer daarom de CMS-knop en niet het `i`-element — een redacteur typt geen HTML. Vastgelegd door Frits op 2026-08-23.
  Meet dit in de gerenderde pagina met de uitklapblokken open: `main.querySelectorAll('em, i')`. Staat er een em omheen een gewone zin, dan is dat de afkeuring — ook als de koppenstructuur op diezelfde pagina verder in orde is. Beoordeel 1.3.1 dus niet alleen op koppen. Voorbeeld: BEV-03 B011, duurzaam.beverwijk.nl/subsidies-en-leningen, waar "Werkt de knop niet of kun je de pdf niet lezen?" en "Hieronder staan alle verwijzingen op een rij:" allebei in een em staan.
- strong rondom KNOP- of LINKtekst: OPMERKING, geen afkeuring. Impact en responsibility leeg. Advies eindigt met de zin "Dit is een best practice."
- strong gebruikt als visuele subkop of overbodig binnen een kop: advies altijd in twee delen splitsen. 1) hulpsoftware kondigt een kop al programmatisch aan, het strong-element voegt daar niets aan toe, 2) de visuele opmaak kan met CSS geregeld worden. Niet schrijven dat het kop-element "zelf al voor de gewenste visuele nadruk zorgt".
- Lijst met slechts een <li>: OPMERKING, geen afkeuring. Impact en responsibility leeg, advies eindigt met "Dit is een best practice."
- Overzichtspagina waar een kaart bestaat uit titel-link + datum + afbeelding zonder tekstuele samenvatting: de titel hoeft GEEN kop te zijn. Geen bevinding. Alleen wel een bevinding als er onder de titel ook een samenvatting/intro staat.
- FOOTER, ELKE RIJ LINKS: controleer per footerkolom of iedere visuele opsomming van links ook een <ul> met <li> is. De sociale-media-rij is het bekendste geval, maar dezelfde kolom bevat vaak nog een rij (Openingstijden | Route | Gemeentegids) waar de links met verticale streepjes (|) als scheidingsteken in een <p> staan. ELKE RIJ IS EEN EIGEN BEVINDING, ook al is het dezelfde structuurfout in dezelfde kolom. Reden: de leverancier kan de ene rij herstellen en de andere vergeten, en dan hoort dat in de hertest zichtbaar te zijn; het advies verschilt ook (bij de streepjes-rij moeten die tekens weg, bij de sociale-media-rij niet); en de sociale-media-bevinding heeft een eigen QuickFinding die niet meer past als je hem verbreedt. NOEM DE OPLOSSING DIE IN HET CMS BESTAAT. De reden dat een redacteur links met streepjes in een alinea zet, is dat een gewone opsomming onder elkaar komt te staan en de rij dan uit elkaar valt. In SIMsite lost de klasse `horizontal` op de ul dat op: de links blijven naast elkaar. Zet dat in het advies, anders krijg je terug dat het "visueel niet kan". Bron: Frits, 2026-08-15. Loop alle kolommen af en noem in de onderbouwing per kolom wat je aantrof: "de eerste en derde kolom staan in ul met li" is pas een controle als je ook zegt wat er in de tweede staat. Aanleiding: heuvelrug.nl (2026-08-15), waar de auditor de sociale-media-rij vond en de rij erboven in dezelfde alinea-opbouw miste.
- FOOTER, sociale-media-links: actief controleren of ze in <ul><li> staan. Losse <a>-elementen in een <p> is een bevinding (matig, redacteur). QuickFinding bd5fa272-7ee8-4d25-ab73-ec05a88bdf21. Alleen op de homepage beoordelen. LET OP: controleer bij dezelfde links ook de LINKTEKST onder 2.4.4. Staat er alleen "Facebook" of "Instagram" zonder de organisatie, dan is dat een aparte afkeuring onder 2.4.4. Zie Shift2_Regels_SC_2_4_4.md. Eén footerkolom kan dus twee bevindingen opleveren.
- FOOTER, adres en contactopties: actief controleren of het adres in een eigen <p> staat en telefoon/WhatsApp/contactformulier in een <ul><li>. Alles in een <p> met <br>-regeleinden is een bevinding (matig, redacteur). DEZE CONTROLE KIJKT TWEE KANTEN OP. Staat het adres juist MEE in de opsomming, samen met de telefoonnummers, dan is dat een OPMERKING (impact en responsibility leeg, advies eindigt met "Dit is een best practice."). Er gaat dan niets verloren — alles wordt voorgelezen in de goede volgorde — maar er wordt een verband beweerd dat er niet is: je hoort "lijst met vijf items" en krijgt drie contactroutes en twee adressen als een opsomming. Dat is F43, structuurmarkering die de werkelijke verhoudingen niet weergeeft. De <br>-variant is zwaarder, want daar gaat de opsomming echt verloren; vandaar matig tegenover een opmerking. Aanleiding: heuvelrug.nl (2026-08-15). De auditor schreef "het adres en de telefoonnummers staan in een lijst en niet in een alinea met br-regeleinden" en vinkte het af als correct, omdat de regel alleen de andere richting beschreef. Noem letterlijk de kop van de footer-kolom en de concrete items, geen verzamelterm "contactgegevens". Alleen op de homepage beoordelen.
- PDF met lijststructuur L > LI > LBody: correct onder WCAG. Een ontbrekend Lbl is GEEN 1.3.1-fout. Alleen afkeuren als de lijststructuur fundamenteel ontbreekt (losse P-elementen met bullet-tekens) of onjuist is.
- Niet-getagde PDF: de ontbrekende tagstructuur afkeuren onder 1.3.1 (dit is de wortel-oorzaak). Criteria die je alleen kunt beoordelen wanneer er tags zijn, keur je NIET apart af als gevolg van diezelfde oorzaak. De scheidslijn is NIET "het document is niet getagd, dus niets is te beoordelen". De vraag is
per criterium: gaat het over iets **programmatisch** (dat bestaat zonder tags niet) of over de
**inhoudelijke kwaliteit van de tekst** (die staat er gewoon, tags of niet)?

**Vervallen — programmatisch, bestaat niet zonder tags:**

| SC | Status | Waarom |
|---|---|---|
| **1.1.1** | opmerking | niet vast te stellen wat aan tekstalternatieven ontbreekt |
| **1.3.2** | `niet_te_bepalen` | geen programmatische leesvolgorde |
| **1.4.5** | `niet_te_bepalen` | geen onderscheid tussen tekst en afbeelding voor hulptechnologie |
| **3.2.4** | `niet_te_bepalen` | geen herkenbare onderdelen om de identificatie van te vergelijken |
| **4.1.2** | `niet_te_bepalen` | geen structuur waarin naam, rol en waarde kunnen zitten. Alleen bij een écht invulbaar formulier (invulvelden, keuzerondjes, selectievakjes) is het zonder tags te beoordelen. Een knop die als link werkt valt hier gewoon onder, ook als hij intern als AcroForm-pushbutton is opgeslagen: ga af op de functie, niet op de techniek. Zie `Shift2_Regels_SC_4_1_2.md`. |

**WEL beoordelen — visueel te toetsen, ook zonder tags:**

| SC | Wat je beoordeelt |
|---|---|
| **2.4.4** | Zie je een link of een webadres in de tekst? Lees dan of die tekst duidelijk maakt waar hij heen leidt. Geen "klik hier" of "lees meer" zonder context. Dat de link niet klikbaar is, is hier niet de vraag. |
| **2.4.6** | Staan er koppen boven de paragrafen? Beoordeel of die tekst de lading van de alinea dekt. De technische werking van de kop valt onder 1.3.1, de inhoudelijke relevantie onder 2.4.6. |
| **1.4.1** | Is kleur de enige manier waarop informatie wordt overgedragen? Denk aan een grafiek waarvan de segmenten alleen via de legendakleur te herleiden zijn, of een link die alleen rood is zonder onderstreping. |
| **1.4.3** | Contrast, maar alleen als meting: `niet_te_bepalen` met de opmerking dat de onderzoeker het handmatig doet. Zie `Shift2_Regels_SC_1_4_3.md`. |

Bij 2.4.4, 2.4.6 en 1.4.1 geef je dus een echt oordeel: voldoet, of een afkeuring als het niet
deugt. Zet ze niet op `niet_te_bepalen` met "geen tags" als reden.

**Waar de grens ligt.** Vervalt een criterium of niet? Vraag je af of je het probleem met je
ogen kunt vaststellen:

- **1.4.5** heeft tags nodig, want de vraag is wat er als afbeelding is *aangemerkt* — dat is
  een eigenschap van de code, niet van het beeld.
- **1.4.1** heeft ze niet nodig, want de vraag is of kleur de enige drager is. Wie kleurenblind
  is, loopt daar visueel tegenaan, los van wat een schermlezer met het document kan.

Vastgelegd door Frits op 2026-08-02 bij UTHEU-01 (2.4.4 en 2.4.6) en op 2026-08-04 bij BEV-03
(1.4.1). In beide gevallen zette Claude te veel criteria in de vervallijst; Frits corrigeerde
dat. Bij 1.4.1 ging het om de cirkeldiagrammen op pagina 8 van de Groenvisie, waar de segmenten
geen labels hebben en twee groentinten nauwelijks van elkaar verschillen.
- Zelfde issue op meerdere paginas: NIET telkens een nieuwe bevinding. Bestaande bevinding uitbreiden met het extra sample-item.

## Op de kaart

> Dit blok staat in het scherm van "Waar sta ik". De kaart leest het rechtstreeks uit dit
> bestand: wat je hier verandert, staat bij de volgende keer verversen op de kaart. Er is
> geen tussenstap en geen kopie. Houd het kort — een kaart is geen naslagwerk. Wat langer
> is hoort in de secties hierboven.

### Titel

Structuur die je ziet, staat ook in de code

### In het kort

Alles wat op het scherm structuur aangeeft — een kop, een opsomming, een tabel, een alinea —
moet ook in de code als zodanig zijn vastgelegd. Anders hoort iemand die de pagina laat
voorlezen een aaneengesloten lap tekst waar jij een indeling ziet.

Dit criterium gaat over méér dan koppen. Een pagina met een vlekkeloze koppenstructuur kan
alsnog afgekeurd worden op een opsomming zonder lijst, een tabel zonder koprij, of een `em`
om een zin die geen nadruk draagt.

### Audit-instructies

> Zet voor elke stap wie hem uitvoert: `[meting]` als een commando het al doet, `[jij]` als er
> een mens voor nodig is. De kaart toont dat met een vinkje of een open rondje, zodat er niet
> als opdracht staat wat allang gedaan is.

#### Stap 1 — In de auditsessie

1. [agent] Klap alle uitklapblokken open en maak dan pas een opname. Wat dichtzit, is niet
   beoordeeld.
2. [agent] Noteer wat er visueel structuur aangeeft: koppen en hun niveaus, opsommingen,
   tabellen, alinea's, en tekst die dik of schuin staat.
3. [agent] Kijk of er twee koppen van hetzelfde niveau direct op elkaar volgen zonder tekst
   ertussen. Dat is een lege sectie: wie via de koppen navigeert, landt op niets.
4. [agent] Op de homepage hoort de footer erbij. Loop elke kolom af en elke rij links apart —
   ook de rij met verticale streepjes ertussen — en kijk hoe het adres zich verhoudt tot de
   contactopties.

#### Stap 2 — In de code

5. [agent] Leg de koppenlijst naast de niveaus die je zag: zijn het echte kop-elementen, klopt
   het niveau, en is de nesting sluitend?
6. [agent] Staat elke opsomming in `ul` of `ol`, heeft elke koprij `th`, en staat elke alinea
   in een `p` — of zijn het losse regels met `br`?
7. [agent] Kijk ook de andere kant op: is er iets als lijst, tabel of kop gecodeerd dat het
   niet is? Een `blockquote` om tekst in te springen, een tabel om beeld te plaatsen, een `ul`
   om drie losse links. Beide richtingen zijn een afkeuring.
8. [agent] Lees `strong` en `em` in de hoofdinhoud: draagt die tekst werkelijk belang of
   nadruk, of staat hij er alleen vet of schuin? Alleen vormgeving is een afkeuring. `b` en
   `i` zijn juist wél toegestaan — keur die niet af. Sla pictogramlettertypen over: die zitten
   vaak in een lege `i` en zijn geen tekst.
9. [agent] Controleer of wat je op het scherm zag ook in de opgehaalde code staat. Ontbreekt
   een uitklapblok, dan laadt de site het pas na een klik en moet je het in de auditsessie
   openen.
10. [jij] Weeg per punt of de code de structuur weergeeft die je ziet, en voeg een afkeuring toe
   waar dat niet zo is.

### Deelgebieden

> De punten die bij dit criterium hoe dan ook langsgelopen worden. Zo is te zien wát er is
> nagekeken, en niet alleen wat er gevonden is. De kaart toont vier tekens:
>
> - `✓` nagekeken, in orde
> - `–` niet aanwezig op deze pagina
> - `!` een opmerking: geen afkeuring, wel gemeld
> - `✗` een afkeuring
>
> Een open ring betekent dat het gebied nog niet is nagelopen.
>
> Alleen zinvol bij een criterium dat uit meerdere losse vragen bestaat. Staat deze sectie
> er niet, dan toont de kaart geen lijstje — dat is bij de meeste criteria de juiste keuze.

1. Koppen
2. Koppenhiërarchie
3. Lege koppen en alinea's
4. Koppen gevolgd door inhoud
5. Lijsten
6. Geneste lijsten
7. Tabellen
8. Nadruk (vet/cursief)
9. Alinea's en regelafbrekingen
10. Citaten
11. Visuele relaties en groepering

### Zo is het vastgesteld

Voor dit criterium is er geen meetcommando. Het is wel goed te meten — een lijst met koppen,
lijsten, tabellen en `em`-elementen is uit de pagina te halen — maar de vraag is niet wat er
in de code staat. De vraag is of dat overeenkomt met wat er op het scherm te zien is, en die
vergelijking maakt niemand voor je.

Wat er wel is: `get-html` haalt de pagina op in een echte browser, dus na de JavaScript van de
site, en `get-screenshot` legt vast hoe het eruitzag. Die twee naast elkaar zijn precies de
vergelijking die dit criterium vraagt.

Let op één gat. Geen van beide klapt iets open. De inhoud van een uitklapblok staat meestal al
in de code — verborgen, maar aanwezig — en dan valt hij gewoon te beoordelen. Laadt de site
hem pas na een klik, dan staat hij er niet, en dan lijkt een pagina zonder afkeuring een pagina
zonder inhoud. Vergelijk daarom met de opname, en open het blok zo nodig in een auditsessie met
`npm run chrome:debug`.

Wat hier ook niet uit blijkt: de tagstructuur van een PDF. Die is niet uit de bytes te lezen;
zonder tags hoort de ontbrekende structuur onder dit criterium te worden afgekeurd, want dat is
de oorzaak waar de rest uit volgt.
