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

## Regels

- Link in een eigen <p> of <li> krijgt GEEN programmatische context van een kop of alinea die erboven staat maar niet in hetzelfde element zit. "Lees meer..." in een eigen <p> is dus een AFKEURING, ook al oogt de kaart visueel als een geheel. Niet wegredeneren met "de kop staat er wel bij". QuickFinding d7494b0a-a187-4930-bef7-05083ff5705d.
- Advies bij generieke linktekst: 1) maak de linktekst specifiek ("Lees meer over Fysieke overlegtafel"), OF 2) plaats de link in dezelfde alinea als de beschrijvende tekst. NOOIT adviseren om de hele kaart of container klikbaar te maken.
- Telefoonnummer of e-mailadres als linktekst: GEEN bevinding, ongeacht het voorwoord ("Telefoon:", "Bel:", "Mail:") en ongeacht waar de href heen wijst (tel:, mailto:, whatsapp, sms:, leeg of kapot). Niet voorleggen als concept en ook niet als opmerking, gewoon overslaan. Een kapotte href is een functioneel issue, geen WCAG-issue.
- X/Twitter-mismatch in de footer (X-logo zichtbaar, toegankelijke naam zegt nog "Twitter"): OPMERKING onder 2.4.4, status resolved, impact en responsibility leeg. Niet onder 2.5.3 (vereist zichtbare tekst) en niet onder 1.1.1. Een keer plaatsen, op het homepage-sample.
- Link zonder enige toegankelijke naam (afbeelding-link met leeg alt): zowel 2.4.4 als 4.1.2 afkeuren, twee aparte bevindingen. Framing 2.4.4: "weten niet waar de link heen gaat". Framing 4.1.2: "hulpsoftware kan de link niet goed aankondigen". Noem in elk dat het issue ook onder het andere criterium valt.
- Formuleer vanuit voorlezen en horen: hulpsoftware LEEST VOOR, het "laat niets zien".
