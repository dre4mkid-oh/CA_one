import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dailyTasksRouter from "./daily-tasks";
import taskLogRouter from "./task-log";
import streaksRouter from "./streaks";
import countdownsRouter from "./countdowns";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dailyTasksRouter);
router.use(taskLogRouter);
router.use(streaksRouter);
router.use(countdownsRouter);
router.use(statsRouter);

export default router;
