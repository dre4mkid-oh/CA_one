import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, dailyTasksTable } from "@workspace/db";
import {
  UpsertDailyTaskBody,
  CompleteDailyTaskParams,
  CompleteDailyTaskBody,
  GetDailyTasksResponse,
  UpsertDailyTaskResponse,
  CompleteDailyTaskResponse,
} from "@workspace/api-zod";
import { recalculateStreaks } from "../lib/streaks";

const router: IRouter = Router();

router.get("/daily-tasks", async (req, res): Promise<void> => {
  const today = typeof req.query.date === "string" && req.query.date
    ? req.query.date
    : new Date().toISOString().split("T")[0];

  const tasks = await db
    .select()
    .from(dailyTasksTable)
    .where(eq(dailyTasksTable.date, today))
    .orderBy(dailyTasksTable.position);

  res.json(GetDailyTasksResponse.parse(tasks));
});

router.post("/daily-tasks", async (req, res): Promise<void> => {
  const parsed = UpsertDailyTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { id, taskText, date, position } = parsed.data;
  const dateStr = new Date(date).toISOString().split("T")[0];

  let task;

  if (id) {
    const [updated] = await db
      .update(dailyTasksTable)
      .set({ taskText, date: dateStr, position })
      .where(eq(dailyTasksTable.id, id))
      .returning();
    task = updated;
  } else {
    const existing = await db
      .select()
      .from(dailyTasksTable)
      .where(and(eq(dailyTasksTable.date, dateStr), eq(dailyTasksTable.position, position)));

    if (existing.length > 0) {
      const [updated] = await db
        .update(dailyTasksTable)
        .set({ taskText })
        .where(eq(dailyTasksTable.id, existing[0].id))
        .returning();
      task = updated;
    } else {
      const [created] = await db
        .insert(dailyTasksTable)
        .values({ taskText, date: dateStr, position, completed: false })
        .returning();
      task = created;
    }
  }

  res.json(UpsertDailyTaskResponse.parse(task));
});

router.post("/daily-tasks/:id/complete", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = CompleteDailyTaskParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = CompleteDailyTaskBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const completedAt = body.data.completed ? new Date() : null;
  const [task] = await db
    .update(dailyTasksTable)
    .set({ completed: body.data.completed, completedAt })
    .where(eq(dailyTasksTable.id, params.data.id))
    .returning();

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  await recalculateStreaks();

  res.json(CompleteDailyTaskResponse.parse(task));
});

export default router;
