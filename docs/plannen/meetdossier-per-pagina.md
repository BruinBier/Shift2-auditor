# Twee vinkjes per pagina: wat er niet is, stelt de onderzoeker vast

**Status:** GEBOUWD op 14 september 2026 (commits 6960a72, d2600fc, ee51bac, 85ac797)
**Aanleiding:** de audit van één pagina kostte op 13 september 856.000 tokens
**Vervangt:** het eerste voorstel (uittreksels + agent per criterium), dat op twee punten
niet klopte

## Het probleem

Eén sample, `bo.zoetermeer.nl/omgevingsprogrammas`, 30 criteria:

| Agent | Beurten | Uitvoer | Context teruggelezen |
|---|---|---|---|
| audit | 73 | 35.000 | 13,6 miljoen |
| schrijf | 29 | 28.000 | 3,3 miljoen |
| verify | 24 | 27.000 | 2,4 miljoen |
| scout | 8 | 6.500 | 0,5 miljoen |
| qf-match | 5 | 1.600 | 0,25 miljoen |

Daarvan is dit de kern: **dertien van de 44 oordelen op dit project zijn `niet_aanwezig`**,
en zes daarvan (1.2.1 t/m 1.2.5 en 2.1.4) rusten op één en dezelfde vaststelling: er staat
geen video op deze pagina. Die vaststelling is zes keer apart gedaan en zes keer apart
opgeschreven. De redenen zijn woordelijk bijna gelijk: *"gezocht op video, audio, iframe,
embed en object en op YouTube- en Vimeo-insluitcodes"*.

Bij zes samples is dat 36 keer dezelfde ontdekking.

## Wat er is gemeten en wat dat uitsluit

Twee cijfers die de richting van de oplossing bepalen, en die in het eerste plan ontbraken.

**Elke agent start met ~80.000 tokens** vaste voet (systeemprompt, CLAUDE.md,
gereedschappen), gemeten over alle 34 agents in de journals. Daardoor is opsplitsen naar één
agent per criterium geen besparing maar een vervijfvoudiging:

| Opzet | Agents | Vaste voet | Totaal |
|---|---|---|---|
| Nu | 5 | 400.000 | 856.000 |
| 1 agent per criterium | 35 | 2.800.000 | ~3,1 mln |
| Groepjes van 5 | 11 | 880.000 | ~1,2 mln |

**Dat sluit "opsplitsen per criterium" uit**, ook al zou het de scherpte verbeteren.

**Het ophalen kost niets, het inlezen kost alles.** `get-html` draaien is een shell-commando:
nul tokens. Maar elke agent die het resultaat inleest betaalt opnieuw, en blijft er daarna
bij elke beurt voor betalen. Een schermafdruk die op beurt 8 binnenkomt wordt 65 keer
teruggelezen; dezelfde afbeelding op beurt 71 nog twee keer. Niet de grootte bepaalt de
rekening, maar de verblijfsduur.

## De oplossing: twee vinkjes per pagina

Op het tabblad Steekproef, per rij, twee vinkjes die de onderzoeker zet:

```
Pagina                      bewegend beeld    formulier
Home                              -               -
Omgevingsprogramma's              -               -
Wat is BO?                        x               -
```

**Bewegend beeld** is breed bedoeld: geen video, geen audio, geen animatie, geen GIF, geen
bewegend beeld in welke vorm dan ook. Staat het uit, dan zijn 1.2.1, 1.2.2, 1.2.3, 1.2.4,
1.2.5 en 2.1.4 niet van toepassing. 1.2.4, 1.4.2 en 2.2.2 vervallen sowieso, ongeacht de
vinkjes: live uitzendingen, geluid dat vanzelf begint en inhoud die uit zichzelf beweegt komen
op deze websites niet voor.

**Formulier** sluit 1.3.5, 3.3.1, 3.3.2, 3.3.3 en 3.3.7 af. 1.3.5 hoort erbij omdat dat
over `autocomplete` op invoervelden gaat: geen formulier, geen invoervelden.

Samen tien van de dertig criteria, per pagina.

### Drie toestanden, niet twee

- **aan** — staat erop, de agent beoordeelt normaal
- **uit** — staat er niet op, de bijbehorende criteria worden afgesloten
- **onbekend** (niet aangeraakt) — de agent doet wat hij nu doet

Leeg mag nooit "nee" betekenen. Een sample die met de hand is ingevoerd en waar niets is
aangevinkt, moet de gewone audit krijgen; anders sluit je criteria af door niets te doen.

