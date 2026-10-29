/* Every page opens at its top (unless the link points at a section) */
(function () {
  try { if ("scrollRestoration" in history) history.scrollRestoration = "manual"; } catch (e) {}
  function top() {
    if (location.hash) return;
    var h = document.documentElement, prev = h.style.scrollBehavior;
    h.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    h.style.scrollBehavior = prev;
  }
  top();
  window.addEventListener("pageshow", function (e) { if (!e.persisted) top(); });
  window.addEventListener("load", top);
})();

(function () {
  var root = document.getElementById("site");
  if (!root) return;

  /* Mobile menu */
  var btn = document.getElementById("menu-btn");
  var nav = document.getElementById("mobile-nav");
  function setMenu(open) {
    if (!btn || !nav) return;
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    nav.hidden = !open;
    document.documentElement.classList.toggle("menu-open", open);
  }
  if (btn && nav) {
    btn.addEventListener("click", function () { setMenu(nav.hidden); });
    nav.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
    });
    var mq = window.matchMedia("(min-width: 800px)");
    var onChange = function (e) { if (e.matches) setMenu(false); };
    if (mq.addEventListener) mq.addEventListener("change", onChange);
  }

  /* Current page in the nav */
  var current = root.getAttribute("data-page");
  var links = document.querySelectorAll("[data-nav]");
  for (var i = 0; i < links.length; i++) {
    if (links[i].getAttribute("data-nav") === current) {
      links[i].setAttribute("aria-current", "page");
    }
  }

  /* Header gets a solid background once the page scrolls */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (!header) return;
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    if (y > 12) header.setAttribute("data-scrolled", "");
    else header.removeAttribute("data-scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Copy buttons on the contact page */
  var copies = document.querySelectorAll("[data-copy]");
  Array.prototype.forEach.call(copies, function (b) {
    var label = b.textContent;
    function flash(text) {
      b.textContent = text;
      setTimeout(function () { b.textContent = label; }, 1600);
    }
    function selectValue() {
      var row = b.closest(".crow");
      var el = row && row.querySelector(".crow__value");
      if (!el || !window.getSelection) return flash("Select to copy");
      var range = document.createRange();
      range.selectNodeContents(el);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      flash("Selected");
    }
    b.addEventListener("click", function () {
      var text = b.getAttribute("data-copy");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { flash("Copied"); }, selectValue);
      } else {
        selectValue();
      }
    });
  });
})();

