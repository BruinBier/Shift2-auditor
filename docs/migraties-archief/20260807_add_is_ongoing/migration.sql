-- Doorlopende projecten (template-monitoring, pagechecks) markeren, zodat ze
-- een eigen sectie krijgen in plaats van tussen de geplande onderzoeken.
-- Alleen een nieuwe kolom met een standaardwaarde: bestaande rijen blijven
-- ongewijzigd en gelden als niet-doorlopend.

ALTER TABLE "projects" ADD COLUMN "is_ongoing" BOOLEAN NOT NULL DEFAULT false;
