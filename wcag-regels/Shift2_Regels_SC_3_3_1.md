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

Impact **serieus**, verantwoordelijkheid **ontwikkelaar**: foutmeldingen zitten in het
formulieronderdeel van het sjabloon. Maakt de redacteur het formulier zelf in een
formulierenbouwer en kan hij de meldingsteksten aanpassen, dan **redacteur**.

**Templatecode van de leverancier is ook een bevinding.** Zit de fout in de
formulierengenerator van de leverancier, zonder redactionele ingang, dan maak je een
bevinding met verantwoordelijke **ontwikkelaar** én een technisch issue voor de leverancier.
Zo gaat het al bij het SIMsite-galerijpatroon onder 1.1.1. Het succescriterium kent geen
uitzondering voor wie de code heeft gemaakt; WCAG 2.2 kent alleen een verklaring van
gedeeltelijke conformiteit voor inhoud van derden die later wordt toegevoegd en buiten de
macht van de auteur valt (WCAG 2.2, 5.4). Een sjabloon dat de organisatie zelf heeft gekozen
valt daar niet onder. Hoe je het technische issue aanmaakt staat in
`Shift2_Regels_SC_4_1_2.md`.

> Gewijzigd op 2026-10-11. Besluit Frits 2026-10-11: volg W3C. Tot dan werd templatecode
> alleen een technisch issue zonder bevinding, en kwam 3.3.1 op voldoet terwijl de fout er
> stond.

## Wat W3C uitdrukkelijk toelaat

Besluit Frits 2026-10-11: volg W3C. Deze twee punten waren tot die datum een afkeuring.

- **Een melding in instructievorm voldoet.** Verschijnt na het versturen bij het veld "Vul
  een geldige plaats in", dan weet de bezoeker welk veld het is en wat er moet. Dat is genoeg.
  Understanding 3.3.1 (Intent) noemt "Please provide a valid email address in the format
  name@domain.com" als melding die aan 3.3.1 én 3.3.3 voldoet. Een melding die alleen
  "Ongeldige invoer" zegt, blijft een afkeuring: die zegt niet wat er mis is.
- **Fouten één voor één tonen is geen afkeuring.** Understanding 3.3.1 schrijft geen manier
  van tonen voor: "This criterion does not mandate any particular way in which errors should
  be displayed." Elke melding die verschijnt, moet wel aan de eisen hierboven voldoen. Alle
  fouten tegelijk tonen mag je als advies meegeven, in een opmerking.

## Ingevulde gegevens die verdwijnen: 3.3.7, niet 3.3.1

Verdwijnen de ingevulde gegevens na de foutmelding, dan rapporteer je dat onder **3.3.7**
(Overbodige invoer), niet hier. Understanding 3.3.7 geeft precies dit als voorbeeld 3: een
afrekenformulier met een fout creditcardnummer toont een foutmelding, en wat er was
ingevuld wordt niet gewist. Zie `Shift2_Regels_SC_3_3_7.md`. Besluit Frits 2026-10-11: volg
W3C.

## Wat GEEN bevinding is

- **Validatie door de browser zelf** (`required`, `type="email"`): die toont een tekstmelding
  bij het veld. Dat hij maar één fout tegelijk toont, is een beperking van de browser en geen
  afkeuring.
- **Een melding die pas na het verlaten van het veld verschijnt**, of juist meteen tijdens
  het typen. Het moment is geen eis, de tekst wel.
- **Een foutoverzicht bovenaan zonder links naar de velden.** Dat is een best practice.
- **Een melding in instructievorm** bij het veld, zoals "Vul een geldige plaats in". Zie
  hierboven.
- **Fouten die één voor één verschijnen.** Zie hierboven; hooguit een opmerking als advies.

## Technieken (W3C)

- Voldoende, situatie A (verplicht veld niet ingevuld): G83 (tekst die zegt welk verplicht
  veld niet is ingevuld), ARIA21 (`aria-invalid` op het foute veld), SCR18 (controle in de
  browser met een melding), PDF5 (verplichte velden in een PDF-formulier).
- Voldoende, situatie B (formaat of waarde vereist): ARIA18 (`aria-alertdialog`), ARIA19
  (`role="alert"` of een live region), ARIA21, G84 (tekst bij een waarde buiten de lijst),
  G85 (tekst bij invoer buiten het formaat), SCR18, SCR32 (melding via de DOM toevoegen),
  PDF22 (hetzelfde in een PDF-formulier).
- Aanvullend: G139 (een manier om naar de fouten te springen), G199 (melding dat het
  versturen gelukt is), ARIA2 (`aria-required`).
- Fout: Understanding 3.3.1 noemt er geen.

Bron: Understanding 3.3.1, "Techniques".

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
kleuren niet ziet, en niets aan wie een schermlezer gebruikt. Een melding als "Vul een
geldige plaats in" bij het veld voldoet, en fouten mogen één voor één verschijnen (W3C).
Gegevens die na de fout verdwijnen horen bij 3.3.7.

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

4. [agent] Per melding: staat hij bij het veld of noemt hij de veldnaam? Zegt hij wat er mis
   is of wat er moet? Een instructie als "Vul een geldige plaats in" voldoet; "Ongeldige
   invoer" niet.
5. [agent] Is er iets dat alleen met kleur of een pictogram wordt aangegeven?
6. [agent] Staan de ingevulde gegevens er nog na de foutmelding? Zo niet, dan is dat een
   bevinding onder 3.3.7, niet onder 3.3.1.
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
2. Ongeldige waarde: de melding zegt in tekst wat er fout is of wat er moet; een instructie bij het veld voldoet
3. Foutoverzicht en meldingen tijdens het typen: in tekst, niet alleen kleur of een pictogram
4. Mislukt versturen: de bezoeker krijgt te weten dát het niet gelukt is, ook als het formulier opnieuw verschijnt

> Gebied 2, 3 en 4: Hernoemd op 2026-10-11 (besluit Frits: volg W3C); oordelen van daarvoor staan nog onder de oude naam en krijgen een open ring bij dit gebied.
> Gebied 3 noemde ook "niet één fout per keer"; W3C eist niet dat alle fouten tegelijk
> verschijnen. Gebied 4 ging over ingevulde gegevens die verdwijnen; dat valt onder 3.3.7
> (W3C, voorbeeld 3 daar). In de plaats kwam een punt uit de Intent van 3.3.1: het formulier
> opnieuw tonen zonder te melden dat het versturen mislukte, voldoet niet.
>
> Aangemaakt op 2026-09-13 bij ZOET-01, samen met de regelbestanden van 2.3.1, 2.4.2,
> 3.1.1, 3.1.2, 3.3.3 en 3.3.7. De regels komen uit de checklist, de scheiding met 1.3.1
> uit `Shift2_Regels_SC_3_3_2.md`, en "Dit is een vereiste vraag" en fouten één voor één uit
> de intakelijst van QuickFindings. Er zitten nog geen correcties uit audits in. Zet uitleg
> bij deze lijst altijd als blokcitaat: een gewone alinea eronder plakt de kaartlezer aan
> het laatste gebied vast.
