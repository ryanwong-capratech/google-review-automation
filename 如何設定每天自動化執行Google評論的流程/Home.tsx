import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Sparkles, Clock, CheckCircle2, XCircle } from "lucide-react";

export default function Home() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();

  const statCards = [
    { label: "Google Accounts", value: stats?.totalAccounts ?? 0, icon: Users, color: "text-blue-400" },
    { label: "Businesses", value: stats?.totalBusinesses ?? 0, icon: Building2, color: "text-violet-400" },
    { label: "Pending Tasks", value: stats?.pendingTasks ?? 0, icon: Clock, color: "text-orange-400" },
    { label: "In Progress", value: stats?.inProgressTasks ?? 0, icon: Sparkles, color: "text-amber-400" },
    { label: "Completed", value: stats?.completedTasks ?? 0, icon: CheckCircle2, color: "text-emerald-400" },
    { label: "Failed", value: stats?.failedTasks ?? 0, icon: XCircle, color: "text-red-400" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your Google Review automation system.</p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                <div className="text-3xl font-bold">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Quick Start Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">1</span>
            <p>Add your Google accounts in the <strong className="text-foreground">Accounts</strong> section. You can add them individually or batch import via CSV.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">2</span>
            <p>Add target businesses in the <strong className="text-foreground">Businesses</strong> section. Select the industry category so AI can generate relevant reviews.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">3</span>
            <p>Go to <strong className="text-foreground">Create Tasks</strong> to select businesses, accounts, and review type. AI will auto-generate unique review content for each task.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">4</span>
            <p>Monitor progress in the <strong className="text-foreground">Task Queue</strong> and review detailed results in <strong className="text-foreground">Logs</strong>.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">5</span>
            <p>Configure automatic scheduling in <strong className="text-foreground">Schedule</strong> to run tasks daily with randomized delays.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
