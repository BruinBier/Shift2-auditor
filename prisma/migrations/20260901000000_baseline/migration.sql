-- CreateEnum
CREATE TYPE "SampleType" AS ENUM ('structured', 'random', 'pdf');

-- CreateEnum
CREATE TYPE "SampleCheckStatus" AS ENUM ('voldoet', 'afgekeurd', 'opmerking', 'niet_aanwezig', 'niet_te_bepalen');

-- CreateEnum
CREATE TYPE "SampleCheckBron" AS ENUM ('workflow', 'gesprek', 'handmatig');

-- CreateEnum
CREATE TYPE "SampleCheckAkkoord" AS ENUM ('voorgesteld', 'akkoord', 'afgewezen');

-- CreateEnum
CREATE TYPE "WCAGLevel" AS ENUM ('A', 'AA', 'AAA');

-- CreateEnum
CREATE TYPE "WCAGPrinciple" AS ENUM ('Perceivable', 'Operable', 'Understandable', 'Robust');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('passed', 'failed', 'not_present', 'unknown', 'not_tested');

-- CreateEnum
CREATE TYPE "FindingType" AS ENUM ('bevinding', 'opmerking');

-- CreateEnum
CREATE TYPE "FindingStatus" AS ENUM ('voorstel', 'open', 'published', 'resolved', 'afgewezen');

-- CreateEnum
CREATE TYPE "WaarnemingStatus" AS ENUM ('open', 'uitgewerkt', 'vervallen');

-- CreateEnum
CREATE TYPE "FindingImpact" AS ENUM ('klein', 'matig', 'serieus', 'kritiek', 'onbekend');

-- CreateEnum
CREATE TYPE "FindingResponsibility" AS ENUM ('redacteur', 'ontwikkelaar', 'ontwerper', 'onbekend');

-- CreateEnum
CREATE TYPE "ProjectCheckPhase" AS ENUM ('nulmeting', 'tussencheck', 'herinspectie', 'afgerond');

-- CreateEnum
CREATE TYPE "TechnicalIssueStatus" AS ENUM ('open', 'resolved');

-- CreateEnum
CREATE TYPE "VideoGemeente" AS ENUM ('cranendonck', 'heeze_leende', 'valkenswaard');

-- CreateEnum
CREATE TYPE "VideoFase" AS ENUM ('voorbereiden', 'ondertiteling', 'audiodescriptie', 'transcript', 'publiceren');

