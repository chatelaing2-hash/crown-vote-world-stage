import { toast } from "sonner";
import { lovable } from "@/integrations/lovable";
import { cn } from "@/lib/utils";

export async function signInWithGoogle() {
  const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
  if (r.error) toast.error(r.error.message ?? "Google sign-in failed");
}

export function GoogleSignInButton({ className, label = "Continue with Google" }: { className?: string; label?: string }) {
  return (
    <button
      type="button"
      onClick={signInWithGoogle}
      style={{ background: "#FFFFFF", color: "#1F1F1F", border: "1px solid #747775", fontFamily: "'Google Sans', system-ui, sans-serif" }}
      className={cn("inline-flex h-10 items-center justify-center gap-[10px] rounded-md px-3 text-sm font-medium leading-5 transition-opacity hover:opacity-90", className)}
    >
      <svg aria-hidden="true" width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
      {label}
    </button>
  );
}

export function AccountBadge({ user }: { user: { email?: string; user_metadata?: Record<string, unknown> } }) {
  const name = (user.user_metadata?.["full_name"] as string) || (user.user_metadata?.["name"] as string) || user.email;
  const avatar = (user.user_metadata?.["avatar_url"] as string) || (user.user_metadata?.["picture"] as string);
  return (
    <div className="flex min-w-0 items-center gap-2">
      {avatar ? (
        <img src={avatar} alt="" referrerPolicy="no-referrer" className="h-8 w-8 rounded-full border border-primary" />
      ) : (
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-primary text-xs text-primary">{(name ?? "?").charAt(0).toUpperCase()}</span>
      )}
      <div className="min-w-0 leading-tight">
        <p className="truncate text-xs text-foreground">{name}</p>
        {user.email && name !== user.email && <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>}
      </div>
    </div>
  );
}
