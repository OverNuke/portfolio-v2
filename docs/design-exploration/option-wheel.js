/* ═══════════════════════════════════════════════════════════════════════
   option-wheel.js — vanilla port of React Bits <OptionWheel />

   Why a port at all: these three files are standalone design proofs opened
   straight off disk (`file://`), the way every other proof in `docs/` is.
   There is no bundler in that context, so the React component cannot run.

   The port is DELIBERATELY MECHANICAL. Same rAF loop, same exponential
   smoothing, same circle-radius maths (R = rowH / tiltRad), same class
   names (`option-wheel`, `option-wheel__item`, `--selected`), same
   `--ow-p` custom property, same prop names and defaults. Porting the
   winning direction back to React is then: delete this file, `npm i` the
   component, keep the CSS.

   FOUR THINGS THIS ADDS on top of the upstream component. All four are
   requirements of this brief, and all four should survive the port back:

   1. SPACE IS THE PRIMARY INTERACTION. Upstream handles arrows only.
      `attachSpaceKey()` binds Space at the document level and calls
      `next()`. It bails when focus is on a control that already owns
      Space (button, link, input, textarea, select, contenteditable,
      anything with a role that implies activation) so it never steals the
      key from a real widget.

   2. TOUCH BUTTON. Upstream assumes a keyboard or a pointer drag. Tablet
      and phone get neither reliably, so each proof renders one small
      control wired to the same `next()`. It is `pointer: coarse` only —
      desktop stays clean, because Space is sufficient there.

   3. LIVE REGION. `aria-activedescendant` announces the option only while
      the listbox itself has focus. Space is pressed with focus on the
      document body most of the time, so the selection change would be
      silent. `announce` writes "Projects, module 3 of 4" into a polite
      region instead.

   4. prefers-reduced-motion. Upstream always eases and always blurs.
      Under `reduce` the smoothing constant drops to 1ms (an instant
      snap, not an animation) and per-step blur goes to 0 — the wheel
      still reads as a wheel through opacity and position alone.

   ONE UPSTREAM BUG WORTH KNOWING ABOUT, reproduced faithfully rather than
   "fixed", so the two implementations stay comparable: with `loop: true`,
   `targetRef` grows without bound as you keep advancing (it is never
   reduced mod count). It is only ever used as a delta and as
   `Math.round(v) % count`, so nothing breaks in practice — but it is why
   `selected()` reads the modulo and not the raw target.
   ═══════════════════════════════════════════════════════════════════════ */

