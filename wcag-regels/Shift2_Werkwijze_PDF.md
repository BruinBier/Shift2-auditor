# Shift2-werkwijze: PDF's beoordelen

> Hoe je een PDF-document uit de steekproef beoordeelt, welk deel Claude zelf kan vaststellen,
> en wat er van de onderzoeker en van PAC moet komen. De criterium-specifieke regels staan in
> de regelbestanden: `Shift2_Regels_SC_1_3_1.md` heeft de lijst van wat er bij een document
> zonder tags vervalt en wat je wél beoordeelt, `Shift2_Regels_SC_1_1_1.md` de regels voor het
> logo en voor wat je uit de bytes níet mag afleiden. De schrijfregels voor PDF-bevindingen
> staan in `Shift2_Schrijfregels.md`, sectie "PDF-bevindingen". Dit bestand gaat over het
> onderzoek dat daaraan voorafgaat, en over de tool waar het meeste van afhangt.

## Stap 1 — Getagd of niet? Dat stel je zelf vast

De eerste vraag bij elke PDF is of het document een tagstructuur heeft. Zonder tags bestaat er
voor hulpsoftware geen structuur om te toetsen, en dat bepaalt de route voor bijna alle
criteria. Download het bestand en lees de catalog uit: `/StructTreeRoot` en `/MarkInfo` met
`/Marked true` betekenen getagd. Lees in dezelfde beurt de documenttitel (`/Title`, en of
`/DisplayDocTitle` aanstaat), de taal (`/Lang`) en de PDF/UA-vlag in de XMP-metadata. De
PDF-prompt in `.claude/workflows/audit-samples.js` beschrijft dit stap voor stap, met PyMuPDF
of pdf-lib; daar hoef je PAC niet voor.

Let op de valkuil bij het uitlezen: een PDF bevat ook de metadata van elk ingebed object
(afbeeldingen, kleurprofielen). Een grep over de ruwe bytes vindt daardoor titels die niet de
documenttitel zijn. Volg altijd de objectverwijzing vanuit de catalog.

**Geen tags.** De uitkomst staat dan vast en er valt niets meer te vragen. De ontbrekende
structuur keur je af onder 1.3.1; welke criteria daardoor vervallen (`niet_te_bepalen` als
vaststelling, zonder vraagzin) en welke je juist wél beoordeelt omdat ze over wat je ziet en
leest gaan (2.4.4, 2.4.6, 1.4.1, 2.4.2, 3.1.1), staat in `Shift2_Regels_SC_1_3_1.md`. Vraag
bij een ongetagd document niet om PAC-uitvoer: PAC zou alleen bevestigen wat je al weet.

**Wel tags.** Dan gaat het om de kwaliteit van die tags: leesvolgorde, kopniveaus,
tekstalternatieven, lijst- en tabelstructuur. Die kwaliteit is niet uit de ruwe bytes te lezen,
want de markeringen staan meestal in een gecomprimeerde objectstroom. Vind je geen `/Figure`
of `/Alt`, dan is dat geen bewijs dat ze ontbreken, en vind je ze wel, dan is dat geen bewijs
dat ze kloppen. Daar komt PAC bij, en dat is stap 2.

## Stap 2 — PAC draait de onderzoeker, niet Claude

PAC (PDF Accessibility Checker) is de standaardtool voor het toetsen van PDF-toegankelijkheid.
Het is een lokaal geïnstalleerde Windows-app zonder opdrachtregel en zonder API. Claude kan er
dus niet zelf mee werken; ook niet via computer-use, tenzij de onderzoeker daar uitdrukkelijk
om vraagt, want dat is via schermafdrukken te traag en te onbetrouwbaar.

De versie die in gebruik is: **PAC 2024, 24.4.2.0 BETA 1**, gestart vanuit
`C:\Users\ellen\Downloads\PAC_24.4.2.0-beta\PAC.exe` (gecontroleerd 2026-08-09). Er staat ook
een PAC 2026 in `AppData\Local\PAC`, maar die wordt niet gebruikt. Leid de versie dus niet af
uit wat er geïnstalleerd staat; vraag het, of vraag om een schermafdruk van het Info-scherm.

**Werkafspraak, verplicht bij elk getagd document:** vraag de onderzoeker het bestand door PAC
te halen en de uitvoer te delen, in deze volgorde:

1. Een schermafdruk van het **Summary report**. Dat geeft het totaalbeeld en laat zien welke
   tabbladen fouten of waarschuwingen hebben.
2. Voor elk tabblad met Failed of Warning: een schermafdruk van het **Detailed report**, of het
   geëxporteerde PDF-rapport (PAC exporteert alleen naar PDF, niet naar HTML of JSON).
