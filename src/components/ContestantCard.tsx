import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { flagUrl, type Contestant } from "@/lib/pageant";

export function Flag({ code, className = "h-4 w-6" }: { code: string; className?: string }) {
  return <img src={flagUrl(code)} alt={code.toUpperCase()} className={`${className} rounded-sm object-cover`} loading="lazy" />;
}

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
  return (
    <div className="group overflow-hidden rounded-sm border border-border bg-card transition hover:shadow-gold">
      <Link to="/contestants/$id" params={{ id: c.id }} className="relative block aspect-[3/4] overflow-hidden">
        {c.photo_url ? (
          <img src={c.photo_url} alt={c.name} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
        <div className="absolute inset-0 bg-fade" />
        {rank !== undefined && (
          <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-gold font-display text-sm font-bold text-primary-foreground">
            {rank}
          </span>
        )}
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-center gap-2">
            <Flag code={c.country_code} />
            <span className="eyebrow">{c.country}</span>
          </div>
          <h3 className="mt-1 text-lg text-foreground">{c.name}</h3>
        </div>
      </Link>
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
