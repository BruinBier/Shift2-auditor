# Shift2-beoordelingsregels SC 1.4.10

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_1_4_10.md` als ze elkaar tegenspreken.

## Niet uit HTML of screenshot te bepalen — maar wel te meten

```
npm run cli -- get-reflow <url>
```

Dat zet het venster op 320 pixels — 400% zoom op een scherm van 1280 — laadt de pagina
opnieuw zodat mediaqueries die smalle breedte ook zien, en meldt of de pagina breder wordt
dan het venster. Er komt altijd een schermafdruk uit.

**Bekijk die schermafdruk, ook als de meting schoon is.** "Nul elementen te breed" bewijst
niet dat er niets is weggevallen: inhoud kan verdwijnen zonder dat er iets uitsteekt,
bijvoorbeeld met `display: none` in een mediaquery. Het getal vindt overschrijding, het
beeld vindt verlies.

Twee dingen die het gereedschap apart telt en die GEEN bevinding zijn. Een brede tabel in
een vak met `overflow-x: auto` is de toegestane oplossing voor inhoud die een
tweedimensionale opmaak nodig heeft; 1.4.10 zondert die uitdrukkelijk uit. En inhoud in een
dichtgeklapt uitklapblok heeft nog wel afmetingen maar staat niet in beeld. Ze staan in
`in_een_schuivend_of_afgeknipt_vak`, zodat zichtbaar blijft dat er iets is en niet dat er
niets was. Aanleiding: buitenspelen op heuvelrug.nl meldde 304 te brede elementen terwijl
er op het scherm niets uitsteekt.

## Een pagina achter een formulier meet je niet met get-reflow

Bij een formulier met stappen heeft elke stap een eigen adres, maar kom je er alleen als de
vorige stap is ingevuld. Vraag je zo'n adres los op, dan sta je weer bij stap 1 — en dan
meet je die pagina, onder de naam van de stap die je dacht te meten. De CLI meldt dat in het
veld `omgeleid`; zie `Shift2_Scope_Per_Sample.md`.

Voor zulke samples geldt dus nog steeds `niet_te_bepalen`, met een vraag die zegt wat er
gedaan moet worden:

> Kun je het formulier tot [stap] invullen en dan het venster op 320px zetten? Werkt alles
> zonder horizontaal scrollen, en valt er geen content weg? Let bij een formulier extra op
> de invoervelden, de knoppen onderaan en een eventuele voortgangsbalk.

Dat is niet hetzelfde als de gewone reflow-vraag. Een formulierstap heeft eigen risico's:
velden met een vaste breedte, knoppen naast elkaar, en een voortgangsbalk met stapnamen.

## Regels

- NOOIT zelf concluderen uit een screenshot op normale breedte of uit CSS. Een CMS kan responsive ogen en toch op 320px breken. Meet het.
- Niet "waarschijnlijk OK" of "lijkt responsive" invullen.
- Bij PDF-samples is 1.4.10 niet van toepassing.
