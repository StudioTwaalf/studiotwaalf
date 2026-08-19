-- CreateTable
CREATE TABLE "WeddingEvent" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "coupleName" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "photoLimit" INTEGER NOT NULL DEFAULT 20,
    "revealAt" TIMESTAMP(3),
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "welcomeText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeddingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeddingGuest" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "photoCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeddingGuest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeddingPhoto" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "width" INTEGER NOT NULL DEFAULT 0,
    "height" INTEGER NOT NULL DEFAULT 0,
    "sizeBytes" INTEGER NOT NULL DEFAULT 0,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT,

    CONSTRAINT "WeddingPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeddingEvent_slug_key" ON "WeddingEvent"("slug");

-- CreateIndex
CREATE INDEX "WeddingEvent_eventDate_idx" ON "WeddingEvent"("eventDate");

-- CreateIndex
CREATE INDEX "WeddingGuest_eventId_idx" ON "WeddingGuest"("eventId");

-- CreateIndex
CREATE INDEX "WeddingPhoto_eventId_takenAt_idx" ON "WeddingPhoto"("eventId", "takenAt");

-- CreateIndex
CREATE INDEX "WeddingPhoto_guestId_idx" ON "WeddingPhoto"("guestId");

-- CreateIndex
CREATE UNIQUE INDEX "WeddingPhoto_guestId_clientId_key" ON "WeddingPhoto"("guestId", "clientId");

-- AddForeignKey
ALTER TABLE "WeddingGuest" ADD CONSTRAINT "WeddingGuest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "WeddingEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeddingPhoto" ADD CONSTRAINT "WeddingPhoto_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "WeddingEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeddingPhoto" ADD CONSTRAINT "WeddingPhoto_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "WeddingGuest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
