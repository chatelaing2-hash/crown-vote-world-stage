import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ContestantCard, Flag } from "@/components/ContestantCard";
import { StatusBadge } from "@/components/CompetitionCard";
import { Progress } from "@/components/ui/progress";
import { useVote } from "@/hooks/use-vote";
import { supabase } from "@/integrations/supabase/client";
import { fetchCompetitionBySlug, fetchContestants, ranked, votingStatus } from "@/lib/pageant";

export const Route = createFileRoute("/competitions/$slug")({
  head: () => ({
    meta: [
      { title: "Vote — AI Pageant World" },
      { name: "description", content: "Meet the contestants and cast your vote with live results." },
      { property: "og:title", content: "Vote — AI Pageant World" },
      { property: "og:description", content: "Meet the contestants and cast your vote." },
    ],
  }),
  component: CompetitionPage,
});

function CompetitionPage() {
  const { slug } = Route.useParams();
  const vote = useVote();
  const { data: comp, isLoading } = useQuery({ queryKey: ["competition", slug], queryFn: () => fetchCompetitionBySlug(slug) });
  const { data: contestants = [] } = useQuery({
    queryKey: ["contestants", comp?.id],
    queryFn: () => fetchContestants(comp!.id),
    enabled: !!comp,
  });
  const { data: votes = {} } = useQuery({
    queryKey: ["results", comp?.id],
    enabled: !!comp,
    refetchInterval: 5000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("competition_results", { _competition_id: comp!.id });
      if (error) throw error;
      const m: Record<string, number> = {};
      data.forEach((r) => (m[r.contestant_id] = Number(r.votes)));
      return m;
    },
  });

  if (isLoading) return <p className="py-20 text-center text-muted-foreground">Loading…</p>;
  if (!comp) return <p className="py-20 text-center">Competition not found. <Link to="/competitions" className="text-primary">Back</Link></p>;

  const live = votingStatus(comp) === "live";
  const list = ranked(contestants, votes);
  const total = list.reduce((s, c) => s + c.votes, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-14">
      <div className="text-center">
        <StatusBadge c={comp} />
        <p className="eyebrow mt-4">{comp.category === "miss" ? "Miss" : "Mister"} · {comp.edition}</p>
        <h1 className="mt-2 text-4xl text-gold md:text-6xl">{comp.title}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{comp.description}</p>
        {comp.voting_ends_at && live && (
          <p className="mt-3 text-sm text-primary">Voting ends {new Date(comp.voting_ends_at).toLocaleString()}</p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">One vote per competition per day. Sign in required.</p>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_340px]">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {contestants.map((c) => (
            <ContestantCard
              key={c.id}
              c={c}
              votes={votes[c.id] ?? 0}
              canVote={live}
              voting={vote.isPending && vote.variables === c.id}
              onVote={() => vote.mutate(c.id)}
            />
          ))}
          {contestants.length === 0 && <p className="col-span-full text-muted-foreground">No contestants yet.</p>}
        </div>
        <aside className="h-fit border border-border bg-card p-5 lg:sticky lg:top-20">
          <h2 className="flex items-center justify-between text-lg">Live Results <span className="h-2 w-2 animate-pulse rounded-full bg-primary" /></h2>
          <p className="text-xs text-muted-foreground">{total.toLocaleString()} total votes</p>
          <ol className="mt-4 space-y-4">
            {list.map((c, i) => (
              <li key={c.id}>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-5 font-display text-primary">{i + 1}</span>
                  <Flag code={c.country_code} />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-primary">{total ? Math.round((c.votes / total) * 100) : 0}%</span>
                </div>
                <Progress value={total ? (c.votes / total) * 100 : 0} className="mt-1 h-1" />
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}
