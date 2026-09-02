---
status: proposed
---

# ChatGPT Work schrijft niet in de tool; de onderzoeker plakt

Work begeleidt de klantkant van een onderzoek: het leest de opdrachtmail, stelt de
planningsmail op en zet het rapport later als concept op simcms.shift2.nl. Eén stap
daartussen raakt Shift2Auditor: het nieuwe onderzoek moet erin komen te staan.

Dat gebeurt met kopiëren en plakken. Work levert een blok gegevens, de onderzoeker plakt
het in een scherm dat eerst laat zien wat er gaat gebeuren, en bevestigt. Er komt geen
koppeling tussen Work en de tool.

## Waarom Work er niet zelf bij kan

Shift2Auditor draait op `localhost:3000` op één laptop. Work draait bij OpenAI. `localhost`
betekent daar hun eigen machine. Er is geen adres waarop Work de tool kan vinden, en een
URL meegeven helpt niet — dan kijkt Work in zijn eigen bureaula.

Een tunnel lost dat op in een uur. Maar de tool heeft geen authenticatie: geen
`middleware.ts`, geen inlogscherm, geen sessie. Elke route in `app/api/` staat open, en
`POST /api/projects` maakt een onderzoek aan voor wie het maar vraagt. Een tunnel zonder
inlogscherm zet de auditadministratie van alle gemeenteklanten publiek op straat, te lezen
én te wijzigen.

Eerst het slot, dan de deur. En het slot is een eigen project.

## Waarom geen MCP-server, ook niet later

ChatGPT accepteert alleen een remote MCP-server: een publiek HTTPS-eindpunt met Streamable
HTTP of SSE. Een lokale server zoals Claude Desktop die toestaat, kan niet. En een
geauthenticeerde server moet OAuth 2.1 met PKCE spreken volgens de MCP-autorisatiespec —
geen vaste sleutel in een header. Dat is een autorisatieserver kopen of bouwen, plus een
tunnel, plus een beveiligde routelaag.

Waar dat allemaal voor zou dienen: acht velden, één keer per nieuw onderzoek.

## Waarom plakken niet de slechtere oplossing is

Het oorspronkelijke plan noemde "concept en definitief zijn verschillende toestanden" als
architectuurprincipe, en beschreef daar conceptstatussen, goedkeuringspoorten en een
gebeurtenissenlogboek voor. Bij kopiëren en plakken is dat er gratis: het voorstel bestaat
alleen als tekst tot de onderzoeker op de knop drukt.

Dezelfde vorm werkt al aan de andere kant van de keten. Work zet het rapport als concept in
Drupal; de moderatiestatus daar is de goedkeuringspoort, en die hoefde niemand te bouwen.

Bij één onderzoeker die toch naar elk voorstel kijkt, is "Work schrijft weg, jij keurt
achteraf goed" nauwelijks sneller dan "Work levert, jij plakt" — en het eerste kost weken
infrastructuur die daarna onderhouden moet worden.

## Wat het scherm moet laten zien

De voorbeeldweergave is het punt van het hele ding, niet de invoer. Ze moet per onderdeel
zeggen of het nieuw is of bestaand:

> Nieuwe opdrachtgever: Gemeente Utrechtse Heuvelrug (HAR)
> Bestaand klantproject: heuvelrug.nl
> Nieuw onderzoek: HAR-02

Zonder die regels merk je pas weken later dat er een tweede "Gemeente Heuvelrug" naast
"Gemeente Utrechtse Heuvelrug" is ontstaan, met onderzoeken onder allebei.

## Wat dit kost

Work kan niet zelf in de tool kijken. Dat gat wordt gedicht doordat Codex mag lezen op de
laptop; zie `0004-codex-mag-alleen-lezen.md`. Verdwijnt Codex uit de keten, dan komt de
vraag terug — en dan is een overzichtsbestand dat de tool zelf naar OneDrive schrijft het
lichtste antwoord. De laptop kan overal bij; alleen andersom niet.
