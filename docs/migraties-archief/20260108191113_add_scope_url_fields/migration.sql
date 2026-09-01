-- CreateEnum
CREATE TYPE "SampleType" AS ENUM ('structured', 'random', 'pdf');

-- CreateEnum
CREATE TYPE "WCAGLevel" AS ENUM ('A', 'AA', 'AAA');

-- CreateEnum
CREATE TYPE "WCAGPrinciple" AS ENUM ('Perceivable', 'Operable', 'Understandable', 'Robust');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('passed', 'failed', 'not_present', 'unknown', 'not_tested');

-- CreateEnum
CREATE TYPE "FindingStatus" AS ENUM ('open', 'published', 'resolved');

-- CreateEnum
CREATE TYPE "FindingImpact" AS ENUM ('klein', 'matig', 'kritiek', 'onbekend');

-- CreateEnum
CREATE TYPE "FindingResponsibility" AS ENUM ('redacteur', 'ontwikkelaar', 'ontwerper', 'onbekend');

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "standard" TEXT NOT NULL DEFAULT 'WCAG 2.2',
    "level" TEXT NOT NULL DEFAULT 'AA',
    "research_type" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "client_name" TEXT,
    "commissioned_by" TEXT,
    "audited_by_org" TEXT NOT NULL DEFAULT 'Shift2',
    "researcher_name" TEXT,
    "date_start" TIMESTAMP(3),
    "date_end" TIMESTAMP(3),
    "report_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summary_text" TEXT,
    "researcher_feedback_text" TEXT,
    "about_research_text" TEXT,
    "what_was_tested_text" TEXT,
    "about_org_text" TEXT,
    "method_name" TEXT,
    "techniques_note" TEXT,
    "support_baseline" TEXT,
    "user_agents" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "technologies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_scope_urls" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "crawler_type" TEXT,
    "in_scope" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,

    CONSTRAINT "project_scope_urls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sample_items" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "sample_type" "SampleType" NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "order_index" INTEGER,

    CONSTRAINT "sample_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wcag_criteria" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title_nl" TEXT NOT NULL,
    "level" "WCAGLevel" NOT NULL,
    "principle" "WCAGPrinciple" NOT NULL,
    "guideline_code" TEXT NOT NULL,
    "guideline_title_nl" TEXT NOT NULL,
    "understanding_url" TEXT,

    CONSTRAINT "wcag_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "criterion_assessments" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "wcag_criterion_id" TEXT NOT NULL,
    "status" "AssessmentStatus" NOT NULL,
    "notes" TEXT,

    CONSTRAINT "criterion_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "findings" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "finding_code" TEXT NOT NULL,
    "wcag_criterion_id" TEXT NOT NULL,
    "status" "FindingStatus" NOT NULL DEFAULT 'open',
    "impact" "FindingImpact" NOT NULL DEFAULT 'onbekend',
    "responsibility" "FindingResponsibility" NOT NULL DEFAULT 'onbekend',
    "description" TEXT NOT NULL,
    "advice" TEXT NOT NULL,
    "evidence" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finding_occurrences" (
    "id" TEXT NOT NULL,
    "finding_id" TEXT NOT NULL,
    "sample_item_id" TEXT NOT NULL,
    "url" TEXT,
    "context" TEXT,

    CONSTRAINT "finding_occurrences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wcag_criteria_code_key" ON "wcag_criteria"("code");

-- CreateIndex
CREATE UNIQUE INDEX "criterion_assessments_project_id_wcag_criterion_id_key" ON "criterion_assessments"("project_id", "wcag_criterion_id");

-- AddForeignKey
ALTER TABLE "project_scope_urls" ADD CONSTRAINT "project_scope_urls_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_items" ADD CONSTRAINT "sample_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "criterion_assessments" ADD CONSTRAINT "criterion_assessments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "criterion_assessments" ADD CONSTRAINT "criterion_assessments_wcag_criterion_id_fkey" FOREIGN KEY ("wcag_criterion_id") REFERENCES "wcag_criteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "findings" ADD CONSTRAINT "findings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "findings" ADD CONSTRAINT "findings_wcag_criterion_id_fkey" FOREIGN KEY ("wcag_criterion_id") REFERENCES "wcag_criteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finding_occurrences" ADD CONSTRAINT "finding_occurrences_finding_id_fkey" FOREIGN KEY ("finding_id") REFERENCES "findings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finding_occurrences" ADD CONSTRAINT "finding_occurrences_sample_item_id_fkey" FOREIGN KEY ("sample_item_id") REFERENCES "sample_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
