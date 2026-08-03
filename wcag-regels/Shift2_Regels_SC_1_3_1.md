# Shift2-beoordelingsregels SC 1.3.1

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_1_3_1.md` als ze elkaar tegenspreken.

## Regels

- KOP ZONDER INHOUD: loop de koppenlijst van de pagina na en kijk of er twee koppen van HETZELFDE niveau direct achter elkaar staan, zonder tekst ertussen. Dat is een AFKEURING (klein tot matig, redacteur), QuickFinding a3fe111f-e625-4891-99b2-8b7792be6a4e.
  FORMULEER DIT ALS EEN LEGE SECTIE, NIET ALS EEN REGEL OVER KOPPEN. WCAG eist niet dat elke kop inhoud heeft: een `<h2>Tekst</h2>` is technisch correct, ook als er direct een andere h2 op volgt. Schrijf dus NOOIT "Een kop moet altijd inhoud hebben" — dat is een onjuiste WCAG-uitspraak. Beschrijf in plaats daarvan dat er geen content tussen de twee koppen staat, dat dit een lege sectie in de paginastructuur creëert, en dat wie via de koppen navigeert op een kop landt waar geen informatie onder staat.
  Kijk of de eerste kop bedoeld is als groepstitel boven de onderwerpen die erna komen: adviseer dan die volgende koppen een niveau lager te maken. Zijn de koppen IDENTIEK, dan is er meestal een dubbele kop die weg kan; speculeer niet over de oorzaak ("fout in de invoer") maar benoem wat er staat. Bij een uitklapblok: de titel van het blok is al een kop, en een tweede kop met dezelfde tekst daarbinnen kan weg.
  Voorbeelden: BEV-03 B023 (energietransitie), waar "Wat speelt er allemaal in de gemeente?" als h2 direct gevolgd werd door de h2 "Energietransitie (aardgasvrij Beverwijk)". UTHEU-01 B014 (Paspoort), waar de kop "Spoedaanvraag" twee keer achter elkaar stond in een uitklapblok.
- KOPPEN: 1.3.1 gaat over het kopniveau, de nesting en of het wel een echt kop-element is. Of de KOPTEKST beschrijft waar het onderdeel over gaat, hoort onder 2.4.6. Kom je een kop tegen die zowel niet-beschrijvend is als verkeerd genest ("TIP!" als h3 onder een niet-passende h2), maak dan BEIDE bevindingen. Zie Shift2_Regels_SC_2_4_6.md.
- TABELLEN ZIJN ALTIJD REDACTIE. Zowel een tabel zonder tabelkoppen als een tabel die voor vormgeving wordt gebruikt: responsibility is **redacteur**, niet ontwikkelaar. De redacteur maakt de tabel in het CMS en kan hem daar ook aanpassen. Vastgelegd door Frits op 2026-08-03 bij UTHEU-01 (B017 en B021).
- TABEL VOOR VORMGEVING: staan er afbeeldingen of tekstblokken in een tabel zonder dat er gegevens in rijen en kolommen aan elkaar gerelateerd zijn, dan is dat een AFKEURING (matig, redacteur). Formuleer het concreet: "Een tabel is bedoeld om gegevens te tonen die in rijen en kolommen bij elkaar horen, zoals openingstijden of tarieven." Schrijf niet alleen "een tabel is niet voor vormgeving" — dat is te abstract. Er bestaat hiervoor alleen een PDF-QuickFinding (a61a6bfd-...), geen HTML-variant. Voorbeeld: UTHEU-01 B017 (zes foto's in een tabel).
- TABELKOPPEN ONTBREKEN: is de bovenste rij visueel een koprij maar in de code gewone `td`-cellen, dan is dat een AFKEURING (klein, redacteur). QuickFindings fc7eeab0-... en e1dfc0a8-... (die twee overlappen). Voorbeeld: UTHEU-01 B021.
  RIJKOPPEN: eis die alleen als de eerste kolom de rij BENOEMT en de overige cellen eigenschappen daarvan zijn (bijvoorbeeld "Paspoort" met daarnaast kosten en geldigheidsduur). Is de eerste kolom een volgnummer of gewoon het eerste gegeven, dan zijn er geen rijkoppen nodig; dan zou hulpsoftware bij elke cel dat nummer voorlezen.
- LEGE KOP: concludeer nooit "lege kop" op basis van een regex als <h2></h2>. Check de werkelijke inhoud, want de tekst kan in een geneste <span>, <a> of <i18n> staan. Extra alert bij koppen met id="main-content" of vergelijkbare skip-targets.
- em-element voor puur visuele cursivering (labels, titels van werken, namen): AFKEURING, impact klein, responsibility redacteur. Het em-element is alleen voor spraaknadruk. Advies: em verwijderen, cursivering via CSS. Geen suggestie voor het cite-element toevoegen, en geen tussenzin als "terwijl dat niet past bij het doel van dat element". Meerdere voorkomens samenvoegen in een bevinding.
- strong rondom KNOP- of LINKtekst: OPMERKING, geen afkeuring. Impact en responsibility leeg. Advies eindigt met de zin "Dit is een best practice."
- strong gebruikt als visuele subkop of overbodig binnen een kop: advies altijd in twee delen splitsen. 1) hulpsoftware kondigt een kop al programmatisch aan, het strong-element voegt daar niets aan toe, 2) de visuele opmaak kan met CSS geregeld worden. Niet schrijven dat het kop-element "zelf al voor de gewenste visuele nadruk zorgt".
- Lijst met slechts een <li>: OPMERKING, geen afkeuring. Impact en responsibility leeg, advies eindigt met "Dit is een best practice."
- Overzichtspagina waar een kaart bestaat uit titel-link + datum + afbeelding zonder tekstuele samenvatting: de titel hoeft GEEN kop te zijn. Geen bevinding. Alleen wel een bevinding als er onder de titel ook een samenvatting/intro staat.
- FOOTER, sociale-media-links: actief controleren of ze in <ul><li> staan. Losse <a>-elementen in een <p> is een bevinding (matig, redacteur). QuickFinding bd5fa272-7ee8-4d25-ab73-ec05a88bdf21. Alleen op de homepage beoordelen. LET OP: controleer bij dezelfde links ook de LINKTEKST onder 2.4.4. Staat er alleen "Facebook" of "Instagram" zonder de organisatie, dan is dat een aparte afkeuring onder 2.4.4. Zie Shift2_Regels_SC_2_4_4.md. Eén footerkolom kan dus twee bevindingen opleveren.
- FOOTER, adres en contactopties: actief controleren of het adres in een eigen <p> staat en telefoon/WhatsApp/contactformulier in een <ul><li>. Alles in een <p> met <br>-regeleinden is een bevinding (matig, redacteur). Noem letterlijk de kop van de footer-kolom en de concrete items, geen verzamelterm "contactgegevens". Alleen op de homepage beoordelen.
- PDF met lijststructuur L > LI > LBody: correct onder WCAG. Een ontbrekend Lbl is GEEN 1.3.1-fout. Alleen afkeuren als de lijststructuur fundamenteel ontbreekt (losse P-elementen met bullet-tekens) of onjuist is.
- Niet-getagde PDF: de ontbrekende tagstructuur afkeuren onder 1.3.1 (dit is de wortel-oorzaak). Criteria die je alleen kunt beoordelen wanneer er tags zijn, keur je NIET apart af als gevolg van diezelfde oorzaak. De scheidslijn is NIET "het document is niet getagd, dus niets is te beoordelen". De vraag is
per criterium: gaat het over iets **programmatisch** (dat bestaat zonder tags niet) of over de
**inhoudelijke kwaliteit van de tekst** (die staat er gewoon, tags of niet)?

**Vervallen — programmatisch, bestaat niet zonder tags:**

| SC | Status | Waarom |
|---|---|---|
| **1.1.1** | opmerking | niet vast te stellen wat aan tekstalternatieven ontbreekt |
| **1.3.2** | `niet_te_bepalen` | geen programmatische leesvolgorde |
| **1.4.5** | `niet_te_bepalen` | geen onderscheid tussen tekst en afbeelding voor hulptechnologie |
| **3.2.4** | `niet_te_bepalen` | geen herkenbare onderdelen om de identificatie van te vergelijken |

**WEL beoordelen — visueel te toetsen, ook zonder tags:**

| SC | Wat je beoordeelt |
|---|---|
| **2.4.4** | Zie je een link of een webadres in de tekst? Lees dan of die tekst duidelijk maakt waar hij heen leidt. Geen "klik hier" of "lees meer" zonder context. Dat de link niet klikbaar is, is hier niet de vraag. |
| **2.4.6** | Staan er koppen boven de paragrafen? Beoordeel of die tekst de lading van de alinea dekt. De technische werking van de kop valt onder 1.3.1, de inhoudelijke relevantie onder 2.4.6. |

Bij 2.4.4 en 2.4.6 geef je dus een echt oordeel: voldoet, of een afkeuring als de tekst niet
deugt. Zet ze niet op `niet_te_bepalen` met "geen tags" als reden.

Vastgelegd door Frits op 2026-08-02 bij UTHEU-01. Eerst stonden 2.4.6 en 3.2.4 allebei in de
vervallijst; Frits corrigeerde dat: 2.4.4 en 2.4.6 gaan over de tekst zelf en zijn visueel te
toetsen.
- Zelfde issue op meerdere paginas: NIET telkens een nieuwe bevinding. Bestaande bevinding uitbreiden met het extra sample-item.