### Waarom de onderzoeker en niet een agent

| | Wie stelt vast | Kan het stil fout gaan? |
|---|---|---|
| uit `description` lezen | agent leest vrije tekst | ja |
| uit `gebieden` van de steekproef | agent van de steekproef | ja |
| **vinkje** | **de onderzoeker** | alleen zichtbaar |

De onderzoeker heeft de pagina met eigen ogen gezien; de agent leidt het af uit code en een
opname. En het past bij `docs/adr/0001-akkoord-als-poort.md`: de onderzoeker is de poort, de
agent levert voorstellen. Een agent die zelf besluit dat 1.2.x niet hoeft, is dezelfde
overschrijding als een agent die een bevinding zonder akkoord laat meetellen.

De steekproef-workflow vult de vinkjes voor uit de `gebieden` die hij al per pagina
vaststelt. De onderzoeker ziet ze bij het goedkeuren van de steekproef (dat moment bestaat
al) en corrigeert wat niet klopt.

### Wat er op de kaart komt te staan

Geen deelgebieden, wel een spoor. Het regelbestand van 1.2.1 waarschuwt terecht dat *"er
staat geen media op de pagina"* er hetzelfde uitziet als niet-gekeken-hebben. Dat blijft
waar; het verschil is dat de onderzoeker heeft gekeken. Dat moet de kaart zeggen:

> **1.2.1** · niet_aanwezig · *vastgesteld door de onderzoeker bij de steekproef*
> Op deze pagina staat geen bewegend beeld: geen video, geen audio, geen animatie.
> Vastgesteld op 14 september 2026 bij het samenstellen van de steekproef.

Het akkoord op die kaart is dan een bevestiging van de eigen eerdere vaststelling, niet het
nakijken van een agent. De kaart mag dat ook zo benoemen.

### Het akkoord wordt NOOIT automatisch gezet

Dit is de makkelijkste verkeerde afslag in dit hele plan, dus het staat hier apart.

Het vinkje bepaalt het **oordeel**. Het bepaalt niet het **akkoord**. Dat zijn twee
verschillende beslissingen, door dezelfde persoon op twee momenten:

| | Wie | Wanneer | Wat het zegt |
|---|---|---|---|
| vinkje | onderzoeker | bij de steekproef | op deze pagina staat geen bewegend beeld |
| oordeel | volgt uit het vinkje | bij de audit | 1.2.2 is niet van toepassing |
| akkoord | onderzoeker | op de kaart | en daar sta ik voor in |

De tien afgesloten criteria komen dus gewoon in de werklijst van "Waar sta ik", met de knop
"Pagina akkoord voor <code>". Er verschijnt pas *"Door jou nagekeken en akkoord bevonden"*
nadat die knop is ingedrukt.

Drie redenen waarom dat zo moet blijven:

1. **Het zijn andere beslissingen.** Bij de steekproef stel je een feit vast; op de kaart
   trek je daar een conclusie uit. Die conclusie mag je herzien, bijvoorbeeld omdat je die
   animatie in de header bij nader inzien toch meetelt.
2. **Automatisch akkoord maakt het akkoord waardeloos.** Vinken tien van de dertig kaarten
   zichzelf af, dan zegt "28 bevestigd" niets meer. Dat is precies wat
   `docs/adr/0001-akkoord-als-poort.md` wil voorkomen.
3. **Het is het enige controlemoment op het vinkje.** Stond het verkeerd, dan zie je op de
   kaarten tien keer "geen bewegend beeld" staan terwijl je weet dat er een video op die
   pagina zit.

Wat wel scheelt: zo'n kaart is sneller af te handelen. Eén regel, geen agent-onderbouwing om
te wegen, en het akkoord bevestigt je eigen vaststelling. Eén klik in plaats van lezen en
beoordelen. De besparing zit in de tokens, niet in het klikwerk van de onderzoeker.

### Als de agent toch iets ziet

Staat het vinkje uit maar komt de audit-agent toch een speler tegen (bijvoorbeeld een die
pas na een klik laadt), dan schrijft hij geen oordeel. Hij zet een vlag: "bewegend beeld
aangetroffen terwijl het vinkje uit stond". Die komt op de kaart, de onderzoeker zet het
vinkje om.

De agent mag aanbellen, niet de poort openbreken.

## Wat er verder uit voortkomt

De vinkjes sluiten criteria af. Daarnaast wordt materiaal dat op elke pagina identiek is nu
zes keer gelezen bij zes samples:

