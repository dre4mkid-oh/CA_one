import { pgTable, serial, text, boolean, date, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const dailyTasksTable = pgTable("daily_tasks", {
  id: serial("id").primaryKey(),
  taskText: text("task_text").notNull(),
  date: date("date").notNull(),
  completed: boolean("completed").notNull().default(false),
  position: integer("position").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDailyTaskSchema = createInsertSchema(dailyTasksTable).omit({ id: true, createdAt: true });
export type InsertDailyTask = z.infer<typeof insertDailyTaskSchema>;
export type DailyTask = typeof dailyTasksTable.$inferSelect;