/* ===================== Motion layer ===================== */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  if (reduce || !("IntersectionObserver" in window)) return;
  root.classList.add("js");

  /* tag elements for reveal, with stagger inside groups */
  function tag(sel, mode, step) {
    $(sel).forEach(function (el, i) {
      if (el.hasAttribute("data-r")) return;
      el.setAttribute("data-r", mode || "");
      if (step) el.style.setProperty("--d", (i * step) + "s");
    });
  }
  tag(".band h2, .page-head .lead, .page-head .actions", "");
  tag(".bar > div", "", 0.1);
  tag(".pass", "s");
  tag(".statement__body > *", "", 0.12);
  tag(".path li", "", 0.25);
  tag(".row", "", 0.12);
  tag(".panel-split__img", "l");
  tag(".panel-split__body > *", "", 0.1);
  tag(".facts > div", "", 0.15);
  tag(".cta .stack", "r");
  tag(".program", "");
  tag(".group-title", "");
  tag(".best", "");
  tag(".faq", "", 0.06);
  tag(".crow", "", 0.08);
  tag(".panel", "s");
  tag(".beliefs li", "", 0.12);
  tag(".footer-grid > *", "", 0.1);
  tag(".split > *", "", 0.12);

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      el.classList.add("in");
      if (el.classList.contains("path")) el.classList.add("in");
      io.unobserve(el);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
  $("[data-r], .path").forEach(function (el) { io.observe(el); });

  /* count-up numbers */
  function countUp(el) {
    var txt = el.textContent, m = txt.match(/\d+/);
    if (!m) return;
    var end = parseInt(m[0], 10), t0 = null, dur = 1400;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1), v = Math.round(end * (1 - Math.pow(1 - p, 3)));
      el.textContent = txt.replace(m[0], v);
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = txt.replace(m[0], "0");
    requestAnimationFrame(step);
  }
  var cio = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { countUp(e.target.firstChild.nodeType === 3 || true ? e.target : e.target); cio.unobserve(e.target); } });
  }, { threshold: 0.6 });
  $(".facts dt, .pass__big").forEach(function (el) {
    if (el.classList.contains("pass__big")) {
      var tn = el.firstChild;
      if (tn && tn.nodeType === 3) {
        var span = document.createElement("span");
        span.textContent = tn.textContent;
        el.replaceChild(span, tn);
        cio.observe(span);
      }
    } else cio.observe(el);
  });

  /* parallax + scroll progress */
  var bar = document.createElement("div");
  bar.className = "progress";
  document.body.appendChild(bar);
  var heroImg = document.querySelector(".hero__media img");
  var mark = document.querySelector(".statement__mark");
  var shards = $(".page-head .shards, .hero > .shards");
  var ticking = false;
  function frame() {
    ticking = false;
    var y = window.pageYOffset || 0;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = "scaleX(" + (h > 0 ? Math.min(y / h, 1) : 0) + ")";
    if (heroImg && y < 1400) heroImg.style.transform = "translateY(" + (y * 0.12) + "px) scale(1.04)";
    if (mark) {
      var r = mark.parentNode.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) mark.style.transform = "translateY(calc(-50% + " + ((r.top - window.innerHeight / 2) * -0.12) + "px))";
    }
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  frame();

  /* cursor glow on dark sections and hero */
  if (window.matchMedia("(hover: hover)").matches) {
    $(".hero, .band--ink, .band--ink2").forEach(function (sec) {
      var g = document.createElement("div");
      g.className = "glow";
      sec.insertBefore(g, sec.firstChild);
      sec.addEventListener("mousemove", function (e) {
        var r = sec.getBoundingClientRect();
        g.style.setProperty("--mx", (e.clientX - r.left) + "px");
        g.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
    /* magnetic buttons */
    $(".btn:not(.btn--sm)").forEach(function (b) {
      b.addEventListener("mousemove", function (e) {
        var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.18, y = (e.clientY - r.top - r.height / 2) * 0.28;
        b.style.transform = "translate(" + x + "px," + y + "px)";
      });
      b.addEventListener("mouseleave", function () { b.style.transform = ""; });
    });
  }
})();

/* ===================== Premium layer ===================== */
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !document.documentElement.classList.contains("js")) return;
  var $ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  /* 1. intro curtain, once per visit, home page only */
  var curtainMs = 0;
  try {
    var onHome = document.getElementById("site") && document.getElementById("site").getAttribute("data-page") === "home";
    if (onHome && !sessionStorage.getItem("jr-intro")) {
      sessionStorage.setItem("jr-intro", "1");
      var c = document.createElement("div");
      c.className = "curtain";
      c.setAttribute("aria-hidden", "true");
      c.innerHTML = '<div class="curtain__in"><img src="assets/logo-emblem.png" alt="" width="60" height="68"><b>JohnsonRich &amp; Co.</b><small>Capital Intelligence Company</small></div>';
      document.body.appendChild(c);
      curtainMs = 650;
      setTimeout(function () { c.remove(); }, 1500);
    }
  } catch (e) {}

  /* 2. split headlines into masked words */
  function split(node, idx) {
    Array.prototype.slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
          var w = document.createElement("span"), i = document.createElement("span");
          w.className = "w"; i.textContent = part; idx.n++;
          i.style.setProperty("--i", idx.n);
          w.appendChild(i); frag.appendChild(w);
        });
        node.replaceChild(frag, n);
      } else if (n.nodeType === 1 && n.tagName !== "BR") {
        n.classList.add("sp");
        split(n, idx);
      }
    });
  }
  var wio = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); wio.unobserve(e.target); } });
  }, { threshold: 0.2, rootMargin: "0px 0px -8% 0px" });
  var heads = $(".hero h1, .page-head h1, .band h2, .panel-split h2, .statement h2");
  heads.forEach(function (h) {
    var idx = { n: 0 };
    var label = h.textContent.replace(/\s+/g, " ").trim();
    split(h, idx);
    h.setAttribute("aria-label", label);
    Array.prototype.forEach.call(h.querySelectorAll(".w"), function (w) { w.setAttribute("aria-hidden", "true"); });
    h.classList.add("wsplit");
    Array.prototype.forEach.call(h.querySelectorAll(".w > span"), function (sp, k) { sp.style.setProperty("--i", k); });
    if (h.matches(".hero h1")) {
      h.style.setProperty("--wd", (curtainMs + 150) + "ms");
      requestAnimationFrame(function () { requestAnimationFrame(function () { h.classList.add("in"); }); });
    } else if (h.matches(".page-head h1")) {
      requestAnimationFrame(function () { requestAnimationFrame(function () { h.classList.add("in"); }); });
    } else {
      wio.observe(h);
    }
  });

  /* 3. cursor ring (mouse only) */
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var ring = document.createElement("div");
    ring.className = "cursor";
    ring.setAttribute("aria-hidden", "true");
    document.body.appendChild(ring);
    var tx = 0, ty = 0, x = 0, y = 0, shown = false;
    document.addEventListener("mousemove", function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!shown) { shown = true; x = tx; y = ty; ring.classList.add("on"); }
      var t = e.target.closest ? e.target.closest("a, button, summary, .row") : null;
      ring.classList.toggle("big", !!t);
    });
    document.addEventListener("mouseleave", function () { ring.classList.remove("on"); shown = false; });
    document.addEventListener("mousedown", function () { ring.classList.add("down"); });
    document.addEventListener("mouseup", function () { ring.classList.remove("down"); });
    (function loop() {
      x += (tx - x) * 0.18; y += (ty - y) * 0.18;
      ring.style.transform = "translate3d(" + x + "px," + y + "px,0)";
      requestAnimationFrame(loop);
    })();
  }
})();

