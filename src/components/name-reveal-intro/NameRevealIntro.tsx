"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import gsap from "gsap";
import "./NameRevealIntro.css";

/* ──────────────────────────────────────────────────────────────────────────
 * NameRevealIntro
 *
 * A cinematic typographic loading/intro animation: a sequence of "beats"
 * cycles through different typographic treatments (display, condensed,
 * tracked, compressed, monogram, settled) to reveal a name or word set,
 * then dismisses itself and hands focus back to the page.
 *
 * Standalone extraction — no dependency on any host design system. Colors
 * and fonts are controlled via CSS custom properties (see NameRevealIntro.css)
 * so it can be dropped into any project and re-themed.
 *
 * Accessibility (fixed 2026-07-27): the whole overlay is `aria-hidden`.
 * A rapidly auto-cycling text animation has no coherent screen-reader
 * equivalent, so rather than partially exposing it (which is what the
 * previous version did — some chrome hidden, the beat headings not), it's
 * treated as fully decorative. It never receives focus, and ANY keyboard
 * input while it's showing (Tab, Escape, Enter, Space) or a click dismisses
 * it immediately — so a keyboard-only user's first keypress lands them
 * straight on real page content instead of getting stuck behind or inside
 * a hidden overlay. This means the host page's real content (e.g. whatever
 * `focusTargetId` points to) MUST carry the same information — name, role,
 * etc. — in accessible markup on its own; this component is a bonus for
 * sighted users, not the only place that content exists.
 *
 * Peer dependencies: react, gsap, motion (framer-motion's "motion" package).
 * ────────────────────────────────────────────────────────────────────────── */

export type Treatment =
  | "display"
  | "condensed"
  | "tracked"
  | "compressed"
  | "monogram"
  | "settled";

export type Beat = {
  /** Text shown for this beat. */
  label: string;
  /** Typographic treatment applied to the label. */
  treatment: Treatment;
  /** Short tag shown in the top-left corner mark (e.g. roman numeral). */
  tag: string;
};

export const DEFAULT_BEATS: Beat[] = [
  { label: "KEVIN", treatment: "display", tag: "I" },
  { label: "SEBASTIÁN", treatment: "condensed", tag: "II" },
  { label: "FRÍAS", treatment: "tracked", tag: "III" },
  { label: "GARCÍA", treatment: "compressed", tag: "IV" },
  { label: "KSFG", treatment: "monogram", tag: "V" },
  { label: "KEVIN", treatment: "settled", tag: "VI" },
];

export type NameRevealIntroProps = {
  /** Sequence of beats to play. Defaults to the KEVIN SEBASTIÁN FRÍAS GARCÍA sequence. */
  beats?: Beat[];
  /** Duration of each beat in milliseconds. */
  beatMs?: number;
  /** Extra hold time (seconds) on the final beat before auto-dismiss. */
  finalHoldSeconds?: number;
  /** Small caption shown above the settled beat's headline (final beat only). */
  eyebrow?: string;
  /** Small caption shown below the settled beat's headline (final beat only). */
  caption?: string;
  /** sessionStorage key used to skip replaying the intro within a session. Pass null to always play. */
  persistKey?: string | null;
  /** Below this viewport width (px), the intro is skipped entirely. */
  minWidthToPlay?: number;
  /** Called once the intro has fully dismissed (auto or skipped by user). */
  onComplete?: () => void;
  /** id of the element to focus once the intro dismisses. Falls back to document.body. */
  focusTargetId?: string;
};

const HARD_CUT = { duration: 0.14, ease: [0.7, 0, 0.3, 1] as const };
const SOFT_CUT = { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const };

export function NameRevealIntro({
  beats = DEFAULT_BEATS,
  beatMs = 760,
  finalHoldSeconds = 1.4,
  eyebrow = "— portfolio —",
  caption,
  persistKey = "intro:played",
  minWidthToPlay = 640,
  onComplete,
  focusTargetId = "main-content",
}: NameRevealIntroProps) {
  const prefersReducedMotion = useReducedMotion();
  // Start active so the overlay is present before hydration and covers the
  // page beneath it. The effect below flips it off when the intro has
  // already played this session or motion is reduced.
  const [active, setActive] = useState(true);
  const [beat, setBeat] = useState(0);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const dismiss = useCallback(() => {
    tlRef.current?.kill();
    tlRef.current = null;
    setActive(false);
    if (persistKey) {
      try {
        sessionStorage.setItem(persistKey, "1");
      } catch {}
    }
    const target = focusTargetId ? document.getElementById(focusTargetId) : null;
    (target ?? document.body).focus?.();
    onComplete?.();
  }, [persistKey, focusTargetId, onComplete]);

  useEffect(() => {
    let played = false;
    if (persistKey) {
      try {
        played = sessionStorage.getItem(persistKey) === "1";
      } catch {}
    }
    if (played || prefersReducedMotion || window.innerWidth < minWidthToPlay) {
      if (window.innerWidth < minWidthToPlay && persistKey) {
        try {
          sessionStorage.setItem(persistKey, "1");
        } catch {}
      }
      setActive(false);
      if (!played) onComplete?.();
      return;
    }

    // Lock scroll while the intro plays.
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    const tl = gsap.timeline({
      onComplete: () => {
        document.documentElement.style.overflow = prevOverflow;
        dismiss();
      },
    });

    beats.forEach((_, i) => {
      tl.call(() => setBeat(i), undefined, i * (beatMs / 1000));
    });
    tl.to({}, { duration: finalHoldSeconds });

    tlRef.current = tl;

    return () => {
      tl.kill();
      document.documentElement.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersReducedMotion]);

  // The overlay is aria-hidden and must never hold focus (see the file-level
  // comment above), so instead of parking focus on it, any keyboard input at
  // all dismisses it while it's active — Tab included, not just the
  // "intentional skip" keys, so a keyboard user can't get stuck tabbing
  // toward content they can't see behind it.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " " || e.key === "Tab") {
        e.preventDefault();
        dismiss();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, dismiss]);

  const current = beats[beat];

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          onClick={dismiss}
          aria-hidden="true"
          className="nri-overlay"
        >
          <Grain />

          <CornerMarks beat={current.tag} total={beats.length} />

          <div className="nri-stage">
            <AnimatePresence mode="wait">
              <BeatLayer key={beat} beat={current} eyebrow={eyebrow} caption={caption} />
            </AnimatePresence>
          </div>

          <SkipHint />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ───────────────────────── Beat renderer ───────────────────────── */

