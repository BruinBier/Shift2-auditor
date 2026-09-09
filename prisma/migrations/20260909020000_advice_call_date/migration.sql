-- De dag van het adviesgesprek zelf, naast het moment van accepteren. Zo kan het
-- dashboard zeggen "adviesgesprek op 15 september" en, als die dag voorbij is,
-- vragen om het gesprek af te vinken.

ALTER TABLE "projects" ADD COLUMN "advice_call_date" DATE;
