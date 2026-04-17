# Richtlijnen grensgevallen SC 1.3.1

## Vetgedrukte tekst binnen lijstitems

**Geen afkeuring** wanneer vetgedrukte tekst (via `<span class="bold">`, `<b>`, of CSS) wordt gebruikt aan het begin van een lijstitem om de leesbaarheid te verbeteren.

### Waarom niet?

- De vetgedrukte tekst functioneert als **visueel hulpmiddel**, niet als structureel element.
- Het zijn inleidende samenvattingen binnen een `<li>`, geen koppen die secties inleiden.
- Alle informatie is volledig beschikbaar als tekst binnen het `<li>`-element.
- SC 1.3.1 vereist dat structuur en relaties die door presentatie worden overgebracht ook programmatisch bepaalbaar zijn. Hier wordt geen structurele relatie overgebracht, alleen visuele nadruk voor leesbaarheid.
- Er is geen WCAG-eis om elke vetgedrukte tekst semantisch te markeren.

### Voorbeeld: PASS

```html
<ul>
  <li>
    <span class="bold">U maakt zich zorgen om iemand</span><br/>
    Familie of buren merken vaak als eerste dat er iets niet goed gaat...
  </li>
</ul>
```

Dit is acceptabel: de vetgedrukte tekst maakt het lijstitem makkelijker scanbaar, maar voegt geen structurele laag toe die programmatisch ontbreekt.

### Wanneer wél afkeuren?

Afkeuren wanneer vetgedrukte tekst duidelijk als **kop** fungeert — dat wil zeggen: de tekst leidt een eigen sectie in met meerdere alinea's, sublijsten of andere content **buiten** het lijstitem. Dan is het een kop die als heading gemarkeerd moet zijn.

### Vuistregel

| Situatie | Oordeel |
|----------|---------|
| Vetgedrukte tekst binnen `<li>` als inleiding op de rest van datzelfde lijstitem | PASS |
| Vetgedrukte tekst die visueel een sectiekop is met eigen content eronder (buiten de lijst) | FAIL — moet een heading zijn |
| `<strong>` binnen een `<h2>` of `<a>` (CTA-link) | FAIL — overbodig, gebruik CSS |

---

## `<strong>` binnen koppen

**Afkeuring** wanneer de volledige koptekst in een `<strong>`-element staat binnen een heading-element (`<h1>`–`<h6>`).

### Waarom afkeuren?

- Een `<strong>`-element markeert tekst als sterk benadrukt. Binnen een kop is dit overbodig en onjuist: de kop heeft al zijn eigen semantiek.
- Screenreaders kunnen de `<strong>` apart aankondigen, waardoor gebruikers de tekst onbedoeld als benadrukt horen.
- SC 1.3.1 vereist dat structuur en relaties die door presentatie worden overgebracht correct programmatisch worden weergegeven. Een `<strong>` binnen een kop voegt een onjuiste relatie toe.
- De vetopmaak van koppen hoort via CSS te worden geregeld, niet via `<strong>`.

### Oorzaak

Dit ontstaat meestal doordat een redacteur in het CMS vetopmaak heeft aangezet op koptekst, zonder te weten dat de kop al vet is via CSS.

### Voorbeeld: FAIL

```html
<h2><strong>Gemeente IJsselstein</strong></h2>
```

### Voorbeeld: PASS

```html
<h2>Gemeente IJsselstein</h2>
```

### Vuistregel

| Situatie | Oordeel |
|----------|---------|
| Volledige koptekst omsloten door `<strong>` | FAIL — verwijder `<strong>`, gebruik CSS |
| `<strong>` om één woord binnen een langere koptekst ter benadrukking | Opmerking — functioneel maar ongebruikelijk |
| Koptekst zonder `<strong>`, vetopmaak via CSS | PASS |

---

## `<em><strong>` over volledige zinnen of links

**Afkeuring** wanneer een hele zin of een hele link is opgemaakt met zowel `<em>` als `<strong>`.

### Waarom afkeuren?

- `<strong>` geeft aan dat tekst inhoudelijk van groot belang is. `<em>` geeft nadruk of klemtoon aan. Beide zijn semantische elementen, geen opmaakelementen.
- Als een hele zin of alinea wordt omsloten door `<em><strong>`, wordt de semantische betekenis van de nadruk uitgehold: alles benadrukken is niets benadrukken.
- SC 1.3.1 vereist dat nadruk die door presentatie wordt overgebracht ook programmatisch correct wordt weergegeven. Het gebruik van `<em><strong>` op volledige zinnen brengt een onjuiste of zinloze structurele relatie over.
- Visuele opmaak (vet, cursief) van een alinea of zin hoort via CSS te worden geregeld.
- Dit patroon ontstaat in de praktijk doordat een redacteur in het CMS de volledige tekst selecteert en vet én cursief aanzet.

### Bijzonder geval: `<em><strong>` binnen een link

Wanneer de linktekst volledig in `<em><strong>` staat, voegt dit geen semantische waarde toe aan de link. De vetopmaak hoort via CSS.

### Voorbeeld: FAIL

```html
<p>
  <em><strong>We verwachten dit jaar een groot aantal aanvragen. </strong></em>
  <a href="..."><em><strong>Maak op tijd een afspraak</strong></em></a>
  <em><strong>.</strong></em>
</p>
```

### Voorbeeld: PASS

```html
<p>
  We verwachten dit jaar een groot aantal aanvragen.
  <a href="...">Maak op tijd een afspraak</a>.
</p>
```

Visuele vetgedrukte of cursieve opmaak van de alinea via CSS.

### Vuistregel

| Situatie | Oordeel |
|----------|---------|
| `<em><strong>` om één of enkele woorden ter inhoudelijke benadrukking | PASS |
| `<em><strong>` om een hele zin of alinea | FAIL — gebruik CSS voor visuele opmaak |
| `<em><strong>` om volledige linktekst | FAIL — gebruik CSS voor visuele opmaak |
| Losse leestekens (punt, komma) in `<em><strong>` | FAIL — redactionele slordigheid, zelfde oorzaak |
