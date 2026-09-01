-- De vaste gegevens die in de oude migraties zaten.
--
-- Bij het opnieuw baselinen (20260901000000_baseline) is de structuur uit
-- schema.prisma gegenereerd, maar `migrate diff` kent geen INSERTs. Deze rijen
-- stonden in drie oude migraties en zouden daarmee verdwijnen op een verse
-- database: dan mist de standaardlijst met user agents en de hele CMS-hulptekst.
--
-- prisma/seed.ts dekt ze niet -- daar staan de WCAG-criteria en de
-- onderzoekstypen in, niet deze.
--
-- Alles is idempotent gemaakt met ON CONFLICT DO NOTHING: op een bestaande
-- database gebeurt er niets.

-- Uit 20260317_add_settings_table
INSERT INTO "settings" ("id", "key", "value", "description", "created_at", "updated_at")
VALUES (
    gen_random_uuid(),
    'default_user_agents',
    'Google Chrome 145 (primair); Mozilla Firefox 147; Microsoft Edge 145; NVDA (Windows) in combinatie met Google Chrome;',
    'Standaard user agents voor nieuwe projecten',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Uit 20260630_add_cms_paragrafen
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

-- Uit 20260630_add_cms_helptext_screenshots
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
