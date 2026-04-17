# Richtlijnen grensgevallen SC 1.1.1

## 1. Logo als enige inhoud van een link

**Geen afkeuring onder SC 1.1.1** wanneer een logo in een link staat en het alt-attribuut de organisatienaam bevat (bijv. `alt="Gemeente Wierden"`). Het logo heeft een tekstalternatief dat het logo correct beschrijft — daarmee is aan SC 1.1.1 voldaan.

**De vraag of het linkdoel duidelijk is, hoort bij SC 2.4.4** (Linkdoel in context), niet bij SC 1.1.1.

### Waarom PASS op 1.1.1?

- SC 1.1.1 vereist dat niet-tekstuele content een tekstalternatief heeft dat een gelijkwaardig doel dient. Een logo is informatief: het identificeert de organisatie. `alt="Gemeente Wierden"` beschrijft het logo correct.
- De kwaliteit van de alt-tekst als **linktekst** (beschrijft het het linkdoel?) is een SC 2.4.4-vraag, geen SC 1.1.1-vraag.

### Waarom FAIL op 2.4.4?

- Als het logo de enige inhoud van een link is, fungeert de alt-tekst als accessible name van de link. "Gemeente Wierden" beschrijft niet waar de link naartoe leidt (de homepage). Dit is een failure op SC 2.4.4, niet op SC 1.1.1.
- Zie `Richtlijnen_Grensgevallen_SC_2_4_4.md` (indien aanwezig) of de `Checklist_SC_2_4_4.md` voor de beoordeling.

### Voorbeeld

```html
<!-- SC 1.1.1: PASS, SC 2.4.4: FAIL -->
<a href="/">
  <img src="logo.png" alt="Gemeente Wierden">
</a>

<!-- SC 1.1.1: PASS, SC 2.4.4: PASS (linkdoel in alt) -->
<a href="/">
  <img src="logo.png" alt="Gemeente Wierden, ga naar de homepagina">
</a>

<!-- SC 1.1.1: PASS, SC 2.4.4: PASS (linkdoel in title) -->
<a href="/" title="Naar de homepagina">
  <img src="logo.png" alt="Gemeente Wierden">
</a>
```

**Let op:** het `title`-attribuut op de link geldt als programmatisch bepaalde linkcontext en maakt het linkdoel duidelijk. Als het `title`-attribuut het linkdoel beschrijft, is de link ook onder SC 2.4.4 goedgekeurd.

### Vuistregel

| Situatie | SC 1.1.1 | SC 2.4.4 |
|----------|----------|----------|
| Logo in link, `alt="Gemeente Wierden"`, geen title | PASS | FAIL — linkdoel onduidelijk |
| Logo in link, `alt="Gemeente Wierden, ga naar de homepagina"` | PASS | PASS |
| Logo in link, `alt="Gemeente Wierden"`, `title="Naar de homepagina"` op de link | PASS | PASS |
| Logo in link, `alt=""` | FAIL — logo is informatief | n.v.t. (geen accessible name → F89) |
| Logo niet in link, `alt="Gemeente Wierden"` | PASS | n.v.t. |
| Logo in link samen met zichtbare tekst "Home" | PASS (`alt=""` mag) | PASS |

---

## 2. Teaserfoto's in nieuwsoverzichten

**Geen afkeuring** wanneer teaserfoto's in nieuwsoverzichten `alt=""` hebben, mits de kop en teasertekst al voldoende context bieden.

**Wél afkeuring** bij inconsistent gebruik (mix van wel/niet alt-tekst) of wanneer de afbeelding tekst bevat die niet in de kop of teasertekst staat.

### Waarom zijn teaserfoto's in overzichten decoratief?

- In een overzicht/listing bieden kop en teasertekst al voldoende context voor de link.
- De foto voegt geen essentiële informatie toe die niet al in de tekst staat.
- Consistentie is belangrijk: liever alle teasers `alt=""` dan een willekeurige mix.
- Op de detailpagina van het nieuwsartikel zelf kan dezelfde afbeelding wél informatief zijn, maar in de overzichtscontext niet.

### Voorbeeld: PASS (consistent decoratief)

```html
<a href="/nieuws/zwembad-geopend">
  <img src="zwembad.jpg" alt="">
  <h3>Nieuw zwembad geopend</h3>
  <p>Het gemeentelijk zwembad is na renovatie weer open...</p>
</a>
```

### Voorbeeld: FAIL (inconsistent)

```html
<!-- Teaser 1: wél alt -->
<a href="/nieuws/herdenking">
  <img src="herdenking.jpg" alt="Herdenking bij het vissersmonument">
  <h3>Herdenking bij het vissersmonument</h3>
</a>

<!-- Teaser 2: geen alt -->
<a href="/nieuws/koningsdag">
  <img src="koningsdag.jpg" alt="">
  <h3>Feestelijke Koningsdag: bedankt!</h3>
</a>
```

### Standaardbevinding bij inconsistentie

