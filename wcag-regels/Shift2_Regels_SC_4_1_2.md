# Shift2-beoordelingsregels SC 4.1.2

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_4_1_2.md` als ze elkaar tegenspreken.

## Templatecode van de leverancier: bevinding én technisch issue

Een aan/uit-knop in de SIMsite-toegankelijkheidsbalk (zoals 'Contrast verhogen') zonder
`aria-pressed` is templatecode van de leverancier. De gemeente kan er in het CMS niets aan
veranderen. Toch is het een **4.1.2-bevinding**, met verantwoordelijke **ontwikkelaar**, en
daarnaast een **technisch issue** voor de leverancier. Zo gaat het al bij het
SIMsite-galerijpatroon onder 1.1.1.

Het succescriterium kent geen uitzondering voor wie de code heeft gemaakt. WCAG 2.2 kent
alleen een verklaring van gedeeltelijke conformiteit voor inhoud van derden die later wordt
toegevoegd en buiten de macht van de auteur valt (WCAG 2.2, 5.4). Een sitesjabloon dat de
organisatie zelf heeft gekozen valt daar niet onder. Laat je de bevinding weg, dan komt 4.1.2
op voldoet terwijl de fout op de pagina staat. Besluit Frits 2026-10-11: volg W3C.

Dit geldt voor alle templatecode: de toegankelijkheidsbalk, het zoekveld in de header, de
formuliergenerator. Het technische issue zorgt dat de leverancier het voor alle gemeenten
oplost; de bevinding zorgt dat het rapport klopt.

> Gewijzigd op 2026-10-11. Tot dan gold het besluit van Frits van 2026-07-27
> (duurzaam.beverwijk.nl): templatecode zonder redactionele ingang werd alleen een technisch
> issue, zonder 4.1.2-bevinding. Het technische issue van toen staat onder "SIMsite: knop
> 'Contrast verhogen' in toegankelijkheidsbalk geeft toestand niet door".

### Zo maak je het technische issue aan

Technische issues staan op de pagina `/technische-issues`, los van elk project: ze gelden voor
het platform, niet voor één onderzoek. Aanmaken gaat met `POST /api/technical-issues`. De
velden, zoals `app/api/technical-issues/route.ts` ze leest:

| Veld | Verplicht | Wat erin staat |
|---|---|---|
| `title` | ja | Herkenbaar met de leverancier voorop: "SIMsite: knop 'Contrast verhogen' in toegankelijkheidsbalk geeft toestand niet door" |
| `description` | ja | Wat er mis is. Vermeld hierin altijd **dat het templatecode is** en **op welke site je het hebt gezien**, met het element erbij. Zonder die twee is later niet na te gaan waar het vandaan kwam. |
| `request` | nee | Wat je de leverancier vraagt te doen (bij een bevinding zou dit het advies zijn) |
| `wcagCriterionId` | nee | Het id van het criterium uit `npm run cli -- list-criteria`, dus de UUID en niet de code "4.1.2" |
| `impact` | nee | `klein`, `matig`, `serieus`, `kritiek` of `onbekend` |
| `supplier` | nee | De leverancier van de template, bijvoorbeeld "SIMgroep". Dit veld scheidt de issues op klantsites van verbeterpunten aan de tool zelf (`shift2-auditor`); vul het dus altijd in. |
| `status` | nee | `open` (standaard) of `resolved` |
| `githubIssueUrl` | nee | Alleen voor issues aan de tool zelf |

Curl altijd met `charset=utf-8` en met `-w "HTTP %{http_code}\n"`, anders zie je een
mislukte aanroep niet:

```bash
curl -s -X POST http://localhost:3000/api/technical-issues \
  -H "Content-Type: application/json; charset=utf-8" \
  -w "HTTP %{http_code}\n" \
  --data-binary @issue.json
