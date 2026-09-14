-- Extra ontvangers van de albummail die geen gast zijn
ALTER TABLE "WeddingEvent" ADD COLUMN "extraEmails" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
