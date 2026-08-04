# Shift2-beoordelingsregels SC 2.4.4

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_2_4_4.md` als ze elkaar tegenspreken.

## Altijd actief checken: sociale-media-links in de footer

Loop bij 2.4.4 op de homepage de sociale-media-links in de footer na. Je beoordeelt de
**toegankelijke naam**: de tekst die een schermlezer voorleest. Ga daarvoor niet af op het
icoon dat je op de screenshot ziet; dat zegt niets over wat er wordt voorgelezen.

### Stap 1 — bepaal de toegankelijke naam

Pak de volledige `<a>` uit de HTML en loop deze volgorde af:

1. Staat er een `aria-label` op de `<a>`? Dan is dát de naam. De rest wordt genegeerd.
2. Zo niet: alle tekst binnen de `<a>`, waarbij alles met `aria-hidden="true"` WEGVALT.
   Het icoon staat vrijwel altijd op `aria-hidden`, dus meestal blijft één tekstspan over.
3. `title` telt alleen mee als er verder geen enkele naam is.

Let op bij stap 3: een naam die **uitsluitend** uit `title` komt is ONVOLDOENDE en blijft een
afkeuring. `title` verschijnt alleen bij aanwijzen met de muis, is op touchscreens vrijwel
onbereikbaar en wordt wisselend door schermlezers ondersteund. Concludeer dus niet "er is een
naam, dus geen bevinding" zodra je een `title` ziet. Zie `Shift2_Regels_SC_4_1_2.md` voor de
volledige regel en de formulering.

Let op een visueel verborgen span (`position:absolute;left:-9999px`, `sr-only`, `visually-hidden`).
Die telt WEL mee als naam, ook al zie je op de screenshot alleen een icoon. Dat kun je alleen
in de HTML zien.

Voorbeeld van het typische patroon:

```
<a href="https://www.facebook.com/gemeentebeverwijk">
  <span class="fa-facebook" role="img" aria-hidden="true"></span>   ← telt NIET mee
  <span class="socialLinkText">Facebook</span>                      ← de naam
