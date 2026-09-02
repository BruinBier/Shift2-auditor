---
status: proposed
---

# Codex mag lezen op de laptop; ontwikkelwerk gaat naar Claude Code

ChatGPT Work kan binnen één gesprek doorschakelen naar Codex, en Codex draait wél op de
laptop. Dat is de enige weg van Work naar Shift2Auditor, en hij wordt gebruikt voor precies
één ding: opzoeken of een onderzoek al bestaat voordat Work een intakevoorstel maakt.

Verder niets. Ontwikkelwerk aan Shift2Auditor gaat naar Claude Code.

## Waarom niet meer dan lezen

Op 2 augustus 2026 stuurde een Work-coördinator een Codex-agent aan met de opdracht om de
audit van heuvelrug.nl uit te voeren. Wat er terugkwam:

- veertien gewijzigde bestanden, +212/−33;
- een toegepaste databasemigratie en een schemawijziging;
- de melding dat de devserver nog herstart moest worden voor de nieuwe Prisma-client;
- een afkeuring van SC 4.1.2 op de zoeksuggesties, die is afgewezen;
- de constatering dat B001 en B002 "bewijs, impact en verantwoordelijke missen".

Elk van die vijf botst met iets dat vastligt. `CLAUDE.md` zegt dat migraties met de hand
gaan en dat op Windows eerst de devserver gestopt moet worden. Diezelfde afkeuring op de
zoeksuggesties van heuvelrug.nl is op 15 augustus 2026 al eens teruggedraaid — toen door een
pagina waarin de JavaScript niet draaide. En een opmerking met status `resolved` hoort juist
géén impact en verantwoordelijkheid te hebben; de agent zag een correcte toestand aan voor
een gebrek.

Geen daarvan is een fout van Codex. Het is een programmeur, en hem werd gevraagd iets te
implementeren; dan wordt er geprogrammeerd. De fout zat erboven: de coördinator besloot dat
er verbouwd moest worden, en dat werd pas achteraf gezien.

## Waarom Claude Code en niet Codex

Alles wat de werkwijze vastlegt zit hier: `wcag-regels/`, `wcag-checklists/`, `CLAUDE.md`,
de schrijfregels voor bevindingen, de geheugenbestanden met wat er eerder misging. Codex
heeft daar niets van. Twee agenten die allebei de codebase mogen wijzigen maar niet dezelfde
regels kennen, leveren werk op dat er van buiten hetzelfde uitziet.

## Dat dit een afspraak is en geen grendel

Codex heeft technisch schrijfrechten op de hele projectmap. "Alleen lezen" is een zin in een
prompt, en zulke zinnen houden niet altijd: in de sessie van 2 augustus stond in één opdracht
letterlijk *"Verander niets"*, en in een volgende werd er weer verbouwd.

Het vangnet is `git status` na elke Work-sessie waarin Codex meedeed. Wie de afspraak wil
afdwingen in plaats van afspreken, laat Codex in een aparte werkkopie draaien.

## Wat er van die sessie is overgebleven

Het bruikbare deel is gebleven. `capture-sample-evidence` legt per steekproefitem de
gerenderde HTML en een volledige screenshot vast, met tijdstempel: de homepage compleet,
andere pagina's alleen `<main>`, PDF's overgeslagen. Het staat in `scripts/audit-cli.ts`, de
padberekening in `lib/audit-evidence.ts`, er zijn tests (`npm run test:audit-evidence`), en
`SampleItem` heeft er `auditHtmlPath` en `auditCapturedAt` voor. Op 3 augustus is er in
`e0ad093` zelf op doorgebouwd, zodat het bewijs meegaat bij kopiëren, herinspectie, finalize
en de back-up-export.

Dat de uitkomst bruikbaar was, verandert niets aan het bezwaar. De migratie ging langs de
werkafspraak heen, de afkeuring op de zoeksuggesties moest teruggedraaid, en dat het goed
afliep is achteraf vastgesteld en niet vooraf begrensd.

Wat wel bleef liggen: zes bewijsbestanden van 2 augustus staan los in
`public/uploads/audit-evidence/`. Die horen niet in git — het is gegenereerd bewijs dat bij
elke audit opnieuw ontstaat.
