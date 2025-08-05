CREATE TYPE "public"."car_status" AS ENUM('available', 'booked', 'maintenance', 'unavailable');--> statement-breakpoint
CREATE TYPE "public"."fuel_type" AS ENUM('petrol', 'diesel', 'electric', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."transmission" AS ENUM('manual', 'automatic');--> statement-breakpoint
CREATE TABLE "car_catalog" (
	"id" serial PRIMARY KEY NOT NULL,
	"car_name" varchar(255) NOT NULL,
	"car_maker" varchar(255) NOT NULL,
	"car_model_year" integer NOT NULL,
	"car_vendor_price" numeric(10, 2) NOT NULL,
	"car_platform_price" numeric(10, 2) NOT NULL,
	"transmission" "transmission" DEFAULT 'manual' NOT NULL,
	"fuel_type" "fuel_type" DEFAULT 'petrol' NOT NULL,
	"seats" integer DEFAULT 5 NOT NULL,
	"engine_capacity" varchar(50),
	"mileage" varchar(50),
	"features" text,
	"image_url" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"category" varchar(100) DEFAULT 'sedan',
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "car" DROP CONSTRAINT "car_parkingid_parkings_id_fk";
--> statement-breakpoint
ALTER TABLE "car" ALTER COLUMN "transmission" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "car" ALTER COLUMN "transmission" SET DEFAULT 'manual';--> statement-breakpoint
ALTER TABLE "car" ALTER COLUMN "fuel" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "car" ALTER COLUMN "fuel" SET DEFAULT 'petrol';--> statement-breakpoint
ALTER TABLE "car" ALTER COLUMN "seats" SET DEFAULT 5;--> statement-breakpoint
ALTER TABLE "car" ALTER COLUMN "images" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "car" ALTER COLUMN "parkingid" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "car" ADD COLUMN "number" varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE "car" ADD COLUMN "discountprice" integer;--> statement-breakpoint
ALTER TABLE "car" ADD COLUMN "catalog_id" integer;--> statement-breakpoint
ALTER TABLE "car" ADD COLUMN "status" "car_status" DEFAULT 'available' NOT NULL;--> statement-breakpoint
ALTER TABLE "car_catalog" ADD CONSTRAINT "car_catalog_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car" ADD CONSTRAINT "car_catalog_id_car_catalog_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."car_catalog"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car" ADD CONSTRAINT "car_parkingid_parkings_id_fk" FOREIGN KEY ("parkingid") REFERENCES "public"."parkings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car" DROP COLUMN "maker";--> statement-breakpoint
ALTER TABLE "car" DROP COLUMN "year";--> statement-breakpoint
ALTER TABLE "car" DROP COLUMN "carnumber";--> statement-breakpoint
ALTER TABLE "car" DROP COLUMN "discountedprice";--> statement-breakpoint
ALTER TABLE "car" DROP COLUMN "color";--> statement-breakpoint
ALTER TABLE "car" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "car" DROP COLUMN "rcnumber";--> statement-breakpoint
ALTER TABLE "car" DROP COLUMN "rcimg";--> statement-breakpoint
ALTER TABLE "car" DROP COLUMN "pollutionimg";--> statement-breakpoint
ALTER TABLE "car" DROP COLUMN "insuranceimg";--> statement-breakpoint
ALTER TABLE "car" DROP COLUMN "isapproved";--> statement-breakpoint
ALTER TABLE "car" DROP COLUMN "ispopular";--> statement-breakpoint
ALTER TABLE "car" DROP COLUMN "insuranceprice";--> statement-breakpoint
ALTER TABLE "car" ADD CONSTRAINT "car_number_unique" UNIQUE("number");