```

met in `issue.json` bijvoorbeeld:

```json
{
  "title": "SIMsite: knop 'Contrast verhogen' in toegankelijkheidsbalk geeft toestand niet door",
  "description": "Templatecode van SIMsite, gezien op duurzaam.beverwijk.nl. De knop 'Contrast verhogen' in de toegankelijkheidsbalk is een aan/uit-knop, maar geeft niet door of hij aanstaat: er ontbreekt een aria-pressed. Wie een schermlezer gebruikt hoort na het drukken niet of het contrast nu hoger staat. De redacteur kan hier niets aan doen; in het project staat er ook een 4.1.2-bevinding voor.",
  "request": "Geef de knop aria-pressed mee en zet die op true zodra het hoge contrast aanstaat.",
  "wcagCriterionId": "<id van 4.1.2 uit list-criteria>",
  "impact": "matig",
  "supplier": "SIMgroep",
  "status": "open"
}
```

Er is ook een route via de onderzoeker: een voorstel dat in "Waar sta ik" wordt doorgezet
naar een technisch issue, maakt dat issue zelf aan (beschrijving wordt beschrijving, advies
wordt verzoek) en zet het voorstel op afgewezen. Gebruik die route niet voor templatecode:
dan verdwijnt de bevinding, en die hoort sinds 2026-10-11 te blijven. Maak bij templatecode
het voorstel (`create-finding`, verantwoordelijke `ontwikkelaar`) én het issue rechtstreeks.

## Altijd actief checken: de logo-link boven aan de pagina

Het logo in de header is vrijwel altijd een link naar de homepage. Loop na of die link een
toegankelijke naam heeft. Bepaal die naam in deze volgorde:

1. `aria-label` op de `<a>` — dan is dát de naam
2. Anders: alle tekst binnen de `<a>`, waarbij alles met `aria-hidden="true"` wegvalt.
   Het tekstalternatief (`alt`) van een `<img>` in de link telt hierin mee als tekst.
3. `title` telt alleen mee als er verder geen enkele naam is

Let op een visueel verborgen span (`sr-only`, `visually-hidden`). Die telt WEL mee als naam,
ook al zie je op de screenshot alleen het logo. Beoordeel dit uit de HTML, niet uit de
screenshot.

Bevat de link alleen een `<img>` met `alt=""` en verder geen tekst, `aria-label` of `title`,
dan is dat een **afkeuring** (matig, ontwikkelaar). Een `alt` die alleen een bestandsnaam
bevat ("logo.png") telt niet als bruikbare naam. Is er wél een `title`, lees dan de
paragraaf hieronder.

### Een naam die alleen uit `title` komt: voor 4.1.2 is er een naam

4.1.2 vraagt alleen of naam en rol programmatisch te bepalen zijn: "the name and role can be
programmatically determined" (WCAG 2.2, tekst van 4.1.2). Understanding 4.1.2 eist niet dat
de naam de bestemming of het doel beschrijft. Komt de toegankelijke naam uitsluitend uit een
`title` op de link (leeg `alt`, geen tekst, geen `aria-label`), dan heeft de link een naam;
de browser rekent hem zo uit en dat is in de toegankelijkheidsboom na te lezen. Voor 4.1.2
voldoet dat. Besluit Frits 2026-10-11: volg W3C.

Of die naam zijn werk doet, dus of hij zegt waar de link heen gaat, is **2.4.4**:

| Situatie | 4.1.2 | 2.4.4 |
|---|---|---|
| Logo-link naar de eigen homepage, `title="Ga naar de homepage"` | voldoet: er is een naam | voldoet: de naam zegt waar de link heen gaat |
| Logo-link op een SUBSITE (duurzaam., open., mijn.) met dezelfde title | voldoet: er is een naam | afkeuring: de gebruiker denkt naar de hoofdsite te gaan |
| Een title die de bestemming niet dekt, of een nietszeggende title | voldoet: er is een naam | afkeuring |
| Een naam die alleen het linktype noemt, zoals "(externe link)" of "PDF" | voldoet: er is een naam | afkeuring: dat is een aanduiding, geen doel |
| Een lege `title` en verder niets | **afkeuring**: geen naam | afkeuring (F89) |

4.1.2 keurt alleen af als er **geen naam** is, of als de **rol** of de **toestand** ontbreekt
of niet klopt. Zie de sectie over de rol hieronder.

Let op waar zo'n naam vandaan komt. Een afbeelding-link met `alt=""` lijkt naamloos, maar
staat er een span met `aria-label="(externe link)"` naast het plaatje binnen dezelfde `<a>`,
dan is dát de naam. Voor 4.1.2 is er dan een naam. Schrijf onder 2.4.4 niet "de link heeft
geen naam", maar benoem welke naam er wél is en waarom die niets zegt.

Voorbeeld (heuvelrug.nl/werken-bij-de-gemeente, 2026-08-18): een foto van drie collega's
linkt naar een video op YouTube. De foto heeft `alt=""`, en het externe-link-icoontje
ernaast draagt `aria-label="(externe link)"`. De toegankelijke naam van de link is daarmee
"(externe link)". Dat is een 2.4.4-afkeuring, geen 4.1.2-afkeuring.

**Wat hier los van staat:** een logo met een leeg tekstalternatief blijft een 1.1.1-afkeuring,
en staat de organisatienaam zichtbaar in het logo dan ook een 2.5.3-afkeuring. Die eisen
dezelfde reparatie, dus er gaat geen verbetering verloren als 4.1.2 hier voldoet.

Geschiedenis van deze regel, want hij is een keer gedraaid:

- 2026-08-02, heuvelrug.nl. De logo-link had `title="Ga naar de homepage"` met `alt=""`.
  Claude concludeerde dat de bevinding verviel omdat er formeel een naam was; Frits stelde
  toen vast dat `title` onvoldoende betrouwbaar is (niet bij toetsenbordfocus, vrijwel
  onbereikbaar op touch, wisselend ondersteund) en dat het een afkeuring bleef.
- 2026-08-18, zelfde link. Frits: "naam rol en waarde heeft het toch? titel atribuut; ga naar
  de homepage" en "in dit geval is het geen issue, want de link gaat naar de homepage van
  utrechtse heuvelrug". Daarmee is de categorische regel vervangen door de beoordeling
  hierboven: kijk of de naam de bestemming dekt.
- 2026-10-11. Besluit Frits: volg W3C. Of de naam de bestemming dekt is 2.4.4, niet 4.1.2.
  Een naam uit `title` voldoet voor 4.1.2 altijd; de afweging uit de tabel gebeurt onder 2.4.4.

### Vaste formulering (UTHEU-01, 2026-08-03)

Gebruik deze tekst alleen wanneer de link werkelijk geen naam heeft. Heeft de link een naam
uit `title`, dan is 4.1.2 voldaan en schrijf je deze bevinding niet; dekt die naam de
bestemming niet, dan is dat een 2.4.4-bevinding.

Description:

> Boven aan de pagina staat het logo, dat als link naar de homepage werkt. Omdat de afbeelding
> een lege alt-tekst heeft, heeft de link geen 'toegankelijke naam'. Wie blind is en een
> schermlezer gebruikt, hoort niet waar deze link naartoe gaat. In de code is alleen bij de
> link zelf aangegeven dat die naar de homepage gaat.

Advies:

> Voorzie de afbeelding van een alt-tekst met de naam van de organisatie, bijvoorbeeld
> 'Gemeente X'.

Let op de details die Frits hierin heeft aangescherpt:
- **Alleen de organisatienaam in het advies.** Wereldwijd is de afspraak dat de alt-tekst van
  een logo-link naar de homepage alleen de naam van de organisatie bevat; de bestemming is
  daarmee impliciet duidelijk. Schrijf dus NIET "Gemeente X, naar de homepage". Zet die
  onderbouwing ook niet in de bevinding zelf.
  Uitzondering: op een SUBSITE (duurzaam., open., mijn.) hoort de bestemming er wél bij, want
  daar leidt het logo niet naar de hoofdsite. Zie `Shift2_Regels_SC_1_1_1.md`.
- **"toegankelijke naam"** tussen aanhalingstekens, zonder de Engelse term "Accessible Name"
  erachter.
- **Het title-attribuut zijdelings noemen**, niet als hoofdonderwerp. Schrijf "In de code is
  alleen bij de link zelf aangegeven dat die naar de homepage gaat" — geen attribuutnaam, en
  geen uitleg over hoe betrouwbaar een title is.
- **Niet schrijven dat een title verschijnt bij aanwijzen met de muis.** Dat gedrag verschilt
  per browser en werkt niet op een touchscreen.
- **Niet "de link bevat geen tekst"** als er een afbeelding in staat; de lege alt-tekst is de
  oorzaak.
- Gevolg formuleren vanuit de gebruiker ("hoort niet waar deze link naartoe gaat"), niet als
  "hulpsoftware kan de link niet identificeren".
- De derde zin is op 2026-08-18 bijgewerkt van "Wie de website met een schermlezer gebruikt"
  naar "Wie blind is en een schermlezer gebruikt", volgens de algemene regel in
  `writing/FRITS-WRITING-GUIDE.md`. De overige details van deze formulering zijn ongewijzigd.

## 4.1.2 naast 1.1.1 — losse bevindingen, geen onderlinge verwijzing

Een logo-link met leeg tekstalternatief raakt zowel 1.1.1 als 4.1.2. Dat zijn **twee
verschillende issues** met een gedeelde oorzaak:

- **1.1.1** — de afbeelding brengt zijn informatie niet over (de organisatienaam staat in
  het logo en nergens anders als gewone tekst)
- **4.1.2** — de link heeft geen naam, dus hulpsoftware kan hem niet aankondigen

Schrijf beide bevindingen volledig zelfstandig. Zet er **geen verwijzing naar het andere
criterium** in ("Dit issue valt ook onder 1.1.1..."): dat maakt de ene bevinding
ondergeschikt aan de andere en zet bovendien een SC-code in de tekst, wat tegen de
schrijfregels ingaat.

Aanleiding: heuvelrug.nl (2026-08-02), logo-link met `<img class="logo-img" alt="">`. De
auditor schreef 1.1.1 en 4.1.2 correct als aparte bevindingen, maar sloot 4.1.2 af met "Dit
issue valt ook onder succescriterium 1.1.1". Frits wees erop dat het twee losse issues zijn.

## Niet-getagde PDF: 4.1.2 vervalt

Bij een PDF zonder tags zet je 4.1.2 op `niet_te_bepalen`. Rapporteer het niet als losse fout:
de wortel-oorzaak is dat de tagstructuur ontbreekt, en die is al afgekeurd onder 1.3.1.

4.1.2 gaat over naam, rol en waarde in de **code**. Zonder tags is er geen structuur waarin die
kunnen zitten, dus valt er over een afzonderlijk element geen zelfstandig oordeel te vellen.

### Beperkte uitzondering: écht invulbare formuliervelden

Alleen bij een **invulbaar formulier** (`/AcroForm` met invulvelden, keuzerondjes of
selectievakjes) is 4.1.2 zonder tags te beoordelen. Zulke velden moet de gebruiker zelf
bedienen, en de toegankelijke naam zit dan in de tooltip `/TU`, niet in de interne veldnaam `/T`.

**Ga niet af op de techniek maar op de functie.** Een knop die als link werkt, blijft een link,
ook als de bouwer hem toevallig als AcroForm-pushbutton (`/FT /Btn` met `/Ff 65536`) heeft
opgeslagen in plaats van als Link-annotatie. Zo'n knop valt gewoon onder de vervalregel
hierboven; hoe hij intern is opgeslagen, hoort de beoordeling niet te veranderen.

Wat je bij zo'n knop **wel** beoordeelt is 2.4.4: het zichtbare opschrift, mits de knop
daadwerkelijk klikbaar is. Zie `Shift2_Regels_SC_1_3_1.md` voor de volledige lijst.

Vastgelegd door Frits op 2026-08-04 bij BEV-03. Claude zette 4.1.2 eerst op `niet_te_bepalen`,
draaide dat terug toen bleek dat de acht knoppen AcroForm-pushbuttons zonder `/TU` waren, en
Frits corrigeerde dat opnieuw: er zijn geen tags, en het zijn links, geen invulvelden.

## De rol, naast de naam

4.1.2 heet *naam, rol, waarde*. De regels hierboven gaan vrijwel allemaal over de **naam**.
Deze sectie gaat over de rol, en dan specifiek over het geval dat op gemeentesites het
vaakst voorkomt: een element dat als iets anders is gecodeerd dan het is.

**De vraag.** Werkt een `<a>` als iets anders dan een link — als knop, tab of menu-item —
dan moet het de bijbehorende ARIA-rol dragen én zich zo gedragen. En omgekeerd: draagt het
een rol, dan moet die rol kloppen met wat het element doet.

**Waarom dat uitmaakt.** De rol bepaalt hoe hulpsoftware het element aankondigt en waar het
terechtkomt. Een `<a role="button">` wordt voorgelezen als "knop" en staat niet in de
linklijst van een schermlezer. Wie die lijst gebruikt om te navigeren, mist hem dus — ook
al is het gewoon een link naar een andere pagina.

**Wat je nagaat, per anker met een rol:**

1. Doet het element werkelijk wat de rol belooft? Een `role="button"` op een `<a href>` die
   simpelweg navigeert, belooft het verkeerde.
2. Hoort er gedrag bij dat er ook is? `role="menuitem"` hoort in een `menu` of `menubar` en
   brengt pijltjesbediening met zich mee. Staat die constructie er niet omheen, dan is de rol
   losse decoratie en werkt de navigatie anders dan wordt aangekondigd.
3. Verdwijnt het element uit een lijst waar de gebruiker het zoekt? Dat is het concrete
   nadeel, en het hoort in de bevinding te staan.

**Afbakening met 2.4.4.** Zo'n element valt buiten 2.4.4: "waar gaat deze link heen" is de
verkeerde vraag voor iets dat als knop wordt aangekondigd. `get-links` zet ze apart onder
`ankers_met_een_andere_rol` en telt ze niet mee in het linkoordeel. Beoordeel ze hier.

**Meten.** `get-links` meldt de rol van elk anker. Wat het niet doet, is oordelen of die rol
klopt — dat vergt weten wat het element doet, en dat zie je pas als je het bedient.

Aanleiding: de vergelijking met de RAMP-toets "Native Widgets: Link Function and Role"
(2026-08-26). Die legde bloot dat onze 4.1.2-regels alleen over de naam gingen. De meting op
heuvelrug.nl liet daarna vijf gevallen zien op de homepage: vier items van de hoofdnavigatie
met `role="menuitem"`, en de ReadSpeaker-knop als `<a role="button">` met een gewone `href`.
Geen van vijven was tot dat moment ergens aan te toetsen.

Vastgelegd door Frits op 2026-08-26.

## Regels

- Focus verschilt van 2.4.4: 4.1.2 gaat erover dat hulpsoftware een interactief element kan herkennen (naam, rol, waarde), 2.4.4 gaat erover of de gebruiker het linkdoel begrijpt.
- Link met wel tekst maar niet-beschrijvend ("klik hier", "lees meer"): dat is ALLEEN 2.4.4, niet 4.1.2, want de link heeft wel een naam.
- Link, knop of formulierveld zonder enige naam: wel 4.1.2. Bij een afbeelding-link zonder alt gelden 2.4.4 en 4.1.2 allebei, als twee aparte bevindingen.
- Een naam die er is maar de bestemming niet dekt (een `title`, "(externe link)", een logo op een subsite met "Ga naar de homepage"): ALLEEN 2.4.4. Besluit Frits 2026-10-11: volg W3C.

## Technieken (W3C)

- Voldoende, situatie A (standaardelement in HTML): ARIA14 (`aria-label` waar geen zichtbaar
  label kan), ARIA16 (`aria-labelledby`), G108 (naam en rol via de opmaak), met H91
  (HTML-formulierelementen en links), H44 (`label`-element), H64 (`title` op een `iframe`),
  H65 (`title` op een formulierveld als `label` niet kan) of H88 (HTML volgens de
  specificatie).
- Voldoende, situatie B (script dat een standaardelement anders inzet): ARIA16.
- Voldoende, situatie C (standaardelement in een andere techniek): G135, met PDF10 (labels
  in een PDF-formulier) of PDF12 (naam, rol en waarde van PDF-formuliervelden).
- Voldoende, situatie D (eigen widget): G10, met ARIA4 (een ARIA-rol), ARIA5 (ARIA-toestanden
  en -eigenschappen) of ARIA16.
- Aanvullend: Understanding 4.1.2 noemt er geen.
- Fout: F59 (een `div` of `span` als bedieningselement zonder rol), F15 (een eigen widget die
  de toegankelijkheidsinterface niet of half gebruikt), F20 (tekstalternatief dat niet
  meeverandert), F42 (een nagebootste link), F68 (een bedieningselement zonder programmatisch
  bepaalde naam), F79 (focustoestand niet programmatisch te bepalen), F86 (geen naam voor elk
  deel van een veld in meerdere delen), F89 (een afbeelding als enige inhoud van een link,
  zonder naam), F111 (een element met zichtbare tekst maar zonder toegankelijke naam).

Bron: Understanding 4.1.2, "Techniques".
- Schrijf dat de link of knop GEEN naam heeft, niet "geen duidelijke naam". Niet beweren dat de schermlezer het webadres voorleest.

## Op de kaart

> Dit blok staat in het scherm van "Waar sta ik". De kaart leest het rechtstreeks uit dit
> bestand: wat je hier verandert, staat bij de volgende keer verversen op de kaart. Er is
> geen tussenstap en geen kopie. Houd het kort — een kaart is geen naslagwerk. Wat langer
> is hoort in de secties hierboven.

### Titel

Elk bedienbaar element heeft een naam, een rol en een toestand

### In het kort

Hulpsoftware moet van elke link, knop en elk veld kunnen zeggen wat het is, hoe het heet en
in welke stand het staat. Een link zonder naam, een link die als knop is gecodeerd, een
schakelknop die niet meldt of hij aanstaat: dat zijn de drie vragen. Kijk altijd naar de
logolink bovenaan; een naam die alleen uit `title` komt is voor 4.1.2 een naam.

Een nietszeggende naam, of een naam die de bestemming niet dekt, is 2.4.4, niet 4.1.2.
Templatecode van de leverancier is een bevinding (ontwikkelaar) én een technisch issue. Een
PDF zonder tags vervalt.

### Audit-instructies

> Zet voor elke stap wie hem uitvoert: `[meting]` als een commando het al doet, `[jij]` als er
> een mens voor nodig is. De kaart toont dat met een vinkje of een open rondje, zodat er niet
> als opdracht staat wat allang gedaan is.

#### Stap 1 — Meten

1. [meting] `get-links <url>`: per link de toegankelijke naam in de juiste volgorde, en de
   ankers met een andere rol apart onder `ankers_met_een_andere_rol`.
2. [meting] `get-html`: knoppen, velden en eigen widgets met hun naam, rol en
   toestandsattributen (`aria-pressed`, `aria-expanded`, `aria-selected`, `aria-current`).

#### Stap 2 — Beoordelen

3. [agent] De logolink: welke naam heeft hij, en waar komt die vandaan? Geen naam is een
   afkeuring. Een naam uit `title` voldoet voor 4.1.2; of hij de bestemming dekt, is 2.4.4.
4. [agent] Per anker met een rol: doet het wat de rol belooft, hoort het gedrag erbij, en
   verdwijnt het uit een lijst waar de gebruiker het zoekt?
5. [agent] Per schakel- en uitklapknop: wordt de toestand gemeld en verandert hij mee? Zit
   de knop in de toegankelijkheidsbalk van de leverancier, dan een bevinding (ontwikkelaar)
   én een technisch issue.
6. [agent] Een PDF zonder tags: `niet_te_bepalen`, behalve bij een echt invulbaar formulier.
7. [jij] Een rol is pas te beoordelen als je het element bedient: doet de "knop" wat een knop
   doet, werkt het menu met de pijltjestoetsen?

#### Stap 3 — Vastleggen

8. [agent] Stuur de vijf deelgebieden hieronder mee met het oordeel, in hetzelfde
   `save-checks`-bericht: `"gebieden": [{ "gebied": "...", "uitkomst": "ok|nvt|fout|opmerking",
   "toelichting": "..." }]`. Zonder een complete lijst wordt het oordeel geweigerd. Kon je een
   gebied niet beoordelen, gebruik dan `nvt` met een toelichting.
9. [agent] De onderbouwing bij `reden` is **één of twee zinnen**: of de meting geldig was —
   kwam je op de gevraagde pagina uit, draaide de JavaScript, was het een auditsessie — en
   verder niets. Al het inhoudelijke gaat naar de deelgebieden.

### Zo is het vastgesteld

`get-links` rekent per link de toegankelijke naam uit in de volgorde uit de regels van 2.4.4
en zet ankers met een andere rol apart. `get-html` na JavaScript geeft de knoppen, velden
en toestandsattributen.

Wat hier niet uit blijkt: of een rol klopt met wat het element doet, en of een toestand
meebeweegt. Dat vergt bedienen in de auditsessie.

### Deelgebieden

1. Naam: links, knoppen en velden hebben een toegankelijke naam, de logolink voorop
2. Rol: elementen met een rol doen wat die rol belooft, en horen in de bijbehorende constructie
3. Toestand: schakelknoppen, uitklapknoppen en tabbladen melden hun stand en veranderen mee
4. Eigen widgets: zoeksuggesties, dialoogvensters en accordeons hebben naam, rol en toestand
5. Templatecode van de leverancier: als technisch issue gemeld, niet als bevinding

> Sinds 2026-10-11 (besluit Frits: volg W3C) lees je gebied 5 zo: mankeert er iets aan
> templatecode, dan is dat `fout` met een bevinding (verantwoordelijke ontwikkelaar), en
> daarnaast een technisch issue voor de leverancier. De naam van het gebied is bewust
> ongewijzigd gelaten; hij spreekt de regel nu tegen en moet door Frits worden aangepast.
> Gebied 1: een naam uit `title` of "(externe link)" is hier `ok`; of die de bestemming dekt
> hoort bij 2.4.4.
>
> Kaartblok toegevoegd op 2026-09-13 bij ZOET-01: dit bestand had wel regels maar geen
> kaartblok, en Frits wilde voor elk criterium dezelfde opmaak als 1.4.1. Het blok is uit de
> regels hierboven samengevat; er staat niets nieuws in. Zet uitleg bij deze lijst altijd
> als blokcitaat: een gewone alinea eronder plakt de kaartlezer aan het laatste gebied vast.
