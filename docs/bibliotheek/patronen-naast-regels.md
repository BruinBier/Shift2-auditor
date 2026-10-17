# Patronen naast de regelbestanden

Eenmalig overzicht bij besluit 8 van `docs/bibliotheek/SPEC.md` (Regelbestand is leidend). Het is een werklijst voor het vaststellen van de 69 conceptpatronen uit `seed-bibliotheek.json`. Er is niets gewijzigd: geen patroon, geen regelbestand, geen seed en geen database.

| Uitkomst | Aantal |
|---|---|
| Botst met regel | 8 |
| Geen regel over dit onderwerp | 16 |
| Klopt met regel | 45 |
| Totaal | 69 |

## Hoe te lezen

- Elk patroon staat precies een keer in dit bestand, onder zijn zwaarste uitkomst.
- Een patroon met meerdere criteria is aan elk van zijn criteria getoetst. Een botsing op een van de twee maakt het een botsing; ontbreekt voor een van de twee criteria het regelbestand, dan staat dat in de toelichting.
- Zekerheid bij een botsing: "duidelijk" als de regel het geval zelf noemt, "mogelijk" als ik het afleid uit de regel of de regel iets niet uitschrijft, "deels" als het oordeel klopt maar de onderbouwing botst.
- Dit is mijn lezing van de regelbestanden, niet een besluit. Bij "mogelijk" beslist Frits.
- Drie criteria van de patronen hebben geen regelbestand: 2.1.1, 2.4.7 en 4.1.3. Andere regelbestanden noemen ze alleen in het voorbijgaan.

## 1. Botst met regel

### CAPTCHA zonder doel en alternatief

- Patroon: `P-111-captcha`, criteria 1.1.1, oordeel afkeur
- Regelbestand: 1.1.1
- Zekerheid van de botsing: mogelijk

Regel, stap 6: CAPTCHA's, videospelers en PDF's hebben "een eigen route. Die beoordeel je niet op hun alt." Het patroon keurt mede af op het alternatief "captcha" dat het doel niet beschrijft. Het tweede deel (geen alternatief in een andere zintuiglijke modaliteit) past wel bij de kaarttekst: "bij een CAPTCHA hoort een andere vorm". De regel zegt niet wat die eigen route inhoudt, dus de botsing is deels een leemte.

**Voorstel: Patroon aanpassen.** Laat de afkeur staan, maar baseer hem alleen op het ontbrekende alternatief in een andere zintuiglijke modaliteit (bijvoorbeeld een audiocode). Haal het stuk over het alternatief "captcha" weg. Leg daarna in het regelbestand vast wat de "eigen route" van een CAPTCHA inhoudt, want dat staat er nu niet.

### Decoratieve hero met beschrijvende alt

- Patroon: `P-111-hero-beschrijvend`, criteria 1.1.1, oordeel advies
- Regelbestand: 1.1.1
- Zekerheid van de botsing: duidelijk

Regel (F38, F39, H67): een decoratieve afbeelding die toch wordt voorgelezen is een afkeuring, QuickFinding "Decoratieve afbeelding zonder lege alt-tekst" (klein, redacteur): "Het probleem is de onnodige alt." Het patroon noemt dit advies en "geen afkeur". Let ook op de heroregel: het CMS zet het alternatief van een hero altijd leeg, dus het advies "alt leeg, consequent voor alle hero's" is voor de redacteur niet uitvoerbaar; de regel adviseert tekst op de pagina.

**Voorstel: Patroon aanpassen.** Oordeel naar afkeur (klein, redacteur). Het advies wordt: de tekst als gewone tekst op de pagina zetten, want de redacteur kan de alt van een hero niet invullen.

### Icoon en tekst dubbel in link

- Patroon: `P-111-dubbele-alt-link`, criteria 1.1.1, oordeel advies
- Regelbestand: 1.1.1
- Zekerheid van de botsing: duidelijk

