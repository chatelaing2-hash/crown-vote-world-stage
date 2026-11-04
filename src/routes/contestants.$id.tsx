import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Flag, PhotoUploadButton, pad } from "@/components/ContestantCard";
import { useAuth } from "@/lib/auth";
import { useVote } from "@/hooks/use-vote";
import { supabase } from "@/integrations/supabase/client";
import { votingStatus } from "@/lib/pageant";

export const Route = createFileRoute("/contestants/$id")({
  head: () => ({
    meta: [
      { title: "Contestant Profile — AI Pageant World" },
      { name: "description", content: "Contestant profile, biography and live vote count." },
      { property: "og:title", content: "Contestant Profile — AI Pageant World" },
      { property: "og:description", content: "Meet the contestant and cast your vote." },
    ],
  }),
  component: ContestantPage,
});

function ContestantPage() {
  const { id } = Route.useParams();
  const vote = useVote();
  const { isOrganizer } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["contestant", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("contestants").select("*, competitions(*)").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const { data: votes = 0 } = useQuery({
    queryKey: ["results", "contestant", id],
    enabled: !!data,
    refetchInterval: 5000,
    queryFn: async () => {
      const { data: r } = await supabase.rpc("competition_results", { _competition_id: data!.competition_id });
      return Number(r?.find((x) => x.contestant_id === id)?.votes ?? 0);
    },
  });

  if (isLoading) return <p className="py-20 text-center text-muted-foreground">Loading…</p>;
  if (!data) return <p className="py-20 text-center">Contestant not found.</p>;
  const comp = data.competitions;
  const live = comp ? votingStatus(comp) === "live" : false;

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-2">
      <div className="overflow-hidden border border-border shadow-gold">
        {data.photo_url ? <img src={data.photo_url} alt={data.name} className="aspect-[3/4] w-full object-cover" /> : <div className="flex aspect-[3/4] w-full items-center justify-center bg-muted"><span className="eyebrow">Photo coming soon</span></div>}
        {isOrganizer && <div className="p-3"><PhotoUploadButton c={data} /></div>}
      </div>
      <div className="flex flex-col justify-center">
        {comp && <Link to="/competitions/$slug" params={{ slug: comp.slug }} className="eyebrow">{comp.title} {comp.edition}</Link>}
        {data.position && <p className="mt-3 font-display text-primary">No. {pad(data.position)}</p>}
        <h1 className="mt-1 text-4xl text-gold md:text-5xl">{data.name}</h1>
        <div className="mt-4 flex items-center gap-3">
          <Flag code={data.country_code} className="h-6 w-9" />
          <span className="text-lg">{data.country}</span>
        </div>
        <dl className="mt-8 grid grid-cols-3 gap-4 border-y border-border py-6 text-center">
          <div><dt className="eyebrow">Age</dt><dd className="mt-1 text-xl">{data.age ?? "—"}</dd></div>
          <div><dt className="eyebrow">Height</dt><dd className="mt-1 text-xl">{data.height ?? "—"}</dd></div>
          <div><dt className="eyebrow">Votes</dt><dd className="mt-1 text-xl text-primary">{votes.toLocaleString()}</dd></div>
        </dl>
        <p className="mt-6 leading-relaxed text-muted-foreground">{data.bio}</p>
        <Button variant="gold" size="lg" className="mt-8" disabled={!live || vote.isPending} onClick={() => vote.mutate(id)}>
          {live ? (vote.isPending ? "Casting vote…" : `Vote for ${data.name.split(" ")[0]}`) : "Voting not open"}
        </Button>
      </div>
    </div>
  );
}
