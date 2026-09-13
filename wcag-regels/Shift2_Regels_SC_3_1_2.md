# Shift2-beoordelingsregels SC 3.1.2

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_3_1_2.md` als ze elkaar tegenspreken.

## De vraag

Staat er op een Nederlandse pagina tekst in een andere taal, en is die in de code als
zodanig gemarkeerd? Zonder `lang`-attribuut op die passage leest een schermlezer Engels met
Nederlandse klanken voor, en dat is niet te volgen. Het gaat over passages; de taal van de
hele pagina is 3.1.1.

## Geen anderstalige tekst is `voldoet`

Zie `Shift2_Voldoet_Of_Niet_Aanwezig.md`: de eis is dat anderstalige passages gemarkeerd
zijn. Zijn ze er niet, dan is daaraan voldaan. Schrijf bij de deelgebieden wel op waar je
hebt gezocht, ook in de verborgen teksten.

## De vier uitzonderingen

Geen markering nodig bij:

1. **Eigennamen**: "Microsoft Teams", "Nederland Fietsland", een straatnaam.
2. **Technische termen**: een codewoord, een bestandsnaam, "PDF".
3. **Ingeburgerde woorden**, de Van Dale-toets: "online", "e-mail", "website", "download",
   "cookies", "app". Staat het in Van Dale en wordt het op zijn Nederlands uitgesproken, dan
   is het Nederlands geworden.
4. **Woorden waarvan de taal niet te bepalen is**.

## Wat wél een afkeuring is

- **Een zin of alinea in een andere taal zonder `lang`**, ook een citaat en ook een
  tekst die alleen een schermlezer hoort (`sr-only`, `aria-label`).
- **Een verzameling anderstalige woorden zonder markering op het omsluitende element**: een
  menu met "Home", "News", "Contact", "About". Losse woorden zijn geen passage, maar samen
  vormen ze er een.
- **Een taalwissel-link** "English" of "Deutsch" zonder `lang="en"` of `lang="de"`. Hetzelfde
  geldt voor een knop met alleen "Submit" of "Search".
- **Een Friese passage zonder `lang="fy"`** op een site die verder Nederlands is.
- **Een Nederlandstalige pagina met Engelse hoofdinhoud**: QuickFinding "Engelstalige pagina
  zonder taalwisseling naar Engels" (843ace51), impact **serieus**, **ontwikkelaar**. Advies
  daar: de Nederlandse onderdelen vertalen, of de hele pagina Engels als taal geven.

Impact **matig**, verantwoordelijkheid **redacteur** voor tekst in de inhoud, **ontwikkelaar**
voor menu, knoppen en sjabloon.

## Wat GEEN bevinding is

- **Ingeburgerde woorden gemarkeerd**: "e-mail" met `lang="en"` is overbodig, geeft een rare
  wisseling van stem, maar is geen afkeuring. Noem het hooguit als opmerking.
- **Een enkel Engels woord in een Nederlandse zin** dat onder een van de uitzonderingen valt.

## Op de kaart

> Dit blok staat in het scherm van "Waar sta ik". De kaart leest het rechtstreeks uit dit
> bestand: wat je hier verandert, staat bij de volgende keer verversen op de kaart. Er is
> geen tussenstap en geen kopie. Houd het kort — een kaart is geen naslagwerk. Wat langer
> is hoort in de secties hierboven.

### Titel

Tekst in een andere taal is als zodanig gemarkeerd

### In het kort

Een zin, alinea of citaat in het Engels, Fries of Duits op een Nederlandse pagina moet een
taalkenmerk hebben, anders leest een schermlezer hem met Nederlandse klanken voor. Dat
geldt ook voor wat je niet ziet: verborgen teksten en labels. Eigennamen, technische
termen en ingeburgerde woorden als "e-mail" en "online" hoeven niet.

Staat er geen anderstalige tekst, dan voldoet de pagina. Losse Engelse woorden zijn geen
passage; een menu vol Engelse woorden wel.

### Audit-instructies

> Zet voor elke stap wie hem uitvoert: `[meting]` als een commando het al doet, `[jij]` als er
> een mens voor nodig is. De kaart toont dat met een vinkje of een open rondje, zodat er niet
> als opdracht staat wat allang gedaan is.

#### Stap 1 — Meten

1. [meting] `get-html`: de tekst van de pagina na JavaScript, met alle `lang`-attributen op
   elementen binnen de pagina. Op de homepage het hele document; elders de main-content.
2. [agent] Lees ook wat je niet ziet: `sr-only`-teksten, `aria-label`, `title`-attributen en
   het tekstalternatief van afbeeldingen. Een schermlezer leest die net zo goed voor.

#### Stap 2 — Beoordelen

3. [agent] Zoek zinnen, alinea's en citaten in een andere taal. Staat er een `lang` op dat
   element of op een omsluitend element?
4. [agent] Zoek losse anderstalige woorden in knoppen, links en menu's: "English", "Submit",
   "Search". Een taalwissel-link krijgt het kenmerk van zijn eigen taal.
5. [agent] Pas de uitzonderingen toe: eigennamen, technische termen, ingeburgerde woorden en
   woorden van onbepaalde taal. Schrijf per twijfelgeval op welke uitzondering je toepast.
6. [jij] Twijfelgevallen van de Van Dale-toets: is een woord Nederlands geworden of niet?
   Dat is een weging, geen meting.

#### Stap 3 — Vastleggen

7. [agent] Stuur de vier deelgebieden hieronder mee met het oordeel, in hetzelfde
   `save-checks`-bericht: `"gebieden": [{ "gebied": "...", "uitkomst": "ok|nvt|fout|opmerking",
   "toelichting": "..." }]`. Zonder een complete lijst wordt het oordeel geweigerd. Kon je een
   gebied niet beoordelen, gebruik dan `nvt` met een toelichting.
8. [agent] De onderbouwing bij `reden` is **één of twee zinnen**: of de meting geldig was —
   kwam je op de gevraagde pagina uit, draaide de JavaScript, was het een auditsessie — en
   verder niets. Al het inhoudelijke gaat naar de deelgebieden.

### Zo is het vastgesteld

`get-html` geeft de tekst en de code van de pagina na JavaScript, dus met elk
`lang`-attribuut dat een passage markeert en met de verborgen teksten die een schermlezer
ook voorleest.

Wat hier niet uit blijkt: of een woord ingeburgerd is. Dat is een weging die de agent maakt
en bij twijfel aan de onderzoeker voorlegt. In een PDF is een taalmarkering per passage
zelden gezet en moeilijk te lezen; daar is het oordeel een afkeuring met die kanttekening.

### Deelgebieden

1. Zinnen, alinea's en citaten in een andere taal, gemarkeerd op het element of een omsluitend element
2. Losse anderstalige woorden in knoppen, links, menu's en verborgen teksten: taalwissel-links en verzamelingen
3. Uitzonderingen toegepast: eigennamen, technische termen, ingeburgerde woorden; niet overbodig gemarkeerd
4. PDF's uit de steekproef: anderstalige passages met een taalmarkering

> Aangemaakt op 2026-09-13 bij ZOET-01, samen met de regelbestanden van 2.3.1, 2.4.2,
> 3.1.1, 3.3.1, 3.3.3 en 3.3.7. De regels komen uit de checklist, de QuickFinding 843ace51
> en de intakelijst van QuickFindings (een knop met alleen "Submit" is daar als afkeuring
> opgenomen). Er zitten nog geen correcties uit audits in. Zet uitleg bij deze lijst altijd
> als blokcitaat: een gewone alinea eronder plakt de kaartlezer aan het laatste gebied vast.
