import { pgTable, serial, text, boolean, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const taskLogTable = pgTable("task_log", {
  id: serial("id").primaryKey(),
  taskName: text("task_name").notNull(),
  date: date("date").notNull(),
  timeStarted: text("time_started"),
  timeEnded: text("time_ended"),
  block1: boolean("block_1").notNull().default(false),
  block2: boolean("block_2").notNull().default(false),
  block3: boolean("block_3").notNull().default(false),
  block4: boolean("block_4").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTaskLogSchema = createInsertSchema(taskLogTable).omit({ id: true, createdAt: true });
export type InsertTaskLog = z.infer<typeof insertTaskLogSchema>;
export type TaskLog = typeof taskLogTable.$inferSelect;
