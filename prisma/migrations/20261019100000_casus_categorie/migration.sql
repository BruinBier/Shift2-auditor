-- Categorie per casus, voor de indeling van de oefenmodus zoals in de prototypes.
-- Alleen een nieuwe, lege kolom; gevuld met scripts/vul-casuscategorieen.ts.

-- AlterTable
ALTER TABLE "bibliotheek_casussen" ADD COLUMN     "categorie" TEXT;

