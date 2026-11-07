import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function useVote() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async (contestantId: string) => {
      if (!user) {
        navigate({ to: "/auth" });
        throw new Error("Please sign in with Google to vote");
      }
      const providers = (user.app_metadata?.["providers"] as string[] | undefined) ?? [user.app_metadata?.["provider"]];
      if (!providers.includes("google")) {
        throw new Error("Voting requires a Google account. Please sign out and sign in with Google.");
      }
      const { error } = await supabase.rpc("cast_vote", { _contestant_id: contestantId });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Your vote has been counted! 👑");
      qc.invalidateQueries({ queryKey: ["results"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
