import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, X, Clock, CheckCircle2, XCircle, Loader2, Ban, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  pending: { color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: Clock, label: "Pending" },
  in_progress: { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Loader2, label: "In Progress" },
  completed: { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle2, label: "Completed" },
  failed: { color: "bg-red-500/10 text-red-400 border-red-500/20", icon: XCircle, label: "Failed" },
  cancelled: { color: "bg-gray-500/10 text-gray-400 border-gray-500/20", icon: Ban, label: "Cancelled" },
  paused: { color: "bg-violet-500/10 text-violet-400 border-violet-500/20", icon: Pause, label: "Paused" },
};

export default function Tasks() {
  const utils = trpc.useUtils();
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const { data: tasks, isLoading } = trpc.tasks.list.useQuery(filterStatus ? { status: filterStatus } : undefined);
  const triggerMutation = trpc.tasks.trigger.useMutation({ onSuccess: () => { utils.tasks.list.invalidate(); toast.success("Task triggered"); }, onError: (err) => toast.error(err.message) });
  const pauseMutation = trpc.tasks.pause.useMutation({ onSuccess: () => { utils.tasks.list.invalidate(); toast.success("Task paused"); } });
  const cancelMutation = trpc.tasks.cancel.useMutation({ onSuccess: () => { utils.tasks.list.invalidate(); toast.success("Task cancelled"); } });

  const filters = [
    { label: "All", value: undefined },
    { label: "Pending", value: "pending" },
    { label: "In Progress", value: "in_progress" },
    { label: "Completed", value: "completed" },
    { label: "Failed", value: "failed" },
    { label: "Paused", value: "paused" },
    { label: "Cancelled", value: "cancelled" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Task Queue</h1>
        <p className="text-muted-foreground mt-1">Monitor and manage all review publishing tasks.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <Button key={f.label} variant={filterStatus === f.value ? "default" : "outline"} size="sm" onClick={() => setFilterStatus(f.value)}>
            {f.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-card animate-pulse rounded-lg border border-border" />)}
        </div>
      ) : !tasks?.length ? (
        <Card className="bg-card border-border"><CardContent className="py-12 text-center text-muted-foreground">No tasks found. Create tasks from the "Create Tasks" page.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {tasks.map(task => {
            const config = statusConfig[task.status] || statusConfig.pending;
            const StatusIcon = config.icon;
            return (
              <Card key={task.id} className="bg-card border-border">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={config.color}>
                          <StatusIcon className={`h-3 w-3 mr-1 ${task.status === "in_progress" ? "animate-spin" : ""}`} />
                          {config.label}
                        </Badge>
                        <Badge variant="outline" className={task.reviewType === "positive" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}>
                          {task.reviewType}
                        </Badge>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star key={i} className={`h-3 w-3 ${i <= task.starRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">#{task.id}</span>
                      </div>
                      <p className="text-sm text-foreground/80 line-clamp-2">{task.reviewContent || "No content assigned"}</p>
                      {task.errorMessage && (
                        <p className="text-xs text-red-400">{task.errorMessage}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Account #{task.accountId}</span>
                        <span>Business #{task.businessId}</span>
                        {task.scheduledAt && <span>Scheduled: {new Date(task.scheduledAt).toLocaleString()}</span>}
                        <span>Created: {new Date(task.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {(task.status === "pending" || task.status === "paused" || task.status === "failed") && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-400 hover:text-emerald-300" onClick={() => triggerMutation.mutate({ id: task.id })} title="Trigger">
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      {(task.status === "pending" || task.status === "in_progress") && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-400 hover:text-amber-300" onClick={() => pauseMutation.mutate({ id: task.id })} title="Pause">
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                      {task.status !== "completed" && task.status !== "cancelled" && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { if (confirm("Cancel this task?")) cancelMutation.mutate({ id: task.id }); }} title="Cancel">
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