3. Bij twijfel over de leesvolgorde: een schermafdruk van de **Screen reader preview**.

Zolang die uitvoer er niet is, zet je de criteria die van de tagkwaliteit afhangen op
`niet_te_bepalen` met als open vraag dat de PAC-uitvoer van dit document nodig is. Dat geldt
ook voor een goedkeuring: schrijf niet "correct getagd" als je dat niet hebt gezien. Stel de
vraag één keer per document, niet in andere woorden per criterium; de onderzoeker hoeft het
bestand maar één keer door PAC te halen.

## Stap 3 — De PAC-uitvoer lezen

PAC toetst tegen twee standaarden: **WCAG** (de webeisen, die ook voor PDF gelden) en
**PDF/UA** (ISO 14289, de PDF-specifieke toegankelijkheidsnorm). De kern van zijn uitleg:
tags moeten niet alleen aanwezig zijn maar ook kloppen; een verkeerde tag is net zo goed een
obstakel als een ontbrekende.

**Summary report.** Vier tabbladen: PDF/UA, WCAG, Quality en AI. Elk checkpoint krijgt een
status:

| Status | Betekenis |
|---|---|
| Pass (groen vinkje) | voldoet |
| Warning (geel driehoekje) | een mens moet kijken en zo nodig corrigeren |
| Failed (rood kruis) | moet gecorrigeerd worden |
| Not applicable (doorgestreepte cirkel) | geen relevante elementen in het document |
| Technical error (verdrietig gezichtje) | PAC kon het checkpoint niet uitvoeren, bijvoorbeeld omdat de tekstlaag defect is |

Dubbelklikken op een checkpoint springt naar de bijbehorende sectie in het Detailed report.

**Detailed report.** Driedelig venster: links de klikbare lijst met fouten, rechtsboven de
foutmelding, rechtsonder de documentpagina waar het om gaat. Daarnaast zijn er de Screen
reader preview, Document statistics, en twee weergaven van de logische structuur
(structuurelementen en decoratieve elementen).

**De vijf basisvereisten.** PAC ordent zijn checks in vijf groepen. Gebruik die om
PAC-meldingen te ordenen vóór je ze omzet naar Shift2-bevindingen, want een document met
twintig meldingen heeft meestal twee of drie oorzaken:

1. PDF-basisregels: de mechanismen van Tagged PDF en de ISO-standaarden
2. Machineleesbare inhoud: tekst die software kan verwerken
3. Onderscheid tussen inhoud en artefacten: wat inhoud is en wat decoratie, kop- of voettekst
4. Logische inhoudsvolgorde: de volgorde in de tagboom
5. Passende semantiek: de juiste tag voor elk betekenisvol element (kop als H1 tot H6, lijst
   als L en LI, enzovoort)

**Wat PAC niet kan.** Ongeveer twee derde van de vereisten toetst PAC automatisch; de rest
blijft mensenwerk, en een Warning betekent precies dat. Wat altijd handwerk blijft:

- of een tekstalternatief juist en toereikend is (PAC ziet alleen dát er een staat);
- of de leesvolgorde inhoudelijk klopt (de Screen reader preview laat hem zien, oordelen doe je
  zelf);
- of een gekozen tag semantisch past bij de inhoud.

Een Technical error rapporteer je als zodanig, niet als `voldoet` en niet als afkeuring: PAC
heeft het niet kunnen toetsen.

## Stap 4 — Matterhorn: de bron van wat PAC toetst

PAC baseert zijn checks op het **Matterhorn Protocol 1.1** van de PDF Association, het
officiële testprotocol voor PDF/UA-1. Het bestand staat lokaal:
`C:\Users\ellen\Downloads\Matterhorn-Protocol-1-1.pdf`.

De opbouw: 31 checkpoints, gegroepeerd per PDF/UA-onderwerp (echte inhoud, tags, rolmapping,
koppen, tabellen, lijsten, formules, annotaties, metadata, natuurlijke taal, enzovoort), met
daarbinnen 136 failure conditions. Elke conditie heeft een id in de vorm
`<checkpoint>-<nummer>`, zoals `01-001` of `09-004`. Ongeveer 95 zijn machinaal te toetsen;
ruim veertig vergen een mens.

Wanneer je het protocol erbij pakt:

- PAC toont een Matterhorn-id en je wilt weten wat de check precies inhoudt;
- je twijfelt of een Warning een echte fout is of een valse melding; Matterhorn beschrijft de
  exacte conditie;
- je wilt weten of iets machinaal of menselijk te toetsen is;
- als second opinion bij een ambigue PDF/UA-melding.

