import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Competition = Tables<"competitions">;
export type Contestant = Tables<"contestants">;

export function flagUrl(code: string) {
  return `https://flagcdn.com/w80/${code.toLowerCase()}.png`;
}

export function votingStatus(c: Competition): "live" | "upcoming" | "closed" {
  const now = Date.now();
  if (!c.voting_open) return c.voting_ends_at && new Date(c.voting_ends_at).getTime() < now ? "closed" : "upcoming";
  if (c.voting_starts_at && new Date(c.voting_starts_at).getTime() > now) return "upcoming";
  if (c.voting_ends_at && new Date(c.voting_ends_at).getTime() <= now) return "closed";
  return "live";
}

export async function fetchCompetitions() {
  const { data, error } = await supabase
    .from("competitions")
    .select("*")
    .eq("published", true)
    .order("created_at");
  if (error) throw error;
  return data;
}

export async function fetchCompetitionBySlug(slug: string) {
  const { data, error } = await supabase.from("competitions").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchContestants(competitionId?: string) {
  let q = supabase.from("contestants").select("*").order("name");
  if (competitionId) q = q.eq("competition_id", competitionId);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function fetchAllResults() {
  const { data, error } = await supabase.rpc("all_results");
  if (error) throw error;
  const map: Record<string, number> = {};
  (data ?? []).forEach((r) => (map[r.contestant_id] = Number(r.votes)));
  return map;
}

export function ranked(contestants: Contestant[], votes: Record<string, number>) {
  return [...contestants]
    .map((c) => ({ ...c, votes: votes[c.id] ?? 0 }))
    .sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name));
}
