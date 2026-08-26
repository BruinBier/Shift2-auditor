# Shift2-beoordelingsregels SC 4.1.2

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_4_1_2.md` als ze elkaar tegenspreken.

## Schakelknop in de toegankelijkheidsbalk: technisch issue, geen bevinding

Een aan/uit-knop in de SIMsite-toegankelijkheidsbalk (zoals 'Contrast verhogen') zonder
`aria-pressed` is templatecode van de leverancier, niet iets wat de gemeente kan oplossen.

Meld dit als **technisch issue** voor de leverancier en maak er **geen 4.1.2-bevinding** van
in het project. De gemeente kan er niets mee, en het hoort niet in hun rapport thuis.

Vastgelegd door Frits op 2026-07-27 naar aanleiding van duurzaam.beverwijk.nl. Het technische
issue staat onder "SIMsite: knop 'Contrast verhogen' in toegankelijkheidsbalk geeft toestand
niet door".

Let op het verschil met het SIMsite-galerijpatroon: daar wordt het CMS-gedrag wél als
technisch issue gemeld én als bevinding gerapporteerd, omdat de redacteur daar zelf iets aan
kan doen (bijschrift aanpassen). Bij pure templatecode zonder redactionele ingang vervalt de
bevinding.

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
bevat ("logo.png") telt niet als bruikbare naam. Is er wél een `title`, lees dan eerst de
paragraaf hieronder: dan hangt het oordeel ervan af of die naam de bestemming dekt.

### Een naam die alleen uit `title` komt: beoordeel of die naam zijn werk doet

Komt de toegankelijke naam uitsluitend uit een `title` op de link (dus: leeg `alt`, geen
tekst, geen `aria-label`), dan is dat **niet automatisch een afkeuring**. 4.1.2 vraagt of het
element een naam, een rol en zo nodig een waarde heeft. Die naam is er, en de browser rekent
hem ook zo uit; dat is in de toegankelijkheidsboom na te lezen.

De vraag is dus of die naam zijn werk doet: zegt hij waar de link heen gaat?

| Situatie | Oordeel |
|---|---|
| Logo-link naar de eigen homepage, `title="Ga naar de homepage"` | **voldoet** — de naam zegt waar de link heen gaat |
| Logo-link op een SUBSITE (duurzaam., open., mijn.) met dezelfde title | **afkeuring** — de gebruiker denkt naar de hoofdsite te gaan |
| Een title die de bestemming niet dekt, of een lege of nietszeggende title | **afkeuring** |
| Een naam die alleen het linktype noemt, zoals "(externe link)" of "PDF" | **afkeuring** — dat is geen naam voor de link maar een aanduiding erbij |

Schrijf een afkeuring dan niet als "deze link heeft geen naam", want dat is aanvechtbaar
zodra iemand op de `title` wijst. Benoem dat de naam de bestemming niet dekt.

Let op waar zo'n naam vandaan komt. Een afbeelding-link met `alt=""` lijkt naamloos, maar
staat er een span met `aria-label="(externe link)"` naast het plaatje binnen dezelfde `<a>`,
dan is dát de naam. Schrijf dan niet "de link heeft geen naam" maar benoem welke naam er
wél is en waarom die niets zegt.

Voorbeeld (heuvelrug.nl/werken-bij-de-gemeente, 2026-08-18): een foto van drie collega's
linkt naar een video op YouTube. De foto heeft `alt=""`, en het externe-link-icoontje
ernaast draagt `aria-label="(externe link)"`. De toegankelijke naam van de link is daarmee
"(externe link)".

**Wat hier los van staat:** een logo met een leeg tekstalternatief blijft een 1.1.1-afkeuring,
en staat de organisatienaam zichtbaar in het logo dan ook een 2.5.3-afkeuring. Die twee eisen
allebei dezelfde reparatie, dus er gaat geen verbetering verloren als 4.1.2 hier voldoet.

Geschiedenis van deze regel, want hij is een keer gedraaid:

- 2026-08-02, heuvelrug.nl. De logo-link had `title="Ga naar de homepage"` met `alt=""`.
  Claude concludeerde dat de bevinding verviel omdat er formeel een naam was; Frits stelde
  toen vast dat `title` onvoldoende betrouwbaar is (niet bij toetsenbordfocus, vrijwel
  onbereikbaar op touch, wisselend ondersteund) en dat het een afkeuring bleef.
- 2026-08-18, zelfde link. Frits: "naam rol en waarde heeft het toch? titel atribuut; ga naar
  de homepage" en "in dit geval is het geen issue, want de link gaat naar de homepage van
  utrechtse heuvelrug". Daarmee is de categorische regel vervangen door de beoordeling
  hierboven: kijk of de naam de bestemming dekt.

### Vaste formulering (UTHEU-01, 2026-08-03)

Gebruik deze tekst alleen wanneer de link werkelijk geen bruikbare naam heeft, of wanneer de
naam de bestemming niet dekt (zie de paragraaf hierboven). Bij een logo-link naar de eigen
homepage met `title="Ga naar de homepage"` is 4.1.2 voldaan en schrijf je deze bevinding niet.

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
  `Shift2_Schrijfregels.md`. De overige details van deze formulering zijn ongewijzigd.

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
- Schrijf dat de link of knop GEEN naam heeft, niet "geen duidelijke naam". Niet beweren dat de schermlezer het webadres voorleest.
