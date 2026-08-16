# Shift2-beoordelingsregels SC 4.1.2

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_4_1_2.md` als ze elkaar tegenspreken.

## Schakelknop in de toegankelijkheidsbalk: technisch issue, geen bevinding

Een aan/uit-knop in de SIMsite-toegankelijkheidsbalk (zoals 'Contrast verhogen') zonder
`aria-pressed` is templatecode van de leverancier, niet iets wat de gemeente kan oplossen.

Meld dit als **technisch issue** voor de leverancier en maak er **geen 4.1.2-bevinding** van
in het project. De gemeente kan er niets mee, en het hoort niet in hun rapport thuis.

Vastgelegd door Frits op 2026-07-27 naar aanleiding van duurzaam.beverwijk.nl. Het technische
issue staat onder "SIMsite: knop 'Contrast verhogen' in toegankelijkheidsbalk geeft toestand
niet door".

Let op het verschil met het SIMsite-galerijpatroon: daar wordt het CMS-gedrag wél als
technisch issue gemeld én als bevinding gerapporteerd, omdat de redacteur daar zelf iets aan
kan doen (bijschrift aanpassen). Bij pure templatecode zonder redactionele ingang vervalt de
bevinding.

## Altijd actief checken: de logo-link boven aan de pagina

Het logo in de header is vrijwel altijd een link naar de homepage. Loop na of die link een
toegankelijke naam heeft. Bepaal die naam in deze volgorde:

1. `aria-label` op de `<a>` — dan is dát de naam
2. Anders: alle tekst binnen de `<a>`, waarbij alles met `aria-hidden="true"` wegvalt.
   Het tekstalternatief (`alt`) van een `<img>` in de link telt hierin mee als tekst.
3. `title` telt alleen mee als er verder geen enkele naam is

Let op een visueel verborgen span (`sr-only`, `visually-hidden`). Die telt WEL mee als naam,
ook al zie je op de screenshot alleen het logo. Beoordeel dit uit de HTML, niet uit de
screenshot.

Bevat de link alleen een `<img>` met `alt=""` en verder geen tekst of `aria-label`, dan is
dat een **afkeuring** (matig, ontwikkelaar). Een `alt` die alleen een bestandsnaam bevat
("logo.png") telt niet als bruikbare naam.

### Een naam die alleen uit `title` komt is ONVOLDOENDE

Komt de toegankelijke naam uitsluitend uit een `title` op de link (dus: leeg `alt`, geen
tekst, geen `aria-label`), dan is dat nog steeds een **afkeuring**. Formeel berekent de
browser er een naam uit, maar daar mag je niet op afgaan:

- `title` verschijnt alleen bij aanwijzen met de muis, niet bij toetsenbordfocus
- op touchscreens is hij vrijwel onbereikbaar
- schermlezers ondersteunen hem wisselend en zetten hem soms standaard uit

Concludeer dus NIET "de link heeft een naam, dus geen bevinding" zodra je een `title` ziet.
Schrijf de bevinding ook niet als "deze link heeft geen naam", want dan is hij aanvechtbaar
zodra iemand op de `title` wijst. Benoem in plaats daarvan dat de naam alleen uit het
title-attribuut komt en waarom dat een deel van de gebruikers niet bereikt.

Aanleiding: heuvelrug.nl (2026-08-02). De logo-link had `title="Ga naar de homepage"` met
`alt=""` op de afbeelding. Claude concludeerde eerst dat de bevinding verviel omdat er
formeel een naam was; Frits wees erop dat `title` onvoldoende betrouwbaar is.

### Vaste formulering (UTHEU-01, 2026-08-03)

Description:

> Boven aan de pagina staat het logo, dat als link naar de homepage werkt. Omdat de afbeelding
> een lege alt-tekst heeft, heeft de link geen 'toegankelijke naam'. Wie de website met een
> schermlezer gebruikt, hoort niet waar deze link naartoe gaat. In de code is alleen bij de
> link zelf aangegeven dat die naar de homepage gaat.

Advies:

> Voorzie de afbeelding van een alt-tekst met de naam van de organisatie, bijvoorbeeld
> 'Gemeente X'.

Let op de details die Frits hierin heeft aangescherpt:
- **Alleen de organisatienaam in het advies.** Wereldwijd is de afspraak dat de alt-tekst van
  een logo-link naar de homepage alleen de naam van de organisatie bevat; de bestemming is
  daarmee impliciet duidelijk. Schrijf dus NIET "Gemeente X, naar de homepage". Zet die
  onderbouwing ook niet in de bevinding zelf.
  Uitzondering: op een SUBSITE (duurzaam., open., mijn.) hoort de bestemming er wél bij, want
  daar leidt het logo niet naar de hoofdsite. Zie `Shift2_Regels_SC_1_1_1.md`.
- **"toegankelijke naam"** tussen aanhalingstekens, zonder de Engelse term "Accessible Name"
  erachter.
- **Het title-attribuut zijdelings noemen**, niet als hoofdonderwerp. Schrijf "In de code is
  alleen bij de link zelf aangegeven dat die naar de homepage gaat" — geen attribuutnaam, en
  geen uitleg over hoe betrouwbaar een title is.
- **Niet schrijven dat een title verschijnt bij aanwijzen met de muis.** Dat gedrag verschilt
  per browser en werkt niet op een touchscreen.
- **Niet "de link bevat geen tekst"** als er een afbeelding in staat; de lege alt-tekst is de
  oorzaak.
- Gevolg formuleren vanuit de gebruiker ("hoort niet waar deze link naartoe gaat"), niet als
  "hulpsoftware kan de link niet identificeren".

## 4.1.2 naast 1.1.1 — losse bevindingen, geen onderlinge verwijzing

Een logo-link met leeg tekstalternatief raakt zowel 1.1.1 als 4.1.2. Dat zijn **twee
verschillende issues** met een gedeelde oorzaak:

- **1.1.1** — de afbeelding brengt zijn informatie niet over (de organisatienaam staat in
  het logo en nergens anders als gewone tekst)
- **4.1.2** — de link heeft geen naam, dus hulpsoftware kan hem niet aankondigen

Schrijf beide bevindingen volledig zelfstandig. Zet er **geen verwijzing naar het andere
criterium** in ("Dit issue valt ook onder 1.1.1..."): dat maakt de ene bevinding
ondergeschikt aan de andere en zet bovendien een SC-code in de tekst, wat tegen de
schrijfregels ingaat.

Aanleiding: heuvelrug.nl (2026-08-02), logo-link met `<img class="logo-img" alt="">`. De
auditor schreef 1.1.1 en 4.1.2 correct als aparte bevindingen, maar sloot 4.1.2 af met "Dit
issue valt ook onder succescriterium 1.1.1". Frits wees erop dat het twee losse issues zijn.

## Niet-getagde PDF: 4.1.2 vervalt

Bij een PDF zonder tags zet je 4.1.2 op `niet_te_bepalen`. Rapporteer het niet als losse fout:
de wortel-oorzaak is dat de tagstructuur ontbreekt, en die is al afgekeurd onder 1.3.1.

4.1.2 gaat over naam, rol en waarde in de **code**. Zonder tags is er geen structuur waarin die
kunnen zitten, dus valt er over een afzonderlijk element geen zelfstandig oordeel te vellen.

### Beperkte uitzondering: écht invulbare formuliervelden

Alleen bij een **invulbaar formulier** (`/AcroForm` met invulvelden, keuzerondjes of
selectievakjes) is 4.1.2 zonder tags te beoordelen. Zulke velden moet de gebruiker zelf
bedienen, en de toegankelijke naam zit dan in de tooltip `/TU`, niet in de interne veldnaam `/T`.

**Ga niet af op de techniek maar op de functie.** Een knop die als link werkt, blijft een link,
ook als de bouwer hem toevallig als AcroForm-pushbutton (`/FT /Btn` met `/Ff 65536`) heeft
opgeslagen in plaats van als Link-annotatie. Zo'n knop valt gewoon onder de vervalregel
hierboven; hoe hij intern is opgeslagen, hoort de beoordeling niet te veranderen.

Wat je bij zo'n knop **wel** beoordeelt is 2.4.4: het zichtbare opschrift, mits de knop
daadwerkelijk klikbaar is. Zie `Shift2_Regels_SC_1_3_1.md` voor de volledige lijst.

Vastgelegd door Frits op 2026-08-04 bij BEV-03. Claude zette 4.1.2 eerst op `niet_te_bepalen`,
draaide dat terug toen bleek dat de acht knoppen AcroForm-pushbuttons zonder `/TU` waren, en
Frits corrigeerde dat opnieuw: er zijn geen tags, en het zijn links, geen invulvelden.

## Regels

- Focus verschilt van 2.4.4: 4.1.2 gaat erover dat hulpsoftware een interactief element kan herkennen (naam, rol, waarde), 2.4.4 gaat erover of de gebruiker het linkdoel begrijpt.
- Link met wel tekst maar niet-beschrijvend ("klik hier", "lees meer"): dat is ALLEEN 2.4.4, niet 4.1.2, want de link heeft wel een naam.
- Link, knop of formulierveld zonder enige naam: wel 4.1.2. Bij een afbeelding-link zonder alt gelden 2.4.4 en 4.1.2 allebei, als twee aparte bevindingen.
- Schrijf dat de link of knop GEEN naam heeft, niet "geen duidelijke naam". Niet beweren dat de schermlezer het webadres voorleest.
