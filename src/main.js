/* ═══════════════════════════════════════════
   AVENLY BAKEHOUSE — Interactions
   Intro · Reveals · Nav · Tabs · Lightbox · Marquee · Smooth scroll
   ═══════════════════════════════════════════ */

const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Page opens under an intro curtain — never restore a mid-page scroll position */
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

/* ── 1. Intro curtain ── */
const intro = document.getElementById("intro");

function playIntro() {
  if (!intro || prefersReduced) {
    intro?.remove();
    return Promise.resolve();
  }

  document.documentElement.classList.add("intro-lock");

  const minShow = new Promise((r) => setTimeout(r, 750));
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  const pageLoad = new Promise((r) =>
    document.readyState === "complete"
      ? r()
      : window.addEventListener("load", r, { once: true })
  );
  const hardCap = new Promise((r) => setTimeout(r, 2600));

  return Promise.race([
    Promise.all([minShow, fontsReady, pageLoad]),
    hardCap,
  ]).then(() => {
    intro.classList.add("is-done");
    document.documentElement.classList.remove("intro-lock");
    setTimeout(() => intro.remove(), 950);
  });
}

/* ── 2. Word splitting for data-reveal="words" ── */
function splitWords(el) {
  el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
  let index = 0;

  const walk = (parent) => {
    [...parent.childNodes].forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach((token) => {
          if (!token) return;
          if (/^\s+$/.test(token)) {
            frag.appendChild(document.createTextNode(" "));
            return;
          }
          const outer = document.createElement("span");
          outer.className = "rw";
          const inner = document.createElement("span");
          inner.className = "rw__i";
          inner.textContent = token;
          inner.style.setProperty("--ri", index++);
          inner.setAttribute("aria-hidden", "true");
          outer.appendChild(inner);
          frag.appendChild(outer);
        });
        parent.replaceChild(frag, node);
      } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== "BR") {
        walk(node);
      }
    });
  };

  walk(el);
}

document.querySelectorAll('[data-reveal="words"]').forEach(splitWords);

/* ── 3. Scroll reveals (armed only after the curtain lifts) ── */
const revealEls = document.querySelectorAll("[data-reveal]");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.revealDelay || 0;
        setTimeout(() => {
          entry.target.classList.add("is-visible");
        }, Number(delay));
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);

function startReveals() {
  revealEls.forEach((el) => revealObserver.observe(el));
}

playIntro().then(startReveals);

/* ── 4. Nav: scrolled state + hide on scroll down ── */
const nav = document.getElementById("nav");
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");
let lastScroll = 0;

function onScroll() {
  const y = window.scrollY;
  const menuOpen = navLinks.classList.contains("nav__links--open");
  nav.classList.toggle("nav--scrolled", y > 60);
  if (!menuOpen && y > 320 && y > lastScroll + 4) {
    nav.classList.add("nav--hidden");
  } else if (y < lastScroll - 4 || y <= 320) {
    nav.classList.remove("nav--hidden");
  }
  lastScroll = y;
}

window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ── 5. Mobile nav toggle ── */
navToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("nav__links--open");
  navToggle.setAttribute("aria-expanded", open);
  navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  document.body.style.overflow = open ? "hidden" : "";
  if (open) nav.classList.remove("nav--hidden");
});

navLinks.querySelectorAll(".nav__link").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("nav__links--open");
    navToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  });
});

/* ── 6. Menu tabs ── */
const tabs = document.querySelectorAll(".menu__tab");
const panels = document.querySelectorAll(".menu__panel");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.tab;

    tabs.forEach((t) => {
      t.classList.remove("menu__tab--active");
      t.setAttribute("aria-selected", "false");
    });
    tab.classList.add("menu__tab--active");
    tab.setAttribute("aria-selected", "true");

    panels.forEach((p) => {
      const isActive = p.id === `panel-${target}`;
      p.classList.toggle("menu__panel--active", isActive);
      if (isActive) {
        p.removeAttribute("hidden");
      } else {
        p.setAttribute("hidden", "");
      }
    });
  });
});

