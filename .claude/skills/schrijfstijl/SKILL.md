---
name: schrijfstijl
description: Leren van de correcties die Frits op bevindingen maakte, of de schrijfstijl testen. Gebruik bij "leer van mijn correcties", "analyseer mijn correcties", "test de schrijfstijl" of "schrijfstijl testmodus". Analyseert per correctie of het een schrijf- of inhoudelijke correctie is en of er een schrijfregel uit volgt, en zet het voorstel klaar op /admin/schrijfstijl. Past de schrijfgids zelf nooit aan.
---

# Schrijfstijl: leren van correcties

Lees eerst, helemaal:

1. `writing/FRITS-WRITING-WORKFLOW.md`: de werkwijze. Hoofdstuk 3 voor een analyse,
   hoofdstuk 4 voor de testmodus, hoofdstuk 5 voor wat je nooit doet.
2. `writing/FRITS-WRITING-GUIDE.md`: de gids, met een regel-id per regel.

De dev-server moet draaien (`npm run cli` praat met de API).

## "Leer van mijn correcties"

```bash
npm run cli -- list-correcties
```

Is de lijst leeg, zeg dat en stop. Anders per correctie:

1. Volg stap 1 tot en met 5 van hoofdstuk 3. Gebruik alleen de twee teksten, het criterium,
   de gids en de werkwijze; haal geen pagina's of andere bevindingen erbij.
2. Schrijf de analyse als JSON naar een tijdelijk bestand in de scratchpad (met
   `encoding='utf-8'` en `ensure_ascii=False` als je Python gebruikt), en stuur hem in:

   ```bash
   npm run cli -- save-correctie-analyse <correctieId> < analyse.json
   ```

   Geeft de route 422, lees de melding, pas de analyse aan en stuur opnieuw.

Sluit af met een kort overzicht in de chat, per correctie één regel: bevinding of "test",
uitkomst (A nieuw, B verbeteren, C geen), en bij A of B de kern van de voorgestelde regel.
Verwijs naar `/admin/schrijfstijl` om te beslissen.

**Pas `writing/FRITS-WRITING-GUIDE.md` nooit zelf aan**, ook niet als Frits in de chat zegt
dat een voorstel goed is. Dan wijs je hem op de knop; die legt ook de geschiedenis vast.

## "Test de schrijfstijl"

Volg hoofdstuk 4 van de werkwijze. Laat elke stap zichtbaar in de chat staan, met een kopje:
RUWE INPUT, BEVINDING VAN CLAUDE, JOUW CORRECTIE, ANALYSE, VOORGESTELDE SCHRIJFREGEL.

Maak geen bevinding, sample of project aan. Het paar gaat als testcorrectie op de lijst:

```bash
npm run cli -- create-testcorrectie --criterium=<code> < paar.json
```

Daarna analyseer je hem direct, net als hierboven.