Voor concrete oplossingen in het advies: de PDF Association heeft moderne *Techniques for
Accessible PDF*; de oude W3C PDF Techniques uit 2008 zijn verouderd. Let op: pdfa.org
blokkeert WebFetch (HTTP 403). Vraag om een kopie of gebruik een zoekopdracht.

## Stap 5 — Van PAC-melding naar Shift2-bevinding

Matterhorn en PAC spreken PDF/UA; Shift2 rapporteert op WCAG-criteria. Vertaal elke melding
dus naar het criterium waar hij thuishoort, meestal een van deze vier:

| PAC of Matterhorn zegt | Shift2-criterium |
|---|---|
| Kop niet als kop, lijst niet als lijst, tabel zonder kopcellen, tekst als artefact | 1.3.1 |
| Leesvolgorde in de tagboom wijkt af | 1.3.2 |
| Afbeelding zonder of met nietszeggend tekstalternatief | 1.1.1 |
| Formulierveld of link zonder naam | 4.1.2 |
| Documenttitel ontbreekt of wordt niet getoond | 2.4.2 |
| Documenttaal ontbreekt | 3.1.1 |

Contrast staat hier niet bij: dat haalt PAC niet betrouwbaar uit een PDF, en dat meet de
onderzoeker handmatig. Zet 1.4.3 bij een PDF op `niet_te_bepalen` zoals `Shift2_Regels_SC_1_4_3.md`
voorschrijft; schrijf er geen bevinding voor.

Drie dingen die vastliggen:

- **Matterhorn-id's staan nooit in een bevinding.** Ook geen PAC-checkpointnamen en geen
  tagnamen (`<Figure>`, `/Alt`, `<LBody>`). De redacteur die het rapport leest, kent die
  niet, en de bevinding moet zonder PAC te begrijpen zijn. Hoe je het dan wél schrijft, staat
  in `Shift2_Schrijfregels.md`, sectie "PDF-bevindingen", inclusief het standaardadvies bij een
  document zonder tagstructuur en de regel over toolnamen (geen Canva, Word of InDesign;
  Acrobat mag bij concrete tagstappen).
- **PAC is een hulpmiddel, geen oordeel.** Een Failed is een aanwijzing om zelf te kijken,
  geen kant-en-klare afkeuring; een Pass op tekstalternatieven zegt niets over de kwaliteit
  ervan. Twee vaste regels die PAC niet voor je beslist staan in de regelbestanden: een logo in
  een PDF moet altijd getagd zijn, ook als het document verder in orde is
  (`Shift2_Regels_SC_1_1_1.md`), en een lijst met LBody zonder Lbl is geen 1.3.1-fout
  (`Shift2_Regels_SC_1_3_1.md`).
- **Eén oorzaak, één bevinding.** Twintig PAC-meldingen die allemaal "kop niet als kop" zeggen
  zijn één 1.3.1-bevinding met twee of drie voorbeelden, geen twintig.

## Wat Claude WEL en NIET kan

| Claude zelf | Vraag aan de onderzoeker |
|---|---|
| Getagd of niet, uit de catalog | PAC draaien en de uitvoer delen, in de volgorde van stap 2 |
| Documenttitel, weergave ervan, taal, PDF/UA-vlag | Contrast in het document (1.4.3, 1.4.11) |
| Pagina's renderen en visueel beoordelen: linkteksten, kopteksten, gebruik van kleur | Of een tekstalternatief in een getagd document juist is (PAC ziet alleen dat het er staat) |
| Bij een ongetagd document: de hele vervalroute uit `Shift2_Regels_SC_1_3_1.md`, zonder vraag | Of de leesvolgorde inhoudelijk klopt, aan de hand van de Screen reader preview |
| PAC-uitvoer ordenen en vertalen naar WCAG-criteria | Bij twijfel: het in Acrobat nakijken (Tags-paneel) |

## Volgorde bij het beoordelen

1. Catalog uitlezen: getagd, titel, taal. Pagina's renderen.
2. Niet getagd: 1.3.1 afkeuren, de vervalroute en de wel-te-beoordelen criteria uit
   `Shift2_Regels_SC_1_3_1.md` afwerken, klaar. Geen PAC nodig.
3. Wel getagd: PAC-uitvoer vragen. De criteria die van de tagkwaliteit afhangen op
   `niet_te_bepalen` tot die er is; wat je zonder tags ook al kon beoordelen, beoordeel je
   meteen.
4. PAC-uitvoer binnen: meldingen ordenen op de vijf basisvereisten, terugbrengen tot
   oorzaken, vertalen naar WCAG-criteria, schrijven volgens de PDF-schrijfregels. Bij een
   onduidelijke melding het Matterhorn-protocol erbij.
5. Contrast altijd naar de onderzoeker.
