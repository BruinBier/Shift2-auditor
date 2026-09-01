-- CreateTable
CREATE TABLE "project_advices" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "advice_text" TEXT NOT NULL,
    "reason_text" TEXT NOT NULL,
    "wcag_criterion_id" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_advices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_advices_project_id_idx" ON "project_advices"("project_id");

-- AddForeignKey
ALTER TABLE "project_advices" ADD CONSTRAINT "project_advices_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_advices" ADD CONSTRAINT "project_advices_wcag_criterion_id_fkey" FOREIGN KEY ("wcag_criterion_id") REFERENCES "wcag_criteria"("id") ON DELETE SET NULL ON UPDATE CASCADE;
