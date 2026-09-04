# Wat je aan ChatGPT Work vraagt

Kant-en-klare opdrachten om te kopiëren. Per situatie één blok tekst; vul in wat tussen
`[vierkante haken]` staat.

**Kopieer alleen het ingesprongen blok**, de regels achter de `>`. De uitleg eromheen is voor
jou, niet voor Work. Geef je dit bestand als geheel door, dan leest Work het als een handleiding
en vraagt het welke van de opdrachten je bedoelt.

Werkt alleen als de projectinstructies uit [work-instructie-intake.md](work-instructie-intake.md)
in Work staan. Zonder die instructies kent Work de werkwijze niet en moet je hem elke keer
meesturen.

## Waar Work bij kan

| Bron | Hoe | Wat het kan |
|---|---|---|
| **Dynamics CRM** | Agent-modus, jouw sessie | De projectenlijst lezen |
| **Cardan-portaal** | Agent-modus, jouw sessie | Zien wat Cardan voor ons uitvoert |
| **SIMcms** | Agent-modus, jouw sessie | Een pagina als concept aanmaken |
| **Outlook** | Agent-modus, jouw sessie | De inbox lezen, zoeken, een mail openen |
| **Shift2Auditor** | Codex, alleen lezen | Opzoeken wat er loopt |

**Zoeken in Outlook gaat via de zoekbalk**, niet via een connector. Work typt er een
zoekopdracht in en leest de resultaten, in alle mappen tegelijk. Dat werkt met de gewone
Outlook-syntaxis:

| Zoekterm | Wat je krijgt |
|---|---|
| `from:(@nissewaard.nl)` | Alles van die organisatie, ook van collega's daar |
| `from:(r.kruijmel@nissewaard.nl)` | Alleen van die persoon |
| `subject:(offerte)` | Op onderwerp |
| `received:>=8/1/2026` | Vanaf een datum |

De inbox zelf lezen kan ook, zonder zoekterm: "geef de vijftien meest recente berichten" werkt.
Alleen een oordeel als "wat moet ik nog beantwoorden" kan Work niet vellen — dat volgt uit de
vergelijking met wat er in de tool loopt, en daar is opdracht 1 voor.

Wat er openstaat aan lopende onderzoeken, weet Shift2Auditor zelf. Het dashboard heeft twee
blokken: **Actie nodig** (jij bent aan zet) en **Wacht op iemand anders** (met het aantal dagen
erbij). Na veertien dagen zonder reactie verschuift een onderzoek van het tweede blok naar het
eerste.

**Work schrijft nergens.** Het levert voorstellen: een blok dat jij plakt, een mail die jij
verstuurt, een pagina die jij publiceert.

---

## Wanneer draai je wat

| Ritme | Opdracht | Waarom |
|---|---|---|
| **Dagelijks** | 1. De map TG doorlopen | Dat is je wachtrij. Blijft hij een week staan, dan is de urgentie-sortering weinig waard: er ligt dan iets van maandag onderin. |
| **Wekelijks** | 2. De drie administraties naast elkaar | Verandert traag, en kost Work echt tijd — drie systemen doorlopen. Draai hem **vóór** de TG-ronde van die dag. |
| **Zo nu en dan** | 3. Wat ligt er in de inbox? | Vangt op wat niet in TG belandde. |
| **Per geval** | 4 tot en met 10 | Volgen uit wat de eerste drie opleveren. |

**De volgorde op de dag dat je allebei doet:** eerst de vergelijking, dan TG. De vergelijking
vult de context waar de TG-ronde uit put — weet je dat er zes onderzoeken voor Waalwijk bij
Cardan klaarstaan, dan kun je een bericht daaraan koppelen. Andersom lees je een mail en weet je
niet dat er al iets loopt. En de CRM-nummers heb je dan al, zodat de TG-ronde ze niet per bericht
opnieuw hoeft op te zoeken.

---

## 1. De map TG doorlopen

Wekelijks. Alles wat behandeld moet worden gaat in Outlook naar de map **TG**; wat eruit is, is
klaar. Deze opdracht inventariseert wat erin zit — verwerken doe je daarna per bericht.

