# Werkwijze: template-monitoring SIMsite

Veel gemeentesites draaien op hetzelfde SIMsite-sjabloon. Een deel van wat een audit
oplevert zit daardoor niet in de content van één gemeente maar in dat sjabloon: landmarks,
ARIA, focus, de structuur van menu en footer. Zo'n probleem hoort niet in het klantrapport
van de gemeente, want de redactie kan er niets aan doen. Het hoort bij de leverancier, en
het is pas overtuigend als het op meer dan één gemeente is aangetoond.

Daarvoor bestaat het interne onderzoek **"Template-monitoring SIMsite"**
(id `d8def788-4dfc-4832-9622-19dc60806382`, onderzoekstype "WCAG 2.2 AA - volledig
onderzoek"). Het is een referentieproject, geen klantrapport. Tot 11 juni 2026 heette het
"Template-monitoring Leudal (SIMsite)".

## Wat erin staat

- **Eén bevinding per template-issue**, ongeacht bij hoeveel gemeenten het voorkomt.
- **Per gemeente sample-items als bewijs.** De titel is altijd `<Gemeente> — <Paginatitel>`,
  bijvoorbeeld "Leudal — Homepage" of "Valkenswaard — Denk mee via Ons Valkenswaard".
  Bij een nieuwe gemeente komt minimaal de homepage erin, gekoppeld aan de bestaande
  bevindingen die daar ook voorkomen.
- **Bevindingen met de prefix `[POTENTIEEL]`** komen uit het tabblad "Potentiële problemen"
  van Siteimprove en zijn nog niet met de hand bevestigd.
- **Best practices uit Siteimprove** staan als opmerking (status `resolved`, zonder impact en
  verantwoordelijkheid).

Niet alle gemeenten draaien precies hetzelfde SIMsite; er zijn varianten. Een issue kan bij
de ene gemeente wel en bij de andere niet voorkomen. Juist daarom staan de samples per
gemeente erin: in het tabblad Richtlijnen is dan per gemeente te zien waar het speelt.

## Bij een audit van een SIMsite-gemeente

1. Open het contentonderzoek van de gemeente en dit template-onderzoek naast elkaar.
2. Beoordeel per vondst (crawler of handmatig): content of template? Een lege kop, een
   ontbrekend tekstalternatief of een verkeerd gebruikte lijst is content en blijft in het
   klantonderzoek. Landmarks, ARIA, focusvolgorde en sjabloonstructuur zijn template.
3. Een template-issue dat hier al staat: koppel een sample van deze gemeente eraan. Een
   nieuw issue: één bevinding hier, met deze gemeente als eerste bewijs.
4. Een inline base64-afbeelding zonder tekstalternatief is bij template-monitoring geen
   bevinding: dat is een plakincident van een redacteur, geen sjabloonprobleem.

Voor de doorzet-route van een voorstel naar een technisch issue (`/technische-issues`,
`POST /api/technical-issues`) zie `docs/adr/0001-akkoord-als-poort.md`. Een technisch issue
heeft geen projectkoppeling; dit onderzoek is de plek waar het bewijs per gemeente ligt.

## Onderhoud per kwartaal

Vergelijk de Siteimprove-exports (CSV) van de aangesloten gemeenten, werk de tellers van de
voorvallen bij en zet opgeloste issues op `resolved`.

Laatst bekende stand (11 juni 2026): samples van Leudal (3) en Valkenswaard (2), dertien
open bevindingen en zes opmerkingen. De actuele stand staat in het onderzoek zelf.
