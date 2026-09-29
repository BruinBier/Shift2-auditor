# Een nieuwe toegankelijke PDF opbouwen vanuit een bestaande PDF

**Status:** ONDERZOEK, nog niets gebouwd (26 september 2026)
**Hoort bij:** `pdf-tekstbeschrijving-onder-afbeelding.md` (route A, bestaande PDF aanpassen)
**Afbakening:** alleen onderzoek en een architectuurvoorstel; geen implementatie

## De vraag

Niet de bestaande, ongetagde PDF repareren, maar hem als bron gebruiken. De onderzoeker loopt
de inhoud in leesvolgorde af, element voor element, en kent per element een tag toe. De tool
bouwt daaruit een nieuwe PDF die vanaf het begin getagd is. Bij een figuur komt er een korte
alternatieve tekst bij en, als zichtbare tekst direct eronder, een uitgebreide beschrijving.
De opmaak schuift daarvoor op en loopt zo nodig door naar de volgende pagina. De vormgeving
moet zoveel mogelijk gelijk blijven aan het origineel.

- **Route A:** de bestaande PDF aanpassen en achteraf taggen.
- **Route B:** de bestaande PDF als bron gebruiken en een nieuwe PDF opbouwen.

## Conclusie in het kort

1. **Route B is haalbaar, maar alleen in één vorm: de tekeninstructies van het origineel
   overplanten, niet de inhoud opnieuw zetten.** Wie tekst uitleest en met lettertype,
   grootte en kleur opnieuw zet, krijgt een document dat er anders uitziet: andere
   regelafbreking, andere spatiëring, en lettertypen die maar half in de PDF zitten (zie de
   meting hieronder). Wie de oorspronkelijke tekeninstructies per element meeneemt en op een
   nieuwe plek neerzet, krijgt exact dezelfde weergave, want het zijn dezelfde instructies.
2. **Het moeilijke deel is in beide routes hetzelfde.** Vaststellen wat bij elkaar hoort
   (een alinea, een tabel, een grafiek, een kop- of voettekst) is het zwakke punt van route
   A en precies even zwak in route B. Route B lost dat niet op. Het verschil zit in wat er
   daarna kan.
3. **Wat route B wel oplost:** doorlopen naar de volgende pagina, en een schone tagstructuur.
   In route A kan het eerste niet (besluit van 25 september). In route B is het een
   gewone opmaakstap, omdat de tool de pagina's zelf opnieuw verdeelt.
4. **Wat route B kost:** een eigen opmaakmachine en een eigen PDF-schrijver. Dat is naar
   schatting drie tot vijf keer zoveel ontwikkelwerk als route A, en er gaat meer verloren:
   paginanummers, de inhoudsopgave en formuliervelden kloppen na herverdeling niet vanzelf.