> Lees alle berichten in de Outlook-map TG. Geef per bericht: afzender, onderwerp, datum, en in
> twee zinnen waar het over gaat en wat er van mij verwacht wordt.
>
> Kijk daarna in Shift2Auditor, dat lokaal draait op localhost:3000/onderzoeken. Alleen kijken,
> niets wijzigen. Zeg per bericht of het bij een lopend onderzoek hoort, en bij welk.
>
> Kijk ook in Dynamics, in de weergave "Mijn actieve projecten":
> https://cnxlm.crm4.dynamics.com/main.aspx?appid=7e1d990e-4bc4-ef11-b8e9-000d3aa94544&pagetype=entitylist&etn=pm_project&viewid=79626e75-2c8b-f111-ab0f-000d3a44acb4&viewType=4230
>
> Meld per bericht wat je daar bij die klant aantreft: projectnummer en projectnaam. Zeg erbij
> of het om een onderzoek gaat of om een doorlopend contract — abonnementen, strippenkaarten en
> "Toegankelijkheid Zilver" zijn dat laatste. Kies niet welk nummer het juiste is; dat beoordeel
> ik zelf. Staat er niets, meld dat dan.
>
> Staat het onderzoek al in Shift2Auditor maar ontbreekt daar het CRM-nummer, zeg dat er dan bij.
>
> Gaat het om een onderzoek dat Cardan uitvoert, kijk dan ook op https://mijn.cardan.com/dashboard
> onder Onderzoeken wat de status daar is, en met welk kenmerk (C-xxxx). Kijk niet onder
> Aanvragen; dat zijn offertes.
>
> Zet er per bericht bij wat voor soort het is: een nieuwe opdracht, een antwoord op iets dat
> loopt, of iets anders. Sorteer op wat het meest urgent is.
>
> Verwerk nog niets — ik ga per bericht beslissen wat ermee gebeurt.

**Die laatste regel is niet vrijblijvend.** Zonder die zin begint Work bij alles wat op een
opdracht lijkt alvast een intakeblok te maken, en dan staan er tien voorstellen door elkaar.

**Waarom het CRM erbij zit.** Bij een bericht uit TG wil je twee dingen weten: loopt er een
onderzoek voor, en is het verkocht? Dat tweede staat alleen in Dynamics. En het levert meteen
het nummer op dat de tool nodig heeft — het CRM-nummer blokkeert de planningsmail, dus vroeg of
laat moet je het toch opzoeken.

**Waarom Work niet kiest welk nummer het juiste is.** De projectnamen hebben geen vaste vorm.
Soms staat de site erin (P02337 omgevingsdocumenten.zoetermeer.nl), soms alleen de dienst
(P02383 Toegankelijkheid + hertest + adviesgesprek). Eén project kan meerdere onderzoeken dekken:
onder P02371 vallen vier contentonderzoeken voor Beverwijk. En bij een gemeente met een
Zilver-abonnement staat er een projectnummer dat er níet bij hoort — bij Overbetuwe is P01165
een doorlopend contract, niet het contentonderzoek van De Helster. Werk meldt wat het aantreft;
de keuze is aan de onderzoeker.

**Daarna per bericht.** Het overzicht zegt welk soort het is; daarmee weet je welke opdracht
hieronder erbij hoort — een nieuwe opdracht wordt nummer 4, een antwoord over scope nummer 8,
een mail die terug moet nummer 7. Zo is het vanochtend ook gegaan met de opdracht voor
Nissewaard: één mail, één blok, één handeling. Bij tien berichten is het hetzelfde, tien keer.

**Staat een bericht nergens** — niet in Shift2Auditor en niet in Dynamics — dan meldt Work dat
en verder niets. Wil je weten wat er speelt, gebruik dan opdracht 6: die zoekt de mailgeschiedenis
van die klant op. Bij Overbetuwe leverde dat een akkoord van vijftien dagen eerder op dat was
blijven liggen. Nuttig, maar te lang om het voor elk onvindbaar bericht in het overzicht te
zetten.

**Wat verwerkt is, gaat uit TG.** Archiveren volstaat: Work zoekt in alle mappen, dus je vindt
het later terug. Blijft een verwerkte mail staan, dan komt hij volgende week opnieuw in het
overzicht.

Verwerkt betekent: de handeling die eruit volgde is gedaan **én** afgevinkt in de tool. Een
antwoord dat wel verstuurd is maar niet afgevinkt telt niet — dan loopt de bewaking niet, en
dat is precies waarvoor de map bestaat.

