-- Contactpersoon (naam en e-mail) op het klantproject. Bij de opdrachtgever
-- staat er al een, maar die geldt voor de organisatie; per project kan het
-- iemand anders zijn, en de oplevermails moeten aan die persoon gericht zijn.

ALTER TABLE "client_projects" ADD COLUMN "contactnaam" TEXT;
ALTER TABLE "client_projects" ADD COLUMN "contact_email" TEXT;
