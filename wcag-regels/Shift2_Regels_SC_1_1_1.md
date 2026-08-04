# Shift2-beoordelingsregels SC 1.1.1

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_1_1_1.md` als ze elkaar tegenspreken.

## Verplichte controle vóór je alt="" goedkeurt

Bij ELKE afbeelding met een leeg tekstalternatief (`alt=""`): kijk op de screenshot of er
leesbare tekst IN de afbeelding staat. Concludeer nooit "decoratief" op basis van de HTML
alleen, en niet op basis van de bestandsnaam.

Staat er tekst in (merknaam, embleem, slogan, banner, poster, infographic, campagnelogo),
ga dan na of diezelfde tekst elders op de pagina als echte tekst staat:

- **Wel elders als tekst** → geen bevinding; de informatie is al beschikbaar.
- **Niet elders als tekst** → bevinding onder 1.1.1. Wie de pagina laat voorlezen, krijgt
  die tekst anders niet mee.

Dit geldt óók als de afbeelding verder puur illustratief oogt, en óók als de tekst een
merknaam of logo is. Een logo mag onder 1.4.5 zijn uitgezonderd (afbeelding van tekst),
maar dat zegt niets over 1.1.1: de naam moet nog steeds voorleesbaar zijn. Beoordeel de
twee criteria los van elkaar.

Aanleiding: op de homepage van duurzaam.beverwijk.nl (2026-07-27) stond in de hero-illustratie
het embleem "Duurzaam Voordeel Beverwijk" met `alt=""`. Die naam stond nergens als tekst op de
pagina. De auditor noemde het "decoratief sfeerbeeld" op basis van de HTML en miste de bevinding.

## Hero-/headerafbeelding: adviseer tekst op de pagina, GEEN alt-tekst

Het CMS zet het tekstalternatief van een hero-/headerafbeelding altijd op leeg. De redacteur
kan daar dus geen alt-tekst invullen. Adviseer bij zo'n afbeelding daarom **nooit** "geef de
afbeelding een tekstalternatief" — dat is een advies dat niet uitvoerbaar is.

Adviseer in plaats daarvan om de tekst uit de afbeelding **als gewone tekst onder de hero** op
te nemen, bijvoorbeeld verwerkt in de introtekst van de pagina. De informatie is dan voor
iedereen beschikbaar en de lege alt is geen probleem meer: de afbeelding is dan werkelijk
decoratief, want de tekst staat elders.

Voorbeeldadvies:

> Neem de naam 'Duurzaam Voordeel Beverwijk' op als gewone tekst op de pagina, bijvoorbeeld in
> de introtekst onder de afbeelding. De informatie is dan beschikbaar voor iedereen, ook voor
> wie de afbeelding niet ziet.

Let op het verschil met een gewone afbeelding in de lopende tekst: daar kan de redacteur wél
een tekstalternatief invullen, dus daar blijft het normale alt-advies gelden.

## Regels

- Teaser-/kaart-afbeelding op een overzichtspagina of nieuwslijst (afbeelding + kop/link/datum die doorlinkt): alt="" is de GEWENSTE situatie. Geen bevinding. De toegankelijke naam komt uit de kop/link.
- Kaart-afbeelding (plattegrond, strooiroute, locatiekaart) met een korte label-alt ("Plattegrond wijkverdeling X"): GEEN bevinding, mits de inhoudelijke informatie elders op de pagina in tekst staat. Eis niet dat de alt alle wijken/straten opsomt.
- KAART MET EEN LEGENDA: een label-alt is niet genoeg om te concluderen dat het in orde is. Lees de legenda UIT DE AFBEELDING (bekijk hem echt, zoom zo nodig in) en vink item voor item af of elk gegeven ook in de tekst op de pagina staat. Let vooral op jaartallen, percentages en categorienamen; die worden vaak vergeten in de begeleidende tekst. Ontbreekt er iets, dan is dat een bevinding met de standaard kaarten-formulering. Voorbeeld: BEV-03 B024 (energietransitie, warmtetransitiekaart). De legenda noemde per categorie een startjaar (2021, 2022, 2023) dat nergens in de tekst stond; de auditor zag de label-alt en concludeerde ten onrechte "voldoet".
- Kaart waarvan de informatie NIET elders in tekst staat: wel een bevinding, en sluit de description af met letterlijk deze twee zinnen: "Kaarten vallen onder de wettelijke uitzondering voor de overheid en hoeven niet toegankelijk te zijn. De informatie die ermee wordt overgebracht (X) moet echter ook op een andere manier beschikbaar zijn." Pas alleen het deel tussen haakjes aan.
- Wel een bevinding bij een kaart met: bestandsnaam als alt, leeg alt zonder tekst eromheen, of misleidende alt.
- Logo in de site-header: schrijf "Boven aan de pagina staat het logo van ..." of "In de header ...". NOOIT "In het hoofdmenu staat het logo" — het logo staat naast, niet in het menu.
- CITEER DE TEKST UIT DE AFBEELDING WEL, zodat de lezer weet waar het over gaat. Is de tekst te lang om volledig over te nemen, citeer dan een deel en schrijf "zoals ...". Vastgelegd door Frits op 2026-08-03 bij UTHEU-01.
  Uitzondering: bij een LOGO citeer je de tekst niet. Daar gaat het erom dat de organisatienaam niet overkomt, niet om de letterlijke inhoud van het beeldmerk. Schrijf dus geen zin als "in het logo staat de naam 'Gemeente X'". Vastgelegd door Frits op 2026-08-02.
- LOGO OP EEN SUBSITE dat linkt naar de homepage van die subsite: is het tekstalternatief alleen de organisatienaam ("Logo gemeente X"), dan is dat een AFKEURING (klein, ontwikkelaar). De gebruiker hoort dat de link naar een homepagina gaat en denkt naar de hoofdsite van de organisatie te gaan, terwijl hij op de subsite blijft. Advies: neem zowel het logo als de bestemming op, bijvoorbeeld "Logo gemeente X, Website Duurzaam X". Speelt bij elke gemeentelijke subsite (duurzaam., open., mijn.). Voorbeelden: BEV-04 B003 (open.beverwijk.nl) en BEV-03 B017 (duurzaam.beverwijk.nl).
- Complexe afbeelding (organogram, processchema, infographic): ga EERST na of de inhoud al elders op de pagina in tekst staat, inclusief uitklapbare/details-secties. Staat het er al: advies beperken tot een korte alt-tekst. Ontbreekt substantiele info: adviseer de inhoud ook als tekst op de pagina (voorkeur boven een lange alt-tekst). Meld de uitkomst van die vergelijking in het voorstel.
- Afbeelding in <figure> met <figcaption> die de afbeelding al uitlegt: alt hoort LEEG te zijn. Staat in beide dezelfde tekst, dan is dat een bevinding wegens dubbele voorlezing.
- ONDERSCHRIFT DAT ALLEEN DE NAAM HERHAALT ("Zonneboiler" onder een foto van een zonneboiler): dit is oneigenlijk gebruik van het onderschrift. Een onderschrift hoort iets TOE TE VOEGEN (context, type, locatie, bron), niet te herhalen wat de afbeelding al is of wat de kop erboven al zegt. Afkeuring, klein en redacteur. Advies: haal het onderschrift weg en laat de alt leeg, OF geef het onderschrift informatie die nergens anders staat. Doe daarbij een concrete suggestie op basis van wat je op de foto ziet, bijvoorbeeld "Een zonneboiler met vacuümbuizen". Voorbeeld: BEV-03 B021 (duurzaam.beverwijk.nl/zelf-energie-opwekken).
- Losse afbeelding met beschrijvende tekst in een <p> eronder (geen figure): alt-tekst is VERPLICHT, ongeacht wat de tekst eronder zegt. Er is geen semantische koppeling.
- Evenementen-/promotieposter: adviseer twee dingen samen, een korte alt-tekst ("Poster van het Zomerfeest 2026 op het marktplein") EN de posterinhoud als gewone tekst onder de afbeelding of in de lopende tekst. Nooit de hele posterinhoud in de alt. Vergelijk eerst met de tekst op de pagina en benoem gericht wat echt ontbreekt.
- Galerij met meerdere fotos: geef in het advies TWEE verschillende voorbeelden ("bijvoorbeeld 'De aula van binnen' en 'De aula van buiten'"), zodat duidelijk is dat elke foto een eigen tekst krijgt.
- SIMsite-galerij (class ImageGallery-module-scss-module...) met alt="" plus bestandsnaam als bijschrift: TWEE losse bevindingen, 1.1.1 (klein, redacteur) voor de ontbrekende tekstalternatieven en 2.4.6 (klein, redacteur) voor de bestandsnaam als bijschrift. Alt en onderschrift mogen dezelfde tekst hebben; ze verschijnen niet tegelijk.
- Ingesloten videospeler (Bright/BBVMS, YouTube, Vimeo): check EERST of er een transcript-knop of "uitgeschreven tekst"-knop in de speler zit. Een toegankelijk gelabelde transcript-knop levert een geldig tekstalternatief. Dan GEEN 1.1.1-afkeuring.
- Afbeelding-link zonder toegankelijke naam: schrijf dat de link GEEN naam heeft. Niet "geen duidelijke naam" en niet "de schermlezer leest het webadres voor" (dat verschilt per schermlezer). Zie ook 2.4.4 en 4.1.2: dit is het klassieke geval waarin beide criteria gelden.
- Gebruik de term "tekstalternatief", niet "tekstbeschrijving". Formuleer alt als iets dat informatie OVERBRENGT, niet als iets dat de afbeelding "beschrijft".
- Inline base64-afbeelding (src begint met data:image) zonder alt: dit is een plak-incident van een redacteur, geen template-issue. Verantwoordelijkheid redacteur.
- Niet-getagde PDF onder 1.1.1: opmerking (status resolved, impact en responsibility leeg). Zonder tags kun je niet vaststellen wat er ontbreekt. De structuur-bevinding hoort onder 1.3.1.
- **WEL getagde PDF: concludeer niets over de tagkwaliteit uit de ruwe bytes.** Of een afbeelding als `/Figure` met een `/Alt` is opgenomen, of juist als `/Artifact` is gemarkeerd (de correcte manier voor een decoratief logo), staat meestal in een gecomprimeerde objectstroom en is zo niet te lezen. Vind je die markeringen niet, dan is dat géén bewijs dat ze ontbreken — maar het is ook geen bewijs dat ze er zijn.
  Schrijf dus niet "het logo is als Artifact gemarkeerd en wordt dus correct overgeslagen" als je dat niet hebt gezien. Zet het criterium op `niet_te_bepalen` met de vraag om PAC-output, of vraag de onderzoeker het in Acrobat na te kijken.
  Aanleiding: BEV-04 (2026-08-04), Openbare besluitenlijst. De audit concludeerde dat het logo als Artifact was gemarkeerd en zette 1.1.1 op `voldoet`, terwijl er nul `/Artifact`- en nul `/Figure`-voorkomens in de bytes stonden. Frits controleerde het in Acrobat: het logo is niet getagd. Bevinding B016 was dus terecht.
