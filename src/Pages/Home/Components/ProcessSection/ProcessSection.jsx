"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import styles from "./ProcessSection.module.css";

gsap.registerPlugin(ScrollTrigger, SplitText);

const STEPS = [
  {
    n: "01",
    name: "Discover",
    text: "We begin in your rooms, not ours — learning how you live, move and rest before a single line is drawn.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <polygon points="16 8 13.5 13.5 8 16 10.5 10.5 16 8" />
      </svg>
    ),
  },
  {
    n: "02",
    name: "Design",
    text: "Plans, materials and light resolved to the millimetre — until nothing in the room competes.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    n: "03",
    name: "Craft",
    text: "Trusted makers turn the drawings into matter — every joint and finish held to one standard.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 3 21 8 12 13 3 8 12 3" />
        <polyline points="3 12 12 17 21 12" />
        <polyline points="3 16 12 21 21 16" />
      </svg>
    ),
  },
  {
    n: "04",
    name: "Reveal",
    text: "We hand back a space that holds its silence — composed, calm, and unmistakably yours.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8.5" cy="8.5" r="4.5" />
        <path d="M11.7 11.7 20 20" />
        <path d="M16 16l2 2" />
        <path d="M18 14l2 2" />
      </svg>
    ),
  },
];

export default function ProcessSection() {
  const root = useRef(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;

    const titleEl = el.querySelector(`.${styles.title}`);
    const introEl = el.querySelector(`.${styles.intro}`);
    const headBtn = el.querySelector(`.${styles.headCta}`);
    const cards = gsap.utils.toArray(`.${styles.card}`, el);
    const curtains = gsap.utils.toArray(`.${styles.curtain}`, el);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let splits = [];
    let tl;

    if (reduce) {
      // Reduced motion: show everything in its final state, no animation.
      gsap.set([introEl, headBtn], { autoAlpha: 1, y: 0 });
      gsap.set(cards, { autoAlpha: 1, y: 0, scale: 1 });
      gsap.set(curtains, { autoAlpha: 0 });
      return;
    }

    const titleSplit = SplitText.create(titleEl, { type: "chars", charsClass: "splitChar" });
    splits = [titleSplit];

    gsap.set(titleSplit.chars, { autoAlpha: 0, yPercent: 110 });
    gsap.set(introEl, { autoAlpha: 0, y: 18 });
    gsap.set(headBtn, { autoAlpha: 0, y: 18 });
    // Cards are visible immediately — the curtain is what hides their content
    // until reveal, so there's no competing fade/scale on the card itself.
    gsap.set(cards, { autoAlpha: 1 });
    gsap.set(curtains, { x: "0%", y: "0%", rotate: 0, autoAlpha: 1 });

    const activateSpark = () => cards.forEach((c) => c.classList.add(styles.sparkScroll));
    const deactivateSpark = () => cards.forEach((c) => c.classList.remove(styles.sparkScroll));

    tl = gsap.timeline({
      defaults: { ease: "power3.out" },
      scrollTrigger: {
        trigger: el,
        start: "top 72%",
        toggleActions: "play none none reverse",
        // The spark loops the whole time the section is in view — same
        // continuous animation as the hover state — and switches off once
        // it scrolls out, so it isn't running unseen.
        onEnter: activateSpark,
        onEnterBack: activateSpark,
        onLeave: deactivateSpark,
        onLeaveBack: deactivateSpark,
      },
    });

    tl.to(titleSplit.chars, { autoAlpha: 1, yPercent: 0, duration: 0.7, stagger: 0.03 }, 0)
      .to(introEl, { autoAlpha: 1, y: 0, duration: 0.6 }, 0.25)
      .to(headBtn, { autoAlpha: 1, y: 0, duration: 0.6 }, 0.35)
      .to(
        curtains,
        {
          x: "112%",
          y: "-112%",
          rotate: -7,
          duration: 0.95,
          ease: "power3.inOut",
          stagger: 0.14,
        },
        0.4
      );

    return () => {
      tl?.scrollTrigger?.kill();
      tl?.kill();
      splits.forEach((s) => s?.revert());
      deactivateSpark();
    };
  }, []);

  return (
    <section className={styles.section} ref={root}>
      <div className={styles.inner}>
        {/* head — heading + intro left, CTA pill top-right */}
 <div className={styles.head}>
  <div className={styles.headText}>
    <div className={styles.indexRow}>
      <span className={styles.indexLine} />
      <span className={styles.eyebrow}>02 — How your dream becomes a reality</span>
      <span className={styles.indexLine} />
    </div>
    <h2 className={styles.title}>
      Our <em>Process</em>
    </h2>
    <p className={styles.intro}>
      Four measured phases, one continuous hand — from the first
      conversation to the room you finally walk into.
    </p>
  </div>

  <button className={`btn-prime btn-prime-dark ${styles.headCta}`}>
    <span>Start a Project</span>
    <span className="btn-prime-icon" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <path d="M100,44.896V55.104H94.82449A27.66327,27.66327,0,0,0,68.22692,81.70112v5.104H58.01937v-5.104A37.41244,37.41244,0,0,1,69.95209,55.104H.08V44.896H69.95209A37.41244,37.41244,0,0,1,58.01937,18.29888v-5.104H68.22692v5.104A27.67577,27.67577,0,0,0,94.89644,44.896Z" />
      </svg>
    </span>
  </button>
</div>

        {/* card grid — first + third card featured dark */}
        <div className={styles.grid}>
          {STEPS.map((s, i) => (
            <article
              key={s.n}
              className={`${styles.card} ${i === 0 || i === 2 ? styles.cardFeatured : ""}`}
            >
              {/* wipes away on scroll-reveal; spark sweeps its border as it clears */}
              <span className={styles.curtain} aria-hidden="true" />

              <span className={styles.cardIcon} aria-hidden="true">
                {s.icon}
              </span>
              <h3 className={styles.cardName}>{s.name}</h3>
              <p className={styles.cardText}>{s.text}</p>
              <span className={styles.tag}>Phase {s.n}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}