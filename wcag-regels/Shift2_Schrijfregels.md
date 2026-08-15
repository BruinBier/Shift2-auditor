# Shift2-schrijfregels voor bevindingen

Deze regels gelden voor **elke** bevinding, ongeacht het succescriterium. Ze gaan over
de description en het advice-veld in de Shift2-auditor.

De SC-specifieke regels staan in `Shift2_Regels_SC_<code>.md`. Bij tegenspraak wint het
SC-bestand, want dat is specifieker.

> Let op: deze regels wijken bewust af van `wcag-checklists/Project_Instructie_WCAG_Audit.md`
> op twee punten (URL in de description, en HTML-fragmenten citeren). Die instructie is voor
> losse bevindingenrapporten; hier gaat het om bevindingen in de Shift2-auditor app.

## Structuur van de description

Kort en to-the-point. Bij eenvoudige issues drie zinnen:

1. **Locatie + wat er staat** — "Op de pagina staat ..." / "In de footer staat ..."
2. **Het kernprobleem** — "De afbeelding heeft geen tekstalternatief."
3. **Effect op de gebruiker** — "Wie de website met een schermlezer gebruikt, hoort ..."

Bij een complexer issue: noem het **kernprobleem voor de gebruiker eerst**, en pas daarna
de concrete oorzaken. Niet eerst een reeks technische observaties opsommen en het effect
tot het eind bewaren; de lezer moet meteen weten wat er misgaat.

Meer dan drie zinnen alleen als dat echt nodig is voor begrip.

## Wat je NIET doet

- **Niet met de URL beginnen.** Die staat al bij het SampleItem. Begin met "Op de pagina",
  "In de footer", "Boven aan de pagina".
- **Geen gedachtestreepjes.** Geen em-dash (—) en geen en-dash (–). Splits in twee zinnen
  of gebruik een komma.
