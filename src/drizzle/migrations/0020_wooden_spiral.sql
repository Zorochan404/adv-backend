ALTER TABLE "car" DROP CONSTRAINT "car_parkingid_parkings_id_fk";
--> statement-breakpoint
ALTER TABLE "car" ADD CONSTRAINT "car_parkingid_parkings_id_fk" FOREIGN KEY ("parkingid") REFERENCES "public"."parkings"("id") ON DELETE no action ON UPDATE no action;