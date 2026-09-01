-- Findingcodes moeten uniek zijn binnen een project.
--
-- Vier routes kenden findingCode toe met een lezen-dan-schrijven zonder
-- transactie. Twee aanmaakacties vlak na elkaar lazen daardoor hetzelfde
-- maximum en schreven dezelfde code. In zeven gevallen stonden er twee
-- verschillende findings onder een code; die zijn hernummerd voordat deze
-- migratie is gemaakt.
--
-- De constraint is het vangnet; lib/finding-code.ts kent de code voortaan
-- binnen een transactie toe en probeert het opnieuw bij een botsing.

CREATE UNIQUE INDEX "findings_project_id_finding_code_key"
  ON "findings"("project_id", "finding_code");
