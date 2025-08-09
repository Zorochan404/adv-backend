"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewRelations = exports.reviewModel = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const usermodel_1 = require("../user/usermodel");
const drizzle_orm_1 = require("drizzle-orm");
exports.reviewModel = (0, pg_core_1.pgTable)("review", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    carid: (0, pg_core_1.integer)("carid").notNull(),
    userid: (0, pg_core_1.integer)("userid").notNull().references(() => usermodel_1.UserTable.id, { onDelete: "cascade" }),
    rating: (0, pg_core_1.integer)("rating"),
    comment: (0, pg_core_1.varchar)("comment"),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").notNull().defaultNow(),
});
// Note: The relation to car is defined in the car model to avoid circular imports
exports.reviewRelations = (0, drizzle_orm_1.relations)(exports.reviewModel, ({ one }) => ({
    user: one(usermodel_1.UserTable, {
        fields: [exports.reviewModel.userid],
        references: [usermodel_1.UserTable.id],
    }),
}));
//# sourceMappingURL=reviewmodel.js.map