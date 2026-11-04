import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — AI Pageant World" },
      { name: "description", content: "Choose a new password for your AI Pageant World account." },
      { property: "og:title", content: "Reset Password — AI Pageant World" },
      { property: "og:description", content: "Choose a new password." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [pw, setPw] = useState("");
  const navigate = useNavigate();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    navigate({ to: "/" });
  };
  return (
    <form onSubmit={submit} className="mx-auto mt-20 max-w-sm space-y-4 border border-border bg-card p-8">
      <h1 className="text-center text-2xl text-gold">New Password</h1>
      <Input type="password" minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" required />
      <Button type="submit" variant="gold" className="w-full">Update password</Button>
    </form>
  );
}
