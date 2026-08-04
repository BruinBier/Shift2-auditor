# Shift2-beoordelingsregels SC 1.2.3

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_1_2_3.md` als ze elkaar tegenspreken.

## Deels zelf te onderzoeken, deels een vraag

Uit HTML of screenshot alleen is dit niet te bepalen, maar met een videoscan wél voor de helft.
Zie `Shift2_Werkwijze_Video.md` voor de methode.

**Wat je zelf vaststelt** door frames te scannen op YouTube: welke tekst er in beeld staat en op
welk tijdstip. Naambalkjes, locatie- en datumlabels, tekst-op-beeld. Dat zijn precies de
voorbeelden die in de bevinding moeten, in de vorm `MM:SS "tekst"`. Verzamel ze zelf; vraag er
niet naar.

**Wat je niet kunt vaststellen** is of die tekst ook wordt uitgesproken. Daarvoor moet je
luisteren.

**Vraag voor de onderzoeker** (met je eigen bevindingen erbij, zodat er alleen geluisterd hoeft
te worden):

> In de video 'X' op [pagina] staat op 00:09 "Suzanne Klaassen, Wethouder Beverwijk" in beeld en
> op 00:43 "Jeroen Brakenhoff, Brakenhoff Transport". Worden deze namen en functies ook
> uitgesproken?

Wordt het uitgesproken, dan is er geen bevinding. Zo niet, dan schrijf je de bevinding met de
tijdstippen die je al hebt. Zolang het antwoord ontbreekt: `niet_te_bepalen` met deze vraag in
`reden`, nooit stilzwijgend op `voldoet`.

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
