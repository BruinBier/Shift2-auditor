# Shift2-beoordelingsregels per succescriterium

Vastgelegde Shift2-voorkeuren per WCAG-succescriterium: wanneer iets een afkeuring is,
wanneer een opmerking, en wanneer juist géén bevinding. Opgebouwd uit correcties die
tijdens eerdere audits zijn gegeven.

## Verschil met `wcag-checklists/`

| | `wcag-checklists/` | `wcag-regels/` (hier) |
|---|---|---|
| Inhoud | Hóe je een criterium technisch toetst: definitie, beslisboom, auditgebieden | Hóe Shift2 de randgevallen beoordeelt |
| Herkomst | WCAG-documentatie, uitgewerkt | Correcties uit echte audits |
| Bij tegenspraak | — | **Deze regels gaan vóór de checklist** |

## Leesvolgorde bij het beoordelen van een criterium

1. `wcag-checklists/Checklist_SC_<code>.md` — de toetsingsinstructie
2. `wcag-checklists/Richtlijnen_Grensgevallen_SC_<code>.md` — als die bestaat
3. `wcag-regels/Shift2_Regels_SC_<code>.md` — deze regels, doorslaggevend

## Waar de norm zelf nog in beweging is

Bij sommige criteria is de WCAG-tekst zelf onduidelijk en loopt daar een discussie over bij
het W3C. In die gevallen staat in het regelbestand een sectie "Waar de norm zelf nog
onduidelijk is" met het issuenummer erbij. Dat maakt zichtbaar dat onze regel een
onderbouwde **interpretatie** is en geen letterlijke norm.

Op dit moment vastgelegd:

