"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Wordmark } from "@/components/brand/logo";
import { Close, Menu } from "@/components/icons";
import { useSession, signOut } from "@/lib/auth-client";

interface UserProp {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
}

interface ProfileProp {
  xp?: number | null;
  streakCurrent?: number | null;
}

interface Props {
  initialUser?: UserProp | null;
  initialProfile?: ProfileProp | null;
}

const PUBLIC_NAV = [
  { href: "/books", label: "Books" },
  { href: "/pricing", label: "Pricing" },
  { href: "/playground", label: "Playground" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/help", label: "Help" },
];

const APP_NAV = [
  { href: "/app", label: "Dashboard" },
  { href: "/books", label: "Books" },
  { href: "/playground", label: "Playground" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/app/quests", label: "Quests" },
  { href: "/help", label: "Help" },
];

function isCurrent(pathname: string, href: string) {
  return pathname === href || (href !== "/" && href !== "/app" && pathname.startsWith(`${href}/`));
}


/**
 * Edge-aligned chrome: the wordmark on the left, five links centre-right, one
 * account action pair on the right, one hairline under it. Below `lg` the links
 * move into a sheet that a labelled button opens, never a bare hamburger.
 */
export function Masthead({ initialUser, initialProfile }: Props = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { data: clientSession } = useSession();
  const user = initialUser ?? clientSession?.user;
  const streak = initialProfile?.streakCurrent ?? 0;

  const navItems = user ? APP_NAV : PUBLIC_NAV;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastY && currentY > 60) {
        setHidden(true);
      } else if (currentY < lastY || currentY <= 20) {
        setHidden(false);
      }
      lastY = currentY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className={`masthead transition-transform duration-300 ${hidden && !open ? "-translate-y-full" : "translate-y-0"}`}>
      <div className="container flex items-center gap-4 py-3">
        <Link href={user ? "/app" : "/"} className="mr-auto shrink-0">
          <Wordmark height={28} />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-6 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-ink-2 hover:text-ink font-medium"
              aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
          {user && "role" in user && user.role === "admin" ? (
            <Link href="/admin" className="chip" style={{ fontSize: "11px", fontWeight: 700 }}>
              Admin
            </Link>
          ) : null}
        </nav>

        {user ? (
          <div className="hidden items-center gap-2 lg:flex">
            {streak > 0 ? (
              <span
                className="chip"
                title={`${streak} day streak`}
                style={{
                  background: "color-mix(in oklab, var(--color-accent) 22%, var(--color-paper))",
                  borderColor: "var(--color-accent)",
                  color: "var(--color-forest)",
                  fontSize: "var(--text-xs)",
                  fontWeight: 700,
                }}
              >
                🔥 {streak}d
              </span>
            ) : null}

            <Link
              href="/app"
              className="btn btn--quiet btn--sm"
              style={{ fontWeight: 600 }}
              aria-label="User profile"
            >
              {user.name?.split(" ")[0] ?? "Learner"}
            </Link>

            <Link
              href="/app/settings"
              className="btn btn--quiet btn--sm"
              aria-label="Account settings"
            >
              Settings
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className="btn btn--quiet btn--sm"
              style={{ color: "var(--color-muted)" }}
              aria-label="Sign out"
            >
              Sign out
            </button>
          </div>
         ) : (
          <div className="hidden items-center gap-2 lg:flex">
            <Link href="/login" className="btn btn--quiet btn--sm">
              Sign in
            </Link>
            <Link href="/register" className="btn btn--sm">
              Start free
            </Link>
          </div>
        )}

        <button
          ref={buttonRef}
          type="button"
          className="btn btn--quiet btn--sm lg:hidden"
          aria-expanded={open}
          aria-controls="site-menu"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <Close /> : <Menu />}
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open ? (
        <div id="site-menu" className="border-t border-rule bg-paper-3 lg:hidden">
          <div className="container flex flex-col gap-3 py-4">
            {user ? (
              <div
                style={{
                  padding: "var(--space-sm) var(--space-md)",
                  background: "var(--color-paper-2)",
                  borderRadius: "var(--radius-card)",
                  marginBottom: "var(--space-2xs)",
                }}
              >
                <div style={{ fontWeight: 700, color: "var(--color-ink)" }}>{user.name}</div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>{user.email}</div>
              </div>
            ) : null}

            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-md text-ink-2"
                aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}

            {user ? (
              <div className="flex flex-col gap-2 pt-2 border-t border-rule">
                <Link href="/app/settings" className="btn btn--quiet btn--sm" style={{ width: "100%", justifyContent: "center" }}>
                  User Settings &amp; Profile
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="btn btn--quiet btn--sm"
                  style={{ width: "100%", justifyContent: "center", color: "var(--color-error)" }}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-rule">
                <Link href="/login" className="btn btn--quiet btn--sm">
                  Sign in
                </Link>
                <Link href="/register" className="btn btn--sm">
                  Start free
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
