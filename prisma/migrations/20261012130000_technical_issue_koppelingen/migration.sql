-- Gekoppelde werkitems: koppelingen tussen technische issues, één rij per paar.
CREATE TABLE "technical_issue_koppelingen" (
    "id" TEXT NOT NULL,
    "van_id" TEXT NOT NULL,
    "naar_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "technical_issue_koppelingen_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "technical_issue_koppelingen_van_id_naar_id_key" ON "technical_issue_koppelingen"("van_id", "naar_id");
CREATE INDEX "technical_issue_koppelingen_naar_id_idx" ON "technical_issue_koppelingen"("naar_id");

ALTER TABLE "technical_issue_koppelingen" ADD CONSTRAINT "technical_issue_koppelingen_van_id_fkey" FOREIGN KEY ("van_id") REFERENCES "technical_issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "technical_issue_koppelingen" ADD CONSTRAINT "technical_issue_koppelingen_naar_id_fkey" FOREIGN KEY ("naar_id") REFERENCES "technical_issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
