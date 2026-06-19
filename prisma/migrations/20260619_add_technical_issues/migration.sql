-- Technische issues: aparte lijst, los van WCAG-onderzoeken.
-- Voor interne registratie van leverancier-/ontwikkelteam-issues.

-- 1. Nieuwe enum voor status
CREATE TYPE "TechnicalIssueStatus" AS ENUM ('open', 'resolved');

-- 2. Hoofdtabel
CREATE TABLE "technical_issues" (
  "id"                TEXT NOT NULL,
  "title"             TEXT NOT NULL,
  "description"       TEXT NOT NULL,
  "wcag_criterion_id" TEXT,
  "impact"            "FindingImpact",
  "supplier"          TEXT,
  "status"            "TechnicalIssueStatus" NOT NULL DEFAULT 'open',
  "github_issue_url"  TEXT,
  "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"        TIMESTAMP(3) NOT NULL,

  CONSTRAINT "technical_issues_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "technical_issues_status_idx" ON "technical_issues"("status");
CREATE INDEX "technical_issues_wcag_criterion_id_idx" ON "technical_issues"("wcag_criterion_id");

ALTER TABLE "technical_issues"
  ADD CONSTRAINT "technical_issues_wcag_criterion_id_fkey"
  FOREIGN KEY ("wcag_criterion_id") REFERENCES "wcag_criteria"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 3. URL-tabel (voorbeeld-URLs per issue)
CREATE TABLE "technical_issue_urls" (
  "id"         TEXT NOT NULL,
  "issue_id"   TEXT NOT NULL,
  "url"        TEXT NOT NULL,
  "label"      TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "technical_issue_urls_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "technical_issue_urls_issue_id_idx" ON "technical_issue_urls"("issue_id");

ALTER TABLE "technical_issue_urls"
  ADD CONSTRAINT "technical_issue_urls_issue_id_fkey"
  FOREIGN KEY ("issue_id") REFERENCES "technical_issues"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
