import { useMemo } from "react";
import { format, subDays, startOfDay, isSameDay } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Flame, Trophy, Calendar as CalendarIcon, CheckCircle2, XCircle } from "lucide-react";
import {
  useGetStatsSummary,
  getGetStatsSummaryQueryKey,
  useGetStatsHistory,
  getGetStatsHistoryQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function Stats() {
  const { data: summary, isLoading: summaryLoading } = useGetStatsSummary({
    query: { queryKey: getGetStatsSummaryQueryKey() },
  });

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  const { data: history, isLoading: historyLoading } = useGetStatsHistory(
    { month: currentMonth, year: currentYear },
    { query: { queryKey: getGetStatsHistoryQueryKey({ month: currentMonth, year: currentYear }) } }
  );

  const past90Days = useMemo(() => {
    const days = [];
    for (let i = 89; i >= 0; i--) {
      days.push(subDays(startOfDay(today), i));
    }
    return days;
  }, [today]);

  const historyMap = useMemo(() => {
    if (!history) return new Map();
    const map = new Map();
    history.forEach((h) => map.set(h.date, h));
    return map;
  }, [history]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-theme-2 flex items-center justify-center blob-2 shadow-sm">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-3xl font-black">Your Progress</h2>
      </div>

      {summary?.restoreMode && (
        <Card className="bg-theme-4/10 border-theme-4/30">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-theme-4/20 flex items-center justify-center shrink-0">
                <Flame className="w-8 h-8 text-theme-4" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold text-theme-4 mb-2">Restore Mode Active</h3>
                <p className="text-muted-foreground mb-4">
                  You lost your streak, but you can get it back! Complete all 3 tasks for {6 - summary.restoreProgress} more days.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold text-theme-4">
                    <span>Progress</span>
                    <span>{summary.restoreProgress} / 6 days</span>
                  </div>
                  <Progress value={(summary.restoreProgress / 6) * 100} className="h-3 bg-theme-4/20" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Current Streak"
          value={summary?.currentStreak || 0}
          unit="days"
          icon={<Flame className="w-5 h-5 text-theme-1" />}
          colorClass="text-theme-1"
          bgClass="bg-theme-1/10"
        />
        <StatCard
          title="Longest Streak"
          value={summary?.longestStreak || 0}
          unit="days"
          icon={<Trophy className="w-5 h-5 text-theme-2" />}
          colorClass="text-theme-2"
          bgClass="bg-theme-2/10"
        />
        <StatCard
          title="Weekly Completion"
          value={Math.round((summary?.weeklyCompletionRate || 0) * 7)}
          unit="/ 7"
          icon={<CheckCircle2 className="w-5 h-5 text-theme-3" />}
          colorClass="text-theme-3"
          bgClass="bg-theme-3/10"
          subtitle={`${Math.round((summary?.weeklyCompletionRate || 0) * 100)}%`}
        />
        <StatCard
          title="Monthly Completion"
          value={Math.round((summary?.monthlyCompletionRate || 0) * 30)}
          unit="/ 30"
          icon={<CalendarIcon className="w-5 h-5 text-theme-4" />}
          colorClass="text-theme-4"
          bgClass="bg-theme-4/10"
          subtitle={`${Math.round((summary?.monthlyCompletionRate || 0) * 100)}%`}
        />
      </div>

      <Card className="border-border shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            Consistency Map (Past 90 Days)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="flex flex-wrap gap-1.5 justify-end">
              {past90Days.map((date, i) => {
                const dateStr = format(date, "yyyy-MM-dd");
                const dayData = historyMap.get(dateStr);
                const isToday = isSameDay(date, today);

                let bgClass = "bg-muted hover:bg-muted/80";
                if (dayData?.completed) {
                  bgClass = "bg-theme-3 hover:bg-theme-3/80 shadow-sm";
                } else if (dayData && dayData.tasksCompleted > 0) {
                  bgClass = "bg-theme-3/40 hover:bg-theme-3/60";
                }

                return (
                  <div
                    key={dateStr}
                    title={`${format(date, "MMM d, yyyy")}: ${dayData?.tasksCompleted || 0} tasks`}
                    className={`w-4 h-4 rounded-sm transition-colors ${bgClass} ${
                      isToday ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
                    }`}
                  />
                );
              })}
            </div>
            <div className="flex justify-end items-center gap-2 mt-4 text-xs text-muted-foreground font-medium">
              <span>Less</span>
              <div className="w-3 h-3 rounded-sm bg-muted" />
              <div className="w-3 h-3 rounded-sm bg-theme-3/40" />
              <div className="w-3 h-3 rounded-sm bg-theme-3" />
              <span>More</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, unit, icon, colorClass, bgClass, subtitle }: any) {
  return (
    <Card className="overflow-hidden border-border shadow-sm hover:shadow-md transition-all">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-muted-foreground">{title}</h3>
          <div className={`p-2 rounded-xl ${bgClass} blob-1`}>{icon}</div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-4xl font-black ${colorClass}`}>{value}</span>
          <span className="text-muted-foreground font-medium">{unit}</span>
        </div>
        {subtitle && <p className="text-sm text-muted-foreground mt-2 font-medium">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
