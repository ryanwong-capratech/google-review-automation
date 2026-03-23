import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Upload, Trash2, Edit, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  available: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  in_use: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  invalid: "bg-red-500/10 text-red-400 border-red-500/20",
  cooldown: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

export default function Accounts() {
  const utils = trpc.useUtils();
  const { data: accounts, isLoading } = trpc.accounts.list.useQuery();
  const createMutation = trpc.accounts.create.useMutation({ onSuccess: () => { utils.accounts.list.invalidate(); setAddOpen(false); resetForm(); toast.success("Account added"); } });
  const updateMutation = trpc.accounts.update.useMutation({ onSuccess: () => { utils.accounts.list.invalidate(); setEditOpen(false); toast.success("Account updated"); } });
  const deleteMutation = trpc.accounts.delete.useMutation({ onSuccess: () => { utils.accounts.list.invalidate(); toast.success("Account deleted"); } });
  const batchImportMutation = trpc.accounts.batchImport.useMutation({ onSuccess: (data) => { utils.accounts.list.invalidate(); setBatchOpen(false); setBatchText(""); toast.success(`${data.count} accounts imported`); } });

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [batchText, setBatchText] = useState("");
  const [form, setForm] = useState({ email: "", password: "", displayName: "", backupCodes: "", notes: "" });
  const [editId, setEditId] = useState<number | null>(null);

  const resetForm = () => setForm({ email: "", password: "", displayName: "", backupCodes: "", notes: "" });

  const handleAdd = () => {
    const codes = form.backupCodes.trim() ? form.backupCodes.split("\n").map(c => c.trim()).filter(Boolean) : undefined;
    createMutation.mutate({ email: form.email, password: form.password, displayName: form.displayName || undefined, backupCodes: codes, notes: form.notes || undefined });
  };

  const handleEdit = () => {
    if (!editId) return;
    const codes = form.backupCodes.trim() ? form.backupCodes.split("\n").map(c => c.trim()).filter(Boolean) : undefined;
    updateMutation.mutate({ id: editId, email: form.email, password: form.password, displayName: form.displayName || undefined, backupCodes: codes, notes: form.notes || undefined });
  };

  const handleBatchImport = () => {
    const lines = batchText.trim().split("\n").filter(Boolean);
    const accounts = lines.map(line => {
      const parts = line.split(",").map(p => p.trim());
      return { email: parts[0], password: parts[1], displayName: parts[2] || undefined, backupCodes: parts[3] ? parts[3].split("|") : undefined };
    }).filter(a => a.email && a.password);
    if (accounts.length === 0) { toast.error("No valid accounts found. Format: email,password,displayName,code1|code2"); return; }
    batchImportMutation.mutate({ accounts });
  };

  const openEdit = (account: any) => {
    setEditId(account.id);
    setForm({ email: account.email, password: account.password, displayName: account.displayName || "", backupCodes: (account.backupCodes || []).join("\n"), notes: account.notes || "" });
    setEditOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Google Accounts</h1>
          <p className="text-muted-foreground mt-1">Manage Google accounts for posting reviews. Max 20 accounts.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={batchOpen} onOpenChange={setBatchOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Upload className="h-4 w-4 mr-2" />Batch Import</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Batch Import Accounts</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">One account per line. Format: <code className="text-xs bg-muted px-1 py-0.5 rounded">email,password,displayName,backupCode1|backupCode2</code></p>
                <Textarea value={batchText} onChange={e => setBatchText(e.target.value)} placeholder="user1@gmail.com,password1,Display Name,code1|code2&#10;user2@gmail.com,password2" rows={8} />
              </div>
              <DialogFooter>
                <Button onClick={handleBatchImport} disabled={batchImportMutation.isPending}>{batchImportMutation.isPending ? "Importing..." : "Import"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={(accounts?.length ?? 0) >= 20}><Plus className="h-4 w-4 mr-2" />Add Account</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Google Account</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Email</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="user@gmail.com" /></div>
                <div>
                  <Label>Password</Label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div><Label>Display Name (optional)</Label><Input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} placeholder="Display name" /></div>
                <div><Label>2FA Backup Codes (one per line)</Label><Textarea value={form.backupCodes} onChange={e => setForm(f => ({ ...f, backupCodes: e.target.value }))} placeholder="1234 5678&#10;9012 3456" rows={4} /></div>
                <div><Label>Notes (optional)</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes" /></div>
              </div>
              <DialogFooter>
                <Button onClick={handleAdd} disabled={createMutation.isPending || !form.email || !form.password}>{createMutation.isPending ? "Adding..." : "Add Account"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-card animate-pulse rounded-lg border border-border" />)}
        </div>
      ) : !accounts?.length ? (
        <Card className="bg-card border-border"><CardContent className="py-12 text-center text-muted-foreground">No accounts yet. Add your first Google account to get started.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {accounts.map(account => (
            <Card key={account.id} className="bg-card border-border">
              <CardContent className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">{account.email.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{account.email}</p>
                      <Badge variant="outline" className={statusColors[account.status] || ""}>{account.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {account.displayName || "No display name"} {account.backupCodes && Array.isArray(account.backupCodes) ? `· ${account.backupCodes.length} backup codes` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(account)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { if (confirm("Delete this account?")) deleteMutation.mutate({ id: account.id }); }}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Account</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Email</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div>
              <Label>Password</Label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div><Label>Display Name</Label><Input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} /></div>
            <div><Label>2FA Backup Codes (one per line)</Label><Textarea value={form.backupCodes} onChange={e => setForm(f => ({ ...f, backupCodes: e.target.value }))} rows={4} /></div>
            <div><Label>Notes</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>{updateMutation.isPending ? "Saving..." : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
