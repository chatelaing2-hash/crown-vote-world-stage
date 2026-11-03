import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ManageCompetitions } from "@/components/ManageCompetitions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchAllResults } from "@/lib/pageant";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Super Admin — AI Pageant World" },
      { name: "description", content: "Platform administration for AI Pageant World." },
      { property: "og:title", content: "Super Admin — AI Pageant World" },
      { property: "og:description", content: "Platform administration." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  if (loading) return <p className="py-20 text-center text-muted-foreground">Loading…</p>;
  if (!isAdmin) return <p className="py-20 text-center">Super Admin access required.</p>;
  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <p className="eyebrow">Control Room</p>
      <h1 className="mt-2 mb-8 text-4xl text-gold">Super Admin</h1>
      <Stats />
      <Tabs defaultValue="applications" className="mt-10">
        <TabsList className="flex-wrap">
          <TabsTrigger value="applications">Organizer Applications</TabsTrigger>
          <TabsTrigger value="users">Users & Roles</TabsTrigger>
          <TabsTrigger value="competitions">All Competitions</TabsTrigger>
        </TabsList>
        <TabsContent value="applications" className="mt-6"><Applications /></TabsContent>
        <TabsContent value="users" className="mt-6"><Users /></TabsContent>
        <TabsContent value="competitions" className="mt-6"><ManageCompetitions scope="all" /></TabsContent>
      </Tabs>
    </div>
  );
}

function Stats() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    refetchInterval: 10000,
    queryFn: async () => {
      const [comps, cons, users, results] = await Promise.all([
        supabase.from("competitions").select("id", { count: "exact", head: true }),
        supabase.from("contestants").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        fetchAllResults(),
      ]);
      return { comps: comps.count ?? 0, cons: cons.count ?? 0, users: users.count ?? 0, votes: Object.values(results).reduce((a, b) => a + b, 0) };
    },
  });
  const items = [["Competitions", data?.comps], ["Contestants", data?.cons], ["Users", data?.users], ["Total Votes", data?.votes]] as const;
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {items.map(([l, v]) => (
        <div key={l} className="border border-border bg-card p-5">
          <p className="eyebrow">{l}</p>
          <p className="mt-2 font-display text-3xl text-gold">{v ?? "—"}</p>
        </div>
      ))}
    </div>
  );
}

function Applications() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["applications"],
    queryFn: async () => (await supabase.from("organizer_applications").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const review = async (id: string, approve: boolean) => {
    const { error } = await supabase.rpc("review_organizer", { _application_id: id, _approve: approve });
    if (error) return toast.error(error.message);
    toast.success(approve ? "Organizer approved" : "Application rejected");
    qc.invalidateQueries({ queryKey: ["applications"] });
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  };
  if (!data.length) return <p className="text-muted-foreground">No applications yet.</p>;
  return (
    <div className="space-y-3">
      {data.map((a) => (
        <div key={a.id} className="flex flex-wrap items-center gap-4 border border-border bg-card p-4">
          <div className="flex-1">
            <p className="font-display text-lg">{a.organization_name}</p>
            <p className="text-xs text-muted-foreground">{[a.country, a.website].filter(Boolean).join(" · ")}</p>
            {a.message && <p className="mt-1 text-sm text-muted-foreground">{a.message}</p>}
          </div>
          <span className="eyebrow">{a.status}</span>
          <Button size="sm" variant="gold" disabled={a.status === "approved"} onClick={() => review(a.id, true)}>Approve</Button>
          <Button size="sm" variant="goldOutline" disabled={a.status === "rejected"} onClick={() => review(a.id, false)}>Reject</Button>
        </div>
      ))}
    </div>
  );
}

function Users() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
      ]);
      return (profiles ?? []).map((p) => ({ ...p, roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role) }));
    },
  });
  const toggle = async (uid: string, role: "organizer" | "super_admin", has: boolean) => {
    const { error } = has
      ? await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", role)
      : await supabase.from("user_roles").insert({ user_id: uid, role });
    if (error) return toast.error(error.message);
    toast.success("Roles updated");
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  };
  return (
    <div className="divide-y divide-border border border-border">
      {data.map((u) => {
        const org = u.roles.includes("organizer");
        const adm = u.roles.includes("super_admin");
        return (
          <div key={u.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="flex-1">
              <p>{u.display_name}</p>
              <p className="text-xs text-muted-foreground">{u.email}</p>
            </div>
            <span className="text-xs uppercase tracking-widest text-primary">{u.roles.join(" · ")}</span>
            <Button size="sm" variant={org ? "goldOutline" : "gold"} onClick={() => toggle(u.id, "organizer", org)}>{org ? "Remove organizer" : "Make organizer"}</Button>
            <Button size="sm" variant="ghost" disabled={u.id === user?.id} onClick={() => toggle(u.id, "super_admin", adm)}>{adm ? "Revoke admin" : "Make admin"}</Button>
          </div>
        );
      })}
    </div>
  );
}
