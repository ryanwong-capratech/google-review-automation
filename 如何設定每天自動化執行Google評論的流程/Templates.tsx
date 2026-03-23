import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit, Star, ThumbsUp, ThumbsDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Templates() {
  const utils = trpc.useUtils();
  const [filterType, setFilterType] = useState<"all" | "positive" | "negative">("all");
  const { data: templates, isLoading } = trpc.templates.list.useQuery(
    filterType === "all" ? undefined : { type: filterType }
  );
  const createMutation = trpc.templates.create.useMutation({ onSuccess: () => { utils.templates.list.invalidate(); setAddOpen(false); resetForm(); toast.success("Template added"); } });
  const updateMutation = trpc.templates.update.useMutation({ onSuccess: () => { utils.templates.list.invalidate(); setEditOpen(false); toast.success("Template updated"); } });
  const deleteMutation = trpc.templates.delete.useMutation({ onSuccess: () => { utils.templates.list.invalidate(); toast.success("Template deleted"); } });

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ content: "", type: "positive" as "positive" | "negative", starRating: 5, language: "zh-HK" });
  const [editId, setEditId] = useState<number | null>(null);

  const resetForm = () => setForm({ content: "", type: "positive", starRating: 5, language: "zh-HK" });

  const handleAdd = () => {
    createMutation.mutate({ content: form.content, type: form.type, starRating: form.starRating, language: form.language });
  };

  const handleEdit = () => {
    if (!editId) return;
    updateMutation.mutate({ id: editId, content: form.content, type: form.type, starRating: form.starRating, language: form.language });
  };

  const openEdit = (t: any) => {
    setEditId(t.id);
    setForm({ content: t.content, type: t.type, starRating: t.starRating, language: t.language || "zh-HK" });
    setEditOpen(true);
  };

  const StarDisplay = ({ rating }: { rating: number }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`h-3.5 w-3.5 ${i <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );

  const FormFields = () => (
    <div className="space-y-4">
      <div>
        <Label>Review Type</Label>
        <Select value={form.type} onValueChange={(v: "positive" | "negative") => setForm(f => ({ ...f, type: v, starRating: v === "positive" ? 5 : 1 }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="positive">Positive</SelectItem>
            <SelectItem value="negative">Negative</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Star Rating ({form.starRating})</Label>
        <div className="flex gap-1 mt-1">
          {[1, 2, 3, 4, 5].map(i => (
            <button key={i} type="button" onClick={() => setForm(f => ({ ...f, starRating: i }))} className="p-1 hover:scale-110 transition-transform">
              <Star className={`h-6 w-6 ${i <= form.starRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>Review Content</Label>
        <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Write your review template here..." rows={5} />
      </div>
      <div>
        <Label>Language</Label>
        <Select value={form.language} onValueChange={(v) => setForm(f => ({ ...f, language: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="zh-HK">Chinese (HK)</SelectItem>
            <SelectItem value="zh-TW">Chinese (TW)</SelectItem>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="ja">Japanese</SelectItem>
            <SelectItem value="ko">Korean</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Review Templates</h1>
          <p className="text-muted-foreground mt-1">Manage review content templates. System randomly selects during task execution.</p>
        </div>
        <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Template</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Review Template</DialogTitle></DialogHeader>
            <FormFields />
            <DialogFooter>
              <Button onClick={handleAdd} disabled={createMutation.isPending || !form.content}>{createMutation.isPending ? "Adding..." : "Add Template"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        {(["all", "positive", "negative"] as const).map(t => (
          <Button key={t} variant={filterType === t ? "default" : "outline"} size="sm" onClick={() => setFilterType(t)} className="capitalize">
            {t === "positive" && <ThumbsUp className="h-3.5 w-3.5 mr-1.5" />}
            {t === "negative" && <ThumbsDown className="h-3.5 w-3.5 mr-1.5" />}
            {t}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-card animate-pulse rounded-lg border border-border" />)}
        </div>
      ) : !templates?.length ? (
        <Card className="bg-card border-border"><CardContent className="py-12 text-center text-muted-foreground">No templates yet. Add your first review template.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {templates.map(t => (
            <Card key={t.id} className="bg-card border-border">
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className={t.type === "positive" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}>
                        {t.type === "positive" ? <ThumbsUp className="h-3 w-3 mr-1" /> : <ThumbsDown className="h-3 w-3 mr-1" />}
                        {t.type}
                      </Badge>
                      <StarDisplay rating={t.starRating} />
                      <Badge variant="outline" className="text-xs">{t.language}</Badge>
                    </div>
                    <p className="text-sm text-foreground/80 line-clamp-3">{t.content}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { if (confirm("Delete this template?")) deleteMutation.mutate({ id: t.id }); }}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Template</DialogTitle></DialogHeader>
          <FormFields />
          <DialogFooter>
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>{updateMutation.isPending ? "Saving..." : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
