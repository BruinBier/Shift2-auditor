-- De mail waarmee het rapport van een herinspectie wordt opgeleverd.
--
-- Na de hertest is er geen adviesgesprek meer -- dat was er al na de nulmeting -- maar wel
-- een bericht dat het onderzoek klaar is, met de link naar het rapport. Zonder dit veld is
-- achteraf niet te zien of die mail eruit is.
ALTER TABLE "projects" ADD COLUMN "report_sent_at" TIMESTAMP(3);
