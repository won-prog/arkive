import Link from "next/link";

const nav = [
  { href: "/", label: "Landing" },
  { href: "/simulator", label: "Simulator" },
  { href: "/color-matcher", label: "Color Matcher" },
  { href: "/shop", label: "Shop" },
  { href: "/flow", label: "Beauty Flow" },
  { href: "/hair-outline", label: "Hair Outline" }
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-root">
      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/" className="brand">Luminous AR</Link>
          <nav className="nav">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="nav-link">
                {item.label}
              </Link>
            ))}
          </nav>
          <button className="cta">Try AR</button>
        </div>
      </header>
      <main className="page-shell">{children}</main>
    </div>
  );
}
