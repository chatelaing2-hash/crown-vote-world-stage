import { Link } from "@tanstack/react-router";
import { votingStatus, type Competition } from "@/lib/pageant";

export function StatusBadge({ c }: { c: Competition }) {
  const s = votingStatus(c);
  const label = s === "live" ? "● Voting Live" : s === "upcoming" ? "Coming Soon" : "Voting Closed";
  return (
    <span className={`inline-block border px-2 py-1 text-[10px] uppercase tracking-[0.25em] ${s === "live" ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>
      {label}
    </span>
  );
}

export function CompetitionCard({ c }: { c: Competition }) {
  return (
    <Link to="/competitions/$slug" params={{ slug: c.slug }} className="group relative block aspect-[4/5] overflow-hidden border border-border hover:shadow-gold">
      {c.cover_url && <img src={c.cover_url} alt={c.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />}
      <div className="absolute inset-0 bg-fade" />
      <div className="absolute left-4 top-4"><StatusBadge c={c} /></div>
      <div className="absolute bottom-5 left-5 right-5">
        <p className="eyebrow">{c.category === "miss" ? "Miss" : "Mister"} · {c.edition}</p>
        <h3 className="mt-2 text-2xl text-gold">{c.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
      </div>
    </Link>
  );
}
