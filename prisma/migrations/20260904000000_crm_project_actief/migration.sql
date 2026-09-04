-- Staat dit onderzoek in de Dynamics-weergave "Mijn actieve projecten"?
--
-- Standaard ja. Op false betekent het: er is wel een project in het CRM, maar de
-- onderzoeker staat er niet als projectmanager op en ziet het dus niet in zijn eigen
-- lijst. Dat is iets anders dan een ontbrekend CRM-nummer.
ALTER TABLE "projects" ADD COLUMN "crm_project_actief" BOOLEAN NOT NULL DEFAULT true;