> Op de pagina [URL] staat een overzicht van nieuwsartikelen, ieder met een kleine foto erboven. Een deel van deze foto's wordt beschreven in de alternatieve tekst, zoals bij "[voorbeeld met alt]" en "[voorbeeld met alt]". Bij andere foto's in het overzicht wordt echter geen alternatieve tekst geboden, zoals bij "[voorbeeld zonder alt]" en "[voorbeeld zonder alt]".
>
> Het advies is om binnen een dergelijk overzicht consistent om te gaan met het toevoegen van alternatieve beschrijvingen. Binnen dit overzicht zijn deze afbeeldingen niet informatief (dit zijn ze mogelijk wel op de pagina van het nieuwsartikel zelf, maar niet in de context van het overzicht) en het advies is dan ook om afbeeldingen in overzichten zoals deze consistent met een leeg alt-attribuut te plaatsen.

### Uitzondering: tekst in de teaserfoto

Wanneer de teaserfoto tekst bevat die niet in de kop of teasertekst staat, is de afbeelding informatief en moet de tekst in het alt-attribuut worden opgenomen.

### Vuistregel

| Situatie | Oordeel |
|----------|---------|
| Teaserfoto's in overzicht, consistent `alt=""`, kop+teaser bieden context | PASS |
| Teaserfoto's in overzicht, inconsistent (mix wel/niet alt) | FAIL — adviseer consistent `alt=""` |
| Teaserfoto bevat tekst die niet in kop/teaser staat | FAIL — alt moet de tekst bevatten |
| Teaserfoto is enige klikbaar element (geen tekstlink) | FAIL — alt moet linkdoel beschrijven |

---

## 3. Hero-afbeeldingen op gemeente-websites

**Geen afkeuring** wanneer hero-afbeeldingen `alt=""` hebben, tenzij ze tekst, logo's of specifieke essentiële informatie bevatten.

### Waarom zijn hero-afbeeldingen meestal decoratief?

- Hero-afbeeldingen op gemeente-websites zijn vrijwel altijd generieke sfeerfoto's (gemeentehuis, landschap, luchtfoto).
- Ze bevatten geen informatie die niet elders op de pagina in tekst staat.
- Ze worden vaak automatisch door het CMS gegenereerd.

### Wanneer wél informatief?

```
Hero-afbeelding checken:
├─ Bevat tekst (slogan, kop)? → INFORMATIEF (tekst in alt opnemen)
├─ Bevat logo's of merkelementen? → INFORMATIEF (beschrijven)
├─ Generieke foto (gebouw/landschap)? → DECORATIEF
└─ Specifieke informatie essentieel voor begrip? → INFORMATIEF
```

### Vuistregel

| Situatie | Oordeel |
|----------|---------|
| Generieke sfeerfoto als hero, `alt=""` | PASS |
| Hero met tekst/slogan erin, `alt=""` | FAIL — tekst moet in alt |
| Hero met logo erin, `alt=""` | FAIL — logo moet beschreven worden |
| Generieke sfeerfoto als hero, `alt="Foto van het gemeentehuis"` | Opmerking — beter `alt=""` |

---

## 4. Portretfoto's van personen op nieuwspagina's

**Afkeuring** wanneer de alt-tekst van een portretfoto alleen het uiterlijk beschrijft zonder de persoon bij naam te noemen.

### Waarom informatief?

Een portretfoto op een nieuwspagina is informatief wanneer de afgebeelde persoon centraal staat in het bericht. De alt-tekst moet de persoon identificeren — niet het uiterlijk beschrijven. De context (functie, reden van vermelding) hoeft niet in de alt-tekst te worden herhaald als die al in de paginatekst staat.

### Voorbeeld: FAIL

```html
<!-- Portretfoto met alleen uiterlijke beschrijving -->
<img src="Robert-van-Rijn.jpg" 
     alt="Persoon in een donkerblauw pak met een lichtgekleurde stropdas staat binnen aan een houten balustrade.">
```

### Voorbeeld: PASS

```html
<!-- Persoon geïdentificeerd, context staat al in de tekst -->
<img src="Robert-van-Rijn.jpg" alt="Portret van burgemeester Robert van Rijn.">
```

### Vuistregel

| Situatie | Oordeel |
|----------|---------|
| Portretfoto, alt beschrijft alleen uiterlijk, naam ontbreekt | FAIL — naam moet in alt |
| Portretfoto, alt bevat naam van de persoon | PASS |
| Portretfoto, alt herhaalt ook context die al in paginatekst staat | Opmerking — context weglaten, naam volstaat |

---

## 5. Tracking pixels en analytics-afbeeldingen

**Geen afkeuring** wanneer tracking pixels (Piwik/Matomo, Google Analytics) `alt=""` hebben.

### Waarom?

- Tracking pixels zijn niet-zichtbare technische afbeeldingen van 1×1 pixel.
- Ze hebben geen informatieve of decoratieve functie voor de gebruiker.
- `alt=""` is de correcte behandeling: de afbeelding wordt verborgen voor hulpsoftware.

### Voorbeeld: PASS

```html
<noscript>
  <img src="https://analytics.example.nl/piwik.php?idsite=2&rec=1" alt="">
</noscript>
```

### Wanneer wél afkeuren?

- Wanneer het `alt`-attribuut ontbreekt (niet leeg, maar afwezig). Dan meldt hulpsoftware de URL van de afbeelding.

### Vuistregel

| Situatie | Oordeel |
|----------|---------|
| Tracking pixel met `alt=""` | PASS |
| Tracking pixel zonder alt-attribuut | FAIL — alt-attribuut ontbreekt |
| Tracking pixel met `alt="tracking"` of bestandsnaam | Opmerking — beter `alt=""` |
