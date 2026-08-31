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
  **DE LIJST BESLIST, NIET DE FOTO.** Staat een afbeelding in zo'n overzicht, dan is het oordeel daarmee klaar. Ga niet alsnog na wat er op de foto staat, of die tekst elders voorkomt, of het beeld informatie draagt — die afweging hoort bij een afbeelding in de lopende tekst en niet hier. In een overzicht kies je met de kop of je doorklikt; het hele verhaal staat op de pagina erachter, en dáár moet het kloppen.
  Aanleiding: heuvelrug.nl (2026-08-31). Op de homepage staat een nieuwsteaser met een illustratie van een pompflacon boven een oranje container met "PMD" erop, bij de kop "Help mee: verbeter de kwaliteit van PMD-afval". De agent ging na of het woord PMD elders in tekst stond, concludeerde van wel en schreef daar een afweging over — werk dat niet gedaan hoefde te worden, en dat bovendien naar de letters in het beeld keek in plaats van naar wat het beeld overbrengt.
- Kaart-afbeelding (plattegrond, strooiroute, locatiekaart) met een korte label-alt ("Plattegrond wijkverdeling X"): GEEN bevinding, mits de inhoudelijke informatie elders op de pagina in tekst staat. Eis niet dat de alt alle wijken/straten opsomt.
- KAART MET EEN LEGENDA: een label-alt is niet genoeg om te concluderen dat het in orde is. Lees de legenda UIT DE AFBEELDING (bekijk hem echt, zoom zo nodig in) en vink item voor item af of elk gegeven ook in de tekst op de pagina staat. Let vooral op jaartallen, percentages en categorienamen; die worden vaak vergeten in de begeleidende tekst. Ontbreekt er iets, dan is dat een bevinding met de standaard kaarten-formulering. Voorbeeld: BEV-03 B024 (energietransitie, warmtetransitiekaart). De legenda noemde per categorie een startjaar (2021, 2022, 2023) dat nergens in de tekst stond; de auditor zag de label-alt en concludeerde ten onrechte "voldoet".
- Kaart waarvan de informatie NIET elders in tekst staat: wel een bevinding, en sluit de description af met letterlijk deze twee zinnen: "Kaarten vallen onder de wettelijke uitzondering voor de overheid en hoeven niet toegankelijk te zijn. De informatie die ermee wordt overgebracht (X) moet echter ook op een andere manier beschikbaar zijn." Pas alleen het deel tussen haakjes aan.
- Wel een bevinding bij een kaart met: bestandsnaam als alt, leeg alt zonder tekst eromheen, of misleidende alt.
- Logo in de site-header: schrijf "Boven aan de pagina staat het logo van ..." of "In de header ...". NOOIT "In het hoofdmenu staat het logo" — het logo staat naast, niet in het menu.
- CITEER DE TEKST UIT DE AFBEELDING WEL, zodat de lezer weet waar het over gaat. Is de tekst te lang om volledig over te nemen, citeer dan een deel en schrijf "zoals ...". Vastgelegd door Frits op 2026-08-03 bij UTHEU-01.
  Uitzondering: bij een LOGO citeer je de tekst niet. Daar gaat het erom dat de organisatienaam niet overkomt, niet om de letterlijke inhoud van het beeldmerk. Schrijf dus geen zin als "in het logo staat de naam 'Gemeente X'". Vastgelegd door Frits op 2026-08-02.
- LOGO OP EEN SUBSITE dat linkt naar de homepage van die subsite: is het tekstalternatief alleen de organisatienaam ("Logo gemeente X"), dan is dat een AFKEURING (klein, ontwikkelaar). De gebruiker hoort dat de link naar een homepagina gaat en denkt naar de hoofdsite van de organisatie te gaan, terwijl hij op de subsite blijft. Advies: neem zowel het logo als de bestemming op, bijvoorbeeld "Logo gemeente X, Website Duurzaam X". Speelt bij elke gemeentelijke subsite (duurzaam., open., mijn.). Voorbeelden: BEV-04 B003 (open.beverwijk.nl) en BEV-03 B017 (duurzaam.beverwijk.nl).
- Complexe afbeelding (organogram, processchema, infographic): ga EERST na of de inhoud al elders op de pagina in tekst staat, inclusief uitklapbare/details-secties. Staat het er al: advies beperken tot een korte alt-tekst. Ontbreekt substantiele info: adviseer de inhoud ook als tekst op de pagina (voorkeur boven een lange alt-tekst). Meld de uitkomst van die vergelijking in het voorstel.
  **GEEN PROGRAMMATISCHE KOPPELING VEREIST.** Staat de beschrijving elders op de pagina, dan is dat genoeg; eis geen `aria-describedby` en geen `figure` met `figcaption`, en keur het ontbreken daarvan niet af — ook niet als opmerking. Wat telt is dat de informatie beschikbaar is.
  Dit wijkt bewust af van gereedschap van derden. RAMP (Accessible Web) heeft een toets "Complex Images" met als vijfde instructie: *"If a complex image does have a description but it is not programmatically related to the image, add a failure."* Neem die niet over.
  Let op dat dit iets anders is dan de regel over een losse afbeelding met tekst in een `<p>` eronder, twee regels lager. Daar is de alt-tekst wél verplicht, juist omdat er geen semantische koppeling is. Die twee zijn niet met elkaar in strijd maar bewust verschillend: bij een complexe afbeelding gaat het om de inhoud die overgebracht moet worden, bij een gewone afbeelding om het beeld zelf. Harmoniseer ze niet.
  Vastgelegd door Frits op 2026-08-23, naar aanleiding van de RAMP-toetsen onder Pictures &amp; Images.
