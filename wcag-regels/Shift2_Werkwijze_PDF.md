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
criteria. Download het bestand en lees de catalog uit: **`/StructTreeRoot` MÉT INHOUD bepaalt
de route.**

Die twee woorden zijn het hele punt. `/StructTreeRoot` kan naar een LEEG object verwijzen, en
dan slaagt de aanwezigheidscontrole terwijl er geen enkele kop, alinea of lijst is vastgelegd.
Volg daarom de verwijzing en kijk of de wortel `/K` heeft: dat zijn de kinderen van de boom.

```python
import fitz, re
doc = fitz.open(pad)
cat = doc.xref_object(doc.pdf_catalog())
m = re.search(r'/StructTreeRoot\s+(\d+)\s+\d+\s+R', cat)
getagd = bool(m) and '/K' in doc.xref_object(int(m.group(1)))
```

Op ZOET-01 gaf dat `<< /K 1488 0 R /ParentTree 1489 0 R /RoleMap 1490 0 R ... >>` voor Bijlage 2
en `<< /Type /StructTreeRoot >>` voor het Collegebesluit. Dat verschil is de routekeuze.

**Tel niet de losse `/StructElem`-objecten.** Die zitten in gecomprimeerde objectstromen en
zijn niet uit de xref te lezen; een telling geeft daar nul voor élk document, ook een perfect
getagd document. Dat is dezelfde valkuil als bij de tekstalternatieven verderop: niet vinden is
geen bewijs van afwezigheid.

Vergelijk het met een inhoudsopgave: de eerste controle kijkt of er een pagina "Inhoudsopgave"
in het boek zit. Die zit erin, maar er staat niets op.

PAC toont dit als eerste getal bovenaan zijn scherm: **Tags: 0**. Het is dus geen exotische
controle maar de eerste die de standaardtool zelf doet.

`/MarkInfo /Marked` doet niet mee, niet in de routekeuze en niet in een bevinding. Zie de
routes hieronder.

Lees in dezelfde beurt de documenttitel (`/Title`, en of `/DisplayDocTitle` aanstaat), de taal
(`/Lang`) en de PDF/UA-vlag in de XMP-metadata. De PDF-prompt in
`.claude/workflows/audit-samples.js` beschrijft dit stap voor stap, met PyMuPDF of pdf-lib;
daar hoef je PAC niet voor.

Staat het vinkje "tagstructuur" al op de sample in de steekproef, dan is dat de vaststelling
van de onderzoeker en die gaat voor. Meet je iets anders, meld dat dan; verander het vinkje
niet zelf.

Let op de valkuil bij het uitlezen: een PDF bevat ook de metadata van elk ingebed object
(afbeeldingen, kleurprofielen). Een grep over de ruwe bytes vindt daardoor titels die niet de
documenttitel zijn. Volg altijd de objectverwijzing vanuit de catalog.

**Geen tags.** De uitkomst staat dan vast en er valt niets meer te vragen. De ontbrekende
structuur keur je af onder 1.3.1; welke criteria daardoor vervallen (`niet_te_bepalen` als
vaststelling, zonder vraagzin) en welke je juist wél beoordeelt omdat ze over wat je ziet en
leest gaan (2.4.4, 2.4.6, 1.4.1, 2.4.2, 3.1.1), staat in `Shift2_Regels_SC_1_3_1.md`. Vraag
bij een ongetagd document niet om PAC-uitvoer: PAC zou alleen bevestigen wat je al weet.

**Contrast valt hier buiten, en dat is de uitzondering om te onthouden.** 1.4.3 en 1.4.11 horen
niet in de vervalroute: tags hebben niets met contrast te maken, en lichtblauwe tekst op wit is
even onleesbaar zonder tagstructuur. Meet het met `get-pdfcontrast` (zie hieronder); dat werkt
onafhankelijk van de tagstructuur.

