-- Het adviesgesprek na de oplevering van de nulmeting.
--
-- De planningsmail belooft dit gesprek aan de klant ("Na afronding van de nulmeting
-- ontvang je van mij een uitnodiging voor een overleg"), maar er was geen plek om vast
-- te leggen of het ook gevoerd was.
--
-- Twee kolommen en niet een: tussen de uitnodiging en het gesprek zit wachttijd. Met
-- een kolom zou een verstuurde uitnodiging waar niemand op reageert er hetzelfde
-- uitzien als een uitnodiging die nooit verstuurd is.
ALTER TABLE "projects" ADD COLUMN "advice_call_invited" TIMESTAMP(3);
ALTER TABLE "projects" ADD COLUMN "advice_call_held" TIMESTAMP(3);
