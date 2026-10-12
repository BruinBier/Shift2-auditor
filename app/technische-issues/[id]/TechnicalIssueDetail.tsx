'use client';

import TechnicalIssueForm, { TechnicalIssueFormValues } from '../TechnicalIssueForm';

interface Criterion {
  id: string;
  code: string;
  titleNl: string;
  level: string;
}

interface Props {
  initial: TechnicalIssueFormValues;
  criteria: Criterion[];
}

/**
 * De detailpagina van een technisch issue: alleen het formulier.
 *
 * De GitHub-koppeling (plaatsen, tekst genereren, reacties ophalen, de sync op de lijst)
 * is op 2026-10-12 weggehaald (besluit Frits). De kolom github_issue_url staat nog in de
 * database met de oude links, maar niets leest of schrijft hem meer.
 */
export default function TechnicalIssueDetail({ initial, criteria }: Props) {
  return (
    <div className="space-y-6">
      <TechnicalIssueForm mode="edit" initial={initial} criteria={criteria} />
    </div>
  );
}
