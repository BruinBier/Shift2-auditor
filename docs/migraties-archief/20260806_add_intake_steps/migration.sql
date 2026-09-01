-- Voorbereidingsstappen vóór de planning vastleggen.
-- Alleen nieuwe kolommen, allemaal optioneel: bestaande rijen blijven ongewijzigd.

ALTER TABLE "projects" ADD COLUMN "invitation_sent" TIMESTAMP(3);
ALTER TABLE "projects" ADD COLUMN "scope_call_held" TIMESTAMP(3);
ALTER TABLE "projects" ADD COLUMN "scope_call_transcript" TEXT;
