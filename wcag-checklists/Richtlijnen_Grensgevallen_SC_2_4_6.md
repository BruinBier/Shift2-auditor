# Richtlijnen grensgevallen SC 2.4.6

## Identieke of bijna-identieke h1 en h2 in meerstappenformulieren

**Afkeuring** wanneer de h1 (paginatitel) en h2 (staptitel) inhoudelijk identiek of bijna identiek zijn in een meerstappenformulier, en de h2 de inhoud van de stap niet beschrijft.

### Waarom afkeuren?

- In een meerstappenformulier beschrijft de staptitel (h2) niet het onderwerp van de stap, maar herhaalt alleen de formuliernaam uit de h1.
- De stap heeft een eigen inhoud — bijvoorbeeld het invullen van persoonsgegevens — die de h2 niet weergeeft.
- Gebruikers die via koppen navigeren, zoals mensen die een schermlezer gebruiken, kunnen op basis van de h2 niet opmaken wat er in de stap van hen wordt verwacht.
- SC 2.4.6 vereist dat koppen het onderwerp of doel beschrijven. Een kop die de formuliernaam herhaalt in plaats van de stapinhoud beschrijft, voldoet daar niet aan.

### Voorbeeld: AFKEURING

```html
<h1>Reactieformulier vernieuwing speelplek de Stouwe - Europaring (Oostzijde)</h1>
<!-- voortgangsbalk: 33% -->
<h2>Reactieformulier vernieuwing speelplek de Stouwe - Europaring (oostzijde)</h2>
```

De stap gaat over het invullen van persoonsgegevens en een reactie. De h2 beschrijft dit niet — zij herhaalt alleen de formuliernaam.

### Aanbevolen advies bij afkeuring

Vervang de h2 door een beschrijvende staptitel die aangeeft wat er in de betreffende stap wordt gevraagd, bijvoorbeeld:

- "Stap 1: Uw gegevens en reactie"
- "Uw contactgegevens en toelichting"
- "Stap 1 van 3: Persoonsgegevens"

### Vuistregel

| Situatie | Oordeel |
|----------|---------|
| h1 en h2 inhoudelijk identiek in een meerstappenformulier, h2 beschrijft de stapinhoud niet | Afkeuring — beschrijft het onderwerp van de stap niet |
| h2 staptitel is generiek ("Stap 1", "Formulier", "Volgende") | Afkeuring — beschrijft het onderwerp niet |
| h2 staptitel is beschrijvend en onderscheidend ("Uw contactgegevens") | PASS |
| h1 en h2 identiek op een eenstapspagina (geen meerdere stappen) | PASS — herhaling is minder problematisch als er geen andere stappen zijn om van te onderscheiden |
