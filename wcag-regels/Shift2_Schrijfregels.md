# Shift2-schrijfregels voor bevindingen

Deze regels gelden voor **elke** bevinding, ongeacht het succescriterium. Ze gaan over
de description en het advice-veld in de Shift2-auditor.

De SC-specifieke regels staan in `Shift2_Regels_SC_<code>.md`. Bij tegenspraak wint het
SC-bestand, want dat is specifieker.

> Let op: deze regels wijken bewust af van `wcag-checklists/Project_Instructie_WCAG_Audit.md`
> op twee punten (URL in de description, en HTML-fragmenten citeren). Die instructie is voor
> losse bevindingenrapporten; hier gaat het om bevindingen in de Shift2-auditor app.

## Structuur van de description

Kort en to-the-point. Bij eenvoudige issues drie zinnen:

1. **Locatie + wat er staat** — "Op de pagina staat ..." / "In de footer staat ..."
2. **Het kernprobleem** — "De afbeelding heeft geen tekstalternatief."
3. **Effect op de gebruiker** — noem de beperking en het hulpmiddel samen: "Wie blind is
   en een schermlezer gebruikt, hoort ..." Zie "Noem de beperking en het hulpmiddel samen"
   hieronder.

Bij een complexer issue: noem het **kernprobleem voor de gebruiker eerst**, en pas daarna
de concrete oorzaken. Niet eerst een reeks technische observaties opsommen en het effect
tot het eind bewaren; de lezer moet meteen weten wat er misgaat.

Meer dan drie zinnen alleen als dat echt nodig is voor begrip.

## Wat je NIET doet

- **Niet met de URL beginnen.** Die staat al bij het SampleItem. Begin met "Op de pagina",
  "In de footer", "Boven aan de pagina".
- **Geen gedachtestreepjes.** Geen em-dash (—) en geen en-dash (–). Splits in twee zinnen
  of gebruik een komma.
