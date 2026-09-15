-- Handmatig afvinken van "Gespreksverslag gemaakt" in de voorbereidingslijst.
--
-- De stap vinkt zichzelf af zodra er een notitie met auteur "Gespreksverslag" staat.
-- Schrijf je het verslag een keer anders op, dan zet je hem hiermee met de hand aan,
-- zodat de stap je niet ophoudt op een handeling die je al gedaan hebt.
ALTER TABLE "projects" ADD COLUMN "gespreksverslag_gemaakt" TIMESTAMP(3);