Regel: een icoon dat hetzelfde zegt als de tekst ernaast is decoratief, en een decoratieve afbeelding met een alt is een afkeuring (F38, F39, H67). Dubbele voorlezing is volgens de regel ook zelf een bevinding (bij alt en onderschrift: "Staat in beide dezelfde tekst, dan is dat een bevinding wegens dubbele voorlezing"). Het patroon zegt: dubbelop, maar geen afkeur.

**Voorstel: Patroon aanpassen.** Oordeel naar afkeur (klein, redacteur), advies alt="" op het icoon. De regel noemt dubbele voorlezing zelf een bevinding.

### Dubbele br als witregel

- Patroon: `P-131-br-witregels`, criteria 1.3.1, oordeel geen afkeur
- Regelbestand: 1.3.1
- Zekerheid van de botsing: mogelijk

Regel, "Op de kaart": "Alles wat op het scherm structuur aangeeft - een kop, een opsomming, een tabel, een alinea - moet ook in de code als zodanig zijn vastgelegd." De tabel bij het criterium noemt "Alinea's: losse regels met br in plaats van p" als punt om na te lopen, en stap 6 vraagt "staat elke alinea in een p?". Het patroon zegt dat WCAG niet eist dat alinea's een p zijn en geeft geen afkeur. De regel zegt niet uitdrukkelijk wat de uitkomst is van dubbele br, maar de kernzin wijst naar een bevinding.

**Voorstel: Regel verduidelijken, patroon blijft.** De regel zegt niet wat de uitkomst is, en het besluit van 2026-10-11 is "volg W3C". W3C eist geen p voor alinea's. Voeg een regel toe: dubbele br is geen afkeur, hooguit een opmerking. Dat is jouw keuze, want het is een nieuwe regel.

### em om een citaat

- Patroon: `P-131-em-citaat`, criteria 1.3.1, oordeel geen afkeur
- Regelbestand: 1.3.1
- Zekerheid van de botsing: duidelijk

Regel: "em-element voor puur visuele cursivering (labels, titels van werken, namen, gewone zinnen): AFKEURING, impact klein, responsibility redacteur. Nooit een opmerking." Het patroon zegt geen afkeur en noemt blockquote of CSS als advies. Een heel citaat in em draagt geen spraaknadruk, dus de regel keurt het af. De regel zegt ook dat het advies de CMS-knop "schuingedrukt" is, niet CSS.

**Voorstel: Patroon aanpassen.** Oordeel naar afkeur (klein, redacteur). Advies: em verwijderen en, als de redacteur cursief wil, de CMS-stijl "schuingedrukt" gebruiken (geen CSS, geen blockquote).

### strong in th

- Patroon: `P-131-strong-in-th`, criteria 1.3.1, oordeel geen afkeur
- Regelbestand: 1.3.1
- Zekerheid van de botsing: mogelijk

Regel: "b en i zijn toegestaan, strong en em niet, voor puur visuele opmaak." Een strong in een th, dat al vet is en zijn belang via th draagt, beweert belang dat er niet is. De regel noemt het geval niet; het dichtst bij komt "strong gebruikt als visuele subkop of overbodig binnen een kop" (advies in twee delen, type niet vastgelegd) en "strong rondom knop- of linktekst: opmerking". Het patroon zegt "geen toegankelijkheidsfout"; de regel laat dat niet toe zonder uitzondering voor th.

**Voorstel: Patroon aanpassen.** Oordeel naar advies (opmerking, "Dit is een best practice."), in lijn met strong rond knop- of linktekst. Een afkeur is te streng voor een strong in een th, een geen-afkeur te soepel voor een regel die strong zonder belang afkeurt. Twijfel je, dan is afkeur de strikte lezing.

### Zelfde gekoppelde foutmelding per veld

- Patroon: `P-331-zelfde-melding`, criteria 3.3.1, oordeel geen afkeur
- Regelbestand: 3.3.1
- Zekerheid van de botsing: deels

