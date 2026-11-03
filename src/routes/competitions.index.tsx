import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CompetitionCard } from "@/components/CompetitionCard";
import { fetchCompetitions } from "@/lib/pageant";

export const Route = createFileRoute("/competitions/")({
  head: () => ({
    meta: [
      { title: "Competitions — AI Pageant World" },
      { name: "description", content: "Browse all Miss and Mister AI pageant competitions and vote for your favorites." },
      { property: "og:title", content: "Competitions — AI Pageant World" },
      { property: "og:description", content: "All Miss and Mister AI pageants in one place." },
    ],
  }),
  component: CompetitionsPage,
});

function CompetitionsPage() {
  const [filter, setFilter] = useState<"all" | "miss" | "mister">("all");
  const { data = [], isLoading } = useQuery({ queryKey: ["competitions"], queryFn: fetchCompetitions });
  const list = data.filter((c) => filter === "all" || c.category === filter);
  return (
    <div className="mx-auto max-w-7xl px-4 py-14">
      <p className="eyebrow text-center">Choose your pageant</p>
      <h1 className="mt-2 text-center text-4xl md:text-5xl text-gold">Competitions</h1>
      <div className="mt-8 flex justify-center gap-2">
        {(["all", "miss", "mister"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`border px-4 py-2 text-xs uppercase tracking-[0.25em] ${filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-primary"}`}>
            {f === "all" ? "All" : f === "miss" ? "Miss" : "Mister"}
          </button>
        ))}
      </div>
      {isLoading ? <p className="mt-10 text-center text-muted-foreground">Loading…</p> : (
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => <CompetitionCard key={c.id} c={c} />)}
          {list.length === 0 && <p className="col-span-full text-center text-muted-foreground">No competitions yet.</p>}
        </div>
      )}
    </div>
  );
}
