-- Tussen "uitnodiging verstuurd" en "scopegesprek gevoerd" zit het moment dat de klant
-- een datum doorgeeft. Zonder deze velden blijft het dashboard "nog geen datum voor het
-- scopegesprek" zeggen, en na veertien dagen "herinnering sturen", voor een gesprek dat
-- al in de agenda staat. Zelfde opzet als advice_call_accepted en advice_call_date.

ALTER TABLE "projects" ADD COLUMN "scope_call_planned" TIMESTAMP(6);
ALTER TABLE "projects" ADD COLUMN "scope_call_date" DATE;
