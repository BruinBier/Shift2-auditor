# Wat de RAMP-toetsen opleverden

Per criterium: wat we al hadden, wat eruit is overgenomen, en waar RAMP onze regels
tegenspreekt. Zie `README.md` voor hoe we met die tegenspraak omgaan.

## SC 1.3.1 — Semantics (negen toetsen, 2026-08-23)

Gezien: CSS Content · Data Tables · Layout Tables · Data Tables: Header Elements ·
Data Tables: Header Attributes · Lists · Emphasized Text · Blockquote Elements ·
Cite, Sub & Sup Elements · Struck Through Text.

**Overgenomen**

- *De pictogram-uitzondering.* RAMP zegt bij Emphasized Text: negeer pictogramlettertypen,
  die zitten vaak in een `i` en zijn geen tekst. Dat stond nergens in onze regels, terwijl
  heuvelrug.nl er vol mee staat. Toegevoegd aan de kaart van 1.3.1.

- *Beide richtingen controleren.* Bijna elke RAMP-toets kijkt twee kanten op: iets dat een
  lijst is maar niet als lijst gecodeerd, én iets dat als lijst gecodeerd is maar geen lijst
  is. Onze regels beschreven meestal één kant. Dat is geen import maar een herstel: bij de
  footercontrole stond al in hoofdletters "DEZE CONTROLE KIJKT TWEE KANTEN OP", toegevoegd
  nadat een auditor iets afvinkte omdat de regel maar één kant beschreef.

**Niet overgenomen**

- *De richting van `em` en `strong`.* Zie README.

**Wat opviel aan de opzet**

De N/A-voorwaarde staat niet altijd vooraan: bij Data Tables is het instructie 1, bij
Blockquote instructie 3, bij Cite/Sub/Sup instructie 5 — afhankelijk van of je vóór of pas
ná het markeren weet of er iets van dat soort op de pagina staat.

Struck Through Text is de enige zonder gereedschap: daar staat "luister met een
schermlezer". RAMP laat dus per toets zien wat er niet te automatiseren valt.

## SC 1.1.1 — Pictures & Images (2026-08-23)

Gezien: Image Function · Text Alternatives · Complex Images · CAPTCHAs.

**Niet overgenomen**

- *De programmatische koppeling bij complexe afbeeldingen.* Zie README.

**Wat het wel opleverde**

De vergelijking legde bloot dat onze kaart de vijfde RAMP-instructie niet dekte. Die staat
er nu uitdrukkelijk als keuze in — "een programmatische koppeling is hier niet vereist" —
in plaats van dat hij ontbreekt. Een besluit dat je kunt teruglezen is iets anders dan een
gat.

## SC 2.4.4 en 4.1.2 — Links (twee toetsen, 2026-08-25)

Gezien: Link Purpose · Native Widgets: Link Function and Role.

Let op: één RAMP-categorie, twee succescriteria. RAMP groepeert op onderwerp, onze
regelbestanden op criterium. Deze categorie raakt dus `Shift2_Regels_SC_2_4_4.md` én
`Shift2_Regels_SC_4_1_2.md`.

**Wat we al hadden**

- *Context alleen uit hetzelfde element.* RAMP-instructie 3 zegt: beschrijft de linktekst
  het doel niet ("Read More"), dan moet er genoeg context zijn uit "other text in the same
  paragraph, list or table cell". Onze regel komt op hetzelfde uit en is er harder over: een
  link in een eigen `<p>` of `<li>` krijgt geen context van een kop die erboven staat maar
  niet in hetzelfde element zit. Zelfde uitkomst, andere woorden — niets te halen.

- Onze regels gaan op dit criterium veel verder dan RAMP: sociale-media-links zonder
  organisatie, telefoonnummers met een afwijkende bestemming, de X/Twitter-kwestie, PDF's,
  namen die alleen uit `title` komen. RAMP geeft het kader, wij hebben de jurisprudentie.

**Wat RAMP toevoegt — overgenomen op 2026-08-26**