- regelbestanden van criteria die op deze site niet spelen worden niet meer gelezen
- de `gebieden` uit de steekproef gaan als **aanwijzing** mee in de auditprompt, niet als
  poort: "gezien bij het samenstellen: overzicht met doorklikkers, twee kopniveaus". De
  agent loopt alle deelgebieden nog steeds af, maar begint niet van nul.

## Wat het oplevert

Per pagina tien van de dertig criteria zonder agent, plus de regelbestanden van die tien
ongelezen (~100.000 tekens).

| | Nu | Na |
|---|---|---|
| één sample | 856.000 | ~550.000 |
| zes samples | ~5,1 mln | ~3,3 mln |

De metingen veranderen niet, dus de oordelen veranderen niet.

## Wat er bewust NIET in zit

Afgevallen tijdens het grillen, met de reden:

- **Opsplitsen per criterium** — vier keer duurder door de vaste voet van 80.000 per agent.
  Dit was het hoofdvoorstel van het eerste plan en het was fout.
- **Regelbestanden samenvatten** — dat is het enige wat deze audit onderscheidt. Een
  samengevatte regel levert een oordeel dat er compleet uitziet en dunner is.
- **Deelgebieden voorinvullen door een verkenning** — holt de onderbouwing uit; precies waar
  de deelgebieden-eis van 13 september tegen beschermt.
- **Vinkjes voor tabel, afbeelding, complexe afbeelding** — die sluiten geen enkel criterium
  af, alleen deelgebieden binnen 1.3.1 en 1.1.1. Dat is meebeslissen binnen een criterium.
- **Een site-breed vinkje** — een uitspraak over pagina's die niet los zijn bekeken klopt bij
  een nieuwe sample of een herinspectie misschien niet meer.
- **`nietGedekt` uit de steekproef als poort** — die uitspraak is niet gedaan om oordelen op
  te baseren. Hij vult de vinkjes voor; de onderzoeker beslist.

## Te bouwen

1. Twee velden op `SampleItem`: `heeftBewegendBeeld` en `heeftFormulier`, elk drie
   toestanden (`Boolean?`, null = onbekend). **Migratie: backup vooraf, dev server stoppen,
   handmatig draaien.**
2. Vinkjes per rij op het tabblad Steekproef.
3. De steekproef-workflow vult ze voor uit `gebieden`.
4. `audit-samples`: bij "uit" de tien criteria afsluiten met de vaste reden en hun
   regelbestanden overslaan; bij "onbekend" niets veranderen.
5. De kaart toont de herkomst ("vastgesteld door de onderzoeker bij de steekproef") in het
   bronlabel, naast de status. **Het akkoord blijft een aparte handeling: de kaart komt
   gewoon in de werklijst en wordt nooit automatisch op akkoord gezet.** Zie de paragraaf
   hierboven.
6. De agent kan terugmelden wat hij aantreft dat niet aangevinkt stond.
7. `gebieden` als aanwijzing in de auditprompt.

Stap 1 tot en met 4 zijn de besparing. 5 en 6 zijn wat het verantwoord maakt; zonder die
twee is het een stille versmalling van het onderzoek.

## Wat er is gebouwd

Alle zeven, op 14 september 2026. Wat er in de praktijk anders bleek dan hier beschreven:

- **De PATCH-route zette `voorgesteld` onvoorwaardelijk op false.** Bedoeld voor de
  bewerkdialoog, maar een vinkje zetten is geen goedkeuring van de pagina. Gaat een bericht
  alleen over de vinkjes, dan blijft `voorgesteld` staan.
- **`get-project` stuurde de velden niet mee.** Nu wel, zonder `Boolean()` eromheen: null
  en false moeten verschillend blijven.
- **Er was een vierde bron nodig.** `steekproef`, naast workflow, gesprek en handmatig.
  Zonder die waarde zou de kaart "vastgelegd door de workflow" tonen bij een oordeel waar
  geen workflow aan te pas kwam.
- **De kaart zei "Oordeel van de agent".** Dat staat er nu alleen als er een agent is
  geweest; bij bron steekproef staat er "Volgt uit je steekproef".

Getest op Omgevingsprogramma's: zes oordelen weggeschreven met 25 deelgebieden, alle op
`akkoord=null` — geen enkele kaart vinkt zichzelf af. En getest dat een vergeten vlag op
`create-sample-item` het veld leeg laat in plaats van op false te zetten.
