import { useEffect, useRef, type ComponentType, type SVGProps } from "react";
import { GithubIcon, LinkedinIcon, MailIcon, WhatsappIcon } from "../social-icon/SocialIcon";
import type { SocialLink } from "../../content/types";
import { assignChannelSlots, type PlacedChannel } from "./channelLayout";
import { cardCenter, dockFactors, dockValues, type DockCard } from "./dockHover";
import { dampStep, isSettled } from "../../motion/damping";
import { useReducedMotion } from "../../shell/useReducedMotion";
import { useMediaQuery } from "../../shell/useMediaQuery";
import "./channel-field.css";

/** Gaussian spread as a RATIO of the stage's rendered width, not px: the
 * stage is fitted (`min()` pair in `channel-field.css`) and is typically
 * ~1120-1192px wide, so a fixed 240px — the mockup's value on its 1440
 * canvas — would read proportionally wider here and pull two plates up at
 * once. `spread = stage.offsetWidth * DOCK_SPREAD_RATIO`; 0.167 ≈ 240/1440. */
const DOCK_SPREAD_RATIO = 0.167;
/** Vertical softening on the gaussian (`dockFactor`'s `dy` divides by
 * `spread * anisotropy`): a pointer sweeping ACROSS the field then raises one
 * moving lobe, not a whole column. The mockup's value. */
const DOCK_ANISOTROPY = 2.2;
/** 1.10, not a real dock's 1.4–2x and not the mockup's 1.26 — the
 * `docs/01_ART_DIRECTION.MD` Instrument-row cap. A HUD instrument
 * acknowledging the cursor, not an icon demanding attention. */
const DOCK_MAX_SCALE = 1.1;
/** Peak upward lift in px (the mockup's `-46 * .26 ≈ -12`, capped to 10).
 * Written to `--dock-lift` via `translate:`, kept off `transform:` so it
 * never fights the plain hover lift — see `channel-field.css`. */
const DOCK_MAX_LIFT_PX = 10;
/** Peak `--dock-z` bump. Below the hover/focus `+10` so a hovered plate
 * always wins the stack regardless of dock position. */
const DOCK_MAX_Z = 8;
/** Exponential-smoothing time constant for `--dock-scale` (`damping.ts`),
 * deliberately shorter than the 90ms `--dur-micro` the hover lift uses —
 * `tau`-based settling takes ~3×tau to read as "done", so matching 90ms
 * would settle around 270ms and read soft against this system's mechanical,
 * hard-cut motion philosophy (doc 07; this module's own Motion section in
 * `docs/design-exploration/contact-channel-field-2026-08-20.md`). Tune by
 * eye against that hover lift if this ever looks wrong — it is a judgment
 * call, not a measured value. */
const DOCK_TAU_MS = 52;

/**
 * CONTACT — the channel field.
 * Spec: `docs/design-exploration/contact-channel-field-2026-08-20.md`,
 * amended by `docs/design-exploration/design-import-2026-09-04/HANDOFF.md`
 * §1 (Instagram dropped, WhatsApp resolved, per-card clip-path cut).
 * Proof: `docs/contact.design-proof-v2.html`.
 *
 * Four channels across six unequal tracks (one, `c6`, deliberately empty —
 * reduced from five channels 2026-09-04 when Instagram was dropped), an
 * illustrated character figure bleeding off the bottom, and one Oxblood
 * marker anchored to its top-right clear zone.
 *
 * THREE THINGS ABOUT THIS COMPOSITION THAT ARE EASY TO UNDO BY ACCIDENT:
 *
 * 1. The plates are Field Olive on Paper — NOT a Field Olive background with
 *    Paper White plates on it. v1 was the latter and read as twice the visual
 *    weight of every other module on the site. `.cf` sets no background at
 *    all; the page's `--paper` shows through.
 *
 * 2. `.cf__figure` carries the ACTIVE asset's aspect ratio for its tier
 *    (912/1178 at ≥900px for `profile-animate-stand.png`, 1/1 below 900px
 *    for `profile-animate-sit.png`) — not a fixed square. At `contain` the
 *    paint then fills the element exactly, which is what lets the marker be
 *    positioned in percentages of that box without letterboxing drift. The
 *    ratio MUST stay on `.cf__figure`, never on `.cf__figure-img`, and
 *    `.cf__figure`'s `height` must never become definite (it overrides
 *    `aspect-ratio`) — see `channel-field.css`'s narrow-tier comment.
 *
 * 3. `aria-hidden` goes on `.cf__figure-img`, NOT on `.cf__figure`. It cannot
 *    be un-set by a descendant, so putting it on the wrapper silently deletes
 *    the marker's availability label from the accessibility tree at every
 *    width — and that label is the only place this page states the status.
 *
 * Layout coordinates live in `channel-field.css`; slot assignment lives in
 * `channelLayout.ts`. Neither belongs here.
 */