- Afbeelding in <figure> met <figcaption> die de afbeelding al uitlegt: alt hoort LEEG te zijn. Staat in beide dezelfde tekst, dan is dat een bevinding wegens dubbele voorlezing.
- ONDERSCHRIFT DAT ALLEEN DE NAAM HERHAALT ("Zonneboiler" onder een foto van een zonneboiler): dit is oneigenlijk gebruik van het onderschrift. Een onderschrift hoort iets TOE TE VOEGEN (context, type, locatie, bron), niet te herhalen wat de afbeelding al is of wat de kop erboven al zegt. Afkeuring, klein en redacteur. Advies: haal het onderschrift weg en laat de alt leeg, OF geef het onderschrift informatie die nergens anders staat. Doe daarbij een concrete suggestie op basis van wat je op de foto ziet, bijvoorbeeld "Een zonneboiler met vacuümbuizen". Voorbeeld: BEV-03 B021 (duurzaam.beverwijk.nl/zelf-energie-opwekken).
- Losse afbeelding met beschrijvende tekst in een <p> eronder (geen figure): alt-tekst is VERPLICHT, ongeacht wat de tekst eronder zegt. Er is geen semantische koppeling.
- Evenementen-/promotieposter: adviseer twee dingen samen, een korte alt-tekst ("Poster van het Zomerfeest 2026 op het marktplein") EN de posterinhoud als gewone tekst onder de afbeelding of in de lopende tekst. Nooit de hele posterinhoud in de alt. Vergelijk eerst met de tekst op de pagina en benoem gericht wat echt ontbreekt.
- Galerij met meerdere fotos: geef in het advies TWEE verschillende voorbeelden ("bijvoorbeeld 'De aula van binnen' en 'De aula van buiten'"), zodat duidelijk is dat elke foto een eigen tekst krijgt.
- SIMsite-galerij (class ImageGallery-module-scss-module...) met alt="" plus bestandsnaam als bijschrift: TWEE losse bevindingen, 1.1.1 (klein, redacteur) voor de ontbrekende tekstalternatieven en 2.4.6 (klein, redacteur) voor de bestandsnaam als bijschrift. Alt en onderschrift mogen dezelfde tekst hebben; ze verschijnen niet tegelijk.
- Ingesloten videospeler (Bright/BBVMS, YouTube, Vimeo): check EERST of er een transcript-knop of "uitgeschreven tekst"-knop in de speler zit. Een toegankelijk gelabelde transcript-knop levert een geldig tekstalternatief. Dan GEEN 1.1.1-afkeuring.
- Afbeelding-link zonder toegankelijke naam: schrijf dat de link GEEN naam heeft. Niet "geen duidelijke naam" en niet "de schermlezer leest het webadres voor" (dat verschilt per schermlezer). Zie ook 2.4.4 en 4.1.2: dit is het klassieke geval waarin beide criteria gelden.
- HET LOGO TELT MAAR ÉÉN KEER. Het logo staat links boven aan de pagina en zit vrijwel altijd in een link naar de homepage; het valt daarmee zowel onder het deelgebied "Logo's" als onder "Afbeeldingen in een link of knop". Beoordeel het alleen bij **Logo's**. Het andere gebied heet daarom "(behalve het logo)" en gaat over de rest: teaserafbeeldingen die zelf de link vormen, knoppen met alleen een pictogram, beeldlinks in de lopende tekst.
  Zonder die afbakening staat er een kruis bij een gebied waar niets mis is, en lijkt één afkeuring er twee. Op heuvelrug.nl (2026-08-31) stonden beide gebieden op `fout` terwijl er één bevinding was (B001, de logolink met leeg `alt`); de agent schreef er zelf bij dat het dezelfde afkeuring was.
