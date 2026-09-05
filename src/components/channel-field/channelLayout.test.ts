import { describe, expect, it } from "vitest";
import { assignChannelSlots, CHANNEL_SLOTS, SLOT_TONE, SLOT_VARIANT } from "./channelLayout";
import { SOCIAL_LINKS } from "../../content/data";
import type { SocialLink } from "../../content/types";

function link(label: string, extra: Partial<SocialLink> = {}): SocialLink {
  return { label, href: `https://example.com/${label}`, handle: `@${label}`, meta: "", ...extra };
}

describe("assignChannelSlots", () => {
  it("honours every explicit channelSlot in SOCIAL_LINKS", () => {
    const { placed, overflow } = assignChannelSlots(SOCIAL_LINKS);
    expect(overflow).toHaveLength(0);
    for (const entry of placed) {
      if (entry.link.channelSlot) expect(entry.slot).toBe(entry.link.channelSlot);
    }
  });

  it("preserves SOCIAL_LINKS order, because DOM order is tab order", () => {
    const { placed } = assignChannelSlots(SOCIAL_LINKS);
    expect(placed.map((p) => p.link.label)).toEqual(SOCIAL_LINKS.map((l) => l.label));
  });

  it("gives each slot the variant its track shape requires", () => {
    const { placed } = assignChannelSlots(SOCIAL_LINKS);
    for (const entry of placed) expect(entry.variant).toBe(SLOT_VARIANT[entry.slot]);
  });

  it("gives each slot the tone the composition assigns it", () => {
    const { placed } = assignChannelSlots(SOCIAL_LINKS);
    for (const entry of placed) expect(entry.tone).toBe(SLOT_TONE[entry.slot]);
  });

  it("never puts two channels in the same slot", () => {
    const { placed } = assignChannelSlots(SOCIAL_LINKS);
    expect(new Set(placed.map((p) => p.slot)).size).toBe(placed.length);
  });

  it("resolves explicit claims before any fallback takes a slot", () => {
    // The single-pass version of this fails: "loose" would take `primary`
    // first and displace the channel that actually asked for it — the layout
    // would then depend on array order, which is the thing `channelSlot`
    // exists to prevent.
    const { placed } = assignChannelSlots([
      link("loose"),
      link("claimed", { channelSlot: "primary" }),
    ]);
    expect(placed.find((p) => p.link.label === "claimed")?.slot).toBe("primary");
    expect(placed.find((p) => p.link.label === "loose")?.slot).not.toBe("primary");
  });

  it("gives a duplicate claim a free slot rather than dropping it", () => {
    const { placed, overflow } = assignChannelSlots([
      link("first", { channelSlot: "feature" }),
      link("second", { channelSlot: "feature" }),
    ]);
    expect(overflow).toHaveLength(0);
    expect(placed).toHaveLength(2);
    expect(placed[0].slot).toBe("feature");
    expect(placed[1].slot).not.toBe("feature");
  });

  it("surfaces a fifth channel as overflow instead of silently dropping it", () => {
    // The field has four slots (2026-09-04: Instagram/`rail-b` dropped). A
    // fifth is a composition change, not a data change — so it must be
    // visible, not swallowed.
    const five = Array.from({ length: 5 }, (_, i) => link(`c${i}`));
    const { placed, overflow } = assignChannelSlots(five);
    expect(placed).toHaveLength(CHANNEL_SLOTS.length);
    expect(overflow.map((l) => l.label)).toEqual(["c4"]);
  });

  it("fits every real channel on the field at the current count", () => {
    expect(SOCIAL_LINKS.length).toBeLessThanOrEqual(CHANNEL_SLOTS.length);
  });

  it("has exactly four slots — Instagram/rail-b was dropped 2026-09-04", () => {
    expect(CHANNEL_SLOTS).toHaveLength(4);
    expect(CHANNEL_SLOTS).not.toContain("rail-b");
  });

  it("resolves SOCIAL_LINKS to exactly Email, GitHub, LinkedIn, WhatsApp with no overflow", () => {
    const { placed, overflow } = assignChannelSlots(SOCIAL_LINKS);
    expect(overflow).toHaveLength(0);
    expect(placed.map((p) => p.link.label)).toEqual(["Email", "GitHub", "LinkedIn", "WhatsApp"]);
  });

  it("has no unresolved channel left in SOCIAL_LINKS", () => {
    expect(SOCIAL_LINKS.filter((l) => l.unresolved)).toHaveLength(0);
  });

  it("resolves WhatsApp to its real wa.me link, not the unresolved plate", () => {
    const whatsapp = SOCIAL_LINKS.find((l) => l.label === "WhatsApp");
    expect(whatsapp).toBeDefined();
    expect(whatsapp?.href).toBe("https://wa.me/529212652693");
    expect(whatsapp?.unresolved).toBeFalsy();
  });
});
