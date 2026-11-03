import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ManageCompetitions } from "@/components/ManageCompetitions";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/organizer")({
  head: () => ({
    meta: [
      { title: "Organizer Dashboard — AI Pageant World" },
      { name: "description", content: "Manage your pageant competitions, contestants and voting." },
      { property: "og:title", content: "Organizer Dashboard — AI Pageant World" },
      { property: "og:description", content: "Manage your pageants." },
    ],
  }),
  component: OrganizerPage,
});

function OrganizerPage() {
  const { isOrganizer, loading } = useAuth();
  if (loading) return <p className="py-20 text-center text-muted-foreground">Loading…</p>;
  if (!isOrganizer)
    return (
      <div className="py-20 text-center">
        <p>You need organizer access to view this page.</p>
        <Button asChild variant="gold" className="mt-6"><Link to="/become-organizer">Apply to become an organizer</Link></Button>
      </div>
    );
  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <p className="eyebrow">Dashboard</p>
      <h1 className="mt-2 mb-10 text-4xl text-gold">Organizer</h1>
      <ManageCompetitions scope="mine" />
    </div>
  );
}
