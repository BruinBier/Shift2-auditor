# Projectgegevens via Excel

Open **Beheer → Projecten → Projectgegevens via Excel** (`/admin/projecten/excel`).

1. Exporteer alle klantprojecten naar `shift2-projecten.xlsx` (ongeacht filters op het overzicht).
2. Bewerk het tabblad **Projecten** in Excel. Gegevens uit Dynamics worden handmatig als tekst overgenomen; er wordt geen externe URL opgehaald.
3. Upload het aangepaste `.xlsx`-bestand. Uploaden is alleen lezen en controleren.
4. Bekijk toegevoegde, gewijzigde en ongewijzigde records, inclusief oude en nieuwe waarden per veld. Het filter verandert alleen de weergave, niet de importselectie.
5. Kies **Alles toepassen** of **Annuleren**. Het hele bestand wordt in één transactie verwerkt. Het voorbeeld verloopt na 15 minuten.

## Formaat v1

| Kolom | Betekenis |
| --- | --- |
| project_id | Stabiele UUID van ClientProject. Bestaande waarde behouden; leeg voor nieuw. |
| versie | updatedAt als ISO-tekst, niet als Excel-datum. Bestaande waarde behouden; leeg voor nieuw. |
| projectnaam | Verplichte naam, maximaal 250 tekens. |
| opdrachtgever_id | Bestaande UUID uit tabblad Opdrachtgevers. |
| crm_projectnummer | Optioneel, P gevolgd door cijfers, maximaal 50 tekens. Bijvoorbeeld P02645. |
| cardan_kenmerk | Optioneel, maximaal 100 tekens. Bijvoorbeeld C-4521. |

Alle zes kolommen zijn verplicht, maar hun volgorde mag veranderen. Lege CRM- en Cardan-velden betekenen **wissen** en worden zichtbaar in het voorbeeld. Ontbrekende rijen verwijderen niets. Geen gedeeltelijke imports: één fout blokkeert het hele bestand.

Andere tabbladen: **Opdrachtgevers** is een referentielijst (ID, kenmerk, naam), **Lees mij** bevat instructies. Deze worden niet geïmporteerd. Andere tabbladen worden afgekeurd. Projectdetails (mogelijk logingegevens/rich text), onderzoeken, planning en bevindingen worden niet geëxporteerd of gewijzigd.

## Validatie en opslag

- Maximaal 5 MB upload, 25 MB uitgepakt, 500 ZIP-onderdelen en 2000 projectrijen. Het HTTP-verzoek wordt begrensd tijdens het lezen, ook zonder Content-Length.
- Alleen .xlsx en gewone tekstcellen; geen formules, hyperlinks, getallen, datums of samengevoegde cellen.
- Fouten noemen Excelrij en kolom of veld. Onbekende/dubbele IDs, onbekende opdrachtgevers, versieverschillen en nieuwe dubbele CRM-toewijzingen worden afgekeurd.
- Nieuwe projecten met dezelfde naam bij dezelfde opdrachtgever worden geweigerd: zo kan het wissen van ID en versie een bestaand project niet dupliceren.
- UUIDs voor nieuwe projecten worden in het voorbeeld gegenereerd en behouden bij toepassen.
- Het servervoorbeeld is HMAC-ondertekend en gebonden aan een momentopname van de klantprojecten en opdrachtgevers. De client kan geen gewijzigde importgegevens toepassen zonder nieuw voorbeeld.
- De momentopname wordt binnen een PostgreSQL Serializable-transactie opnieuw vergeleken. Alle writes slagen samen of worden teruggedraaid. Conflicten leveren HTTP 409; geen automatische retry die de goedgekeurde wijzigingen ongemerkt zou veranderen.
- Ongewijzigde projecten worden niet opnieuw opgeslagen. Bestaande ID en overige velden blijven behouden. Een herhaald token wordt na een succesvolle wijziging door de momentopnamecontrole geweigerd.
- POST vereist dezelfde Origin als de Host van Shift2 Auditor. Dit sluit aan op de bestaande lokale applicatie; er is geen nieuw account- of Dynamics-authenticatiesysteem toegevoegd.

Optioneel: stel `PROJECT_EXCEL_SECRET` in op een lange willekeurige geheime waarde, gedeeld door alle app-processen. Zonder deze instelling gebruikt de lokale app een processleutel. Na een herstart (of bij een ander proces) wordt een oud controlevoorbeeld veilig geweigerd; upload dan opnieuw. De sleutel hoort uitsluitend in de serveromgeving.

Geen databasewijziging of migratie nodig. Gebruikt de bestaande ExcelJS-afhankelijkheid, ClientProject/Opdrachtgever-modellen en Prisma-client.

## Controles

- `npm run test:project-excel`: Excel roundtrip, validatie, controlevoorbeeld, token, versieconflicten en transactiegedrag met een transactionele testdouble.
- `npm run test:project-excel:http`: start een tijdelijke Next-devserver en controleert de schermroute en ongeldige HTTP-verzoeken zonder databaseverbinding.
- `node --import tsx --test lib/audit-evidence.test.ts lib/browser-versions.test.ts`: bestaande regressietests.
- `npx tsc --noEmit`: projectbrede typecontrole. De bestaande code bevat typefouten; vergelijk met de basiscommit voor nieuwe fouten.
- `npm run build`: productiecompilatie. Voor volledige gegevens- en databasevalidatie is een bereikbare DATABASE_URL nodig.

Een echte PostgreSQL-integratietest en interactietest van export → bewerken → preview → toepassen vereisen een afzonderlijke testdatabase. De transactionele testdouble bewijst het aangeroepen transactiepad en foutgedrag, maar vervangt geen database-integratietest.

## Resultaat in de cloudwerkruimte (2 oktober 2026)

- 16 Excel-tests geslaagd (inclusief vervalste ZIP-groottes, stale voorbeeld en rollback-pad).
- 8 bestaande regressietests geslaagd.
- HTTP-smokecheck: scherm HTTP 200 en 8 ongeldige verzoeken met de verwachte 400/403/413-status.
- TypeScript: 93 foutlocaties in zowel basiscommit als werkversie; geen nieuwe foutlocaties en geen fouten in de Excel-onderdelen.
- Productiebuild compileert succesvol, maar stopt bij page-data collection: de bestaande `/api/extra/generate-summary` initialiseert OpenAI zonder aanwezige OPENAI_API_KEY. Die route is niet gewijzigd.
- Geen gekoppelde PostgreSQL-testdatabase: succesvolle export/import via de echte database en echte concurrentie/rollback zijn niet getest.
