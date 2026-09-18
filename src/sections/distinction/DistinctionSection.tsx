import { useEffect, useRef, useState, type MutableRefObject, type RefObject } from "react";
import anfecaPlate from "@/assets/certificates/plates/anfeca.png";
import anglePlate from "@/assets/certificates/plates/anglo.png";
import exaverPlate from "@/assets/certificates/plates/exaver.png";
import notaPlate from "@/assets/certificates/plates/nota.png";
import sepToelfPlate from "@/assets/certificates/plates/sepToelf.png";
import eyeLeftPaper from "@/assets/doodle/eye-left-paper.png";
import eyeRight from "@/assets/doodle/eye-right.png";
import { motionAttr, useReducedMotion } from "@/a11y/useReducedMotion";
import { centroid, insetPoly, powerCell, roundPath, simplify, type Site } from "@/colony/powerDiagram";
import { aimArm, blink, boil, buildArrow } from "@/doodle/character";
import { GUY_ARM, GUY_BODY, GUY_EAR_L, GUY_EAR_R } from "@/doodle/shapes";
import { smooth } from "@/doodle/smooth";
import { type DictionaryKey } from "@/i18n/dictionary";
import { useI18n } from "@/i18n/I18nProvider";
import { useStageScale } from "@/layout/useStageScale";
import "./distinction.css";

interface CellDef {
  id: string;
  kind: "title" | "rec" | "accent" | "meta";
  x: number;
  y: number;
  w: number;
  phase: number;
  titleKey?: DictionaryKey;
  metaKey?: DictionaryKey;
  plate?: string;
}

const W = 1440;
const H = 900;
const GAP = 3.5;
const ROUNDNESS = 56;
const GROW = 0.55;
// D13: shell composes Distinction with the warm doodle, not the artboard default.
const DOODLE_COLOR = "#e0452b";
const DOODLE_IDS = ["ear-l", "ear-r", "body", "arm", "arrow-shaft", "arrow-barb-a", "arrow-barb-b"];
// T1.3/D8: the previously-empty `count`/`span` label cells now carry the
// mockup's blinking-eye doodles — left eye on `count`, right eye on `span`.
const EYE_SOURCES: Record<string, string> = { count: eyeLeftPaper, span: eyeRight };

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

const RAW_CELLS: Omit<CellDef, "phase">[] = [
  { id: "title", kind: "title", x: 215, y: 225, w: 30000 },
  { id: "anfeca", kind: "rec", x: 600, y: 190, w: 15000, titleKey: "distinction.cell.anfeca.title", metaKey: "distinction.cell.anfeca.meta", plate: anfecaPlate },
  { id: "nota", kind: "rec", x: 905, y: 150, w: 9000, titleKey: "distinction.cell.nota.title", metaKey: "distinction.cell.nota.meta", plate: notaPlate },
  { id: "propadeutic", kind: "rec", x: 1250, y: 195, w: 12000, titleKey: "distinction.cell.propadeutic.title", metaKey: "distinction.cell.propadeutic.meta" },
  { id: "exaver", kind: "rec", x: 285, y: 545, w: 11000, titleKey: "distinction.cell.exaver.title", metaKey: "distinction.cell.exaver.meta", plate: exaverPlate },
  { id: "english", kind: "rec", x: 630, y: 505, w: 9500, titleKey: "distinction.cell.english.title", metaKey: "distinction.cell.english.meta", plate: anglePlate },
  { id: "powerbi", kind: "rec", x: 975, y: 455, w: 10000, titleKey: "distinction.cell.powerbi.title", metaKey: "distinction.cell.powerbi.meta" },
  { id: "ai", kind: "rec", x: 1305, y: 470, w: 8500, titleKey: "distinction.cell.ai.title", metaKey: "distinction.cell.ai.meta" },
  { id: "toefl", kind: "rec", x: 320, y: 795, w: 9000, titleKey: "distinction.cell.toefl.title", metaKey: "distinction.cell.toefl.meta", plate: sepToelfPlate },
  { id: "aiinit", kind: "rec", x: 690, y: 800, w: 8500, titleKey: "distinction.cell.aiinit.title", metaKey: "distinction.cell.aiinit.meta" },
  { id: "count", kind: "accent", x: 1010, y: 780, w: 7000 },
  { id: "span", kind: "meta", x: 1300, y: 800, w: 6500 },
];
const CELLS: CellDef[] = RAW_CELLS.map((c, i) => ({ ...c, phase: i * 1.9 }));
const RECORD_CELLS = CELLS.filter((c) => c.kind === "rec");

