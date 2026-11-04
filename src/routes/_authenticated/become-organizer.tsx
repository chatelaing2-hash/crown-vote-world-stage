import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/become-organizer")({
  head: () => ({
    meta: [
      { title: "Become an Organizer — AI Pageant World" },
      { name: "description", content: "Apply to host your own AI pageant competition." },
      { property: "og:title", content: "Become an Organizer — AI Pageant World" },
      { property: "og:description", content: "Host your own AI pageant." },
    ],
  }),
  component: BecomeOrganizer,
});

function BecomeOrganizer() {
  const { user, isOrganizer } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({ organization_name: "", country: "", website: "", message: "" });
  const { data: app } = useQuery({
    queryKey: ["my-application", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("organizer_applications").select("*").eq("user_id", user!.id).maybeSingle()).data,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("organizer_applications").insert({ ...form, user_id: user!.id });
    if (error) { toast.error(error.message); return; }
    toast.success("Application submitted!");
    qc.invalidateQueries({ queryKey: ["my-application"] });
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-14">
      <p className="eyebrow text-center">Organizer Program</p>
      <h1 className="mt-2 text-center text-4xl text-gold">Host a Pageant</h1>
      {isOrganizer ? (
        <p className="mt-8 text-center">You are an approved organizer. Visit your Organizer dashboard.</p>
      ) : app ? (
        <div className="mt-8 border border-border bg-card p-6 text-center">
          <p>Application for <span className="text-primary">{app.organization_name}</span></p>
          <p className="mt-2 eyebrow">Status: {app.status}</p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4 border border-border bg-card p-6">
          <div><Label>Organization name</Label><Input required value={form.organization_name} onChange={(e) => setForm({ ...form, organization_name: e.target.value })} /></div>
          <div><Label>Country</Label><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
          <div><Label>Website</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
          <div><Label>Tell us about your pageant</Label><Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
          <Button type="submit" variant="gold" className="w-full">Submit application</Button>
        </form>
      )}
    </div>
  );
}
