# Shift2-beoordelingsregels SC 3.3.1

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_3_3_1.md` als ze elkaar tegenspreken.

## De vraag

Als een formulier een invoerfout zelf opmerkt, wordt dan het veld aangewezen én de fout in
tekst beschreven? Twee eisen dus: de bezoeker moet weten wélk veld het is en wát er mis is.
Een rode rand alleen is geen van beide.

## Geen formulier is `niet_aanwezig`

Zie `Shift2_Voldoet_Of_Niet_Aanwezig.md`: zonder formulier zijn er geen foutmeldingen. Ook
een formulier dat niets controleert (een zoekveld dat elke invoer aanneemt) levert
`niet_aanwezig` op: de eis geldt pas als er een fout wordt opgemerkt. Schrijf bij de
deelgebieden op wat je hebt geprobeerd, anders is "geen foutmelding gezien" niet te
onderscheiden van "niet geprobeerd een fout te maken".

## 3.3.1 gaat over wat er staat, niet over hoe het gekoppeld is

Dezelfde scheiding als bij 3.3.2. Of de foutmelding programmatisch aan het veld hangt
(`aria-describedby`, `aria-invalid`, `role="alert"`) hoort bij **1.3.1** en **4.1.3**, met
QuickFinding "Foutmelding niet gekoppeld aan invoerveld" (cf38996c) onder 1.3.1. Bij 3.3.1
beoordeel je of de melding er in tekst staat, bij het veld of met de veldnaam erin, en of
hij zegt wat er fout is.

## Wat wél een afkeuring is

- **Alleen een rode rand of een pictogram**, zonder tekst. Het meest voorkomende geval.
- **Een melding die niet zegt welk veld**: alleen "Er zijn fouten" bovenaan, zonder veldnaam
  en zonder melding bij het veld.
- **Een melding die niet zegt wat er fout is**: "Fout", "Ongeldige invoer", "Dit is een
  vereiste vraag" bij een veld waar niet te zien is welke vraag dat is.
- **Een instructie in plaats van een foutmelding**: "Vul een geldige plaats in" zegt niet dát
  er iets fout ging. De melding hoort te beschrijven wat er misging: "U heeft geen geldige
  plaats ingevuld".
- **Fouten één voor één tonen** terwijl er meer zijn: na elke correctie verschijnt de
  volgende. De bezoeker weet dan niet hoeveel er nog komen.
- **Ingevulde gegevens verdwijnen** na de foutmelding, zodat alles opnieuw moet.

Impact **serieus**, verantwoordelijkheid **ontwikkelaar**: foutmeldingen zitten in het
formulieronderdeel van het sjabloon. Maakt de redacteur het formulier zelf in een
formulierenbouwer en kan hij de meldingsteksten aanpassen, dan **redacteur**. Zit het in de
formulierengenerator van de leverancier zonder redactionele ingang, dan is het een
technisch issue en geen bevinding; zie `Shift2_Regels_SC_4_1_2.md`.

## Wat GEEN bevinding is

- **Validatie door de browser zelf** (`required`, `type="email"`): die toont een tekstmelding
  bij het veld. Dat hij maar één fout tegelijk toont, is een beperking van de browser en geen
  afkeuring.
- **Een melding die pas na het verlaten van het veld verschijnt**, of juist meteen tijdens
  het typen. Het moment is geen eis, de tekst wel.
- **Een foutoverzicht bovenaan zonder links naar de velden.** Dat is een best practice.

## Op de kaart

> Dit blok staat in het scherm van "Waar sta ik". De kaart leest het rechtstreeks uit dit
> bestand: wat je hier verandert, staat bij de volgende keer verversen op de kaart. Er is
> geen tussenstap en geen kopie. Houd het kort — een kaart is geen naslagwerk. Wat langer
> is hoort in de secties hierboven.

### Titel

Een opgemerkte invoerfout wordt aangewezen en in tekst beschreven

### In het kort

Merkt het formulier een fout op, dan moet de bezoeker twee dingen te weten komen: welk
veld het is en wat er mis is. Allebei in tekst. Een rode rand alleen zegt niets aan wie
kleuren niet ziet, en niets aan wie een schermlezer gebruikt.

Zonder formulier, of met een formulier dat niets controleert, is dit criterium niet
aanwezig. Of de melding ook in de code aan het veld hangt, is 1.3.1; hier gaat het om wat
er staat.

### Audit-instructies

> Zet voor elke stap wie hem uitvoert: `[meting]` als een commando het al doet, `[jij]` als er
> een mens voor nodig is. De kaart toont dat met een vinkje of een open rondje, zodat er niet
> als opdracht staat wat allang gedaan is.

#### Stap 1 — In de auditsessie

1. [meting] `get-html`: de formulieren op de pagina, met per veld `required`, `type`,
   `pattern` en de teksten die er al bij staan.
2. [agent] Verstuur het formulier leeg: `get-screenshot --klik="tekst:Verzenden"` en daarna
   `get-html` op dezelfde pagina in de auditsessie. Lees welke meldingen er verschenen zijn en
   waar ze staan.
3. [agent] Vul een ongeldige waarde in een veld met een formaat (e-mail, postcode, datum,
   telefoon) en verstuur opnieuw.

#### Stap 2 — Beoordelen

4. [agent] Per melding: staat hij bij het veld of noemt hij de veldnaam? Zegt hij wat er fout
   is, en niet alleen wat er had gemoeten?
5. [agent] Is er iets dat alleen met kleur of een pictogram wordt aangegeven?
6. [agent] Staan de ingevulde gegevens er nog na de foutmelding?
7. [jij] Een formulier achter DigiD of achter een stap die niet zonder echte gegevens te
   nemen is: doorloop het zelf in de auditsessie.

#### Stap 3 — Vastleggen

8. [agent] Stuur de vier deelgebieden hieronder mee met het oordeel, in hetzelfde
   `save-checks`-bericht: `"gebieden": [{ "gebied": "...", "uitkomst": "ok|nvt|fout|opmerking",
   "toelichting": "..." }]`. Zonder een complete lijst wordt het oordeel geweigerd. Kon je een
   gebied niet beoordelen, gebruik dan `nvt` met een toelichting.
9. [agent] De onderbouwing bij `reden` is **één of twee zinnen**: of de meting geldig was —
   kwam je op de gevraagde pagina uit, draaide de JavaScript, was het een auditsessie — en
   verder niets. Al het inhoudelijke gaat naar de deelgebieden.

### Zo is het vastgesteld

`get-html` geeft de velden en hun regels; `get-screenshot --klik` verstuurt het formulier in
de auditsessie en legt vast wat er verschijnt, en een tweede `get-html` leest de meldingen
uit de code. Zonder auditsessie draait de JavaScript van het formulier vaak niet, en dan
lijkt het alsof er geen melding komt.

Wat hier niet uit blijkt: een stap achter een login, en of de melding voor een schermlezer
ook wordt aangekondigd. Dat laatste hoort bij 4.1.3.

### Deelgebieden

1. Leeg verplicht veld: het veld wordt aangewezen en de fout staat in tekst
2. Ongeldige waarde: de melding zegt wat er fout is, niet alleen wat er had gemoeten
3. Foutoverzicht en meldingen tijdens het typen: in tekst, niet alleen kleur of een pictogram, en niet één fout per keer
4. Ingevulde gegevens blijven staan na de foutmelding

> Aangemaakt op 2026-09-13 bij ZOET-01, samen met de regelbestanden van 2.3.1, 2.4.2,
> 3.1.1, 3.1.2, 3.3.3 en 3.3.7. De regels komen uit de checklist, de scheiding met 1.3.1
> uit `Shift2_Regels_SC_3_3_2.md`, en "Dit is een vereiste vraag" en fouten één voor één uit
> de intakelijst van QuickFindings. Er zitten nog geen correcties uit audits in. Zet uitleg
> bij deze lijst altijd als blokcitaat: een gewone alinea eronder plakt de kaartlezer aan
> het laatste gebied vast.
