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

1. **Eigennamen**: "Microsoft Teams", "Nederland Fietsland", een straatnaam. Ook merknamen,
   namen van personen en plaatsen, en een naam die uit een ander schrift is overgezet. W3C:
   "Albert Camus" hoeft in een Engelse tekst niet als Frans gemarkeerd.
2. **Technische termen**: een codewoord, een bestandsnaam, "PDF". De voorbeelden van W3C zijn
   Homo sapiens, Alpha Centauri, hertz en habeas corpus. Een Latijnse soortnaam is dus een
   technische term en hoeft geen markering. Op 19 september 2026 liepen drie agents op
   hetzelfde document juist daarover uiteen.
3. **Ingeburgerde woorden**, de Van Dale-toets: "online", "e-mail", "website", "download",
   "cookies", "app". Staat het in Van Dale en wordt het op zijn Nederlands uitgesproken, dan
   is het Nederlands geworden. Twijfel je, stel dan de vraag van W3C: spreek je het woord in
   een Nederlandse zin hetzelfde uit, op het accent na? Dan hoort het bij de omringende
   tekst ("consider whether the word would be pronounced the same (except for accent or
   intonation) in the language of the immediately surrounding text").
4. **Woorden waarvan de taal niet te bepalen is**.

## Ook één woord kan een afkeuring zijn

W3C: "even an individual word can be subject to the requirements of this criterion, unless it
falls under one of the exceptions". Een los woord telt standaard als deel van de omringende
taal, tenzij duidelijk is dat er bewust van taal gewisseld wordt. Is dat duidelijk en valt het
woord onder geen van de vier uitzonderingen, dan is een ontbrekende markering een afkeuring,
ook bij één woord. Daarom keurt een knop met alleen "Submit" af, en een taalwissel-link
"English" zonder `lang="en"`.

Tot 2026-10-11 stond op de kaart "Losse Engelse woorden zijn geen passage". Dat sprak de
regel over "Submit" tegen en klopt niet met W3C. Besluit Frits: volg W3C.

## Wat wél een afkeuring is

- **Een zin of alinea in een andere taal zonder `lang`**, ook een citaat en ook een
  tekst die alleen een schermlezer hoort (`sr-only`, `aria-label`).
- **Een verzameling anderstalige woorden zonder markering op het omsluitende element**: een
  menu met "Home", "News", "Contact", "About". Samen maken ze duidelijk dat er bewust Engels
  staat; markeer dan het omsluitende element, niet elk woord apart.
- **Een taalwissel-link** "English" of "Deutsch" zonder `lang="en"` of `lang="de"`. Hetzelfde
  geldt voor een knop met alleen "Submit" of "Search".
- **Een Friese passage zonder `lang="fy"`** op een site die verder Nederlands is.
- **Een Nederlandstalige pagina met Engelse hoofdinhoud**: QuickFinding "Engelstalige pagina
  zonder taalwisseling naar Engels" (843ace51), impact **serieus**, **ontwikkelaar**. Advies
  daar: de Nederlandse onderdelen vertalen, of de hele pagina Engels als taal geven.

Impact **matig**, verantwoordelijkheid **redacteur** voor tekst in de inhoud, **ontwikkelaar**
voor menu, knoppen en sjabloon.

## Wat GEEN bevinding is

- **Een ingeburgerd woord of een eigennaam met een taalmarkering**: dat is toegestaan, en geen
  bevinding, ook geen opmerking. W3C noemt het juist aanbevolen om de brontaal ook dan aan te
  geven, omdat de uitspraak er beter van wordt ("it's a best practice to programmatically
  indicate the source language of these words"). Tot 2026-10-11 stond hier dat het overbodig
  was en hooguit een opmerking; besluit Frits: volg W3C.
- **Een enkel Engels woord in een Nederlandse zin** dat onder een van de uitzonderingen valt.

## Wat W3C nog meer zegt (Understanding 3.1.2)

Naast deze regels gelegd op 2026-10-11. Elk punt noemt waar het staat.

**Beoordeel de code, niet wat de schermlezer zegt.** In een toegankelijke naam, zoals een
`aria-label` of de lijst met links die een schermlezer opsomt, geeft hulpsoftware een taalwissel
vaak niet door: de naam is een platte tekst zonder taal. Dat ligt aan de software en is geen
fout van de site. Staat de `lang` goed in de code, dan voldoet het, ook als de schermlezer het
woord toch met Nederlandse klanken uitspreekt (Understanding, de noot over "accessible names").
Een `lang` op het element zelf werkt in die gevallen vaak beter dan op een kindelement; dat
kan in een advies.

**Een ander schrift.** Staat er tekst in een ander schrift, zoals Arabisch of Chinees, of een
overgezette vorm daarvan, dan is een taalmarkering extra belangrijk: de uitspraak en de weergave
hangen ervan af (Understanding, "different writing system").

**Een ongeldige taalcode is een fout.** `lang="english"` of `lang="nederlands"` is geen geldige
code; de schermlezer wisselt dan niet. Het moet `lang="en"` of `lang="nl"` zijn. Dat is een van
de twee W3C-testregels bij dit criterium ("Element with lang attribute has valid language
tag").

**Inhoud en attribuut mogen in verschillende talen zijn.** Een link met `title="Spaans"` en de
tekst "Español" is goed, als die tekst `lang="es"` heeft (Understanding, het laatste
voorbeeld).

**De technieken.** Voldoende: H58, een `lang`-attribuut op de passage; PDF19, een Lang-waarde
bij de passage in een PDF. Een techniek is een manier om te voldoen, geen eis; zie
`Shift2_Bewijsvoering.md`.

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

Staat er geen anderstalige tekst, dan voldoet de pagina. Een los woord hoort standaard bij de
omringende taal, maar wordt er duidelijk van taal gewisseld, zoals bij een knop "Submit", dan
geldt de eis ook voor dat ene woord.

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
5. [agent] Pas de uitzonderingen toe: eigennamen, technische termen (ook een Latijnse
   soortnaam), ingeburgerde woorden en woorden van onbepaalde taal. Schrijf per twijfelgeval
   op welke uitzondering je toepast. Controleer ook of elke `lang`-code geldig is.
6. [jij] Twijfelgevallen van de Van Dale-toets: is een woord Nederlands geworden of niet?
   Spreek je het in een Nederlandse zin hetzelfde uit, op het accent na? Dat is een weging,
   geen meting.

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
