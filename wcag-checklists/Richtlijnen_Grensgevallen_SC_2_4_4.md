# Richtlijnen grensgevallen SC 2.4.4

## 1. Logo als enige inhoud van een link

**Afkeuring** wanneer een logo de enige inhoud is van een link en het linkdoel niet duidelijk is uit de accessible name of de programmatisch bepaalde linkcontext.

**Geen afkeuring** wanneer het linkdoel wél duidelijk is, bijvoorbeeld via:
- Een alt-tekst die het linkdoel beschrijft (bijv. `alt="Gemeente Wierden, ga naar de homepagina"`)
- Een `title`-attribuut op de link dat het linkdoel beschrijft (bijv. `title="Naar de homepagina"`)
- Zichtbare tekst naast het logo binnen dezelfde link

### Waarom afkeuren zonder linkdoel?

- Als het logo de enige inhoud is van een link, fungeert de alt-tekst als accessible name. "Gemeente Wierden" beschrijft de afbeelding, niet waar de link naartoe leidt.
- In een screenreader-linklijst verschijnt "Gemeente Wierden" zonder indicatie dat het om een link naar de homepagina gaat.
- SC 2.4.4 vereist dat het linkdoel bepaald kan worden uit de linktekst alleen of samen met de programmatisch bepaalde linkcontext.

### Waarom het `title`-attribuut hier relevant is

Het `title`-attribuut op een `<a>`-element geldt als programmatisch bepaalde linkcontext. Als het `title`-attribuut het linkdoel beschrijft, is aan SC 2.4.4 voldaan — ook als de alt-tekst van het logo alleen de organisatienaam bevat.

### Voorbeelden

```html
<!-- FAIL: linkdoel niet duidelijk -->
<a href="/">
  <img src="logo.png" alt="Gemeente Wierden">
</a>

<!-- PASS: linkdoel in alt-tekst -->
<a href="/">
  <img src="logo.png" alt="Gemeente Wierden, ga naar de homepagina">
</a>

<!-- PASS: linkdoel in title-attribuut -->
<a href="/" title="Naar de homepagina">
  <img src="logo.png" alt="Gemeente Wierden">
</a>

<!-- PASS: zichtbare tekst naast logo -->
<a href="/">
  <img src="logo.png" alt="">
  <span>Home</span>
</a>
```

### Vuistregel

| Situatie | Oordeel |
|----------|---------|
| Logo in link, `alt="Gemeente Wierden"`, geen title | FAIL — linkdoel onduidelijk |
| Logo in link, `alt="Gemeente Wierden, ga naar de homepagina"` | PASS |
| Logo in link, `alt="Gemeente Wierden"`, `title="Naar de homepagina"` | PASS |
| Logo in link samen met zichtbare tekst "Home" | PASS |
| Logo in link, `alt=""`, geen andere tekst | FAIL — geen accessible name (F89) |

---

## 2. Teaserkaarten met afbeelding en tekst in één link

**Geen afkeuring** wanneer een teaserkaart een afbeelding en tekst combineert in één link, en de tekst het linkdoel voldoende beschrijft.

### Waarom geen afkeuring?

- De accessible name van de link is de optelsom van alle tekst binnen de link: alt-tekst van de afbeelding + zichtbare tekst (kop, teasertekst).
- Als de zichtbare tekst het linkdoel beschrijft, is de afbeelding decoratief en mag `alt=""` hebben.
- De link als geheel heeft dan een beschrijvende accessible name.

### Voorbeeld: PASS

```html
<a href="/nieuws/zwembad-geopend" class="card">
  <img src="zwembad.jpg" alt="">
  <h3>Nieuw zwembad geopend</h3>
  <p>Het gemeentelijk zwembad is na renovatie weer open.</p>
</a>
```

Accessible name: "Nieuw zwembad geopend Het gemeentelijk zwembad is na renovatie weer open." — beschrijvend.

### Wanneer wél afkeuren?

- Wanneer de link alleen een afbeelding bevat zonder tekst en zonder beschrijvende alt-tekst.
- Wanneer de zichtbare tekst niet beschrijvend is (bijv. alleen "Lees meer" zonder context).

### Vuistregel

| Situatie | Oordeel |
|----------|---------|
| Teaserkaart met afbeelding `alt=""` + beschrijvende kop in dezelfde link | PASS |
| Teaserkaart met alleen afbeelding zonder alt en zonder tekst | FAIL (F89) |
| Teaserkaart met afbeelding + "Lees meer" zonder verdere context | FAIL — linkdoel onduidelijk |

---

## 3. Telefoonnummer als linktekst

**Afkeuring** wanneer een telefoonnummer als linktekst wordt gebruikt en het linkdoel daarmee niet duidelijk is.

### Waarom afkeuren?

- Een telefoonnummer als "14 030" beschrijft niet waar de link naartoe leidt.
- In een screenreader-linklijst verschijnt alleen het getal, zonder indicatie van het doel.

### Oplossing

Het linkdoel wordt duidelijk door de linktekst aan te passen. Het gebruik van `href="tel:..."` is niet verplicht en technisch niet altijd mogelijk.

### Vuistregel

| Situatie | Oordeel |
|----------|---------|
| Linktekst: "14 030" | FAIL — linkdoel onduidelijk |
| Linktekst: "Bel 14 030" | PASS |
| Linktekst: "Telefoonnummer: 14 030" | PASS |

---

## 4. E-mailadres als linktekst

**Geen afkeuring** wanneer een e-mailadres als linktekst wordt gebruikt.

Een e-mailadres is door het @-teken herkenbaar als e-mailadres, ook in een screenreader-linklijst. Het linkdoel (iemand mailen) is daarmee voldoende duidelijk.

### Vuistregel

| Situatie | Oordeel |
|----------|---------|
| Linktekst: `onderscheidingen@laren.nl` | PASS — e-mailadres herkenbaar als zodanig |
| Linktekst: "Stuur een e-mail" zonder verdere context | FAIL — linkdoel onduidelijk |

---

## 5. `href="/#"` op telefoon- en e-maillinks

**Geen WCAG-failure** wanneer een telefoon- of e-maillink `href="/#"` heeft in plaats van `href="tel:..."` of `href="mailto:..."`.

WCAG 2.4.4 toetst uitsluitend of het **linkdoel duidelijk is**, niet of de link technisch correct functioneert. Een onjuiste `href` is een usability-probleem maar geen WCAG-failure.

### Vuistregel

| Situatie | Oordeel SC 2.4.4 |
|----------|---------|
| `href="/#"` op een link met duidelijke linktekst | PASS — linkdoel is duidelijk uit de tekst |
| `href="/#"` op een link met onduidelijke linktekst | FAIL — maar de failure zit in de linktekst, niet in de href |
