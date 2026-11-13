/* =========================================================
   General Store – site behaviour
   ========================================================= */

/* ---------- Events (from the November poster) ----------
   To add/edit events, just change this list.               */
const EVENTS = [
  {
    date: "2026-11-07",
    title: "Winchester Fireworks Night",
    text: "Join us for warming drinks and delicious treats. Try our special hot chocolates – gingerbread and white hot chocolate – plus mulled wine, cakes, jacket potatoes and more. After the display, come inside, unwind and relax with a glass of wine and a charcuterie board.",
  },
  {
    date: "2026-11-13",
    title: "Live music with Maddy Robinson",
    text: "Maddy is an emerging vocalist blending the soulful depth of R&B with contemporary pop and a glimpse of country. Inspired by Dolly Parton, Sienna Spiro, Adele, Raye and Jorja Smith, she brings rich vocals and emotional storytelling to every performance.",
    time: "Starts 7pm",
  },
  {
    date: "2026-11-14",
    title: "An evening of acoustic folk guitar with Henry Ayling",
    text: "Henry is a fingerstyle acoustic guitarist and singer-songwriter playing traditional folk songs, covers and many of his own songs and instrumentals.",
    time: "Starts 7pm",
  },
  {
    date: "2026-11-19",
    title: "Winchester Light Switch On & Jazz Evening",
    text: "Come in from the cold with a jacket potato, toasties, mulled wine, boozy coffees and hot chocolates, available all day. After the lights switch on, stay for charcuterie boards and wine with live music from saxophonist Yolanda Parkes.",
  },
  {
    date: "2026-11-20",
    title: "Opening of the Christmas Market & Jazz",
    text: "It's that time of year for mince pies and mulled wine, available all day. In the evening we're joined by live saxophonist Yolanda, bringing smooth jazz tunes with sharing boards and nibbles all evening.",
    time: "Jazz from 6:30pm",
  },
  {
    date: "2026-11-27",
    endDate: "2026-11-28",
    title: "Jazz, festive cocktails, charcuterie boards & nibbles",
    text: "Live saxophonist Yolanda brings smooth jazz tunes, accompanied by festive sharing boards and nibbles all evening.",
    time: "From 6:30pm",
  },
];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function renderEvents(filter) {
  const list = document.getElementById("events");
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const items = EVENTS.map(ev => {
    const start = new Date(ev.date + "T00:00:00");
    const end = new Date((ev.endDate || ev.date) + "T00:00:00");
    return { ...ev, start, end, past: end < today };
  }).filter(ev => filter === "all" || !ev.past);

  if (!items.length) {
    list.innerHTML = '<li class="events-empty">No upcoming events just now – check back soon!</li>';
    return;
  }

  list.innerHTML = items.map(ev => {
    const d1 = ev.start.getDate();
    const day = ev.endDate
      ? `${d1}<small>&amp;</small>${ev.end.getDate()}`
      : `${d1}<small>${ordinal(d1)}</small>`;
    return `
      <li class="event${ev.past ? " is-past" : ""}">
        <div class="event-date" aria-label="${ev.start.toDateString()}">
          <span class="d">${day}</span>
          <span class="m">${MONTHS[ev.start.getMonth()]}</span>
        </div>
        <div>
          <h3>${escapeHTML(ev.title)}${ev.past ? '<span class="past-tag">Been &amp; gone</span>' : ""}</h3>
          <p>${escapeHTML(ev.text)}</p>
          ${ev.time ? `<span class="time">${escapeHTML(ev.time)}</span>` : ""}
        </div>
      </li>`;
  }).join("");
}

document.querySelectorAll(".filter button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter button").forEach(b => b.classList.toggle("is-active", b === btn));
    renderEvents(btn.dataset.filter);
  });
});
renderEvents("upcoming");

/* ---------- Mobile nav ---------- */
const nav = document.querySelector(".site-nav");
const navToggle = document.querySelector(".nav-toggle");
navToggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", open);
});
nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
  nav.classList.remove("open");
  navToggle.setAttribute("aria-expanded", "false");
}));

