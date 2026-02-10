/**
 * Extended documentation for crawler tests
 *
 * This file contains additional detailed information about each test
 * that can be shown in the "Meer info" expandable section.
 */

export interface TestDocumentation {
  testName: string;
  extendedInfo: string;
}

export const TEST_DOCUMENTATION: Record<string, string> = {
  'ImgMissingAltTest': `## Achtergrond

Deze test controleert of alle afbeeldingen op de pagina een alt-attribuut hebben. Het alt-attribuut is essentieel voor gebruikers die geen afbeeldingen kunnen zien, zoals:

- Gebruikers met een visuele beperking die een schermlezer gebruiken
- Gebruikers met een trage internetverbinding waar afbeeldingen niet laden
- Gebruikers die afbeeldingen hebben uitgeschakeld

## Technische details

De test gebruikt Cheerio om de HTML te parsen en zoekt naar:

- Alle <img> elementen op de pagina
- Controleert of deze een alt-attribuut hebben (ook als het leeg is)
- Een leeg alt-attribuut (alt="") is geldig voor decoratieve afbeeldingen

## WCAG Criteria

- **1.1.1 Niet-tekstuele content** (Niveau A)
- Alle niet-tekstuele content moet een tekstalternatief hebben

## Veelvoorkomende fouten

- Afbeeldingen zonder alt-attribuut
- Alt-teksten die niet beschrijvend zijn (bijv. "image.jpg")
- Het weglaten van alt bij decoratieve afbeeldingen (gebruik alt="")

## Oplossingen

1. Voeg een alt-attribuut toe aan alle <img> elementen
2. Gebruik beschrijvende tekst die de functie van de afbeelding uitlegt
3. Voor decoratieve afbeeldingen: gebruik alt=""
4. Voor complexe afbeeldingen: overweeg longdesc of een tekstuele beschrijving in de context`,

  'AriaLandmarksTest': `## Achtergrond

ARIA landmarks helpen gebruikers van schermlezers om snel door de structuur van een pagina te navigeren. Deze test controleert of:

- De pagina belangrijke gebieden heeft gemarkeerd als landmarks
- Meerdere landmarks van hetzelfde type unieke namen hebben (SIA-R56)
- ARIA-rollen correct worden gebruikt

## Technische details

De test detecteert:

- Semantische HTML elementen (<header>, <nav>, <main>, <footer>, <aside>)
- Expliciete ARIA role attributen
- Duplicate landmarks zonder unieke aria-label of aria-labelledby

## SIA-R56 Validatie

Wanneer er meerdere landmarks van hetzelfde type zijn (bijv. 2 navigaties), moeten deze een unieke toegankelijke naam hebben via:

- aria-label: geeft een directe naam
- aria-labelledby: verwijst naar een element met een id

## Veelvoorkomende landmarks

- **banner**: Hoofd-header van de pagina (<header> of role="banner")
- **navigation**: Navigatiemenu's (<nav> of role="navigation")
- **main**: Hoofdinhoud van de pagina (<main> of role="main")
- **contentinfo**: Footer informatie (<footer> of role="contentinfo")
- **complementary**: Aanvullende content (<aside> of role="complementary")
- **search**: Zoekfunctionaliteit (role="search")

## WCAG Criteria

- **2.4.1 Blokken omzeilen** (Niveau A)
- **4.1.2 Naam, rol, waarde** (Niveau A)`,

  'IframeIsHCaptchaTest': `## 1. Detectie van de "Poortwachter"

De test scant de HTML-broncode op zoek naar specifieke hCaptcha-kenmerken. Hij zoekt naar:

- **iframe-elementen** met een src die "hcaptcha.com" bevat
- **div-containers** met het attribuut data-hcaptcha-sitekey

Hiermee stelt de tool vast: "Er is een beveiligingscheck aanwezig op deze pagina."

## 2. De "Identiteitscheck" (WCAG 4.1.2)

Dit is de belangrijkste stap voor toegankelijkheid. De test controleert of het iframe een title-attribuut heeft.

**Zonder titel:** Een screenreader zegt alleen "Frame". De gebruiker weet niet dat hij een captcha moet oplossen om een formulier te kunnen verzenden.

**Met titel:** De screenreader zegt bijvoorbeeld: "Frame: Beveiligingscheck. Bewijs dat u een mens bent." Dit is een harde eis in Siteimprove en de WCAG-richtlijnen.

## 3. Gedrag bij "Onzichtbare" Captcha

De test kijkt of de captcha op invisible staat:

- Bij een **zichtbare captcha** moet de gebruiker erheen kunnen tabben (toetsenbordnavigatie)
- Bij een **onzichtbare captcha** controleert de test of deze de gebruiker niet onnodig hindert in de navigatie-volgorde

## 4. Rapportage in je Dashboard

Na de scan geeft de test een JSON-object terug (vergelijkbaar met je AriaLandmarksTest) met de volgende informatie:

- **found:** Is er een hCaptcha gevonden? (Ja/Nee)
- **hasTitle:** Heeft het iframe een toegankelijke naam?
- **type:** Is het de zichtbare box of de onzichtbare variant?
- **status:** Een groen vinkje als de titel aanwezig is, of een waarschuwing als de gebruiker mogelijk vastloopt

## Wat betekent dit voor de gebruiker?

De gebruiker krijgt in het rapport een melding:

*"We hebben een hCaptcha gevonden. Let op: zorg dat het iframe een duidelijke titel heeft, zodat blinde bezoekers weten dat ze een verificatie moeten uitvoeren."*

Zodra Claude de code heeft geschreven, kun je dit direct testen door een pagina te scannen waar een contactformulier met hCaptcha op staat.`,

  'LinkMissingHrefTest': `## Achtergrond

Links zonder werkende href zijn niet functioneel en kunnen verwarrend zijn voor gebruikers. Deze test controleert of alle links een geldige href hebben.

## Wat wordt gecontroleerd?

- Links zonder href attribuut
- Links met lege href ("")
- Links met placeholder href ("#", "javascript:void(0)")

## Technische details

De test markeert de volgende als problematisch:

- <a> zonder href
- <a href="">
- <a href="#">
- <a href="javascript:void(0)">
- <a href="javascript:;">

## WCAG Criteria

- **2.1.1 Toetsenbord** (Niveau A)
- **4.1.2 Naam, rol, waarde** (Niveau A)

## Veelvoorkomende scenario's

1. **Placeholder links**: Gebruikt tijdens ontwikkeling maar vergeten te vervangen
2. **JavaScript links**: Links die alleen werken met JavaScript
3. **Anker links**: # wordt soms gebruikt voor scroll-to-top, gebruik dan href="#top"

## Oplossingen

- Vervang placeholder links met echte URLs
- Voor JavaScript functies: gebruik <button> in plaats van <a>
- Voor anker links: gebruik een geldige ID (#section-name)`,
};

/**
 * Get extended documentation for a specific test
 */
export function getTestDocumentation(testName: string): string | null {
  return TEST_DOCUMENTATION[testName] || null;
}

/**
 * Check if a test has extended documentation
 */
export function hasTestDocumentation(testName: string): boolean {
  return testName in TEST_DOCUMENTATION;
}