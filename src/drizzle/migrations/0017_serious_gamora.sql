ALTER TABLE "bookings" ADD COLUMN "insurance_price" double precision DEFAULT 0;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "payment_status" varchar(50) DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "payment_reference_id" varchar(50);