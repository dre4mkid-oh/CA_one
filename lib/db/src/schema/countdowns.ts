import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const countdownsTable = pgTable("countdowns", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  targetDate: timestamp("target_date", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCountdownSchema = createInsertSchema(countdownsTable).omit({ id: true, createdAt: true });
export type InsertCountdown = z.infer<typeof insertCountdownSchema>;
export type Countdown = typeof countdownsTable.$inferSelect;
