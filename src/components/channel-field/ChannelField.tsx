import { useEffect, useRef, type ComponentType, type SVGProps } from "react";
import {
  GithubIcon,
  InstagramIcon,
  LinkedinIcon,
  MailIcon,
  WhatsappIcon,
} from "../social-icon/SocialIcon";
import type { SocialLink } from "../../content/types";
import { assignChannelSlots, type PlacedChannel } from "./channelLayout";
import { dockScale } from "./dockHover";
import { useReducedMotion } from "../../shell/useReducedMotion";
import { useMediaQuery } from "../../shell/useMediaQuery";
import "./channel-field.css";

/** Tuned by eye against the plate sizes in `channel-field.css` — big enough
 * that a neighbouring plate visibly responds, small enough that the effect
 * reads as an instrument reacting to proximity rather than a hovered plate
 * reaching across the field. */
const DOCK_RADIUS_PX = 240;
/** 1.07, not a real dock's 1.4–2x — this is a HUD instrument acknowledging
 * the cursor, not an icon demanding attention. */
const DOCK_MAX_SCALE = 1.07;

/**
 * CONTACT — the channel field.
 * Spec: `docs/design-exploration/contact-channel-field-2026-08-20.md`.
 * Proof: `docs/contact.design-proof-v2.html`.
 *
 * Five channels across six unequal tracks, an illustrated character figure
 * bleeding off the bottom, and one Oxblood marker anchored to its top-right
 * clear zone.
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
  instagram: InstagramIcon,
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
 * DOM order inside a plate is name → handle → meta → glyph, and that order is
 * the contract, not a styling detail. The banner variant originally led with
 * the handle, because `justify-content: space-between` centres a middle child
 * and the name looked better centred — and the accessible name came out as
 * "@OVERNUKE GITHUB". The channel name leads; the name sits at the top of the
 * banner instead. Fixed at the source rather than papered over with an
 * `aria-label`, which would have left the visible and announced orders
 * disagreeing.
 */
function ChannelPlate({ link, slot, variant, tone }: PlacedChannel) {
  const className = `cf-card cf-card--${variant} cf-card--${tone} a-${slot}`;
  const channel = link.label.toLowerCase();

  const body = (
    <>
      <span className="cf-card__name">{link.label}</span>
      <span className="cf-card__foot">
        <span className="cf-card__lines">
          <span className="cf-card__meta">{link.handle}</span>
          <span className="cf-card__meta">{link.meta}</span>
        </span>
        <ChannelGlyph label={link.label} />
      </span>
    </>
  );

  /**
   * A channel whose address has not been decided yet renders as a PLATE, not
   * as a link. It keeps its place in the composition — five slots is the
   * layout, and dropping to three leaves two holes — but it is not focusable,
   * has no `href`, and cannot be clicked into a 404.
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
 * Pointer-tracked "mechanical dock": every real channel plate's scale
 * follows its actual distance to the cursor (`dockHover.ts`'s falloff),
 * not a `:hover` pseudo-class alone — the field is a 2D collage, not a
 * single row, so DOM-adjacency selectors can't express real proximity.
 *
 * Writes `--dock-scale` straight to each element via a ref, throttled to
 * one update per frame — not React state, which would re-render all five
 * plates on every pointermove. `a.cf-card` only: a `pending` plate is a
 * `div` with no interaction to acknowledge, same reasoning as the existing
 * hover-lift scoping below in channel-field.css.
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

    let frame: number | null = null;
    let pointer: { x: number; y: number } | null = null;

    function apply() {
      frame = null;
      const cards = stage!.querySelectorAll<HTMLElement>("a.cf-card");
      for (const card of cards) {
        if (!pointer) {
          card.style.removeProperty("--dock-scale");
          continue;
        }
        const rect = card.getBoundingClientRect();
        const dx = pointer.x - (rect.left + rect.width / 2);
        const dy = pointer.y - (rect.top + rect.height / 2);
        const distance = Math.hypot(dx, dy);
        card.style.setProperty(
          "--dock-scale",
          String(dockScale(distance, DOCK_RADIUS_PX, DOCK_MAX_SCALE)),
        );
      }
    }

    function schedule() {
      if (frame === null) frame = requestAnimationFrame(apply);
    }

    function onPointerMove(event: PointerEvent) {
      pointer = { x: event.clientX, y: event.clientY };
      schedule();
    }

    function onPointerLeave() {
      pointer = null;
      schedule();
    }

    stage.addEventListener("pointermove", onPointerMove);
    stage.addEventListener("pointerleave", onPointerLeave);
    return () => {
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerleave", onPointerLeave);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [enabled, stageRef]);
}

export function ChannelField({ channels, plateWide, plateNarrow, availability }: ChannelFieldProps) {
  const { placed } = assignChannelSlots(channels);
  const stageRef = useRef<HTMLDivElement>(null);
  useDockHover(stageRef);

  return (
    <div className="cf">
      <header className="cf__head">
        <h2 className="cf__title">Channels</h2>
      </header>

      {/* `.cf__frame` is the size-query container for `.cf__stage`'s
          fit-to-available-space formula (channel-field.css). It exists
          because `.cf__head` is a real sibling that must claim its own
          height first — `.cf__stage` cannot itself be the container, since
          cqw/cqh would then resolve against the WHOLE `.cf` column
          (head included), not the space actually left over for the stage. */}
      <div className="cf__frame">
        <div className="cf__stage" ref={stageRef}>
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
