-- Het Cardan-kenmerk (C-4521) naast het Dynamics-nummer op het klantproject,
-- zodat een traject dat Cardan uitvoert terug te vinden is zonder de drie
-- bronnen met de hand naast elkaar te leggen.

ALTER TABLE "client_projects" ADD COLUMN "cardan_kenmerk" TEXT;
