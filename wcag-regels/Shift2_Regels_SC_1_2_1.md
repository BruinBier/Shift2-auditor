# Shift2-regels SC 1.2.1 — Louter-geluid en louter-videobeeld (vooraf opgenomen), niveau A

Dit criterium gaat **niet** over gewone video met beeld én geluid. Het gaat over twee smalle
gevallen. Voor de onderzoeksmethode zie `Shift2_Werkwijze_Video.md`.

## Waar het over gaat

| Type | Wat er nodig is |
|---|---|
| **Louter geluid** — podcast, audiofragment, ingesproken bericht zonder beeld | Een transcript op de pagina |
| **Louter videobeeld** — video zonder geluid, animatie, GIF met informatie | Een tekstalternatief óf een audiodescriptie |

Video met beeld én geluid valt hier **buiten**. Die loopt via 1.2.2 (ondertiteling), 1.2.3 en
1.2.5 (audiodescriptie).

## Vaststellen welk type het is

Speel de video af met `muted = false` en lees `webkitAudioDecodedByteCount` uit, of kijk of het
mediabestand een audiospoor heeft. Is er geen audio, dan is het louter-videobeeld.

Een `<audio>`-element of een ingesloten podcast-speler is louter-geluid.

Twijfel je, vraag het dan aan de onderzoeker: "Heeft deze video geluid?" Zet het criterium
ondertussen op `niet_te_bepalen` met die vraag erbij (zie
`feedback_onbeoordeelbaar_altijd_melden`).

## Beoordeling

| Situatie | Status |
|---|---|
| Geen louter-geluid en geen louter-videobeeld op de pagina | `niet_aanwezig` |
| Audiofragment met transcript op de pagina | `voldoet` |
| Audiofragment zonder transcript | `afgekeurd` |
| Video zonder geluid met tekst eronder die dezelfde informatie geeft | `voldoet` |
| Video zonder geluid, puur decoratief, geen informatie | `niet_aanwezig` |
| Video zonder geluid met informatie, zonder tekstalternatief | `afgekeurd` |

Bij een decoratieve achtergrondvideo hoort ook 2.2.2 nagelopen te worden (beweging pauzeren),
maar dat is een los criterium.

## Bij een afkeuring

Drie zinnen volgens `Shift2_Schrijfregels.md`. Wie niet kan horen mist de inhoud van een
audiofragment volledig; wie niet kan zien mist de inhoud van een geluidloze video volledig.
Impact `serieus`, verantwoordelijkheid `redacteur`.

Adviseer een transcript **op de pagina zelf**, niet als los te downloaden bestand: dan komt er
een PDF-beoordeling bij en dat is voor de bezoeker omslachtiger.
