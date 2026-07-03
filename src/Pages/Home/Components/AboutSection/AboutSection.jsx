"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import styles from "./AboutSection.module.css";

gsap.registerPlugin(ScrollTrigger, SplitText);

const CARD_WIDTH = 170;
const GAP = 0;
const STEP = CARD_WIDTH + GAP;

const FAN = [
  { x: -STEP * 2.5, y: 95, r: -24 },
  { x: -STEP * 1.5, y: 48, r: -14 },
  { x: -STEP * 0.5, y: 0, r: -5 },
  { x: STEP * 0.5, y: 0, r: 5 },
  { x: STEP * 1.5, y: 48, r: 14 },
  { x: STEP * 2.5, y: 95, r: 24 },
];

/* bg fallbacks (shown briefly before each image loads) recolored to sit
   inside the Studio Fleur family — Carob/Matcha/Chai tones — instead of
   the previous arbitrary browns/teals/oranges that didn't belong to
   any token in the palette. */
const CARDS = [
  { tag: "Living",  bg: "#b3b792", img: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=500&q=70" }, // Pistache
  { tag: "Kitchen", bg: "#809671", img: "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=500&q=70" }, // Matcha
  { tag: "Suite",   bg: "#d2ab80", img: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=500&q=70" }, // Chai
  { tag: "Lounge",  bg: "#725c3a", img: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=500&q=70" }, // Carob
  { tag: "Bath",    bg: "#e5d2b8", img: "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=500&q=70" }, // Vanilla
  { tag: "Villa",   bg: "#8a7350", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=500&q=70" }, // Carob-light
];

export default function AboutSection() {
  const root = useRef(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;

    const cards = gsap.utils.toArray(`.${styles.card}`, el);
    // FIX: was `.${styles.badge}` — that class doesn't exist anywhere in
    // this component's JSX or CSS, so it resolved to nothing and GSAP
    // warned "target not found". The tag pills that render on each card
    // use `.cardTag`, so point the entrance animation at that instead.
    const badges = gsap.utils.toArray(`.${styles.cardTag}`, el);
    const reveals = gsap.utils.toArray(`.${styles.reveal}`, el);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    gsap.set(cards, { xPercent: -50, yPercent: -50 });

    const titleEl = el.querySelector(`.${styles.title}`);
    const subEl = el.querySelector(`.${styles.sub}`);
    const copyEl = el.querySelector(`.${styles.copy}`);
    const indexLines = gsap.utils.toArray(`.${styles.indexLine}`, el);
    const eyebrowEl = el.querySelector(`.${styles.eyebrow}`);

    let splits = [];
    let titleSplit, subSplit, copySplit;

    if (!reduce) {
      titleSplit = SplitText.create(titleEl, { type: "chars", charsClass: "splitChar" });
      subSplit = SplitText.create(subEl, { type: "chars", charsClass: "splitChar" });
      copySplit = SplitText.create(copyEl, { type: "words", wordsClass: "splitWord" });
      splits = [titleSplit, subSplit, copySplit];

      gsap.set([titleSplit.chars, subSplit.chars], { yPercent: 110, autoAlpha: 0 });
      gsap.set(copySplit.words, { y: 24, autoAlpha: 0 });
    }

    if (reduce) {
      cards.forEach((c, i) =>
        gsap.set(c, { x: FAN[i].x, y: FAN[i].y, rotation: FAN[i].r, opacity: 1 })
      );
      gsap.set([...badges, ...reveals], { opacity: 1, y: 0, scale: 1 });
      gsap.set(indexLines, { scaleX: 1 });
      gsap.set(eyebrowEl, { autoAlpha: 1 });
      return;
    }

    gsap.set(cards, { x: 0, y: 0, rotation: 0, opacity: 1, scale: 1 });
    gsap.set(badges, { opacity: 0, y: 20, scale: 0.8 });
    gsap.set(reveals, { opacity: 0, y: 30, scale: 0.95 });
    gsap.set(indexLines, { scaleX: 0 });
    gsap.set(eyebrowEl, { autoAlpha: 0 });

    // ── MAIN fan timeline ──
    const tl = gsap.timeline({
      defaults: { ease: "power3.out" },
      scrollTrigger: {
        trigger: el,
        start: "top 60%",
        end: "bottom 40%",
        toggleActions: "play none none reverse",
      },
    });

    tl.to(
      cards,
      {
        x: (i) => FAN[i].x,
        y: (i) => FAN[i].y,
        rotation: (i) => FAN[i].r,
        duration: 2.0,
        ease: "power3.inOut",
        stagger: { each: 0.12, from: "center" },
      },
      "0"
    )
      .to(indexLines, { scaleX: 1, duration: 0.6, ease: "power2.out", stagger: 0.08 }, "0.15")
      .to(eyebrowEl, { autoAlpha: 1, duration: 0.4, ease: "power2.out" }, "0.35")
      .to(titleSplit.chars, { yPercent: 0, autoAlpha: 1, duration: 0.8, ease: "power3.out", stagger: 0.04 }, "0.3")
      .to(subSplit.chars, { yPercent: 0, autoAlpha: 1, duration: 0.7, ease: "power3.out", stagger: 0.025 }, "0.65")
      .to(badges, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "back.out(1.6)", stagger: 0.15 }, "0.8")
      .to(copySplit.words, { y: 0, autoAlpha: 1, duration: 0.9, ease: "power3.out", stagger: 0.045 }, "1.0")
      .to(reveals, { opacity: 1, y: 0, scale: 1, duration: 1.0, ease: "power3.out", stagger: 0.18 }, "1.3");

    // ── EXIT: all cards fade out as section leaves (no fly-down twin) ──
    const exitTl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: "bottom 80%",
        end: "bottom 30%",
        scrub: 1,
      },
    });

    exitTl.to(cards, {
      autoAlpha: 0,
      scale: 0.9,
      y: -30,
      ease: "power2.in",
      stagger: { each: 0.04, from: "edges" },
    });

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
      exitTl.scrollTrigger?.kill();
      exitTl.kill();
      splits.forEach((s) => s?.revert());
    };
  }, []);

  return (
    <section className={styles.section} ref={root}>
      <div className={styles.head}>
        <div className={styles.indexRow}>
          <span className={styles.indexLine} />
          <span className={styles.eyebrow}>01 — Studio Index</span>
          <span className={styles.indexLine} />
        </div>
        <h2 className={styles.title}>
          Glimpse of <em>M Prime</em>
        </h2>
        <h3 className={styles.sub}>
          <span className={styles.count}>Six</span> disciplines, one team, every room.
        </h3>
      </div>

      <div className={styles.stage}>
        {CARDS.map((card, i) => (
          <div key={i} className={styles.card} style={{ "--bg": card.bg }}>
            <img src={card.img} alt={card.tag} loading="lazy" />
            <span className={styles.cardTag}>{card.tag}</span>
          </div>
        ))}
      </div>

      <p className={styles.copy}>
        We build brands that get found before they&apos;re searched for —
        strategy, design and engineering under one roof, moving as one.
      </p>

      <button className={`btn-prime btn-prime-dark ${styles.reveal}`}>
        <span>Explore Our Work</span>
        <span className="btn-prime-icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <path d="M100,44.896V55.104H94.82449A27.66327,27.66327,0,0,0,68.22692,81.70112v5.104H58.01937v-5.104A37.41244,37.41244,0,0,1,69.95209,55.104H.08V44.896H69.95209A37.41244,37.41244,0,0,1,58.01937,18.29888v-5.104H68.22692v5.104A27.67577,27.67577,0,0,0,94.89644,44.896Z" />
          </svg>
        </span>
      </button>
    </section>
  );
}