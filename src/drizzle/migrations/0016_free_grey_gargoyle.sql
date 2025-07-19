ALTER TABLE "bookings" ADD COLUMN "price" double precision;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "total_price" double precision;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "extension_price" double precision;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "extention_till" timestamp;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "extention_time" integer;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "pickup_parking_id" integer;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "dropoff_parking_id" integer;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_pickup_parking_id_parkings_id_fk" FOREIGN KEY ("pickup_parking_id") REFERENCES "public"."parkings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_dropoff_parking_id_parkings_id_fk" FOREIGN KEY ("dropoff_parking_id") REFERENCES "public"."parkings"("id") ON DELETE cascade ON UPDATE no action;