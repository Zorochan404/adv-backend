"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.advertisementRelations = exports.advertisementTable = exports.adTypeEnum = exports.adStatusEnum = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
const usermodel_1 = require("../user/usermodel");
exports.adStatusEnum = (0, pg_core_1.pgEnum)("ad_status", [
    "active",
    "inactive",
    "pending",
    "expired",
]);
exports.adTypeEnum = (0, pg_core_1.pgEnum)("ad_type", [
    "banner",
    "carousel",
    "popup",
    "sidebar",
]);
exports.advertisementTable = (0, pg_core_1.pgTable)("advertisements", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    title: (0, pg_core_1.varchar)("title", { length: 255 }).notNull(),
    description: (0, pg_core_1.text)("description"),
    imageUrl: (0, pg_core_1.varchar)("image_url", { length: 500 }).notNull(),
    videoUrl: (0, pg_core_1.varchar)("video_url", { length: 500 }),
    linkUrl: (0, pg_core_1.varchar)("link_url", { length: 500 }),
    adType: (0, exports.adTypeEnum)("ad_type").notNull().default("banner"),
    status: (0, exports.adStatusEnum)("status").notNull().default("pending"),
    priority: (0, pg_core_1.integer)("priority").notNull().default(1), // Higher number = higher priority
    startDate: (0, pg_core_1.timestamp)("start_date").notNull(),
    endDate: (0, pg_core_1.timestamp)("end_date").notNull(),
    isActive: (0, pg_core_1.boolean)("is_active").notNull().default(true),
    clickCount: (0, pg_core_1.integer)("click_count").notNull().default(0),
    viewCount: (0, pg_core_1.integer)("view_count").notNull().default(0),
    targetAudience: (0, pg_core_1.varchar)("target_audience", { length: 100 }), // e.g., "all", "premium", "new_users"
    location: (0, pg_core_1.varchar)("location", { length: 100 }), // e.g., "homepage", "search_results", "car_details"
    createdBy: (0, pg_core_1.integer)("created_by").references(() => usermodel_1.UserTable.id, {
        onDelete: "cascade",
    }),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").notNull().defaultNow(),
});
exports.advertisementRelations = (0, drizzle_orm_1.relations)(exports.advertisementTable, ({ one }) => ({
    creator: one(usermodel_1.UserTable, {
        fields: [exports.advertisementTable.createdBy],
        references: [usermodel_1.UserTable.id],
    }),
}));
//# sourceMappingURL=advertisementmodel.js.map