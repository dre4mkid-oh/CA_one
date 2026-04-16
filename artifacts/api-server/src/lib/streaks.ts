import { db, dailyTasksTable, streaksTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { logger } from "./logger";

function getLocalDateStr(): string {
  return new Date().toISOString().split("T")[0];
}

function daysBetween(d1: string, d2: string): number {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  const diffMs = date2.getTime() - date1.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export async function getOrCreateStreak() {
  const existing = await db.select().from(streaksTable).limit(1);
  if (existing.length > 0) return existing[0];

  const [created] = await db.insert(streaksTable).values({
    currentStreak: 0,
    longestStreak: 0,
    lastCompletedDate: null,
    restoreMode: false,
    restoreProgress: 0,
  }).returning();

  return created;
}

export async function recalculateStreaks(): Promise<void> {
  const today = getLocalDateStr();
  const streak = await getOrCreateStreak();

  const todaysTasks = await db
    .select()
    .from(dailyTasksTable)
    .where(eq(dailyTasksTable.date, today));

  const completedCount = todaysTasks.filter(t => t.completed).length;

  if (streak.restoreMode) {
    const newProgress = completedCount;
    const requiredForRestore = 6;

    if (newProgress >= requiredForRestore) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      const newCurrent = streak.lastCompletedDate
        ? (daysBetween(streak.lastCompletedDate, today) === 1 ? streak.currentStreak + 1 : 1)
        : 1;

      await db.update(streaksTable).set({
        currentStreak: newCurrent,
        longestStreak: Math.max(streak.longestStreak, newCurrent),
        lastCompletedDate: today,
        restoreMode: false,
        restoreProgress: 0,
        updatedAt: new Date(),
      }).where(eq(streaksTable.id, streak.id));
    } else {
      await db.update(streaksTable).set({
        restoreProgress: newProgress,
        updatedAt: new Date(),
      }).where(eq(streaksTable.id, streak.id));
    }
    return;
  }

  const totalTasks = todaysTasks.length;
  const allCompleted = totalTasks >= 3 && todaysTasks.every(t => t.completed);

  if (!allCompleted) {
    return;
  }

  if (streak.lastCompletedDate === today) {
    return;
  }

  let newCurrent: number;
  if (!streak.lastCompletedDate) {
    newCurrent = 1;
  } else {
    const diff = daysBetween(streak.lastCompletedDate, today);
    if (diff === 1) {
      newCurrent = streak.currentStreak + 1;
    } else if (diff > 1) {
      newCurrent = 1;
    } else {
      newCurrent = streak.currentStreak;
    }
  }

  await db.update(streaksTable).set({
    currentStreak: newCurrent,
    longestStreak: Math.max(streak.longestStreak, newCurrent),
    lastCompletedDate: today,
    restoreMode: false,
    restoreProgress: 0,
    updatedAt: new Date(),
  }).where(eq(streaksTable.id, streak.id));

  logger.info({ newCurrent }, "Streak recalculated");
}

export async function checkAndSetRestoreMode(): Promise<void> {
  const today = getLocalDateStr();
  const streak = await getOrCreateStreak();

  if (!streak.lastCompletedDate || streak.lastCompletedDate === today || streak.restoreMode) {
    return;
  }

  const diff = daysBetween(streak.lastCompletedDate, today);

  if (diff === 2) {
    logger.info({ lastCompleted: streak.lastCompletedDate }, "Entering restore mode");
    await db.update(streaksTable).set({
      restoreMode: true,
      restoreProgress: 0,
      updatedAt: new Date(),
    }).where(eq(streaksTable.id, streak.id));
  } else if (diff > 2) {
    logger.info({ lastCompleted: streak.lastCompletedDate }, "Streak reset (missed more than 1 day)");
    await db.update(streaksTable).set({
      currentStreak: 0,
      restoreMode: false,
      restoreProgress: 0,
      updatedAt: new Date(),
    }).where(eq(streaksTable.id, streak.id));
  }
}
