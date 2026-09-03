# Dekkingslijst voor het samenstellen van een steekproef

Deze lijst is het stopcriterium bij het samenstellen van een steekproef. Niet het
aantal pagina's bepaalt wanneer je klaar bent, maar de dekking: doorgaan tot elk
gebied uit groep 2 dat de site heeft, minstens één keer voorkomt.

Een pagina met een tabel, een galerij, een video en een PDF-link dekt vier
gebieden tegelijk. Dan is de steekproef korter. Dat is de bedoeling.

## Waarom twee groepen

**Groep 1 komt op elke pagina voor.** Koppen, links, tekstcontrast — die zijn
altijd gedekt, dus ze sturen de keuze van pagina's niet. Ze staan hier zodat
duidelijk is dat het geen vergetelheid is: ze worden wel degelijk beoordeeld,
maar ze zijn nooit een reden om een pagina aan de steekproef toe te voegen.

**Groep 2 is wat je moet zoeken.** Hier draait de dekking om. Een gebied dat de
site niet heeft, hoeft niet gedekt te worden -- maar dát het er niet is, hoort in
het voorstel te staan. "Geen tabellen gevonden" is informatie; een lijst die
stilzwijgend korter is, niet.

## Waar deze lijst vandaan komt

Uit de regelbestanden zelf. De deelgebieden van 1.1.1, 1.2.1, 1.2.2, 1.3.1,
1.4.3 en 2.4.4 staan er rechtstreeks in; voor de criteria zonder deelgebieden is
per regelbestand nagegaan welke inhoud op de pagina moet staan om het criterium
te kunnen beoordelen.

Komt er een deelgebied bij in een regelbestand, dan hoort het hier ook. Andersom
geldt hetzelfde: wat hier staat en nog geen deelgebied is, is een kandidaat.

---

## Groep 1 — Altijd aanwezig

Geen stopcriterium. Wordt beoordeeld, maar stuurt de paginakeuze niet.

- Koppen en koppenstructuur
- Alinea's en lopende tekst
- Nadruk: vet en cursief
- Links in lopende tekst
- Tekstcontrast
- Focusindicator
- Klikbare gebieden van 24 bij 24
- Leesvolgorde: code tegenover beeld
- Herhaalde sjabloononderdelen: header, footer, navigatie
- Cookiescherm of toestemmingsvenster
- De hoogcontrastknop en zijn weergave

---

## Groep 2 — Moet je zoeken

### Beeld

1. Logo
2. Hero- of headerafbeelding zonder tekst
3. Hero met tekst erin gebrand — 1.4.5
4. Hero met tekst eroverheen — 1.4.3, contrast op de beeldpunten
5. Teaser- of kaartafbeeldingen in een overzicht
6. Afbeelding in een link of knop (behalve het logo)
7. Iconen zonder tekst ernaast
8. Complex beeld: schema, organogram, infographic
9. Kaart of plattegrond als afbeelding, met legenda
10. Afbeelding met een onderschrift, of in een `figure`
11. Foto in de lopende tekst
12. Fotogalerij
13. Poster of aankondiging
14. Afbeelding met tekst erin — 1.4.5
15. Grafiek of diagram met een legenda — 1.4.1 en 1.4.11

### Structuur

16. Tabel
17. Lijst, en geneste lijst
18. Citaat
19. Anderstalig tekstfragment — 3.1.2
20. Anderstalige pagina — 3.1.1

### Media

21. Video met geluid — twee stuks, onderling verschillend
22. Video zonder geluid, of een animerende GIF
23. Audio of podcast
24. Live uitzending: raadsvergadering, webcam — 1.2.4

### Interactie

25. Accordeon of tabbladen
26. Formulier — telt als één gebied, ongeacht het aantal stappen
27. Iets dat uit zichzelf beweegt: slider, teller, animatie — 2.2.2
28. Pagina met een eigen sjabloon: portaal, boekingsmodule — 3.2.4
29. Kaart in een iframe
30. Ander kader van een ander domein

### Documenten

31. PDF — twee stuks, verschillend van soort
32. Invulbaar PDF-formulier — 4.1.2

---

## Wat er niet in staat, en waarom

**De zoekfunctie en zijn suggestielijst.** Hoort bij het deelonderzoek techniek,
niet bij content. Dat sluit aan op de scoperegel bij 2.1.2, waar hoofdmenu en
hoofdnavigatie bij een deelonderzoek content ook buiten beschouwing blijven.

**De hoogcontrastknop staat in groep 1, niet buiten het onderzoek.** Dat is een
verschil met de voorleesknoppen hieronder. Hij wordt wél beoordeeld -- 1.4.3 heeft
er een eigen deelgebied voor, en is er een knop die voldoet, dan is die weergave
de weergave die telt (`get-pixelcontrast --klik`). Maar hij staat op élke pagina
van de site, dus hij is nooit een reden om er een toe te voegen.

**Voorleesknoppen en tekstvereenvoudiging.** "Lees voor", "Eenvoudige tekst" en
wat er verder in de toegankelijkheidsbalk zit, blijven buiten een deelonderzoek
content. Het is voorziening van de leverancier, niet iets wat de redacteur maakt
of kan herstellen -- dezelfde reden waarom een schakelknop in de
SIMsite-toegankelijkheidsbalk onder 4.1.2 geen bevinding oplevert. Ze staan op
élke pagina, dus als ze wél zouden meetellen was het bovendien geen reden om een
pagina toe te voegen.

## De twee harde eisen

Twee gebieden vragen om precies twee exemplaren, en ze moeten van elkaar
verschillen -- twee identieke gevallen leveren één bevinding op die je twee keer
opschrijft.

**Video (21): twee stuks.** Verschillend betekent een andere speler, of een
andere ondertitelsituatie. Dat is meetbaar met `get-videosporen` vóór de keuze.
Staan er twee video's op één pagina, dan is die ene pagina genoeg.

**PDF (31): twee stuks.** Verschillend van soort: een formulier tegenover een
beleidsnota, een folder tegenover een raadsstuk. Of een PDF getagd is, blijkt pas
na openen en is dus geen selectiecriterium.

Heeft de site er minder, dan is dat een feit over de site en hoort het in het
voorstel te staan.