**Een LEGE tagboom: `/StructTreeRoot` bestaat, maar er staat niets in.** Dit volgt de
ongetagde route hierboven. Er is niets om te toetsen, dus 1.3.1 wordt afgekeurd, dezelfde
criteria vervallen, en je vraagt géén PAC-uitvoer.

De bevinding is dezelfde als bij een document zonder `/StructTreeRoot`: er is geen structuur,
punt. Schrijf er NIET bij dat het document zichzelf als getagd aanmerkt. Dat is de
PAC-melding "Markering voor getagde documenten", en die negeren we: `/MarkInfo /Marked` is een
administratieve vlag, geen obstakel voor wie het document gebruikt. Vastgesteld door Frits op
2026-09-17.

> Op ZOET-01 (september 2026) ging dit mis met het Collegebesluit. De catalog had
> `/StructTreeRoot 54 0 R` én `/MarkInfo /Marked true`, en alle negen pagina's hadden
> `/StructParents`. De agent las de regel "`/StructTreeRoot` bepaalt de route", zette het
> vinkje op "wel tags" en vroeg om PAC-uitvoer — terwijl object 54 `<< /Type /StructTreeRoot >>`
> was, zonder kinderen, met nul structuurelementen in het hele bestand. PAC zette er "Tags: 0"
> en "Inhoud: 5.172 fout" bij. De onderzoeker ving het op door door te vragen; zonder dat was
> 1.3.1 blijven staan als open vraag in plaats van als afkeuring met een concreet advies.

**`/MarkInfo /Marked` doet niet mee.** Die vlag is waarmee een document verklaart dat het een
Tagged PDF is. Hij zegt niets over wat er voor de gebruiker te halen valt: staat er een gevulde
tagboom in, dan is die te beoordelen, en staat hij op true bij een lege boom, dan is er nog
steeds niets. Het is een administratieve vlag.

Kijk er dus niet naar voor de routekeuze, en schrijf er geen bevinding over. In PAC is dit de
melding **"Markering voor getagde documenten"** onder 1.3.1; die negeer je. Vastgesteld door
Frits op 2026-09-17.

### Getagd is niet hetzelfde als overal getagd

Tel bij elk document met tags de pagina's mét `/StructParents` en leg dat naast het totaal.
Elke pagina die meedoet in de tagstructuur heeft zo'n nummer; een pagina zonder doet niet mee.

```python
met = sum(1 for i in range(doc.page_count)
          if '/StructParents' in doc.xref_object(doc.page_xref(i)))
```

**Loopt dat uiteen, dan MELD je dat.** Dat is geen afweging per geval: zonder die melding valt
het ongetagde deel stilzwijgend buiten het onderzoek. De eerste controle ziet een gevulde
tagboom, het document volgt de route "wel tags", en de beoordeling gaat over de kwaliteit van
tags die op een deel van de pagina's helemaal niet bestaan.

Schrijf het als één bevinding over één document: **het document is getagd, maar niet op alle
pagina's**, met de paginanummers erbij. Dus niet "er zitten twee documenten in" en niet "de
bijlage is ongetagd" — hoe het zo gekomen is, is een verklaring en geen bevinding. Wat de lezer
moet weten is welk deel van het document geen structuur heeft.

Het advies wijst naar dat deel, niet naar het geheel. Het hoofddocument opnieuw exporteren lost
niets op: het ongetagde deel komt er daarna net zo weer achter. Komt het van een externe partij,
dan hoort de vraag om een toegankelijke versie daar te liggen.

