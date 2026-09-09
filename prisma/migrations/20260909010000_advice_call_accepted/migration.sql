-- Tussen "uitnodiging adviesgesprek verstuurd" en "adviesgesprek gevoerd" zit het
-- moment dat de klant de uitnodiging accepteert. Zonder dit veld blijft het dashboard
-- na de rappeltermijn "herinnering sturen" zeggen voor een gesprek dat al gepland is.

ALTER TABLE "projects" ADD COLUMN "advice_call_accepted" TIMESTAMP(6);
