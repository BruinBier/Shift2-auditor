# Shift2-beoordelingsregels SC 1.2.3

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_1_2_3.md` als ze elkaar tegenspreken.

## Meestal zelf te bepalen; vraag alleen als het echt niet anders kan

Uit HTML of screenshot alleen is dit niet te bepalen, maar met een videoscan kom je meestal
helemaal rond. Zie `Shift2_Werkwijze_Video.md` voor de methode.

1.2.3 accepteert **drie** manieren om visuele informatie beschikbaar te maken. Loop ze in deze
volgorde af; de eerste twee stel je altijd zelf vast.

**1. Audiodescriptie — een apart audiospoor.** Lees de `adaptiveFormats` uit
`ytInitialPlayerResponse` en kijk of er formats met een `audioTrack` zijn. Is er maar één spoor,
dan is er geen audiodescriptie. Bij een andere speler: is er een knop of menu-optie
"audiodescriptie"?

**2. Een transcript op de pagina of bij de speler.** Is die er, dan is er een geldig alternatief
en vervalt de bevinding (zie ook 1.1.1).

**3. De spreker zegt het gewoon zelf.** Dit is bij gemeentevideo's de meest voorkomende situatie:
iemand die zichzelf voorstelt met "Ik ben Suzanne Klaassen, wethouder in Beverwijk" maakt de
naam-in-beeld hoorbaar, en dan is er geen bevinding.

> Let op: uit "geen audiodescriptie-knop" volgt NIET dat de tekst onhoorbaar is. Dat bewijst
> alleen dat route 1 dicht is. Route 3 blijft open, en die is in de praktijk de belangrijkste.

### Route 3 zelf beantwoorden: lees de open ondertiteling

Heeft de video **open ondertiteling** (in het beeld gebrand), dan geeft die weer wat er gesproken
wordt. Vergelijk dan per tijdstip de tekst in beeld met de ondertiteling eronder:

- Staat er een naambalkje en zegt de ondertiteling op dat moment iets heel anders, dan wordt de
  naam niet uitgesproken. **Afkeuring**, en je hoeft niets te vragen.
- Staat er tekst in beeld zonder ondertiteling eronder (zoals een titelkaart), dan wordt die tekst
  niet uitgesproken.
- Komt de tekst uit beeld terug in de ondertiteling, dan is hij wél hoorbaar en is er op dat punt
  geen bevinding.

Controleer ook het frame ervoor en erna: iemand kan zich net vóór of ná het naambalkje voorstellen.

Voorbeeld (BEV-03, 2026-08-04): op 00:09 staat "Suzanne Klaassen, Wethouder Beverwijk" in beeld
terwijl de ondertiteling zegt "Onze ondernemers kunnen daardoor niet meer uitbreiden", en op 00:15
loopt ze door met "En dat raakt onze lokale economie". Ze stelt zich nergens voor. Geen apart
audiospoor, geen transcript-knop. Alle drie de routes dicht, dus afkeuring — zonder vraag aan de
onderzoeker.

### Alleen zónder ondertiteling blijft er een vraag over

Is er geen ondertiteling en ook geen transcript, dan kun je niet horen of de spreker de tekst
zelf noemt. Dan pas `niet_te_bepalen`, met je eigen bevindingen erbij zodat er alleen geluisterd
hoeft te worden:

> In de video 'X' op [pagina] staat op 00:09 "Suzanne Klaassen, Wethouder Beverwijk" in beeld en
> op 00:43 "Jeroen Brakenhoff, Brakenhoff Transport". Er is geen audiodescriptie-spoor en geen
> transcript. Worden deze namen en functies in de video zelf uitgesproken?

Nooit stilzwijgend op `voldoet` zetten omdat je het niet kon horen.

## Geen visuele informatie gevonden: zelf op voldoet, mét bewijs in `reden`

Vind je bij het scannen niets dat hoorbaar gemaakt moet worden, zet het criterium dan **zelf** op
`voldoet`. Leg het niet voor: bij een vanzelfsprekend antwoord voegt een akkoordvraag niets toe,
en te veel routinevragen maken de vragen die er wél toe doen minder zichtbaar.

Maar `voldoet` is de status waar een fout onzichtbaar blijft. Een afkeuring komt in het rapport
en wordt gelezen; een goedkeuring levert geen tekst op om over te struikelen. Noteer daarom in
`reden` waaróp je het baseert, zodat de onderzoeker het bij het nalopen van de dekkingslijst in
één oogopslag kan wegen:

> 31 frames gescand op 3-seconde-interval. Alleen sprekers in beeld, geen naambalkjes, geen
> tekst-op-beeld, geen handelingen die worden voorgedaan. Frames in tmp/frames/.

Een leeg `reden`-veld bij `voldoet` betekent dat er niet is onderzocht maar aangenomen. Laat het
dus nooit leeg.

## Let op: tekst is niet alle visuele informatie

De scan vindt tekst in beeld. Die vindt géén handelingen. Denk aan iemand die een apparaat
bedient en zegt "en dan draai je deze knop", iets aanwijst op een kaart, of iets voordoet zonder
het te benoemen. Geen letter tekst, wél visuele informatie die iemand die blind is mist.

Beoordeel de frames dus op wat er te zien is, niet alleen op of er letters staan. Zie je
handelingen, aanwijzingen, apparaten, kaarten of schermen, leg het dan wél voor met de vraag of
het ook wordt verteld.

## Regels

- Video met visuele informatie die niet hoorbaar wordt overgebracht (naam-in-beeld, lower thirds, locatie-labels, logos): rapporteer als TWEE aparte bevindingen, een onder 1.2.3 (niveau A) en een onder 1.2.5 (niveau AA). Beide impact matig, responsibility redacteur.
- Gebruik de vaste QuickFinding-tekst ed3a4d2a-ce67-4474-88a0-edba1c124624. Beschrijving: "Op de pagina staat de video 'X'. In deze video komt visuele informatie voor die niet beschikbaar is voor mensen die blind of slechtziend zijn." Daarna "Voorbeelden:" met bullets in de vorm MM:SS "tekst in beeld". De volledige titel, beschrijving en het advies staan hieronder onder "Vaste teksten uit de QuickFinding-bibliotheek".
- Het advies bij 1.2.3 is VASTE standaardtekst uit de QuickFinding. Niet zelf herformuleren of "verbeteren", ook niet als de tekst feitelijk onjuist lijkt. Dat geldt in het bijzonder voor de zin over 1.2.5 in het advies van de8bf36c-495a-4bad-90b9-63b3f8f833be; zie hieronder waarom die blijft staan.
- Woordkeuze die vastligt: "beschrijft" niet "vertelt"; "is opgenomen" niet "wordt beschreven"; geen "namelijk" in de doelgroep-zin; "onder de video" niet "onder of naast de video".
- Maximaal twee a drie voorbeelden met tijdstip. Geen lange opsomming.
- Check eerst of de speler een transcript-knop heeft (zie 1.1.1). Is die er, dan is er een geldig alternatief.

## Vaste teksten uit de QuickFinding-bibliotheek

Deze teksten zijn door Frits goedgekeurd en liggen vast. Neem ze letterlijk over en vul
alleen de titel van de video en de voorbeelden in. Niet herformuleren, niet "grammaticaal
verbeteren", niet consistent maken met andere plekken. Vraagt Frits een vervanging op één
plek, voer die dan alleen dáár door; en is de gevraagde tekst krom, laat hem dan zo: hij
leest zelf mee.

### QuickFinding ed3a4d2a-ce67-4474-88a0-edba1c124624 (1.2.3)

Titel: **Video met visuele informatie zonder audiodescriptie of media-alternatief**

Beschrijving:

> Op de pagina staat een video. In deze video komt visuele informatie voor die niet
> beschikbaar is voor mensen die blind of slechtziend zijn.
>
> Voorbeelden:
> - MM:SS "tekst in beeld"
> - MM:SS "tekst in beeld"

Advies:

> Kies één van deze twee oplossingen:
>
> 1. Voeg een audiodescriptie toe om belangrijke visuele informatie hoorbaar te maken. Dit
> kan door een tweede audiospoor aan de video toe te voegen dat zowel de originele audio als
> de audiodescriptie bevat. Is er in het audiospoor écht geen ruimte? Neem de visuele
> informatie dan als alternatief op in een teksttranscript.
>
> 2. Of voeg onder de video een media-alternatief (transcript) toe: een tekst die zowel het
> gesproken woord als de visuele informatie beschrijft. Dit transcript bevat alle hoorbare en
> zichtbare informatie uit de video en wordt waar mogelijk voorzien van timestamps. Een
> transcript biedt voordelen voor veel verschillende gebruikers. Voor mensen die informatie
> in een video te snel vinden gaan, is een rustig naleesbare tekst een uitstekend
> alternatief. Daarnaast stelt het doofblinde gebruikers in staat om de inhoud van de video
> via een brailleleesregel volledig mee te krijgen.

Bij toepassen: "een video" wordt "de video 'X'" met de titel van de video; twee, hooguit
drie voorbeelden met tijdstip en de tekst die in beeld staat; impact `matig`,
verantwoordelijkheid `redacteur`, status `open`. De tegenhanger voor 1.2.5 (QuickFinding
50baed61-a658-4b18-8286-9b2104fdd43c) staat in `Shift2_Regels_SC_1_2_5.md`.

### QuickFinding de8bf36c-495a-4bad-90b9-63b3f8f833be (1.2.3, oudere variant)

Titel: **Transcript of audiodescriptie (genoeg ruimte)**. Deze staat in
`lib/quick-findings-data.ts`; in de database is hij op 2026-09-11 niet meer aangetroffen.
Bestaande bevindingen die erop gebaseerd zijn, dragen dit advies nog, en dat blijft zo.

Beschrijving:

> Op pagina URL staat een video waarin visuele informatie voorkomt. Deze informatie is niet
> hoorbaar en daardoor niet beschikbaar voor mensen die blind of slechtziend zijn. Zorg ervoor
> dat er een alternatief voor deze visuele informatie komt.
>
> Hierbij enkele voorbeelden van informatie die in beeld staat (visueel) en niet te horen is: X.
>
> Er is in deze video voldoende ruimte aanwezig om audiodescriptie toe te voegen.

Advies:

> Voor succescriterium 1.2.3 zijn er twee opties: een transcript of audiodescriptie. Voor
> succescriterium 1.2.5 is een transcript echter niet meer toegestaan als er voldoende ruimte
> is voor audiodescriptie. In dat geval moet er audiodescriptie zijn om te voldoen aan niveau
> AA. Het is het beste om zowel een transcript als audiodescriptie aan te bieden.
>
> Het transcript moet alle informatie in de video bevatten, zowel hoorbaar als zichtbaar.
> Waar mogelijk wordt het transcript ook voorzien van zogenaamde timestamps. Plaats het
> transcript onder de video. Een transcript kan voor meerdere mensen voordelen hebben. Voor
> sommige mensen kan informatie in een video te snel gaan, dan kan een transcript een goed
> alternatief zijn. Mensen die niet kunnen zien en niet kunnen horen, kunnen een transcript
> omzetten naar braille.
>
> Audiodescriptie zorgt ervoor dat alle visuele informatie ook hoorbaar wordt. Oftewel: hoor
> alles wat je ziet. Dit kan door een tweede audiospoor toe te voegen aan de video dat zowel
> de normale audio bevat als de audiodescriptie. Andere oplossingen zijn ook mogelijk.

### Het 1.2.3-advies blijft ongewijzigd, ook als de zin over 1.2.5 onjuist lijkt

De zin "Voor succescriterium 1.2.5 is een transcript echter niet meer toegestaan als er
voldoende ruimte is voor audiodescriptie" ziet er vanuit de W3C-tekst uit als een fout:
1.2.5 kent geen transcript-uitzondering. Toch is dit een vaste Shift2-formulering en hij
blijft staan. Inhoudelijk klopt hij zoals Shift2 het leest: onder 1.2.3 (niveau A) is een
transcript een geldig alternatief; onder 1.2.5 (niveau AA) eist Shift2 audiodescriptie zodra
er ruimte voor is in de natuurlijke pauzes, en alleen op de momenten waar er géén ruimte is,
mag de visuele informatie voor dát moment in het transcript. Zie de ruimte-tabel in
`Shift2_Regels_SC_1_2_5.md`.

Aanleiding: op 2026-05-26 markeerde Claude de zin als feitelijk onjuist, stelde voor hem te
vervangen door "een transcript is nooit voldoende voor 1.2.5", en werkte vervolgens B008,
B015 én de QuickFinding bij. Frits draaide alle drie de wijzigingen terug.

Algemener: een advies dat rechtstreeks uit een QuickFinding komt, is standaardtekst. Ga er
niet vanuit de eigen W3C-leeswijze kritisch op in en stel geen wijziging voor. Wil de
onderzoeker zelf iets veranderen, dan is dat zijn beslissing; bespreek dan ook of de
QuickFinding zelf mee moet veranderen, en pas nooit meer aan dan het project waar de vraag
over gaat (zie `Shift2_Schrijfregels.md`).

## Op de kaart

> Dit blok staat in het scherm van "Waar sta ik". De kaart leest het rechtstreeks uit dit
> bestand: wat je hier verandert, staat bij de volgende keer verversen op de kaart. Er is
> geen tussenstap en geen kopie. Houd het kort -- een kaart is geen naslagwerk. Wat langer
> is hoort in de secties hierboven.

### Titel

Visuele informatie hoorbaar bij vooraf opgenomen video

### In het kort

Wie blind of slechtziend is, mist wat er alleen te zien is. Een naambalkje onder een
spreker, een titelkaart, een kaart die wordt aangewezen, een handeling die wordt
voorgedaan zonder dat iemand zegt wat er gebeurt.

Er zijn **drie** manieren waarop dat toch aankomt, en de eerste twee stel je zelf vast: een
apart audiospoor met audiodescriptie, een transcript op de pagina, of -- veruit het meest
voorkomend -- de spreker die het gewoon zelf zegt. "Ik ben Suzanne Klaassen, wethouder in
Beverwijk" maakt het naambalkje hoorbaar, en dan is er geen bevinding.

Uit "geen audiodescriptie-knop" volgt dus niet dat de tekst onhoorbaar is. Dat bewijst
alleen dat de eerste route dicht is.

### Audit-instructies

> Zet voor elke stap wie hem uitvoert: `[meting]` als een commando het al doet, `[jij]` als er
> een mens voor nodig is. De kaart toont dat met een vinkje of een open rondje, zodat er niet
> als opdracht staat wat allang gedaan is.

#### Stap 1 -- Is er iets te beoordelen?

1. [agent] Zoek de ingesloten videospelers: `video`-elementen en `iframe`-insluitingen van
   YouTube, Vimeo of een eigen speler. Noteer waarop je hebt gezocht.
2. [agent] Een video die alleen gelínkt is, zonder speler op de pagina, valt buiten dit
   criterium -- ook als hij van de organisatie zelf is. De grens ligt bij het insluiten, niet
   bij het eigendom. Dan `niet_aanwezig`, met die reden erbij.

#### Stap 2 -- Wat is er te zien dat niet te horen is?

3. [agent] Bekijk beeldjes verspreid over de video. Noteer wat er in beeld staat: naambalkjes,
   titelkaarten, locatielabels, teksten op schermen.
4. [agent] Kijk ook naar wat er GEBEURT, niet alleen naar letters. Iemand die een apparaat
   bedient, iets aanwijst op een kaart, of iets voordoet zonder het te benoemen -- dat is
   visuele informatie zonder één letter tekst, en een scan op tekst vindt hem niet.

#### Stap 3 -- De drie routes aflopen

5. [agent] **Audiodescriptie.** Lees de audiosporen met `get-videosporen`. Eén spoor betekent
   geen audiodescriptie.
6. [agent] **Transcript.** Staat er een uitgeschreven tekst op de pagina of een transcript-knop
   bij de speler? Dan is er een geldig alternatief en vervalt de bevinding.
7. [agent] **De spreker zelf.** Heeft de video ondertiteling, lees die dan op de tijdstippen
   waar iets in beeld staat. Zegt de ondertiteling op dat moment iets anders, dan wordt het niet
   uitgesproken: afkeuring, zonder vraag. Komt de tekst terug in de ondertiteling, dan is hij
   hoorbaar. Kijk ook naar het beeldje ervóór en erná -- iemand kan zich net eerder voorstellen.

#### Stap 4 -- Wegen

8. [jij] Is er geen ondertiteling en geen transcript, dan kun je niet horen of de spreker het
   zelf noemt. Dan `niet_te_bepalen`, met de tijdstippen en de teksten erbij zodat er alleen
   geluisterd hoeft te worden. Nooit stilzwijgend op `voldoet` omdat je het niet kon horen.
9. [jij] Bij een afkeuring: gebruik de vaste QuickFinding ed3a4d2a-ce67-4474-88a0-edba1c124624
   en herformuleer die tekst niet. Impact `matig`, verantwoordelijkheid `redacteur`. Twee tot
   drie voorbeelden met tijdstip, niet meer. En schrijf een tweede bevinding onder 1.2.5: dat
   zijn twee criteria, niet één.

#### Stap 5 -- Wegschrijven

10. [agent] Stuur de vier deelgebieden hieronder mee met het oordeel, in hetzelfde
    `save-checks`-bericht. Zonder een complete lijst wordt het oordeel geweigerd. Staat er geen
    ingesloten video op de pagina, gebruik dan `nvt` met de zin waaróp je hebt gezocht.
11. [agent] Vond je niets dat hoorbaar gemaakt moet worden, zet het dan zelf op `voldoet` -- maar
    schrijf in de toelichting bij gebied 2 waaróp je dat baseert: hoeveel beeldjes, met welk
    interval, en wat je wél zag. `voldoet` is de status waar een fout onzichtbaar blijft.
12. [agent] De onderbouwing bij `reden` is **één of twee zinnen**: of de meting geldig was --
    kwam je op de gevraagde pagina uit, speelde de video, was het een auditsessie -- en verder
    niets. Al het inhoudelijke gaat naar de deelgebieden.

### Deelgebieden

1. Ingesloten video met beeld
2. Tekst in beeld: naambalkjes, titelkaarten, labels
3. Handelingen en aanwijzingen zonder woorden
4. De drie routes: audiodescriptie, transcript, of de spreker zelf

### Zo is het vastgesteld

`get-videosporen` leest de audio- en ondertitelsporen per video en legt drie beeldjes vast,
verspreid over de duur. Dat is het middel voor route 1 en voor het lezen van open
ondertiteling bij route 3.

Wat het niet doet: het beoordeelt niet wat er in beeld gebeurt. Handelingen, aanwijzingen en
apparaten moet je zelf op de beeldjes zien. En drie beeldjes over een video van vijf minuten
zijn een steekproef, geen dekking -- staat er veel in beeld, kijk dan verder.

## Alleen ingesloten media telt mee

Media valt onder dit criterium wanneer de speler **op de pagina zelf is ingesloten**:
een `<video>`, een `<audio>`, of een `<iframe>` naar YouTube of Vimeo binnen de
beoordeelde pagina.

Staat er alleen een **link** naar een video elders — bijvoorbeeld een tekstlink naar
YouTube — dan is er op deze pagina geen media om te beoordelen. Zet het criterium dan op
`niet_aanwezig` met als reden dat de video niet is ingesloten.

Dat geldt ook als de video van de organisatie zelf is. De grens ligt bij het insluiten,
niet bij het eigendom.

Vastgelegd door Frits op 2026-08-15, naar aanleiding van heuvelrug.nl/archeologie: zes
afleveringen van "Graven in het Groen" die uitsluitend als tekstlink naar YouTube zijn
opgenomen.
