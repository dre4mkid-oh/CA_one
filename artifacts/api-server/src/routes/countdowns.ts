import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, countdownsTable } from "@workspace/db";
import {
  CreateCountdownBody,
  UpdateCountdownParams,
  UpdateCountdownBody,
  DeleteCountdownParams,
  GetCountdownsResponse,
  UpdateCountdownResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/countdowns", async (_req, res): Promise<void> => {
  const countdowns = await db
    .select()
    .from(countdownsTable)
    .orderBy(countdownsTable.createdAt);

  res.json(GetCountdownsResponse.parse(countdowns));
});

router.post("/countdowns", async (req, res): Promise<void> => {
  const parsed = CreateCountdownBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db.select({ id: countdownsTable.id }).from(countdownsTable);
  if (existing.length >= 3) {
    res.status(400).json({ error: "Maximum of 3 custom countdown events allowed." });
    return;
  }

  const [countdown] = await db
    .insert(countdownsTable)
    .values({ label: parsed.data.label, targetDate: new Date(parsed.data.targetDate) })
    .returning();

  res.status(201).json(countdown);
});

router.put("/countdowns/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateCountdownParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateCountdownBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updateValues: { label?: string; targetDate?: Date } = {};
  if (body.data.label !== undefined) updateValues.label = body.data.label;
  if (body.data.targetDate !== undefined) updateValues.targetDate = new Date(body.data.targetDate);

  const [countdown] = await db
    .update(countdownsTable)
    .set(updateValues)
    .where(eq(countdownsTable.id, params.data.id))
    .returning();

  if (!countdown) {
    res.status(404).json({ error: "Countdown not found" });
    return;
  }

  res.json(UpdateCountdownResponse.parse(countdown));
});

router.delete("/countdowns/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteCountdownParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [countdown] = await db
    .delete(countdownsTable)
    .where(eq(countdownsTable.id, params.data.id))
    .returning();

  if (!countdown) {
    res.status(404).json({ error: "Countdown not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
