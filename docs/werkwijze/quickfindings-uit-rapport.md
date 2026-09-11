# Werkwijze: de QuickFinding-bibliotheek vullen uit een rapport

De QuickFinding-bibliotheek (`/admin/snelle-bevindingen`, model `QuickFinding`) bevat
herbruikbare bevindingteksten: één keer goed geformuleerd, daarna in elk onderzoek te
gebruiken met `create-finding-from-quick`. De `audit-samples`-workflow toetst zijn vondsten
ook tegen deze lijst. Wat erin staat, komt dus in veel rapporten terecht; wat er slordig in
staat, komt slordig in veel rapporten terecht.

Dit bestand beschrijft hoe de bibliotheek wordt uitgebreid vanuit een bestaand rapport dat
de onderzoeker aanlevert: een Cardan-rapport, een PDF of een vergelijkbare auditbron.

## Wat je krijgt

- Het rapport, met bevindingen die voor één site zijn geschreven.
- Toegang tot de bestaande bibliotheek via de CLI en de API (dev-server moet draaien).

## Stappen

1. **Rapport doornemen** en alle bevindingen op een rij zetten.
2. **Filteren: alleen generieke patronen.** Sla over wat aan één site hangt: paginanamen,
   tijdstippen in een video, kleurcodes, een specifieke plattegrond, de naam van een
   organisatie. Houd wat op meer dan één site terugkomt.
3. **Duplicaten uitsluiten** in de bestaande bibliotheek:
   ```
   npm run cli -- search-quick-findings <trefwoord>
   ```
   Het commando neemt één trefwoord en zoekt daarop als tekstfragment, hoofdletterongevoelig,
   in titel, beschrijving, advies, criteriumcode en trefwoorden. Een zin tussen
   aanhalingstekens vindt alleen wat die zin letterlijk bevat. Probeer per kandidaat een paar
   losse woorden: de criteriumcode, het kernwoord uit de titel, de materie.
4. **Elk voorstel apart voorleggen**, nooit als lijst. Per kandidaat:
   - titel
   - criterium (code en naam)
   - status (bijna altijd "Afgekeurd", zie hieronder)
   - impact (klein, matig, serieus, kritiek)
   - verantwoordelijkheid (redacteur, ontwikkelaar, ontwerper)
   - beschrijving
   - advies
5. **Wachten op een uitdrukkelijk akkoord** voordat je aanmaakt. De onderzoeker past de
   formulering meestal eerst aan; reken op meer dan één correctieronde per voorstel.
6. **Aanmaken** met een POST, altijd met `charset=utf-8` en de tekst uit een bestand of
   heredoc, anders staan er vraagtekens op de é en de ë:
   ```bash
   curl -s -X POST http://localhost:3000/api/quick-findings \
     -H "Content-Type: application/json; charset=utf-8" \
     --data-binary @- <<'JSON'
   { "title": "...", "criterionCode": "1.3.1", "status": "open",
     "impact": "klein", "responsibility": "redacteur",
     "description": "...", "advice": "..." }
   JSON
   ```
7. **Bijwerken met PUT**, op `/api/quick-findings/<id>`. Er is geen PATCH: die geeft 405. En
   PUT schrijft alle velden opnieuw: `keywords`, `status`, `impact` en `responsibility` die je
   weglaat worden `null`, `crawler` wordt `false`. Stuur dus altijd het complete record mee.
   Een losse GET per id bestaat niet; haal het record uit de volledige lijst
   (`GET /api/quick-findings`) en stuur die terug met alleen de gewijzigde velden anders.
8. **Na het aanmaken**: het id melden, met de link naar
   `http://localhost:3000/admin/snelle-bevindingen` en de opmerking dat een open scherm
   pas na verversen (F5) de nieuwe regel toont.

## Status: wat de schermtekst betekent

De status van een QuickFinding is dezelfde waarde als die van een bevinding, niet die van
een criteriumoordeel. `"failed"` bestaat hier dus niet.

| In de database | Op het scherm | Betekenis |
|---|---|---|
| `open` | Afgekeurd | een gewone bevinding: het criterium zakt |
| `resolved` | Opmerking | geen afkeuring; impact en verantwoordelijkheid blijven leeg |
| `published` | | niet gebruiken voor nieuwe QuickFindings |

## Schrijfregels tijdens dit werk

`wcag-regels/Shift2_Schrijfregels.md` geldt onverkort. Wat bij dit werk het vaakst misgaat:

- **Geen technische termen.** Geen elementnamen (`th`, `ul`, `li`), geen "CSS", geen "DOM".
  Beschrijf wat de bezoeker merkt.
- **Het advies zegt alleen wat er moet gebeuren.** Geen uitleg, geen alternatieven met
  voorbehoud, geen "in de meeste CMS-systemen kan je via...". Bij meer dan één geldige
  oplossing: kort koppelen met "of".
- **Niets uit het bronrapport dat aan die ene site hangt.** Maak het algemeen toepasbaar.
- **Eén bevinding is één criterium.** Geen tweede criterium in dezelfde tekst.
- **Beschrijving in de vaste opbouw:** waar het staat, wat er mis is, wat de bezoeker
  daarvan merkt.
- **Hulpsoftware leest voor.** Schrijf auditief ("hoort"), niet visueel ("ziet").
- **Titel, beschrijving en advies blijven consistent.** Haal je een term uit de
  beschrijving, haal hem dan ook uit de titel en het advies.
- **Voorbeelden en termen die er alleen staan omdat ze in het bronrapport stonden, gaan weg.**

## Wat niet als QuickFinding in de bibliotheek hoort

Vastgesteld bij het verwerken van het BAR-rapport. Dit zijn patronen die aan een ingesloten
Google-formulier hangen of te smal zijn om herbruikbaar te zijn:

- een verzendknop met `aria-label` "Submit" in plaats van "Verzenden" (2.5.3)
- een Engels woord op een Nederlandse pagina zonder taalmarkering (3.1.2)
- de foutmelding "Dit is een vereiste vraag" die fouten één voor één toont (3.3.1)
- een bevestigingsveld voor het e-mailadres (3.3.7)

Komen ze in een audit voor, dan worden ze daar met de hand gerapporteerd.

## Verantwoordelijkheid bij twijfel

- Kan een redacteur het in het CMS oplossen: `redacteur`. Daaronder vallen ook een lege kop,
  tabelkoppen, een lijst die gesplitst moet worden en sociale-media-links in een kop.
- Zit het in het sjabloon of in vaste HTML: `ontwikkelaar`.
- Gaat het om kleur, contrast of visueel ontwerp: `ontwerper`.

Twijfel je, vraag het dan. Een verkeerde verantwoordelijkheid stuurt de bevinding in elk
volgend rapport naar de verkeerde persoon.

## Wat je niet doet

Een correctie op een bevinding in een lopend onderzoek is geen reden om de bibliotheek aan
te passen. Meld dat de QuickFinding mogelijk mee moet veranderen, en pas hem pas aan na een
uitdrukkelijk ja. Hetzelfde geldt voor bevindingen in andere onderzoeken.
