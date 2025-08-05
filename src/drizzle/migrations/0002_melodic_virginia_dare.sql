ALTER TABLE "car" ALTER COLUMN "images" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "car" ADD COLUMN "rcnumber" varchar(255);--> statement-breakpoint
ALTER TABLE "car" ADD COLUMN "rcimg" varchar(255);--> statement-breakpoint
ALTER TABLE "car" ADD COLUMN "pollutionimg" varchar(255);--> statement-breakpoint
ALTER TABLE "car" ADD COLUMN "insuranceimg" varchar(255);