-- CreateEnum
CREATE TYPE "VideoFaseStatus" AS ENUM ('todo', 'bezig', 'klaar', 'nvt');

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Shift2',
    "language" TEXT NOT NULL DEFAULT 'Nederlands',
    "address" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "about" TEXT,
    "logo_url" TEXT,
    "use_cardan_ai" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "report_intro_header" TEXT,
    "report_intro" TEXT,
    "report_intro_pdf" TEXT,
    "summary_template" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "research_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_type_wcag_criteria" (
    "id" TEXT NOT NULL,
    "research_type_id" TEXT NOT NULL,
    "wcag_criterion_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "research_type_wcag_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opdrachtgevers" (
    "id" TEXT NOT NULL,
    "kenmerk" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "projectnummer" TEXT,
    "contactnaam" TEXT,
    "contact_email" TEXT,
    "accountmanager" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opdrachtgevers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "projectnummer" TEXT,
    "opdrachtgever_id" TEXT NOT NULL,
    "details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "kenmerk" TEXT,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "standard" TEXT NOT NULL DEFAULT 'WCAG 2.2',
    "level" TEXT NOT NULL DEFAULT 'AA',
    "research_type" TEXT NOT NULL,
    "version" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "language" TEXT NOT NULL DEFAULT 'Nederlands',
    "status" TEXT NOT NULL DEFAULT 'In uitvoering',
    "client_name" TEXT,
    "commissioned_by" TEXT,
    "client_project_id" TEXT,
    "audited_by_org" TEXT NOT NULL DEFAULT 'Shift2',
    "researcher_name" TEXT,
    "accountmanager" TEXT,
    "controller_name" TEXT,
    "planned_time" TEXT,
    "date_start" TIMESTAMP(3),
    "date_end" TIMESTAMP(3),
    "research_started_on" TIMESTAMP(3),
    "report_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "notes" TEXT,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "is_private" BOOLEAN NOT NULL DEFAULT false,
    "is_proeftuin" BOOLEAN NOT NULL DEFAULT false,
    "summary_text" TEXT,
    "researcher_feedback_text" TEXT,
    "about_research_text" TEXT,
    "what_was_tested_text" TEXT,
    "about_org_text" TEXT,
    "scope_info" TEXT,
    "sample_info" TEXT,
    "conclusion_text" TEXT,
    "management_summary" TEXT,
    "researcher_feedback" TEXT,
    "method_name" TEXT,
    "techniques_note" TEXT,
    "support_baseline" TEXT,
    "user_agents" TEXT,
    "technologies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "parent_project_id" TEXT,
    "has_reinspection" BOOLEAN NOT NULL DEFAULT false,
    "reinspection_weeks" INTEGER,
    "reinspection_date" TIMESTAMP(6),
    "cancellation_reason" TEXT,
    "check_phase" "ProjectCheckPhase" NOT NULL DEFAULT 'nulmeting',
    "check_phase_started_at" TIMESTAMP(3),
    "interim_check_label" TEXT,
    "invitation_sent" TIMESTAMP(3),
    "scope_call_held" TIMESTAMP(3),
    "scope_call_transcript" TEXT,
    "planning_sent" TIMESTAMP(6),
    "planning_approved" TIMESTAMP(6),
    "scope_in_scope" TEXT,
    "scope_out_of_scope" TEXT,
    "sample_client_pages" TEXT,
    "is_external_project" BOOLEAN NOT NULL DEFAULT false,
    "is_ongoing" BOOLEAN NOT NULL DEFAULT false,
    "external_bureau" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "project_notes" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_notes_pkey" PRIMARY KEY ("id")
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
    "crawled_at" TIMESTAMP(3),
    "parent_url_id" TEXT,

    CONSTRAINT "project_scope_urls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sample_items" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "sample_type" "SampleType" NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "description" TEXT,
    "order_index" INTEGER,
    "make_screenshot" BOOLEAN NOT NULL DEFAULT false,
    "screenshot_path" TEXT,
    "screenshot_alt" TEXT,
    "audit_html_path" TEXT,
    "audit_captured_at" TIMESTAMP(3),
    "notes" TEXT,
    "crawled_at" TIMESTAMP(3),

    CONSTRAINT "sample_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sample_criterion_checks" (
    "id" TEXT NOT NULL,
    "sample_item_id" TEXT NOT NULL,
    "wcag_criterion_id" TEXT NOT NULL,
    "status" "SampleCheckStatus" NOT NULL,
    "reden" TEXT,
    "bron" "SampleCheckBron" NOT NULL DEFAULT 'workflow',
    "akkoord" "SampleCheckAkkoord",
    "verantwoording" JSONB,
    "controle" JSONB,
    "zelf_gevonden" JSONB,
    "gebieden" JSONB,
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sample_criterion_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wcag_criteria" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title_nl" TEXT NOT NULL,
    "description_nl" TEXT,
    "level" "WCAGLevel" NOT NULL,
    "principle" "WCAGPrinciple" NOT NULL,
    "guideline_code" TEXT NOT NULL,
    "guideline_title_nl" TEXT NOT NULL,
    "guideline_description_nl" TEXT,
    "understanding_url" TEXT,

    CONSTRAINT "wcag_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_type_explanations" (
    "id" TEXT NOT NULL,
    "research_type_name" TEXT NOT NULL,
    "wcag_criterion_id" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "research_type_explanations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "criterion_assessments" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "wcag_criterion_id" TEXT NOT NULL,
    "status" "AssessmentStatus" NOT NULL,
    "notes" TEXT,
    "explanation" TEXT,

    CONSTRAINT "criterion_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quick_findings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "advice" TEXT NOT NULL,
    "criterion_code" TEXT NOT NULL,
    "keywords" TEXT,
    "crawler" BOOLEAN NOT NULL DEFAULT false,
    "crawler_test_id" TEXT,
    "status" "FindingStatus",
    "impact" "FindingImpact",
    "responsibility" "FindingResponsibility",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quick_findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "findings" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "finding_code" TEXT NOT NULL,
    "wcag_criterion_id" TEXT NOT NULL,
    "type" "FindingType" NOT NULL DEFAULT 'bevinding',
    "status" "FindingStatus" NOT NULL DEFAULT 'open',
    "impact" "FindingImpact",
    "responsibility" "FindingResponsibility",
    "description" TEXT NOT NULL,
    "advice" TEXT NOT NULL,
    "evidence" TEXT,
    "notes" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "interim_reviewed" BOOLEAN NOT NULL DEFAULT false,
    "interim_notes" TEXT,
    "discovered_in_phase" "ProjectCheckPhase" NOT NULL DEFAULT 'nulmeting',
    "akkoord_op" TIMESTAMP(3),
    "afwijzingsreden" TEXT,
    "technical_issue_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waarnemingen" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "sample_item_id" TEXT,
    "url" TEXT,
    "tekst" TEXT NOT NULL,
    "screenshot_path" TEXT,
    "status" "WaarnemingStatus" NOT NULL DEFAULT 'open',
    "finding_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waarnemingen_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "finding_urls" (
    "id" TEXT NOT NULL,
    "finding_id" TEXT NOT NULL,
    "scope_url_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finding_urls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finding_attachments" (
    "id" TEXT NOT NULL,
    "finding_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_path" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finding_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crawler_results" (
    "id" TEXT NOT NULL,
    "scope_url_id" TEXT,
    "sample_item_id" TEXT,
    "test_id" TEXT NOT NULL,
    "test_name" TEXT NOT NULL,
    "found" BOOLEAN NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crawler_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crawler_runs" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "total_urls" INTEGER NOT NULL DEFAULT 0,
    "urls_processed" INTEGER NOT NULL DEFAULT 0,
    "urls_failed" INTEGER NOT NULL DEFAULT 0,
    "total_issues" INTEGER NOT NULL DEFAULT 0,
    "critical_issues" INTEGER NOT NULL DEFAULT 0,
    "config" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "crawler_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technical_issues" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "request" TEXT,
    "wcag_criterion_id" TEXT,
    "impact" "FindingImpact",
    "supplier" TEXT,
    "status" "TechnicalIssueStatus" NOT NULL DEFAULT 'open',
    "github_issue_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "technical_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_paragrafen" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_paragrafen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_paragraaf_helpteksten" (
    "id" TEXT NOT NULL,
    "paragraph_id" TEXT NOT NULL,
    "element_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "help_text" TEXT NOT NULL,
    "wcag_criteria" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_paragraaf_helpteksten_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_helptext_screenshots" (
    "id" TEXT NOT NULL,
    "helptext_id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "caption" TEXT,
    "alt" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_helptext_screenshots_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "videos" (
    "id" TEXT NOT NULL,
    "gemeente" "VideoGemeente" NOT NULL,
    "titel" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "notities" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_phases" (
    "id" TEXT NOT NULL,
    "video_id" TEXT NOT NULL,
    "phase" "VideoFase" NOT NULL,
    "status" "VideoFaseStatus" NOT NULL DEFAULT 'todo',
    "seconds" INTEGER NOT NULL DEFAULT 0,
    "timer_started_at" TIMESTAMP(3),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_phases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "research_types_name_key" ON "research_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "research_type_wcag_criteria_research_type_id_wcag_criterion_key" ON "research_type_wcag_criteria"("research_type_id", "wcag_criterion_id");

-- CreateIndex
CREATE UNIQUE INDEX "opdrachtgevers_kenmerk_key" ON "opdrachtgevers"("kenmerk");

-- CreateIndex
CREATE INDEX "project_planning_changes_project_id_idx" ON "project_planning_changes"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "sample_criterion_checks_sample_item_id_wcag_criterion_id_key" ON "sample_criterion_checks"("sample_item_id", "wcag_criterion_id");

-- CreateIndex
CREATE UNIQUE INDEX "wcag_criteria_code_key" ON "wcag_criteria"("code");

-- CreateIndex
CREATE INDEX "research_type_explanations_research_type_name_idx" ON "research_type_explanations"("research_type_name");

-- CreateIndex
CREATE UNIQUE INDEX "research_type_explanations_research_type_name_wcag_criterio_key" ON "research_type_explanations"("research_type_name", "wcag_criterion_id");

-- CreateIndex
CREATE UNIQUE INDEX "criterion_assessments_project_id_wcag_criterion_id_key" ON "criterion_assessments"("project_id", "wcag_criterion_id");

-- CreateIndex
CREATE UNIQUE INDEX "quick_findings_crawler_test_id_key" ON "quick_findings"("crawler_test_id");

-- CreateIndex
CREATE UNIQUE INDEX "findings_project_id_finding_code_key" ON "findings"("project_id", "finding_code");

-- CreateIndex
CREATE UNIQUE INDEX "finding_urls_finding_id_scope_url_id_key" ON "finding_urls"("finding_id", "scope_url_id");

-- CreateIndex
CREATE INDEX "technical_issues_status_idx" ON "technical_issues"("status");

-- CreateIndex
CREATE INDEX "technical_issues_wcag_criterion_id_idx" ON "technical_issues"("wcag_criterion_id");

-- CreateIndex
CREATE UNIQUE INDEX "cms_paragrafen_slug_key" ON "cms_paragrafen"("slug");

-- CreateIndex
CREATE INDEX "project_advices_project_id_idx" ON "project_advices"("project_id");

-- CreateIndex
CREATE INDEX "videos_gemeente_idx" ON "videos"("gemeente");

-- CreateIndex
CREATE INDEX "video_phases_video_id_idx" ON "video_phases"("video_id");

-- CreateIndex
CREATE UNIQUE INDEX "video_phases_video_id_phase_key" ON "video_phases"("video_id", "phase");

-- AddForeignKey
ALTER TABLE "research_type_wcag_criteria" ADD CONSTRAINT "research_type_wcag_criteria_research_type_id_fkey" FOREIGN KEY ("research_type_id") REFERENCES "research_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_type_wcag_criteria" ADD CONSTRAINT "research_type_wcag_criteria_wcag_criterion_id_fkey" FOREIGN KEY ("wcag_criterion_id") REFERENCES "wcag_criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_projects" ADD CONSTRAINT "client_projects_opdrachtgever_id_fkey" FOREIGN KEY ("opdrachtgever_id") REFERENCES "opdrachtgevers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_project_id_fkey" FOREIGN KEY ("client_project_id") REFERENCES "client_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_parent_project_id_fkey" FOREIGN KEY ("parent_project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_planning_changes" ADD CONSTRAINT "project_planning_changes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_notes" ADD CONSTRAINT "project_notes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_scope_urls" ADD CONSTRAINT "project_scope_urls_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_scope_urls" ADD CONSTRAINT "project_scope_urls_parent_url_id_fkey" FOREIGN KEY ("parent_url_id") REFERENCES "project_scope_urls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_items" ADD CONSTRAINT "sample_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_criterion_checks" ADD CONSTRAINT "sample_criterion_checks_sample_item_id_fkey" FOREIGN KEY ("sample_item_id") REFERENCES "sample_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_criterion_checks" ADD CONSTRAINT "sample_criterion_checks_wcag_criterion_id_fkey" FOREIGN KEY ("wcag_criterion_id") REFERENCES "wcag_criteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_type_explanations" ADD CONSTRAINT "research_type_explanations_wcag_criterion_id_fkey" FOREIGN KEY ("wcag_criterion_id") REFERENCES "wcag_criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "criterion_assessments" ADD CONSTRAINT "criterion_assessments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "criterion_assessments" ADD CONSTRAINT "criterion_assessments_wcag_criterion_id_fkey" FOREIGN KEY ("wcag_criterion_id") REFERENCES "wcag_criteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "findings" ADD CONSTRAINT "findings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "findings" ADD CONSTRAINT "findings_wcag_criterion_id_fkey" FOREIGN KEY ("wcag_criterion_id") REFERENCES "wcag_criteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "findings" ADD CONSTRAINT "findings_technical_issue_id_fkey" FOREIGN KEY ("technical_issue_id") REFERENCES "technical_issues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waarnemingen" ADD CONSTRAINT "waarnemingen_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waarnemingen" ADD CONSTRAINT "waarnemingen_sample_item_id_fkey" FOREIGN KEY ("sample_item_id") REFERENCES "sample_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waarnemingen" ADD CONSTRAINT "waarnemingen_finding_id_fkey" FOREIGN KEY ("finding_id") REFERENCES "findings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finding_occurrences" ADD CONSTRAINT "finding_occurrences_finding_id_fkey" FOREIGN KEY ("finding_id") REFERENCES "findings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finding_occurrences" ADD CONSTRAINT "finding_occurrences_sample_item_id_fkey" FOREIGN KEY ("sample_item_id") REFERENCES "sample_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finding_urls" ADD CONSTRAINT "finding_urls_finding_id_fkey" FOREIGN KEY ("finding_id") REFERENCES "findings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finding_urls" ADD CONSTRAINT "finding_urls_scope_url_id_fkey" FOREIGN KEY ("scope_url_id") REFERENCES "project_scope_urls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finding_attachments" ADD CONSTRAINT "finding_attachments_finding_id_fkey" FOREIGN KEY ("finding_id") REFERENCES "findings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crawler_results" ADD CONSTRAINT "crawler_results_scope_url_id_fkey" FOREIGN KEY ("scope_url_id") REFERENCES "project_scope_urls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crawler_results" ADD CONSTRAINT "crawler_results_sample_item_id_fkey" FOREIGN KEY ("sample_item_id") REFERENCES "sample_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crawler_runs" ADD CONSTRAINT "crawler_runs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technical_issues" ADD CONSTRAINT "technical_issues_wcag_criterion_id_fkey" FOREIGN KEY ("wcag_criterion_id") REFERENCES "wcag_criteria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_paragraaf_helpteksten" ADD CONSTRAINT "cms_paragraaf_helpteksten_paragraph_id_fkey" FOREIGN KEY ("paragraph_id") REFERENCES "cms_paragrafen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_helptext_screenshots" ADD CONSTRAINT "cms_helptext_screenshots_helptext_id_fkey" FOREIGN KEY ("helptext_id") REFERENCES "cms_paragraaf_helpteksten"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_advices" ADD CONSTRAINT "project_advices_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_advices" ADD CONSTRAINT "project_advices_wcag_criterion_id_fkey" FOREIGN KEY ("wcag_criterion_id") REFERENCES "wcag_criteria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_phases" ADD CONSTRAINT "video_phases_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ---------------------------------------------------------------------------
-- Met de hand toegevoegd aan de baseline.
--
-- Prisma kan een partieel-unieke index niet in het schema uitdrukken, dus
-- `migrate diff` genereert hem niet. Zonder deze regel zou hij bij het opnieuw
-- baselinen verdwijnen, en dan is de garantie weg zonder dat iemand het merkt.
--
-- HARDE GARANTIE: max. 1 lopende timer in het HELE systeem. Hooguit één rij mag
-- tegelijk een niet-null timer_started_at hebben.
--
-- Kwam uit 20260724_add_video_a2_gemeenten; zie het commentaar bij het
-- Video-model in schema.prisma.
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS "video_phases_one_running_timer_idx"
  ON "video_phases"((timer_started_at IS NOT NULL))
  WHERE "timer_started_at" IS NOT NULL;