type Glyph = ComponentType<SVGProps<SVGSVGElement>>;

/**
 * Keyed on `SocialLink.label`, lowercased. Free-form display text is a
 * deliberate key here for the same reason `projects.ts`'s `getTechIcon` uses
 * one: the alternative is a second enum on `SocialLink` that exists only to
 * name a glyph, and every new channel would have to remember to set it. A
 * channel with no glyph renders a two-letter monogram instead of crashing.
 */
const CHANNEL_GLYPHS: Record<string, Glyph> = {
  email: MailIcon,
  github: GithubIcon,
  linkedin: LinkedinIcon,
  whatsapp: WhatsappIcon,
};

function ChannelGlyph({ label }: { label: string }) {
  const Icon = CHANNEL_GLYPHS[label.toLowerCase()];
  if (!Icon) {
    return (
      <span className="cf-card__monogram" aria-hidden="true">
        {label.slice(0, 2).toUpperCase()}
      </span>
    );
  }
  return <Icon className="cf-card__glyph" aria-hidden="true" />;
}

/**
 * The channel NAME leads the plate — first child of `.cf-card__head`, first in
 * the accessible name — and that is the contract, not a styling detail. The
 * banner variant once led with the handle, because `justify-content:
 * space-between` centres a middle child and the name looked better centred, and
 * the accessible name came out as "@OVERNUKE GITHUB". Fixed at the source, not
 * papered over with an `aria-label` that would leave the visible and announced
 * orders disagreeing.
 *
 * Anatomy (D5, `sdd/contact-section-editorial-dock`): `.cf-card__head` carries
 * the name, the instrument-scale corner glyph and the `.cf-card__index` marker;
 * `.cf-card__well` + `.cf-card__rule` are the tone-carrying middle (styled in
 * Phase 4); `.cf-card__foot` carries the handle/meta lines and the external
 * link arrow. Glyph, index and arrow are all `aria-hidden` ornament.
 */
function ChannelPlate({ link, slot, variant, tone, index }: PlacedChannel) {
  const className = `cf-card cf-card--${variant} cf-card--${tone} a-${slot}`;
  const channel = link.label.toLowerCase();

  const body = (
    <>
      <span className="cf-card__head">
        <span className="cf-card__name">{link.label}</span>
        <ChannelGlyph label={link.label} />
        <span className="cf-card__index" aria-hidden="true">
          {index}
        </span>
      </span>
      <span className="cf-card__well" aria-hidden="true" />
      <span className="cf-card__rule" aria-hidden="true" />
      <span className="cf-card__foot">
        <span className="cf-card__lines">
          <span className="cf-card__meta">{link.handle}</span>
          <span className="cf-card__meta">{link.meta}</span>
        </span>
        {!link.unresolved && (
          <span className="cf-card__arrow" aria-hidden="true">
            ↗
          </span>
        )}
      </span>
    </>
  );

  /**
   * A channel whose address has not been decided yet renders as a PLATE, not
   * as a link. It keeps its place in the composition — four slots is the
   * layout, and no channel exercises this branch as of 2026-09-04 (WhatsApp
   * resolved, Instagram dropped outright rather than left pending) — but it
   * is not focusable, has no `href`, and cannot be clicked into a 404.
   *
   * The alternative considered and rejected: ship the placeholder `href`
   * anyway and let a test fail until someone fixes it. That makes a red build
   * the only thing standing between a dead link and production, and red
   * builds get skipped. This makes the safe state the default one, and the
   * plate turns back into a link the moment `unresolved` comes off the data.
   */
  if (link.unresolved) {
    return (
      <div className={`${className} cf-card--pending`} data-channel={channel} data-unresolved="">
        {body}
      </div>
    );
  }

  const external = !link.href.startsWith("mailto:");

  return (
    <a
      className={className}
      href={link.href}
      data-channel={channel}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {body}
      {external && <span className="visually-hidden">{" — opens in a new tab"}</span>}
    </a>
  );
}

