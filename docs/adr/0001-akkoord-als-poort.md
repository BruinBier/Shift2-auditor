---
status: proposed
---

# Akkoord als poort tussen voorstel en bevinding

Bevindingen ontstaan steeds vaker machinaal — de `audit-samples`-workflow en de
crawler stellen ze voor. Tot nu toe kwam zo'n voorstel meteen in het rapport
terecht en zette het het criterium op `failed`. We voeren daarom een poort in:
een voorstel telt pas mee nadat de onderzoeker akkoord heeft gegeven. Het
criteriumoordeel wordt niet langer bij het aanmaken geschreven maar herleid uit
de akkoord bevonden bevindingen.

## De keten

```
Waarneming  ──┐
              ├──►  Voorstel  ──►  akkoord  ──►  Bevinding
audit-samples ┘         │
                        ├──►  afwijzing (blijft bewaard, met reden)
                        │
                        └──►  doorzetten  ──►  Technisch issue
```

Een **waarneming** is de ruwe observatie van de onderzoeker ("hier klopt iets
niet"), zonder criterium of oordeel. Het systeem werkt die uit tot een voorstel,
langs dezelfde weg als een machinale vondst. De onderzoeker is dus de spotter,
niet de opsteller.

Het **criteriumoordeel** volgt uit de sampleoordelen samen:

| Uitkomst | Voorwaarde |
| --- | --- |
| `failed` | Eén akkoord bevonden bevinding, op welk sample dan ook |
| `not_tested` | Ergens in de rij nog "niet te bepalen", of een openstaand voorstel |
| `not_present` | De hele rij "niet aanwezig" |
| `passed` | Rij compleet, geen afkeuring |

Alleen `failed` kan vroeg. De andere drie vergen volledigheid — vandaar dat per
sample per criterium een oordeel wordt bewaard, en niet alleen de fouten.

**Volledigheid wordt per criterium gemeten, niet per sample.** Of een criterium
rond is, volgt uit de oordelen in zijn eigen rij; niet uit de vraag of die
pagina's op ándere criteria al klaar zijn. De eerste formulering hing `passed`,
`not_present` en `not_tested` op aan "alle samples nagekeken". Dat bleek in het
prototype onbruikbaar: zolang op één pagina één interactieve vraag openstond,
bleef élk criterium op `not_tested` staan — ook criteria waar alle twintig
pagina's allang een definitief oordeel hadden. Van de 33 criteria bleven er 27
grijs. Met de regel per rij worden criteria gaandeweg definitief, wat het
overzicht bruikbaar maakt tijdens het werk in plaats van pas aan het eind.

Nagekeken blijft bestaan als eigenschap van een sample — het zegt dat een pagina
af is — maar het is geen voorwaarde meer voor het criteriumoordeel.

## Derde uitgang: doorzetten naar het technische spoor

De grens tussen content en techniek is grijs, dus de agent blijft ook vondsten
melden die technisch blijken te zijn — de onderzoeker beoordeelt ze toch. Blijkt
een voorstel bij die beoordeling geen contentbevinding maar een sjabloon- of
platformgebrek, dan volgt een eigen route: er wordt een `TechnicalIssue`
aangemaakt, dat gaat naar de leverancier in plaats van naar de redactie.

Het voorstel wordt daarbij **afgewezen met reden en blijft bestaan**, met een
verwijzing naar het aangemaakte issue (`technicalIssueId` op `Finding`,
nullable). Niet omzetten: bij omzetten verdwijnt het voorstel uit de
duplicaatcontrole van `audit-samples` en wordt dezelfde vondst de volgende run
opnieuw voorgesteld — precies wat het bewaren van afwijzingen moest voorkomen.

De veldafbeelding ligt voor de hand: `description` → `description`, `advice` →
`request` (wat de leverancier moet doen), plus impact en criterium. Alleen
`supplier` kiest de onderzoeker erbij.

Let op: een `TechnicalIssue` heeft geen projectkoppeling — het geldt voor het
platform, niet voor één onderzoek. De doorzet-route moet daarom eerst kijken of
het issue al bestaat, net als de QuickFinding-controle bij bevindingen.

## Codes: `V` voor voorstellen, `B` pas bij akkoord

Een voorstel krijgt een code uit een eigen reeks (`V001`, `V002`, …). De
bevindingcode (`B001`, `B002`, …) wordt pas uitgedeeld op het moment van akkoord.

Reden: afwijzingen blijven bewaard, dus een afgewezen voorstel houdt zijn code
voorgoed bezet. Bij machinale voorstellen over twintig samples maal drieëndertig
criteria is het aantal afwijzingen groot genoeg om de B-reeks onbruikbaar te
maken — `B001`, `B007`, `B023`. Gaten in een auditrapport suggereren bovendien
dat er bevindingen zijn weggehaald. Gaten in de V-reeks ziet niemand.

Gevolgen: de code-uitgifte verhuist van de transactie die de bevinding aanmaakt
naar het akkoord-endpoint — hetzelfde patroon, ander moment. En de nummering
volgt voortaan de volgorde waarin de onderzoeker goedkeurt, niet de volgorde
waarin een agent-run iets vond.

Wanneer dit heroverwogen moet worden: als in de praktijk vrijwel nooit wordt
afgewezen. Dan zijn de gaten zeldzaam en is een tweede reeks alleen extra
begrippen. Dat is pas te zien na een aantal echte runs; tot die tijd is splitsen
de veilige kant, want een uitgedeelde code neem je niet meer terug.

## Het werkscherm: matrix als kaart, stapel als werk

Getoetst met een wegwerp-prototype op de echte gegevens van UTHEU-01 (20 samples,
33 criteria). Drie vormen naast elkaar: een matrix sample × criterium, een
taakstapel met één ding tegelijk, en een lijst per pagina.

Gekozen: **matrix en taakstapel samen**. Ze beantwoorden verschillende vragen —
de matrix "waar sta ik", de stapel "wat doe ik nu" — en de onderzoeker heeft ze
op verschillende momenten nodig. De lijst per pagina viel af omdat hij
daartussenin zit: te grof voor overzicht, te veel klikken om mee te werken.

De twee zijn gekoppeld: de matrix is klikbaar en start de stapel op dat punt. Een
cel opent het werk voor die combinatie, een kolom dat van één sample, een rij dat
van één criterium over alle samples. Die rij-ingang bleek het meest waardevol —
één criterium over twintig pagina's achter elkaar toetsen gaat sneller dan per
pagina van criterium wisselen.

Dit lost ook het gebrek op dat het prototype blootlegde: de matrix toont wel
*dat* er voorstellen wachten, maar niet waar. Zonder koppeling is dat een
doodlopend getal.

## Overwogen alternatieven

**Akkoord als los veld naast de status.** Afgevallen omdat een tweede as overal
apart uitgefilterd moet worden. Precies die fout zat al in de rapportberekening,
waar `open` en `published` per ongeluk gelijk werden behandeld. Als waarde in
`FindingStatus` is de poort onmogelijk te vergeten.

**Afwijzingen verwijderen.** Afgevallen omdat de duplicaatcontrole in
`audit-samples` tegen bestaande bevindingen kijkt. Een verwijderd voorstel staat
daar niet tussen, dus dezelfde onterechte vondst zou elke run terugkomen.

**Alleen een "nagekeken"-vlag per sample.** Afgevallen omdat dat een bewering is
zonder onderbouwing. De workflow berekent de sampleoordelen al; ze werden alleen
weggegooid. Bewaren maakt zichtbaar wat er goed ging, maakt teruggang tussen
nulmeting en herinspectie aanwijsbaar, en laat een herinspectie gerichter kijken.

**Een nieuwe tabel voor de sampleoordelen.** Afgevallen bij het bouwen: die tabel
bleek al te bestaan. `sample_criterion_checks` stond sinds 3 augustus 2026 in de
database met 1290 rijen — waaronder de volledige matrix van UTHEU-01, 20 samples
maal 33 criteria — maar ontbrak in `schema.prisma` en in de migratiegeschiedenis.
Hij is alsnog opgenomen in plaats van dat er een tweede tabel naast kwam.

Die tabel heeft bovendien een veld dat in dit ontwerp ontbrak: `bron`
(`workflow` | `gesprek` | `handmatig`), dat vastlegt of een oordeel van een agent
komt, uit een gesprek, of van de onderzoeker zelf. En een eigen poort op
sampleniveau: `akkoord` (`voorgesteld` | `akkoord` | `afgewezen`), naast de poort
op bevindingniveau.

**Handmatige invoer buiten de poort houden.** Afgevallen na verduidelijking van
het werkproces: wat de onderzoeker intypt is juist het minst uitgewerkt van
alles — grondstof, geen bevinding.

## Gevolgen

- Het aanmaken van een bevinding zet geen criterium meer op `failed`. Dat gebeurt
  bij het akkoord. Wie de oude regel zoekt, vindt hem niet meer.
- De fase-uitzondering voor `nulmeting` vervalt. Die bestond om te voorkomen dat
  een criterium te vroeg op `passed` sprong; dat kan nu niet meer, want `passed`
  vereist volledigheid. `afgerond` blijft op slot.
- Verwijderen van een bevinding herberekent voortaan het criteriumoordeel. Tot nu
  toe deed het niets, waardoor een criterium `failed` bleef zonder onderbouwing.
- Een opmerking keurt geen criterium meer af. Dat stond al zo beschreven in
  `lib/finding-classification.ts`, maar het aanmaak-endpoint keek alleen naar
  `status` en niet naar `type`.
- De CLI maakt standaard voorstellen aan in plaats van directe bevindingen.
