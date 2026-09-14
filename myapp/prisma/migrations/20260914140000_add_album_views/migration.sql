-- Hoe vaak het album bekeken is
ALTER TABLE "WeddingEvent" ADD COLUMN "albumViews" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "WeddingEvent" ADD COLUMN "albumVisitors" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "WeddingEvent" ADD COLUMN "albumLastViewAt" TIMESTAMP(3);