- **Geen HTML-codeblokken.** Geen aparte sectie "HTML van de getroffen koppen:" met een
  fragment eronder. Noem elementen inline in de lopende tekst ("de koptekst is omsloten
  door een strong-element").
- **Geen volledige vindplaats-lijst.** Komt de bevinding op meerdere sample-items voor,
  geef dan één concreet voorbeeld ("Een voorbeeld is de link X in de footer van de
  homepage"). De gekoppelde sample-items tonen de rest al.
- **Geen andere criteria erin mengen.** Een verwant probleem dat onder een ander
  succescriterium valt, krijgt een eigen bevinding.
- **Niet dezelfde zaak twee keer uitleggen** in andere woorden. Het komt er bijna altijd
  zo in: eerst vanuit de software, dan vanuit de gebruiker. "Hulpsoftware kondigt geen
  lijst aan en noemt het aantal items niet, zodat wie de pagina laat voorlezen niet hoort
  dat het om een opsomming gaat en hoeveel er zijn" is één feit in twee jassen. Kies de
  kant van de gebruiker; die staat toch al voorgeschreven als derde zin.
- **Geen bewijsvoering in de bevinding.** Wat je hebt nagekeken en wat in orde was, hoort
  in de onderbouwing van het oordeel, niet in de bevinding. "De eerste en derde
  footerkolom doen dit wel goed" zegt de lezer van het rapport niets over het probleem dat
  hij moet oplossen.
- **Geen overbodige uitleg over hoe WCAG werkt.**

## Toon en formulering

- **Direct en stellig.** Vermijd "mogelijk", "misschien", "het wordt aanbevolen".
- **Bij contrast: "voldoende contrast hebben", niet "afsteken tegen".** Schrijf "zodat de
  witte tekst voldoende contrast heeft", niet "zodat de tekst er voldoende van afsteekt".
  Afsteken is beeldspraak vanuit het zien; contrast is de eis waar het om gaat.
- **Hulpsoftware leest voor, laat niets zien.** Schermlezers zijn auditief. Schrijf
  "hulpsoftware leest de linktekst voor" en "gebruikers horen alleen ...", nooit
  "hulpsoftware laat zien" of "gebruikers zien alleen".
- **Voorkeursvorm voor de doelgroep:** "Wie de website met een schermlezer gebruikt,
  hoort ..." Let op enkelvoud in de vervolgzin ("denkt", niet "denken ze"). Dit is een
  voorkeur, geen harde regel; volg de context van de zin.
- **Maximaal twee à drie voorbeelden**, met "zoals" of "bijvoorbeeld". Geen lange
  parenthetische opsommingen.
- **Voeg gelijksoortige voorbeelden samen.** Verschillen twee bullets alleen in een naam,
  maak er één bullet van ("In de video's van X en Y ...").
- **Site-breed patroon?** Koppel aan één representatief sample (meestal de homepage) en
  zet in de description "Dit patroon is op alle pagina's van de website aanwezig".

## Terminologie

Vermijd technisch jargon; bevindingen worden gelezen door redacteuren, bestuurders en
communicatiemedewerkers.

| Niet | Wel |
|---|---|
| DOM, DOM-volgorde | de code, volgorde in de code |
| markup | code, opmaak |
| node | element |
| tekstbeschrijving | **tekstalternatief** |
| "beschrijft wat er in de afbeelding staat" | "brengt de informatie over" |
| pipe-teken, pipe | **verticale streepje (|)** |
| bullet, bulletpoint | opsommingsteken |
| whitespace | witruimte |
| string | tekst |

HTML-elementnamen (`strong`, `em`, `h1`, `ul`, `li`, `th`) mogen wel genoemd worden, maar
inline in de lopende tekst, niet als los codeblok.

**Attribuutnamen en waarden mogen ook**, inline en tussen haakjes na de gewone term:
"een leeg tekstalternatief (alt="")", "het alt-attribuut". Dat maakt voor de ontwikkelaar
of redacteur concreet waar het over gaat, zonder dat de zin onleesbaar wordt voor anderen.
Gebruik het spaarzaam: noem eerst wat het is in gewone taal, dan pas de technische term.

Voor PDF-bevindingen geldt dit NIET: daar blijven interne tagnamen (`<Figure>`, `/Alt`,
`<LBody>`) buiten de tekst. Zie de PDF-regels hieronder.

Een tekstalternatief is **functioneel**, geen visuele beschrijving: het geeft de informatie
of boodschap door die de afbeelding overbrengt, niet hoe de afbeelding eruitziet.

### PDF-bevindingen

- Geen interne tagnamen: niet `<Figure>`, `ImageData`, `src`, `Alt-attribuut`, `<L>`,
  `<LBody>`, `<Lbl>`. Schrijf "als afbeelding aangemerkt", "geen tekstalternatief".
- Geen toolnamen in het advies: niet Canva, Word of InDesign. Spreek over "het
  brondocument". Adobe Acrobat mag wél genoemd worden bij concrete tag-stappen (het
  Tags-paneel, "Wijzig tagtype").

## Fout of opmerking

- **Fout** (afgekeurd, status `open`): impact én verantwoordelijkheid invullen.
- **Opmerking** (status `resolved`): impact en verantwoordelijkheid **altijd leeg laten**.
  Een opmerking is geen WCAG-schending maar een verbeteradvies.

Sluit het advies van een opmerking af met "Dit is een best practice." waar dat past
(zie de SC-bestanden voor 1.3.1).

## Voor je een bevinding aanmaakt

1. **Check de QuickFinding-bibliotheek** — bestaat er al een passende template? Gebruik die
   als basis in plaats van iets nieuws te schrijven.
2. **Check bestaande bevindingen in het project** — hetzelfde criterium met dezelfde oorzaak
   op een andere pagina? Breid dan de bestaande bevinding uit met het nieuwe sample-item in
   plaats van een duplicaat aan te maken. Meld dit proactief en vraag of het samengevoegd
   moet worden; beslis het niet zelf.
   Een andere **oorzaak** onder hetzelfde criterium is wél een aparte bevinding (1.3.1
   strong-in-kop is iets anders dan 1.3.1 br-als-lijst).
