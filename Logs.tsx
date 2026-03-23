import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollText, CheckCircle2, XCircle, SkipForward, Star, Clock } from "lucide-react";

const logStatusConfig: Record<string, { color: string; icon: any }> = {
  success: { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle2 },
  failed: { color: "bg-red-500/10 text-red-400 border-red-500/20", icon: XCircle },
  skipped: { color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: SkipForward },
};

export default function Logs() {
  const { data: logs, isLoading } = trpc.logs.list.useQuery(undefined);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Execution Logs</h1>
        <p className="text-muted-foreground mt-1">Detailed logs for each review publication attempt.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 bg-card animate-pulse rounded-lg border border-border" />)}
        </div>
      ) : !logs?.length ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            <ScrollText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p>No execution logs yet. Logs will appear here after tasks are executed.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {logs.map(log => {
            const config = logStatusConfig[log.status] || logStatusConfig.failed;
            const StatusIcon = config.icon;
            return (
              <Card key={log.id} className="bg-card border-border">
                <CardContent className="py-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={config.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {log.status}
                        </Badge>
                        {log.starRating && (
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(i => (
                              <Star key={i} className={`h-3 w-3 ${i <= (log.starRating || 0) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                            ))}
                          </div>
                        )}
                        {log.executionTimeMs && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {(log.executionTimeMs / 1000).toFixed(1)}s
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">Task #{log.taskId}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      {log.accountEmail && <span className="text-muted-foreground">Account: <span className="text-foreground">{log.accountEmail}</span></span>}
                      {log.businessName && <span className="text-muted-foreground">Business: <span className="text-foreground">{log.businessName}</span></span>}
                    </div>

                    {log.reviewContent && (
                      <p className="text-sm text-foreground/70 line-clamp-2">{log.reviewContent}</p>
                    )}

                    {log.errorMessage && (
                      <p className="text-sm text-red-400 bg-red-500/5 px-3 py-2 rounded-md">{log.errorMessage}</p>
                    )}

                    {log.stepReached && (
                      <p className="text-xs text-muted-foreground">Step reached: {log.stepReached}</p>
                    )}
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
