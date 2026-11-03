import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Crown } from "lucide-react";
import { Flag, ContestantCard } from "@/components/ContestantCard";
import { fetchAllResults, fetchContestants, ranked } from "@/lib/pageant";

export const Route = createFileRoute("/peoples-choice")({
  head: () => ({
    meta: [
      { title: "People's Choice Award — AI Pageant World" },
      { name: "description", content: "The contestant with the most votes worldwide wins the People's Choice Award." },
      { property: "og:title", content: "People's Choice Award — AI Pageant World" },
      { property: "og:description", content: "The world's favorite contestant, decided by your votes." },
    ],
  }),
  component: PeoplesChoice,
});

function PeoplesChoice() {
  const { data: contestants = [] } = useQuery({ queryKey: ["contestants"], queryFn: () => fetchContestants() });
  const { data: votes = {} } = useQuery({ queryKey: ["results", "all"], queryFn: fetchAllResults, refetchInterval: 5000 });
  const list = ranked(contestants, votes);
  const [winner, ...rest] = list;

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <div className="text-center">
        <Crown className="mx-auto h-10 w-10 text-primary" />
        <p className="eyebrow mt-4">Decided by the world</p>
        <h1 className="mt-2 text-4xl text-gold md:text-5xl">People's Choice Award</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">The contestant with the most votes across all competitions holds the People's Choice crown.</p>
      </div>
      {winner && (
        <Link to="/contestants/$id" params={{ id: winner.id }} className="mx-auto mt-12 grid max-w-3xl overflow-hidden border border-primary shadow-gold md:grid-cols-2">
          {winner.photo_url && <img src={winner.photo_url} alt={winner.name} className="aspect-[3/4] w-full object-cover" />}
          <div className="flex flex-col justify-center bg-card p-8">
            <p className="eyebrow">Current leader</p>
            <h2 className="mt-3 text-3xl text-gold">{winner.name}</h2>
            <p className="mt-3 flex items-center gap-2"><Flag code={winner.country_code} />{winner.country}</p>
            <p className="mt-6 font-display text-5xl text-primary">{winner.votes.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">total votes</p>
          </div>
        </Link>
      )}
      <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {rest.map((c, i) => <ContestantCard key={c.id} c={c} votes={c.votes} rank={i + 2} />)}
      </div>
    </div>
  );
}
