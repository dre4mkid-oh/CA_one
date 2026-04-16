import { Router, type IRouter } from "express";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { db, dailyTasksTable, taskLogTable } from "@workspace/db";
import {
  GetStatsSummaryResponse,
  GetStatsHistoryResponse,
} from "@workspace/api-zod";
import { getOrCreateStreak, checkAndSetRestoreMode } from "../lib/streaks";

const router: IRouter = Router();

router.get("/stats/summary", async (_req, res): Promise<void> => {
  await checkAndSetRestoreMode();
  const streak = await getOrCreateStreak();

  const today = new Date().toISOString().split("T")[0];
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  const weekStartStr = weekStart.toISOString().split("T")[0];

  const monthStart = new Date();
  monthStart.setDate(monthStart.getDate() - 29);
  const monthStartStr = monthStart.toISOString().split("T")[0];

  const allTasks = await db.select().from(dailyTasksTable);

  const getCompletedDays = (tasks: typeof allTasks, fromDate: string, toDate: string): number => {
    const dateMap = new Map<string, { total: number; completed: number }>();
    for (const task of tasks) {
      if (task.date >= fromDate && task.date <= toDate) {
        const existing = dateMap.get(task.date) ?? { total: 0, completed: 0 };
        dateMap.set(task.date, {
          total: existing.total + 1,
          completed: existing.completed + (task.completed ? 1 : 0),
        });
      }
    }
    let completedDays = 0;
    for (const [, val] of dateMap) {
      if (val.total >= 3 && val.completed >= val.total) completedDays++;
    }
    return completedDays;
  };

  const totalDaysCompleted = getCompletedDays(allTasks, "2020-01-01", today);
  const weekCompletedDays = getCompletedDays(allTasks, weekStartStr, today);
  const monthCompletedDays = getCompletedDays(allTasks, monthStartStr, today);

  const taskLogCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(taskLogTable);

  const summary = {
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    totalDaysCompleted,
    weeklyCompletionRate: weekCompletedDays / 7,
    monthlyCompletionRate: monthCompletedDays / 30,
    totalTaskLogEntries: Number(taskLogCount[0]?.count ?? 0),
    restoreMode: streak.restoreMode,
    restoreProgress: streak.restoreProgress,
  };

  res.json(GetStatsSummaryResponse.parse(summary));
});

router.get("/stats/history", async (req, res): Promise<void> => {
  const now = new Date();
  const year = req.query.year ? parseInt(req.query.year as string, 10) : now.getFullYear();
  const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;

  let fromDate: string;
  let toDate: string;

  if (month) {
    fromDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    toDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  } else {
    fromDate = `${year}-01-01`;
    toDate = `${year}-12-31`;
  }

  const tasks = await db
    .select()
    .from(dailyTasksTable)
    .where(and(gte(dailyTasksTable.date, fromDate), lte(dailyTasksTable.date, toDate)));

  const dateMap = new Map<string, { total: number; completed: number }>();
  for (const task of tasks) {
    const existing = dateMap.get(task.date) ?? { total: 0, completed: 0 };
    dateMap.set(task.date, {
      total: existing.total + 1,
      completed: existing.completed + (task.completed ? 1 : 0),
    });
  }

  const history = Array.from(dateMap.entries()).map(([date, val]) => ({
    date,
    completed: val.total >= 3 && val.completed >= val.total,
    tasksCompleted: val.completed,
  }));

  history.sort((a, b) => a.date.localeCompare(b.date));

  res.json(GetStatsHistoryResponse.parse(history));
});

export default router;
