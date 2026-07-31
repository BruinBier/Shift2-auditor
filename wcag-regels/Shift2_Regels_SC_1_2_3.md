# Shift2-beoordelingsregels SC 1.2.3

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_1_2_3.md` als ze elkaar tegenspreken.

## Niet uit HTML of screenshot te bepalen

Dit criterium vereist een test in de browser. Zet het altijd op `niet_te_bepalen`
(of `niet_aanwezig` als het aantoonbaar niet van toepassing is) en noteer de vraag in `reden`.

**Vraag voor de onderzoeker:**

> Bevatten de videos op [pagina] visuele informatie die niet hoorbaar wordt genoemd (naam-in-beeld, locatie-labels, lower thirds)? En is er ruimte in het audiospoor voor audiodescriptie?

## Regels

- Video met visuele informatie die niet hoorbaar wordt overgebracht (naam-in-beeld, lower thirds, locatie-labels, logos): rapporteer als TWEE aparte bevindingen, een onder 1.2.3 (niveau A) en een onder 1.2.5 (niveau AA). Beide impact matig, responsibility redacteur.
- Gebruik de vaste QuickFinding-tekst ed3a4d2a-ce67-4474-88a0-edba1c124624. Beschrijving: "Op de pagina staat de video 'X'. In deze video komt visuele informatie voor die niet beschikbaar is voor mensen die blind of slechtziend zijn." Daarna "Voorbeelden:" met bullets in de vorm MM:SS "tekst in beeld".
- Het advies bij 1.2.3 is VASTE standaardtekst uit de QuickFinding. Niet zelf herformuleren of "verbeteren", ook niet als de tekst feitelijk onjuist lijkt.
- Woordkeuze die vastligt: "beschrijft" niet "vertelt"; "is opgenomen" niet "wordt beschreven"; geen "namelijk" in de doelgroep-zin; "onder de video" niet "onder of naast de video".
- Maximaal twee a drie voorbeelden met tijdstip. Geen lange opsomming.
- Check eerst of de speler een transcript-knop heeft (zie 1.1.1). Is die er, dan is er een geldig alternatief.