Het oordeel (geen afkeur) klopt met de regel. De onderbouwing botst op een punt: het patroon zegt dat het "wel een afkeur" zou zijn als de meldingen niet gekoppeld zijn. Regel: "Of de foutmelding programmatisch aan het veld hangt (aria-describedby, aria-invalid, role=alert) hoort bij 1.3.1 en 4.1.3 ... Bij 3.3.1 beoordeel je of de melding er in tekst staat." Een niet-gekoppelde melding is dus geen 3.3.1-afkeur. Wel een afkeur: melding op een andere plek zonder veldnaam. Het advies "noem het veld in de melding" past bij de regel.

**Voorstel: Patroon aanpassen.** Oordeel blijft geen afkeur. Haal de zin weg dat een niet-gekoppelde melding een 3.3.1-afkeur is, en verwijs daarvoor naar 1.3.1 en 4.1.3. Laat de afkeur voor "melding op een andere plek zonder veldnaam" staan.

### iframe met generieke titel

- Patroon: `P-412-iframe-generieke-titel`, criteria 4.1.2, oordeel afkeur
- Regelbestand: 4.1.2
- Zekerheid van de botsing: mogelijk

Regel: "4.1.2 keurt alleen af als er geen naam is, of als de rol of de toestand ontbreekt of niet klopt" en "Of die naam zijn werk doet ... is 2.4.4". Een iframe met een generieke titel heeft een naam, dus 4.1.2 voldoet volgens de regel; of de titel de inhoud beschrijft is een vraag over de kwaliteit van de naam. Tegen de botsing: H64 (title op een iframe) staat in de lijst voldoende technieken van 4.1.2, en H64 vraagt een titel die de inhoud beschrijft. Het patroon zegt zelf dat auditors het ook onder 2.4.6 leggen; de regel beslist dat niet.

**Voorstel: Regel verduidelijken, patroon blijft.** H64 (title op een iframe) staat bij 4.1.2 onder de voldoende technieken en vraagt een beschrijvende titel. Zet dat in het regelbestand van 4.1.2, met de zin dat een iframe met een generieke titel onder 4.1.2 afkeurt. Dat is een uitzondering op "alleen afkeuren bij geen naam", dus jouw keuze.

## 2. Geen regel over dit onderwerp

Voor deze patronen staat in de regelbestanden niets, of alleen de algemene kernregel. Vaststellen kan, maar dan op grond van het patroon zelf. Frits kan bij een patroon kiezen om eerst een regel vast te leggen.

