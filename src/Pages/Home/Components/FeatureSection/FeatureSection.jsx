"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import styles from "./FeatureSection.module.css";

gsap.registerPlugin(ScrollTrigger, SplitText);

// SAME image as About "Suite" card — the travelling one
const SUITE_IMG =
  "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=900&q=80";

const PRINCIPLES = [
  { n: "01", name: "Proportion", note: "Every dimension earns its place." },
  { n: "02", name: "Light",      note: "Shaped before it's switched on." },
  { n: "03", name: "Material",   note: "Chosen for how it ages, not how it shines." },
  { n: "04", name: "Silence",    note: "What's left when nothing competes." },
];

const STATS = [
  { value: "150+", label: "Interiors Delivered" },
  { value: "12",   label: "Design Awards" },
  { value: "18",   label: "Years, Combined" },
];

const CYCLE = 4000;

// How much of the pinned scroll range the card's dock animation consumes
// before it's left to rest. The remainder of the pin is "dwell" scroll —
// the card is already docked, and the right side is playing (or has
// played) its own autonomous entrance, not tied to scroll position.
const CARD_DURATION = 1;
const DWELL_DURATION = 1.35;
const DOCK_THRESHOLD = CARD_DURATION / (CARD_DURATION + DWELL_DURATION);

// Small "floating" card size before it docks into the full left panel.
// Kept as fixed px (matches the original design) rather than measured,
// since it's a deliberate art-directed size, not a proportion of anything.
const SMALL_W = 180;
const SMALL_H = 240;
const SMALL_ROTATION = -5;
const SMALL_RADIUS = 22; // desired *visual* corner radius at the small size
const DROP_OFFSET = 340; // px the card starts above its centered resting spot