- Gebruik de term "tekstalternatief", niet "tekstbeschrijving". Formuleer alt als iets dat informatie OVERBRENGT, niet als iets dat de afbeelding "beschrijft".
- Inline base64-afbeelding (src begint met data:image) zonder alt: dit is een plak-incident van een redacteur, geen template-issue. Verantwoordelijkheid redacteur.
- Niet-getagde PDF onder 1.1.1: opmerking (status resolved, impact en responsibility leeg). Zonder tags kun je niet vaststellen wat er ontbreekt. De structuur-bevinding hoort onder 1.3.1.
  **Noem geen kaarten in die opmerking.** Kaarten vallen onder de wettelijke uitzondering voor de overheid; ze in het rapport opsommen suggereert dat de organisatie er iets specifieks mee moet, terwijl ze na het taggen gewoon een label-alt mogen hebben. Beschrijf dus alleen het logo, de diagrammen, foto's en andere informatieve beelden. Vastgelegd door Frits op 2026-08-04 bij UTHEU-01 B010 (Beleidsvisie horeca en terrassen).
- **EEN LOGO IN EEN PDF MOET ALTIJD GETAGD ZIJN.** Het logo is geen versiering: het zegt van wie het document is, en bij een gemeentelijk document is dat de afzender. Die informatie hoort een schermlezer voor te lezen. Het logo moet dus als `/Figure` met een `/Alt` in de tagboom staan, niet als `/Artifact` (dat betekent "overslaan").
  Concludeer dus nooit dat een ongetagd of als Artifact gemarkeerd logo "correct wordt overgeslagen". Dat is een AFKEURING.
  Vastgelegd door Frits op 2026-08-04 bij BEV-04 (bevinding B016, Openbare besluitenlijst).
- **WEL getagde PDF: concludeer niets over de tagkwaliteit uit de ruwe bytes.** Of een afbeelding als `/Figure` met een `/Alt` is opgenomen, staat meestal in een gecomprimeerde objectstroom en is zo niet te lezen. Vind je die markeringen niet, dan is dat géén bewijs dat ze ontbreken — maar het is ook geen bewijs dat ze er zijn.
  Zet het criterium dan op `niet_te_bepalen` met de vraag om PAC-output, of vraag de onderzoeker het in Acrobat na te kijken. Dat geldt óók voor een goedkeuring: schrijf niet "het is correct getagd" als je dat niet hebt gezien.
  Aanleiding: BEV-04 (2026-08-04). De audit concludeerde dat het logo als Artifact was gemarkeerd en dus correct werd overgeslagen, en zette 1.1.1 op `voldoet`. Er stonden nul `/Artifact`- en nul `/Figure`-voorkomens in de bytes, en bij controle in Acrobat bleek het logo helemaal niet getagd. Twee fouten in één: een aanname over wat er in het document stond, en een verkeerde regel over wat er hóórt te staan.

## Op de kaart

> Dit blok staat in het scherm van "Waar sta ik". De kaart leest het rechtstreeks uit dit
> bestand: wat je hier verandert, staat bij de volgende keer verversen op de kaart. Er is
> geen tussenstap en geen kopie. Houd het kort — een kaart is geen naslagwerk. Wat langer
> is hoort in de secties hierboven.

### Titel

Tekstalternatieven voor wat geen tekst is

### In het kort

Alles wat geen tekst is — een afbeelding, een icoon, een schema, een CAPTCHA — heeft een
tekstalternatief dat hetzelfde doel dient. Niet een beschrijving van het plaatje, maar dat
wat het beeld op die plek overbrengt.

Dat is per beeld een andere vraag. Bij versiering hoort géén tekst, bij een icoonknop hoort
de functie en niet de tekening, bij een schema hoort de inhoud, en bij een CAPTCHA hoort een
andere vorm. Vier beslissingen op één kaart.

### Audit-instructies

> Zet voor elke stap wie hem uitvoert: `[meting]` als een commando het al doet, `[jij]` als er
> een mens voor nodig is. De kaart toont dat met een vinkje of een open rondje, zodat er niet
> als opdracht staat wat allang gedaan is.

#### Stap 1 — In de auditsessie

