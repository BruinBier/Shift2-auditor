# Werkwijze: de schrijfgids toepassen en ervan leren

Dit bestand is voor Claude. Het zegt hoe `writing/FRITS-WRITING-GUIDE.md` wordt toegepast bij
het schrijven van een bevinding, en hoe een correctie van Frits wordt geanalyseerd. Frits mag
het bewerken; het is geen code.

Het doel in één zin: **de feiten verschillen per bevinding, de schrijfstijl blijft van Frits.**

## 1. Feiten en stijl zijn twee dingen

De feiten komen uit het onderzoek, nooit uit de gids:

- het succescriterium en het oordeel;
- de onderzochte pagina en het gevonden element;
- de code, de schermafdruk, de meetwaarden;
- een bestaande bevinding of een bestaand advies.

De gids bepaalt alleen hoe die feiten op papier komen: woordkeuze, zinsopbouw, volgorde,
hoeveel uitleg, hoe het gevolg voor de gebruiker wordt beschreven, hoe het advies luidt, en
welke formuleringen niet mogen.

De gids is nooit een reden om een probleem te constateren, een criterium te kiezen of een
feit aan te vullen. Staat er in de gids een voorbeeld over een lijst, dan betekent dat niet
dat deze pagina een lijstprobleem heeft.

De beoordeling zelf (valt dit onder het criterium, voldoet het, welke impact) staat in
`wcag-regels/` en in de workflows. Die raakt de gids niet.

## 2. Een bevinding schrijven

1. **Verzamel de feiten.** Wat staat er, waar, wat is het probleem, wie merkt het en hoe.
   Gebruik de werkelijke tekst van de pagina: de kop zoals hij luidt, de linktekst zoals hij
   luidt.
2. **Lees de gids helemaal**, en het regelbestand van het criterium
   (`wcag-regels/Shift2_Regels_SC_<code>.md`). Bij tegenspraak wint het regelbestand.
3. **Schrijf voor deze situatie.** Geen vaste zin invullen: een andere kop, een ander aantal
   elementen, een andere zichtbare tekst of een andere plek op de pagina vraagt om een eigen
   zin. De gids zegt hoe die zin eruitziet, niet wat erin staat.

   De enige vaste tekst is een snelle bevinding uit de bibliotheek (zie regel R39 in de gids):
   past er een, dan is die het uitgangspunt. Dat is een keuze van Frits, geen sjabloon dat de
   gids oplegt.
4. **Loop de tekst na tegen de gids** voordat hij wordt weggeschreven. De linter
   (`lib/finding-lint.ts`) vangt de mechanische fouten; de rest is jouw werk.

Een bevinding die via `npm run cli -- create-finding` wordt aangemaakt, bewaart de tool
automatisch als originele AI-tekst (`aiDescription`, `aiAdvice`). Past Frits de tekst later
aan, dan blijft dat origineel staan; daar vergelijkt "Leer van mijn correctie" mee.

## 3. Leren van een correctie

Frits klikt bij een aangepaste bevinding op "Leer van mijn correctie". De tool zet dan de
originele en de bewerkte tekst op een lijst. Zegt hij in Claude Code "leer van mijn
correcties", dan loop je die lijst af:

```bash
npm run cli -- list-correcties
```

Per correctie heb je alleen nodig: de originele tekst, de bewerkte tekst, het criterium, de
gids en dit bestand. Haal er geen andere bevindingen, pagina's of projecten bij.

### Stap 1. Wat is er veranderd?

Zet elke wijziging los op een rij: wat er stond en wat er nu staat. Kleine wijzigingen die
bij elkaar horen (één zin herschreven) zijn één wijziging.

### Stap 2. Schrijfcorrectie of inhoudelijke correctie?

Beslis dit per wijziging.

**Inhoudelijk** is een wijziging die een feit rechtzet of aanvult: een andere kop, een ander
aantal, een ander element, een andere plek, een ander criterium, een andere oplossing omdat
de eerste niet klopte met deze site. Daar komt **nooit** een schrijfregel uit, hoe vaak het
ook gebeurt.

> Claude: "Onder de kop Contact staan vijf links."
> Frits: "Onder de kop Contactgegevens staan vijf links."
>
> Inhoudelijk. De kop heet anders; aan de zin zelf is niets veranderd.

**Schrijf** is een wijziging die hetzelfde feit anders zegt: woordkeuze, zinsbouw, volgorde,
hoeveel uitleg, hoe het gevolg wordt beschreven, de toon van het advies.

> Claude: "Dit kan verwarrend zijn voor gebruikers van schermlezers."
> Frits: "Wie blind is en een schermlezer gebruikt hoort daardoor niet dat het om een lijst
> gaat en hoeveel onderdelen de lijst bevat."
>
> Schrijf. Een vaag oordeel is vervangen door het concrete gevolg, met beperking en
> hulpmiddel samen.

Twijfel je, noem het dan inhoudelijk. Een gemiste les komt bij de volgende correctie terug;
een verkeerde regel stuurt elke volgende bevinding de verkeerde kant op.

### Stap 3. Waarom past de versie van Frits beter?

