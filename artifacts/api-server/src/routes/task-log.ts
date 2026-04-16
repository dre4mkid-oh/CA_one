import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, taskLogTable } from "@workspace/db";
import {
  CreateTaskLogEntryBody,
  UpdateTaskLogEntryParams,
  UpdateTaskLogEntryBody,
  DeleteTaskLogEntryParams,
  GetTaskLogResponse,
  UpdateTaskLogEntryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/task-log", async (req, res): Promise<void> => {
  const today = typeof req.query.date === "string" && req.query.date
    ? req.query.date
    : new Date().toISOString().split("T")[0];

  const entries = await db
    .select()
    .from(taskLogTable)
    .where(eq(taskLogTable.date, today))
    .orderBy(taskLogTable.createdAt);

  res.json(GetTaskLogResponse.parse(entries));
});

router.post("/task-log", async (req, res): Promise<void> => {
  const parsed = CreateTaskLogEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const dateStr = new Date(parsed.data.date).toISOString().split("T")[0];

  const [entry] = await db
    .insert(taskLogTable)
    .values({ ...parsed.data, date: dateStr })
    .returning();

  res.status(201).json(entry);
});

router.put("/task-log/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateTaskLogEntryParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateTaskLogEntryBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [entry] = await db
    .update(taskLogTable)
    .set(body.data)
    .where(eq(taskLogTable.id, params.data.id))
    .returning();

  if (!entry) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }

  res.json(UpdateTaskLogEntryResponse.parse(entry));
});

router.delete("/task-log/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteTaskLogEntryParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [entry] = await db
    .delete(taskLogTable)
    .where(eq(taskLogTable.id, params.data.id))
    .returning();

  if (!entry) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
