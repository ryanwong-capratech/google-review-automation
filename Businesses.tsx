import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Building2, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Businesses() {
  const utils = trpc.useUtils();
  const { data: businesses, isLoading } = trpc.businesses.list.useQuery();
  const { data: industries } = trpc.businesses.industries.useQuery();
  const createMutation = trpc.businesses.create.useMutation({ onSuccess: () => { utils.businesses.list.invalidate(); setAddOpen(false); resetForm(); toast.success("Business added"); } });
  const updateMutation = trpc.businesses.update.useMutation({ onSuccess: () => { utils.businesses.list.invalidate(); setEditOpen(false); toast.success("Business updated"); } });
  const deleteMutation = trpc.businesses.delete.useMutation({ onSuccess: () => { utils.businesses.list.invalidate(); toast.success("Business deleted"); } });

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ name: "", industry: "general", googleMapsLink: "", address: "", notes: "" });
  const [editId, setEditId] = useState<number | null>(null);

  const resetForm = () => setForm({ name: "", industry: "general", googleMapsLink: "", address: "", notes: "" });

  const handleAdd = () => {
    createMutation.mutate({ name: form.name, industry: form.industry, googleMapsLink: form.googleMapsLink || undefined, address: form.address || undefined, notes: form.notes || undefined });
  };

  const handleEdit = () => {
    if (!editId) return;
    updateMutation.mutate({ id: editId, name: form.name, industry: form.industry, googleMapsLink: form.googleMapsLink || undefined, address: form.address || undefined, notes: form.notes || undefined });
  };

  const openEdit = (biz: any) => {
    setEditId(biz.id);
    setForm({ name: biz.name, industry: biz.industry || "general", googleMapsLink: biz.googleMapsLink || "", address: biz.address || "", notes: biz.notes || "" });
    setEditOpen(true);
  };

  const getIndustryLabel = (value: string) => {
    return industries?.find(i => i.value === value)?.label || value;
  };

  const FormFields = () => (
    <div className="space-y-4">
      <div><Label>Business Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Mirror Skin" /></div>
      <div>
        <Label>Industry / Category</Label>
        <Select value={form.industry} onValueChange={v => setForm(f => ({ ...f, industry: v }))}>
          <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
          <SelectContent>
            {industries?.map(ind => (
              <SelectItem key={ind.value} value={ind.value}>{ind.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">AI will generate review content based on this industry.</p>
      </div>
      <div><Label>Google Maps Link (optional)</Label><Input value={form.googleMapsLink} onChange={e => setForm(f => ({ ...f, googleMapsLink: e.target.value }))} placeholder="https://www.google.com/maps/place/..." /></div>
      <div><Label>Address (optional)</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Business address" /></div>
      <div><Label>Notes (optional)</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes" /></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Businesses</h1>
          <p className="text-muted-foreground mt-1">Manage target businesses for review posting. AI will auto-generate reviews based on industry.</p>
        </div>
        <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Business</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Business</DialogTitle></DialogHeader>
            <FormFields />
            <DialogFooter>
              <Button onClick={handleAdd} disabled={createMutation.isPending || !form.name}>{createMutation.isPending ? "Adding..." : "Add Business"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-card animate-pulse rounded-lg border border-border" />)}
        </div>
      ) : !businesses?.length ? (
        <Card className="bg-card border-border"><CardContent className="py-12 text-center text-muted-foreground">No businesses yet. Add your first target business.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {businesses.map(biz => (
            <Card key={biz.id} className="bg-card border-border">
              <CardContent className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-violet-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{biz.name}</p>
                      <Badge variant="outline" className="text-xs shrink-0">{getIndustryLabel(biz.industry || "general")}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{biz.address || "No address"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {biz.googleMapsLink && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(biz.googleMapsLink!, "_blank")}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(biz)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { if (confirm("Delete this business?")) deleteMutation.mutate({ id: biz.id }); }}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Business</DialogTitle></DialogHeader>
          <FormFields />
          <DialogFooter>
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>{updateMutation.isPending ? "Saving..." : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