/* ── 7. Lightbox ── */
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxCounter = document.getElementById("lightboxCounter");
const lightboxClose = document.getElementById("lightboxClose");
const lightboxPrev = document.getElementById("lightboxPrev");
const lightboxNext = document.getElementById("lightboxNext");

const galleryItems = document.querySelectorAll("[data-lightbox]");
const galleryData = Array.from(galleryItems).map((item) => {
  const img = item.querySelector("img");
  return {
    src: img.src,
    alt: img.alt,
  };
});

let currentIndex = 0;
let lenis = null;

function openLightbox(index) {
  currentIndex = index;
  updateLightbox();
  lightbox.classList.add("lightbox--open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  lenis?.stop();
}

function closeLightbox() {
  lightbox.classList.remove("lightbox--open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  lenis?.start();
}

function updateLightbox() {
  const item = galleryData[currentIndex];
  lightboxImg.src = item.src;
  lightboxImg.alt = item.alt;
  lightboxCounter.textContent = `${currentIndex + 1} / ${galleryData.length}`;
}

function prevImage() {
  currentIndex = (currentIndex - 1 + galleryData.length) % galleryData.length;
  updateLightbox();
}

function nextImage() {
  currentIndex = (currentIndex + 1) % galleryData.length;
  updateLightbox();
}

galleryItems.forEach((item) => {
  item.addEventListener("click", () => {
    openLightbox(Number(item.dataset.lightbox));
  });
});

lightboxClose.addEventListener("click", closeLightbox);
lightboxPrev.addEventListener("click", (e) => {
  e.stopPropagation();
  prevImage();
});
lightboxNext.addEventListener("click", (e) => {
  e.stopPropagation();
  nextImage();
});

lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", (e) => {
  if (!lightbox.classList.contains("lightbox--open")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") prevImage();
  if (e.key === "ArrowRight") nextImage();
});

/* ── 8. Marquee: pause while offscreen ── */
const marquee = document.querySelector("[data-marquee]");
if (marquee && "IntersectionObserver" in window) {
  marquee.classList.add("marquee--paused");
  const marqueeObserver = new IntersectionObserver(
    ([entry]) => {
      marquee.classList.toggle("marquee--paused", !entry.isIntersecting);
    },
    { threshold: 0 }
  );
  marqueeObserver.observe(marquee);
}

/* ── 9. Magnetic CTAs (fine pointers only) ── */
const canMagnetic =
  !prefersReduced &&
  matchMedia("(hover: hover) and (pointer: fine)").matches;

if (canMagnetic) {
  document.querySelectorAll(".btn").forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const r = btn.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      const y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      btn.classList.add("is-magnetic");
      btn.style.transform = `translate(${(x * 7).toFixed(1)}px, ${(
        y * 5 - 1
      ).toFixed(1)}px)`;
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "";
    });
  });
}

/* ── 10. Smooth scroll (Lenis — desktop only, loaded on demand) ── */
function initSmoothScroll() {
  if (prefersReduced) return;
  if (!matchMedia("(min-width: 1025px)").matches) return;

  import("lenis")
    .then(({ default: Lenis }) => {
      lenis = new Lenis({ duration: 1.15 });

      const raf = (time) => {
        lenis.raf(time);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);

      document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener("click", (e) => {
          const hash = link.getAttribute("href");
          e.preventDefault();
          if (!hash || hash === "#") {
            lenis.scrollTo(0);
            return;
          }
          const target = document.querySelector(hash);
          // scroll-padding-top (88px) already offsets the fixed nav — no extra offset
          if (target) lenis.scrollTo(target);
        });
      });
    })
    .catch(() => {
      /* native smooth scrolling stays as fallback */
    });
}

initSmoothScroll();
