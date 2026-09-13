# Shift2-beoordelingsregels SC 3.1.1

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_3_1_1.md` als ze elkaar tegenspreken.

## De vraag

Staat in de code welke taal de pagina heeft, en klopt dat met de tekst? Een schermlezer kiest
op grond van het `lang`-attribuut op het `html`-element zijn uitspraakregels. Ontbreekt het,
of staat er de verkeerde taal, dan wordt Nederlandse tekst met Engelse klanken voorgelezen en
is die niet te volgen.

Dit criterium geldt op elke pagina en elk document, dus het oordeel is altijd `voldoet` of
`afgekeurd`. Het gaat over de taal van de pagina als geheel; losse anderstalige passages
horen bij 3.1.2.

## Wat wél een afkeuring is

- **Geen `lang` op het `html`-element**, of een leeg attribuut. Een `lang` op `body` alleen
  telt niet.
- **Een ongeldige code**: `dutch`, `nederlands`, `NL-nl` met een streepje op de verkeerde
  plek. Geldig is `nl`, `nl-NL`, `en`, `fy`.
- **Een code die niet klopt met de tekst**: `lang="nl"` op de Engelse versie van de site, of
  `lang="en"` op een Nederlandse pagina.
- **Een PDF zonder documenttaal** (QuickFinding "PDF - Documenttaal niet ingesteld", 9bf0e100,
  impact **matig**, **redacteur**) of **met de verkeerde taal** (QuickFinding "PDF Taal
  verkeerd ingesteld", 54d6f409, impact **serieus**, **redacteur**). Zie
  `Shift2_Werkwijze_PDF.md`: dit beoordeel je ook bij een ongetagd document.

Op een webpagina zit het `lang`-attribuut in het sjabloon: impact **serieus**,
verantwoordelijkheid **ontwikkelaar**, en één bevinding voor de hele site, gekoppeld aan de
homepage. Zit het in een SIMsite-sjabloon, meld het dan ook in Template-monitoring.

## Wat GEEN bevinding is

- **Een kader van een ander domein** (YouTube, een kaart) zonder `lang`. Daar heeft de site
  geen invloed op. Een kader van het eigen domein moet het wél hebben.
- **Een Friese pagina met `lang="fy"`**, of een Nederlandse pagina met `lang="nl-NL"`: beide
  zijn correct.

## Op de kaart

> Dit blok staat in het scherm van "Waar sta ik". De kaart leest het rechtstreeks uit dit
> bestand: wat je hier verandert, staat bij de volgende keer verversen op de kaart. Er is
> geen tussenstap en geen kopie. Houd het kort — een kaart is geen naslagwerk. Wat langer
> is hoort in de secties hierboven.

### Titel

De taal van de pagina staat in de code en klopt

### In het kort

Een schermlezer kiest zijn uitspraak op het taalkenmerk van de pagina. Staat er niets, of
de verkeerde taal, dan klinkt Nederlandse tekst als Engels en is hij niet te volgen. De
code moet er staan, geldig zijn en overeenkomen met de tekst. Op een PDF is dat de
documenttaal in de eigenschappen.

Het kenmerk zit in het sjabloon, dus één bevinding voor de hele site is genoeg. Losse
Engelse zinnen op een Nederlandse pagina zijn een ander criterium: 3.1.2.

### Audit-instructies

> Zet voor elke stap wie hem uitvoert: `[meting]` als een commando het al doet, `[jij]` als er
> een mens voor nodig is. De kaart toont dat met een vinkje of een open rondje, zodat er niet
> als opdracht staat wat allang gedaan is.

#### Stap 1 — Meten

1. [meting] `get-html --full`: het `html`-element met zijn attributen, na JavaScript. Op de
   homepage komt het document altijd volledig mee; op een andere pagina is `--full` nodig,
   want zonder die vlag krijg je alleen de main-content.
2. [agent] Bij een PDF: lees de documenttaal uit de catalogus (de `/Lang`-vermelding) en uit
   de eigenschappen.

#### Stap 2 — Beoordelen

3. [agent] Staat er een `lang` op `html`, is hij gevuld en is de code geldig?
4. [agent] Komt de code overeen met de tekst van de pagina? Bij een taalversie van de site
   hoort de code van die taal.
5. [agent] Kaders van het eigen domein: haal de pagina in het kader apart op en kijk of die
   ook een `lang` heeft. Kaders van een ander domein sla je over en noem je bij het gebied.

#### Stap 3 — Vastleggen

6. [agent] Stuur de vier deelgebieden hieronder mee met het oordeel, in hetzelfde
   `save-checks`-bericht: `"gebieden": [{ "gebied": "...", "uitkomst": "ok|nvt|fout|opmerking",
   "toelichting": "..." }]`. Zonder een complete lijst wordt het oordeel geweigerd. Kon je een
   gebied niet beoordelen, gebruik dan `nvt` met een toelichting.
7. [agent] De onderbouwing bij `reden` is **één of twee zinnen**: of de meting geldig was —
   kwam je op de gevraagde pagina uit, draaide de JavaScript, was het een auditsessie — en
   verder niets. Al het inhoudelijke gaat naar de deelgebieden.

### Zo is het vastgesteld

`get-html --full` geeft het hele document na JavaScript, met het `html`-element en zijn
`lang`-attribuut bovenaan. Bij een PDF leest de agent de documenttaal uit de catalogus.

Wat hier niet uit blijkt: of een kader van een ander domein een taal opgeeft. Dat valt
buiten de site en buiten het oordeel.

### Deelgebieden

1. Het lang-attribuut op het html-element: aanwezig, gevuld en een geldige code
2. De code komt overeen met de taal van de tekst, ook op een anderstalige versie van de site
3. Kaders van het eigen domein hebben ook een taalkenmerk; kaders van een ander domein vallen erbuiten
4. PDF: de documenttaal in de eigenschappen is ingesteld en klopt

> Aangemaakt op 2026-09-13 bij ZOET-01, samen met de regelbestanden van 2.3.1, 2.4.2,
> 3.1.2, 3.3.1, 3.3.3 en 3.3.7. De regels komen uit de checklist en uit de twee
> PDF-QuickFindings; de keuze voor één sitebrede bevinding aan de homepage volgt
> `Shift2_Scope_Per_Sample.md`. Er zitten nog geen correcties uit audits in. Zet uitleg bij
> deze lijst altijd als blokcitaat: een gewone alinea eronder plakt de kaartlezer aan het
> laatste gebied vast.
