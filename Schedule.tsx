import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Clock, Shield, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Schedule() {
  const { data: config, isLoading } = trpc.schedule.get.useQuery();
  const updateMutation = trpc.schedule.update.useMutation({
    onSuccess: () => toast.success("Schedule settings saved"),
    onError: (err) => toast.error(err.message),
  });

  const [form, setForm] = useState({
    isEnabled: false,
    executionTime: "10:00",
    maxTasksPerDay: 5,
    minDelayMinutes: 30,
    maxDelayMinutes: 120,
    timezone: "Asia/Hong_Kong",
  });

  useEffect(() => {
    if (config) {
      setForm({
        isEnabled: config.isEnabled,
        executionTime: config.executionTime || "10:00",
        maxTasksPerDay: config.maxTasksPerDay,
        minDelayMinutes: config.minDelayMinutes,
        maxDelayMinutes: config.maxDelayMinutes,
        timezone: config.timezone || "Asia/Hong_Kong",
      });
    }
  }, [config]);

  const handleSave = () => {
    updateMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold tracking-tight">Schedule Settings</h1></div>
        <div className="h-64 bg-card animate-pulse rounded-lg border border-border" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Schedule Settings</h1>
        <p className="text-muted-foreground mt-1">Configure automatic task execution timing and frequency.</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Auto Execution
              </CardTitle>
              <CardDescription>Enable automatic daily execution of pending review tasks.</CardDescription>
            </div>
            <Switch checked={form.isEnabled} onCheckedChange={(checked) => setForm(f => ({ ...f, isEnabled: checked }))} />
          </div>
        </CardHeader>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Timing Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input type="time" value={form.executionTime} onChange={e => setForm(f => ({ ...f, executionTime: e.target.value }))} />
              <p className="text-xs text-muted-foreground">Tasks will begin executing around this time.</p>
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select value={form.timezone} onValueChange={(v) => setForm(f => ({ ...f, timezone: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Hong_Kong">Hong Kong (GMT+8)</SelectItem>
                  <SelectItem value="Asia/Taipei">Taipei (GMT+8)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo (GMT+9)</SelectItem>
                  <SelectItem value="Asia/Singapore">Singapore (GMT+8)</SelectItem>
                  <SelectItem value="America/New_York">New York (EST)</SelectItem>
                  <SelectItem value="Europe/London">London (GMT)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Safety Controls
          </CardTitle>
          <CardDescription>Configure limits to avoid triggering Google's protection mechanisms.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Max Tasks Per Day</Label>
              <Input type="number" min={1} max={50} value={form.maxTasksPerDay} onChange={e => setForm(f => ({ ...f, maxTasksPerDay: parseInt(e.target.value) || 5 }))} />
              <p className="text-xs text-muted-foreground">Maximum number of reviews to post per day.</p>
            </div>
            <div className="space-y-2">
              <Label>Min Delay (minutes)</Label>
              <Input type="number" min={5} max={360} value={form.minDelayMinutes} onChange={e => setForm(f => ({ ...f, minDelayMinutes: parseInt(e.target.value) || 30 }))} />
              <p className="text-xs text-muted-foreground">Minimum wait time between reviews.</p>
            </div>
            <div className="space-y-2">
              <Label>Max Delay (minutes)</Label>
              <Input type="number" min={10} max={720} value={form.maxDelayMinutes} onChange={e => setForm(f => ({ ...f, maxDelayMinutes: parseInt(e.target.value) || 120 }))} />
              <p className="text-xs text-muted-foreground">Maximum wait time between reviews.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateMutation.isPending} className="gap-2">
          <Save className="h-4 w-4" />
          {updateMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
