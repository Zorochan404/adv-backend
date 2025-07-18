ALTER TABLE "parkings" ADD COLUMN "name" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "parkings" ADD COLUMN "lat" double precision NOT NULL;--> statement-breakpoint
ALTER TABLE "parkings" ADD COLUMN "lng" double precision NOT NULL;--> statement-breakpoint
ALTER TABLE "parkings" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "lat" double precision;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "lng" double precision;