export interface ChannelFieldProps {
  channels: readonly SocialLink[];
  /**
   * Illustrated character plate shown at ≥900px. Its ratio must match
   * `.cf__figure`'s for that tier (912/1178).
   */
  plateWide: string;
  /**
   * Illustrated character plate shown below 900px. Its ratio must match
   * `.cf__figure`'s for that tier (1/1).
   */
  plateNarrow: string;
  /** Two or three words for the marker. `ABOUT_PROFILE.availability`. */
  availability: string;
}

/**
 * Pointer-tracked "mechanical dock": EVERY real channel plate lifts by its
 * distance to the cursor — an anisotropic gaussian (`dockHover.ts`), strongest
 * under the pointer and decaying exponentially outward — not a `:hover`
 * pseudo-class alone, because the field is a 2D collage and DOM-adjacency
 * selectors can't express real proximity. The exponential falloff keeps the
 * response single-lobed (one plate clearly dominant, its neighbour clearly
 * subordinate), which is what stops this from reintroducing the field-twitch
 * that commit `5d889c9` removed — see `dockHover.ts`'s header.
 *
 * A continuous rAF loop — not a one-shot "compute and snap" per pointermove —
 * eases each plate's 0..1 FACTOR toward its target with frame-rate-independent
 * exponential smoothing (`damping.ts`, the same pattern `OptionWheel.tsx`
 * runs), and derives `--dock-scale` / `--dock-lift` / `--dock-z` from the
 * eased factor via `dockValues` at write time. Easing the single scalar (not
 * the three outputs) keeps `isSettled`'s dimensionless threshold correct and
 * means scale/lift/z can never desync. `--dock-scale` and `--dock-lift` are
 * written every frame; `--dock-z` only when it changes (8 discrete steps —
 * per-frame writes would force needless style recalc). All three go straight
 * to the element via a ref, never React state (which would re-render all four
 * plates per frame), and z-order goes through a custom property, never inline
 * `style.zIndex`, which would beat the hover/focus stacking rule.
 *
 * Card geometry comes from `offsetLeft/offsetTop/offsetWidth/offsetHeight`
 * (`cardCenter`), and the pointer is converted to stage-local coords
 * (`clientX - stageRect.left`). This is a bug fix, not a style choice:
 * `getBoundingClientRect()` returns the *transformed* rect, so a lifted plate
 * would report a centre that has moved and feed that back into its own
 * factor. `offset*` is untransformed and the stage itself is never scaled.
 *
 * `a.cf-card` only: a `pending` plate is a `div` with no interaction to
 * acknowledge, same reasoning as the hover-lift scoping in channel-field.css.
 *
 * Does nothing at all — no listeners attached — when the visitor prefers
 * reduced motion or has no fine pointer (touch): the effect degrades to the
 * plain existing hover-lift, never a half-attached, silently-inert handler.
 */
