import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flag, PhotoUploadButton, pad } from "@/components/ContestantCard";
import { uploadPhoto } from "@/lib/photos";
import type { Contestant } from "@/lib/pageant";
import { StatusBadge } from "@/components/CompetitionCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchAllResults, type Competition } from "@/lib/pageant";

const toLocal = (d: string | null) => (d ? new Date(d).toISOString().slice(0, 16) : "");
const fromLocal = (v: string) => (v ? new Date(v).toISOString() : null);

export function ManageCompetitions({ scope }: { scope: "mine" | "all" }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: comps = [] } = useQuery({
    queryKey: ["manage-competitions", scope, user?.id],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase.from("competitions").select("*").order("created_at", { ascending: false });
      if (scope === "mine") q = q.eq("organizer_id", user!.id);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["manage-competitions"] });
    qc.invalidateQueries({ queryKey: ["competitions"] });
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl">Competitions</h2>
        <NewCompetition onDone={refresh} />
      </div>
      <div className="space-y-6">
        {comps.map((c) => <CompetitionRow key={c.id} c={c} onChange={refresh} />)}
        {comps.length === 0 && <p className="text-muted-foreground">No competitions yet. Create your first one.</p>}
      </div>
    </div>
  );
}

function NewCompetition({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: "", edition: String(new Date().getFullYear()), category: "miss" as "miss" | "mister", description: "", cover_url: "" });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = `${f.title}-${f.edition}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Math.random().toString(36).slice(2, 6);
    const { error } = await supabase.from("competitions").insert({ ...f, slug, organizer_id: user!.id, cover_url: f.cover_url || null });
    if (error) return toast.error(error.message);
    toast.success("Competition created");
    setOpen(false);
    onDone();
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="gold" size="sm"><Plus /> New</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Competition</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div><Label>Title</Label><Input required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Miss AI Asia" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Edition</Label><Input value={f.edition} onChange={(e) => setF({ ...f, edition: e.target.value })} /></div>
            <div><Label>Category</Label>
              <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v as "miss" | "mister" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="miss">Miss</SelectItem><SelectItem value="mister">Mister</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Cover image URL</Label><Input value={f.cover_url} onChange={(e) => setF({ ...f, cover_url: e.target.value })} placeholder="https://…" /></div>
          <div><Label>Description</Label><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
          <Button type="submit" variant="gold" className="w-full">Create</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CompetitionRow({ c, onChange }: { c: Competition; onChange: () => void }) {
  const qc = useQueryClient();
  const [starts, setStarts] = useState(toLocal(c.voting_starts_at));
  const [ends, setEnds] = useState(toLocal(c.voting_ends_at));
  const { data: contestants = [] } = useQuery({
    queryKey: ["contestants", c.id],
    queryFn: async () => (await supabase.from("contestants").select("*").eq("competition_id", c.id).order("position", { nullsFirst: false }).order("name")).data ?? [],
  });
  const { data: votes = {} } = useQuery({ queryKey: ["results", "all"], queryFn: fetchAllResults, refetchInterval: 10000 });

  const update = async (patch: Partial<Competition>, msg: string) => {
    const { error } = await supabase.from("competitions").update(patch).eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success(msg);
    onChange();
  };
  const del = async () => {
    if (!confirm(`Delete "${c.title}" and all its contestants and votes?`)) return;
    const { error } = await supabase.from("competitions").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    onChange();
  };
  const delContestant = async (id: string) => {
    if (!confirm("Remove this contestant?")) return;
    const { error } = await supabase.from("contestants").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["contestants"] });
  };

  return (
    <div className="border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <StatusBadge c={c} />
          <h3 className="mt-2 text-xl text-gold">{c.title} {c.edition}</h3>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{c.category}</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm"><Switch checked={c.published} onCheckedChange={(v) => update({ published: v }, v ? "Published" : "Hidden")} /> Published</label>
          <Button size="icon" variant="ghost" onClick={del} aria-label="Delete"><Trash2 /></Button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 border-t border-border pt-5 md:grid-cols-[auto_1fr_1fr_auto] md:items-end">
        <Button variant={c.voting_open ? "destructive" : "gold"} onClick={() => update({ voting_open: !c.voting_open }, c.voting_open ? "Voting stopped" : "Voting started")}>
          {c.voting_open ? "Stop Voting" : "Start Voting"}
        </Button>
        <div><Label className="text-xs">Voting starts (optional)</Label><Input type="datetime-local" value={starts} onChange={(e) => setStarts(e.target.value)} /></div>
        <div><Label className="text-xs">Voting ends (optional)</Label><Input type="datetime-local" value={ends} onChange={(e) => setEnds(e.target.value)} /></div>
        <Button variant="goldOutline" onClick={() => update({ voting_starts_at: fromLocal(starts), voting_ends_at: fromLocal(ends) }, "Schedule saved")}>Save schedule</Button>
      </div>

      <div className="mt-5 border-t border-border pt-5">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm uppercase tracking-widest">Contestants ({contestants.length})</h4>
          <NewContestant competitionId={c.id} nextPosition={Math.max(0, ...contestants.map((x) => x.position ?? 0)) + 1} />
        </div>
        <ul className="divide-y divide-border">
          {contestants.map((p) => (
            <ContestantRow key={p.id} p={p} votes={votes[p.id] ?? 0} onDelete={() => delContestant(p.id)} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function NewContestant({ competitionId, nextPosition }: { competitionId: string; nextPosition: number }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const empty = { name: "", country: "", country_code: "", age: "", height: "", bio: "", photo_url: "" };
  const [f, setF] = useState(empty);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    let photo = f.photo_url || null;
    if (file) {
      try { photo = await uploadPhoto(competitionId, file); }
      catch (err) { setBusy(false); return toast.error((err as Error).message); }
    }
    const { error } = await supabase.from("contestants").insert({
      competition_id: competitionId,
      position: nextPosition,
      name: f.name,
      country: f.country,
      country_code: f.country_code.toLowerCase(),
      age: f.age ? Number(f.age) : null,
      height: f.height || null,
      bio: f.bio || null,
      photo_url: photo,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Contestant added");
    setF(empty); setFile(null); setOpen(false);
    qc.invalidateQueries({ queryKey: ["contestants"] });
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="goldOutline"><Plus /> Add</Button></DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add Contestant</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div><Label>Full name</Label><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Country</Label><Input required value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} placeholder="Italy" /></div>
            <div><Label>Country code</Label><Input required maxLength={2} value={f.country_code} onChange={(e) => setF({ ...f, country_code: e.target.value })} placeholder="it" /></div>
            <div><Label>Age</Label><Input type="number" value={f.age} onChange={(e) => setF({ ...f, age: e.target.value })} /></div>
            <div><Label>Height</Label><Input value={f.height} onChange={(e) => setF({ ...f, height: e.target.value })} placeholder="175 cm" /></div>
          </div>
          <div><Label>Photo upload</Label><Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
          <div><Label>…or photo URL</Label><Input value={f.photo_url} onChange={(e) => setF({ ...f, photo_url: e.target.value })} /></div>
          <div><Label>Biography</Label><Textarea value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} /></div>
          <Button type="submit" variant="gold" className="w-full" disabled={busy}>{busy ? "Saving…" : "Add contestant"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ContestantRow({ p, votes, onDelete }: { p: Contestant; votes: number; onDelete: () => void }) {
  const qc = useQueryClient();
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState({ name: p.name, country: p.country, country_code: p.country_code });
  const save = async () => {
    const { error } = await supabase.from("contestants").update({ ...f, country_code: f.country_code.toLowerCase() }).eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Contestant updated");
    setEdit(false);
    qc.invalidateQueries({ queryKey: ["contestants"] });
  };
  return (
    <li className="flex flex-wrap items-center gap-3 py-3 text-sm">
      <span className="w-6 font-display text-primary">{pad(p.position)}</span>
      {p.photo_url ? <img src={p.photo_url} alt={p.name} className="h-12 w-9 object-cover" /> : <div className="h-12 w-9 border border-dashed border-primary/50" />}
      <Flag code={p.country_code} />
      {edit ? (
        <div className="flex flex-1 flex-wrap gap-2">
          <Input className="h-8 min-w-40 flex-1" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <Input className="h-8 w-32" value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} />
          <Input className="h-8 w-16" maxLength={2} value={f.country_code} onChange={(e) => setF({ ...f, country_code: e.target.value })} />
          <Button size="sm" variant="gold" onClick={save}>Save</Button>
          <Button size="sm" variant="ghost" onClick={() => setEdit(false)}>Cancel</Button>
        </div>
      ) : (
        <span className="min-w-40 flex-1">{p.name} <span className="text-muted-foreground">· {p.country}</span></span>
      )}
      <span className="text-primary">{votes} votes</span>
      <PhotoUploadButton c={p} />
      {!edit && <Button size="sm" variant="ghost" onClick={() => setEdit(true)}>Edit</Button>}
      <Button size="icon" variant="ghost" onClick={onDelete} aria-label="Remove"><Trash2 /></Button>
    </li>
  );
}
