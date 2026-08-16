# Voldoet of niet aanwezig?

> Wanneer is een criterium gehaald, en wanneer is het niet van toepassing? Het verschil is
> subtiel en gaat regelmatig mis, in beide richtingen.

## De vraag die het beslist

Kijk naar wat het criterium **eist**, niet naar wat er op de pagina staat.

- Stelt het criterium een **eis waaraan je altijd kunt voldoen**, ook als er niets bijzonders op
  de pagina staat? Dan is het `voldoet`.
- Vereist het criterium dat er **iets specifieks aanwezig is** voordat er iets te toetsen valt?
  Staat dat er niet, dan is het `niet_aanwezig`.

## Voorbeelden

| Criterium | Statische pagina zonder bijzonderheden | Waarom |
|---|---|---|
| 2.3.1 Drie flitsen | **voldoet** | De eis is: niets flitst vaker dan 3× per seconde. Een pagina zonder flitsende content voldoet daaraan. |
| 2.2.2 Pauzeren, stoppen, verbergen | **niet_aanwezig** | De eis geldt alleen vóór content die automatisch beweegt. Is die er niet, dan is er niets om te pauzeren. |
| 1.4.2 Geluidsbediening | **niet_aanwezig** | De eis geldt alleen vóór geluid dat automatisch start. |
| 1.2.x Video en audio | **niet_aanwezig** | Zonder media is er geen ondertiteling of audiodescriptie te beoordelen. |
| 3.3.1 / 3.3.2 Formulieren | **niet_aanwezig** | Zonder formulier zijn er geen foutmeldingen of labels. |
| 1.3.3 Zintuiglijke eigenschappen | **voldoet** | De eis is: instructies leunen niet uitsluitend op vorm, kleur of locatie. Tekst zonder zulke instructies voldoet. |
| 1.4.1 Gebruik van kleur | **voldoet** | De eis is: informatie wordt niet uitsluitend met kleur overgebracht. |
| 3.1.2 Taal van onderdelen | **voldoet** bij Nederlandse tekst | De eis is: anderstalige passages zijn gemarkeerd. Zijn ze er niet, dan is aan de eis voldaan. |

## Het verschil in één zin

**2.3.1 tegenover 2.2.2** laat het scherpst zien waar de grens ligt. Beide gaan over beweging,
maar:

- 2.3.1 zegt: *er mag niets flitsen*. Een statische pagina houdt zich daaraan → `voldoet`.
- 2.2.2 zegt: *als er iets automatisch beweegt, moet je het kunnen pauzeren*. Zonder automatische
  beweging is die eis leeg → `niet_aanwezig`.

Een verbod waaraan je passief voldoet is dus iets anders dan een voorwaardelijke eis die pas
ontstaat als er iets aanwezig is.

## Twee valkuilen

**1. Media op de pagina maakt niet elk media-criterium van toepassing.** Staat er een video die
de gebruiker zelf moet starten, dan zijn 2.2.2 en 1.4.2 nog steeds `niet_aanwezig`: die gaan over
content die *automatisch* start. Wél van toepassing zijn dan 1.2.2, 1.2.3 en 1.2.5, en ook 2.3.1
(die video kan immers flitsen en is daarop te beoordelen).

**2. "Er is geen ..." in de reden betekent niet automatisch `niet_aanwezig`.** Bij 2.3.1, 1.4.1
en 1.3.3 is "er is geen flitsende content" / "geen informatie via kleur alleen" juist de
onderbouwing van `voldoet`. Kijk naar het criterium, niet naar de zinsbouw.

## Waarom het uitmaakt

`niet_aanwezig` telt in het rapport niet mee als getoetst criterium, `voldoet` wel. Een criterium
ten onrechte op `niet_aanwezig` zetten maakt het onderzoek dus smaller dan het was.

Aanleiding: BEV-03 (2026-08-04). 2.2.2 stond op de videopagina op `voldoet` terwijl de reden zei
dat er geen automatisch bewegende content was; op de elf andere samples stond het op
`niet_aanwezig`. Bij het corrigeren daarvan zette Claude ook 2.3.1 op `niet_aanwezig`; Frits
corrigeerde dat: een document zonder flitsende content voldoet aan de eis.
