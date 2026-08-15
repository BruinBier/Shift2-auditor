# Shift2-beoordelingsregels SC 3.3.2

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_3_3_2.md` als ze elkaar tegenspreken.

## 3.3.2 gaat over wat er staat, niet over hoe het gekoppeld is

Beoordeel of er een label of instructie **aanwezig** is bij een invoerveld, en of die de
gebruiker vertelt wat er wordt gevraagd. Dit is een oordeel over de inhoud die iemand ziet
en leest.

De programmatische koppeling — `for`, `aria-labelledby`, `aria-describedby` — hoort bij
**1.3.1** (Info en relaties). Die koppeling is **geen bewijs voor 3.3.2** en hoort niet in
de onderbouwing van dit criterium thuis.

### Waarom dit onderscheid ertoe doet

De twee criteria kunnen los van elkaar slagen en zakken:

- `<label for="f1">Veld 1</label>` — perfect gekoppeld, maar het label zegt niets.
  Voldoet aan 1.3.1, **niet** aan 3.3.2.
- Een duidelijk zichtbaar label "Uw postcode" dat niet aan het veld is gekoppeld.
  Voldoet aan 3.3.2, **niet** aan 1.3.1.

Wie de koppeling als bewijs voor 3.3.2 gebruikt, kan op beide criteria het verkeerde
antwoord geven — en dat valt niet op, want er staat een geloofwaardige zin.

### Wat je bij 3.3.2 wél beoordeelt

- Heeft elk invoerveld een zichtbaar label of een instructie?
- Zegt dat label wat er wordt gevraagd? "Veld 1", "Tekst" of alleen een sterretje is niet genoeg.
- Staat er uitleg waar het formaat niet vanzelf spreekt (datumnotatie, postcode, verplichte velden)?
- Is duidelijk welke velden verplicht zijn, en staat die uitleg vóór de velden?
- Verdwijnt de enige aanduiding zodra er iets is ingevuld? Een tijdelijke aanduiding in het
  veld zelf (`placeholder`) als enig label is een afkeuring: zodra de bezoeker typt, is niet
  meer te zien wat er werd gevraagd.

### Wat je NIET bij 3.3.2 beoordeelt

- `for`, `id`, `aria-labelledby`, `aria-describedby` → 1.3.1
- `autocomplete` op naam-, adres- en contactvelden → 1.3.5
- De foutmelding die verschijnt ná een verkeerde invoer → 3.3.1 en 3.3.3

Vastgelegd door Frits op 2026-08-15, naar aanleiding van heuvelrug.nl. Daar onderbouwde de
auditor 3.3.2 op twee pagina's met "een zichtbaar label met een for-koppeling" — het bewijs
van 1.3.1, gebruikt voor het verkeerde criterium.
