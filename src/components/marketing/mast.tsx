import Link from "next/link";

import { Stamp, TaglineImage } from "@/components/brand/logo";

/**
 * The mast: forest-deep ground, the stacked lockup above four link columns, and
 * the deck's edge treatment closing it. Deliberately no newsletter band; the
 * e-mail preferences live in the app, so no page ends by asking for an address.
 *
 * Three of these links land on routes that step 6 and step 7 create: the help
 * articles `privacy`, `terms-of-sale` and `licences` (seeded in step 6), and the
 * signed-in `/app` routes. They are real destinations, not decoration.
 */
const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/books", label: "Books" },
      { href: "/pricing", label: "Pricing" },
      { href: "/playground", label: "Playground" },
    ],
  },
  {
    title: "Learn",
    links: [
      { href: "/help", label: "Help centre" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/app", label: "Your library" },
      { href: "/app/tickets", label: "Support tickets" },
      { href: "/app/settings", label: "E-mail settings" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/help/privacy", label: "Privacy" },
      { href: "/help/terms-of-sale", label: "Terms of sale" },
      { href: "/help/licences", label: "Licences" },
    ],
  },
];

export function Mast() {
  return (
    <footer className="band-deep section--tight">
      <div className="container grid gap-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,auto)_minmax(0,1fr)] lg:gap-20">
          <Stamp size={64} />
          <div className="cols-4">
            {COLUMNS.map((column) => (
              <div key={column.title} className="grid content-start gap-3">
                <h2 className="eyebrow">{column.title}</h2>
                <ul className="grid gap-2">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="footer-link-slide text-sm text-paper/80">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="hair" />


        <div className="flex flex-wrap justify-between gap-4 font-outlier text-xs text-paper/70">
          <p>© 2026 LOCK.IN. Prices in Indonesian rupiah (IDR).</p>
          <p>
            The playground terminal runs <code>busybox.wasm</code>, GPL-2.0, from the wasi-sh project;{" "}
            <Link href="/licenses/busybox-GPL-2.0.txt" className="text-paper underline">
              the licence text ships with this build
            </Link>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