## 2. De drie administraties naast elkaar leggen

Wekelijks, of als je het overzicht kwijt bent.

Dit is iets anders dan opdracht 1. Daar gaat het per bericht: hoort hier een onderzoek en een
CRM-project bij? Hier gaat het om de hele administratie, ook om onderzoeken waar helemaal geen
mail bij ligt — een verkocht project dat nooit is aangemaakt, uren die over hun budget heen
gaan, of werk dat bij Cardan klaarstaat zonder dat wij het volgen.

> Vergelijk drie lijsten voor me.
>
> **Dynamics**, weergave "Mijn actieve projecten" — wat er verkocht is:
> https://cnxlm.crm4.dynamics.com/main.aspx?appid=7e1d990e-4bc4-ef11-b8e9-000d3aa94544&pagetype=entitylist&etn=pm_project&viewid=79626e75-2c8b-f111-ab0f-000d3a44acb4&viewType=4230
>
> **Shift2Auditor**, localhost:3000/onderzoeken — wat wij volgen. Neem de hele lijst, ook de
> onderzoeken met status "In de wacht": die bestaan wel degelijk, ze liggen alleen stil omdat de
> klant aan zet is. Alleen kijken, niets wijzigen.
>
> **Het Cardan-portaal**, https://mijn.cardan.com/dashboard — wat Cardan voor ons uitvoert.
> Kijk **alleen** op het tabblad Onderzoeken, en daar alleen naar "Binnenkort" en "Bezig". De
> voltooide onderzoeken zijn afgerond werk en die laat je liggen. Kijk **niet** onder Aanvragen:
> dat zijn offertes en die zeggen niets over wat er loopt. Noem per onderzoek de status en het
> kenmerk (C-xxxx).
>
> Kijk daarnaast onder Diensten > Afspraken naar wat er op "Te plannen door klant" staat.
>
> Niet elk CRM-project levert een onderzoek op: abonnementen, strippenkaarten en
> "Toegankelijkheid Zilver" zijn doorlopende contracten. Kijk alleen naar projecten die een
> contentonderzoek, nulmeting of herinspectie beschrijven.
>
> Meld vier dingen:
> 1. CRM-projecten voor een onderzoek dat nog niet in Shift2Auditor staat.
> 2. Onderzoeken in Shift2Auditor waarvan het CRM-nummer ontbreekt.
> 3. Onderzoeken die bij Cardan lopen maar niet in Shift2Auditor staan.
> 4. Projecten met negatieve resterende uren, en afspraken die op mij staan te wachten.
>
> Zet er per punt bij om welke klant het gaat, met projectnummer en Cardan-kenmerk. Wijzig niets.

**Punt 1 gaat mis als Work alleen naar actieve onderzoeken kijkt.** Bij de eerste proef meldde
het BOZ-01, HAR-01, NIJKERK-01 en MDL-01 als ontbrekend, terwijl ze er alle vier stonden met
precies het CRM-nummer dat het noemde. Ze staan op "In de wacht" omdat de klant aan zet is — de
website is nog niet live, er staat nog geen content, de site wordt omgezet. Zonder de regel dat
de hele lijst telt, komt dat elke week terug.

**Punt 2** is de reden dat dit ertoe doet: het CRM-nummer moet er zijn voordat de planningsmail
uitgaat, en het dashboard houdt je daaraan.

**Punt 3** kwam bij de eerste proef meteen boven: bij Cardan stonden zes contentonderzoeken voor
gemeente Waalwijk klaar (C-4521), terwijl Waalwijk in Shift2Auditor niet eens als opdrachtgever
bestond. Er lag geen mail over in TG, dus langs die weg was het niet gevonden.

Diezelfde proef liet zien waarom het tabblad ertoe doet. Work keek ook onder Aanvragen en
meldde Dalfsen, Urk en Echt-Susteren als lopend werk, terwijl dat offertes waren van
onderzoeken die allang afgerond zijn. Onder Onderzoeken > Binnenkort stonden alleen de zes
Waalwijk-sites.

**Punt 4** staat nergens anders. Negatieve uren betekent dat een project over zijn budget heen
is. En op het Cardan-portaal staan afspraken op "Te plannen door klant" — kick-offs en
adviesgesprekken die op jou wachten, niet op Cardan.

