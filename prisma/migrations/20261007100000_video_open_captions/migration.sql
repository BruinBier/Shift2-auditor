-- Video A2-gemeenten: heeft de video ingebrande ondertiteling (open captions)?
-- NULL = nog niet vastgesteld. Alleen een kolom erbij; er verandert of verdwijnt niets.
ALTER TABLE "videos" ADD COLUMN "open_captions" BOOLEAN;
