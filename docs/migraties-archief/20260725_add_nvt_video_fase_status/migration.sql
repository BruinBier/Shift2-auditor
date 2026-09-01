-- AlterEnum
-- Voeg 'nvt' (niet van toepassing) toe aan VideoFaseStatus.
-- Gebruikt voor video's die niet toegankelijk hoeven te worden (bv. gepubliceerd vóór 23-09-2020).
ALTER TYPE "VideoFaseStatus" ADD VALUE IF NOT EXISTS 'nvt';