**Alles wat bij Cardan loopt hoort in Shift2Auditor te staan.** De voltooide onderzoeken daar
zijn geschiedenis en horen er niet alsnog in; het gaat om wat nog moet gebeuren.

**De mailbox erbij halen** kan met een vervolgvraag, per klant die uit de vergelijking komt:

> Zoek in Outlook op `from:(@[domein])` en kijk of er sinds [datum] iets is binnengekomen over
> dit onderzoek dat ik nog niet verwerkt heb.

### Wat je met de uitkomst doet

Een vergelijking die je alleen leest verandert niets. Per punt:

| Uitkomst | Wat er gebeurt |
|---|---|
| CRM-nummer gevonden voor een onderzoek dat het miste | Invullen bij Project > Bewerken. Zonder dat nummer blokkeert het dashboard de planningsmail. |
| Verkocht project zonder onderzoek | Aanmaken via `/admin/intake` — opdracht 4 als er een mail met offerte bij hoort, anders met de hand. |
| Cardan-onderzoek dat niet in de tool staat | Aanmaken met `uitgevoerdDoor: "Cardan"`, en het C-kenmerk in de notitie. |
| Afspraak op "Te plannen door klant" | Inplannen bij Cardan, of vastleggen waarom niet. |
| Negatieve uren | Geen actie in de tool; wel weten voordat je nieuw werk toezegt. |

Loop ze af voordat je de TG-ronde draait. Wat je hier oplost, hoeft daar niet nog een keer op te
vallen.

## 3. Wat ligt er in de inbox?

Vangt op wat niet in TG belandde. Werk leest je inbox uit en legt hem naast wat er in de tool
loopt — nuttig als je het gevoel hebt dat er iets langs de wachtrij is geglipt.

> Geef de vijftien meest recente berichten uit mijn Outlook-inbox: afzender, onderwerp en
> datum.
>
> Kijk daarna in Shift2Auditor, dat lokaal draait op localhost:3000/onderzoeken. Alleen kijken,
> niets wijzigen.
>
> Zeg per bericht dat over toegankelijkheidsonderzoek gaat: hoort het bij een onderzoek dat
> daar loopt, of bij geen enkel? Nieuwsbrieven, systeemmeldingen en interne meldingen laat je
> weg.

Waar het om gaat is die laatste vraag. Een mail van een gemeente die nergens in de tool staat,
is óf een nieuwe opdracht óf iets dat is blijven liggen — en dat zie je nergens anders.

Bij de eerste proef leverde dit een mail van `webredactie@nederweert.nl` over toegankelijkheid
op, terwijl Nederweert helemaal niet in de administratie voorkomt.

## 4. Een nieuwe opdracht binnengekregen

Open de mail in Outlook, kopieer de link uit de adresbalk, sla de offerte op als PDF en
sleep die in het gesprek.

> Maak een intakeblok van deze opdracht: [link naar de mail in Outlook]
>
> De offerte stuur ik als bijlage mee. Lees de hele mailwisseling en de offerte. Lever het
> blok als JSON, en zet eronder in gewone taal wat er ontbreekt en wat je hebt aangenomen.

Plak het blok daarna op `/admin/intake`, in het vak "Blok uit ChatGPT Work plakken".

**Geen offerte bij de hand?** Vraag het blok toch, en meld dat de offerte volgt. Dan mist
Work de uren, de hertest en de uitvoerder, maar de rest klopt.

## 5. Controleren of een opdracht al in de tool staat

Voordat je een blok laat maken, bij twijfel of het al bestaat.

> Kijk in Shift2Auditor (draait lokaal op localhost:3000) of er al een onderzoek loopt voor
> [website of gemeente]. Alleen kijken, niets wijzigen. Meld wat je vindt: kenmerk, status en
> planning.

Dit gaat via Codex, die alleen mag lezen. Zie `adr/0004-codex-mag-alleen-lezen.md`.

Sneller is zelf kijken in de onderzoekenlijst — daar kun je op titel filteren.

## 6. De geschiedenis van een klant opzoeken

Bij een nieuwe opdracht van een bestaande klant: wat is er eerder gedaan?

