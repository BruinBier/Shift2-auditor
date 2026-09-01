-- Video A2-gemeenten: standalone omgeving voor het toegankelijk maken van YouTube-video's.
-- Twee tabellen (videos + video_phases) en drie enums. Per video 5 vaste fasen.
-- Max. 1 fase-timer tegelijk actief in het HELE systeem wordt afgedwongen met een
-- partieel-unieke index op video_phases.timer_started_at.

-- 1. Enums
CREATE TYPE "VideoGemeente" AS ENUM ('cranendonck', 'heeze_leende', 'valkenswaard');
CREATE TYPE "VideoFase" AS ENUM ('voorbereiden', 'ondertiteling', 'audiodescriptie', 'transcript', 'publiceren');
CREATE TYPE "VideoFaseStatus" AS ENUM ('todo', 'bezig', 'klaar');

-- 2. Videos-tabel
CREATE TABLE "videos" (
  "id"         TEXT NOT NULL,
  "gemeente"   "VideoGemeente" NOT NULL,
  "titel"      TEXT NOT NULL,
  "url"        TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "videos_gemeente_idx" ON "videos"("gemeente");

-- 3. Video-fasen-tabel (5 rijen per video)
CREATE TABLE "video_phases" (
  "id"               TEXT NOT NULL,
  "video_id"         TEXT NOT NULL,
  "phase"            "VideoFase" NOT NULL,
  "status"           "VideoFaseStatus" NOT NULL DEFAULT 'todo',
  "seconds"          INTEGER NOT NULL DEFAULT 0,
  "timer_started_at" TIMESTAMP(3),
  "sort_order"       INTEGER NOT NULL DEFAULT 0,
  "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"       TIMESTAMP(3) NOT NULL,

  CONSTRAINT "video_phases_pkey" PRIMARY KEY ("id")
);

-- Eén fase-rij per (video, fase)
CREATE UNIQUE INDEX "video_phases_video_id_phase_key" ON "video_phases"("video_id", "phase");
CREATE INDEX "video_phases_video_id_idx" ON "video_phases"("video_id");

-- HARDE GARANTIE: max. 1 lopende timer in het HELE systeem.
-- Partieel-unieke index: hooguit één rij mag tegelijk een niet-null timer_started_at hebben.
-- (Prisma kan dit niet in het schema uitdrukken; deze index leeft alleen hier.)
CREATE UNIQUE INDEX "video_phases_one_running_timer_idx"
  ON "video_phases"((timer_started_at IS NOT NULL))
  WHERE "timer_started_at" IS NOT NULL;

-- Foreign key
ALTER TABLE "video_phases"
  ADD CONSTRAINT "video_phases_video_id_fkey"
  FOREIGN KEY ("video_id") REFERENCES "videos"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