| Patroon | Titel | Criteria | Oordeel | Regelbestand | Wat er wel of niet staat |
|---|---|---|---|---|---|
| `P-111-sensory-leeg` | Kunstwerk met lege alt | 1.1.1 | afkeur | 1.1.1 | Geen regel over sensory content (kunstwerk, titel en maker). Het dichtst bij komt "Foto's in de lopende tekst" en de beslisboom (stap 3: een afbeelding die betekenis toevoegt krijgt een alt). |
| `P-111-aria-label-op-span` | aria-label op span zonder rol | 1.1.1 | afkeur | 1.1.1 | Geen regel over aria-label op een span zonder rol. Wel: een icoon in een span met role="img" en aria-label is een goede opbouw (heuvelrug.nl, 2026-08-15), en stap 8 noemt "role=img met een naam" als bron. Het omgekeerde geval, zonder rol, staat er niet. |
| `P-131-lijst-zonder-bolletjes` | Lijst zonder bolletjes | 1.3.1 | geen afkeur | 1.3.1 | Geen regel over list-style: none of VoiceOver-gedrag. De kernregel (opsomming hoort in ul of ol) botst er niet mee: de ul blijft staan. |
| `P-131-alles-th` | Alle cellen th | 1.3.1 | afkeur | 1.3.1 | Geen regel over een tabel waarin alle cellen th zijn. Alleen koprijen als td, rijkoppen en opmaaktabellen met th (F46) staan er. |
| `P-131-lege-hoekcel-th` | Lege hoekcel als th | 1.3.1 | advies | 1.3.1 | Geen regel over een lege hoekcel als th. |
| `P-131-div-tabel` | Tabel van div’s | 1.3.1 | afkeur | 1.3.1 | Geen regel over een tabel van div's. De kernregel (tabel op het scherm moet tabel in de code zijn) wijst dezelfde kant op als het patroon; het is alleen niet uitgeschreven. |
| `P-131-presentation-datatabel` | role=presentation op datatabel | 1.3.1 | afkeur | 1.3.1 | Geen regel over role="presentation" op een datatabel. |
| `P-131-spatie-tabel` | Tabel met spaties | 1.3.1 | afkeur | 1.3.1 | Geen regel over een tabel van spaties in een pre-blok. De PDF-regels over lijsten van losse P's met bullet-tekens liggen in de buurt, maar dat is PDF. |
| `P-131-groep-zonder-fieldset` | Keuzegroep zonder fieldset | 1.3.1 | afkeur | 1.3.1 | Geen regel over fieldset en legend. De regel zegt dat formulieren bij 1.3.1 alleen over de koppeling label-veld gaan. 3.3.2 noemt H71 (fieldset en legend) alleen als voldoende techniek. |
| `P-131-betekenis-in-opmaak` | Betekenis alleen in opmaak | 1.3.1 | afkeur | 1.3.1 | Geen regel over betekenis die alleen in vetdruk zit. De regel over b en i ("toegestaan, niet afkeuren") moet het patroon wel respecteren: de afkeur gaat over de ontbrekende tekst, niet over het b-element. |
| `P-131-info-via-css-content` | Informatie via CSS content | 1.3.1 | afkeur | 1.3.1 | Geen regel over informatie in ::before onder 1.3.1. Onder 1.1.1 staat wel F3 (informatie in een achtergrondafbeelding). |
| `P-131-div-in-dl` | div rond dt/dd in dl | 1.3.1 | geen afkeur | 1.3.1 | Geen regel over div rond dt en dd. |
| `P-131-kruimelpad-geen-ol` | Kruimelpad niet als ol | 1.3.1 | advies | 1.3.1 | Geen regel over het kruimelpad. |
| `P-247-geen-focus-sluitkruis` | Geen zichtbare focus op sluitkruis | 2.4.7 | afkeur | 2.4.7 (geen bestand) | Geen regelbestand voor 2.4.7. 1.4.1 zegt in het voorbijgaan dat zichtbare focus onder 2.4.7 valt "en dat zit niet in het onderzoekstype". Dat is een scopevraag: controleer of 2.4.7 in het onderzoekstype van de projecten zit voordat dit patroon wordt vastgesteld. |
| `P-412-details-summary` | details/summary | 4.1.2 | geen afkeur | 4.1.2 | Geen regel over details en summary. De regel zegt wel dat 4.1.2 alleen afkeurt bij ontbrekende naam, rol of toestand; dat laat dit patroon ongemoeid. |
| `P-413-bevestiging-niet-gemeld` | Bevestiging niet gemeld | 4.1.3 | afkeur | 4.1.3 (geen bestand) | Geen regelbestand voor 4.1.3. 3.3.1 verwijst er alleen naar voor de koppeling van foutmeldingen, en noemt G199 (melding dat versturen gelukt is) als aanvullende techniek. |

## 3. Klopt met regel

