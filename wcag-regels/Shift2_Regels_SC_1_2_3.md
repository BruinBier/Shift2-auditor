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
- Gebruik de vaste QuickFinding-tekst ed3a4d2a-ce67-4474-88a0-edba1c124624. Beschrijving: "Op de pagina staat de video 'X'. In deze video komt visuele informatie voor die niet beschikbaar is voor mensen die blind of slechtziend zijn." Daarna "Voorbeelden:" met bullets in de vorm MM:SS "tekst in beeld".
- Het advies bij 1.2.3 is VASTE standaardtekst uit de QuickFinding. Niet zelf herformuleren of "verbeteren", ook niet als de tekst feitelijk onjuist lijkt.
- Woordkeuze die vastligt: "beschrijft" niet "vertelt"; "is opgenomen" niet "wordt beschreven"; geen "namelijk" in de doelgroep-zin; "onder de video" niet "onder of naast de video".
- Maximaal twee a drie voorbeelden met tijdstip. Geen lange opsomming.
- Check eerst of de speler een transcript-knop heeft (zie 1.1.1). Is die er, dan is er een geldig alternatief.

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
