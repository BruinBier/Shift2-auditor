# Shift2-beoordelingsregels SC 3.3.7

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_3_3_7.md` als ze elkaar tegenspreken.

## De vraag

Vraagt een proces in een latere stap om iets dat de bezoeker eerder in datzelfde proces al
heeft ingevuld? Dan moet dat vooringevuld zijn of te kiezen uit wat er al staat. Opnieuw
intypen is de last die het criterium wil wegnemen: voor wie moeite heeft met typen, met
onthouden of met lezen.

"Hetzelfde proces" is één opdracht die uit meerdere stappen bestaat: een aanvraag, een
melding, een afspraak, een zoekopdracht met een resultatenpagina. Twee losse formulieren op
twee dagen zijn twee processen.

## Geen meerstapsproces is `niet_aanwezig`

De eis geldt pas als er in een proces iets voor de tweede keer wordt gevraagd. Een formulier
van één pagina, of een proces waarin niets terugkomt, levert `niet_aanwezig` op. Schrijf bij
de deelgebieden op welke stappen je hebt doorlopen.

## De uitzonderingen

Opnieuw invullen mag als:

1. **het essentieel is**: een wachtwoord ter bevestiging, een oefening waarin onthouden het
   doel is;
2. **het om beveiliging gaat**: een code opnieuw invoeren voor een gevoelige stap;
3. **de eerdere invoer niet meer geldig is**: een adres dat intussen is gewijzigd.

Een **bevestigingsveld voor een e-mailadres** ("Herhaal uw e-mailadres") is bij Shift2
eerder als afkeuring gerapporteerd; het staat zo in de intakelijst van QuickFindings. Volg
dat, tenzij de klant aantoont dat de herhaling essentieel is.

## Browser-autocomplete telt niet

Dat de browser een veld invult uit zijn eigen geheugen is geen mechanisme van de site. Meet
daarom in de auditsessie zonder opgeslagen formuliergegevens, of let erop dat de invulling
uit de vorige stap komt en niet uit de browser.

## Wat wél een afkeuring is

- **Naam, adres of contactgegevens die in stap 3 opnieuw leeg staan** terwijl ze in stap 1
  zijn ingevuld.
- **Terug naar een vorige stap wist de velden**, of de bevestigingspagina vraagt de gegevens
  opnieuw in plaats van ze te tonen.
- **Het zoekveld op de resultatenpagina is leeg**, zodat de zoekterm opnieuw getypt moet
  worden om de zoekopdracht aan te passen.
- **Na inloggen met DigiD worden bekende gegevens niet overgenomen** in het formulier.

Impact **matig**, verantwoordelijkheid **ontwikkelaar**: dit zit in de formulierengenerator
of de sessieafhandeling. Zit het in de generator van de leverancier zonder redactionele
ingang, dan is het een technisch issue en geen bevinding; zie `Shift2_Regels_SC_4_1_2.md`.

## Wat GEEN bevinding is

- **Een wachtwoord tweemaal invullen** bij het aanmaken van een account.
- **Een overzichtspagina die de gegevens toont** met een knop "Wijzigen" per onderdeel. Dat is
  precies wat het criterium wil.
- **Twee verschillende formulieren die allebei om een naam vragen.** Dat is niet hetzelfde
  proces.

## Op de kaart

> Dit blok staat in het scherm van "Waar sta ik". De kaart leest het rechtstreeks uit dit
> bestand: wat je hier verandert, staat bij de volgende keer verversen op de kaart. Er is
> geen tussenstap en geen kopie. Houd het kort — een kaart is geen naslagwerk. Wat langer
> is hoort in de secties hierboven.

### Titel

Wat de bezoeker al invulde, hoeft niet opnieuw

### In het kort

Vraagt een proces met meer stappen in stap 3 om de naam die in stap 1 al is ingevuld, dan
moet die er al staan of te kiezen zijn. Opnieuw intypen is de last die dit criterium
wegneemt. Ook een zoekterm hoort in het zoekveld te blijven staan op de resultatenpagina.

Een wachtwoord ter bevestiging mag wel opnieuw. Wat de browser zelf invult telt niet mee:
het moet van de site komen. Zonder proces waarin iets voor de tweede keer wordt gevraagd,
is dit criterium niet aanwezig.

### Audit-instructies

> Zet voor elke stap wie hem uitvoert: `[meting]` als een commando het al doet, `[jij]` als er
> een mens voor nodig is. De kaart toont dat met een vinkje of een open rondje, zodat er niet
> als opdracht staat wat allang gedaan is.

#### Stap 1 — In de auditsessie

1. [meting] `get-html`: de formulieren op de pagina en of het om een proces met stappen gaat
   (stapaanduiding, knop "Volgende", een overzichtsstap).
2. [agent] Doorloop de stappen met testgegevens in de auditsessie: vul stap 1 in, ga door, en
   lees met `get-html` per stap uit welke velden gevuld zijn en waar de waarde vandaan komt.
   Bij een zoekfunctie: zoek op een woord en lees het zoekveld op de resultatenpagina.
3. [agent] Ga vanuit een latere stap terug en lees of de velden er nog staan.

#### Stap 2 — Beoordelen

4. [agent] Wordt er in een latere stap iets gevraagd dat eerder al is ingevuld? Staat het er
   dan al, of is het te kiezen?
5. [agent] Valt een herhaling onder een uitzondering: essentieel, beveiliging, verlopen? Een
   bevestigingsveld voor een e-mailadres valt daar bij Shift2 niet onder.
6. [jij] Een proces achter DigiD of achter een betaalstap: doorloop het zelf, en let op of de
   bekende gegevens na het inloggen zijn overgenomen.

#### Stap 3 — Vastleggen

7. [agent] Stuur de vier deelgebieden hieronder mee met het oordeel, in hetzelfde
   `save-checks`-bericht: `"gebieden": [{ "gebied": "...", "uitkomst": "ok|nvt|fout|opmerking",
   "toelichting": "..." }]`. Zonder een complete lijst wordt het oordeel geweigerd. Kon je een
   gebied niet beoordelen, gebruik dan `nvt` met een toelichting.
8. [agent] De onderbouwing bij `reden` is **één of twee zinnen**: of de meting geldig was —
   kwam je op de gevraagde pagina uit, draaide de JavaScript, was het een auditsessie — en
   verder niets. Al het inhoudelijke gaat naar de deelgebieden.

### Zo is het vastgesteld

`get-html` per stap in de auditsessie laat zien welke velden gevuld zijn nadat de vorige
stap is ingevuld; de zoekfunctie wordt op dezelfde manier gelezen op de resultatenpagina.
Een stap die pas na een sessie te bereiken is, komt alleen in de auditsessie in beeld;
headless komt op de eerste stap uit en meldt een omleiding.

Wat hier niet uit blijkt: of een gevulde waarde van de site komt of van de browser. Dat
staat erbij als de auditsessie zonder opgeslagen formuliergegevens draait. Een proces
achter DigiD blijft werk voor de onderzoeker.

### Deelgebieden

1. Meerstapsformulier: eerder ingevulde gegevens staan in een latere stap al ingevuld of zijn te kiezen
2. Overzichtsstap en terugnavigeren: de gegevens blijven staan en worden getoond, niet opnieuw gevraagd
3. Zoekfunctie: de zoekterm staat in het zoekveld op de resultatenpagina
4. Uitzonderingen: wachtwoord ter bevestiging, beveiliging, verlopen gegevens; een bevestigingsveld voor e-mail hoort er niet bij

> Aangemaakt op 2026-09-13 bij ZOET-01, samen met de regelbestanden van 2.3.1, 2.4.2,
> 3.1.1, 3.1.2, 3.3.1 en 3.3.3. De regels komen uit de checklist; het bevestigingsveld
> voor e-mail komt uit de intakelijst van QuickFindings en is nog niet als regel door Frits
> bevestigd. Er zitten nog geen correcties uit audits in. Zet uitleg bij deze lijst altijd
> als blokcitaat: een gewone alinea eronder plakt de kaartlezer aan het laatste gebied vast.