- **Geen HTML-codeblokken.** Geen aparte sectie "HTML van de getroffen koppen:" met een
  fragment eronder. Noem elementen inline in de lopende tekst ("de koptekst is omsloten
  door een strong-element").
- **Geen volledige vindplaats-lijst.** Komt de bevinding op meerdere sample-items voor,
  geef dan één concreet voorbeeld ("Een voorbeeld is de link X in de footer van de
  homepage"). De gekoppelde sample-items tonen de rest al.
- **Geen andere criteria erin mengen.** Een verwant probleem dat onder een ander
  succescriterium valt, krijgt een eigen bevinding.

  Dit gaat over de BEVINDING, niet over het advies. Het advies mag wel vertellen hoe je het
  goed opbouwt, ook als dat een ander criterium raakt: de redacteur gaat het onderdeel
  opnieuw maken en moet niet in een volgende fout lopen. Adviseer je bijvoorbeeld om foto's
  uit een tabel te halen en als reeks te plaatsen, noem dan waar een onderschrift voor is --
  anders komt hetzelfde onderschrift terug dat het tekstalternatief woordelijk herhaalt.

  Wat je niet doet is er een tweede bevinding van maken. Constateren dat die herhaling er nu
  al staat hoort in een eigen 1.1.1-bevinding.

  Aanleiding (2026-08-18): bij de fototabel op de Japanse-duizendknooppagina hield ik het
  onderschrift bewust buiten het advies. Frits: "vermeld je niet dat bij het naast elkaar
  plaatsen van de afbeeldingen dat onderschrift bedoeld is..."
- **Niet dezelfde zaak twee keer uitleggen** in andere woorden. Het komt er bijna altijd
  zo in: eerst vanuit de software, dan vanuit de gebruiker. "Hulpsoftware kondigt geen
  lijst aan en noemt het aantal items niet, zodat wie de pagina laat voorlezen niet hoort
  dat het om een opsomming gaat en hoeveel er zijn" is één feit in twee jassen. Kies de
  kant van de gebruiker; die staat toch al voorgeschreven als derde zin.
- **Geen bewijsvoering in de bevinding.** Wat je hebt nagekeken en wat in orde was, hoort
  in de onderbouwing van het oordeel, niet in de bevinding. "De eerste en derde
  footerkolom doen dit wel goed" zegt de lezer van het rapport niets over het probleem dat
  hij moet oplossen.
- **Geen overbodige uitleg over hoe WCAG werkt.**
- **Geen overbodige "van de gemeente"** of vergelijkbare bezitsbepaling. Schrijf "de links naar
  de sociale media", niet "de links naar de sociale media van de gemeente". De bevinding staat
  al in het rapport van die organisatie. Wél noemen waar het inhoudelijk uitmaakt, zoals bij
  2.4.4 waar het probleem juist is dat de linktekst de organisatie niet noemt.
- **Geen slotzin met een oordeel.** "Dit is verwarrend", "dit maakt de structuur
  onlogisch", "dit is niet gebruiksvriendelijk": die zinnen voegen na de concrete
  uitwerking niets toe. De derde zin heeft het gevolg al benoemd; wat erachteraan komt is
  een mening over dat gevolg.
- **Zet de plaats in de eerste zin, niet in het advies.** Komt uit het advies pas naar
  voren waar het probleem zit ("de titel van het uitklapblok is al een kop"), dan mist de
  bevinding zijn eerste zin. Het advies wordt er bovendien langer van dan nodig.
- **Let ook op dubbeling binnen één zinsdeel.** "Een tweede, identieke kop met dezelfde
  tekst" zegt het twee keer. Idem "een lege sectie zonder inhoud" en "elke afzonderlijke
  link apart".
- **Geen aantallen die alleen de omvang aangeven.** "met 59 rijen en 29", "op 14 van de 20
  pagina's", "twaalf keer op deze pagina": zulke getallen onderbouwen hooguit hoe erg het
  is, en dat hoort in de onderbouwing van het oordeel. Ze verouderen bovendien meteen --
  volgende maand staan er andere rijen in die tabel -- terwijl de redacteur er niets mee
  kan: hij moet de koprij markeren, of dat er nu tien of honderd rijen onder staan.

  Getallen die het onderdeel zelf beschrijven blijven wel staan: "zes foto's in een tabel",
  "een tabel van twee rijen en drie kolommen", "de kop staat twee keer". Die vertellen wat
  er is, niet hoe vaak het misgaat.

  Vastgelegd door Frits op 2026-08-18.
- **Citeer de werkelijke waarde, omschrijf hem niet.** "De titel bevat de bestandsnaam,
  inclusief de aanduiding 'concept' en een maandaanduiding" laat de lezer raden. Zet er
  gewoon neer wat er staat: "Microsoft Word - Beleidsvisie Horeca &
  Terrassen_concept_mei 2024_na college". Dan is de bevinding na te kijken en spreekt hij
  voor zich. Dit geldt voor elke waarde die je aantreft: een documenttitel, een linktekst,
  een tekstalternatief, de tekst van een kop.

  Is de waarde te lang, citeer dan het begin en schrijf "zoals ...". Bij een LOGO citeer je
  de tekst juist niet; zie `Shift2_Regels_SC_1_1_1.md`.

  Vastgelegd door Frits op 2026-08-18.

Aanleiding (2026-08-18): drie schrijfchecks op rij (sociale-media-links, PDF zonder tags,
dubbele kop op de paspoortpagina) leverden telkens dezelfde drie patronen op.

## Toon en formulering

- **Direct en stellig.** Vermijd "mogelijk", "misschien", "het wordt aanbevolen".
- **Bij contrast: "voldoende contrast hebben", niet "afsteken tegen".** Schrijf "zodat de
  witte tekst voldoende contrast heeft", niet "zodat de tekst er voldoende van afsteekt".
  Afsteken is beeldspraak vanuit het zien; contrast is de eis waar het om gaat.
- **Hulpsoftware leest voor, laat niets zien.** Schermlezers zijn auditief. Schrijf
  "hulpsoftware leest de linktekst voor" en "gebruikers horen alleen ...", nooit
  "hulpsoftware laat zien" of "gebruikers zien alleen".
- **Noem de beperking en het hulpmiddel samen.** Niet "wie een schermlezer gebruikt" en
  niet "iemand die blind is", maar allebei: **"Wie blind is en een schermlezer gebruikt,
  ..."** Het hulpmiddel alleen laat in het midden om wie het gaat, en de beperking alleen
  laat in het midden hoe iemand het document dan wel benadert. Samen is het concreet.
- **Schrijf nooit "wie de pagina beluistert".** Dat is vaag, en op een site met een
  voorleesknop voor alle bezoekers wijst het naar de verkeerde groep. Heuvelrug.nl heeft
  zo'n knop ("Lees voor"), en die is er voor mensen die moeite hebben met lezen, niet voor
  wie de afbeelding niet kan zien.
- Let op enkelvoud in de vervolgzin ("denkt", niet "denken ze").

  Vastgelegd door Frits op 2026-08-18, bij een bevinding over een leeg tekstalternatief en
  bij een ongetagde PDF.
- **Maximaal twee à drie voorbeelden**, met "zoals" of "bijvoorbeeld". Geen lange
  parenthetische opsommingen.
- **Voeg gelijksoortige voorbeelden samen.** Verschillen twee bullets alleen in een naam,
  maak er één bullet van ("In de video's van X en Y ...").
- **Site-breed patroon?** Koppel aan één representatief sample (meestal de homepage) en
  zet in de description "Dit patroon is op alle pagina's van de website aanwezig".
  **Uitzondering: header en footer.** Staat er al "In de footer" of "Boven aan de pagina", dan
  is die zin overbodig: een footer staat per definitie op elke pagina. Header en footer worden
  bovendien alleen op het homepage-sample beoordeeld, dus de bevinding hangt sowieso aan één
  sample-item.

## Terminologie

Vermijd technisch jargon; bevindingen worden gelezen door redacteuren, bestuurders en
communicatiemedewerkers.

| Niet | Wel |
|---|---|
| DOM, DOM-volgorde | de code, volgorde in de code |
| markup | code, opmaak |
| node | element |
| tekstbeschrijving | **tekstalternatief** |
| "beschrijft wat er in de afbeelding staat" | "brengt de informatie over" |
| pipe-teken, pipe | **verticale streepje (|)** |
| bullet, bulletpoint | opsommingsteken |
| whitespace | witruimte |
| string | tekst |

### Namen voor onderdelen van de pagina

Vaste woorden, zodat niet elke ronde een ander woord kiest voor hetzelfde onderdeel. Een
redacteur die twee bevindingen naast elkaar legt moet niet hoeven raden of "accordeon" en
"uitklapper" hetzelfde zijn.

| Onderdeel | Zo noemen we het | Niet |
|---|---|---|
| `details` met `summary`, klapt tekst open | **uitklapblok** | accordeon, uitklapper, inklapbaar blok, details-element |
| uitklappende navigatie in de header | **uitklapmenu** | dropdown, submenu |
| `li` binnen een lijst | **lijst item** | list-item, listitem |
| `ul` | **ongeordende lijst** | bullet list, unordered list |
| kolom in de footer | **footerkolom**, met het nummer erbij ("de tweede footerkolom") | footer sectie, footerblok |
| kolom naast de hoofdtekst | **zijbalk** | sidebar, marge |
| de rij met sociale-media-pictogrammen | **sociale-media-rij**, de links erin **sociale-media-links** | social media buttons, socials |
| een herbruikbare bevindingstekst in de bibliotheek | **snelle bevinding** | sjabloon, template, QuickFinding |

Let op het verschil tussen **uitklapblok** en **uitklapmenu**. Het eerste zit in de
inhoud en klapt tekst open, het tweede zit in de navigatie. Ze vallen vaak onder
verschillende criteria en op vervolgpagina's valt het menu buiten de scope, het
uitklapblok niet.

Waar de redacteur iets moet aanpassen: **"in het CMS in de broncode"**. Niet "in de HTML"
of "in de code" zonder meer, want dan is niet duidelijk of hij daarbij kan.

Aanleiding (2026-08-18): Frits corrigeerde "list-item" naar "lijst item" en "voeg in de
broncode" naar "voeg in het CMS in de broncode", en vroeg of zulke woorden ergens worden
onthouden voor volgende bevindingen.

## Geen voorbehoud over criteria die niet in het onderzoek zitten

Een onderbouwing eindigen met "hiermee is niet beoordeeld of X; dat valt onder SC Y" is alleen
zinnig als SC Y in het onderzoekstype zit. Zit het er niet in, dan wijs je de lezer op werk dat
niemand gaat doen en dat ook niemand hoeft te doen.

Kijk dus eerst welke criteria dit onderzoek kent. Bij UTHEU-02 zijn dat er 33, en 2.4.7 zit er
niet bij — een zin over de zichtbaarheid van de focus hoorde daar dus niet.

Wat wél blijft staan: een voorbehoud over iets binnen hetzelfde criterium dat je niet hebt
kunnen meten. Dat is geen verwijzing maar een gat in je eigen werk.

Aanleiding (2026-08-17): bij 2.1.2 op de homepage stond "Hiermee is niet beoordeeld of de
focus zichtbaar is; dat is 2.4.7." Frits: "dat hoeft ook niet, dat zit niet in het
onderzoekstype."

## Ook in het scherm zelf

**Dit geldt net zo goed voor de teksten in het scherm zelf.** Daar sluipt een ander soort
jargon in: de naam van een bestand of van een stuk machinerie, in plaats van wat het doet.

| Niet | Wel |
|---|---|
| "langs de bewijsvoeringsregels gelegd" | "nagerekend of het verhaal klopt met wat er gemeten is" |
| "draait mee met de audit-workflow" | "gebeurt als een pagina in één ronde wordt nagelopen" |
| "de verantwoording is gekoppeld" | "hieronder staat waarop dit oordeel rust" |

De vraag om te stellen: zou iemand die de code niet kent hieruit opmaken wat er is gebeurd
en wat niet? Een bestandsnaam beantwoordt die vraag nooit.

Aanleiding (2026-08-17): op de stapelkaart stond "De onderbouwing is niet apart langs de
bewijsvoeringsregels gelegd. Die controle draait mee met de audit-workflow." Frits vroeg wat
daarmee bedoeld werd — terecht, want er stonden twee interne namen in en geen enkel woord
over wat er wél of niet was nagekeken.

HTML-elementnamen (`strong`, `em`, `h1`, `ul`, `li`, `th`) mogen wel genoemd worden, maar
inline in de lopende tekst, niet als los codeblok.

**Attribuutnamen en waarden mogen ook**, inline en tussen haakjes na de gewone term:
"een leeg tekstalternatief (alt="")", "het alt-attribuut". Dat maakt voor de ontwikkelaar
of redacteur concreet waar het over gaat, zonder dat de zin onleesbaar wordt voor anderen.
Gebruik het spaarzaam: noem eerst wat het is in gewone taal, dan pas de technische term.

Voor PDF-bevindingen geldt dit NIET: daar blijven interne tagnamen (`<Figure>`, `/Alt`,
`<LBody>`) buiten de tekst. Zie de PDF-regels hieronder.

Een tekstalternatief is **functioneel**, geen visuele beschrijving: het geeft de informatie
of boodschap door die de afbeelding overbrengt, niet hoe de afbeelding eruitziet.

### PDF-bevindingen

- Geen interne tagnamen: niet `<Figure>`, `ImageData`, `src`, `Alt-attribuut`, `<L>`,
  `<LBody>`, `<Lbl>`. Schrijf "als afbeelding aangemerkt", "geen tekstalternatief".
- Geen toolnamen in het advies: niet Canva, Word of InDesign. Spreek over "het
  brondocument". Adobe Acrobat mag wél genoemd worden bij concrete tag-stappen (het
  Tags-paneel, "Wijzig tagtype").
- **Standaardadvies bij een document zonder tagstructuur.** Vastgesteld door Frits op
  2026-08-18:

  > Maak het document opnieuw toegankelijk vanuit het brondocument. Gebruik daar echte
  > kopstijlen voor de hoofdstuk- en paragraafkoppen, echte opsommings- en tabelfuncties,
  > en exporteer vervolgens met de optie waarbij de tagstructuur behouden blijft.

  Houd het op dit niveau. Ga niet uitzoeken in welk programma het bestand is gemaakt, en
  noem geen specifieke koppen of lijsten uit het document: de redacteur werkt in zijn
  eigen bronbestand en weet zelf welke koppen dat zijn. Een advies dat de knoppen van een
  bepaald programma beschrijft is onbruikbaar zodra het volgende document ergens anders
  vandaan komt.

## Fout of opmerking

- **Fout** (afgekeurd, status `open`): impact én verantwoordelijkheid invullen.
- **Opmerking** (status `resolved`): impact en verantwoordelijkheid **altijd leeg laten**.
  Een opmerking is geen WCAG-schending maar een verbeteradvies.

Sluit het advies van een opmerking af met "Dit is een best practice." waar dat past
(zie de SC-bestanden voor 1.3.1).

## Voor je een bevinding aanmaakt

1. **Check de QuickFinding-bibliotheek** — bestaat er al een passende template? Doe dit
   **meteen** bij het constateren van een issue, niet pas nadat je zelf een tekst hebt bedacht.

   Bij een treffer is de QuickFinding-tekst het **uitgangspunt**, niet een eigen formulering
   die er ongeveer op lijkt. Neem description en advice letterlijk over. Aanpassen mag alleen
   om placeholders in te vullen of om iets te schrappen dat feitelijk niet klopt met deze site.
   **Voeg niets toe wat niet in de QuickFinding staat.**

   Meld expliciet wat je hebt gevonden: "QuickFinding X gevonden, tekst ongewijzigd overgenomen"
   of "niets passends gevonden, zelf geformuleerd".
2. **Check bestaande bevindingen in het project** — hetzelfde criterium met dezelfde oorzaak
   op een andere pagina? Breid dan de bestaande bevinding uit met het nieuwe sample-item in
   plaats van een duplicaat aan te maken. Meld dit proactief en vraag of het samengevoegd
   moet worden; beslis het niet zelf.
   Een andere **oorzaak** onder hetzelfde criterium is wél een aparte bevinding (1.3.1
   strong-in-kop is iets anders dan 1.3.1 br-als-lijst).
3. **Is dit onderdeel al onder een ander criterium behandeld?** Zo ja, en lost het advies daar
   dit probleem mee op, schrijf het dan niet nog eens op. Je hoeft niet alles te benoemen wat
   niet goed is; het rapport moet de opdrachtgever vertellen wát er moet gebeuren, niet elk
   criterium uitputtend afvinken.

   Voorbeeld: staan de cirkeldiagrammen en kaarten al onder 1.4.1 afgekeurd omdat kleur de
   enige drager is, dan hoeft een mogelijk te laag contrast tussen aangrenzende segmenten er
   niet als losse 1.4.11-bevinding naast. Het advies bij 1.4.1 (labels of arcering erbij) lost
   dat mee op, en het beeldmateriaal moet toch opnieuw gemaakt worden.

   Zet de afweging wél in `reden` in de dekkingslijst, zodat achteraf te verantwoorden is dat
   je ernaar hebt gekeken en waarom er geen aparte bevinding kwam.

   Let op de grens: gaat het om een **ander probleem** dat met dezelfde ingreep niet is
   opgelost, dan is het wél een aparte bevinding. Een afbeelding zonder tekstalternatief (1.1.1)
   en een link zonder naam (4.1.2) zijn twee losse bevindingen, ook al gaat het om hetzelfde
   element.

### Neem je een QuickFinding over: vul de placeholders in

QuickFindings zijn sjablonen voor hergebruik over alle projecten. Ze bevatten placeholders als
`[organisatie]`, `ORGANISATIE` of `gemeente X`, en soms zinnen die op deze site niet kloppen.
Loop **zowel de description als de advice** na voordat je wegschrijft:

- Vul placeholders in met de werkelijke naam. `"Logo [organisatie]"` wordt
  `"Logo gemeente Utrechtse Heuvelrug"`. Een bevinding met blokhaken erin komt zo in het
  rapport bij de opdrachtgever terecht.
- Schrap of pas aan wat feitelijk niet klopt. Verwijst de QuickFinding naar "de kop Volg ons"
  terwijl de footer van deze site geen koppen heeft, haal die verwijzing dan weg.
- Laat de placeholder in de bibliotheek zelf ongemoeid; alleen de bevinding wordt specifiek.

## Schrijf bevindingen via de API, niet rechtstreeks in de database

Gebruik `POST /api/projects/<id>/findings` om een bevinding aan te maken en
`PUT /api/projects/<id>/findings/<findingId>` om er een te wijzigen. Niet Prisma of een los
script dat de tabel `findings` aanpast.

Reden: de API draait `lib/finding-lint.ts` over elke description en advice, en weigert de
bevinding met een 422 als er een schrijfregel wordt overtreden. Die controle vangt dingen die
je zelf over het hoofd ziet. Schrijf je rechtstreeks naar de database, dan gaat de bevinding er
gewoon in en komt de fout in het rapport bij de opdrachtgever terecht.

Voorbeeld: op 2026-08-04 zijn B035 en B036 via de database weggeschreven met het woord
"afsteken" in het advies. De linter had dat afgekeurd ("beeldspraak vanuit het zien; schrijf dat
de tekst voldoende contrast heeft"), maar kwam er niet aan te pas. Pas toen dezelfde formulering
later wél via de API ging, kwam de fout aan het licht.

Voor de dekkingslijst (`sampleCriterionCheck`) geldt dit niet: daar is geen linter en is de
Prisma-route prima.

## Kun je iets niet beoordelen? Melden, niet weglaten

Kom je bij een criterium iets tegen dat je niet zelf kunt vaststellen (een uitzondering die
een inhoudelijk oordeel vraagt, een meting die niet lukt), zet het criterium dan op
`niet_te_bepalen` en formuleer de concrete vraag voor de onderzoeker, met de gegevens die je
wél hebt.

Laat het **nooit stilzwijgend vallen** en vul geen `voldoet` in omdat je het niet kon toetsen.
Een gemist issue is de enige categorie fouten die onzichtbaar blijft: de onderzoeker kan geen
akkoord geven op een bevinding die nooit is voorgesteld.

Voorbeeld bij 2.5.8: "Op deze pagina is [element] 18 bij 18 pixels, terwijl 24 bij 24 het
minimum is. Is dezelfde functie elders bereikbaar via een knop of link die wél groot genoeg is
(uitzondering 'gelijkwaardig'), of is deze vormgeving noodzakelijk (uitzondering
'essentieel')?"
