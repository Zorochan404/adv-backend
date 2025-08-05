ALTER TABLE "car_catalog" ALTER COLUMN "features" SET DATA TYPE varchar(1000);--> statement-breakpoint
ALTER TABLE "car" ADD COLUMN "color" varchar(255);--> statement-breakpoint
ALTER TABLE "car" DROP COLUMN "transmission";--> statement-breakpoint
ALTER TABLE "car" DROP COLUMN "fuel";--> statement-breakpoint
ALTER TABLE "car" DROP COLUMN "seats";--> statement-breakpoint
ALTER TABLE "car" DROP COLUMN "isapproved";--> statement-breakpoint
ALTER TABLE "car" DROP COLUMN "ispopular";--> statement-breakpoint
ALTER TABLE "car" DROP COLUMN "mainimg";