> Op ZOET-01 is Bijlage 2 (166 pagina's) getagd tot en met pagina 99. Pagina 99 is het
> tussenblad "BIJLAGE 1 NATUURONDERZOEK"; vanaf pagina 100 staat het bSR-rapport 510
> "Verkennend onderzoek natuurwaarden Buitengebied Zoetermeer" van een extern bureau, zonder
> tags. Zevenenzestig pagina's, veertig procent van het document, kwamen daardoor in het
> onderzoek niet voor: niet goedgekeurd, niet afgekeurd, gewoon niet.

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

**Werkafspraak, verplicht bij elk getagd document.** Vraag de onderzoeker het bestand door PAC
te halen en de uitvoer in ÉÉN keer te delen, vóórdat de audit draait. Er is later geen moment
om iets na te vragen: de audit loopt in één keer door en zet af wat hij niet kan beoordelen.

1. Een scrollopname van de **Screen reader preview**. Dit is de belangrijkste van de drie, en
   dat was eerder andersom: hij stond hier als "bij twijfel over de leesvolgorde". Hij doet
   veel meer dan dat.

   **Een scrollopname mag als PSB of PSD.** Een opname van de hele preview wordt al snel
   tienduizenden beeldpunten hoog -- het voorbeeld waarop dit is gebouwd was 1914 x 96207
   en 118 MB -- en dat is als een geheel onbruikbaar: te groot om te bewaren, te groot om
   te bekijken, en te groot om aan een agent te geven. De tool snijdt hem bij het toevoegen
   in stukken van schermhoogte, met honderd beeldpunten overlap zodat er geen regel op een
   naad wegvalt. Die 118 MB wordt zo 74 leesbare afbeeldingen van samen 11 MB. Het
   bronbestand wordt daarna weggegooid: niemand kan een PSB lezen, en bewaren wat nooit
   geopend wordt is geen bewijs. Losse schermafdrukken blijven ook gewoon goed.

   De preview toont de **hele tagstructuur**, element voor element, in de volgorde waarin
   hulpsoftware hem doorloopt, met de tagnaam ernaast. Daarmee beoordeel je in één bron:

   | Wat je ziet | Criterium |
   |---|---|
   | `H1`/`H2`/`H3` bij de koppen, `L`/`LI`/`Lbl`/`LBody` bij de lijsten, `TH`/`TD` in de tabellen | 1.3.1 |
   | de volgorde van de elementen | 1.3.2 |
   | de inhoud van elke `Alt`-balk, niet alleen dat er een is | 1.1.1 |
   | of de koppen de lading dekken | 2.4.6 |

   Het werkt twee kanten op: je ziet er fouten in, maar ook dat iets deugt. Dat laatste is
   nodig, want de regels verbieden "correct getagd" te schrijven zonder het gezien te hebben.

   **Vraag om schaal 100% en PNG.** Op ZOET-01 kwam de eerste opname als SVG binnen, door
   Snagit teruggeschaald naar 199 pixels breed; daarin was niets leesbaar. Dezelfde opname als
   PSB op ware breedte (1914 px) was wél te lezen. PSB werkt (`pip install psd-tools`), maar
   een PNG op ware grootte is lichter. Een opname van het hele document mag; bij ZOET-01 was
   dat 96.207 pixels lang en dat las prima uit.

2. Een schermafdruk van het **Summary report**. Dat geeft het totaalbeeld en laat zien welke
   tabbladen fouten of waarschuwingen hebben. Neem het **WCAG-tabblad**, niet PDF/UA: PAC 2026
   ordent daar per succescriterium, en dan hoef je niet meer van PDF/UA naar WCAG te vertalen.
3. Een schermafdruk van het **Detailed report** van elk tabblad met Failed of Warning, MINUS de
   vier hieronder. Of het geëxporteerde PDF-rapport — maar let op: dat rapport is één pagina
   met alleen totalen per richtlijn, en gaat niet tot op het succescriterium. Het is minder
   waard dan een uitgeklapte schermafdruk van het WCAG-tabblad.

**Vraag deze vier tabbladen NOOIT, ook niet als ze rood zijn:**

| Tabblad | Waarom niet |
|---|---|
| **Lettertypen** | Nooit nodig. Dit zijn PDF/UA-eisen aan lettertype-insluiting zonder WCAG-criterium erachter. Wat er wél toe doet — komt de tekst als leesbare Unicode terug — stel je zelf vast door de tekst uit te lezen en op vervangingstekens (U+FFFD) te controleren. Vastgesteld door Frits op 2026-09-17. |
| **Natuurlijke taal** | Dat is `/Lang`, en die lees je zelf uit de catalog. Valt onder 3.1.1. |
| **Metadata** | De documenttitel, zelf uit te lezen. Valt onder 2.4.2. |
| **Documentinstellingen** | `/DisplayDocTitle`, zelf uit te lezen. Valt ook onder 2.4.2. |

Op ZOET-01 Bijlage 2 scheelde dat vier van de zeven rode tabbladen. De regel erachter is
scherper dan "alles wat rood is": **vraag een detailscherm alleen als er een WCAG-criterium
achter zit dat je er niet zelf uit kunt halen.**

**Kijk eerst of het er al is.** De PAC-uitvoer wordt bewaard bij de sample zelf:
`get-project` geeft per sample een lijst `pacRapporten` terug, elk met `label` (welk
PAC-scherm het is), `pad` en `op`. Staat daar iets, dan is de uitvoer er en vraag je er niet
opnieuw om — open de afdrukken en lees ze. Vraag alleen wat er ontbreekt.

Lees het `label` om te weten wát je voor je hebt. Een Summary report geeft alleen tellingen
("158 fout") en daaruit volgt geen bevinding: 158 ontbrekende tekstalternatieven vragen een
ander advies dan 158 verkeerd getagde decoratieve afbeeldingen. Heb je alleen het Summary en
moet je een criterium beoordelen dat op zo'n telling stuit, vraag dan gericht om dát
detailscherm in plaats van om "de PAC-uitvoer".

Let op `op`: een afdruk van vóór een nieuwe versie van het document zegt niets meer over het
document dat er nu staat. Is de afdruk ouder dan het bestand dat je ophaalt, meld dat dan in
plaats van hem te gebruiken.

De onderzoeker plakt de afdrukken met het PAC-knopje op de steekproefrij (Ctrl+V) of via de
sample-detailpagina. Een agent doet dat niet zelf: het is de uitvoer van een tool die op de
machine van de onderzoeker draait.

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
foutmelding, rechtsonder de documentpagina waar het om gaat. Daarnaast zijn er Document
statistics en twee weergaven van de logische structuur (structuurelementen en decoratieve
elementen).

**Screen reader preview — hier zit het meeste in.** De tagstructuur van begin tot eind, met
per element de tagnaam links ervan. Zo ziet dat eruit op ZOET-01 Bijlage 2:

| Wat er staat | Wat je eruit leest |
|---|---|
| `H1` "1 AANLEIDING EN DOEL", `H2` "1.1 AANLEIDING" | de koppen zijn echte koppen, geen vetgemaakte tekst |
| `L` > `LI` > `Lbl` + `LBody` | de opsomming is een echte lijst, met bolletje en tekst apart |
| `TOC` > `TOCI` met `Link` per regel | de inhoudsopgave werkt |
| `Table` > `TR` > `TH`/`TD` | de tabelstructuur, inclusief welke cellen kopcel zijn |
| `Figure` met een `Alt`-balk eronder | het tekstalternatief, met zijn inhoud |

Twee dingen die alleen hier zichtbaar worden:

- **Of iets deugt.** De eerste 99 pagina's van Bijlage 2 bleken correct opgebouwd. Dat is nodig
  om "voldoet" te mogen schrijven, en het stuurt het advies: het probleem zat in de bijgevoegde
  bijlage, niet in het hoofddocument.
- **Waar de structuur ophoudt.** De preview eindigde met de kop "BIJLAGE 1 NATUURONDERZOEK" en
  daarna niets: de 67 pagina's van die bijlage komen voor hulpsoftware helemaal niet voor. Uit
  een telling weet je dát er pagina's zonder tags zijn; hier zie je wat dat betekent.

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

| Tekst met onvoldoende contrast | 1.4.3 |
| Onvoldoende contrast in een grafiek, diagram, kaart of betekenisvol pictogram | 1.4.11 |

**Contrast: PAC gaat voor, je eigen meting vult aan.** Hier stond eerder "PAC haalt contrast
niet betrouwbaar uit een PDF", en dat klopt niet. PAC heeft een eigen contrastcheck en meldt
"Tekst met onvoldoende contrast" met de pagina erbij. Die uitkomst neem je over.

**Meet het zelf, met een eigen commando:**

```
npm run cli -- get-pdfcontrast <pdf-url of pad> [--paginas=1,38]
```

Dat loopt het hele document af en geeft per kleurcombinatie de uitkomst, de pagina's en drie
voorbeelden. Het werkt door twee bronnen te combineren: de **tekstkleur** komt uit het document
zelf — PyMuPDF geeft per fragment de exacte kleur, corpsgrootte en plek — en alleen de
**achtergrond** komt van de beeldpunten van de gerenderde pagina. Er valt dus niets te raden
over welke beeldpunten tekst zijn. Dat was het bezwaar tegen de oude methode, en het geldt hier
niet.

PAC en dit commando spreken elkaar niet tegen: PAC zegt *dát* het contrast tekortschiet, het
commando zegt *hoeveel* en *waar*. Draai het dus ook als er PAC-uitvoer ligt.

**Op een foto of een verloop is de uitkomst een band, geen getal.** Er is daar geen enkele
contrastverhouding — hij loopt over de tekst heen. Het veld `achtergrondVlak` staat dan op
false en `formulering` geeft de band: "loopt van 1,46:1 tot 6,23:1". Neem die over en toets aan
het **slechtste** punt. Eerder stond hier dat zo'n meting daarom onbetrouwbaar was;
onbetrouwbaar is het één getal, niet de meting.

**Keur nooit af op het getal alleen.** Maak een uitsnede van de plek en leg die ernaast: een
bijschrift over een foto kan op het slechtste punt zakken en als geheel toch leesbaar zijn.

`niet_te_bepalen` blijft over voor één geval: een **scan** — een pagina met beeld maar zonder
tekstlaag, waar de tekst als foto op staat. Die komen terug onder `paginasZonderTekstlaag`;
doen ze ertoe, vraag dan een schermafdruk met een contrastmeting.

Een **lege** pagina is iets anders en komt apart terug onder `paginasLeeg`: geen tekst, geen
beeld, niets aan de hand. Vraag daar nooit een afdruk voor. Zie `Shift2_Regels_SC_1_4_3.md` en
`Shift2_Regels_SC_1_4_11.md`.

> Aanleiding: ZOET-01, september 2026. Het Detailed report van Bijlage 2 toonde een lange lijst
> "Tekst met onvoldoende contrast" met lichtblauwe tekst op wit, pagina 38 en verder. De regel
> zoals hij hier stond dwong de auditor om daar `niet_te_bepalen` van te maken, en de
> verificatiestap gooide elke contrastbevinding bij een PDF er sowieso weer uit. 1.4.3 bleef
> daardoor openstaan bij elk PDF-document in elk rapport, terwijl de meting er gewoon lag.

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
| Documenttitel, weergave ervan, taal, PDF/UA-vlag én het contrast van alle tekst (`get-pdfcontrast`) | Een schermafdruk met een contrastmeting, maar alleen voor scans (`paginasZonderTekstlaag`), niet voor lege pagina's |
| Pagina's renderen en visueel beoordelen: linkteksten, kopteksten, gebruik van kleur | Of een tekstalternatief in een getagd document juist is (PAC ziet alleen dat het er staat) |
| Bij een ongetagd document: de hele vervalroute uit `Shift2_Regels_SC_1_3_1.md`, zonder vraag — behalve contrast, dat daar gewoon beoordeeld wordt | Of de leesvolgorde inhoudelijk klopt, aan de hand van de Screen reader preview. Bij een ongetagd document: een contrastafdruk als de pagina niet meetbaar rendert |
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
5. Contrast (1.4.3, 1.4.11): `get-pdfcontrast` draaien, ongeacht of er PAC-uitvoer ligt. Op
   een foto of een verloop geef je de band en toets je aan het slechtste punt.
