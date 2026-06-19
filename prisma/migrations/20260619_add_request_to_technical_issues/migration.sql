-- Voegt het optionele 'request'-veld (verzoek) toe aan technical_issues.
ALTER TABLE "technical_issues"
  ADD COLUMN "request" TEXT;
