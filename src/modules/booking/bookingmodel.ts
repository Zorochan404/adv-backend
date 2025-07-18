import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { UserTable } from "../user/usermodel";
import { carModel } from "../car/carmodel";

export const bookings = pgTable("bookings", {
    id: serial("id").primaryKey(),
  
    // Foreign key to users
    userId: integer("user_id")
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
  
    // Foreign key to cars
    carId: integer("car_id")
      .notNull()
      .references(() => carModel.id, { onDelete: "cascade" }),
  
    // Booking details
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    status: varchar("status", { length: 50 }).default("pending"),
  
    createdAt: timestamp("created_at").defaultNow(),
  });