| SC | W3C-issue | Waar het over gaat |
|---|---|---|
| 1.3.5 | [#5213](https://github.com/w3c/wcag/issues/5213) | Browser-autocomplete is een bijwerking, niet het doel. "De browser vult het toch wel in" is geen geldig argument. |
| 2.5.3 | [#5171](https://github.com/w3c/wcag/issues/5171) | Een slogan in een logo hoeft niet in de toegankelijke naam. F96 dekt dit geval niet. |
| 3.2.4 | [#5225](https://github.com/w3c/wcag/issues/5225) | Vijf onduidelijkheden: consistent versus identiek, geldt het binnen één pagina, wat is een "component". |

Bronnen om periodiek te raadplegen:
- [github.com/w3c/wcag/issues](https://github.com/w3c/wcag/issues) — hier staat waar de norm
  onduidelijk is. Het nuttigst bij een grensgeval.
- [github.com/w3c/wcag/commits/main/guidelines](https://github.com/w3c/wcag/commits/main/guidelines)
  — errata en tekstwijzigingen. Grotendeels redactioneel (terminologie, verwijzingen), dus
  zelden aanleiding om een regel aan te passen.

## Scope per sample

`Shift2_Scope_Per_Sample.md` bepaalt welk **deel van de pagina** je überhaupt beoordeelt.
Kort: op de homepage header, main en footer; op elk ander sample alleen de main-content.
Lees dat bestand voordat je aan een criterium begint, anders rapporteer je sitebrede
problemen bij elk sample opnieuw.

## Voldoet of niet aanwezig?

`Shift2_Voldoet_Of_Niet_Aanwezig.md` legt uit wanneer een criterium gehaald is en wanneer het
niet van toepassing is. Kern: kijk naar wat het criterium **eist**, niet naar wat er op de
pagina staat. 2.3.1 zegt "er mag niets flitsen" en daar houdt een statische pagina zich aan
(`voldoet`); 2.2.2 zegt "als er iets automatisch beweegt, moet je het kunnen pauzeren" en die
eis is zonder beweging leeg (`niet_aanwezig`).

Dat verschil gaat in beide richtingen mis. Lees het bestand één keer voor je begint.

## Schrijfregels

`Shift2_Schrijfregels.md` geldt voor **elke** bevinding, ongeacht het criterium: structuur
van de description, toon, terminologie, en wat je juist niet doet (geen URL aan het begin,
geen gedachtestreepjes, geen codeblokken). Lees dat bestand één keer voor je begint.

Bij tegenspraak wint het SC-bestand, want dat is specifieker.

## Video's

Staat er een video op de pagina, lees dan `Shift2_Werkwijze_Video.md`. Dat bestand beschrijft
het onderzoek dat aan 1.2.1 t/m 1.2.5 voorafgaat: scope bepalen, ondertiteling vaststellen en
frames scannen met `scripts/video-scan.mjs`.

De belangrijkste valkuil staat daar: naast **gesloten** ondertiteling, die je uit de speler kunt
uitlezen, bestaat er **open** ondertiteling die in het beeld gebrand zit en nergens in de API
staat. Alleen op de speler afgaan levert onterechte 1.2.2-bevindingen op.

## Criteria die een browsertest vereisen

Sommige criteria zijn niet uit de HTML of een screenshot alleen te bepalen. Ze zijn wél te
**meten** in de audit-sessie-Chrome; ga er dus niet standaard een vraag van maken:

| SC | Hoe je het meet |
|---|---|
| 1.4.3 · 1.4.11 | Pixelmeting op de hoogcontrastknop. Eén keer, op het homepage-sample: de knop staat in de header en is op elke pagina dezelfde. |
| 1.4.10 | Viewport op exact 320 CSS-pixels, `scrollWidth` vergelijken. |
| 2.1.2 | Tab versturen en `document.activeElement` uitlezen. |
| 2.2.2 | Acht seconden naar de pagina kijken en drie opnamen vergelijken; het venster dat telt begint drie seconden na het laden. |
| 2.3.1 | De beeldjes meelezen die de browser tekent en de helderheidssprongen tellen. Een video meet je niet op de pagina maar op zijn eigen adres: `get-flitsen https://www.youtube.com/watch?v=<nummer>`. Voor een videobestand blijft PEAT de autoriteit. |
| 2.4.4 | `get-links <url>` rekent per link de toegankelijke naam uit zoals een schermlezer die opbouwt. Een naam die alleen uit `title` komt is onvoldoende; een kop bóven de link geeft geen context. |
| 2.5.3 | `get-labelinnaam <url>` vergelijkt per bedieningselement de zichtbare tekst met de toegankelijke naam. Tekst die op nul bij nul rendert (font-size 0) telt niet als zichtbaar label. |
| 2.5.8 | `getBoundingClientRect` voor de afmeting van het doelgebied. |
| 1.2.3 · 1.2.5 | `get-videosporen <url>` leest per video de sporen uit. Bij YouTube uit de spelergegevens (inclusief of ondertiteling automatisch gegenereerd is), bij een eigen speler uit zijn bediening in de shadow DOM ("Zet ondertitels uit" = ze staan aan) plus de uitgeschreven tekst. Drie beeldjes voor de open ondertiteling. Of tekst-in-beeld ook gesproken wordt, blijft handwerk; zie `Shift2_Werkwijze_Video.md`. |

Deze metingen zijn ook zonder agent te starten: op de kaart in "Waar sta ik" staat onder "Zo
is het vastgesteld" wat er voor dat criterium te meten valt, met de knop **Meet dit nu**. Ook
op een kaart "Jij moet kijken" — staat daar een vraag die een meting kan beantwoorden, druk
dan eerst op de knop. De uitkomst komt onder het oordeel te staan; het oordeel zelf verandert
er niet van.

Lukt de meting niet, dan pas `niet_te_bepalen` met de concrete vraag **en** de reden waarom het
niet lukte. `INTERACTIEVE_SC` in de workflow is leeg: geen enkel criterium gaat nog automatisch
op `niet_te_bepalen` zonder onderzoek.

Wat wél altijd naar de onderzoeker gaat: **contrast in PDF-documenten** (1.4.3 en 1.4.11), dat
meet Frits handmatig.

## Open vraag of vaststelling?

`niet_te_bepalen` kent twee soorten, en dat verschil hoort uit `reden` te blijken:

- **Open vraag** — de onderzoeker kan het uitzoeken. Zet de concrete vraag erin, met alles wat
  je zelf al hebt vastgesteld, zodat er zo min mogelijk werk overblijft.
- **Vaststelling** — de uitkomst staat vast. Bij een ongetagde PDF vervallen 1.1.1, 1.3.2, 1.4.5
  en 2.4.4 zolang de tags ontbreken; daar valt niets uit te zoeken. Schrijf dan geen vraagzin,
  en zeker niet "is er een getagde versie beschikbaar?" — die is er niet, en dat is de bevinding.

## Onderhoud

- **Regels wijzigen** → pas het betreffende `Shift2_Regels_SC_<code>.md` aan. De auditor
  leest het bestand tijdens de run, dus een wijziging werkt direct door.
- **Nieuw criterium toevoegen** → maak `Shift2_Regels_SC_<code>.md` aan. De workflow
  verwijst de auditor automatisch naar het bestand zodra het bestaat.
- **Interactief-status wijzigen** → dat staat óók in `sc-manifest.js`, omdat de workflow
  die vlag nodig heeft vóór de agents draaien. Pas beide aan.

## Bestanden

| SC | Bestand | Interactief |
|---|---|---|
| 1.1.1 | `Shift2_Regels_SC_1_1_1.md` | |
| 1.2.1 | `Shift2_Regels_SC_1_2_1.md` | |
| 1.2.2 | `Shift2_Regels_SC_1_2_2.md` | |
| 1.2.3 | `Shift2_Regels_SC_1_2_3.md` | deels |
| 1.2.4 | `Shift2_Regels_SC_1_2_4.md` | |
| 1.2.5 | `Shift2_Regels_SC_1_2_5.md` | deels |
| 1.3.1 | `Shift2_Regels_SC_1_3_1.md` | |
| 1.3.2 | `Shift2_Regels_SC_1_3_2.md` | |
| 1.3.3 | `Shift2_Regels_SC_1_3_3.md` | |
| 1.3.5 | `Shift2_Regels_SC_1_3_5.md` | |
| 1.4.1 | `Shift2_Regels_SC_1_4_1.md` | |
| 1.4.3 | `Shift2_Regels_SC_1_4_3.md` | ja |
| 1.4.5 | `Shift2_Regels_SC_1_4_5.md` | |
| 1.4.10 | `Shift2_Regels_SC_1_4_10.md` | ja |
| 1.4.11 | `Shift2_Regels_SC_1_4_11.md` | ja |
| 2.1.2 | `Shift2_Regels_SC_2_1_2.md` | ja |
| 2.1.4 | `Shift2_Regels_SC_2_1_4.md` | ja |
| 2.2.2 | `Shift2_Regels_SC_2_2_2.md` | ja |
| 2.4.4 | `Shift2_Regels_SC_2_4_4.md` | |
| 2.4.6 | `Shift2_Regels_SC_2_4_6.md` | |
| 4.1.2 | `Shift2_Regels_SC_4_1_2.md` | |
