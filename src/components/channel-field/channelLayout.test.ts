import { describe, expect, it } from "vitest";
import {
  assignChannelSlots,
  CHANNEL_SLOTS,
  SLOT_INDEX,
  SLOT_TONE,
  SLOT_VARIANT,
} from "./channelLayout";
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

  it("surfaces each placed channel's plate number from SLOT_INDEX", () => {
    const { placed } = assignChannelSlots(SOCIAL_LINKS);
    for (const entry of placed) expect(entry.index).toBe(SLOT_INDEX[entry.slot]);
  });

  it("numbers the real channels by composition slot, not by array position", () => {
    // DOM/array order is Email, GitHub, LinkedIn, WhatsApp — numbering by
    // position would print 01,02,03,04. The plate numbers follow the slot the
    // channel lands in: Email→primary→01, GitHub→rail-a→02, WhatsApp→aside→03,
    // LinkedIn→feature→04. LinkedIn "04" while third in the array is the case
    // that proves the index is slot-derived.
    const { placed } = assignChannelSlots(SOCIAL_LINKS);
    const byLabel = Object.fromEntries(placed.map((p) => [p.link.label, p.index]));
    expect(byLabel).toEqual({ Email: "01", GitHub: "02", LinkedIn: "04", WhatsApp: "03" });
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

describe("SLOT_INDEX", () => {
  it("numbers exactly the four composition slots, 01 through 04", () => {
    expect(new Set(Object.keys(SLOT_INDEX))).toEqual(new Set(CHANNEL_SLOTS));
    expect([...Object.values(SLOT_INDEX)].sort()).toEqual(["01", "02", "03", "04"]);
  });

  it("numbers slots in left-to-right composition order", () => {
    // The `.a-{slot}` left offsets in channel-field.css (design D1 coordinate
    // table): primary 6.667% < rail-a 23.889% < aside 37.083% < feature
    // 54.861%. The plate number a reader sees must climb in that same order,
    // which CHANNEL_SLOTS (a fallback FILL order: primary, rail-a, feature,
    // aside) does not — hence a dedicated map.
    expect(SLOT_INDEX).toEqual({
      primary: "01",
      "rail-a": "02",
      aside: "03",
      feature: "04",
    });
  });

  it("zero-pads to two digits so the markers align in the mono readout", () => {
    for (const value of Object.values(SLOT_INDEX)) expect(value).toMatch(/^0\d$/);
  });
});