- *Een `<a>` die geen link is.* De tweede toets eist dat een ankerelement dat als iets
  anders werkt — een knop, een tab — de juiste ARIA-rol draagt, en hangt dat onder 4.1.2.
  Onze 4.1.2-regels gaan vrijwel volledig over de **naam**; over de **rol** van een
  omgebouwd element staat er niets. De enige "functie boven techniek"-regel die we hebben
  gaat over AcroForm-knoppen in PDF's, niet over HTML. Dit is een echt gat, en het gaat om
  een patroon dat op gemeentesites veel voorkomt.

  **Besluit (2026-08-26):** overgenomen. `Shift2_Regels_SC_4_1_2.md` heeft een sectie "De rol,
  naast de naam" gekregen, en `get-links` meldt voortaan de rol van elk anker. Doorslaggevend
  was niet RAMP maar de meting: op de homepage van heuvelrug.nl dragen vier navigatie-items
  `role="menuitem"` en de ReadSpeaker-knop `role="button"` — vijf gevallen die nergens aan te
  toetsen waren. Ankers met zo'n rol vallen nu buiten het 2.4.4-oordeel en staan apart in het
  overzicht.

- *De N/A-stap.* Instructie 2: staan er geen links op de pagina, dan is de toets niet van
  toepassing. Onze regel kent die uitweg niet met zoveel woorden, terwijl Shift2 de status
  `niet_aanwezig` wel heeft. Dezelfde observatie als bij 1.3.1 in de vorige ronde.

  **Besluit (2026-08-26):** wél op de kaart, maar niet in RAMP's vorm. Shift2 heeft hier een
  eigen leer — `Shift2_Voldoet_Of_Niet_Aanwezig.md` geeft de beslisvraag, en
  `Shift2_Bewijsvoering.md` eist dat je noemt wáárop je gezocht hebt. RAMP's "if the content
  does not contain any links, evaluate as N/A" is precies het lege resultaat waar dat tweede
  bestand voor waarschuwt. Elke kaart krijgt daarom het antwoord van dat ene criterium mét de
  zoeklijst, niet de algemene regel.

**Waar RAMP ons tegenspreekt — niet overnemen**

- RAMP schrijft "same paragraph, **list** or table cell". WCAG zelf zegt: dezelfde zin,
  alinea, **lijstitem** of tabelcel, of de tabelkop van de cel waarin de link staat.
  Twee verschillen, elk de verkeerde kant op. *Lijst* in plaats van *lijstitem* zou
  betekenen dat een link in een `<li>` context mag ontlenen aan een ánder `<li>` in
  dezelfde lijst — ruimer dan WCAG en ruimer dan onze regel. En het weglaten van "dezelfde
  zin" en de tabelkop is juist strenger.

  Neem deze formulering dus niet over. Willen we hier iets aanscherpen, dan naar de tekst
  van WCAG zelf, niet naar die van RAMP.

  **Besluit (2026-08-26):** de vergelijking legde iets anders bloot dan een tegenspraak met
  RAMP — een tegenspraak binnen ons eigen materiaal. `Checklist_SC_2_4_4.md` somt WCAG's lijst
  volledig op, inclusief "dezelfde tabelcel (`<td>`) of tabelheader (`<th>`)". Het regelbestand
  zei alleen "hetzelfde element" en gaat vóór bij tegenspraak, en `get-links` implementeerde
  dat: de klim stopte bij de `<td>`, dus een `<th>` droeg nooit bij. Een link "Aanvragen" in een
  tarieventabel onder de rijkop "Paspoort" werd zo gemeld als generiek zonder context.

  Het regelbestand noemt nu WCAG's lijst, inclusief de tabelkoppen van de cel, en `get-links`
  zoekt ze op via `headers=`, anders via de rij- en kolomkop. Het strenge deel is ongewijzigd:
  een kop bóven de link telt niet. RAMP's eigen formulering is niet overgenomen.

**Wat opviel aan de opzet**

- Beide toetsen leunen op de Element Highlighter: RAMP markeert eerst alle links in beeld,
  daarna loopt de auditor ze visueel na. Dat is dezelfde beweging als onze `get-links`,
  alleen doet RAMP het op het scherm en wij in een lijst. Het verschil zit in wat je ziet:
  RAMP toont je de link zoals hij op de pagina staat, `get-links` de toegankelijke naam
  zoals hij wordt voorgelezen. Dat tweede is precies waar de logolink op heuvelrug misging.

- De N/A-voorwaarde staat hier op plek 2, na het markeren — je weet pas of er links zijn
  als je ze gemarkeerd hebt. Past bij de observatie uit de 1.3.1-ronde dat de plek van de
  N/A-stap meebeweegt met het moment waarop je het antwoord kunt weten.
