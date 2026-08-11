/* ═══════════════════════════════════════════════════════════════════════
   sections.js — the content the three proofs share, plus the mount helper.

   Every value here is lifted verbatim from the real app so the proofs are
   arguing about composition and nothing else:

     src/routes/routes.ts   path / title / tag / index / sub / count
     src/content/data.ts    SKILLS (core flag), PROJECTS, CERTIFICATES,
                            SOCIAL_LINKS, ABOUT_PROFILE

   `lede` is the one field written for this exploration — the app has no
   per-module one-liner yet. If a direction is chosen, this belongs in
   `RouteConfig` beside `sub`, not in a component.

   ORDER. Same order as ROUTES. `/contact` IS in the wheel here, unlike
   Home's current module index — the index deliberately omitted it because
   Home carried the channel list itself. These compositions do not carry a
   channel list, so the route has to be reachable, and the wheel is the
   only navigation on the page.
   ═══════════════════════════════════════════════════════════════════════ */

var SECTIONS = [
  {
    label: "Profile",
    idx: "01",
    title: "Profile",
    sub: "identity / experience",
    count: "RDY",
    path: "/profile",
    lede: "Identity, experience, and the way the work actually gets made.",
  },
  {
    label: "Archive",
    idx: "02",
    title: "Certificate Archive",
    sub: "5 credentials",
    count: "05",
    path: "/certifications",
    lede: "Five credentials, scanned, filed, and readable end to end.",
  },
  {
    label: "Projects",
    idx: "03",
    title: "Project Database",
    sub: "3 records",
    count: "03",
    path: "/projects",
    lede: "Three records: a booking backend, an e-waste app, an Odoo module.",
  },
  {
    label: "Contact",
    idx: "04",
    title: "Contact",
    sub: "channels open",
    count: "ON",
    path: "/contact",
    lede: "GitHub, LinkedIn, email. No form, no funnel, no autoresponder.",
  },
];

/* SKILLS.filter(s => s.core) plus the count of everything else — the same
   curation flag Home's stack rail already reads, so the two cannot drift. */
var STACK_CORE = ["TypeScript", "React", "Next.js", "Node.js", "Tailwind", "Git", "JavaScript"];
var STACK_REST = 4; // HTML, CSS, VS Code, Figma

function mountDirection(opts) {
  var reduce = window.prefersReducedMotion;
  var stage = document.querySelector(".stage");
  var margin = parseFloat(getComputedStyle(stage).getPropertyValue("--m")) || 32;

  var swapTargets = ["readout", "lede", "big-title", "big-index"]
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  var fields = {
    "r-idx": "idx",
    "r-title": "title",
    "r-sub": "sub",
    "r-count": "count",
    "r-num": "idx",
    "r-path": "path",
    lede: "lede",
    "big-title": "title",
    "big-index": "idx",
  };

  function paint(section) {
    for (var id in fields) {
      var el = document.getElementById(id);
      if (el) el.textContent = section[fields[id]];
    }
    var bar = document.getElementById("progress");
    if (bar) bar.style.transform = "scaleX(" + ((SECTIONS.indexOf(section) + 1) / SECTIONS.length) + ")";
  }

  var pending = null;
  function onChange(index) {
    var section = SECTIONS[index];
    if (reduce) { paint(section); return; }
    swapTargets.forEach(function (el) { el.classList.add("is-swapping"); });
    clearTimeout(pending);
    pending = setTimeout(function () {
      paint(section);
      swapTargets.forEach(function (el) { el.classList.remove("is-swapping"); });
    }, 130);
  }

  /* The wheel's row height is baked in at construction from `fontSize`, so
     a viewport that crosses a breakpoint has to rebuild it rather than
     restyle it. Rebuilds are rare (breakpoint crossings only, not every
     resize frame) and carry the current selection across. */
  function scaleFor(w) {
    if (w <= 640) return 0.62;
    if (w <= 1024) return 0.78;
    return 1;
  }

  var wheel = null;
  var builtAt = null;

  function build(selectedIndex) {
    if (wheel) wheel.destroy();
    opts.wheel.innerHTML = "";
    opts.wheel.className = opts.wheel.className.replace(/\boption-wheel\S*/g, "").trim();
    builtAt = scaleFor(window.innerWidth);
    margin = parseFloat(getComputedStyle(stage).getPropertyValue("--m")) || 32;
    wheel = createOptionWheel(opts.wheel, {
      items: SECTIONS,
      defaultSelected: selectedIndex,
      // Right-anchoring only makes sense while there is a right-hand
      // column to anchor to. Below 1024 the column is the whole width.
      side: window.innerWidth <= 1024 && opts.sideSmall ? opts.sideSmall : opts.side || "left",
      fontSize: opts.fontSize * builtAt,
      spacing: opts.spacing,
      curve: opts.curve,
      tilt: opts.tilt,
      blur: opts.blur,
      fade: opts.fade,
      minOpacity: opts.minOpacity,
      smoothing: opts.smoothing || 200,
      inset: opts.inset != null ? opts.inset : margin,
      loop: true,
      label: "Portfolio modules",
      live: document.getElementById("live"),
      liveNoun: "module",
      onChange: onChange,
    });
  }

  build(opts.defaultSelected || 0);

  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (scaleFor(window.innerWidth) !== builtAt) build(wheel.selected());
    }, 150);
  });

  var api = {
    next: function () { wheel.next(); },
    prev: function () { wheel.prev(); },
    selected: function () { return wheel.selected(); },
  };

  attachSpaceKey(api);

  var advance = document.getElementById("advance");
  if (advance) advance.addEventListener("click", function () { api.next(); });

  return api;
}