Eén of twee zinnen, alleen voor de schrijfcorrecties. Benoem het principe, niet de woorden:
niet "hij schreef 'hoort' in plaats van 'kan verwarrend zijn'", maar "hij beschrijft wat de
gebruiker mist in plaats van een oordeel over hoe dat voelt".

### Stap 4. Staat het al in de gids?

Lees de gids opnieuw met het principe uit stap 3 in je hoofd, en kies:

- **geen**: de correctie valt al volledig onder een bestaande regel, of er waren alleen
  inhoudelijke wijzigingen. Noem de regel-id's die het dekken. Dit is de normale uitkomst:
  meestal heeft Claude een bestaande regel niet goed toegepast, en dan is de les voor Claude
  en niet voor de gids.
- **verbeteren**: de regel bestaat, maar de correctie laat zien dat hij onduidelijk is, te
  smal, of een voorbeeld mist dat het verschil had gemaakt. Stel de hele nieuwe tekst van die
  regel voor. Overlappen twee regels en dekt één samengevoegde regel ze allebei, geef dan
  beide id's op: dat is samenvoegen, en het levert één regel op.
- **nieuw**: het principe staat nergens, ook niet in een andere vorm. Pas dan.

Probeer in deze volgorde: bestaande regel toepassen, bestaande regel verduidelijken, twee
regels samenvoegen, en alleen als dat allemaal niet kan een nieuwe regel. Het doel is een gids
die sterker wordt, niet langer. Honderd correcties horen geen honderd regels op te leveren.

### Stap 5. Het voorstel formuleren

Schrijf een regel in de stijl van de gids zelf: een vetgedrukte kern, dan de uitleg, dan een
voorbeeld voor en na. Gebruik als voorbeeld de algemene vorm, niet de zin uit deze ene
bevinding met de namen van deze site erin, tenzij die het principe het best laat zien. Sluit
af met "Vastgelegd door Frits op <datum>, bij <criterium>." zoals de andere regels.

Bij een nieuwe regel kies je het kopje waaronder hij hoort. Neem een kopje dat er al staat.

### Stap 6. Wegschrijven

De analyse gaat terug naar de tool, niet naar de gids:

```bash
npm run cli -- save-correctie-analyse <correctieId> < analyse.json
```

met dit formaat:

```json
{
  "wijzigingen": [
    { "origineel": "…", "bewerkt": "…", "soort": "schrijf", "uitleg": "…" }
  ],
  "waaromBeter": "…",
  "uitkomst": "geen | verbeteren | nieuw",
  "regelIds": ["R11"],
  "toelichting": "Waarom deze uitkomst, en bij 'geen' welke regel het al dekt.",
  "voorstel": {
    "sectie": "Toon en formulering",
    "nieuweTekst": "- **…** …",
    "reden": "Eén zin: wat deze wijziging aan de gids toevoegt."
  }
}
```

`voorstel` alleen bij `verbeteren` en `nieuw`. `sectie` alleen bij `nieuw`. Bij `verbeteren`
staan in `regelIds` de regel of regels die vervangen worden.

Frits ziet het voorstel op `/admin/schrijfstijl`, met OUDE REGEL en NIEUWE REGEL naast elkaar,
en kiest daar. Pas na zijn bevestiging past de tool de gids aan.

## 4. Testmodus

Frits wil het systeem kunnen testen zonder echte auditgegevens aan te raken. Dat gaat hier in
het gesprek:

1. Frits plakt een ruwe bevinding en noemt het criterium.
2. Jij schrijft de bevinding volgens stap 2 hierboven, en zet haar in de chat.
3. Frits verbetert haar en plakt zijn versie terug.
4. Jij zet het paar op de lijst als testcorrectie. Er komt geen bevinding en geen project aan
   te pas:

   ```bash
   npm run cli -- create-testcorrectie --criterium=1.3.1 < paar.json
   ```

   met `{ "origineelDescription", "origineelAdvice", "bewerktDescription", "bewerktAdvice" }`.
5. Je analyseert hem volgens stap 3 tot en met 6. Het voorstel komt op `/admin/schrijfstijl`
   met het label "test", en gaat verder precies dezelfde weg als een echte correctie.

Laat bij elke stap in de chat zien wat eruit kwam: ruwe input, jouw bevinding, zijn correctie,
de analyse, het voorstel.

## 5. Wat Claude nooit doet

- **De gids zelf aanpassen.** Niet met een editor, niet met een script, ook niet als de regel
  overduidelijk is. Alleen de knop in `/admin/schrijfstijl` schrijft in de gids, en die knop
  drukt Frits in.
- **Een regel maken van een inhoudelijke correctie.**
- **Een regel maken die een WCAG-oordeel verandert.** "Een lijst met één item is geen fout" is
  een beoordelingsregel en hoort in `wcag-regels/`, niet in de schrijfgids. Komt zo'n correctie
  langs, zet dan uitkomst `geen` en schrijf in `toelichting` dat het een beoordelingsvraag is
  voor het regelbestand van het criterium.
- **Meer dan één voorstel per correctie.** Bevat één correctie twee losse schrijflessen, noem
  de tweede in `toelichting`; hij komt vanzelf terug als hij echt een patroon is.