// D5: live power-diagram geometry for time t, hover weights folded into w.
function computeGeometry(t: number, hov: Record<string, number>) {
  const seeds: Site[] = CELLS.map((c) => ({
    x: c.x + Math.cos(t * 0.37 + c.phase) * 7,
    y: c.y + Math.sin(t * 0.31 + c.phase * 1.3) * 7,
    w: c.w * (1 + Math.sin(t * 0.55 + c.phase) * 0.05 + (hov[c.id] || 0) * GROW),
  }));
  return CELLS.map((c, i) => {
    const raw = powerCell(i, seeds, W, H);
    const ins = simplify(insetPoly(raw, GAP), Math.max(10, ROUNDNESS * 0.32));
    const cent = centroid(ins.length >= 3 ? ins : raw);
    return { id: c.id, d: roundPath(ins, ROUNDNESS), cx: cent.x, cy: cent.y, area: cent.area };
  });
}

type Geometry = ReturnType<typeof computeGeometry>;

// D4/D13: the shared guy — body, ears and an arm that aims and shoots an
// arrow at whichever cell is live. Spore rings/title spark dropped (aria-
// hidden decoration, first thing design flags for schedule pressure).
function doodleStrokes(t: number, g: Geometry, hoverId: string | null, hov: Record<string, number>) {
  const f = Math.floor(t * 7.5);
  const gx = 470;
  const gy = 838 + Math.sin(t * 1.7) * 4;
  const earL = boil(GUY_EAR_L, gx, gy, 2, f, 1.1);
  const earR = boil(GUY_EAR_R, gx, gy, 3, f, 1.1);
  const body = boil(GUY_BODY, gx, gy, 1, f, 1.6);

  let best: string | null = null;
  let bv = 0;
  for (const c of g) {
    const h = hov[c.id] || 0;
    if (h > bv) { bv = h; best = c.id; }
  }
  const grow = Math.min(1, bv * 1.25);
  const target = bv > 0.04 ? g.find((c) => c.id === best) : undefined;
  const idleA = Math.sin(t * 1.6) * 0.12 - 0.15;
  const armAim = target ? Math.atan2(target.cy - gy, target.cx - gx) : idleA;
  const a = target ? idleA + (armAim - idleA) * grow : idleA;
  const arm = aimArm(GUY_ARM, a, 31, 2);
  const armPts = boil(arm, gx, gy, 4, f, 1.2);
  const hand = armPts[armPts.length - 1];
  const arrow = target ? buildArrow(hand[0], hand[1], target.cx, target.cy, grow, Math.sqrt(target.area || 10000) * 0.42, 0.16) : null;

  void hoverId; // reserved for future cell-specific doodle beats
  return {
    "ear-l": smooth(earL, true),
    "ear-r": smooth(earR, true),
    body: smooth(body, true),
    arm: smooth(armPts, false),
    "arrow-shaft": arrow ? smooth(arrow.shaft, false) : "",
    "arrow-barb-a": arrow ? smooth(arrow.barbA, false) : "",
    "arrow-barb-b": arrow ? smooth(arrow.barbB, false) : "",
  } as Record<string, string>;
}

