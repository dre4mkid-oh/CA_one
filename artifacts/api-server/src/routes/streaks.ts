import { Router, type IRouter } from "express";
import { db, streaksTable } from "@workspace/db";
import { GetStreaksResponse, UpdateStreaksResponse } from "@workspace/api-zod";
import { getOrCreateStreak, recalculateStreaks, checkAndSetRestoreMode } from "../lib/streaks";

const router: IRouter = Router();

router.get("/streaks", async (_req, res): Promise<void> => {
  await checkAndSetRestoreMode();
  const streak = await getOrCreateStreak();
  res.json(GetStreaksResponse.parse(streak));
});

router.post("/streaks", async (_req, res): Promise<void> => {
  await checkAndSetRestoreMode();
  await recalculateStreaks();
  const streak = await getOrCreateStreak();
  res.json(UpdateStreaksResponse.parse(streak));
});

export default router;