5. **Voor welke PDF's:** documenten zoals deel 1 van TESTPDF.pdf (een Word-export, één
   kolom, geen vlakken) zijn met route B goed te doen. Vormgegeven documenten (InDesign,
   meerdere kolommen, achtergrondvlakken, tekst over foto's) zijn in geen van beide routes
   betrouwbaar. Daarvoor blijft het brondocument de enige goede weg.

Het advies staat onderaan, na de onderbouwing.

## Proefmeting: wat zit er in TESTPDF.pdf (26 september 2026)

Gemeten met PyMuPDF en pikepdf, zonder iets te wijzigen. Het document is beschreven in het
plan voor route A: 166 pagina's, een Word-export (p. 1-99) en een rapport van Bureau
Stadsnatuur (p. 100-166).

| Wat | Uitkomst | Wat het betekent voor route B |
|---|---|---|
| Lettertypen | 24, **alle 24 als deelverzameling** ingesloten | Alleen de tekens die al in het document staan zijn aanwezig. Nieuwe tekst in Calibri of Futura zetten kan niet met het ingesloten lettertype. |
| Lettertypen zonder ToUnicode | 19 van 24 | Toch leesbaar: er staan 11 onleesbare tekens op bijna 396.000. De standaardcodering volstaat hier; dat is niet bij elke PDF zo. |
| Links | 129, waarvan 120 intern | Die wijzen naar een pagina-object en een positie. Beide moeten na herverdeling omgezet worden. |
| Bladwijzers | 2 | Weinig; wel omzetten. |
| Vectorpaden | 5.147, tot 300 op één pagina | Lijnen en vlakken zijn losse streken zonder groepering. Een tabelrooster of grafiek is honderden paden. |
| Tabellen, automatisch herkend | 267 herkend, waarvan **175 met één rij of één kolom** | Op p. 125 en p. 160 valt één soortenlijst uiteen in tientallen tabelletjes van 1 bij 15. Op p. 62 wordt een gewone alinea als tabelcel gezien. Automatische tabelherkenning is hier niet bruikbaar zonder correctie door de onderzoeker. |

De tabelmeting is de belangrijkste: wie route B kiest om tabellen goed te taggen, moet een
scherm bouwen waarin de onderzoeker het rooster zelf aanwijst of corrigeert.

## Twee manieren om route B te bouwen

### B1. Opnieuw zetten

Tekst, lettertype, grootte, kleur en positie uitlezen, en met een opmaakmachine (iText,
Typst, WeasyPrint of Chrome) een nieuw document zetten.

- **Voordeel:** de opmaakmachine regelt het doorlopen, het splitsen van tabellen en de tags
  vanzelf. iText en Typst leveren PDF/UA uit zichzelf.
- **Nadeel:** het wordt een ander document.
  - Regelafbreking, uitvullen, spatiëring en tekenafstand komen niet overeen.
  - De ingesloten lettertypen zijn deelverzamelingen en vaak niet op de machine
    geïnstalleerd. Futura Std Book staat in TESTPDF.pdf; dat is een betaald lettertype.
  - Vlakken, lijnen en grafieken moeten apart nagetekend worden.

Dit is wat de vraag uitdrukkelijk niet wil: platte tekst in een andere vormgeving. B1 valt
af, behalve als terugval voor de ingevoegde beschrijvingen.

### B2. Overplanten

De inhoud van een pagina is een lijst tekeninstructies. Per element wordt vastgesteld welke
instructies erbij horen: de tekst van een alinea, de paden van een tabel, een afbeelding.
Die instructies gaan, met de lettertypen en afbeeldingen waarnaar ze verwijzen, naar een
nieuwe pagina. Een verschuiving (`cm`) zet ze op hun nieuwe plek. Om elk element komt een
markering met een MCID, die het koppelt aan de tag.

- **Voordeel:** de weergave is identiek. Het zijn dezelfde glyphs, dezelfde kleuren, dezelfde
  lijnen. Kerning en uitvulling blijven exact gelijk, want er wordt niets opnieuw gezet.
- **Voordeel:** elk element is een afgeronde eenheid met een eigen tag. Dat is precies wat
  PDF/UA vraagt.
- **Nadeel:** een alinea kan alleen tussen twee regels over een paginagrens breken, niet
  midden in een regel. De regels zelf blijven zoals ze waren.
- **Nadeel:** het ontleden moet de grafische toestand bijhouden. Kleur, lettertype, lijndikte
  en uitsnijding erven over van eerdere instructies. Elk overgeplant element moet die
  toestand meekrijgen, anders verandert zijn kleur of verdwijnt hij achter een uitsnede.
  Dat is dezelfde moeilijkheid als in route A.

**Verder in dit document is met route B steeds B2 bedoeld.**

## De twaalf vragen

### 1. Kunnen we afzonderlijke elementen betrouwbaar uit een bestaande PDF halen?

**Ja, op het niveau van tekeninstructies. Nee, op het niveau van "een alinea" of "een
tabel".**

- Een PDF kent geen alinea's. Tekst bestaat uit fragmenten met een positie. PyMuPDF voegt
  die samen tot regels en blokken, en dat gaat bij een Word-export goed.
- Bij een ongetagde PDF is er niets anders dan de geometrie om op te bouwen. De tool kan
  voorstellen doen: een blok in een groter lettertype is een kop, een regel die met een
  opsommingsteken begint is een lijstitem.
- De onderzoeker bevestigt of corrigeert. De vraag gaat daar al van uit, en dat is terecht.

### 2. Kunnen tekst, afbeeldingen en andere objecten afzonderlijk worden geïdentificeerd?

| Soort | Betrouwbaar? |
|---|---|
| Tekst, per regel, met lettertype, grootte, kleur, vet en cursief | **Ja** |
| Rasterafbeeldingen, met positie en afmeting | **Ja** |
| Vectorpaden (lijnen, vlakken) | **Ja, afzonderlijk.** Maar zonder groepering: een grafiek is honderden losse paden. |
| Welke paden en welke tekst samen één grafiek vormen | **Nee.** Dat moet de onderzoeker aanwijzen, met een rechthoek. |
| Kop- en voettekst | **Meestal**, op herhaling: dezelfde tekst op dezelfde plek op veel pagina's. |
| Tekst die als vectorpaden getekend is (omgezette letters) | **Nee.** Dat ziet eruit als tekst maar is een tekening. Alleen met OCR. |
| Gescande pagina's | **Nee.** Daar is alleen één afbeelding. Eerst OCR. |

### 3. Kunnen we de oorspronkelijke visuele eigenschappen voldoende behouden?

Met B2 wel, omdat er niets wordt nagebootst. Per eigenschap uit de vraag:

| Eigenschap | Behoud met B2 | Kanttekening |
|---|---|---|
| Tekst, lettertype, grootte, vet, cursief, kleur | Exact | Dezelfde instructies en hetzelfde ingesloten lettertype |
| Achtergrondkleur, vlakken, lijnen | Exact | Mits het vlak bij het juiste element wordt ingedeeld; een vlak achter een hele sectie moet mee met die hele sectie |
| Afbeeldingen en logo's | Exact | Het afbeeldingsobject wordt gekopieerd, niet opnieuw gecomprimeerd |
| Vectorafbeeldingen | Exact | Zie vraag 10 voor patronen en verlopen |
| Positie en witruimte | **Horizontaal exact, verticaal tot aan het invoegpunt** | Onder een ingevoegde beschrijving verschuift alles; wat doorloopt komt op een andere pagina |
| Hyperlinks | Het klikgebied moet opnieuw berekend worden | Zie vraag 11 |
| Tabellen | Visueel exact | De structuur moet apart worden aangewezen, zie vraag 9 |

Het enige dat opnieuw gezet wordt, is de ingevoegde beschrijving. Die heeft een volledig
lettertype nodig (zie vraag 6).

### 4. Kunnen we deze elementen opnieuw in een nieuwe PDF plaatsen?

**Ja.** Tekeninstructies met hun lettertypen, afbeeldingen en grafische toestanden kopiëren
naar een nieuw document is een bekende techniek. Twee manieren:

- **In de pagina-inhoud zelf**, tussen `q` en `Q`, met een eigen verschuiving. Dat is het
  eenvoudigst te taggen.
- **Als apart tekenblok** (Form XObject). Dat isoleert de grafische toestand beter, maar
  taggen binnen zo'n blok is omslachtiger. Geschikt voor een figuur, die als geheel één tag
  krijgt.

### 5. Kunnen we tijdens het opbouwen direct een correcte tagged-PDF-structuur maken?

**Ja, en hier is route B duidelijk sterker dan route A.** De tool schrijft elk element
en weet op dat moment welke tag het krijgt. De markering, het MCID, de structuurboom, de
ParentTree en de leesvolgorde ontstaan in één keer en kloppen per definitie met elkaar.

Wat er daarnaast moet gebeuren om PDF/UA-1 te halen:

- `MarkInfo` op `Marked`, `Lang`, titel, `DisplayDocTitle`, en `pdfuaid:part` in de XMP;
- alles wat geen tag krijgt, als artefact markeren; niets mag ongemarkeerd blijven;
- lettertypen die geen Unicode-koppeling hebben, een ToUnicode meegeven;
- links als `Link`-element met een verwijzing naar de annotatie, en `Contents` op de
  annotatie;
- tabellen met `TH` en `Scope`, zo nodig `Headers` en `ID`.

Na afloop altijd controleren met veraPDF (open source, doet de machinaal controleerbare
Matterhorn-punten) en PAC 2024. PAC staat al op deze machine; zie ook
`scripts/fix-pdf-tags.py`, dat een deel van deze stappen al doet voor de Word-export van het
rapport.

### 6. Kunnen zichtbare tekstbeschrijvingen eenvoudig tussen bestaande onderdelen worden ingevoegd?

**Ja. In route B is dit het eenvoudigste onderdeel.** De beschrijving is gewoon het volgende
element in de rij: een `P` direct na de `Figure` (of na het bijschrift, conform het besluit
van 25 september).

- De tekst moet wel gezet worden, met regelafbreking. Dat is een klein stukje opmaak, geen
  volledige opmaakmachine.
- Het lettertype moet volledig ingesloten zijn, met Unicode-koppeling. Het lettertype van het
  document zelf is een deelverzameling (zie de meting). Het beste lijkt een open lettertype
  dat dicht bij het origineel ligt, bijvoorbeeld Carlito voor Calibri. Het verschil zal
  zichtbaar blijven; dat is onvermijdelijk.
- Grootte, kleur en regelafstand kunnen overgenomen worden van de gewone tekst in het
  document, zodat de beschrijving er zo min mogelijk uitspringt.

### 7. Kan de nieuwe layout automatisch over pagina's doorlopen?

**Ja, maar met gevolgen die verder gaan dan de pagina zelf.**

- De tool plaatst elementen van boven naar beneden, met de oorspronkelijke verticale
  afstanden. Past een element niet meer, dan gaat hij naar de volgende pagina.
- Een alinea kan tussen regels breken. Een afbeelding, figuur of tabelrij niet.
- Elke nieuwe pagina krijgt de kop- en voettekst van de oorspronkelijke pagina opnieuw, als
  artefact.

Dan de gevolgen:

- **Het houdt niet op.** Eén beschrijving van tien regels op pagina 12 verschuift alles tot
  het einde van het hoofdstuk, of van het document.
- **Paginanummers in de voettekst** zijn getekende tekens. Het nummer "12" op een pagina die
  nu 13 is, moet opnieuw getekend worden. Dat kan alleen als de cijfers in de deelverzameling
  van het lettertype zitten. Bij een paginanummer zit dat er vrijwel zeker in, maar niet
  gegarandeerd.
- **De inhoudsopgave** toont paginanummers als getekende tekst. Die moeten allemaal
  opnieuw, of de onderzoeker moet besluiten dat ze niet meer kloppen.
- **Witruimte aan de onderkant van pagina's** verandert: een pagina eindigt waar het volgende
  element niet meer past, en dat kan een halve pagina leeg laten (bij een grote afbeelding).

Er is een tussenvorm die de meeste gevolgen vermijdt: **alleen binnen het hoofdstuk
doorlopen**, of alleen tot de eerstvolgende pagina met veel vrije ruimte. Dat kan in route B
omdat de tool de verdeling zelf in handen heeft. Het is een ontwerpkeuze voor het proof of
concept.

### 8. Hoe gaan we om met elementen die over meerdere pagina's lopen?

In het origineel zijn dat twee losse stukken. In route B worden ze één element, en dat is
een verbetering ten opzichte van het origineel:

- **Een alinea over twee pagina's:** één `P` met inhoud op beide pagina's. Een tag mag over
  meerdere pagina's lopen. De tool moet herkennen dat de laatste regel van pagina 7 en de
  eerste regel van pagina 8 bij elkaar horen; dat kan op stijl en op het ontbreken van een
  punt, maar de onderzoeker moet het kunnen corrigeren.
- **Een lijst of tabel over twee pagina's:** één `L` of `Table`. Herhaalde koprijen van een
  tabel op de tweede pagina worden artefact; in de nieuwe verdeling tekent de tool ze zelf
  opnieuw waar de tabel breekt.
- **Voetnoten:** blijven onderaan de pagina waar de verwijzing staat. Verschuift de
  verwijzing naar een andere pagina, dan moet de voetnoot mee. Dat is extra logica; voor het
  proof of concept kan de tool weigeren als er voetnoten zijn.

### 9. Hoe gaan we om met complexe tabellen?

Dit is het zwaarste onderdeel na het ontleden, en de meting laat zien waarom.

- **Weergave: betrouwbaar.** De lijnen, vlakken en celteksten worden overgeplant zoals ze
  zijn. De tabel ziet er precies zo uit.
- **Structuur: niet automatisch.** Automatische herkenning splitst in TESTPDF.pdf één
  soortenlijst in tientallen tabelletjes. De onderzoeker moet het rooster aanwijzen: waar de
  tabel begint en eindigt, welke rijen kop zijn, welke cellen samengevoegd zijn.
- **Samengevoegde cellen:** `RowSpan` en `ColSpan` op de cel.
- **Meerdere koprijen of rijkoppen:** `Scope` volstaat vaak; bij onregelmatige tabellen
  `Headers` en `ID` per cel.
- **Tabellen zonder lijnen** (alleen uitgelijnde tekst): het rooster is alleen uit de
  uitlijning af te leiden. Nog minder betrouwbaar; de onderzoeker wijst aan.
- **Breken over een pagina:** alleen tussen rijen. De koprijen worden op de nieuwe pagina
  opnieuw getekend en als artefact gemarkeerd.
- **Een cel die hoger is dan een pagina:** kan niet gebroken worden. De tool meldt het.
- **Een tabel die eigenlijk een opmaaktabel is:** geen `Table`, maar de inhoud als gewone
  elementen. De onderzoeker beslist.

Nodig in de interface: een scherm waarin de voorgestelde rasterlijnen over de tabel liggen en
de onderzoeker ze kan verschuiven, samenvoegen en markeren als kop.

### 10. Hoe gaan we om met vectorafbeeldingen en grafieken?

- **Als geheel overplanten.** De onderzoeker trekt een rechthoek. Alles wat daarbinnen
  getekend wordt (paden, labels, legenda) wordt één `Figure`. De tekst van de labels zit in
  de figuur en wordt niet apart voorgelezen; de betekenis komt uit het alternatief en de
  beschrijving.
- **Uitsnijding:** een grafiek gebruikt vaak een uitsnede. Die moet mee, anders tekent de
  grafiek buiten zijn kader.
- **Patronen en verlopen verschuiven niet vanzelf mee.** Het coördinatenstelsel van een patroon
  hangt aan de pagina, niet aan de verschuiving. Wie een vlak met een verloop 200 punten naar
  beneden zet, ziet het verloop op de oude plek blijven staan. Oplossing: de figuur als apart
  tekenblok (Form XObject) overplanten, waarin het patroon mee verhuist, of de matrix van
  het patroon aanpassen.
- **Doorzichtigheid en maskers:** een figuur die half over een achtergrond ligt, mengt met
  die achtergrond. Wordt de achtergrond niet meeverplaatst, dan verandert de kleur. De tool
  moet waarschuwen als een figuur een ander element overlapt dat niet meegaat.
- **Een grafiek die een deel van een groter tekenblok is:** dat blok moet in zijn geheel mee,
  of herschreven worden. Hetzelfde probleem als in route A.

### 11. Hoe gaan we om met hyperlinks, bladwijzers en interne verwijzingen?

Een link is geen tekst maar een los klikgebied boven de pagina. Hij moet opnieuw aangemaakt
worden.

- **Externe links:** het klikgebied hoort bij de tekst eronder. De tool koppelt link en
  element via overlap, en rekent het gebied opnieuw uit bij de nieuwe positie. Betrouwbaar.
- **Interne links en bladwijzers:** die wijzen naar een pagina en een hoogte. De tool houdt
  bij waar elk element terechtkomt en zet de bestemming om: "p. 14, y=520" wordt "het element
  dat daar stond", en dat wordt "p. 16, y=300". Betrouwbaar, mits de bestemming bij een
  element hoort. Een bestemming die naar een lege plek wijst, gaat naar het eerstvolgende
  element.
- **De zichtbare inhoudsopgave:** de links werken na omzetting. De getoonde paginanummers
  niet, zie vraag 7.
- **Een link die over twee regels afbreekt:** één link met twee klikgebieden. Moet samen
  blijven, ook als de regels over een paginagrens gaan.
- Elke link krijgt een `Link`-tag en een `Contents`, wat PDF/UA vraagt.

### 12. Welke informatie uit de oorspronkelijke PDF kan bij deze aanpak verloren gaan?

**Gaat verloren of verandert, tenzij er iets voor gebouwd wordt:**

- de exacte paginaverdeling vanaf het eerste invoegpunt;
- paginanummers in kop- of voettekst en in de inhoudsopgave;
- de verwijzing "zie pagina 23" in lopende tekst: dat is gewone tekst en blijft 23;
- formuliervelden, knoppen en JavaScript: moeten opnieuw worden aangemaakt;
- opmerkingen, markeringen en andere annotaties;
- lagen (optionele inhoud);
- bijlagen in de PDF, en metagegevens die de tool niet meeneemt;
- een digitale handtekening: vervalt altijd, in beide routes;
- instellingen voor drukwerk (overdruk, steunkleuren): meestal behouden, niet getest.

**Is er niet uit te halen, in geen enkele route:**

- tekst die als paden getekend is, of gescande pagina's (alleen met OCR);
- structuur die er nooit in zat; de onderzoeker legt die aan;
- tekst achter een lettertype zonder Unicode-koppeling en met eigen codering: leesbaar
  weergegeven, maar als tekens onbekend. Zeldzaam, maar dan moet het met de hand.

## Welke techniek

### Analyse: de bron lezen

| | Geschikt? | Waarom |
|---|---|---|
| **PyMuPDF** (al in het project) | **Beste keus** | Tekst per regel met stijl, afbeeldingen, paden, links, tabelvoorstellen. Snel. AGPL of commercieel. |
| **pikepdf** (al in het project) | **Aanvulling** | De tekeninstructies letterlijk lezen en overzetten, met de verwijzingen naar lettertypen en afbeeldingen. Geen geometrie. MPL, vrij. |
| **Apache PDFBox** | Kan ook | `PDFStreamParser` en `PDFTextStripper` met posities. Alles zelf bouwen, in Java. Apache 2.0. |
| **Apryse** (`ElementReader`) | Sterk | Leest per element met de grafische toestand al uitgerekend. Dat scheelt het moeilijkste stuk eigen code. Commercieel. |
| **Foxit** (page objects) | Sterk | Vergelijkbaar: per tekst-, pad- of afbeeldingsobject, met positie en toestand. Commercieel. |

### Schrijven: de nieuwe PDF

| | Overplanten (B2) | Tags zelf opbouwen | Opmaakmachine | Licentie |
|---|---|---|---|---|
| **pikepdf** | **Ja**, laag niveau: instructies en objecten kopiëren tussen documenten | Ja, alles met de hand (structuurboom, ParentTree) | Nee | vrij |
| **Apache PDFBox 3** | Ja, laag niveau (`ContentStreamWriter`, `LayerUtility`) | Ja, met eigen klassen voor de structuurboom | Nee | vrij |
| **iText 9** | Deels: een pagina als tekenblok kan, losse instructies alleen via de ruwe canvas | **Ja, het sterkst**: tagging en PDF/UA-1 en -2 ingebouwd | **Ja**, met doorlopen en tabelsplitsing | AGPL of commercieel |
| **Apryse** | **Ja**: `ElementWriter` schrijft gelezen elementen in een ander document | Ja, via de structuur-API (nog na te gaan hoe volledig) | Beperkt | commercieel |
| **Foxit** | Ja: objecten klonen naar een andere pagina | Na te gaan | Beperkt | commercieel |

Niet geschikt voor dit doel, maar wel het vermelden waard:

- **PDFix SDK, axesPDF, CommonLook:** gespecialiseerd in het taggen van een bestaande PDF.
  Dat is route A, professioneel uitgevoerd. De markt voor PDF-herstel werkt vrijwel
  helemaal volgens route A. Dat is geen toeval: het behoudt de vormgeving en de paginering.
- **Adobe PDF Services Auto-Tag:** een clouddienst. Klantdocumenten gaan dan naar een externe
  dienst. Om dezelfde reden is de OpenAI-knop voor transcripten op 15 september verwijderd.
  Valt af.
- **Typst, WeasyPrint, Chrome** (`page.pdf` met tagging, al gebruikt voor het rapport):
  alleen voor B1, opnieuw zetten. Valt af om de vormgeving.
- **veraPDF:** geen bouwsteen, maar de controle achteraf. Open source.

### Voorgestelde combinatie

**Python als backend, PyMuPDF voor de analyse, pikepdf voor het schrijven, een eigen kleine
opmaaklaag, veraPDF en PAC voor de controle.** Alles staat er al, behalve veraPDF.

- De opmaaklaag is kleiner dan hij klinkt. Hij zet geen tekst; hij plaatst blokken met een
  vaste hoogte onder elkaar en breekt tussen blokken of tussen regels. Alleen de ingevoegde
  beschrijving moet gezet worden.
- Het grootste risico zit in het bijhouden van de grafische toestand bij het overplanten.
  Blijkt dat in het proof of concept te bewerkelijk, dan een proeflicentie van Apryse: die
  levert elementen met de toestand al uitgerekend en schrijft ze in een ander document. Dat
  is precies het stuk dat het meeste eigen werk kost.
- iText is sterk in tags en opmaak, maar zwak in overplanten. Dat maakt het voor B2 minder
  geschikt dan het lijkt.

## Architectuur (voorstel, als route B doorgaat)

```
bron-PDF
   │
   ▼
1. Analyse (PyMuPDF + pikepdf)
   per pagina: regels, afbeeldingen, paden, links, met hun tekeninstructies en toestand
   │
   ▼
2. Voorstel (JSON)
   blokken met voorgestelde rol en leesvolgorde; kop en voet als artefact op herhaling
   │
   ▼
3. Scherm in de Auditor: bron links, nieuw rechts
   onderzoeker kiest per blok de tag, voegt blokken samen of splitst ze,
   wijst tabelroosters en figuurgebieden aan, vult alt en beschrijving in
   │
   ▼
4. Opmaak
   blokken onder elkaar, oorspronkelijke x-positie en tussenruimte,
   beschrijvingen ingevoegd, breken tussen blokken of regels, kop en voet opnieuw per pagina
   │
   ▼
5. Schrijven (pikepdf)
   instructies overplanten met verschuiving en MCID, structuurboom, links en bladwijzers
   omgezet, lettertype voor beschrijvingen ingesloten, XMP en PDF/UA-kenmerken
   │
   ▼
6. Controle
   - veraPDF en PAC: PDF/UA
   - alle tekst van de bron staat er precies één keer in, in dezelfde volgorde per blok
   - niets overlapt, niets valt buiten de pagina
   - elke link heeft een bestemming
   faalt iets, dan weigert de tool en toont waarom
```

Het tussenmodel uit stap 2 en 3 is de kern: een lijst blokken met hun rol, hun
tekeninstructies en hun plek. Het wordt opgeslagen, zodat de onderzoeker het werk kan
onderbreken en een tweede versie van de PDF opnieuw op dezelfde keuzes kan bouwen.

## Route A tegenover route B

| | A. Bestaande PDF aanpassen en taggen | B. Nieuwe PDF opbouwen (B2) |
|---|---|---|
| **Vormgeving** | Blijft staan, op de pagina's zonder invoeging exact | Per element exact; de paginaverdeling verandert na het eerste invoegpunt |
| **Betrouwbaarheid** | Hoog zolang er niets verschuift; verschuiven binnen de pagina alleen bij eenvoudige opmaak | Hangt af van het overplanten; bij eenvoudige opmaak goed, bij vormgegeven documenten laag |
| **PDF/UA** | Haalbaar: bestaande inhoud in markeringen verpakken en een structuurboom aanleggen. Omslachtiger, maar professionele tools doen niet anders | Haalbaar en schoner: alles ontstaat in één keer en klopt per definitie |
| **Tagstructuur** | Moet achteraf passend gemaakt worden op inhoud die in een willekeurige volgorde getekend is | Volgt uit de volgorde van opbouwen |
| **Leesvolgorde** | Structuurboom in de goede volgorde, tekenvolgorde blijft zoals hij was (mag) | Structuur en tekenvolgorde zijn dezelfde |
| **Tabellen** | Rooster aanwijzen nodig, even moeilijk; splitsen over pagina's niet nodig | Rooster aanwijzen nodig; splitsen en koprijen herhalen erbij |
| **Afbeeldingen** | Blijven staan; alleen taggen | Overplanten; patronen en overlap vragen aandacht |
| **Uitgebreide beschrijving invoegen** | Alleen als het op de pagina past (bij ongeveer de helft van de figuren in TESTPDF.pdf niet, bij drie regels of meer) | **Altijd**, met doorlopen |
| **Links, bladwijzers, inhoudsopgave** | Blijven kloppen | Moeten omgezet worden; getoonde paginanummers kloppen niet meer |
| **Formulieren, annotaties** | Blijven staan | Moeten opnieuw aangemaakt worden |
| **Ontwikkelwerk** | Analyse + verschuiven + taggen | Analyse + overplanten + opmaaklaag + volledige schrijver + omzetten van links; ruwweg drie tot vijf keer zoveel |
| **Onderhoud** | Minder code, maar elke rare PDF raakt het verschuiven | Meer code, maar elk onderdeel is afgebakend en afzonderlijk te testen |

**Het wezenlijke verschil:** in beide routes moet eerst hetzelfde ontleed worden, en is dat
het zwakke punt. Route B voegt daar een opmaaklaag en een schrijver aan toe. In ruil daarvoor
kan de beschrijving altijd geplaatst worden, en is de tagstructuur schoner. Route A houdt
alles wat niet verandert precies zoals het was.

**Wat niet uit een willekeurige PDF te reconstrueren is**, in welke route dan ook: de logische
structuur (die legt de onderzoeker aan), tabellen zonder correctie, tekst die als paden of
als scan in het document staat, en een getoonde paginanummering die na herverdeling nog klopt.

## Advies

Beide routes zijn technisch te verdedigen, voor een ander soort document en een ander doel.

- **Is het doel vooral taggen,** en past de beschrijving meestal op de pagina: **route A**. Minder
  code, en alles wat niet verandert blijft precies zoals het was.
- **Is het doel dat elke figuur een beschrijving van willekeurige lengte kan krijgen:** dat
  kan alleen **route B**. De meting van 25 september zegt dat dit bij de helft van de figuren
  nodig is. Daarmee is route B de enige die de oorspronkelijke vraag volledig beantwoordt.
- **Bij vormgegeven documenten** (meerdere kolommen, vlakken, tekst over beeld) is geen van
  beide betrouwbaar. De tool moet zulke documenten bij de analyse herkennen en weigeren, met
  het advies om het brondocument aan te passen. Voor een Word-export is dat laatste ook
  altijd de betere weg, als het brondocument er is.

Een proof of concept voor route B is zinvol als het dit beantwoordt, in deze volgorde:

1. **Overplanten zonder invoegen.** Tien pagina's uit deel 1 van TESTPDF.pdf element voor
   element overzetten naar een nieuwe PDF, met tags. Klopt de weergave beeldpunt voor
   beeldpunt? Dat is te meten door beide te renderen en te vergelijken. Dit is de
   doorslaggevende proef: lukt dit niet, dan valt route B af.
2. **Eén beschrijving invoegen, met doorlopen** over die tien pagina's, inclusief omgezette
   links en herhaalde kop en voet.
3. **Eén tabel** uit deel 2 (p. 125 of 160), met een door de onderzoeker aangewezen rooster.
4. **veraPDF en PAC** op het resultaat.

Stap 1 en 4 samen zijn klein genoeg om snel te bouwen en zeggen het meest.

## Open punten

- Doorlopen tot het einde van het document, of alleen tot het einde van het hoofdstuk of de
  eerstvolgende pagina met ruimte? (vraag 7)
- Wat gebeurt er met getoonde paginanummers en de inhoudsopgave: opnieuw tekenen, of de
  onderzoeker laten besluiten?
- Welk lettertype voor de beschrijving, als het origineel niet vrij beschikbaar is?
- Is er budget voor een proeflicentie van Apryse, als het overplanten met pikepdf te
  bewerkelijk blijkt?
- De vragen uit het plan voor route A (proefset, foto's met één gezamenlijk bijschrift)
  gelden hier net zo.