export default function FeatureSection() {
  const root = useRef(null);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduce, setReduce] = useState(false);

  // detect reduced-motion once
  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // auto-cycle the focus counter (off under reduced motion / while hovered)
  useEffect(() => {
    if (reduce || paused) return;
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % PRINCIPLES.length);
    }, CYCLE);
    return () => clearInterval(id);
  }, [reduce, paused]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;

    const stage = el.querySelector(`.${styles.stage}`);
    const card = el.querySelector(`.${styles.card}`);
    const titleEl = el.querySelector(`.${styles.title}`);
    const copyEl = el.querySelector(`.${styles.copy}`);
    const copySecondary = el.querySelector(`.${styles.copySecondary}`);
    const eyebrow = el.querySelector(`.${styles.eyebrow}`);
    const headLine = el.querySelector(`.${styles.headLine}`);
    const statItems = gsap.utils.toArray(`.${styles.stat}`, el);
    const statDividers = gsap.utils.toArray(`.${styles.statDivider}`, el);
    const cta = el.querySelector(`.${styles.cta}`);
    const ctaLink = el.querySelector(`.${styles.ctaLink}`);
    const counter = el.querySelector(`.${styles.counter}`);
    const counterGhost = el.querySelector(`.${styles.counterGhost}`);
    const markers = gsap.utils.toArray(`.${styles.marker}`, el);
    const glow = el.querySelector(`.${styles.backdropGlow}`);

    const reduceMM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let splits = [];
    let pulseTween;
    let contentTl;

    // ── FLIP-style math: card's CSS box is ALWAYS its final docked size
    // (left:0, top:0, width:50%, height:100%) — see the stylesheet. We
    // never touch left/top/width/height/border-radius via GSAP because
    // those are layout properties and force a reflow on every scrub
    // frame. Instead we compute a translate + non-uniform scale that
    // makes that same box *look* like the small floating card, and
    // animate only `transform`/`opacity` — both are compositor-only,
    // so scrubbing them is effectively free.
    const measureDock = () => {
      const rect = stage.getBoundingClientRect();
      const finalW = rect.width * 0.5;
      const finalH = rect.height;
      const scaleX = SMALL_W / finalW;
      const scaleY = SMALL_H / finalH;
      // natural (untransformed) center of the docked box, vs. the center
      // of the whole stage — the difference is how far to translate so
      // the shrunk box reads as centered in the full section.
      const naturalCenterX = finalW / 2;
      const naturalCenterY = finalH / 2;
      const targetCenterX = rect.width / 2;
      const targetCenterY = rect.height / 2;
      return {
        x: targetCenterX - naturalCenterX,
        y: targetCenterY - naturalCenterY,
        scaleX,
        scaleY,
        // compensate so the radius still *reads* as ~SMALL_RADIUS once
        // the scale is applied, instead of shrinking along with everything else
        radius: SMALL_RADIUS / scaleX,
      };
    };

    if (reduceMM) {
      gsap.set(card, { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, borderRadius: 0, autoAlpha: 1 });
      gsap.set(
        [eyebrow, headLine, titleEl, copyEl, copySecondary, ...statItems, ...statDividers, counter, counterGhost, cta, ctaLink],
        { autoAlpha: 1, x: 0, y: 0, scaleX: 1 }
      );
      gsap.set(markers, { autoAlpha: 1, y: 0 });
      return;
    }

    const titleSplit = SplitText.create(titleEl, { type: "words,chars", charsClass: "splitChar" });
    const copySplit = SplitText.create(copyEl, { type: "words", wordsClass: "splitWord" });
    splits = [titleSplit, copySplit];

    // ── right-side content: hidden, waiting for its own entrance timeline
    // (NOT tied incrementally to scroll — see contentTl below) ──
    gsap.set(eyebrow, { autoAlpha: 0, x: 40 });
    gsap.set(headLine, { scaleX: 0 });
    gsap.set(titleSplit.chars, { autoAlpha: 0, yPercent: 110 });
    gsap.set(copySplit.words, { autoAlpha: 0, y: 22 });
    gsap.set(copySecondary, { autoAlpha: 0, y: 20 });
    gsap.set(statItems, { autoAlpha: 0, y: 18 });
    gsap.set(statDividers, { scaleY: 0 });
    gsap.set(counter, { autoAlpha: 0, y: 24 });
    gsap.set(counterGhost, { autoAlpha: 0, scale: 0.85 });
    gsap.set(markers, { autoAlpha: 0, y: 14 });
    gsap.set(cta, { autoAlpha: 0, y: 24 });
    gsap.set(ctaLink, { autoAlpha: 0, y: 24 });

    // ── ENTRANCE: card drops from above into its small, centered resting
    // spot — starts only once About has scrolled out. `invalidateOnRefresh`
    // means the function-based start/end values below get re-measured on
    // resize instead of going stale. transform + opacity only. ──
    gsap.fromTo(
      card,
      {
        x: () => measureDock().x,
        y: () => measureDock().y - DROP_OFFSET,
        scaleX: () => measureDock().scaleX,
        scaleY: () => measureDock().scaleY,
        rotation: SMALL_ROTATION,
        borderRadius: () => measureDock().radius,
        autoAlpha: 0,
      },
      {
        y: () => measureDock().y,
        autoAlpha: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 75%",
          end: "top 25%",
          scrub: 0.4,
          invalidateOnRefresh: true,
        },
      }
    );

    // ── RIGHT SIDE: a self-contained entrance timeline that plays fully
    // under its own easing/duration once triggered — the scrollbar only
    // decides *when* it fires, not how it plays out. ──
    contentTl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } })
      .to(eyebrow, { autoAlpha: 1, x: 0, duration: 0.55 }, 0)
      .to(headLine, { scaleX: 1, duration: 0.6, ease: "power2.out" }, 0.08)
      .to(titleSplit.chars, { autoAlpha: 1, yPercent: 0, stagger: 0.02, duration: 0.65 }, 0.18)
      .to(copySplit.words, { autoAlpha: 1, y: 0, stagger: 0.022, duration: 0.5 }, 0.46)
      .to(copySecondary, { autoAlpha: 1, y: 0, duration: 0.5 }, 0.6)
      .to(statDividers, { scaleY: 1, duration: 0.4, ease: "power2.out" }, 0.66)
      .to(statItems, { autoAlpha: 1, y: 0, stagger: 0.09, duration: 0.5 }, 0.68)
      .to(counterGhost, { autoAlpha: 1, scale: 1, duration: 0.7, ease: "power2.out" }, 0.8)
      .to(counter, { autoAlpha: 1, y: 0, duration: 0.5 }, 0.82)
      .to(markers, { autoAlpha: 1, y: 0, stagger: 0.06, ease: "back.out(1.6)", duration: 0.4 }, 0.94)
      .to(cta, { autoAlpha: 1, y: 0, duration: 0.5 }, 1.05)
      .to(ctaLink, { autoAlpha: 1, y: 0, duration: 0.5 }, 1.12);

    let contentShown = false;

    // ── PIN: card docks from its small centered spot into the full left
    // panel. Only `transform` (x/y/scaleX/scaleY/rotation) is scrubbed —
    // no left/top/width/height, so no layout thrash on scroll. Dock
    // finishes early; the remaining pin range is dwell/reading room, and
    // is also where the (non-scrubbed) right-side entrance fires. ──
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: el,
        start: "top top",
        end: "+=2000",
        scrub: 0.5,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (self.progress >= DOCK_THRESHOLD && !contentShown) {
            contentShown = true;
            contentTl.play();
          } else if (self.progress < DOCK_THRESHOLD && contentShown) {
            contentShown = false;
            contentTl.reverse();
          }
        },
      },
    });

    tl.to(
      card,
      {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        borderRadius: 0,
        ease: "power3.inOut",
        duration: CARD_DURATION,
      },
      0
    ).to({}, { duration: DWELL_DURATION }); // spacer — holds the pin open for reading + the content's own playback

    // ambient glow drift — subtle, slow, never distracting
    if (glow) {
      pulseTween = gsap.to(glow, {
        x: 30,
        y: -20,
        scale: 1.08,
        duration: 6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
      contentTl?.kill();
      pulseTween?.kill();
      ScrollTrigger.getAll().forEach((s) => {
        if (s.trigger === el) s.kill();
      });
      splits.forEach((s) => s?.revert());
    };
  }, []);

  const active = PRINCIPLES[idx];

  return (
    <section className={styles.section} ref={root}>
      <div className={styles.stage}>
        <div className={styles.card}>
          <img src={SUITE_IMG} alt="Suite" loading="lazy" />
          <span className={styles.cardTag}>Suite</span>
        </div>

        <div className={styles.content}>
          <div className={styles.backdrop} aria-hidden="true">
            <div className={styles.backdropGrid} />
            <div className={styles.backdropGlow} />
          </div>

          {/* head — follows About's Studio Index spec-line: eyebrow + hairline. */}
          <div className={styles.indexRow}>
            <span className={styles.eyebrow}>02 — The Standard</span>
            <span className={styles.headLine} />
          </div>

          <h2 className={styles.title}>Spaces that hold their silence.</h2>

          <p className={styles.copy}>
            Every room is composed, not decorated — proportion, light and
            material tuned until nothing competes. What remains is calm you can
            walk into.
          </p>

          <p className={styles.copySecondary}>
            From the first sketch to the final finish, the same standard
            follows every square foot — measured, considered, and never left
            to chance.
          </p>

          {/* impact strip — quick, credibility-building numbers before the
              deeper dive into the standard itself. */}
          <div className={styles.statRow}>
            {STATS.map((s, i) => (
              <div className={styles.statGroup} key={s.label}>
                {i > 0 && <span className={styles.statDivider} aria-hidden="true" />}
                <div className={styles.stat}>
                  <span className={styles.statNum}>{s.value}</span>
                  <span className={styles.statLabel}>{s.label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Signature: a FOCUS COUNTER. One principle of the M Prime standard
              held large at a time — a big editorial numeral, the name, the note —
              cycling slowly on its own like a chapter marker, with a sliding
              indicator under 01–04. One idea in focus, not a list. Pauses on
              hover; click any marker to jump. A faint oversized numeral sits
              behind it for a little more editorial weight. */}
          <div
            className={styles.counter}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <span className={styles.counterGhost} aria-hidden="true">
              {active.n}
            </span>

            <div className={styles.counterBody}>
              <span
                key={`idx-${idx}`}
                className={`${styles.counterIndex} ${reduce ? "" : styles.swap}`}
                aria-hidden="true"
              >
                {active.n}
              </span>
              <div className={styles.counterText}>
                <h3 key={`name-${idx}`} className={`${styles.counterName} ${reduce ? "" : styles.swap}`}>
                  {active.name}
                </h3>
                <p key={`note-${idx}`} className={`${styles.counterNote} ${reduce ? "" : styles.swap}`}>
                  {active.note}
                </p>
              </div>
            </div>

            <div className={styles.markers} role="tablist" aria-label="The M Prime standard">
              {PRINCIPLES.map((p, i) => (
                <button
                  key={p.n}
                  type="button"
                  role="tab"
                  aria-selected={i === idx}
                  className={`${styles.marker} ${i === idx ? styles.markerOn : ""}`}
                  onClick={() => setIdx(i)}
                >
                  {p.n}
                </button>
              ))}
              <span className={styles.markerLine} aria-hidden="true" />
              <span
                className={styles.markerInd}
                style={{ transform: `translateX(${idx * 100}%)` }}
                aria-hidden="true"
              />
            </div>
          </div>

          <div className={styles.ctaRow}>
            <button className={`btn-prime btn-prime-matcha ${styles.cta}`}>
              <span>View The Collection</span>
              <span className="btn-prime-icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                  <path d="M100,44.896V55.104H94.82449A27.66327,27.66327,0,0,0,68.22692,81.70112v5.104H58.01937v-5.104A37.41244,37.41244,0,0,1,69.95209,55.104H.08V44.896H69.95209A37.41244,37.41244,0,0,1,58.01937,18.29888v-5.104H68.22692v5.104A27.67577,27.67577,0,0,0,94.89644,44.896Z" />
                </svg>
              </span>
            </button>

            <a href="#" className={styles.ctaLink}>
              <span>Our Design Philosophy</span>
              <span className={styles.ctaLinkArrow} aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}