> Zoek in mijn Outlook-mailbox op `from:(@[domein van de klant])` en `to:(@[domein])`, in alle
> mappen. Geef een tijdlijn van wat er over toegankelijkheidsonderzoek is gewisseld: wanneer,
> waarover, en met wie.

Dat levert vaak meer op dan verwacht. Bij gemeente Nissewaard bleek uit acht berichten dat de
site in december 2023 al eens is onderzocht, dat Cardan toen de hertest deed, en dat er in
januari 2024 een toegankelijkheidsverklaring is opgeleverd. Geen van die onderzoeken staat in
Shift2Auditor — de tool bestond toen nog niet.

Dat verandert het nieuwe onderzoek niet, maar het is context: er ligt een eerder rapport over
dezelfde site.

## 7. Een mail aan de klant klaarzetten

De tool heeft sjablonen voor de uitnodiging en de planningsmail: op de projectpagina onder
**Voorbereiding** staat per stap een knop "Kopieer uitnodiging" of "Kopieer planningsmail",
met het adres van de contactpersoon ernaast. Die tekst geef je aan Work.

> Zet in Outlook een antwoord klaar aan [naam] ([e-mailadres]), in de draad van [onderwerp of
> datum van de laatste mail]. Zet er deze tekst in:
>
> [de gekopieerde tekst]
>
> Laat hem als concept staan; ik verstuur hem zelf.

**Work verstuurt nooit.** Een verstuurde mail is niet terug te nemen, en hij gaat uit jouw
naam naar een gemeente.

Na het versturen: op de projectpagina de stap afvinken. Dat kan Work niet, en zonder die klik
begint de bewaking niet te lopen.

## 8. Het antwoord van de klant verwerken

Na het scopegesprek, of als de klant per mail op de scope reageert.

> Vat samen wat er in deze mail is afgesproken over de scope: [link naar de mail]
>
> Ik zoek: welke onderdelen van de site wel en niet onderzocht worden, welke pagina's de klant
> zelf aandraagt, of er testaccounts nodig zijn, en wanneer het onderzoek kan plaatsvinden.
> Zet wachtwoorden niet in je antwoord; meld alleen dát ze er zijn.

De uitkomst gaat naar de velden **In scope**, **Buiten scope** en **Door klant aangedragen
pagina's** op de projectpagina. Met de knop "Importeer naar scope & steekproef" worden daar
scope-items en steekproefpagina's van gemaakt.

## 9. Het rapport op SIMcms zetten

Als het onderzoek klaar is en het rapport eruit kan.

> Zet dit rapport als concept op simcms.shift2.nl. Neem de inhoud over zoals hij is; verander
> niets aan de tekst en de koppenstructuur. Publiceer niet — laat de moderatiestatus op
> concept staan, ik keur het zelf goed.

De inhoud komt uit de tool: `/api/reports/[id]/html` of de Word-export. Laat Work het rapport
nooit zelf opnieuw opbouwen uit losse gegevens — dan ontstaan er twee versies die uit elkaar
gaan lopen.

**Let op de opmaak.** Het rapport gaat over toegankelijkheid; koppen die door het overzetten
verhaspeld raken of een tabel zonder koprij is meer dan een schoonheidsfoutje. Kijk ernaar
voordat je publiceert.

## 10. Een tekst schrijven of nakijken

Voor alles wat geen vaste stap is: een lastige mail, een uitleg aan de klant, een stuk tekst
voor het rapport.

> [je vraag]
>
> Schrijf in het Nederlands, zakelijk en kort. Geen gedachtestreepjes.

Voor teksten die in het rapport terechtkomen gelden de schrijfregels uit `wcag-regels/`; die
kent Work niet. Laat rapportteksten liever door Claude Code schrijven, of leg ze daarna
daarlangs.

---

## Wat je niet aan Work vraagt

- **Een website beoordelen.** Dat doet Shift2Auditor met de regels in `wcag-regels/`. Work
  kent die niet, en een agent die zonder die regels naar een pagina kijkt levert afkeuringen
  op die niet bestaan — dat is op heuvelrug.nl twee keer gebeurd.
- **Iets in de tool wijzigen.** Work levert voorstellen; jij plakt en bevestigt.
- **Code aanpassen.** Dat gaat naar Claude Code.
- **Een mail versturen.** Opstellen als concept mag; op verzenden drukken niet.
