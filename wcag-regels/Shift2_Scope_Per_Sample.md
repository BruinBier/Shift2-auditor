# Wat beoordeel je per sample: header, main of footer?

Deze regel geldt voor **alle** succescriteria en bepaalt welk deel van de pagina je
überhaupt bekijkt. Pas hem toe vóór je aan een criterium begint.

Hoe je verantwoordt wat je hebt nagelopen — welk bewijs je meelevert, wat je bij
"niet aanwezig" opschrijft, en hoe je vaststelt of je wel op de goede pagina staat —
staat in `Shift2_Bewijsvoering.md`.

## De regel

| Sample | Wat je beoordeelt |
|---|---|
| **Homepage** (het eerste sample van de website) | header, main-content **én** footer |
| **Elk ander sample** | **alleen de main-content** |

Op een vervolgpagina sla je header en footer volledig over: geen tekstalternatieven, geen
koppen, geen links, geen structuur. Ook niet als je er iets ziet dat op de homepage is
gemist.

## Waarom

Header en footer zijn op elke pagina identiek. Ze bij elk sample opnieuw langslopen levert
niets op behalve dezelfde bevinding elf keer. Sitebrede problemen (sociale-media-structuur,
X/Twitter-mismatch, footer-adres, logo's) worden één keer op de homepage gerapporteerd en
gelden impliciet voor de hele website.

## Gevolgen voor de bevindingen

- Koppel een sitebrede bevinding **alleen aan het homepage-sample**. Vervolgpagina's "erven"
  het probleem; ze worden niet als extra sample-item toegevoegd.
- Voeg aan zo'n bevinding een zin toe als "Dit patroon is op alle pagina's van de website
  aanwezig".
- Kom je op een vervolgpagina toch iets in header of footer tegen: niet rapporteren. Hoort
  het bij de homepage, dan hoort het daar thuis.

## Eerst vaststellen: is dit de homepage?

Doe dit vóór het eerste criterium, niet onderweg. Je hoeft het niet te onthouden of te
raden — `npm run cli -- get-html` zegt het in elk antwoord:

| | `homepageDetected` | `scope` | Wat je terugkrijgt |
|---|---|---|---|
| Homepage | `true` | `document` | de hele pagina, inclusief header en footer |
| Elk ander sample | `false` | `main` | alleen de main-content |

Op een vervolgpagina krijg je de footer dus niet eens terug. Staat er `scope: "main"` en
schrijf je toch iets over de header of de footer, dan heb je materiaal gebruikt dat je
niet is aangereikt — controleer dan waar die bewering vandaan komt.

Andersom net zo belangrijk: staat er `homepageDetected: true`, dan hoort de footer bij je
beoordeling en mag je hem niet overslaan.

## Hoe je de main-content afbakent

Neem het `<main>`-element, of als dat ontbreekt het gebied tussen de sitebrede navigatie en
de footer. Alles in `<header>`, `<nav>` (sitebrede navigatie), `<footer>` en de
toegankelijkheidsbalk valt buiten je beoordeling op een vervolgpagina.

Twijfel je of een blok bij de main-content of bij de sitebrede template hoort? Kijk of het op
de homepage ook voorkomt. Zo ja, dan is het template en sla je het over.

## Templatecode van de formuliergenerator valt buiten het onderzoek

Bij formulierstappen komt veel opmaak uit de formuliergenerator, niet uit wat de redacteur
invult. Denk aan de voortgangsbalk, de sessie-waarschuwing, de knoppen en de tekenteller onder
een invoerveld. Kan de redacteur er niets aan doen, dan hoort het **niet in het rapport**.

Voorbeeld: de tekst "U hebt nog 200 tekens over." onder een invoerveld staat in een `div` die
niet met `aria-describedby` aan het veld is gekoppeld. Dat is een echte tekortkoming, maar hij
zit in de generator. Geen bevinding, geen opmerking. Vastgelegd door Frits op 2026-08-03 bij
UTHEU-01 (contactformulier stap 2).

Wat je wél beoordeelt op een formulierstap: de labels, de veldnamen, de koppen en de teksten
die de redacteur zelf invult. De stapnaam bijvoorbeeld: die is redactioneel en kan wél een
bevinding of opmerking opleveren (zie UTHEU-01 B027).

Zie ook `Shift2_Regels_SC_4_1_2.md` voor hetzelfde principe bij de toegankelijkheidsbalk.

## Video die alleen gelinkt is, valt buiten de scope

Staat er op een pagina een **link** naar een video op YouTube of Vimeo, zonder ingesloten
speler, dan valt die video **buiten de scope** van een deelonderzoek content. Ook als het het
eigen kanaal van de organisatie is.

Gevolg: beoordeel de video-criteria (1.2.1 tot en met 1.2.5) dan niet en zet ze op
`niet_aanwezig`. Schrijf geen bevinding over ontbrekende of automatisch gegenereerde
ondertiteling, en stel er ook geen vraag over aan de onderzoeker.

Het verschil zit in de insluiting: een `<iframe>` met een speler ín de pagina hoort er wél
bij, want die video wordt op de pagina zelf afgespeeld. Controleer dus of er een iframe of
videospeler in de main-content staat voordat je concludeert dat er video aanwezig is.

Aanleiding: UTHEU-01 (2026-08-03), pagina /archeologie met zes links naar de serie "Graven in
het Groen" op YouTube. De auditor maakte er een 1.2.2-bevinding van over automatische
ondertiteling en zette 1.2.3 en 1.2.5 op `niet_te_bepalen`; Frits gaf aan dat deze video's
buiten de scope vallen.