/* ---------- Highlight current section in nav ---------- */
const links = [...nav.querySelectorAll("a")];
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      links.forEach(l => l.classList.toggle("is-current", l.getAttribute("href") === "#" + entry.target.id));
    }
  });
}, { rootMargin: "-45% 0px -50% 0px" });
document.querySelectorAll("main section[id]").forEach(s => observer.observe(s));

/* ---------- Contact form (mock-up: validates only, sends nothing) ---------- */
const form = document.getElementById("contact-form");
const rules = {
  name: v => v.trim().length >= 2,
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) && v.trim().length <= 254,
  query: v => v.trim().length >= 5,
};
function check(field) {
  const ok = rules[field.name](field.value);
  field.classList.toggle("invalid", !ok);
  form.querySelector(`.err[data-for="${field.name}"]`).classList.toggle("show", !ok);
  return ok;
}
const honeypot = document.getElementById("website");
form.addEventListener("submit", e => {
  e.preventDefault();
  // a bot filled the hidden spam-trap field: act as if sent, do nothing
  if (honeypot && honeypot.value) { form.reset(); document.getElementById("form-success").hidden = false; return; }
  const fields = [...form.querySelectorAll("[required]")];
  const allOk = fields.map(check).every(Boolean);
  if (!allOk) { form.querySelector(".invalid").focus(); return; }
  document.getElementById("form-success").hidden = false;
  form.reset();
});
form.querySelectorAll("[required]").forEach(f =>
  f.addEventListener("blur", () => { if (f.value) check(f); })
);

/* ---------- Header + hero share one drawing ----------
   Treat header + hero as one tall box, work out how the drawing "covers"
   it, then give the header the top strip and the hero the rest. The header
   is sticky, so it keeps its strip of the drawing as you scroll.          */
const header = document.querySelector(".site-header");
const hero = document.querySelector(".hero");
const ART = { w: 2400, h: 1887, focusY: 0.45 }; // assets/front-drawing.png
function syncArt() {
  const W = hero.clientWidth;
  const Hh = header.offsetHeight;
  const H = Hh + hero.offsetHeight;
  const scale = Math.max(W / ART.w, H / ART.h);
  const iw = ART.w * scale, ih = ART.h * scale;
  const x = (W - iw) / 2;
  const y = (H - ih) * ART.focusY;
  const r = document.documentElement.style;
  r.setProperty("--art-size", `${iw}px ${ih}px`);
  r.setProperty("--art-x", `${x}px`);
  r.setProperty("--art-y-header", `${y}px`);
  r.setProperty("--art-y-hero", `${y - Hh}px`);
}
syncArt();
window.addEventListener("resize", syncArt);
window.addEventListener("load", syncArt);
if (document.fonts) document.fonts.ready.then(syncArt);

/* ---------- Header hides on scroll down, returns on scroll up ---------- */
let lastY = window.scrollY;
let ticking = false;
function onScroll() {
  const y = Math.max(0, window.scrollY);
  const delta = y - lastY;
  const menuOpen = nav.classList.contains("open");
  const nearTop = y < header.offsetHeight;

  header.classList.toggle("is-scrolled", y > 4);
  if (nearTop || menuOpen || header.contains(document.activeElement)) {
    header.classList.remove("is-hidden");          // always show at the top / with menu open
  } else if (delta > 6) {
    header.classList.add("is-hidden");             // scrolling down
  } else if (delta < -6) {
    header.classList.remove("is-hidden");          // scrolling up
  }
  if (Math.abs(delta) > 6 || nearTop) lastY = y;   // ignore tiny jitters
  ticking = false;
}
window.addEventListener("scroll", () => {
  if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
}, { passive: true });
// keyboard users: bring the header back when tabbing into it
header.addEventListener("focusin", () => header.classList.remove("is-hidden"));

/* ---------- Footer year ---------- */
document.getElementById("year").textContent = new Date().getFullYear();
