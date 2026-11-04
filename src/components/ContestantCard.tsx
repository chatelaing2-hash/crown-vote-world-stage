import { Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, Crown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { flagUrl, type Contestant } from "@/lib/pageant";
import { useAuth } from "@/lib/auth";
import { setContestantPhoto } from "@/lib/photos";

export function Flag({ code, className = "h-4 w-6" }: { code: string; className?: string }) {
  return <img src={flagUrl(code)} alt={code.toUpperCase()} className={`${className} rounded-sm object-cover`} loading="lazy" />;
}

export function PhotoUploadButton({ c, label, variant = "goldOutline" }: { c: Contestant; label?: string; variant?: "gold" | "goldOutline" }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const onFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      await setContestantPhoto(c.id, c.competition_id, file);
      toast.success("Photo saved");
      qc.invalidateQueries({ queryKey: ["contestants"] });
      qc.invalidateQueries({ queryKey: ["contestant"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };
  return (
    <>
      <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      <Button type="button" size="sm" variant={variant} disabled={busy} onClick={(e) => { e.preventDefault(); e.stopPropagation(); ref.current?.click(); }}>
        <Camera /> {busy ? "Uploading…" : label ?? (c.photo_url ? "Replace" : "Upload Photo")}
      </Button>
    </>
  );
}

export const pad = (n: number | null | undefined) => (n ? String(n).padStart(2, "0") : "");

export function ContestantCard({
  c,
  votes,
  rank,
  onVote,
  canVote,
  voting,
}: {
  c: Contestant;
  votes?: number;
  rank?: number;
  onVote?: () => void;
  canVote?: boolean;
  voting?: boolean;
}) {
  const { isOrganizer } = useAuth();
  return (
    <div className="group overflow-hidden rounded-sm border border-border bg-card transition hover:shadow-gold">
      <div className="relative aspect-[3/4] overflow-hidden">
        <Link to="/contestants/$id" params={{ id: c.id }} className="absolute inset-0 block">
          {c.photo_url ? (
            <img src={c.photo_url} alt={c.name} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted">
              <div className="flex h-3/5 w-3/5 items-center justify-center rounded-t-full border border-primary/40">
                <Crown className="h-8 w-8 text-primary/50" />
              </div>
              <span className="eyebrow text-[0.6rem]">Photo coming soon</span>
            </div>
          )}
          <div className="absolute inset-0 bg-fade" />
        </Link>
        {rank !== undefined && (
          <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-gold font-display text-sm font-bold text-primary-foreground">
            {rank}
          </span>
        )}
        {c.position && (
          <span className="absolute right-3 top-3 border border-primary bg-background/80 px-2 py-0.5 font-display text-sm text-primary">
            {pad(c.position)}
          </span>
        )}
        {isOrganizer && (
          <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 opacity-100 md:opacity-0 md:group-hover:opacity-100">
            <PhotoUploadButton c={c} variant="gold" />
          </div>
        )}
        <div className="pointer-events-none absolute bottom-3 left-3 right-3">
          <div className="flex items-center gap-2">
            <Flag code={c.country_code} />
            <span className="eyebrow">{c.country}</span>
          </div>
          <h3 className="mt-1 text-base text-foreground md:text-lg">{c.name}</h3>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 p-3">
        <span className="text-sm text-muted-foreground">
          {votes !== undefined ? <><span className="font-semibold text-primary">{votes.toLocaleString()}</span> votes</> : `${c.age ?? ""} ${c.height ? "· " + c.height : ""}`}
        </span>
        {onVote && (
          <Button size="sm" variant="gold" disabled={!canVote || voting} onClick={onVote}>
            {voting ? "..." : "Vote"}
          </Button>
        )}
      </div>
    </div>
  );
}
