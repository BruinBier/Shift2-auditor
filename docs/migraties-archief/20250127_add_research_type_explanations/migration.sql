-- Create table for default explanations per research type
CREATE TABLE "research_type_explanations" (
    "id" TEXT NOT NULL,
    "research_type_name" TEXT NOT NULL,
    "wcag_criterion_id" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "research_type_explanations_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
ALTER TABLE "research_type_explanations" ADD CONSTRAINT "research_type_explanations_wcag_criterion_id_fkey" FOREIGN KEY ("wcag_criterion_id") REFERENCES "wcag_criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add unique constraint to prevent duplicate explanations for the same research type and criterion
ALTER TABLE "research_type_explanations" ADD CONSTRAINT "research_type_explanations_research_type_name_wcag_criterion_id_key" UNIQUE ("research_type_name", "wcag_criterion_id");

-- Create index for faster lookups
CREATE INDEX "research_type_explanations_research_type_name_idx" ON "research_type_explanations"("research_type_name");