| Patroon | Titel | Criteria | Oordeel | Regelbestand | Regel of besluit dat het bevestigt |
|---|---|---|---|---|---|
| `P-111-alt-ontbreekt` | Alt-attribuut ontbreekt | 1.1.1 | afkeur | 1.1.1 | Regel: "Geen alt-attribuut (F65) is een afkeuring." Stap 10 noemt het alt-attribuut dat ontbreekt apart. |
| `P-111-alt-bestandsnaam` | Bestandsnaam of “foto” als alt | 1.1.1 | afkeur | 1.1.1 | Regel (F30): bestandsnaam, "afbeelding1", "foto" of "image" is geen tekstalternatief: afkeuring. |
| `P-111-tekstafbeelding-generiek` | Afbeelding van tekst met generieke alt | 1.1.1 | afkeur | 1.1.1 | Regel: staat er tekst in de afbeelding en niet als echte tekst in de buurt, dan is dat een bevinding onder 1.1.1, ook voor een banner. Het patroon wijst terecht naar 1.4.5 als aparte vraag. |
| `P-111-css-achtergrond-info` | Informatie in CSS-achtergrond | 1.1.1 | afkeur | 1.1.1 | Regel (F3): informatie in een background-image heeft geen tekstalternatief. |
| `P-111-kleur-in-icoon` | Informatie in kleur van icoon | 1.1.1 | afkeur | 1.1.1 | Regel (F13): draagt kleur betekenis, dan moet die ook in het alternatief staan. De 1.4.1-afkeur die het patroon erbij noemt past bij 1.4.1 ("statusaanduiding uitsluitend met kleur"), maar 1.4.1 staat niet in de criteria van het patroon. |
| `P-111-complex-zonder-lang` | Complexe afbeelding zonder lange beschrijving | 1.1.1 | afkeur | 1.1.1 | Regel: bij een complex beeld eerst nagaan of de inhoud elders als tekst staat; ontbreekt die, dan tekst op de pagina. Hier staan de cijfers nergens. De regel eist geen programmatische koppeling, het patroon ook niet. |
| `P-111-decoratie-met-naam` | Decoratie met niet-lege naam | 1.1.1 | afkeur | 1.1.1 | Regel (F38, F39, H67): een decoratieve afbeelding met alt "spacer" of "afbeelding" is een afkeuring. |
| `P-111-logo-alt-onvolledig` | Logo-alt mist tekst uit logo | 1.1.1, 2.5.3 | afkeur | 1.1.1 en 2.5.3 | Regel 1.1.1: het alternatief bevat alle tekst op het logo, zonder het woord "logo". Regel 2.5.3: organisatienaam in het logo maar niet in de naam is een afkeuring, een slogan niet. Beide criteria kloppen. Let op: 1.1.1 zegt "alle tekst", het patroon "minimaal de tekst". |
| `P-111-icoon-enige-inhoud-leeg` | Icoon als enige inhoud, alt leeg | 1.1.1, 4.1.2 | afkeur | 1.1.1, 2.4.4 en 4.1.2 | Regel 2.4.4 (F89): een afbeelding als enige inhoud van een link, zonder naam, keurt af onder 1.1.1, 2.4.4 en 4.1.2. De onderbouwing van het patroon noemt 2.4.4, maar de criteria van het patroon bevatten alleen 1.1.1 en 4.1.2. Voeg 2.4.4 toe of haal de zin weg. |
| `P-111-linklabel-repareert-niet` | Linklabel als reparatie van lege alt | 1.1.1 | afkeur | 1.1.1 | Regel (besluit 2026-08-15): tekst die aan de link hangt (title, aria-label, verborgen tekst) repareert een ontbrekend tekstalternatief niet; 1.1.1 en linkdoel niet door elkaar halen. |
| `P-111-input-image-zonder-alt` | Afbeeldingsknop zonder alt | 1.1.1, 4.1.2 | afkeur | 1.1.1 en 4.1.2 | Regel 1.1.1 (H36): input type=image krijgt een alt die de functie noemt. Regel 4.1.2: een bedieningselement zonder naam is een afkeuring (F68). |
| `P-111-alt-niet-bijgewerkt` | Alt niet bijgewerkt na wissel icoon | 1.1.1, 4.1.2 | afkeur | 1.1.1 en 4.1.2 | Regel 1.1.1 (F20): wisselt een script de afbeelding, dan moet de alt meewisselen. 4.1.2 noemt F20 ook onder de fouten. |
| `P-111-unicode-opmaak` | Unicode-tekens als opmaak | 1.1.1 | afkeur | 1.1.1 | Regel (F71, F72, H86): tekst in Unicode-sierletters wordt slecht voorgelezen; de betekenis hoort ernaast in gewone tekst. De regel zegt "hoort", niet uitdrukkelijk "afkeur"; het patroon is strenger maar niet tegenstrijdig. |
| `P-111-ascii-art` | ASCII-art zonder alternatief | 1.1.1 | afkeur | 1.1.1 | Regel (F71, F72, H86): een tekening van leestekens wordt slecht voorgelezen; de betekenis hoort in gewone tekst. |
| `P-111-teasers-leeg` | Teaserfoto’s consequent alt="" | 1.1.1 | geen afkeur | 1.1.1 | Regel: teaser- of kaartafbeelding in een overzicht met alt="" is de gewenste situatie, geen bevinding. De lijst beslist, niet de foto. De regel vraagt wel de overzichtscontext in de onderbouwing te noemen. |
| `P-131-nep-kop` | Nep-kop (div of vette alinea) | 1.3.1 | afkeur | 1.3.1 | Regel: koppen moeten echte kop-elementen zijn (tabel bovenaan, 2.4.6: "de kop is geen echt kop-element: 1.3.1"). |
| `P-131-kop-zonder-sectie` | Kop zonder sectie | 1.3.1 | afkeur | 1.3.1 | Regel, stap 7: beide richtingen zijn een afkeuring, ook iets als kop coderen dat het niet is. |
| `P-131-kophierarchie-tegen` | Kophiërarchie spreekt visueel tegen | 1.3.1 | afkeur | 1.3.1 | Regel (besluit 2026-10-11): afkeur als het niveau de visuele structuur tegenspreekt, een kop die er op het scherm uitziet als onderdeel van een andere kop. |
| `P-131-kopniveau-overgeslagen` | Kopniveau overgeslagen | 1.3.1 | advies | 1.3.1 | Regel (besluit 2026-10-11): een overgeslagen kopniveau is op zichzelf geen afkeuring, hooguit een opmerking met "Dit is een best practice." Het patroonoordeel "advies" komt hiermee overeen. |
| `P-131-nep-lijst` | Nep-lijst of handmatige nummering | 1.3.1 | afkeur | 1.3.1 | Regel, stap 6: staat elke opsomming in ul of ol, of zijn het losse regels met br? |
| `P-131-lijst-per-item` | Lijst per item | 1.3.1 | afkeur | 1.3.1 | Regel, stap 6 en kaarttekst: een opsomming op het scherm hoort een lijst in de code te zijn. Let op: de regel "lijst met slechts een li: opmerking" gaat over een losse lijst van een item, niet over een visuele lijst die in drieen is geknipt. Zet dat in de onderbouwing, anders wordt het patroon straks met die regel verward. |
| `P-131-kolomkop-als-td` | Kolomkoppen als td | 1.3.1 | afkeur | 1.3.1 | Regel: bovenste rij visueel een koprij maar td-cellen: afkeuring (klein, redacteur). |
| `P-131-rijkop-als-td` | Rijkoppen als vette td | 1.3.1 | afkeur | 1.3.1 | Regel: rijkoppen zijn vereist als de eerste kolom de rij benoemt en de overige cellen eigenschappen zijn, zoals hier (Centrum, Overig gebied). |
| `P-131-layouttabel-met-th` | Layouttabel met th | 1.3.1 | afkeur | 1.3.1 | Regel (F46, besluit 2026-10-11): een opmaaktabel met th, caption of summary is een afkeuring (matig, redacteur). |
| `P-131-layouttabel-zonder-th` | Layouttabel zonder th | 1.3.1 | advies | 1.3.1 | Regel (F46): een opmaaktabel zonder tabelsemantiek is hooguit een opmerking ("Dit is een best practice."). Het patroonoordeel "advies" komt overeen. |
| `P-131-label-niet-gekoppeld` | Label niet gekoppeld | 1.3.1, 4.1.2 | afkeur | 1.3.1 en 4.1.2 | Regel 1.3.1: bij een formulier gaat het om de koppeling van label aan veld (for tegen id). Regel 4.1.2: een formulierveld zonder enige naam is een afkeuring. |
| `P-131-verplicht-alleen-kleur` | Verplicht alleen via kleur | 1.3.1, 1.4.1 | afkeur | 1.3.1 en 1.4.1 | Regel 1.4.1 (F81): "Verplichte velden alleen met een kleur gemarkeerd, zonder sterretje of woord" is een afkeuring. 3.3.2 vraagt dat duidelijk is welke velden verplicht zijn. |
| `P-131-instructie-niet-gekoppeld` | Instructie niet gekoppeld aan veld | 1.3.1 | afkeur | 1.3.1 | Regel 3.3.2: de programmatische koppeling (aria-describedby) hoort bij 1.3.1, niet bij 3.3.2. Dat is hier het geval. De regel zegt niets over "verschillend geoordeeld"; dat is een opmerking van het patroon. |
| `P-131-blockquote-inspringen` | Blockquote om in te springen | 1.3.1 | afkeur | 1.3.1 | Regel, stap 7: een blockquote om tekst in te springen is een afkeuring. |
| `P-131-label-waarde-los` | Label en waarde los in code | 1.3.1, 1.3.2 | afkeur | 1.3.1 en 1.3.2 | Regel 1.3.2: lineariseren; sluiten labels aan op hun waarden? Zo niet, afkeuring. Voor het 1.3.1-deel geldt de kernregel dat structuur op het scherm ook in de code staat. |
| `P-132-datum-voor-link` | Datum vóór link in code | 1.3.2 | geen afkeur | 1.3.2 | Regel: een omkering is niet automatisch een bevinding; weeg of het verplaatste element betekenis draagt. De regel noemt wel datum of categorie boven de titel als aandachtspunt (verkeerde koppeling aan een item). Hier staat de datum in de code vooraan binnen dezelfde kaart; het patroon weegt dat, zoals de regel vraagt. |
| `P-141-beschikbaarheid-kleur` | Beschikbaarheid alleen via kleur | 1.4.1, 1.3.1, 4.1.2 | afkeur | 1.4.1, 1.3.1 en 4.1.2 | Regel 1.4.1: statusaanduiding uitsluitend met kleur is een afkeuring. Regel 4.1.2: de toestand moet te bepalen zijn; knoppen zonder disabled of aria-disabled geven die niet door. |
| `P-143-grijs-onder-45` | Grijze tekst net onder 4,5:1 | 1.4.3 | afkeur | 1.4.3 | Regel: "Niet afronden. 4,5:1 en 3:1 zijn drempels: 4,499:1 haalt 4,5:1 niet." 3,95:1 voor normale tekst is dus een afkeuring. |
| `P-1410-sticky-400` | Sticky header bij 400% zoom | 1.4.10 | advies | 1.4.10 | Regel: C34 (vaste kop- en voetbalken losmaken met mediaqueries) is een aanvullende techniek, en alleen F102 (inhoud verdwijnt) is een fout. Een sticky header als advies past daarbij. Het patroon heeft geen omschrijving of onderbouwing; vul die aan voordat het wordt vastgesteld. |
| `P-1411-knop-licht-vlak` | Knop met tekst op licht vlak | 1.4.11 | geen afkeur | 1.4.11 | Regel: "Omranding van een knop met tekst erin: de knop is te herkennen aan zijn tekst; de rand voegt niets toe." Een knop met alleen een icoon ligt anders, zoals het patroon zelf zegt. |
| `P-211-div-als-knop` | div met klik als knop | 2.1.1, 4.1.2 | afkeur | 4.1.2 (2.1.1 zonder bestand) | Regel 4.1.2 (F59): een div of span als bedieningselement zonder rol is een fout. Voor het 2.1.1-deel (niet met het toetsenbord te bedienen) bestaat geen regelbestand; 1.4.10 verwijst er alleen naar. |
| `P-244-carrousel-zonder-naam` | Carrousellinks zonder naam | 2.4.4, 4.1.2 | afkeur | 2.4.4 en 4.1.2 | Regel: een link zonder enige toegankelijke naam keurt af onder 2.4.4 en 4.1.2, als twee bevindingen. De opmerking van het patroon dat de pijlen knoppen zijn, past bij de sectie "De rol, naast de naam" van 4.1.2. |
| `P-244-lege-link-cms-veld` | Lege link door leeg CMS-veld | 2.4.4, 4.1.2 | afkeur | 2.4.4 en 4.1.2 | Regel: een lege title en verder niets is een afkeuring onder 4.1.2 en 2.4.4 (F89). Het patroon noemt terecht de template als oorzaak. |
| `P-244-context-lijstitem` | Linkcontext in hetzelfde lijstitem | 2.4.4 | geen afkeur | 2.4.4 | Regel: context in hetzelfde lijstitem voldoet (H77). Telefoonnummer als linktekst met een bel- of mailbedoeling is geen bevinding. |
| `P-244-kop-geen-context` | Kop naast link is geen linkcontext | 2.4.4 | afkeur | 2.4.4 | Regel: een kop boven de link geeft geen context (F63; H80 is advisory). Alleen dezelfde zin, alinea, hetzelfde lijstitem of dezelfde tabelcel telt. |
| `P-246-sluiten-generiek` | Sluitknop heet alleen “Sluiten” | 2.4.6 | advies | 2.4.6 | Regel: "Kort mag"; een label is alleen een afkeuring als de lezer er niet uit opmaakt wat er volgt. "Sluiten" zegt dat, dus hooguit een advies. Het patroon heeft geen omschrijving of onderbouwing; vul die aan. |
| `P-253-aria-label-zonder-zichtbaar` | aria-label zonder zichtbare tekst | 2.5.3 | afkeur | 2.5.3 | Regel (F96): zichtbare tekst die niet in de toegankelijke naam zit is een afkeuring; een aria-label dat de zichtbare tekst overschrijft is het meest voorkomende geval. |
| `P-332-placeholder-label` | Placeholder als enige label | 3.3.2 | afkeur | 3.3.2 | Regel: een placeholder als enig label is een afkeuring onder 3.3.2. De programmatische koppeling hoort bij 1.3.1, zoals het patroon zegt. |
| `P-332-sterretje-onverklaard` | Sterretje zonder uitleg | 3.3.2 | afkeur | 3.3.2 | Regel: "Alleen een sterretje is geen label" en 3.3.2 vraagt dat duidelijk is welke velden verplicht zijn. |
| `P-412-listbox-zonder-option` | listbox zonder option | 4.1.2 | afkeur | 4.1.2 | Regel, sectie "De rol, naast de naam": draagt een element een rol, dan moet die rol kloppen met wat het doet; role="menuitem" zonder omringend menu is losse decoratie. Voor listbox zonder option geldt hetzelfde (F15). |

## Andere dingen die ik tegenkwam

- "Icoon als enige inhoud, alt leeg": de onderbouwing noemt 2.4.4, de criteria niet. Een van de twee aanpassen.
- "Informatie in kleur van icoon": de onderbouwing noemt 1.4.1, de criteria niet.
- "Afbeelding van tekst met generieke alt": noemt 1.4.5, de criteria niet.
- "Sticky header bij 400% zoom" en "Sluitknop heet alleen Sluiten" hebben geen omschrijving, onderbouwing of casus. Aanvullen voor het vaststellen.
- Het regelbestand van 1.1.1 vraagt dat de redacteur in de onderbouwing de overzichtscontext noemt bij een teaser met alt="". Controleer dat bij het patroon over teaserfoto's.
- Een regel die tijdens het vaststellen verandert (de datums 2026-10-10 en 2026-10-11 komen vaak voor) verandert ook dit overzicht. Dit overzicht is gemaakt op 2026-10-17.
