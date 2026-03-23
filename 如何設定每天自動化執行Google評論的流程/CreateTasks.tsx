import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Rocket, ThumbsUp, ThumbsDown, AlertCircle, Sparkles, RefreshCw } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export default function CreateTasks() {
  const { data: accounts } = trpc.accounts.list.useQuery();
  const { data: businesses } = trpc.businesses.list.useQuery();
  const previewMutation = trpc.tasks.previewReview.useMutation();
  const batchCreateMutation = trpc.tasks.batchCreate.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.count} tasks created! AI generated unique review for each task.`);
      setSelectedAccounts([]);
      setSelectedBusinesses([]);
      setPreviewContent(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);
  const [selectedBusinesses, setSelectedBusinesses] = useState<number[]>([]);
  const [reviewType, setReviewType] = useState<"positive" | "negative">("positive");
  const [language, setLanguage] = useState("zh-HK");
  const [previewContent, setPreviewContent] = useState<{ content: string; starRating: number; businessName: string } | null>(null);

  const availableAccounts = useMemo(() => accounts?.filter(a => a.status === "available") || [], [accounts]);
  const totalTasks = selectedAccounts.length * selectedBusinesses.length;

  const toggleAccount = (id: number) => {
    setSelectedAccounts(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const toggleBusiness = (id: number) => {
    setSelectedBusinesses(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
  };

  const handlePreview = () => {
    if (selectedBusinesses.length === 0) {
      toast.error("Please select at least one business to preview");
      return;
    }
    previewMutation.mutate(
      { businessId: selectedBusinesses[0], reviewType, language },
      {
        onSuccess: (data) => setPreviewContent(data),
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const handleCreate = () => {
    if (selectedAccounts.length === 0 || selectedBusinesses.length === 0) {
      toast.error("Please select at least one account and one business");
      return;
    }
    batchCreateMutation.mutate({ accountIds: selectedAccounts, businessIds: selectedBusinesses, reviewType, language });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Tasks</h1>
        <p className="text-muted-foreground mt-1">Select businesses and accounts. AI will auto-generate unique review content for each task.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Select Accounts
              <span className="text-sm font-normal text-muted-foreground">{selectedAccounts.length} selected</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
            {!availableAccounts.length ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <AlertCircle className="h-4 w-4" />
                <span>No available accounts. Add accounts first or check their status.</span>
              </div>
            ) : (
              <>
                <Button variant="outline" size="sm" className="mb-2" onClick={() => {
                  if (selectedAccounts.length === availableAccounts.length) setSelectedAccounts([]);
                  else setSelectedAccounts(availableAccounts.map(a => a.id));
                }}>
                  {selectedAccounts.length === availableAccounts.length ? "Deselect All" : "Select All"}
                </Button>
                {availableAccounts.map(account => (
                  <label key={account.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors">
                    <Checkbox checked={selectedAccounts.includes(account.id)} onCheckedChange={() => toggleAccount(account.id)} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{account.email}</p>
                      <p className="text-xs text-muted-foreground">{account.displayName || "No display name"}</p>
                    </div>
                  </label>
                ))}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Select Businesses
              <span className="text-sm font-normal text-muted-foreground">{selectedBusinesses.length} selected</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
            {!businesses?.length ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <AlertCircle className="h-4 w-4" />
                <span>No businesses found. Add businesses first.</span>
              </div>
            ) : (
              <>
                <Button variant="outline" size="sm" className="mb-2" onClick={() => {
                  if (selectedBusinesses.length === businesses.length) setSelectedBusinesses([]);
                  else setSelectedBusinesses(businesses.map(b => b.id));
                }}>
                  {selectedBusinesses.length === businesses.length ? "Deselect All" : "Select All"}
                </Button>
                {businesses.map(biz => (
                  <label key={biz.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors">
                    <Checkbox checked={selectedBusinesses.includes(biz.id)} onCheckedChange={() => toggleBusiness(biz.id)} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{biz.name}</p>
                        <Badge variant="outline" className="text-[10px] shrink-0">{biz.industry || "general"}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{biz.address || "No address"}</p>
                    </div>
                  </label>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Preview Section */}
      <Card className="bg-card border-border border-dashed">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            AI Review Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Preview how AI will generate review content. Each task will get a unique review.</p>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handlePreview} disabled={previewMutation.isPending || selectedBusinesses.length === 0} className="gap-2">
              {previewMutation.isPending ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              {previewMutation.isPending ? "Generating..." : "Generate Preview"}
            </Button>
            {selectedBusinesses.length === 0 && <span className="text-xs text-muted-foreground">Select a business first</span>}
          </div>
          {previewContent && (
            <div className="p-4 rounded-lg bg-accent/30 border border-border space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{previewContent.businessName}</span>
                <span className="text-amber-400">{"★".repeat(previewContent.starRating)}{"☆".repeat(5 - previewContent.starRating)}</span>
              </div>
              <p className="text-sm leading-relaxed">{previewContent.content}</p>
              <p className="text-xs text-muted-foreground italic">This is a preview. Each task will receive a different AI-generated review.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings & Submit */}
      <Card className="bg-card border-border">
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
            <div className="space-y-2">
              <Label>Review Type</Label>
              <Select value={reviewType} onValueChange={(v: "positive" | "negative") => setReviewType(v)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positive"><div className="flex items-center gap-2"><ThumbsUp className="h-4 w-4 text-emerald-400" />Positive (5 stars)</div></SelectItem>
                  <SelectItem value="negative"><div className="flex items-center gap-2"><ThumbsDown className="h-4 w-4 text-red-400" />Negative (1-2 stars)</div></SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zh-HK">廣東話 (Cantonese)</SelectItem>
                  <SelectItem value="zh-TW">繁體中文</SelectItem>
                  <SelectItem value="zh-CN">简体中文</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4 flex-1">
              <div className="text-sm text-muted-foreground">
                <span className="text-foreground font-bold text-lg">{totalTasks}</span> tasks will be created
                <span className="text-xs block">({selectedAccounts.length} accounts x {selectedBusinesses.length} businesses)</span>
              </div>
            </div>

            <Button size="lg" onClick={handleCreate} disabled={batchCreateMutation.isPending || totalTasks === 0} className="gap-2">
              <Rocket className="h-4 w-4" />
              {batchCreateMutation.isPending ? "AI Generating & Creating..." : `Create ${totalTasks} Tasks`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
