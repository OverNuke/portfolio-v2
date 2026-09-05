import type { ChannelSlot, SocialLink } from "../../content/types";

/**
 * Slot assignment for the CONTACT channel field. The sibling of
 * `project-field/fieldLayout.ts`: pure, testable, and deliberately separate
 * from the component so the layout can be reasoned about without rendering.
 *
 * The composition has four slots (reduced from five 2026-09-04, design
 * import — Instagram's `rail-b` slot was dropped) and they are NOT
 * interchangeable. One is a vertical banner in a narrow track (its label is
 * set with `writing-mode: vertical-rl`, so a long channel name costs height,
 * not width); three are horizontal blocks in wide tracks. Handing a channel
 * the wrong kind of slot does not misalign the sheet, it makes the label
 * unreadable — which is why `SocialLink.channelSlot` is explicit data rather
 * than something derived from array position.
 *
 * WHERE each slot sits on the grid is `channel-field.css`, in one block, in
 * composition order (docs/12_COLLAGE_SYSTEM.md §Implementation notes). This
 * file only decides WHICH channel goes in WHICH named slot; it holds no
 * coordinates.
 */

/**
 * Declaration order is the fallback fill order for channels that name no
 * slot. It is not the DOM order — that is `SOCIAL_LINKS` order, which
 * `assignChannelSlots` preserves.
 */
export const CHANNEL_SLOTS: readonly ChannelSlot[] = ["primary", "rail-a", "feature", "aside"];

export const SLOT_VARIANT: Record<ChannelSlot, "block" | "banner"> = {
  primary: "block",
  "rail-a": "banner",
  feature: "block",
  aside: "block",
};

/**
 * Same three fills `cert-wall` uses (`CertWall.tsx`'s `TileTone`) — light
 * (Paper White / Ink), mid (Field Olive / Paper White, the field's original
 * uniform tone), dark (Ink / Ink Inverse).
 *
 * Rewritten 2026-09-04 (design import, `rail-b`/Instagram dropped): with one
 * banner left, the old "the two banners bracket it in Ink" rationale no
 * longer holds. New reasoning — the entry plate (`primary`, Email: the one
 * channel with no external hop) is Ink; the single banner (`rail-a`, GitHub)
 * is Field Olive; the widest plate (`feature`, LinkedIn) is the sheet's one
 * open Paper-White tile; `aside` (WhatsApp) returns to olive so the two mid
 * plates bracket the light one. Same three fills, same `SLOT_VARIANT`-style
 * fixed per-slot assignment, new reason.
 */
export const SLOT_TONE: Record<ChannelSlot, "light" | "mid" | "dark"> = {
  primary: "dark",
  "rail-a": "mid",
  feature: "light",
  aside: "mid",
};

export interface PlacedChannel {
  link: SocialLink;
  slot: ChannelSlot;
  variant: "block" | "banner";
  tone: "light" | "mid" | "dark";
}

export interface ChannelPlacement {
  placed: readonly PlacedChannel[];
  /**
   * Channels that found no slot. The field has exactly four (2026-09-04:
   * reduced from five, Instagram/`rail-b` dropped) and adding a fifth is a
   * composition change, not a data change — so overflow is surfaced rather
   * than silently dropped, and a test asserts it is empty.
   */
  overflow: readonly SocialLink[];
}

/**
 * Places each channel, honouring an explicit `channelSlot` when it is free
 * and otherwise taking the next unclaimed slot in `CHANNEL_SLOTS` order.
 *
 * Two passes, not one: explicit claims are all resolved before any fallback
 * runs. With a single pass a channel that named no slot could take the one a
 * later channel had explicitly asked for, and the later channel would be
 * displaced by something that expressed no preference at all — the layout
 * would then depend on array order in exactly the way `channelSlot` exists to
 * prevent.
 *
 * DOM order is always `links` order, whatever slots come out. Visual order
 * comes from `grid-area`, which does not affect tab order
 * (docs/12_COLLAGE_SYSTEM.md guardrail 3).
 */
export function assignChannelSlots(links: readonly SocialLink[]): ChannelPlacement {
  const taken = new Set<ChannelSlot>();

  for (const link of links) {
    if (link.channelSlot && !taken.has(link.channelSlot)) taken.add(link.channelSlot);
  }

  const free = CHANNEL_SLOTS.filter((slot) => !taken.has(slot));
  const placed: PlacedChannel[] = [];
  const overflow: SocialLink[] = [];
  let next = 0;

  for (const link of links) {
    const claimed =
      link.channelSlot && !placed.some((p) => p.slot === link.channelSlot)
        ? link.channelSlot
        : free[next++];

    if (!claimed) {
      overflow.push(link);
      continue;
    }
    placed.push({ link, slot: claimed, variant: SLOT_VARIANT[claimed], tone: SLOT_TONE[claimed] });
  }

  return { placed, overflow };
}
