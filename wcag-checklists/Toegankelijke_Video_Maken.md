# Snelstartgids: Toegankelijke video's maken voor de website

De keuzes die je tijdens de **productie** maakt, bepalen voor 80% hoe toegankelijk de video later is. Achteraf repareren is lastig, kost veel meer werk en dus meer geld.

Neem toegankelijkheid mee vanaf het begin. Onderstaande punten helpen je daarbij.

---

## 1. Aandachtspunten vooraf

Een volledig uitgeschreven script is ideaal, maar in de praktijk zeldzaam. Let bij het voorbereiden in elk geval op:

- **Wie er praat en wanneer.** Weet vooraf welke sprekers aan het woord komen. Kies per spreker: óf de spreker stelt zichzelf voor ("Ik ben Jan Jansen, wethouder Financiën"), óf een presentator introduceert hem. Zo voorkom je dat er achteraf audiodescriptie toegevoegd moet worden om de spreker te identificeren.
- **Welke visuele informatie belangrijk is.** Denk aan grafieken, kaarten, en tekst in beeld zoals de naambalk onderin het scherm. Zorg dat dit ook uitgesproken wordt.
- **Waar korte stille momenten kunnen vallen.** Handig voor eventuele audiodescriptie later.

---

## 2. Geluid: maak het verstaanbaar

- **Goede microfoon.** Gebruik een dasspeldje of richtmicrofoon dicht bij de spreker. Slechte audio geeft ook slechte automatische ondertiteling, en dus meer correctiewerk.
- **Achtergrondmuziek zachter dan de spreker.** Anders verdwijnt de stem voor slechthorenden.
- **Eén persoon tegelijk.** Door elkaar praten is niet te ondertitelen.
- **Rustig spreektempo.** Geeft tijd om mee te lezen.

---

## 3. Beeld & montage

- **Geen felle flitsen.** Zorg dat de video niet vaker dan 3 keer per seconde flitst (zoals stroboscoop- of politie-effecten). Dit kan epileptische aanvallen veroorzaken (WCAG 2.3.1).
- **Contrast van tekst.** Komt er tekst in beeld (titels, namen, statistieken)? Zorg dat de letters een hoog contrast hebben met de achtergrond (minimaal 4,5:1), bijvoorbeeld door een donkere balk achter de witte letters te plaatsen (WCAG 1.4.3).

---

## 4. Ondertiteling

Verplicht voor elke video met gesproken tekst (WCAG 1.2.2, niveau A). Raakt de grootste groep gebruikers: dove en slechthorende mensen, mensen in een rumoerige omgeving, mensen die de taal minder goed beheersen, en mensen die liever meelezen.

### Niet vertrouwen op automatisch gegenereerde ondertiteling
YouTube en Vimeo genereren automatisch ondertiteling, maar die bevat vaak fouten en mist interpunctie en sprekersaanduiding. Daardoor voldoet die **zelden** aan WCAG. Je kunt hem wel gebruiken als basis en corrigeren in de editor van YouTube/Vimeo, of met tools als Subtitle Edit of Amara.

### Wat hoort in de ondertiteling?
- Alle gesproken tekst.
- Belangrijke geluiden tussen vierkante haken: `[applaus]`, `[deur slaat dicht]`, `[telefoon rinkelt]`.
- Wie er spreekt, als dat niet uit beeld blijkt of als er meerdere mensen in een groep aan het woord zijn: `Wethouder Jansen: ...`, `Bewoner: ...`.

### Vorm
- **Laat de tekst meelopen met wat er gezegd wordt**, synchroon met de spreker, niet te vroeg en niet te laat in beeld.
- Upload de ondertiteling als apart `.srt`-bestand naast de video, niet "ingebrand" in het beeld. Dan kan de kijker hem uitzetten of vergroten.

### Taal
- Ondertiteling altijd in dezelfde taal als de gesproken tekst.

---

## 5. Audiodescriptie: visuele informatie hoorbaar maken

Mensen die blind of slechtziend zijn hebben alleen het geluid. Als belangrijke informatie alleen in beeld staat, missen zij die (WCAG 1.2.3 niveau A, 1.2.5 niveau AA).

Als iets belangrijk is voor het verhaal én alleen in beeld te zien, laat het dan ook horen.

Voorbeelden:

| Wat in beeld verschijnt | Audiodescriptie |
|---|---|
| Een grafiek met de bezoekcijfers | "Grafiek waarop te zien is: vorig jaar 12.000 bezoekers, een stijging van 20% ten opzichte van het jaar ervoor." |
| Iemand wijst op een kaart naar een plek | "Kaart waarop te zien is: het nieuwe park komt aan de noordkant van de stad, tussen de Dorpsstraat en het kanaal." |
| Naam onderin het scherm | "Beeldtekst: Jan Jansen, wethouder Financiën." |

### Twee manieren om visuele info hoorbaar te maken
1. **Tijdens de opname zelf beschrijven** (goedkoop). De spreker of presentator benoemt wat er gebeurt, terwijl het gebeurt.
2. **Achteraf een audiodescriptie-spoor toevoegen** (duur). Een aparte verteller spreekt na de opname extra beschrijvingen in, die tussen de bestaande dialoog door worden gemonteerd.

Optie 2 werkt alleen op stille momenten in de video. Als er de hele tijd wordt gepraat of muziek speelt, is er geen ruimte om iets in te spreken.

Plan daarom korte stille momenten (1–3 seconden) in op plekken waar belangrijke beelden te zien zijn. Dan houd je de optie open om er later een audiodescriptie overheen te leggen zonder de hele video opnieuw te hoeven monteren.

---

## 6. Transcript

Een transcript is een uitgeschreven versie van de hele video, met alle gesproken tekst en beschrijvingen van belangrijke beelden.

**Voor wie is dit?**
- **Doofblinde mensen.** Voor hen is een transcript de enige manier om de inhoud te volgen (ze kunnen het via een braille-leesregel lezen). Ondertiteling en audiodescriptie werken voor hen niet.

**Belangrijk: een transcript vervangt geen audiodescriptie.**

Om aan WCAG 2.2 niveau AA te voldoen, is audiodescriptie verplicht als de video visuele informatie bevat die niet in het geluid wordt benoemd.

Een transcript is dus nooit voldoende als vervanging. Het is wel een waardevolle aanvulling.

**Plaats van het transcript**

Zet het transcript direct bij de video, of achter een duidelijke knop zoals "Bekijk transcript".
