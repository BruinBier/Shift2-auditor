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

## Op de kaart

> Dit blok staat in het scherm van "Waar sta ik". De kaart leest het rechtstreeks uit dit
> bestand: wat je hier verandert, staat bij de volgende keer verversen op de kaart. Er is
> geen tussenstap en geen kopie. Houd het kort — een kaart is geen naslagwerk. Wat langer
> is hoort in de secties hierboven.

### Titel

Geluid zonder beeld, en beeld zonder geluid

### In het kort

Twee smalle gevallen, allebei met hetzelfde probleem: er is één zintuig nodig om de inhoud
mee te krijgen. Bij een podcast of een ingesproken bericht is dat het gehoor; bij een video
zonder geluid of een informatieve animatie is dat het zicht.

Gewone video met beeld én geluid valt hier buiten. Die loopt via 1.2.2 voor de ondertiteling
en 1.2.3 en 1.2.5 voor de audiodescriptie. Verwar het niet: dit criterium gaat over media die
maar één van beide heeft.

De vraag is telkens dezelfde. Staat de inhoud ook ergens als tekst op de pagina?

### Audit-instructies

> Zet voor elke stap wie hem uitvoert: `[meting]` als een commando het al doet, `[jij]` als er
> een mens voor nodig is. De kaart toont dat met een vinkje of een open rondje, zodat er niet
> als opdracht staat wat allang gedaan is.

#### Stap 1 — Zoeken

1. [agent] Zoek in de code op `audio`, `video`, `iframe`, `embed` en `object`, en op de
   insluitcode van YouTube, Vimeo, Soundcloud en Spotify. Noteer waarop je hebt gezocht: een
   leeg resultaat en een mislukte zoekactie zien er in een onderbouwing hetzelfde uit.
2. [agent] Kijk ook op de opname van de hele pagina. Een animatie of een GIF staat niet altijd
   in een `video`-element, en een speler die pas na een klik verschijnt staat niet in de
   opgehaalde code.
3. [agent] Een video die alleen gelínkt is, zonder speler op de pagina, valt buiten de scope —
   ook als het het eigen kanaal van de organisatie is. Zie `Shift2_Scope_Per_Sample.md`.
   Noteer wel dát je hebt gekeken.

#### Stap 2 — Het type vaststellen

4. [agent] Een `audio`-element of een ingesloten podcast is louter-geluid. Daar hoort een
   transcript bij, op de pagina zelf.
5. [agent] Bij een video: stel vast of er een audiospoor is. Speel af met `muted = false` en
   lees `webkitAudioDecodedByteCount` uit, of kijk of het bestand een audiospoor heeft. Geen
   audio betekent louter-videobeeld. Kijk hier niet naar, meet het — een stille passage aan het
   begin zegt niets over de rest.
6. [jij] Twijfel je of een video geluid heeft, zet het criterium dan op `niet te bepalen` met
   die vraag erbij. Gok niet.

#### Stap 3 — Wegen

7. [agent] Bij louter-videobeeld: draagt het beeld informatie, of is het versiering? Een
   decoratieve achtergrondvideo is `niet aanwezig` voor dit criterium; een animatie die iets
   uitlegt niet. Kijk voor die afweging naar wat er in beeld gebeurt, niet naar de
   bestandsnaam.
8. [agent] Staat de inhoud al als tekst op de pagina, dan voldoet het. Vergelijk inhoudelijk:
   een kopje boven de speler is geen transcript.
9. [jij] Bij een afkeuring: impact `serieus`, verantwoordelijkheid `redacteur`. Adviseer een
   transcript op de pagina zelf, niet als los te downloaden bestand.

#### Stap 4 — Wegschrijven

10. [agent] Stuur de vijf deelgebieden hieronder mee met het oordeel, in hetzelfde
    `save-checks`-bericht: `"gebieden": [{ "gebied": "...", "uitkomst": "ok|nvt|fout|opmerking",
    "toelichting": "..." }]`. Zonder een complete lijst wordt het oordeel geweigerd. Staat een
    soort media niet op deze pagina, gebruik dan `nvt` met de zin waaróp je hebt gezocht.
11. [agent] De onderbouwing bij `reden` is **één of twee zinnen**: of de meting geldig was —
    kwam je op de gevraagde pagina uit, draaide de JavaScript, was het een auditsessie — en
    verder niets. Al het inhoudelijke gaat naar de deelgebieden.

### Deelgebieden

1. Audiofragmenten en podcasts
2. Video zonder geluid
3. Animaties en GIF's die informatie dragen
4. Het transcript of tekstalternatief bij wat je vond
5. Video die alleen gelinkt is

### Zo is het vastgesteld

Voor dit criterium is er geen eigen meetcommando. `get-videos` vindt de ingesloten spelers op
een pagina, maar staat geregistreerd op 2.1.4 en is hier nog niet aan gekoppeld: op een
steekproef zonder video's levert die knop niets op. Komt er een onderzoek met video, dan is
dat het eerste wat erbij hoort.

Wat er wel is, zijn twee bronnen naast elkaar. `get-html` levert de code nadat de JavaScript
van de site heeft gedraaid — daar staan de elementen en de insluitcodes. `get-screenshot` legt
de pagina vast zoals hij te zien was — daar staat een animatie die in geen enkel `video`-element
zit.

Dat een oordeel `niet aanwezig` luidt maakt de opname niet minder nodig. Bij dit criterium is
"er staat geen media op de pagina" de gewone uitkomst, en juist die uitkomst ziet er hetzelfde
uit als niet-gekeken-hebben. Vandaar dat de deelgebieden vragen waaróp je hebt gezocht.

Aanleiding: heuvelrug.nl (2026-08-15). Een controle op video, audio, iframe, embed, object en
source gaf zes keurige nullen — maar de gebruikte reguliere expressie was kapot, zodat alles
nul gaf. De uitkomst klopte toevallig; het bewijs was waardeloos. Controleer je zoekactie
daarom op een patroon waarvan je weet dat het voorkomt.
