ALTER TABLE "parkings" RENAME COLUMN "location" TO "locality";--> statement-breakpoint
ALTER TABLE "parkings" ADD COLUMN "city" varchar;--> statement-breakpoint
ALTER TABLE "parkings" ADD COLUMN "state" varchar;--> statement-breakpoint
ALTER TABLE "parkings" ADD COLUMN "country" varchar;--> statement-breakpoint
ALTER TABLE "parkings" ADD COLUMN "pincode" integer;