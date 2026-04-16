import { pgTable, serial, integer, boolean, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const streaksTable = pgTable("streaks", {
  id: serial("id").primaryKey(),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastCompletedDate: date("last_completed_date"),
  restoreMode: boolean("restore_mode").notNull().default(false),
  restoreProgress: integer("restore_progress").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStreakSchema = createInsertSchema(streaksTable).omit({ id: true });
export type InsertStreak = z.infer<typeof insertStreakSchema>;
export type Streak = typeof streaksTable.$inferSelect;