function useDockHover(stageRef: React.RefObject<HTMLDivElement | null>) {
  const reducedMotion = useReducedMotion();
  const coarsePointer = useMediaQuery("(pointer: coarse)");
  const enabled = !reducedMotion && !coarsePointer;

  useEffect(() => {
    if (!enabled) return;
    const stage = stageRef.current;
    if (!stage) return;

    // Per card: `f` is the EASED 0..1 factor; `z` is the last `--dock-z`
    // value actually written.
    const current = new Map<HTMLElement, { f: number; z: number }>();
    let targets = new Map<HTMLElement, number>();
    let frame: number | null = null;
    let last = 0;

    function runFrame(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      let settled = true;
      for (const [card, target] of targets) {
        const entry = current.get(card) ?? { f: 0, z: 0 };
        let f = dampStep(entry.f, target, dt, DOCK_TAU_MS / 1000);
        if (isSettled(f, target)) {
          f = target;
        } else {
          settled = false;
        }
        const { scale, lift, z } = dockValues(f, DOCK_MAX_SCALE, DOCK_MAX_LIFT_PX, DOCK_MAX_Z);
        card.style.setProperty("--dock-scale", String(scale));
        card.style.setProperty("--dock-lift", `${lift}px`);
        if (z !== entry.z) card.style.setProperty("--dock-z", String(z));
        current.set(card, { f, z });
      }
      frame = settled ? null : requestAnimationFrame(runFrame);
    }

    function retarget(pointer: { x: number; y: number } | null) {
      const cards = [...stage!.querySelectorAll<HTMLElement>("a.cf-card")];
      const spread = stage!.offsetWidth * DOCK_SPREAD_RATIO;
      const dockCards: DockCard<HTMLElement>[] = cards.map((el) => {
        const { x, y } = cardCenter(el);
        return { key: el, centerX: x, centerY: y };
      });
      targets = dockFactors(pointer, dockCards, spread, DOCK_ANISOTROPY);
      if (frame === null) {
        last = performance.now();
        frame = requestAnimationFrame(runFrame);
      }
    }

    function onPointerMove(event: PointerEvent) {
      const rect = stage!.getBoundingClientRect();
      retarget({ x: event.clientX - rect.left, y: event.clientY - rect.top });
    }

    function onPointerLeave() {
      retarget(null);
    }

    stage.addEventListener("pointermove", onPointerMove);
    stage.addEventListener("pointerleave", onPointerLeave);
    return () => {
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerleave", onPointerLeave);
      if (frame !== null) cancelAnimationFrame(frame);
      for (const card of current.keys()) {
        card.style.removeProperty("--dock-scale");
        card.style.removeProperty("--dock-lift");
        card.style.removeProperty("--dock-z");
      }
    };
  }, [enabled, stageRef]);
}

export function ChannelField({
  channels,
  plateWide,
  plateNarrow,
  availability,
}: ChannelFieldProps) {
  const { placed } = assignChannelSlots(channels);
  const stageRef = useRef<HTMLDivElement>(null);
  useDockHover(stageRef);

  return (
    <div className="cf">
      {/* `.cf__frame` is the ancestor size-query container `.cf__stage`'s
          `min()` fit-pair resolves against (channel-field.css). `.cf__stage`
          can't be its own container — a `cqw` inside an element never queries
          that element, only an ancestor — and `.cf` can't be it either (see
          `.cf`'s `width: 100%` comment). It was also the sibling that let the
          old `.cf__head` claim its height first; the head moved into the stage
          as `.cf__headline` (D4), and its freed height goes here. */}
      <div className="cf__frame">
        <div className="cf__stage" ref={stageRef}>
          {/* The section masthead, and the only editorial chrome left in the
              field: "Reach out" names the ACTION (the page is already named by
              PageLayer's <h1> and the route). Absolute-positioned against the
              stage, `pointer-events: none` so the occlusion audit's centre
              hit-test still reaches the plates.

              2026-09-05 (Keff): the `[04] — CONTACT` readout row + the lede
              ("GitHub, LinkedIn, email…") and the "channels open · Mexico"
              footer were removed. The lede still prints on the way in via the
              module wheel (`ROUTES['/contact'].lede`), and the readout was a
              decorative echo of the page <h1>/route — this reverts the
              `sdd/contact-section-editorial-dock` D4 addition and lands back on
              the `design-import-2026-09-04` HANDOFF §1.5 call ("the module
              wheel already prints the lede", "invented copy" for the footer). */}
          <h2 className="cf__headline">Reach out</h2>

          {/* The wrapper stays in the accessibility tree on purpose — see the
              file header, point 3. Asset selection is CSS-only: the two
              custom properties below hold unresolved `url()` tokens, and the
              `max-width: 900px` media override in channel-field.css picks
              which one `.cf__figure-img`'s `background-image` resolves to, so
              exactly one asset is ever fetched. */}
          <div
            className="cf__figure"
            style={
              {
                "--cf-plate-wide": `url(${plateWide})`,
                "--cf-plate-narrow": `url(${plateNarrow})`,
              } as React.CSSProperties
            }
          >
            <span className="cf__figure-img" aria-hidden="true" />
            <span className="cf__mark">
              <span className="cf__mark-box" aria-hidden="true" />
              <span className="cf__mark-label">{availability}</span>
            </span>
          </div>

          <div className="cf__conn a-conn-a" aria-hidden="true" />
          <div className="cf__conn cf__conn--thick a-conn-b" aria-hidden="true" />

          {placed.map((entry) => (
            <ChannelPlate key={entry.link.label} {...entry} />
          ))}
        </div>
      </div>
    </div>
  );
}