function BeatLayer({
  beat,
  eyebrow,
  caption,
}: {
  beat: Beat;
  eyebrow?: string;
  caption?: string;
}) {
  switch (beat.treatment) {
    case "display":
      return <DisplayBeat label={beat.label} />;
    case "condensed":
      return <CondensedBeat label={beat.label} />;
    case "tracked":
      return <TrackedBeat label={beat.label} />;
    case "compressed":
      return <CompressedBeat label={beat.label} />;
    case "monogram":
      return <MonogramBeat label={beat.label} />;
    case "settled":
      return <SettledBeat label={beat.label} eyebrow={eyebrow} caption={caption} />;
  }
}

/** Display, scale punch on enter, scale-down on exit */
function DisplayBeat({ label }: { label: string }) {
  return (
    <motion.h2
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 1.04, opacity: 0 }}
      transition={HARD_CUT}
      className="nri-display"
    >
      {label}
    </motion.h2>
  );
}

/** Ultra-condensed (scaleX clamp) */
function CondensedBeat({ label }: { label: string }) {
  return (
    <motion.h2
      initial={{ scaleX: 1, opacity: 0 }}
      animate={{ scaleX: 0.34, opacity: 1 }}
      exit={{ scaleX: 0.34, opacity: 0 }}
      transition={HARD_CUT}
      className="nri-condensed"
    >
      {label}
    </motion.h2>
  );
}

/** Wide tracking, light weight, sliced reveal */
function TrackedBeat({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ clipPath: "inset(0 0 100% 0)" }}
      animate={{ clipPath: "inset(0 0 0% 0)" }}
      exit={{ clipPath: "inset(100% 0 0 0)" }}
      transition={SOFT_CUT}
      className="nri-tracked-wrap"
    >
      <h2 className="nri-tracked">{label}</h2>
    </motion.div>
  );
}

/** Vertical compression + bold weight swap, per-letter stagger */
function CompressedBeat({ label }: { label: string }) {
  const letters = Array.from(label);
  return (
    <motion.h2
      initial={{ scaleY: 1.6, opacity: 0 }}
      animate={{ scaleY: 0.62, opacity: 1 }}
      exit={{ scaleY: 0.62, opacity: 0 }}
      transition={HARD_CUT}
      className="nri-compressed"
    >
      {letters.map((ch, i) => (
        <motion.span
          key={i}
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.18, delay: i * 0.018, ease: [0.7, 0, 0.3, 1] }}
        >
          {ch}
        </motion.span>
      ))}
    </motion.h2>
  );
}

/** Small monogram framed by brackets — logo-system moment */
function MonogramBeat({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={HARD_CUT}
      className="nri-monogram"
    >
      <span aria-hidden className="nri-dim">
        [
      </span>
      <span>{label}</span>
      <span aria-hidden className="nri-dim">
        ]
      </span>
    </motion.div>
  );
}

/** Settled — soft fade, sits on screen before dismissal */
function SettledBeat({
  label,
  eyebrow,
  caption,
}: {
  label: string;
  eyebrow?: string;
  caption?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={SOFT_CUT}
      className="nri-settled"
    >
      {eyebrow && (
        <span aria-hidden className="nri-eyebrow">
          {eyebrow}
        </span>
      )}
      <h2 className="nri-settled-label">{label}</h2>
      {caption && (
        <span aria-hidden className="nri-caption">
          {caption}
        </span>
      )}
    </motion.div>
  );
}

/* ───────────────────────── Chrome ───────────────────────── */

/** Halftone grain — same restrained texture used across the rest of the
 * design system (see the .grain overlay in the style reference sheet).
 * Purely decorative: aria-hidden, no pointer events. */
function Grain() {
  return (
    <svg aria-hidden className="nri-grain">
      <filter id="nri-grain-noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#nri-grain-noise)" />
    </svg>
  );
}

function CornerMarks({ beat, total }: { beat: string; total: number }) {
  return (
    <>
      <span aria-hidden className="nri-corner nri-corner-tl">
        Intro / {beat}
      </span>
      <span aria-hidden className="nri-corner nri-corner-tr">
        00{total}
      </span>
      <span aria-hidden className="nri-corner nri-corner-bl">
        {new Date().getFullYear()}
      </span>
    </>
  );
}

function SkipHint() {
  return (
    <span aria-hidden className="nri-corner nri-corner-br">
      Tap to skip
    </span>
  );
}