// D6: React owns the stable element set (keyed by cell id); a single rAF
// loop mutates d/left/top via refs. Reduced motion paints one static frame
// and never starts the loop (R2 — no running animation).
function useColonyEngine(
  scaled: boolean,
  reduced: boolean,
  hoverIdRef: RefObject<string | null>,
  pathMap: Map<string, SVGPathElement>,
  labelMap: Map<string, HTMLElement>,
  doodleMap: Map<string, SVGPathElement>,
  eyeMap: Map<string, HTMLImageElement>,
  pointerRef: MutableRefObject<{ x: number; y: number } | null>,
) {
  useEffect(() => {
    if (!scaled) return;
    const hov: Record<string, number> = {};

    const paint = (t: number) => {
      const g = computeGeometry(t, hov);
      pathMap.forEach((el, id) => {
        const c = g.find((x) => x.id === id);
        if (c) el.setAttribute("d", c.d);
      });
      labelMap.forEach((el, id) => {
        const c = g.find((x) => x.id === id);
        if (!c) return;
        el.style.left = `${c.cx}px`;
        el.style.top = `${c.cy}px`;
        const h = hov[id] || 0;
        el.style.transform = `translate(-50%, -50%) scale(${(1 + h * 0.05).toFixed(3)})`;
        // D8: eye wrapper width is engine-driven off the cell's live area —
        // the record cells don't carry a `--fill` width, so this is scoped
        // to the two eye cells only.
        if (id in EYE_SOURCES) {
          el.style.width = `${clamp(Math.sqrt(c.area || 0) * 0.95, 120, 400)}px`;
        }
      });
      const strokes = doodleStrokes(t, g, hoverIdRef.current, hov);
      doodleMap.forEach((el, id) => {
        const d = strokes[id];
        if (d !== undefined) el.setAttribute("d", d);
      });
      // D8: blink + clamped pointer-parallax translate on the eye images
      // themselves — never on the `--eye` wrapper the labelMap loop above
      // already owns (left/top/transform), so the two writers never collide.
      const k = blink(t);
      const p = pointerRef.current;
      eyeMap.forEach((img, id) => {
        const c = g.find((x) => x.id === id);
        if (!c) return;
        const dx = p ? clamp((p.x - c.cx) / 24, -10, 10) : 0;
        const dy = p ? clamp((p.y - c.cy) / 28, -7, 7) : 0;
        img.style.transform = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scaleY(${k.toFixed(3)})`;
      });
    };

    paint(0);
    if (reduced) return;

    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      for (const c of CELLS) {
        const target = hoverIdRef.current === c.id ? 1 : 0;
        const cur = hov[c.id] || 0;
        hov[c.id] = cur + (target - cur) * 0.12;
      }
      paint((now - t0) / 1000);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [scaled, reduced, hoverIdRef, pathMap, labelMap, doodleMap, eyeMap, pointerRef]);
}

// D8: element-scoped pointer source for the eye doodles' clamped parallax,
// shaped after useDockPhysics (ContactDock.tsx) — not installed when
// reduced, so the eye images never receive a non-identity transform.
function useEyePointer(
  stageElRef: RefObject<HTMLDivElement | null>,
  active: boolean,
  scale: number,
  pointerRef: MutableRefObject<{ x: number; y: number } | null>,
) {
  useEffect(() => {
    if (!active) return;
    const el = stageElRef.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pointerRef.current = { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale };
    };
    const onLeave = () => {
      pointerRef.current = null;
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [stageElRef, active, scale, pointerRef]);
}

function RecordFields({ cell, t }: { cell: CellDef; t: (k: DictionaryKey) => string }) {
  return (
    <>
      <span className="distinction__cell-title">{t(cell.titleKey as DictionaryKey)}</span>
      <span className="distinction__cell-meta">{t(cell.metaKey as DictionaryKey)}</span>
    </>
  );
}

// D5/D14 port of Distinction Section v4: power-diagram colony with the
// label layer (not the SVG paths) carrying the real focus targets.
export function DistinctionSection() {
  const { t } = useI18n();
  const reduced = useReducedMotion();
  const { stageRef, mode, scale } = useStageScale();
  const scaled = mode === "scaled";

  const pathMap = useRef(new Map<string, SVGPathElement>()).current;
  const labelMap = useRef(new Map<string, HTMLElement>()).current;
  const doodleMap = useRef(new Map<string, SVGPathElement>()).current;
  const eyeMap = useRef(new Map<string, HTMLImageElement>()).current;
  const hoverIdRef = useRef<string | null>(null);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const stageInnerRef = useRef<HTMLDivElement>(null);
  const [, forceHoverPaint] = useState(0);

  const [openId, setOpenId] = useState<string | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openCell = CELLS.find((c) => c.id === openId) ?? null;

  useColonyEngine(scaled, reduced, hoverIdRef, pathMap, labelMap, doodleMap, eyeMap, pointerRef);
  useEyePointer(stageInnerRef, scaled && !reduced, scale, pointerRef);

  useEffect(() => {
    document.body.style.overflow = openId ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [openId]);

  useEffect(() => {
    if (!openId) return;
    closeButtonRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Capture phase + stopPropagation: TurnProvider's own Escape listener
      // (useTurnKeys, bubble phase on window) would otherwise also fire and
      // turn the page back to Home underneath the closing lightbox.
      e.stopPropagation();
      setOpenId(null);
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [openId]);

  useEffect(() => {
    if (openId === null && triggerRef.current) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [openId]);

  const setHover = (id: string | null) => {
    hoverIdRef.current = id;
    if (reduced) forceHoverPaint((n) => n + 1);
  };

  const openLightbox = (id: string, el: HTMLElement) => {
    triggerRef.current = el;
    setOpenId(id);
  };

  const cellRef = (id: string) => (el: HTMLElement | null) => {
    if (el) labelMap.set(id, el);
    else labelMap.delete(id);
  };
  const pathRef = (id: string) => (el: SVGPathElement | null) => {
    if (el) pathMap.set(id, el);
    else pathMap.delete(id);
  };
  const doodleRef = (id: string) => (el: SVGPathElement | null) => {
    if (el) doodleMap.set(id, el);
    else doodleMap.delete(id);
  };
  const eyeRef = (id: string) => (el: HTMLImageElement | null) => {
    if (el) eyeMap.set(id, el);
    else eyeMap.delete(id);
  };

  return (
    <section className="distinction" ref={stageRef} aria-label={t("distinction.heading")}>
      {scaled ? (
        // D8 (audit task 4.1 caught the missing wire-up — same fix as Projects).
        <div className="distinction__stage" ref={stageInnerRef} style={{ transform: `scale(${scale})` }}>
          <svg className="distinction__cells" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
            {CELLS.map((c) => (
              <path key={c.id} ref={pathRef(c.id)} fill={c.kind === "accent" ? "var(--field-olive)" : "#f4f1e6"} stroke="#14150f" strokeWidth={0.9} />
            ))}
          </svg>

          <div className="distinction__labels">
            <div ref={cellRef("title")} className="distinction__label distinction__label--title">
              <h2 className="distinction__heading">{t("distinction.heading")}</h2>
              <p className="distinction__subheading">{t("distinction.subheading")}</p>
            </div>

            {RECORD_CELLS.map((c) => (
              <button
                key={c.id}
                ref={cellRef(c.id)}
                type="button"
                className="distinction__cell"
                aria-label={`${t("distinction.openScan")} ${t(c.titleKey as DictionaryKey)}`}
                onMouseEnter={() => setHover(c.id)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(c.id)}
                onBlur={() => setHover(null)}
                onClick={(e) => openLightbox(c.id, e.currentTarget)}
              >
                <RecordFields cell={c} t={t} />
              </button>
            ))}

            <div
              ref={cellRef("count")}
              className="distinction__label distinction__label--eye"
              aria-hidden="true"
              data-motion={motionAttr(reduced)}
            >
              <img ref={eyeRef("count")} src={eyeLeftPaper} alt="" className="distinction__eye-img" />
            </div>
            <div
              ref={cellRef("span")}
              className="distinction__label distinction__label--eye"
              aria-hidden="true"
              data-motion={motionAttr(reduced)}
            >
              <img ref={eyeRef("span")} src={eyeRight} alt="" className="distinction__eye-img" />
            </div>
          </div>

          <svg className="distinction__doodle" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
            {DOODLE_IDS.map((id) => (
              <path key={id} ref={doodleRef(id)} fill="none" stroke={DOODLE_COLOR} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            ))}
          </svg>
        </div>
      ) : (
        <div className="distinction__reflow">
          <h2 className="distinction__heading">{t("distinction.heading")}</h2>
          <p className="distinction__subheading">{t("distinction.subheading")}</p>
          <ul className="distinction__list">
            {RECORD_CELLS.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className="distinction__list-item"
                  aria-label={`${t("distinction.openScan")} ${t(c.titleKey as DictionaryKey)}`}
                  onClick={(e) => openLightbox(c.id, e.currentTarget)}
                >
                  <RecordFields cell={c} t={t} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {openCell && (
        <div className="distinction__backdrop">
          <div role="dialog" aria-modal="true" aria-labelledby="distinction-lightbox-title" className="distinction__lightbox">
            <div className="distinction__lightbox-head">
              <h3 id="distinction-lightbox-title">{t(openCell.titleKey as DictionaryKey)}</h3>
              <span>{t(openCell.metaKey as DictionaryKey)}</span>
            </div>
            <div className="distinction__plate">
              {openCell.plate ? (
                <img src={openCell.plate} alt={t(openCell.titleKey as DictionaryKey)} />
              ) : (
                <EmptyEye label={t("distinction.emptyState")} reduced={reduced} />
              )}
            </div>
            <div className="distinction__lightbox-foot">
              <span>{t("distinction.lightbox.viewer")}</span>
              <button type="button" ref={closeButtonRef} onClick={() => setOpenId(null)}>
                {t("distinction.lightbox.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// D12 empty state: the mockup's blinking eye, adopted for every unfilled
// scan slot. `blink()` drives the squash via a CSS custom property.
function EmptyEye({ label, reduced }: { label: string; reduced: boolean }) {
  const [k, setK] = useState(1);
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      setK(blink((now - t0) / 1000));
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  return (
    <svg role="img" aria-label={label} className="distinction__empty-eye" viewBox="0 0 260 150" data-motion={motionAttr(reduced)}>
      <g transform={`translate(130 75) scale(1 ${k.toFixed(3)}) translate(-130 -75)`}>
        <ellipse cx="130" cy="75" rx="112" ry="54" fill="#efece1" stroke={DOODLE_COLOR} strokeWidth="4.5" />
        <circle cx="130" cy="75" r="27" fill={DOODLE_COLOR} />
      </g>
    </svg>
  );
}
