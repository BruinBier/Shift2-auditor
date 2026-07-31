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

## Scope per sample

`Shift2_Scope_Per_Sample.md` bepaalt welk **deel van de pagina** je überhaupt beoordeelt.
Kort: op de homepage header, main en footer; op elk ander sample alleen de main-content.
Lees dat bestand voordat je aan een criterium begint, anders rapporteer je sitebrede
problemen bij elk sample opnieuw.

## Schrijfregels

`Shift2_Schrijfregels.md` geldt voor **elke** bevinding, ongeacht het criterium: structuur
van de description, toon, terminologie, en wat je juist niet doet (geen URL aan het begin,
geen gedachtestreepjes, geen codeblokken). Lees dat bestand één keer voor je begint.

Bij tegenspraak wint het SC-bestand, want dat is specifieker.

## Interactieve criteria

Sommige criteria zijn niet uit HTML of een screenshot te bepalen en vereisen een test
in de browser. Die bestanden beginnen met een blok "Niet uit HTML of screenshot te
bepalen" en bevatten de vraag die de onderzoeker moet beantwoorden.

Op dit moment: **1.2.3 · 1.2.5 · 1.4.3 · 1.4.10 · 1.4.11 · 2.1.2**

De workflow `.claude/workflows/audit-samples.js` zet deze criteria automatisch op
`niet_te_bepalen` en bundelt de vragen aan het eind van het rapport.

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
| 1.2.3 | `Shift2_Regels_SC_1_2_3.md` | ja |
| 1.2.5 | `Shift2_Regels_SC_1_2_5.md` | ja |
| 1.3.1 | `Shift2_Regels_SC_1_3_1.md` | |
| 1.3.2 | `Shift2_Regels_SC_1_3_2.md` | |
| 1.3.3 | `Shift2_Regels_SC_1_3_3.md` | |
| 1.3.5 | `Shift2_Regels_SC_1_3_5.md` | |
| 1.4.3 | `Shift2_Regels_SC_1_4_3.md` | ja |
| 1.4.5 | `Shift2_Regels_SC_1_4_5.md` | |
| 1.4.10 | `Shift2_Regels_SC_1_4_10.md` | ja |
| 1.4.11 | `Shift2_Regels_SC_1_4_11.md` | ja |
| 2.1.2 | `Shift2_Regels_SC_2_1_2.md` | ja |
| 2.4.4 | `Shift2_Regels_SC_2_4_4.md` | |
| 2.4.6 | `Shift2_Regels_SC_2_4_6.md` | |
| 4.1.2 | `Shift2_Regels_SC_4_1_2.md` | |