1. [agent] Maak een opname van de hele pagina en loop elk beeld langs: foto's, iconen,
   logo's, grafieken, kaarten, videoposters. Wat niet op de opname staat, is niet beoordeeld.
2. [agent] Bepaal per beeld wat het doet: versiering, informatie, een link of knop, of een
   complex beeld (schema, infographic, kaart met legenda).
3. [agent] Staat er niets op de pagina dat geen tekst is, dan is deze toets niet van
   toepassing. Dat kun je pas zeggen ná de opname, niet ervoor.
4. [agent] Staat er leesbare tekst ín het beeld — merknaam, embleem, slogan, banner, poster?
   Zoek dan of diezelfde tekst elders op de pagina als echte tekst staat. Bij een LOGO maak je
   die vergelijking niet: daar is een leeg tekstalternatief altijd een afkeuring, wat er
   verder op de pagina staat. Zoek dus niet in de footer of de paginatitel; er valt niets af
   te wegen.
5. [agent] Bij een kaart met een legenda: lees de legenda uit het beeld en vink item voor item
   af of elk gegeven ook in de tekst staat. Jaartallen, percentages en categorienamen worden
   het vaakst vergeten.
6. [agent] Noteer wat een eigen route heeft: een CAPTCHA, een ingesloten videospeler, een PDF.
   Die beoordeel je niet op hun `alt`.

#### Stap 2 — In de code

7. [agent] Lees per beeld het tekstalternatief en waar het vandaan komt: `alt`, `aria-label`,
   `aria-labelledby`, of een `role="img"` met een naam.
8. [agent] Bij een leeg `alt`: leg de opname ernaast. Concludeer nooit "versiering" uit de HTML
   of uit de bestandsnaam.
9. [agent] Zit het beeld in een link of knop, kijk dan of de naam over de bestemming gaat en
   niet over de tekening.
10. [agent] Bij een complex beeld: staat de inhoud al elders op de pagina als tekst, ook in
   uitklapsecties? Vergelijk, en noteer gericht wat ontbreekt. Een programmatische koppeling
   tussen beeld en beschrijving is hier niet vereist — zie de regel hieronder.
11. [jij] Weeg per beeld of het alternatief hetzelfde doel dient als het beeld, en voeg een
    afkeuring toe waar dat niet zo is.

#### Stap 3 — Wegschrijven

12. [agent] Stuur de elf deelgebieden hieronder mee met het oordeel, in hetzelfde
    `save-checks`-bericht: `"gebieden": [{ "gebied": "...", "uitkomst": "ok|nvt|fout|opmerking",
    "toelichting": "..." }]`. Zonder een complete lijst wordt het oordeel geweigerd. Staat een
    soort beeld niet op deze pagina, gebruik dan `nvt` met de zin waaróp je hebt gezocht — een
    leeg resultaat en een mislukte zoekactie zien er in een onderbouwing hetzelfde uit.
13. [agent] De onderbouwing bij `reden` is **één of twee zinnen**: of de meting geldig was —
    kwam je op de gevraagde pagina uit, draaide de JavaScript, was het een auditsessie — en
    verder niets. Al het inhoudelijke gaat naar de deelgebieden: waaróp je hebt gezocht schrijf
    je bij het gebied waar je zocht, en een afweging bij het gebied waar hij over gaat. Er is
    bijna nooit iets dat bij geen enkel gebied thuishoort; denk je van wel, kijk dan nog eens
    of het niet toch ergens past.

### Deelgebieden

1. Logo's
2. Hero- en headerafbeelding
3. Teaser- en kaartafbeeldingen in overzichten
4. Iconen en pictogrammen
5. Afbeeldingen in een link of knop (behalve het logo)
6. Complexe beelden: schema's, organogrammen, infographics
7. Kaarten en plattegronden, inclusief de legenda
8. Afbeeldingen met een onderschrift of in een `figure`
9. Foto's in de lopende tekst en galerijen
10. Posters en aankondigingen
11. Beelden met een eigen route: videospeler, CAPTCHA, PDF

### Zo is het vastgesteld

Voor dit criterium is er geen meetcommando, en dat is geen tekort. Er valt niet uit te rekenen
of een tekstalternatief hetzelfde doel dient als het beeld: dat is een uitspraak over
betekenis, en die kan alleen iemand doen die het beeld gezien heeft. Een commando dat alle
`alt`-attributen opsomt zou een lijst opleveren waar het oordeel nog helemaal in moet.