(function (global) {
  "use strict";

  var REDUCE = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var DEFAULTS = {
    items: [],
    defaultSelected: 0,
    onChange: null,
    side: "left",
    fontSize: 3, // rem
    spacing: 1.4, // multiple of fontSize
    curve: 1,
    tilt: 6, // degrees between neighbours
    blur: 2, // px per step away from centre
    fade: 0.25, // opacity lost per step
    minOpacity: 0.05,
    smoothing: 200, // ms easing time constant
    inset: 80, // px from the anchored edge
    loop: true,
    draggable: true,
    label: "Sections",
    live: null, // element to announce into
    liveNoun: "module",
  };

  function createOptionWheel(root, options) {
    var cfg = {};
    for (var k in DEFAULTS) cfg[k] = DEFAULTS[k];
    for (var j in options) if (options[j] !== undefined) cfg[j] = options[j];

    if (REDUCE) {
      cfg.smoothing = 1;
      cfg.blur = 0;
    }

    var items = cfg.items;
    var count = items.length;
    if (!root || !count) return null;

    var remPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    var rowH = Math.max(cfg.fontSize * cfg.spacing * remPx, 1);

    var pos = cfg.defaultSelected;
    var target = cfg.defaultSelected;
    var selected = cfg.defaultSelected;
    var raf = null;
    var last = 0;
    var wheelTimer = null;
    var drag = null;
    var dragMoved = false;

    /* ---- DOM ---------------------------------------------------------- */
    root.className = (root.className ? root.className + " " : "") + "option-wheel" +
      (cfg.side === "right" ? " option-wheel--right" : "");
    root.setAttribute("role", "listbox");
    root.setAttribute("tabindex", "0");
    root.setAttribute("aria-label", cfg.label);
    root.style.setProperty("--ow-font-size", cfg.fontSize + "rem");
    root.style.setProperty("--ow-inset", cfg.inset + "px");

    var uid = "ow-" + Math.random().toString(36).slice(2, 8);
    var els = items.map(function (item, i) {
      var el = document.createElement("div");
      el.className = "option-wheel__item";
      el.id = uid + "-" + i;
      el.setAttribute("role", "option");
      el.setAttribute("aria-selected", String(i === selected));
      el.textContent = item.label;
      el.addEventListener("click", function () {
        if (dragMoved) return;
        var cur = target;
        var d = i - (((cur % count) + count) % count);
        if (cfg.loop && count > 1) {
          if (d > count / 2) d -= count;
          else if (d < -count / 2) d += count;
        }
        applyTarget(cur + d, true);
        root.focus();
      });
      root.appendChild(el);
      return el;
    });

    /* ---- layout loop --------------------------------------------------
       Options sit on a circle whose radius keeps the arc between two
       neighbours equal to one row height, so `tilt` alone controls how
       tightly the wheel curls. Identical to upstream. */
    function frame(now) {
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      var tau = Math.max(cfg.smoothing, 1) / 1000;
      var k = 1 - Math.exp(-dt / tau);
      var next = pos + (target - pos) * k;
      var settled = Math.abs(target - next) < 0.001;
      if (settled) next = target;
      pos = next;

      var mirror = cfg.side === "right" ? -1 : 1;
      var tiltRad = (cfg.tilt * Math.PI) / 180;
      var R = tiltRad > 0.0005 ? rowH / tiltRad : 0;

      for (var i = 0; i < count; i++) {
        var el = els[i];
        var d = i - next;
        if (cfg.loop && count > 1) {
          d = ((d % count) + count) % count;
          if (d > count / 2) d -= count;
        }
        var dist = Math.abs(d);
        var x = 0, y = d * rowH, rot = 0;
        if (R > 0) {
          var ang = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, d * tiltRad));
          y = R * Math.sin(ang);
          x = -mirror * R * (1 - Math.cos(ang)) * cfg.curve;
          rot = (mirror * ang * 180) / Math.PI;
        }
        el.style.transform =
          "translate(" + x.toFixed(2) + "px, calc(" + y.toFixed(2) + "px - 50%)) rotate(" + rot.toFixed(3) + "deg)";
        el.style.opacity = String(Math.max(cfg.minOpacity, 1 - dist * cfg.fade));
        el.style.filter = cfg.blur > 0 ? "blur(" + (dist * cfg.blur).toFixed(2) + "px)" : "none";
        el.style.setProperty("--ow-p", Math.max(0, 1 - Math.min(dist, 1)).toFixed(4));
      }
      raf = settled ? null : requestAnimationFrame(frame);
    }

    function startLoop() {
      if (raf != null) cancelAnimationFrame(raf);
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    function announce(idx) {
      if (!cfg.live) return;
      cfg.live.textContent = items[idx].label + ", " + cfg.liveNoun + " " + (idx + 1) + " of " + count;
    }

    function applyTarget(value, snap) {
      var v = value;
      if (!cfg.loop) v = Math.min(Math.max(v, 0), Math.max(count - 1, 0));
      if (snap) v = Math.round(v);
      target = v;
      var idx = ((Math.round(v) % count) + count) % count;
      if (idx !== selected) {
        els[selected].classList.remove("option-wheel__item--selected");
        els[selected].setAttribute("aria-selected", "false");
        selected = idx;
        els[idx].classList.add("option-wheel__item--selected");
        els[idx].setAttribute("aria-selected", "true");
        root.setAttribute("aria-activedescendant", els[idx].id);
        announce(idx);
        if (cfg.onChange) cfg.onChange(idx, items[idx]);
      }
      startLoop();
    }

    /* ---- pointer + wheel ---------------------------------------------- */
    root.addEventListener(
      "wheel",
      function (e) {
        e.preventDefault();
        var delta = e.deltaMode === 1 ? e.deltaY * 24 : e.deltaY;
        // Cap each event at one step so a notchy mouse wheel moves exactly
        // one option per click, while a touchpad still scrolls continuously.
        var step = Math.max(-1, Math.min(1, delta / rowH));
        applyTarget(target + step, false);
        if (wheelTimer) clearTimeout(wheelTimer);
        wheelTimer = setTimeout(function () { applyTarget(target, true); }, 140);
      },
      { passive: false }
    );

    root.addEventListener("pointerdown", function (e) {
      if (!cfg.draggable) return;
      drag = { y: e.clientY, start: target, id: e.pointerId };
      dragMoved = false;
      root.classList.add("option-wheel--dragging");
    });
    root.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var dy = e.clientY - drag.y;
      // Capture only once a real drag starts, so a plain tap still reaches
      // the item underneath and selects it.
      if (!dragMoved && Math.abs(dy) > 4) {
        dragMoved = true;
        root.setPointerCapture(drag.id);
      }
      if (dragMoved) applyTarget(drag.start - dy / rowH, false);
    });
    function endDrag() {
      if (!drag) return;
      drag = null;
      root.classList.remove("option-wheel--dragging");
      if (dragMoved) applyTarget(target, true);
      setTimeout(function () { dragMoved = false; }, 0);
    }
    root.addEventListener("pointerup", endDrag);
    root.addEventListener("pointercancel", endDrag);

    root.addEventListener("keydown", function (e) {
      var delta = null;
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") delta = -1;
      else if (e.key === "ArrowDown" || e.key === "ArrowRight") delta = 1;
      else if (e.key === "Home") { e.preventDefault(); applyTarget(0, true); return; }
      else if (e.key === "End") { e.preventDefault(); applyTarget(count - 1, true); return; }
      if (delta == null) return;
      e.preventDefault();
      applyTarget(Math.round(target) + delta, true);
    });

    /* ---- boot ---------------------------------------------------------- */
    els[selected].classList.add("option-wheel__item--selected");
    root.setAttribute("aria-activedescendant", els[selected].id);
    applyTarget(target, false);
    if (cfg.onChange) cfg.onChange(selected, items[selected]);

    var api = {
      next: function () { applyTarget(Math.round(target) + 1, true); },
      prev: function () { applyTarget(Math.round(target) - 1, true); },
      select: function (i) { applyTarget(i, true); },
      selected: function () { return selected; },
      destroy: function () { if (raf != null) cancelAnimationFrame(raf); },
    };
    return api;
  }

  /* Space at document level. `next()` unless focus is somewhere that
     already owns the key — otherwise a proof would hijack Space from its
     own touch button and fire twice. */
  var SPACE_OWNERS = "a[href], button, input, textarea, select, summary, [contenteditable], [role=button], [role=link]";
  function attachSpaceKey(wheel) {
    document.addEventListener("keydown", function (e) {
      if (e.key !== " " && e.code !== "Space") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var t = e.target;
      if (t && t.closest && t.closest(SPACE_OWNERS)) return;
      e.preventDefault(); // Space would otherwise page-scroll
      wheel.next();
    });
  }

  global.createOptionWheel = createOptionWheel;
  global.attachSpaceKey = attachSpaceKey;
  global.prefersReducedMotion = REDUCE;
})(window);
