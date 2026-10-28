import Link from "next/link";
import type { Metadata } from "next";

import { Check, ChevronDown } from "@/components/icons";
import { TaglineStrip } from "@/components/marketing/tagline-strip";
import { currentUser } from "@/lib/auth";
import { roadmap, type NodeState } from "@/lib/roadmap";

import "./roadmap.css";

export const metadata: Metadata = {
  title: "Roadmap | LOCK.IN",
  description: "The complete developer learning progression across Beginner, Intermediate, and Expert tiers.",
};

const TIERS = [
  { id: "beginner", label: "Beginner", blurb: "Foundations: HTML, CSS, JavaScript, your first deploy." },
  { id: "intermediate", label: "Intermediate", blurb: "Real-world engineering: Node.js, CLI scripts, Python, Web APIs." },
  { id: "expert", label: "Expert · Spesialis Riko", blurb: "Performance, system design, security, database tuning, cloud scale." },
];

type Phase = "done" | "locked" | "ready";

const PHASE_LABEL: Record<Phase, string> = { done: "Done", locked: "Locked", ready: "Ready" };

function phaseOf(node: NodeState): Phase {
  if (node.complete) return "done";
  return node.lockedBy.length > 0 ? "locked" : "ready";
}

/**
 * One node. The title is the action, the chip is its state, the counter is the
 * reader's progress through the chapter; the keywords and the prerequisites sit
 * in a `<details>` closed by default, so eighteen nodes read as a map instead of
 * as eighteen paragraphs.
 */
function NodeCard({ node, href, prerequisites }: { node: NodeState; href: string; prerequisites: string }) {
  const phase = phaseOf(node);
  const share = node.total > 0 ? Math.round((node.done / node.total) * 100) : 0;

  return (
    <article className="node" data-state={phase} data-reveal="plate">
      <div className="node__body">
        <div className="node__top">
          <span className="chip node__state" data-state={phase}>
            {phase === "done" ? <Check /> : null}
            {PHASE_LABEL[phase]}
          </span>
        </div>

        <h3 className="node__title">
          <Link className="node__link" href={href}>
            {node.node.title}
          </Link>
        </h3>
      </div>

      <details className="node__more">
        <summary className="node__toggle">
          <span className="node__progress" aria-hidden="true">
            <span style={{ width: `${share}%` }} />
          </span>
          <span className="num">
            {node.done}/{node.total}
          </span>
          <span className="visually-hidden">sections done. What this node teaches and requires.</span>
          <ChevronDown />
        </summary>
        <div className="node__facts">
          <p className="node__fact">
            <span className="node__term">Teaches</span> {node.node.teaches.join(" · ")}
          </p>
          <p className="node__fact">
            <span className="node__term">Requires</span> {prerequisites}
          </p>
        </div>
      </details>
    </article>
  );
}

export default async function RoadmapPage() {
  const session = await currentUser();
  const view = await roadmap(session?.user?.id);

  const byTier = (tier: string) => view.nodes.filter((n) => n.tier === tier);
  const titleOf = new Map(view.nodes.map((n) => [n.node.id, n.node.title]));
  const bookHref = (slug: string) => (session ? `/app/books/${slug}` : `/books/${slug}`);

  return (
    <div className="section">
      <div className="container">
        <header className="pagehead roadmap-head" data-reveal="up">
          <h1>From first tag to <span className="highlight-mint">systems engineer</span>.</h1>
          <p className="lead" style={{ color: "var(--color-ink-2)" }}>
            Clear prerequisite chains. No guesswork about what to learn next.
          </p>

          <div className="roadmap-open__status">
            <span className="chip" style={{ background: "var(--color-paper-3)" }}>
              {view.completed} / {view.nodes.length} nodes cleared
            </span>
            {session ? (
              <span className="roadmap-open__who">Signed in as {session.user.name}</span>
            ) : (
              <Link href="/login" className="btn btn--quiet btn--sm">
                Sign in to save progress
              </Link>
            )}
          </div>

          {/* The opening band: what to do next, and the whole progression as
              three lanes of six nodes each. */}
          <div className="roadmap-open__body">
            {view.next ? (
              <aside className="upnext" data-reveal="plate">
                <div>
                  <h2 className="upnext__title"><span className="highlight-mint">{view.next.node.title}</span></h2>
                  <p className="upnext__meta">Next up · {view.next.bookTitle}</p>
                </div>
                <Link href={bookHref(view.next.bookSlug)} className="btn btn--sm" style={{ alignSelf: "flex-start" }}>
                  Continue Learning
                </Link>
              </aside>
            ) : null}

            <nav className="lanes" aria-label="Jump to a tier" data-reveal="up">
              {TIERS.map((tier) => {
                const nodes = byTier(tier.id);
                const done = nodes.filter((n) => n.complete).length;
                return (
                  <div className="lane" key={tier.id}>
                    <div className="lane__head">
                      <Link className="lane__name" href={`#${tier.id}`}>
                        {tier.label}
                      </Link>
                      <span className="lane__count num">
                        {done} / {nodes.length}
                      </span>
                      <span className="visually-hidden">nodes done</span>
                    </div>
                    <div className="lane__ticks" aria-hidden="true">
                      {nodes.map((n) => (
                        <span className="lane__tick" key={n.node.id} data-state={phaseOf(n)} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>
        </header>

        <div style={{ marginBlock: "var(--space-2xl)" }} data-reveal="up">
          <TaglineStrip
            tone="forest"
            items={["TIER 1: WEB FOUNDATIONS", "TIER 2: SYSTEMS ARCHITECTURE", "TIER 3: DISTRIBUTED ENGINES", "PREREQUISITE CHAINS", "MEASURED MASTERY"]}
          />
        </div>

        <div className="tiers">
          {TIERS.map((tier) => {
            const nodes = byTier(tier.id);
            const done = nodes.filter((n) => n.complete).length;
            return (
              <section className="tier" key={tier.id} id={tier.id} aria-labelledby={`${tier.id}-title`} data-reveal="up">
                <div className="tier__head">
                  <div className="tier__row">
                    <h2 id={`${tier.id}-title`}><span className="highlight-mint">{tier.label}</span> Tier</h2>
                    <span className="tier__count num">
                      {done} / {nodes.length} done
                    </span>
                  </div>
                  <p className="tier__blurb">{tier.blurb}</p>
                </div>

                <div className="nodes" data-reveal-group>
                  {nodes.map((n) => (
                    <NodeCard
                      key={n.node.id}
                      node={n}
                      href={bookHref(n.bookSlug)}
                      prerequisites={
                        n.node.requires.length > 0
                          ? n.node.requires.map((id) => titleOf.get(id) ?? id).join(" · ")
                          : "nothing: this node starts the chain"
                      }
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}