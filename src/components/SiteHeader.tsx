import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Crown, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { AccountBadge, GoogleSignInButton } from "@/components/GoogleSignInButton";

const links = [
  { to: "/competitions", label: "Competitions" },
  { to: "/rankings", label: "Rankings" },
  { to: "/peoples-choice", label: "People's Choice" },
] as const;

export function SiteHeader() {
  const { user, isAdmin, isOrganizer } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  const navItems = (
    <>
      {links.map((l) => (
        <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="text-sm uppercase tracking-[0.2em] text-muted-foreground hover:text-primary" activeProps={{ className: "text-primary" }}>
          {l.label}
        </Link>
      ))}
      {isOrganizer && (
        <Link to="/organizer" onClick={() => setOpen(false)} className="text-sm uppercase tracking-[0.2em] text-muted-foreground hover:text-primary" activeProps={{ className: "text-primary" }}>
          Organizer
        </Link>
      )}
      {isAdmin && (
        <Link to="/admin" onClick={() => setOpen(false)} className="text-sm uppercase tracking-[0.2em] text-muted-foreground hover:text-primary" activeProps={{ className: "text-primary" }}>
          Super Admin
        </Link>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Crown className="h-6 w-6 text-primary" />
          <span className="font-display text-lg font-semibold tracking-[0.15em] text-gold">AI PAGEANT WORLD</span>
        </Link>
        <nav className="hidden items-center gap-6 lg:flex">{navItems}</nav>
        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              {!isOrganizer && (
                <Button asChild variant="ghost" size="sm"><Link to="/become-organizer">Become Organizer</Link></Button>
              )}
              <div className="max-w-[180px]"><AccountBadge user={user} /></div>
              <Button variant="goldOutline" size="sm" onClick={signOut}>Sign out</Button>
            </>
          ) : (
            <>
              <GoogleSignInButton label="Sign in with Google" />
              <Button asChild variant="ghost" size="sm"><Link to="/auth">Other options</Link></Button>
            </>
          )}
        </div>
        <button className="lg:hidden text-primary" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="flex flex-col gap-4 border-t border-border px-4 py-6 lg:hidden">
          {navItems}
          {user ? (
            <>
              {!isOrganizer && <Link to="/become-organizer" onClick={() => setOpen(false)} className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Become Organizer</Link>}
              <AccountBadge user={user} />
              <Button variant="goldOutline" onClick={signOut}>Sign out</Button>
            </>
          ) : (
            <>
              <GoogleSignInButton label="Sign in with Google" className="w-full" />
              <Link to="/auth" onClick={() => setOpen(false)} className="text-center text-xs text-muted-foreground">Other sign-in options</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border py-10 text-center">
      <Crown className="mx-auto h-5 w-5 text-primary" />
      <p className="mt-3 font-display tracking-[0.2em] text-gold">AI PAGEANT WORLD</p>
      <p className="mt-2 text-xs text-muted-foreground">© {new Date().getFullYear()} The international stage of AI elegance.</p>
    </footer>
  );
}
