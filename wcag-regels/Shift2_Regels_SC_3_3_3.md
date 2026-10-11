# Shift2-beoordelingsregels SC 3.3.3

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_3_3_3.md` als ze elkaar tegenspreken.

## De vraag

Als een formulier een invoerfout opmerkt en er is een manier bekend om hem te verhelpen,
krijgt de bezoeker die dan te horen? 3.3.1 zegt dát er iets fout is en waar; 3.3.3 zegt hoe
het goed moet. "De postcode is niet geldig" is 3.3.1; "Gebruik 1234 AB" is 3.3.3.

## Geen formulier, of geen opgemerkte fout, is `niet_aanwezig`

Zie `Shift2_Voldoet_Of_Niet_Aanwezig.md`. En als er wel een fout wordt opgemerkt maar er is
geen suggestie mógelijk (een vrij tekstveld dat leeg is en waar alleen "vul dit in" over te
zeggen valt), dan is aan de eis voldaan met die zin.

## Een instructie bij het veld telt als suggestie

Staat bij het veld al "Formaat: 1234 AB", dan hoeft de foutmelding het formaat niet te
herhalen. De suggestie is dan al gegeven, alleen eerder. Dat is precies waar 3.3.2 en 3.3.3
elkaar raken: beoordeel ze samen, maar rapporteer maar één keer.

## Wat wél een afkeuring is

- **Verkeerd formaat zonder dat het verwachte formaat ergens staat**: "De datum is ongeldig"
  terwijl niet bij het veld en niet in de melding staat dat het dd-mm-jjjj moet zijn.
- **Waarde buiten een vaste lijst zonder verwijzing**: "Gemeente niet gevonden" zonder "kies
  een gemeente uit de lijst" of een lijst om uit te kiezen.
- **Een leeg verplicht veld met een melding die niet zegt wat erin moet**, bij een veld waar
  dat niet vanzelf spreekt.

Impact **matig**, verantwoordelijkheid **ontwikkelaar**: de suggesties zitten in het
formulieronderdeel. Kan de redacteur de meldingsteksten zelf aanpassen in een
formulierenbouwer, dan **redacteur**.

**Templatecode van de leverancier is ook een bevinding.** Zit de fout in de
formulierengenerator van de leverancier, zonder redactionele ingang, dan maak je een
bevinding met verantwoordelijke **ontwikkelaar** én een technisch issue voor de leverancier,
zoals bij het SIMsite-galerijpatroon onder 1.1.1. Het succescriterium kent geen uitzondering
voor wie de code heeft gemaakt (WCAG 2.2, 5.4 geldt alleen voor inhoud van derden die later
wordt toegevoegd). Hoe je het technische issue aanmaakt staat in
`Shift2_Regels_SC_4_1_2.md`.

Dit geldt bij een volledig onderzoek. Bij een onderzoek waarvan het onderzoekstype "content" in de naam heeft (deelonderzoek of aanvullend onderzoek content) valt templatecode buiten het onderzoek: geen bevinding, wel een technisch issue. Zie `Shift2_Scope_Per_Sample.md`, "Templatecode: hangt af van het soort onderzoek".

> Gewijzigd op 2026-10-11. Besluit Frits 2026-10-11: volg W3C. Tot dan werd templatecode
> alleen een technisch issue zonder bevinding.

## Wat GEEN bevinding is

- **Geen suggestie bij een wachtwoord of een inlogcode.** Dat is de beveiligingsuitzondering.
  Een formaateis ("minimaal 8 tekens") mag wel, hoeft niet.
- **"Dit veld is verplicht" bij een veld waarvan de naam al zegt wat erin moet**, zoals
  "Uw naam".
- **Verlies van ingevulde gegevens na een fout.** Dat rapporteer je onder 3.3.7 (Understanding
  3.3.7, voorbeeld 3), niet hier. Besluit Frits 2026-10-11: volg W3C.

## Technieken (W3C)

- Voldoende, situatie A (formaat vereist): ARIA18 (`aria-alertdialog`), G85 (tekst bij invoer
  buiten het formaat), G177 (een voorgestelde verbetering), PDF22 (hetzelfde in een
  PDF-formulier).
- Voldoende, situatie B (beperkte set waarden): ARIA18, G84 (tekst bij een waarde buiten de
  lijst), G177, PDF22.
- Aanvullend: G139 (een manier om naar de fouten te springen), G199 (melding dat het
  versturen gelukt is), SCR18 (controle in de browser met een melding), SCR32 (melding via de
  DOM toevoegen).
- Fout: Understanding 3.3.3 noemt er geen.

Bron: Understanding 3.3.3, "Techniques".

## Op de kaart

> Dit blok staat in het scherm van "Waar sta ik". De kaart leest het rechtstreeks uit dit
> bestand: wat je hier verandert, staat bij de volgende keer verversen op de kaart. Er is
> geen tussenstap en geen kopie. Houd het kort — een kaart is geen naslagwerk. Wat langer
> is hoort in de secties hierboven.

### Titel

Bij een opgemerkte invoerfout staat hoe het goed moet

### In het kort

Zegt het formulier dat een postcode niet klopt, dan moet er ook staan wat wél klopt:
"Gebruik 1234 AB". Staat dat al als instructie bij het veld, dan is dat genoeg. Bij een
wachtwoord hoeft geen suggestie, om veiligheidsredenen.

Zonder formulier, of zonder fout die het formulier zelf opmerkt, is dit criterium niet
aanwezig. Het verschil met 3.3.1: dat criterium zegt dát en wáár het fout is; dit zegt hoe
het goed moet.

### Audit-instructies

> Zet voor elke stap wie hem uitvoert: `[meting]` als een commando het al doet, `[jij]` als er
> een mens voor nodig is. De kaart toont dat met een vinkje of een open rondje, zodat er niet
> als opdracht staat wat allang gedaan is.

#### Stap 1 — In de auditsessie

1. [meting] `get-html`: de formulieren op de pagina, met per veld de instructie die er al
   bij staat (formaat, voorbeeld, toelichting).
2. [agent] Verstuur het formulier leeg en daarna met een ongeldige waarde in elk veld met een
   formaat of een vaste lijst: `get-screenshot --klik="tekst:Verzenden"` en een tweede
   `get-html` in de auditsessie. Dezelfde handelingen als bij 3.3.1; doe ze één keer en lees
   voor beide criteria.

#### Stap 2 — Beoordelen

3. [agent] Per melding bij een verkeerd formaat: staat het verwachte formaat in de melding of
   als instructie bij het veld?
4. [agent] Per melding bij een waarde buiten een lijst: staan de toegestane waarden erbij of
   een verwijzing ernaar?
5. [agent] Per leeg verplicht veld: zegt de melding of de veldnaam wat erin moet?
6. [agent] Wachtwoord- en codevelden: terecht geen inhoudelijke suggestie.

#### Stap 3 — Vastleggen

7. [agent] Stuur de vier deelgebieden hieronder mee met het oordeel, in hetzelfde
   `save-checks`-bericht: `"gebieden": [{ "gebied": "...", "uitkomst": "ok|nvt|fout|opmerking",
   "toelichting": "..." }]`. Zonder een complete lijst wordt het oordeel geweigerd. Kon je een
   gebied niet beoordelen, gebruik dan `nvt` met een toelichting.
8. [agent] De onderbouwing bij `reden` is **één of twee zinnen**: of de meting geldig was —
   kwam je op de gevraagde pagina uit, draaide de JavaScript, was het een auditsessie — en
   verder niets. Al het inhoudelijke gaat naar de deelgebieden.

### Zo is het vastgesteld

Dezelfde handelingen als bij 3.3.1: `get-html` voor de velden en hun instructies,
`get-screenshot --klik` om te versturen in de auditsessie, en een tweede `get-html` voor de
meldingen. Zonder auditsessie draait de JavaScript van het formulier vaak niet.

Wat hier niet uit blijkt: een stap achter een login, en of een suggestie ook werkelijk
helpt. "Vul een geldige waarde in" is een zin, geen suggestie; dat weegt de agent.

### Deelgebieden

1. Leeg verplicht veld: de melding of de veldnaam zegt wat erin moet
2. Verkeerd formaat: het verwachte formaat staat in de melding of als instructie bij het veld
3. Waarde buiten een vaste lijst: de toegestane waarden of een verwijzing ernaar
4. Wachtwoord- en codevelden: terecht geen inhoudelijke suggestie

> Aangemaakt op 2026-09-13 bij ZOET-01, samen met de regelbestanden van 2.3.1, 2.4.2,
> 3.1.1, 3.1.2, 3.3.1 en 3.3.7. De regels komen uit de checklist; het verlies van
> ingevulde gegevens is bewust maar bij één criterium ondergebracht, zodat het niet twee keer
> in het rapport komt. Sinds 2026-10-11 is dat 3.3.7 (was 3.3.1). Er zitten nog geen correcties uit audits in. Zet uitleg bij deze lijst
> altijd als blokcitaat: een gewone alinea eronder plakt de kaartlezer aan het laatste
> gebied vast.
