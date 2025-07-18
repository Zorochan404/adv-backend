CREATE TYPE "public"."user_role" AS ENUM('user', 'admin', 'vendor');--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"car_id" integer NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "car" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"maker" varchar(255) NOT NULL,
	"year" integer NOT NULL,
	"price" integer NOT NULL,
	"color" varchar(255) NOT NULL,
	"transmission" varchar(255) NOT NULL,
	"fuel" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"seats" integer NOT NULL,
	"rcnumber" varchar(255),
	"rcimg" varchar(255),
	"pollutionimg" varchar(255),
	"insuranceimg" varchar(255),
	"inmaintainance" boolean DEFAULT false NOT NULL,
	"isavailable" boolean DEFAULT true NOT NULL,
	"images" jsonb NOT NULL,
	"mainimg" varchar(255) NOT NULL,
	"vendorid" integer NOT NULL,
	"parkingid" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parkings" (
	"id" serial PRIMARY KEY NOT NULL,
	"location" varchar(255) NOT NULL,
	"capacity" integer NOT NULL,
	"mainimg" varchar(255) NOT NULL,
	"images" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "review" (
	"id" serial PRIMARY KEY NOT NULL,
	"carid" integer NOT NULL,
	"userid" integer NOT NULL,
	"rating" integer NOT NULL,
	"comment" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user'::"public"."user_role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."user_role" USING "role"::"public"."user_role";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "parkingid" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "vendor_status" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_car_id_car_id_fk" FOREIGN KEY ("car_id") REFERENCES "public"."car"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car" ADD CONSTRAINT "car_vendorid_users_id_fk" FOREIGN KEY ("vendorid") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car" ADD CONSTRAINT "car_parkingid_parkings_id_fk" FOREIGN KEY ("parkingid") REFERENCES "public"."parkings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_carid_car_id_fk" FOREIGN KEY ("carid") REFERENCES "public"."car"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_userid_users_id_fk" FOREIGN KEY ("userid") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_parkingid_parkings_id_fk" FOREIGN KEY ("parkingid") REFERENCES "public"."parkings"("id") ON DELETE cascade ON UPDATE no action;