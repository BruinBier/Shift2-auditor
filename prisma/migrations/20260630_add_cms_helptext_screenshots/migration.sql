-- DropColumn (verwijder oude single-screenshotPath kolom)
ALTER TABLE "cms_paragraaf_helpteksten" DROP COLUMN "screenshot_path";

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

-- AddForeignKey
ALTER TABLE "cms_helptext_screenshots" ADD CONSTRAINT "cms_helptext_screenshots_helptext_id_fkey" FOREIGN KEY ("helptext_id") REFERENCES "cms_paragraaf_helpteksten"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed: drie bestaande screenshots koppelen aan helptekst "Afbeeldingen en onderschriften"
INSERT INTO "cms_helptext_screenshots" ("id", "helptext_id", "path", "caption", "alt", "order", "created_at")
VALUES
    (
        'a1b2c3d4-0000-0000-0000-000000000010',
        'a1b2c3d4-0000-0000-0000-000000000002',
        '/cms-paragrafen/tekst/afbeelding/tekst.png',
        'De Tekst-paragraaf met toolbar (afbeelding-icoon om media toe te voegen)',
        'Lege Tekst-paragraaf in het CMS, met een toolbar boven het tekstveld waarin onder andere een afbeelding-icoon zichtbaar is.',
        0,
        CURRENT_TIMESTAMP
    ),
    (
        'a1b2c3d4-0000-0000-0000-000000000011',
        'a1b2c3d4-0000-0000-0000-000000000002',
        '/cms-paragrafen/tekst/afbeelding/tekst-afbeelding.png',
        'Modal: media-item uploaden of selecteren uit de mediatheek',
        'Modaal venster met tabs Uploaden en Selecteren, en een drag-and-drop gebied met de tekst Sleep bestanden hierheen om ze te uploaden.',
        1,
        CURRENT_TIMESTAMP
    ),
    (
        'a1b2c3d4-0000-0000-0000-000000000012',
        'a1b2c3d4-0000-0000-0000-000000000002',
        '/cms-paragrafen/tekst/afbeelding/tekst-afbeelding-2.png',
        'Modal: media-item invoegen met Tekstalternatief en Onderschrift',
        'Modaal venster met velden Tekstalternatief, Onderschrift, weergavegrootte en uitlijning voor de in te voegen afbeelding.',
        2,
        CURRENT_TIMESTAMP
    );
