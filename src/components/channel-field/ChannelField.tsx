import type { ComponentType, SVGProps } from "react";
import {
  GithubIcon,
  InstagramIcon,
  LinkedinIcon,
  MailIcon,
  WhatsappIcon,
} from "../social-icon/SocialIcon";
import type { SocialLink } from "../../content/types";
import { assignChannelSlots, type PlacedChannel } from "./channelLayout";
import "./channel-field.css";

/**
 * CONTACT — the channel field.
 * Spec: `claude/contact-channel-field-2026-08-20.md`.
 * Proof: `docs/contact.design-proof-v2.html`.
 *
 * Five channels across six unequal tracks, an editorial monochrome portrait
 * bleeding off the bottom, and one Oxblood marker on the subject's right eye.
 *
 * THREE THINGS ABOUT THIS COMPOSITION THAT ARE EASY TO UNDO BY ACCIDENT:
 *
 * 1. The plates are Field Olive on Paper — NOT a Field Olive background with
 *    Paper White plates on it. v1 was the latter and read as twice the visual
 *    weight of every other module on the site. `.cf` sets no background at
 *    all; the page's `--paper` shows through.
 *
 * 2. `.cf__figure` is SQUARE (`aspect-ratio: 1`) because its source image is
 *    square. At `contain` the paint then fills the element exactly, which is
 *    what lets the marker be positioned in percentages of that box and land
 *    on the eye at every width. Any other ratio letterboxes the image inside
 *    the box and the marker drifts off the face — with no pixel coordinate
 *    anywhere to blame it on. If the plate is ever recropped to a non-square,
 *    the marker percentages must be re-derived.
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
function ChannelPlate({ link, slot, variant }: PlacedChannel) {
  const className = `cf-card cf-card--${variant} a-${slot}`;
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
  /** Editorial monochrome portrait — `tools/editorial_mono.py`. Square. */
  plate: string;
  /** Two or three words for the marker. `ABOUT_PROFILE.availability`. */
  availability: string;
  /** Printed small in the top margin. Decorative. */
  coordinates?: string;
}

export function ChannelField({ channels, plate, availability, coordinates }: ChannelFieldProps) {
  const { placed } = assignChannelSlots(channels);

  return (
    <div className="cf">
      {coordinates && (
        <span className="cf__accent cf__accent--coord" aria-hidden="true">
          {coordinates}
        </span>
      )}
      <span className="cf__accent cf__accent--sn" aria-hidden="true">
        CH—FIELD / REV 02
      </span>

      <header className="cf__head">
        <h2 className="cf__title">Channels</h2>
      </header>

      <div className="cf__stage">
        {/* The wrapper stays in the accessibility tree on purpose — see the
            file header, point 3. */}
        <div className="cf__figure">
          <span
            className="cf__figure-img"
            aria-hidden="true"
            style={{ backgroundImage: `url(${plate})` }}
          />
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
  );
}
