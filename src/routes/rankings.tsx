import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Flag } from "@/components/ContestantCard";
import { fetchAllResults, fetchCompetitions, fetchContestants, ranked } from "@/lib/pageant";

export const Route = createFileRoute("/rankings")({
  head: () => ({
    meta: [
      { title: "Live Rankings — AI Pageant World" },
      { name: "description", content: "Live contestant rankings across every AI pageant competition." },
      { property: "og:title", content: "Live Rankings — AI Pageant World" },
      { property: "og:description", content: "See who's leading every pageant right now." },
    ],
  }),
  component: RankingsPage,
});

function RankingsPage() {
  const { data: comps = [] } = useQuery({ queryKey: ["competitions"], queryFn: fetchCompetitions });
  const { data: contestants = [] } = useQuery({ queryKey: ["contestants"], queryFn: () => fetchContestants() });
  const { data: votes = {} } = useQuery({ queryKey: ["results", "all"], queryFn: fetchAllResults, refetchInterval: 5000 });
  const [sel, setSel] = useState<string | null>(null);
  const active = sel ?? comps[0]?.id;
  const list = ranked(contestants.filter((c) => c.competition_id === active), votes);

  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <p className="eyebrow text-center">Updated live</p>
      <h1 className="mt-2 text-center text-4xl text-gold md:text-5xl">Rankings</h1>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {comps.map((c) => (
          <button key={c.id} onClick={() => setSel(c.id)} className={`border px-4 py-2 text-xs uppercase tracking-[0.2em] ${active === c.id ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-primary"}`}>
            {c.title} {c.edition}
          </button>
        ))}
      </div>
      <ol className="mt-10 divide-y divide-border border border-border">
        {list.map((c, i) => (
          <li key={c.id}>
            <Link to="/contestants/$id" params={{ id: c.id }} className="flex items-center gap-4 p-4 hover:bg-accent">
              <span className={`w-10 text-center font-display text-2xl ${i < 3 ? "text-gold" : "text-muted-foreground"}`}>{i + 1}</span>
              {c.photo_url && <img src={c.photo_url} alt={c.name} loading="lazy" className="h-14 w-14 rounded-full object-cover" />}
              <div className="flex-1">
                <p className="font-display">{c.name}</p>
                <p className="flex items-center gap-2 text-xs text-muted-foreground"><Flag code={c.country_code} className="h-3 w-5" />{c.country}</p>
              </div>
              <span className="text-lg text-primary">{c.votes.toLocaleString()}</span>
            </Link>
          </li>
        ))}
        {list.length === 0 && <li className="p-6 text-center text-muted-foreground">No contestants yet.</li>}
      </ol>
    </div>
  );
}
