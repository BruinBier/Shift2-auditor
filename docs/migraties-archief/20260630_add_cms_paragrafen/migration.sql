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

-- CreateIndex
CREATE UNIQUE INDEX "cms_paragrafen_slug_key" ON "cms_paragrafen"("slug");

-- CreateTable
CREATE TABLE "cms_paragraaf_helpteksten" (
    "id" TEXT NOT NULL,
    "paragraph_id" TEXT NOT NULL,
    "element_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "help_text" TEXT NOT NULL,
    "wcag_criteria" TEXT,
    "screenshot_path" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_paragraaf_helpteksten_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "cms_paragraaf_helpteksten" ADD CONSTRAINT "cms_paragraaf_helpteksten_paragraph_id_fkey" FOREIGN KEY ("paragraph_id") REFERENCES "cms_paragrafen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed: Tekst-paragraaf + eerste helptekst (Afbeelding)
INSERT INTO "cms_paragrafen" ("id", "name", "slug", "description", "order", "created_at", "updated_at")
VALUES (
    'a1b2c3d4-0000-0000-0000-000000000001',
    'Tekst',
    'tekst',
    'Rich-text paragraaf waarin de redacteur tekst, koppen, lijsten, afbeeldingen, video''s en links kan plaatsen.',
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

INSERT INTO "cms_paragraaf_helpteksten" ("id", "paragraph_id", "element_type", "title", "help_text", "wcag_criteria", "screenshot_path", "order", "created_at", "updated_at")
VALUES (
    'a1b2c3d4-0000-0000-0000-000000000002',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'Afbeelding',
    'Afbeeldingen en onderschriften',
    E'Voor optimale toegankelijkheid kies je per afbeelding of deze informatief of decoratief is.\n\n## Informatieve afbeelding\n\nEen informatieve afbeelding voegt informatie toe aan de pagina. Gebruik dan altijd een tekstalternatief.\n\nVul bij **Tekstalternatief** kort in wat de afbeelding laat zien. Bijvoorbeeld:\n\n> De Groote Meer begin 2025\n\nGebruik **Onderschrift** alleen als je extra uitleg of context wilt geven. Bijvoorbeeld:\n\n> Het ven is grotendeels dichtgegroeid met riet en planten, het water is nauwelijks zichtbaar.\n\nEen screenreader leest dan ongeveer:\n\n> Afbeelding, De Groote Meer begin 2025. Het ven is grotendeels dichtgegroeid met riet en planten, het water is nauwelijks zichtbaar.\n\nWanneer een onderschrift is ingevuld, maakt het CMS hiervan een figure-element. De screenreader kan dan ook "figure" voorlezen. Dat is normaal: de afbeelding en het onderschrift worden dan als één geheel aangeboden.\n\n## Decoratieve afbeelding\n\nEen decoratieve afbeelding voegt geen inhoudelijke informatie toe en is alleen bedoeld voor sfeer of opmaak.\n\nLaat dan **Tekstalternatief** leeg en vul geen **Onderschrift** in. De afbeelding wordt dan door screenreaders overgeslagen.\n\nGebruik bij decoratieve afbeeldingen geen onderschrift. Als je een onderschrift invult, maakt het CMS een figure-element aan. Dit kan door screenreaders worden voorgelezen als "figure", waardoor de afbeelding niet meer volledig wordt genegeerd.',
    '1.1.1',
    'docs/cms-paragrafen/tekst/afbeelding/tekst-afbeelding 2.png',
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