/* Current year in the footer */
(function () {
  var y = String(new Date().getFullYear());
  var els = document.querySelectorAll("[data-year]");
  for (var i = 0; i < els.length; i++) els[i].textContent = y;
})();

/* Header booking menu: individual or business */
(function () {
  var b = document.getElementById("bk-btn"), p = document.getElementById("bk-panel");
  if (!b || !p) return;
  function set(open) { b.setAttribute("aria-expanded", open ? "true" : "false"); p.hidden = !open; }
  b.addEventListener("click", function (e) { e.stopPropagation(); set(p.hidden); });
  p.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("a")) set(false); });
  document.addEventListener("click", function (e) { if (!p.hidden && !(e.target.closest && e.target.closest(".bk"))) set(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !p.hidden) { set(false); b.focus(); } });
})();

/* Testimonial carousel: auto-advances, can be swiped or scrolled, centre card zooms */
(function () {
  var track = document.getElementById("proof-track");
  if (!track) return;
  var sec = document.getElementById("proof"), stage = sec.querySelector(".proof__stage");
  var cards = Array.prototype.slice.call(track.children);
  var dots = Array.prototype.slice.call(document.querySelectorAll("#proof-dots i"));
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var idx = 0, paused = false, visible = false, resume = 0, ticking = false;

  function centerOf(c) { return c.offsetLeft + c.offsetWidth / 2; }
  function update() {
    ticking = false;
    var mid = track.scrollLeft + track.clientWidth / 2, best = 0, bd = 1e9;
    cards.forEach(function (c, i) {
      var d = Math.abs(centerOf(c) - mid), t = Math.min(d / (c.offsetWidth * 0.9), 1);
      if (d < bd) { bd = d; best = i; }
      if (!reduce) { c.style.setProperty("--s", (1 - 0.14 * t).toFixed(3)); c.style.setProperty("--o", (1 - 0.55 * t).toFixed(3)); }
    });
    idx = best;
    cards.forEach(function (c, i) { c.classList.toggle("is-active", i === best); });
    dots.forEach(function (d, i) { d.classList.toggle("on", i === best); });
    if (!reduce && stage) {
      var r = sec.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.max(0, Math.min(1, (vh - r.top) / (vh * 0.9)));
      stage.style.setProperty("--enter", (0.9 + 0.1 * p).toFixed(3));
    }
  }
  function go(i) {
    i = (i + cards.length) % cards.length;
    track.scrollTo({ left: centerOf(cards[i]) - track.clientWidth / 2, behavior: reduce ? "auto" : "smooth" });
  }
  function hold() { paused = true; clearTimeout(resume); resume = setTimeout(function () { paused = false; }, 9000); }
  track.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener("resize", function () { go(idx); update(); });
  ["pointerdown", "wheel", "touchstart", "focusin", "mouseenter"].forEach(function (ev) { track.addEventListener(ev, hold, { passive: true }); });
  document.getElementById("proof-prev").addEventListener("click", function () { hold(); go(idx - 1); });
  document.getElementById("proof-next").addEventListener("click", function () { hold(); go(idx + 1); });
  track.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { e.preventDefault(); hold(); go(idx + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); hold(); go(idx - 1); }
  });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0.4 }).observe(sec);
  } else { visible = true; }
  if (!reduce) setInterval(function () { if (!paused && visible && !document.hidden) go(idx + 1); }, 5200);
  track.scrollLeft = 0; update();
})();

/* Visit and click tracking: works with Umami, Plausible or Google Analytics, whichever snippet is installed in the <head>.
   Links with data-track="event_name" are counted when clicked. If no analytics snippet is installed, nothing is sent. */
(function () {
  var SRC = "direct";
  try {
    var q = new URLSearchParams(location.search).get("utm_source");
    if (q) sessionStorage.setItem("jr_src", q);
    SRC = sessionStorage.getItem("jr_src") || "direct";
  } catch (e) {}
  function track(name, props) {
    props = props || {};
    props.source = SRC;
    try { if (window.umami && window.umami.track) window.umami.track(name, props); } catch (e) {}
    try { if (window.plausible) window.plausible(name, { props: props }); } catch (e) {}
    try { if (window.gtag) window.gtag("event", name, props); } catch (e) {}
  }
  window.jrTrack = track;
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("[data-track]");
    if (!a) return;
    var where = a.getAttribute("data-loc");
    if (!where) {
      var sec = a.closest("section, header, footer, .dock, .mobile-nav");
      where = sec ? (sec.id || (sec.className || "").toString().split(" ")[0] || sec.tagName.toLowerCase()) : "page";
    }
    track(a.getAttribute("data-track"), { location: where, page: location.pathname });
  });
})();
