import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Crown, ShieldCheck, Activity, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContestantCard } from "@/components/ContestantCard";
import { CompetitionCard } from "@/components/CompetitionCard";
import { fetchAllResults, fetchCompetitions, fetchContestants, ranked } from "@/lib/pageant";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Pageant World — International AI Beauty Pageant Voting" },
      { name: "description", content: "Vote for your favorite Miss and Mister AI contestants from around the world. Live results, rankings and the People's Choice Award." },
      { property: "og:title", content: "AI Pageant World" },
      { property: "og:description", content: "Vote live in the world's most elegant AI beauty pageants." },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: comps = [] } = useQuery({ queryKey: ["competitions"], queryFn: fetchCompetitions });
  const { data: contestants = [] } = useQuery({ queryKey: ["contestants"], queryFn: () => fetchContestants() });
  const { data: votes = {} } = useQuery({ queryKey: ["results", "all"], queryFn: fetchAllResults, refetchInterval: 10000 });
  const top = ranked(contestants, votes).slice(0, 4);

  return (
    <div>
      <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden">
        <img src="/images/hero.jpg" alt="Golden crown on stage" className="absolute inset-0 h-full w-full object-cover opacity-60" width={1600} height={912} />
        <div className="absolute inset-0 bg-fade" />
        <div className="relative z-10 max-w-3xl px-4 text-center">
          <p className="eyebrow">The International Stage · Season 2026</p>
          <h1 className="mt-6 text-5xl font-bold leading-tight text-gold md:text-7xl">AI PAGEANT WORLD</h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Where elegance meets intelligence. Discover contestants from every nation and crown your champion.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild variant="gold" size="lg"><Link to="/competitions">Vote Now</Link></Button>
            <Button asChild variant="goldOutline" size="lg"><Link to="/rankings">Live Rankings</Link></Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:grid-cols-3">
        {[
          { icon: ShieldCheck, t: "Secure Voting", d: "One verified vote per competition, every day." },
          { icon: Activity, t: "Live Results", d: "Watch the leaderboard move in real time." },
          { icon: Trophy, t: "People's Choice", d: "The world decides its favorite contestant." },
        ].map(({ icon: Icon, t, d }) => (
          <div key={t} className="border border-border p-6 text-center">
            <Icon className="mx-auto h-8 w-8 text-primary" />
            <h3 className="mt-4 text-lg">{t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-8 text-center">
          <p className="eyebrow">Competitions</p>
          <h2 className="mt-2 text-3xl md:text-4xl">The Global Crowns</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {comps.map((c) => <CompetitionCard key={c.id} c={c} />)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="eyebrow">Leading now</p>
            <h2 className="mt-2 flex items-center gap-3 text-3xl md:text-4xl"><Crown className="h-7 w-7 text-primary" /> Top Contestants</h2>
          </div>
          <Link to="/rankings" className="text-sm uppercase tracking-[0.2em] text-primary">All rankings →</Link>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {top.map((c, i) => <ContestantCard key={c.id} c={c} votes={c.votes} rank={i + 1} />)}
        </div>
      </section>
    </div>
  );
}
