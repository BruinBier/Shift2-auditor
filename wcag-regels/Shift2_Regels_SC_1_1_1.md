# Shift2-beoordelingsregels SC 1.1.1

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_1_1_1.md` als ze elkaar tegenspreken.

## Verplichte controle vóór je alt="" goedkeurt

Bij ELKE afbeelding met een leeg tekstalternatief (`alt=""`): kijk op de screenshot of er
leesbare tekst IN de afbeelding staat. Concludeer nooit "decoratief" op basis van de HTML
alleen, en niet op basis van de bestandsnaam.

Staat er tekst in (merknaam, embleem, slogan, banner, poster, infographic, campagnelogo),
ga dan na of diezelfde tekst elders op de pagina als echte tekst staat:

- **Wel elders als tekst** → geen bevinding; de informatie is al beschikbaar.
- **Niet elders als tekst** → bevinding onder 1.1.1. Wie de pagina laat voorlezen, krijgt
  die tekst anders niet mee.

**Een logo valt hier buiten: die vergelijking maak je niet.** Is het een logo, dan is een
leeg tekstalternatief altijd een afkeuring, ongeacht wat er elders op de pagina staat. Ga
dus niet zoeken in de footer, de paginatitel of de lopende tekst — dat maakt voor het
oordeel niets uit. Zie "Een logo krijgt altijd een tekstalternatief" onderaan dit bestand.

Dit geldt óók als de afbeelding verder puur illustratief oogt, en óók als de tekst een
merknaam of logo is. Een logo mag onder 1.4.5 zijn uitgezonderd (afbeelding van tekst),
maar dat zegt niets over 1.1.1: de naam moet nog steeds voorleesbaar zijn. Beoordeel de
twee criteria los van elkaar.

Aanleiding: op de homepage van duurzaam.beverwijk.nl (2026-07-27) stond in de hero-illustratie
het embleem "Duurzaam Voordeel Beverwijk" met `alt=""`. Die naam stond nergens als tekst op de
pagina. De auditor noemde het "decoratief sfeerbeeld" op basis van de HTML en miste de bevinding.

## Hero-/headerafbeelding: adviseer tekst op de pagina, GEEN alt-tekst

Het CMS zet het tekstalternatief van een hero-/headerafbeelding altijd op leeg. De redacteur
kan daar dus geen alt-tekst invullen. Adviseer bij zo'n afbeelding daarom **nooit** "geef de
afbeelding een tekstalternatief" — dat is een advies dat niet uitvoerbaar is.

Adviseer in plaats daarvan om de tekst uit de afbeelding **als gewone tekst onder de hero** op
te nemen, bijvoorbeeld verwerkt in de introtekst van de pagina. De informatie is dan voor
iedereen beschikbaar en de lege alt is geen probleem meer: de afbeelding is dan werkelijk
decoratief, want de tekst staat elders.

Voorbeeldadvies:

> Neem de naam 'Duurzaam Voordeel Beverwijk' op als gewone tekst op de pagina, bijvoorbeeld in
> de introtekst onder de afbeelding. De informatie is dan beschikbaar voor iedereen, ook voor
> wie de afbeelding niet ziet.

Let op het verschil met een gewone afbeelding in de lopende tekst: daar kan de redacteur wél
een tekstalternatief invullen, dus daar blijft het normale alt-advies gelden.

## Regels

- Teaser-/kaart-afbeelding op een overzichtspagina of nieuwslijst (afbeelding + kop/link/datum die doorlinkt): alt="" is de GEWENSTE situatie. Geen bevinding. De toegankelijke naam komt uit de kop/link.
- Kaart-afbeelding (plattegrond, strooiroute, locatiekaart) met een korte label-alt ("Plattegrond wijkverdeling X"): GEEN bevinding, mits de inhoudelijke informatie elders op de pagina in tekst staat. Eis niet dat de alt alle wijken/straten opsomt.
- KAART MET EEN LEGENDA: een label-alt is niet genoeg om te concluderen dat het in orde is. Lees de legenda UIT DE AFBEELDING (bekijk hem echt, zoom zo nodig in) en vink item voor item af of elk gegeven ook in de tekst op de pagina staat. Let vooral op jaartallen, percentages en categorienamen; die worden vaak vergeten in de begeleidende tekst. Ontbreekt er iets, dan is dat een bevinding met de standaard kaarten-formulering. Voorbeeld: BEV-03 B024 (energietransitie, warmtetransitiekaart). De legenda noemde per categorie een startjaar (2021, 2022, 2023) dat nergens in de tekst stond; de auditor zag de label-alt en concludeerde ten onrechte "voldoet".
- Kaart waarvan de informatie NIET elders in tekst staat: wel een bevinding, en sluit de description af met letterlijk deze twee zinnen: "Kaarten vallen onder de wettelijke uitzondering voor de overheid en hoeven niet toegankelijk te zijn. De informatie die ermee wordt overgebracht (X) moet echter ook op een andere manier beschikbaar zijn." Pas alleen het deel tussen haakjes aan.
- Wel een bevinding bij een kaart met: bestandsnaam als alt, leeg alt zonder tekst eromheen, of misleidende alt.
- Logo in de site-header: schrijf "Boven aan de pagina staat het logo van ..." of "In de header ...". NOOIT "In het hoofdmenu staat het logo" — het logo staat naast, niet in het menu.
- LOGO OP EEN SUBSITE dat linkt naar de homepage van die subsite: is het tekstalternatief alleen de organisatienaam ("Logo gemeente X"), dan is dat een AFKEURING (klein, ontwikkelaar). De gebruiker hoort dat de link naar een homepagina gaat en denkt naar de hoofdsite van de organisatie te gaan, terwijl hij op de subsite blijft. Advies: neem zowel het logo als de bestemming op, bijvoorbeeld "Logo gemeente X, Website Duurzaam X". Speelt bij elke gemeentelijke subsite (duurzaam., open., mijn.). Voorbeelden: BEV-04 B003 (open.beverwijk.nl) en BEV-03 B017 (duurzaam.beverwijk.nl).
- Complexe afbeelding (organogram, processchema, infographic): ga EERST na of de inhoud al elders op de pagina in tekst staat, inclusief uitklapbare/details-secties. Staat het er al: advies beperken tot een korte alt-tekst. Ontbreekt substantiele info: adviseer de inhoud ook als tekst op de pagina (voorkeur boven een lange alt-tekst). Meld de uitkomst van die vergelijking in het voorstel.
- Afbeelding in <figure> met <figcaption> die de afbeelding al uitlegt: alt hoort LEEG te zijn. Staat in beide dezelfde tekst, dan is dat een bevinding wegens dubbele voorlezing.
- ONDERSCHRIFT DAT ALLEEN DE NAAM HERHAALT ("Zonneboiler" onder een foto van een zonneboiler): dit is oneigenlijk gebruik van het onderschrift. Een onderschrift hoort iets TOE TE VOEGEN (context, type, locatie, bron), niet te herhalen wat de afbeelding al is of wat de kop erboven al zegt. Afkeuring, klein en redacteur. Advies: haal het onderschrift weg en laat de alt leeg, OF geef het onderschrift informatie die nergens anders staat. Doe daarbij een concrete suggestie op basis van wat je op de foto ziet, bijvoorbeeld "Een zonneboiler met vacuümbuizen". Voorbeeld: BEV-03 B021 (duurzaam.beverwijk.nl/zelf-energie-opwekken).
- Losse afbeelding met beschrijvende tekst in een <p> eronder (geen figure): alt-tekst is VERPLICHT, ongeacht wat de tekst eronder zegt. Er is geen semantische koppeling.
- Evenementen-/promotieposter: adviseer twee dingen samen, een korte alt-tekst ("Poster van het Zomerfeest 2026 op het marktplein") EN de posterinhoud als gewone tekst onder de afbeelding of in de lopende tekst. Nooit de hele posterinhoud in de alt. Vergelijk eerst met de tekst op de pagina en benoem gericht wat echt ontbreekt.
- Galerij met meerdere fotos: geef in het advies TWEE verschillende voorbeelden ("bijvoorbeeld 'De aula van binnen' en 'De aula van buiten'"), zodat duidelijk is dat elke foto een eigen tekst krijgt.
- SIMsite-galerij (class ImageGallery-module-scss-module...) met alt="" plus bestandsnaam als bijschrift: TWEE losse bevindingen, 1.1.1 (klein, redacteur) voor de ontbrekende tekstalternatieven en 2.4.6 (klein, redacteur) voor de bestandsnaam als bijschrift. Alt en onderschrift mogen dezelfde tekst hebben; ze verschijnen niet tegelijk.
- Ingesloten videospeler (Bright/BBVMS, YouTube, Vimeo): check EERST of er een transcript-knop of "uitgeschreven tekst"-knop in de speler zit. Een toegankelijk gelabelde transcript-knop levert een geldig tekstalternatief. Dan GEEN 1.1.1-afkeuring.
- Afbeelding-link zonder toegankelijke naam: schrijf dat de link GEEN naam heeft. Niet "geen duidelijke naam" en niet "de schermlezer leest het webadres voor" (dat verschilt per schermlezer). Zie ook 2.4.4 en 4.1.2: dit is het klassieke geval waarin beide criteria gelden.
- Gebruik de term "tekstalternatief", niet "tekstbeschrijving". Formuleer alt als iets dat informatie OVERBRENGT, niet als iets dat de afbeelding "beschrijft".
- Inline base64-afbeelding (src begint met data:image) zonder alt: dit is een plak-incident van een redacteur, geen template-issue. Verantwoordelijkheid redacteur.
- Niet-getagde PDF onder 1.1.1: opmerking (status resolved, impact en responsibility leeg). Zonder tags kun je niet vaststellen wat er ontbreekt. De structuur-bevinding hoort onder 1.3.1.

## Vastgelegd tijdens overleg

### 2026-08-15

1.1.1 EN LINKDOEL NIET DOOR ELKAAR HALEN. Bij een afbeelding in een link beoordeel je onder 1.1.1 uitsluitend of de informatie IN de afbeelding in tekst wordt overgebracht. Tekst die aan de link hangt (een title-attribuut, een aria-label of verborgen linktekst zoals "Ga naar de homepage") staat niet op de afbeelding en repareert een ontbrekend tekstalternatief niet. Of de link zijn doel duidelijk maakt is een aparte vraag onder 2.4.4/4.1.2 en krijgt een eigen bevinding. Houd het ook uit het advies: adviseer onder 1.1.1 alleen een alt die de informatie uit de afbeelding overbrengt, nooit een alt die er de bestemming van de link bij noemt. TESTMETHODE: beoordeel 1.1.1 nooit op de opgehaalde code alleen, ook niet als je afkeurt. Start een auditsessie en bekijk de gerenderde pagina en de afbeelding zelf. Uit de code lees je wel het lege alt-attribuut, maar niet welke tekst in de afbeelding staat en niet of die tekst elders op de gerenderde pagina voorkomt. Aanleiding: heuvelrug.nl (2026-08-15), logo met alt="" in een link met title="Ga naar de homepage".

Aanleiding: 1.1.1 op Home (V010)

### 2026-08-15

EEN LOGO KRIJGT ALTIJD EEN TEKSTALTERNATIEF. Is het een logo, dan doet het niet ter zake wat voor logo: header, footer, subsite, sponsor, partner, keurmerk, of hetzelfde logo voor de tweede keer op dezelfde pagina. Een leeg tekstalternatief is bij een logo altijd een afkeuring. Een logo is de afzender — het vertelt van wie deze pagina is — en die informatie mag voor niemand wegvallen.

Let op hoe deze regel zich tot de norm verhoudt: hij is STRENGER dan WCAG, niet losser. 1.1.1 kent een uitzondering voor pure decoratie, en wie een logo decoratief noemt omdat de naam elders op de pagina staat, beroept zich op die uitzondering. Bij een logo mag dat beroep hier niet gedaan worden. Er wordt dus een uitzondering geschrapt, niet een toegevoegd — deze regel kan nooit tot een onterechte goedkeuring leiden, hooguit tot een strengere afkeuring dan een andere auditor zou geven. Dat is een bewuste keuze van het bureau en verdedigbaar richting de opdrachtgever.

Dit stelt de checklistpassage "PASS: herhaling van logo elders op pagina → decoratief, alleen als de organisatienaam al elders prominent zichtbaar is" BUITEN WERKING. Ga dus niet na of de naam ergens anders op de pagina staat: dat maakt voor het oordeel niets uit. Die afweging leverde alleen maar grensgevallen op — telt de footer mee, telt een nieuwskop mee, telt de paginatitel mee — en verschillende auditors kwamen tot verschillende uitkomsten. Nu is er niets af te wegen.

Het tekstalternatief bevat ALLE tekst die op het logo staat. Niet alleen de organisatienaam: staat er ook een dorpsnaam, een woord als "gemeente", een slogan of een toevoeging onder het beeldmerk, dan hoort dat er allemaal in. Neem het over zoals het er staat, in de volgorde waarin je het leest. Wie alleen de naam overneemt laat informatie liggen die op het plaatje wél te zien is, en dat is precies wat 1.1.1 wil voorkomen.

In het tekstalternatief staat de AFZENDER, niet de bestemming van de link. Dus "Logo gemeente Utrechtse Heuvelrug", niet "Logo gemeente X, link naar de Homepagina". Op een subsite hoort de afzender volledig benoemd, inclusief om welke site het gaat: "Logo gemeente X, Website Duurzaam X" (zie de subsite-regel hierboven). Dat is geen bestemming maar identiteit — welke site dit is, niet waar de link heen gaat.

TESTMETHODE: start een auditsessie en bekijk de gerenderde pagina. Uit de opgehaalde code alleen zie je niet of een afbeelding een logo is: een bestandsnaam met "logo" erin zegt niets, en een logo zonder dat woord in de naam mis je. Je moet de afbeelding gezien hebben om te weten wat erin staat en hoe het tekstalternatief moet luiden.

Aanleiding: heuvelrug.nl (2026-08-15), logo met alt="" in de header. Besluit van Frits tijdens het doorlopen van 1.1.1 op Home.

### 2026-08-15

Twee regels over wat een leeg tekstalternatief goedpraat, en wat niet.

- TEASERFOTO MET alt="" IS ALLEEN GOED IN EEN OVERZICHT. De uitzondering hangt aan de context: in een nieuws- of productoverzicht dragen de titel-link en de teasertekst de betekenis al. Staat dezelfde foto op een detailpagina of los in de lopende tekst, dan geldt de uitzondering niet en is een leeg tekstalternatief een afkeuring. Noteer in de onderbouwing dat het om een overzicht gaat — anders is niet na te gaan waarop de uitzondering steunde.

- ICOON MET aria-hidden: CONTROLEER OF DE BETEKENIS ERGENS ANDERS LANDT. Dat er tekst naast staat is niet genoeg, en aria-hidden is op zichzelf geen fout. Kijk naar twee dingen: draagt de tekst ernaast alles wat het icoon overbrengt, of zit er een omhulsel omheen dat het icoon zelf benoemt (`role="img"` met een `aria-label`)? Is een van beide waar, dan is het goed. Verbergt het icoon iets wat nergens landt — een PDF-icoontje naast "Jaarverslag", een pijl naar buiten bij een externe link, een vinkje dat een status aangeeft, een vlag voor een taal — dan is het een afkeuring, want die informatie valt weg. Voorbeeld van een goede opbouw: heuvelrug.nl zet het externe-link-icoontje in een `<span role="img" aria-label="externe link">` met het glyph eronder op aria-hidden. Schrijf in de onderbouwing wát de betekenis draagt, niet dát er tekst stond.

Aanleiding: 1.1.1 op Home (heuvelrug.nl, 2026-08-15). Bij het nalopen van de onderbouwing bleek dat de auditor de teaser-uitzondering had toegepast zonder de overzichtscontext te noemen, en dat "hebben altijd tekst naast zich" als afdoende was opgeschreven zonder die tekst inhoudelijk te controleren.
