import Link from "next/link";
import { BookOpen, CalendarDays, ChartNoAxesCombined, CircleUserRound, Gauge, LibraryBig, MessageCircleMore, Sparkles, Volume2 } from "lucide-react";
import { logout } from "@/app/(app)/actions";

const nav = [
  ["Dashboard", "/dashboard", Gauge],
  ["Today", "/today", Sparkles],
  ["4-Week Plan", "/plan", CalendarDays],
  ["Library", "/library", LibraryBig],
  ["Chunks", "/chunks", BookOpen],
  ["Speaking", "/speaking", Volume2],
  ["Progress", "/progress", ChartNoAxesCombined],
  ["Checkpoint", "/checkpoint", MessageCircleMore],
] as const;

export function AppShell({ children, email }: { children: React.ReactNode; email?: string | null }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand">English Learning Hub</div>
          <div className="brand-sub">Native input → active English</div>
        </div>
        <nav className="nav" aria-label="Primary">
          {nav.map(([label, href, Icon]) => (
            <Link href={href} key={href} className="row">
              <Icon size={17} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="row" style={{marginBottom:12}}><CircleUserRound size={18}/><span className="small">{email ?? "Signed in"}</span></div>
          <form action={logout}><button className="btn ghost" type="submit">Sign out</button></form>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="row"><span className="tag">A2 → B1 routine</span><span className="small muted">60 min/day</span></div>
          <div className="row"><span className="tag success">🔥 Keep the streak</span></div>
        </header>
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
