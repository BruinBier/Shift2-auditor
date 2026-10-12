-- Twee statussen erbij voor technische issues: ingediend (gemeld bij de leverancier) en
-- in_behandeling (de leverancier is ermee bezig). Bestaande issues houden hun status.
ALTER TYPE "TechnicalIssueStatus" ADD VALUE IF NOT EXISTS 'ingediend';
ALTER TYPE "TechnicalIssueStatus" ADD VALUE IF NOT EXISTS 'in_behandeling';