Wat er wel is, zijn twee bronnen naast elkaar. `get-html` levert de code nadat de JavaScript
van de site heeft gedraaid — daar staat wat er wordt voorgelezen. `get-screenshot` legt de
pagina vast zoals hij op het meetmoment te zien was — daar staat wat er over te brengen valt.
Het oordeel ontstaat pas als je die twee tegen elkaar houdt.

Die opname is niet optioneel. Op duurzaam.beverwijk.nl stond in de hero-illustratie het embleem
"Duurzaam Voordeel Beverwijk" met een leeg `alt`, en die naam stond nergens als tekst op de
pagina. In de code was daar niets aan te zien: een afbeelding zonder alternatief ziet er
hetzelfde uit of er nu tekst in staat of niet.

Wat hier niet uit blijkt: wat er in een PDF is getagd — dat staat meestal in een samengeperste
objectstroom en is niet uit de bytes te lezen, dus geen markering vinden is geen bewijs dat ze
ontbreekt. En of een ingesloten videospeler een uitgeschreven tekst aanbiedt; daarvoor is
`get-videosporen` het aangewezen middel, want die knop zit vaak in shadow DOM.

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


#### Hoe je de bevinding dan opschrijft (2026-08-18)

Bij een logo staat niet alleen vast dát het een afkeuring is, maar ook wát er wegvalt en
voor wie. Schrijf allebei op, en schrijf ze zo:

- **Voor wie: wie blind is en een schermlezer gebruikt.** Noem allebei, niet een van de
  twee. En nooit "wie de pagina beluistert": dat is vaag, en op een site met een
  voorleesknop voor alle bezoekers wijst het naar de verkeerde groep. Heuvelrug.nl heeft
  zo'n knop ("Lees voor"), bedoeld voor mensen die moeite hebben met lezen. Zie de
  algemene regel in `Shift2_Schrijfregels.md`.
- **Wat er wegvalt: de afzender.** Bij een gewone afbeelding met tekst is dat "de tekst op
  de afbeelding"; bij een logo is het van wie iets is. Schrijf dus "welke organisatie deze
  pagina uitgeeft" of "welke groep de gemeente adviseert", niet "de tekst in het logo".
- **Citeer de tekst op het logo niet.** Dat staat al bij de regels hierboven en volgt uit
  het vorige punt: het gaat om de afzender, niet om de letterlijke inhoud van het beeldmerk.

Voorbeeld (UTHEU-02, lokale inclusie):

> In de zijbalk staat het logo van adviesgroep Samen Zonder Heuvels. Het tekstalternatief is
> leeg (alt=""), waardoor de naam van de adviesgroep niet wordt voorgelezen. Wie blind is en
> een schermlezer gebruikt krijgt daardoor niet mee welke groep de gemeente adviseert.

### 2026-08-15

Twee regels over wat een leeg tekstalternatief goedpraat, en wat niet.

- TEASERFOTO MET alt="" IS ALLEEN GOED IN EEN OVERZICHT. De uitzondering hangt aan de context: in een nieuws- of productoverzicht dragen de titel-link en de teasertekst de betekenis al. Staat dezelfde foto op een detailpagina of los in de lopende tekst, dan geldt de uitzondering niet en is een leeg tekstalternatief een afkeuring. Noteer in de onderbouwing dat het om een overzicht gaat — anders is niet na te gaan waarop de uitzondering steunde.

- ICOON MET aria-hidden: CONTROLEER OF DE BETEKENIS ERGENS ANDERS LANDT. Dat er tekst naast staat is niet genoeg, en aria-hidden is op zichzelf geen fout. Kijk naar twee dingen: draagt de tekst ernaast alles wat het icoon overbrengt, of zit er een omhulsel omheen dat het icoon zelf benoemt (`role="img"` met een `aria-label`)? Is een van beide waar, dan is het goed. Verbergt het icoon iets wat nergens landt — een PDF-icoontje naast "Jaarverslag", een pijl naar buiten bij een externe link, een vinkje dat een status aangeeft, een vlag voor een taal — dan is het een afkeuring, want die informatie valt weg. Voorbeeld van een goede opbouw: heuvelrug.nl zet het externe-link-icoontje in een `<span role="img" aria-label="externe link">` met het glyph eronder op aria-hidden. Schrijf in de onderbouwing wát de betekenis draagt, niet dát er tekst stond.

Aanleiding: 1.1.1 op Home (heuvelrug.nl, 2026-08-15). Bij het nalopen van de onderbouwing bleek dat de auditor de teaser-uitzondering had toegepast zonder de overzichtscontext te noemen, en dat "hebben altijd tekst naast zich" als afdoende was opgeschreven zonder die tekst inhoudelijk te controleren.


