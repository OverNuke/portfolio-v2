import { useEffect, useRef } from "react";
import { motionAttr, useReducedMotion } from "@/a11y/useReducedMotion";
import { dockFalloff } from "@/contact/dock";
import { type DictionaryKey } from "@/i18n/dictionary";
import { useI18n } from "@/i18n/I18nProvider";
import { useStageScale } from "@/layout/useStageScale";
import "./contact.css";

interface Channel {
  id: string;
  index: string;
  titleKey: DictionaryKey;
  bodyKeys: DictionaryKey[];
  ctaKey: DictionaryKey;
  href: string | null;
  external: boolean;
  tone: "paper" | "olive";
}

// Placeholder-link guard (2.5.3): a channel with href:null never renders.
// WhatsApp/Cal.com stay absent (deferred, obs #385) rather than stubbed.
const CHANNELS: Channel[] = [
  {
    id: "email",
    index: "(01)",
    titleKey: "contact.email.title",
    bodyKeys: [],
    ctaKey: "contact.email.cta",
    href: "mailto:ksfgarcia24@gmail.com",
    external: false,
    tone: "paper",
  },
  {
    id: "github",
    index: "(02)",
    titleKey: "contact.github.title",
    bodyKeys: ["contact.github.body1", "contact.github.body2"],
    ctaKey: "contact.github.cta",
    href: "https://github.com/overnuke",
    external: true,
    tone: "olive",
  },
  {
    id: "linkedin",
    index: "(03)",
    titleKey: "contact.linkedin.title",
    bodyKeys: ["contact.linkedin.body1", "contact.linkedin.body2"],
    ctaKey: "contact.linkedin.cta",
    href: "https://linkedin.com/in/keffwontwakeup",
    external: true,
    tone: "paper",
  },
];

const DOCK_STRENGTH = 0.22;
const DOCK_SPREAD = 260;

// D10: Gaussian proximity dock, pointermove-scheduled rAF, no continuous
// loop. Disabled entirely under reduced motion and in reflow layout (D8 —
// decorative dock physics don't reflow, only the real content does).
// `scale` un-does the dock's own CSS transform (D8, audit task 4.1) so
// pointer deltas and card offsetLeft/Top — one viewport-space, one
// layout-space — land back in the same coordinate system before falloff.
function useDockPhysics(dockRef: React.RefObject<HTMLDivElement | null>, active: boolean, scale: number) {
  useEffect(() => {
    if (!active) return;
    const dock = dockRef.current;
    if (!dock) return;
    let raf = 0;
    let point: { x: number; y: number } | null = null;

    const paint = () => {
      const cards = dock.querySelectorAll<HTMLElement>("[data-card]");
      cards.forEach((card) => {
        if (!point) {
          card.style.transform = "translateY(0) scale(1)";
          card.style.zIndex = "1";
          return;
        }
        const cx = card.offsetLeft + card.offsetWidth / 2;
        const cy = card.offsetTop + card.offsetHeight / 2;
        const dx = (point.x - cx) / DOCK_SPREAD;
        const dy = (point.y - cy) / (DOCK_SPREAD * 2.2);
        const f = dockFalloff(dx, dy);
        card.style.transform = `translateY(${(-40 * DOCK_STRENGTH * f).toFixed(2)}px) scale(${(1 + DOCK_STRENGTH * f).toFixed(3)})`;
        card.style.zIndex = String(10 + Math.round(f * 12));
      });
    };

    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(paint);
    };

    const onMove = (e: PointerEvent) => {
      const r = dock.getBoundingClientRect();
      point = { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale };
      schedule();
    };
    const onLeave = () => {
      point = null;
      schedule();
    };

    dock.addEventListener("pointermove", onMove);
    dock.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      dock.removeEventListener("pointermove", onMove);
      dock.removeEventListener("pointerleave", onLeave);
    };
  }, [dockRef, active, scale]);
}

function ChannelCard({ channel, absolute }: { channel: Channel; absolute: boolean }) {
  const { t } = useI18n();
  return (
    <a
      className={`contact__card contact__card--${channel.tone}`}
      data-card={absolute ? channel.id : undefined}
      href={channel.href ?? undefined}
      target={channel.external ? "_blank" : undefined}
      rel={channel.external ? "noreferrer" : undefined}
    >
      <span className="contact__corner contact__corner--tl" aria-hidden="true" />
      <span className="contact__corner contact__corner--tr" aria-hidden="true" />
      <span className="contact__corner contact__corner--bl" aria-hidden="true" />
      <span className="contact__corner contact__corner--br" aria-hidden="true" />
      <div className="contact__card-head">
        <span className="contact__card-title">{t(channel.titleKey)}</span>
        <span className="contact__card-index" aria-hidden="true">{channel.index}</span>
      </div>
      <div className="contact__card-foot">
        {channel.bodyKeys.length > 0 && (
          <span className="contact__card-body">
            {channel.bodyKeys.map((key) => (
              <span key={key}>{t(key)}</span>
            ))}
          </span>
        )}
        <span className="contact__rule" aria-hidden="true" />
        <div className="contact__cta-row">
          <span className="contact__cta">{t(channel.ctaKey)}</span>
          <span className="contact__chip" data-blob aria-hidden="true">
            <span className="contact__chip-fill" />
            <span className="contact__chip-arrow">↗</span>
          </span>
        </div>
      </div>
    </a>
  );
}

// D9/D10 port of Contact Section v2. Obs #385: only 3 resolved channels
// ship (email/GitHub/LinkedIn); WhatsApp/Cal.com stay unbuilt, not stubbed.
export function ContactDock() {
  const { t } = useI18n();
  const reduced = useReducedMotion();
  const { stageRef, mode, scale } = useStageScale();
  const dockRef = useRef<HTMLDivElement>(null);
  const scaled = mode === "scaled";
  useDockPhysics(dockRef, scaled && !reduced, scale);

  return (
    <section className="contact" ref={stageRef} aria-label={t("contact.heading")}>
      <div className="contact__figure" aria-hidden="true" />
      <div className="contact__scrim" aria-hidden="true" />

      {/* D8 (audit task 4.1): header/status/quote must live inside the same
          scaled stage as the cards, or the section overflows 900px and the
          quote falls below the fold — same fix as Projects/Distinction. */}
      <div
        className={scaled ? "contact__dock" : "contact__reflow"}
        ref={scaled ? dockRef : undefined}
        style={scaled ? { transform: `scale(${scale})` } : undefined}
      >
        <header className="contact__header">
          <h2 className="contact__heading">{t("contact.heading")}</h2>
        </header>

        <div className="contact__status" data-motion={motionAttr(reduced)}>
          <span className="contact__status-dot" data-blob aria-hidden="true" />
          <span className="contact__status-label">{t("contact.status")}</span>
        </div>

        {CHANNELS.map((channel) => (
          <ChannelCard key={channel.id} channel={channel} absolute={scaled} />
        ))}

        <p className="contact__quote">{t("contact.quote")}</p>
      </div>
    </section>
  );
}
