import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { motionAttr, useReducedMotion } from "@/a11y/useReducedMotion";
import { type DictionaryKey } from "@/i18n/dictionary";
import { useI18n } from "@/i18n/I18nProvider";
import { useStageScale } from "@/layout/useStageScale";
import { bloomFade, bloomRadius, lobe, makeBloom, type Bloom } from "./blooms";
import "./profile.css";

interface Chamber {
  id: string;
  n: string;
  fusedKey: DictionaryKey;
  dotKeys: DictionaryKey[];
}

const CHAMBERS: Chamber[] = [
  { id: "software", n: "01", fusedKey: "profile.chamber.software", dotKeys: ["profile.dot.java", "profile.dot.javascript", "profile.dot.python"] },
  { id: "systems", n: "02", fusedKey: "profile.chamber.systems", dotKeys: ["profile.dot.sql", "profile.dot.uml"] },
  { id: "anywhere", n: "03", fusedKey: "profile.chamber.anywhere", dotKeys: ["profile.dot.spanish", "profile.dot.english", "profile.dot.french"] },
  { id: "dependable", n: "04", fusedKey: "profile.chamber.dependable", dotKeys: ["profile.dot.responsible", "profile.dot.hardworking", "profile.dot.teamwork", "profile.dot.dedicated"] },
];

// D11/D15: rAF canvas ink-blooms. Null-getContext bails cleanly (jsdom has
// no canvas backend) — same defensive shape a real no-canvas browser needs.
function useBloomCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    const W = canvas.width;
    const H = canvas.height;
    let blooms: Bloom[] = Array.from({ length: 6 }, () => makeBloom(W, H, true));

    const shape = (b: Bloom, r: number, t: number) => {
      ctx.beginPath();
      const N = 120;
      for (let i = 0; i <= N; i++) {
        const a = (i / N) * Math.PI * 2;
        const rr = r * lobe(b, t, a);
        const x = Math.cos(a) * rr * b.sx;
        const y = Math.sin(a) * rr * b.sy;
        const X = b.x + x * Math.cos(b.rot) - y * Math.sin(b.rot);
        const Y = b.y + x * Math.sin(b.rot) + y * Math.cos(b.rot);
        if (i === 0) ctx.moveTo(X, Y);
        else ctx.lineTo(X, Y);
      }
      ctx.closePath();
    };

    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, W, H);
      for (const b of blooms) {
        b.age += dt;
        if (b.age > b.life) Object.assign(b, makeBloom(W, H, false));
        const t = b.age / b.life;
        b.x += b.drift * dt * 0.6;
        b.y += b.rise * dt * 0.6;
        const r = bloomRadius(b, t);
        const fade = bloomFade(t);
        ctx.filter = `blur(${(3 + 13 * t).toFixed(1)}px)`;
        ctx.fillStyle = `rgba(152,148,134,${(0.5 * fade).toFixed(3)})`;
        shape(b, r, b.age);
        ctx.fill();
        ctx.filter = `blur(${(1.4 + 5 * t).toFixed(1)}px)`;
        ctx.fillStyle = `rgba(168,164,150,${(0.42 * fade).toFixed(3)})`;
        shape(b, r * 0.54, b.age * 1.3);
        ctx.fill();
      }
      ctx.filter = "none";
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      blooms = [];
    };
  }, [canvasRef, active]);
}

function ChamberRow({ chamber, goo }: { chamber: Chamber; goo: boolean }) {
  const { t } = useI18n();
  const [locked, setLocked] = useState(false);
  const [hovered, setHovered] = useState(false);
  const on = locked || hovered;
  const dotLabels = chamber.dotKeys.map((k) => t(k));
  const fused = t(chamber.fusedKey);
  const ariaLabel = `${fused} — ${dotLabels.join(", ")}`;

  return (
    <button
      type="button"
      className="profile__chamber"
      data-active={on ? "true" : undefined}
      aria-pressed={locked}
      aria-label={ariaLabel}
      onClick={() => setLocked((v) => !v)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <span className="profile__chamber-index" aria-hidden="true">({chamber.n})</span>
      {goo && (
        <span className="profile__chamber-dots" aria-hidden="true">
          {chamber.dotKeys.map((k, i) => (
            <span key={k} className={`profile__chamber-dot profile__chamber-dot--${i % 3}`} data-blob />
          ))}
        </span>
      )}
      <span className="profile__chamber-labels">
        {dotLabels.map((label) => (
          <span key={label} className="profile__chamber-label">{label}</span>
        ))}
      </span>
      <span className="profile__chamber-fused" aria-hidden="true">{fused}</span>
    </button>
  );
}

// D11 port of Profile Section v4: canvas ink-blooms + CSS-goo chambers.
// Identity text is real markup (spec: legible independent of the canvas).
export function ProfileSection() {
  const { t } = useI18n();
  const reduced = useReducedMotion();
  const { stageRef, mode } = useStageScale();
  const scaled = mode === "scaled";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useBloomCanvas(canvasRef, scaled && !reduced);

  return (
    <section className="profile" ref={stageRef} aria-label={t("profile.heading")}>
      {scaled && <canvas ref={canvasRef} className="profile__canvas" width={480} height={300} aria-hidden="true" />}
      <div className="profile__scrim" aria-hidden="true" />

      <div className="profile__identity">
        <h2 className="profile__heading">{t("profile.heading")}</h2>
        <p className="profile__bio">{t("profile.bio")}</p>
        <div className="profile__meta">
          <span className="profile__availability">{t("profile.availability")}</span>
          <Link className="profile__cta" to="/contact">{t("profile.cta")} →</Link>
        </div>
      </div>

      <div className="profile__status" data-motion={motionAttr(reduced)}>
        <span className="profile__status-dot" data-blob aria-hidden="true" />
        <span className="profile__status-label">{t("profile.status")}</span>
      </div>

      <div
        className={scaled ? "profile__chambers" : "profile__chambers-reflow"}
        data-motion={motionAttr(reduced)}
      >
        {CHAMBERS.map((chamber) => (
          <ChamberRow key={chamber.id} chamber={chamber} goo={scaled} />
        ))}
      </div>

      {scaled && (
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
          <defs>
            <filter id="profileGoo">
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
              <feColorMatrix in="blur" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -11" />
            </filter>
          </defs>
        </svg>
      )}
    </section>
  );
}