</a>
```

Toegankelijke naam = "Facebook". Een schermlezer leest voor: "link, Facebook".

### Stap 2 — weeg de naam tegen de href

| Situatie | Oordeel |
|---|---|
| Naam is alleen de platformnaam ("Facebook", "Instagram", "LinkedIn", "YouTube") terwijl de href naar een specifieke organisatiepagina gaat | **AFKEURING** (klein, redacteur) |
| Naam noemt de organisatie ("Facebook-pagina gemeente X", "Gemeente X op LinkedIn") | in orde, geen bevinding |
| Naam klopt niet meer met het doel (naam zegt "Twitter", href gaat naar x.com) | **opmerking**, zie de X/Twitter-regel hieronder |
| Helemaal geen naam (alleen een `aria-hidden` icoon, geen tekstspan, geen aria-label) | **AFKEURING onder 2.4.4 én 4.1.2**, twee aparte bevindingen |

De kop erboven ("Blijf op de hoogte", "Volg ons") levert GEEN context: de link staat in een
eigen `<p>` en de kop zit niet in hetzelfde element. Bovendien zegt zo'n kop niet van wie de
pagina is. Niet wegredeneren met "de kop staat er wel bij".

Bij een afkeuring: gebruik QuickFinding `5b18790a-b634-4c99-8fee-d1c5d8952aea`
("Sociale-media-link zonder organisatie in linktekst"). Pas de kop en de platformnamen aan op
de werkelijke situatie.

Advies: vul de toegankelijke naam aan met de organisatie, bijvoorbeeld "Facebook-pagina
gemeente X" en "Instagram-pagina gemeente X".

Gebruik QuickFinding `5b18790a-b634-4c99-8fee-d1c5d8952aea` ("Sociale-media-link zonder
organisatie in linktekst"). Pas de kop en de platformnamen aan op de werkelijke situatie.

Advies: vul de toegankelijke naam aan met de organisatie, bijvoorbeeld "Facebook-pagina
gemeente X" en "Instagram-pagina gemeente X".

Let op: dit is een ANDERE bevinding dan 1.3.1 over dezelfde links. Die gaat erover dat ze
niet in een lijst staan; deze gaat over de linktekst. Beide kunnen tegelijk gelden op
dezelfde footerkolom. Zie ook de X/Twitter-regel hieronder, waar de naam niet meer klopt
met het doel; hier is de naam te summier voor het doel.

Aanleiding: duurzaam.beverwijk.nl (2026-07-27), footerkolom "Blijf op de hoogte" met
`<span>Facebook</span>` en `<span>Instagram</span>` als enige toegankelijke naam, links naar
facebook.com/gemeentebeverwijk en instagram.com/gemeentebeverwijk. De auditor gaf 2.4.4
"voldoet" en miste dit; Frits wees erop.

## Niet-getagde PDF: 2.4.4 WEL beoordelen

Beoordeel 2.4.4 ook bij een niet-getagd document. Dit criterium gaat over de **tekst** van de
link, en die staat er ook zonder tags. Kijk naar de pagina: zie je een link of een webadres in
de lopende tekst, lees dan of die tekst duidelijk maakt waar hij heen leidt. Een "klik hier"
of "lees meer" zonder context is ook in een PDF een afkeuring.

Wat je hier NIET beoordeelt: dat de link niet klikbaar is. Dat webadressen als platte tekst in
het document staan zonder werkende link, is een gevolg van de ontbrekende tagstructuur en
wordt al onder 1.3.1 afgekeurd. Maak daar geen aparte 2.4.4-bevinding van.

Geef dus een echt oordeel (voldoet of afkeuring op de linktekst); zet 2.4.4 niet op
`niet_te_bepalen` met "geen tags" als reden.

Vastgelegd door Frits op 2026-08-02 bij UTHEU-01. Eerst stond 2.4.4 in de vervallijst voor
ongetagde PDF's; Frits corrigeerde dat: de linktekst is visueel te toetsen, alleen de
klikbaarheid niet.

## Regels

- Link in een eigen <p> of <li> krijgt GEEN programmatische context van een kop of alinea die erboven staat maar niet in hetzelfde element zit. "Lees meer..." in een eigen <p> is dus een AFKEURING, ook al oogt de kaart visueel als een geheel. Niet wegredeneren met "de kop staat er wel bij". QuickFinding d7494b0a-a187-4930-bef7-05083ff5705d.
- Advies bij generieke linktekst: 1) maak de linktekst specifiek ("Lees meer over Fysieke overlegtafel"), OF 2) plaats de link in dezelfde alinea als de beschrijvende tekst. NOOIT adviseren om de hele kaart of container klikbaar te maken.
- **Telefoonnummer of e-mailadres als linktekst.** Een geformatteerd telefoonnummer als linktekst is geen bevinding onder 2.4.4 als de link **bedoeld is om te bellen**, ook niet bij een technisch ontbrekende of defecte `tel:`-koppeling. Echter, als de link verwijst naar een **volledig andere bestemming** (zoals een webpagina of een document), is er wél sprake van een bevinding onder 2.4.4, omdat de linktekst het daadwerkelijke doel onjuist voorspelt.
  Hetzelfde geldt voor een e-mailadres als linktekst. Het voorwoord doet niet ter zake ("Telefoon:", "Bel:", "Mail:").
  Let op waar het scharnier zit: bij de **bedoeling**, niet bij de techniek. Een `tel:`-link met een verkeerd nummer erin is nog steeds bedoeld om te bellen en dus geen 2.4.4-bevinding; dat is een functioneel issue. Een linktekst met een telefoonnummer die een webpagina opent, is dat wel: wie erop klikt verwacht te bellen en belandt ergens anders. Wie de linklijst van een schermlezer doorloopt of op een telefoon snel wil bellen, krijgt een compleet onverwachte uitkomst.
  Bij zo'n afkeuring: impact matig, responsibility redacteur.
  Voorbeeld: BEV-04 B004, open.beverwijk.nl, waar de linktekst "0251 256 256" een href naar `https://www.beverwijk.nl` heeft. Formulering vastgelegd door Frits op 2026-08-04, nadat de audit deze bevinding ten onrechte liet vallen met een beroep op de oude, te ruime regel ("ongeacht waar de href heen wijst").
- X/Twitter-mismatch in de footer (X-logo zichtbaar, toegankelijke naam zegt nog "Twitter"): OPMERKING onder 2.4.4, status resolved, impact en responsibility leeg. Niet onder 2.5.3 (vereist zichtbare tekst) en niet onder 1.1.1. Een keer plaatsen, op het homepage-sample.
- Link zonder enige toegankelijke naam (afbeelding-link met leeg alt): zowel 2.4.4 als 4.1.2 afkeuren, twee aparte bevindingen. Framing 2.4.4: "weten niet waar de link heen gaat". Framing 4.1.2: "hulpsoftware kan de link niet goed aankondigen". Schrijf beide bevindingen volledig zelfstandig en verwijs in de tekst NIET naar het andere criterium: het zijn losse issues, en een SC-code hoort niet in een bevindingstekst.
- Formuleer vanuit voorlezen en horen: hulpsoftware LEEST VOOR, het "laat niets zien".
