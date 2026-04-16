import { useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2, Clock, AlarmClock, BedDouble } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetCountdowns,
  getGetCountdownsQueryKey,
  useCreateCountdown,
  useUpdateCountdown,
  useDeleteCountdown,
  type Countdown,
} from "@workspace/api-client-react";

import { useCountdown, useClock } from "@/hooks/use-timer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const MAX_CUSTOM_COUNTDOWNS = 3;

interface CustomCountdownCardProps {
  countdown: Countdown;
  index: number;
  onDelete: () => void;
  onUpdate: (data: { label?: string; targetDate?: string }) => void;
}

export default function CountdownPage() {
  const queryClient = useQueryClient();
  const time = useClock();

  const { data: countdowns } = useGetCountdowns({
    query: { queryKey: getGetCountdownsQueryKey() },
  });

  const createCd = useCreateCountdown();
  const updateCd = useUpdateCountdown();
  const deleteCd = useDeleteCountdown();

  // Fixed timers calculation
  const getNextOccurrence = (hour: number, minute: number) => {
    const now = new Date();
    const target = new Date(now);
    target.setHours(hour, minute, 0, 0);
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }
    return target;
  };

  const powerDownTarget = getNextOccurrence(23, 11); // 11:11 PM
  const wakeUpTarget = getNextOccurrence(8, 0); // 8:00 AM

  const powerDownTime = useCountdown(powerDownTarget);
  const wakeUpTime = useCountdown(wakeUpTarget);

  const [newLabel, setNewLabel] = useState("");
  const [newDate, setNewDate] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreate = () => {
    if (!newLabel || !newDate) return;
    createCd.mutate(
      { data: { label: newLabel, targetDate: new Date(newDate).toISOString() } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCountdownsQueryKey() });
          setDialogOpen(false);
          setNewLabel("");
          setNewDate("");
        },
      }
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-theme-4 flex items-center justify-center blob-2 shadow-sm">
          <Clock className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-3xl font-black">Time Check</h2>
      </div>

      {/* Fixed Timers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-theme-1/10 border-theme-1/20 overflow-hidden shadow-sm relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <BedDouble className="w-24 h-24" />
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-theme-1">
              <BedDouble className="w-5 h-5" /> Power Down (11:11 PM)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2 font-mono font-black text-5xl text-theme-1 tracking-tight">
              {String(powerDownTime.hours).padStart(2, "0")}:
              {String(powerDownTime.minutes).padStart(2, "0")}:
              {String(powerDownTime.seconds).padStart(2, "0")}
            </div>
            <p className="text-sm font-medium text-theme-1/80 mt-2">remaining today</p>
          </CardContent>
        </Card>

        <Card className="bg-theme-2/10 border-theme-2/20 overflow-hidden shadow-sm relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <AlarmClock className="w-24 h-24" />
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-theme-2">
              <AlarmClock className="w-5 h-5" /> Wake Up (8:00 AM)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2 font-mono font-black text-5xl text-theme-2 tracking-tight">
              {String(wakeUpTime.hours).padStart(2, "0")}:
              {String(wakeUpTime.minutes).padStart(2, "0")}:
              {String(wakeUpTime.seconds).padStart(2, "0")}
            </div>
            <p className="text-sm font-medium text-theme-2/80 mt-2">until tomorrow starts</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between mt-12 mb-6">
        <h3 className="text-2xl font-bold">Custom Events</h3>
        {(countdowns?.length ?? 0) < MAX_CUSTOM_COUNTDOWNS && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full shadow-md bg-primary text-primary-foreground hover:scale-105 transition-transform">
              <Plus className="w-4 h-4 mr-2" /> Add Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Countdown</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Event Name</label>
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g., Vacation, Product Launch..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Date & Time</label>
                <Input
                  type="datetime-local"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={!newLabel || !newDate}>
                Create Countdown
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {countdowns?.map((cd, index) => (
          <CustomCountdownCard
            key={cd.id}
            countdown={cd}
            index={index}
            onDelete={() => {
              deleteCd.mutate(
                { id: cd.id },
                {
                  onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCountdownsQueryKey() }),
                }
              );
            }}
            onUpdate={(data) => {
              updateCd.mutate(
                { id: cd.id, data },
                {
                  onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCountdownsQueryKey() }),
                }
              );
            }}
          />
        ))}
        {countdowns?.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl bg-card">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No custom countdowns yet.</p>
            <Button variant="link" onClick={() => setDialogOpen(true)} className="mt-2 text-primary">
              Add your first event
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function CustomCountdownCard({ countdown, index, onDelete, onUpdate }: CustomCountdownCardProps) {
  const timeLeft = useCountdown(countdown.targetDate);
  const isPast = timeLeft.total <= 0;

  const colors = ["bg-theme-1/10", "bg-theme-3/10", "bg-theme-4/10"];
  const textColors = ["text-theme-1", "text-theme-3", "text-theme-4"];
  const colorIdx = index % 3;

  return (
    <Card className={`${colors[colorIdx]} border-border shadow-sm flex flex-col`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex justify-between items-start">
          <Input
            value={countdown.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            className={`font-bold bg-transparent border-transparent px-0 h-auto text-lg focus-visible:ring-0 shadow-none ${textColors[colorIdx]}`}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </CardTitle>
        <p className="text-xs text-muted-foreground font-medium">
          {format(new Date(countdown.targetDate), "PPP 'at' p")}
        </p>
      </CardHeader>
      <CardContent className="mt-auto pt-4">
        {isPast ? (
          <div className="font-bold text-2xl text-muted-foreground">Event Passed</div>
        ) : (
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-background/50 p-2 rounded-xl border border-border/50">
              <div className={`font-black text-2xl font-mono ${textColors[colorIdx]}`}>
                {timeLeft.days}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">Days</div>
            </div>
            <div className="bg-background/50 p-2 rounded-xl border border-border/50">
              <div className={`font-black text-2xl font-mono ${textColors[colorIdx]}`}>
                {String(timeLeft.hours).padStart(2, "0")}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">Hrs</div>
            </div>
            <div className="bg-background/50 p-2 rounded-xl border border-border/50">
              <div className={`font-black text-2xl font-mono ${textColors[colorIdx]}`}>
                {String(timeLeft.minutes).padStart(2, "0")}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">Min</div>
            </div>
            <div className="bg-background/50 p-2 rounded-xl border border-border/50">
              <div className={`font-black text-2xl font-mono ${textColors[colorIdx]}`}>
                {String(timeLeft.seconds).padStart(2, "0")}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">Sec</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
