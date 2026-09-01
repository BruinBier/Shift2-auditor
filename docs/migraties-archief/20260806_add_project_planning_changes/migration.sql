-- Verschuivingen van de planning vastleggen, met de reden erbij.
-- Alleen een nieuwe tabel: er wordt niets bestaands gewijzigd of verwijderd.

CREATE TABLE "project_planning_changes" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "old_date_start" TIMESTAMP(3),
    "old_date_end" TIMESTAMP(3),
    "new_date_start" TIMESTAMP(3),
    "new_date_end" TIMESTAMP(3),
    "reason" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_planning_changes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "project_planning_changes_project_id_idx" ON "project_planning_changes"("project_id");

ALTER TABLE "project_planning_changes"
    ADD CONSTRAINT "project_planning_changes_project_id_fkey"
    FOREIGN KEY ("project_id") REFERENCES "projects"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
