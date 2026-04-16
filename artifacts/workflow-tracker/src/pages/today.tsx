import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Check, Flame, Plus, Trash2, Trophy, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetDailyTasks,
  getGetDailyTasksQueryKey,
  useUpsertDailyTask,
  useCompleteDailyTask,
  useGetStreaks,
  getGetStreaksQueryKey,
  useUpdateStreaks,
  useGetTaskLog,
  getGetTaskLogQueryKey,
  useCreateTaskLogEntry,
  useUpdateTaskLogEntry,
  useDeleteTaskLogEntry,
  DailyTask,
  TaskLogEntry,
} from "@workspace/api-client-react";
import { useClock } from "@/hooks/use-timer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function Today() {
  const queryClient = useQueryClient();
  const time = useClock();
  const today = format(time, "yyyy-MM-dd");

  const { data: tasks, isLoading: tasksLoading } = useGetDailyTasks(
    { date: today },
    { query: { queryKey: getGetDailyTasksQueryKey({ date: today }) } }
  );
  const { data: streak, isLoading: streakLoading } = useGetStreaks({
    query: { queryKey: getGetStreaksQueryKey() },
  });
  const { data: logEntries, isLoading: logLoading } = useGetTaskLog(
    { date: today },
    { query: { queryKey: getGetTaskLogQueryKey({ date: today }) } }
  );

  const upsertTask = useUpsertDailyTask();
  const completeTask = useCompleteDailyTask();
  const updateStreaks = useUpdateStreaks();
  const createLog = useCreateTaskLogEntry();
  const updateLog = useUpdateTaskLogEntry();
  const deleteLog = useDeleteTaskLogEntry();

  const allCompleted = tasks?.length === 3 && tasks.every((t) => t.completed);

  // Auto-fill empty tasks if missing — run only once per date when data first loads
  const initializedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!tasksLoading && tasks && initializedRef.current !== today) {
      const positions = [1, 2, 3];
      const missing = positions.filter((p) => !tasks.find((t) => t.position === p));
      if (missing.length > 0) {
        initializedRef.current = today;
        missing.forEach((p) => {
          upsertTask.mutate(
            { data: { taskText: "", position: p, date: today } },
            {
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: getGetDailyTasksQueryKey({ date: today }) });
              },
            }
          );
        });
      } else {
        initializedRef.current = today;
      }
    }
  }, [tasksLoading, tasks, today]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTaskTextChange = (position: number, id: number | null | undefined, text: string) => {
    upsertTask.mutate(
      { data: { taskText: text, position, date: today, id } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetDailyTasksQueryKey({ date: today }) });
        },
      }
    );
  };

  const handleToggleTask = (id: number, completed: boolean) => {
    completeTask.mutate(
      { id, data: { completed } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetDailyTasksQueryKey({ date: today }) });
          updateStreaks.mutate(undefined, {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: getGetStreaksQueryKey() });
            },
          });
        },
      }
    );
  };

  const handleAddLog = () => {
    const now = format(new Date(), "HH:mm");
    createLog.mutate(
      {
        data: {
          taskName: "",
          date: today,
          timeStarted: now,
          timeEnded: null,
          block1: true,
          block2: false,
          block3: false,
          block4: false,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTaskLogQueryKey({ date: today }) });
        },
      }
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tight">{format(time, "EEEE, MMMM d")}</h2>
          <p className="text-xl text-muted-foreground font-mono mt-1 font-bold">
            {format(time, "hh:mm:ss a")}
          </p>
        </div>

        {/* Streak Badge */}
        {!streakLoading && streak && (
          <div className="bg-theme-1/10 text-theme-1 px-4 py-2 rounded-2xl flex items-center gap-2 border border-theme-1/20 shadow-sm">
            <Flame className="w-5 h-5" />
            <span className="font-bold text-lg">{streak.currentStreak} day streak</span>
          </div>
        )}
      </div>

      {/* Restore Mode Banner */}
      {streak?.restoreMode && (
        <div className="bg-theme-4/20 border-l-4 border-theme-4 p-4 rounded-r-xl shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-theme-4" />
            <h3 className="font-bold text-lg text-theme-4">Restore Your Streak!</h3>
          </div>
          <p className="text-sm text-theme-4/80 mb-3">
            Complete {6 - streak.restoreProgress} more tasks to restore your longest streak.
          </p>
          <Progress value={(streak.restoreProgress / 6) * 100} className="h-2 bg-theme-4/20" />
        </div>
      )}

      {/* Daily Tasks */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <span>Non-Negotiables</span>
          {allCompleted && (
            <span className="bg-theme-3/20 text-theme-3 text-xs px-2 py-1 rounded-full animate-bounce">
              Done! 🎉
            </span>
          )}
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((pos) => {
            const task = tasks?.find((t) => t.position === pos);
            return (
              <Card
                key={pos}
                className={`transition-all duration-300 border-2 overflow-hidden ${
                  task?.completed
                    ? "border-theme-3/50 bg-theme-3/5 opacity-70"
                    : "border-border hover:border-primary/50 shadow-sm hover:shadow-md"
                }`}
              >
                <CardContent className="p-0 flex items-stretch">
                  <div
                    className={`w-3 ${
                      task?.completed ? "bg-theme-3" : `bg-theme-${pos === 1 ? 1 : pos === 2 ? 2 : 4}`
                    }`}
                  />
                  <div className="flex-1 p-4 flex items-center gap-4">
                    <button
                      onClick={() => task && handleToggleTask(task.id, !task.completed)}
                      disabled={!task || !task.taskText}
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                        task?.completed
                          ? "bg-theme-3 border-theme-3 text-white scale-110"
                          : "border-muted-foreground/30 hover:border-primary"
                      }`}
                    >
                      {task?.completed && <Check className="w-5 h-5" />}
                    </button>
                    <div className="flex-1">
                      <Input
                        value={task?.taskText || ""}
                        onChange={(e) => handleTaskTextChange(pos, task?.id, e.target.value)}
                        placeholder={`Task ${pos}`}
                        className={`border-0 border-b rounded-none shadow-none px-0 h-10 text-lg focus-visible:ring-0 ${
                          task?.completed ? "line-through text-muted-foreground bg-transparent" : "bg-transparent"
                        }`}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Task Log */}
      <section className="space-y-4 pt-8">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">Task Log</h3>
          <Button onClick={handleAddLog} size="sm" className="rounded-full rounded-tr-sm blob-2">
            <Plus className="w-4 h-4 mr-2" /> Add Entry
          </Button>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold w-16">ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Task Name</th>
                  <th className="px-4 py-3 text-left font-semibold w-28">Start</th>
                  <th className="px-4 py-3 text-left font-semibold w-28">End</th>
                  <th className="px-4 py-3 text-center font-semibold w-32">Block</th>
                  <th className="px-4 py-3 text-right font-semibold w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                    </td>
                  </tr>
                ) : logEntries?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No entries yet today. Start working!
                    </td>
                  </tr>
                ) : (
                  logEntries?.map((log, index) => (
                    <LogEntryRow
                      key={log.id}
                      log={log}
                      index={index}
                      onUpdate={(data) => {
                        updateLog.mutate(
                          { id: log.id, data },
                          {
                            onSuccess: () => {
                              queryClient.setQueryData(getGetTaskLogQueryKey({ date: today }), (old: any) =>
                                old?.map((l: any) => (l.id === log.id ? { ...l, ...data } : l))
                              );
                            },
                          }
                        );
                      }}
                      onDelete={() => {
                        deleteLog.mutate(
                          { id: log.id },
                          {
                            onSuccess: () => {
                              queryClient.invalidateQueries({ queryKey: getGetTaskLogQueryKey({ date: today }) });
                            },
                          }
                        );
                      }}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function LogEntryRow({
  log,
  index,
  onUpdate,
  onDelete,
}: {
  log: TaskLogEntry;
  index: number;
  onUpdate: (data: any) => void;
  onDelete: () => void;
}) {
  return (
    <tr className="hover:bg-muted/20 transition-colors group">
      <td className="px-4 py-2 text-muted-foreground font-mono">#{index + 1}</td>
      <td className="px-4 py-2">
        <Input
          value={log.taskName || ""}
          onChange={(e) => onUpdate({ taskName: e.target.value })}
          placeholder="What are you working on?"
          className="h-8 bg-transparent border-transparent hover:border-border focus:border-primary shadow-none"
        />
      </td>
      <td className="px-4 py-2">
        <Input
          type="time"
          value={log.timeStarted || ""}
          onChange={(e) => onUpdate({ timeStarted: e.target.value })}
          className="h-8 bg-transparent border-transparent hover:border-border focus:border-primary shadow-none"
        />
      </td>
      <td className="px-4 py-2">
        <Input
          type="time"
          value={log.timeEnded || ""}
          onChange={(e) => onUpdate({ timeEnded: e.target.value })}
          className="h-8 bg-transparent border-transparent hover:border-border focus:border-primary shadow-none"
        />
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center justify-center gap-2 bg-muted/30 p-1 rounded-lg">
          {[1, 2, 3, 4].map((blockNum) => {
            const field = `block${blockNum}` as keyof TaskLogEntry;
            const isSelected = log[field];
            return (
              <button
                key={blockNum}
                onClick={() => {
                  onUpdate({
                    block1: blockNum === 1,
                    block2: blockNum === 2,
                    block3: blockNum === 3,
                    block4: blockNum === 4,
                  });
                }}
                className={`w-6 h-6 rounded flex items-center justify-center transition-all ${
                  isSelected ? "bg-theme-1 text-white font-bold" : "hover:bg-muted text-muted-foreground text-xs"
                }`}
              >
                {blockNum}
              </button>
            );
          })}
        </div>
      </td>
      <td className="px-4 py-2 text-right">
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </td>
    </tr>
  );
}
