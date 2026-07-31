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

## Regels

- Focus verschilt van 2.4.4: 4.1.2 gaat erover dat hulpsoftware een interactief element kan herkennen (naam, rol, waarde), 2.4.4 gaat erover of de gebruiker het linkdoel begrijpt.
- Link met wel tekst maar niet-beschrijvend ("klik hier", "lees meer"): dat is ALLEEN 2.4.4, niet 4.1.2, want de link heeft wel een naam.
- Link, knop of formulierveld zonder enige naam: wel 4.1.2. Bij een afbeelding-link zonder alt gelden 2.4.4 en 4.1.2 allebei, als twee aparte bevindingen.
- Schrijf dat de link of knop GEEN naam heeft, niet "geen duidelijke naam". Niet beweren dat de schermlezer het webadres voorleest.
