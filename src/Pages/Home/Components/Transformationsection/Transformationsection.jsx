"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./TransformationSection.module.css";

gsap.registerPlugin(ScrollTrigger);

// Swap these for real project photography — same room, before + after.
const BEFORE_IMG =
  "https://images.unsplash.com/photo-1502005097973-6a7082348e28?auto=format&fit=crop&w=1800&q=80";
const AFTER_IMG =
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1800&q=80";

const REST_POS = 50;   // where the split settles once the demo hint finishes
const DEMO_START = 14; // slider starts mostly on "after" …
const DEMO_END = 62;   // … sweeps across to hint that it's draggable …
const STEP = 4;        // keyboard nudge, in percent

export default function TransformationSection() {
  const root = useRef(null);
  const stageRef = useRef(null);
  const handleRef = useRef(null);
  const posRef = useRef(REST_POS);
  const draggingRef = useRef(false);

  // Single source of truth for the split position. Updates the DOM
  // directly (CSS custom property + aria attribute) instead of going
  // through React state — during a drag this can fire on every pointer
  // move, and a state-driven re-render loop is exactly the kind of thing
  // that reintroduces the lag we just spent a round fixing elsewhere.
  const applyPos = (pct) => {
    const clamped = Math.min(100, Math.max(0, pct));
    posRef.current = clamped;
    const stage = stageRef.current;
    const handle = handleRef.current;
    if (stage) stage.style.setProperty("--pos", `${clamped}%`);
    if (handle) handle.setAttribute("aria-valuenow", String(Math.round(clamped)));
  };

  // ── entrance reveal + one-time "demo sweep" so the slider reads as
  // interactive without needing an instruction paragraph ──
  useEffect(() => {
    const el = root.current;
    const stage = stageRef.current;
    if (!el || !stage) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const eyebrow = el.querySelector(`.${styles.eyebrow}`);
    const headLines = gsap.utils.toArray(`.${styles.headLine}`, el);
    const tagBefore = el.querySelector(`.${styles.tagBefore}`);
    const tagAfter = el.querySelector(`.${styles.tagAfter}`);
    const hint = el.querySelector(`.${styles.hint}`);
    const tagline = el.querySelector(`.${styles.tagline}`);
    const sub = el.querySelector(`.${styles.sub}`);
    const cta = el.querySelector(`.${styles.cta}`);

    if (reduce) {
      applyPos(REST_POS);
      gsap.set([eyebrow, tagBefore, tagAfter, tagline, sub, cta], { autoAlpha: 1, y: 0 });
      gsap.set(headLines, { scaleX: 1 });
      return;
    }

    applyPos(DEMO_START);
    gsap.set([eyebrow, tagline, sub, cta], { autoAlpha: 0, y: 26 });
    gsap.set([tagBefore, tagAfter], { autoAlpha: 0, y: 10 });
    gsap.set(headLines, { scaleX: 0 });
    gsap.set(hint, { autoAlpha: 0 });

    const tl = gsap.timeline({
      defaults: { ease: "power3.out" },
      scrollTrigger: {
        trigger: el,
        start: "top 65%",
        end: "bottom 40%",
        toggleActions: "play none none reverse",
      },
    });

    tl.to(eyebrow, { autoAlpha: 1, y: 0, duration: 0.6 }, 0)
      .to(headLines, { scaleX: 1, duration: 0.7, ease: "power2.out", stagger: 0.1 }, 0.1)
      .to([tagBefore, tagAfter], { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.15 }, 0.35)
      .to(hint, { autoAlpha: 1, duration: 0.5 }, 0.6)
      .to(tagline, { autoAlpha: 1, y: 0, duration: 0.85 }, 0.6)
      .to(sub, { autoAlpha: 1, y: 0, duration: 0.7 }, 0.82)
      .to(cta, { autoAlpha: 1, y: 0, duration: 0.6 }, 0.98);

    // one-time sweep of the divider, purely cosmetic — hints "drag me"
    // without a single word of instruction copy.
    const sweep = { p: DEMO_START };
    const demoTween = gsap.to(sweep, {
      p: DEMO_END,
      duration: 2.2,
      delay: 1.0,
      ease: "power3.inOut",
      onUpdate: () => applyPos(sweep.p),
      onComplete: () => {
        gsap.to(sweep, {
          p: REST_POS,
          duration: 0.9,
          ease: "power2.out",
          onUpdate: () => applyPos(sweep.p),
        });
        gsap.to(hint, { autoAlpha: 0, duration: 0.6, delay: 1.3 });
      },
      scrollTrigger: {
        trigger: el,
        start: "top 65%",
        toggleActions: "play none none none",
      },
    });

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
      demoTween.scrollTrigger?.kill();
      demoTween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── pointer + touch drag, direct DOM updates, no React re-renders ──
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    let rect = null;

    const percentFromClientX = (clientX) => {
      if (!rect) return posRef.current;
      return ((clientX - rect.left) / rect.width) * 100;
    };

    const onMove = (e) => {
      if (!draggingRef.current) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      applyPos(percentFromClientX(clientX));
    };

    const endDrag = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      stage.classList.remove(styles.dragging);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };

    const startDrag = (e) => {
      draggingRef.current = true;
      rect = stage.getBoundingClientRect();
      stage.classList.add(styles.dragging);
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      applyPos(percentFromClientX(clientX));
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerup", endDrag);
      window.addEventListener("pointercancel", endDrag);
    };

    stage.addEventListener("pointerdown", startDrag);
    return () => {
      stage.removeEventListener("pointerdown", startDrag);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, []);

  const onHandleKeyDown = (e) => {
    let next = posRef.current;
    if (e.key === "ArrowLeft") next -= STEP;
    else if (e.key === "ArrowRight") next += STEP;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = 100;
    else return;
    e.preventDefault();
    // keyboard nudges get the CSS transition (smooth snap); pointer drag
    // stays transition-free for 1:1 tracking — the `.dragging` class
    // controls which one applies. Make sure it's off here.
    stageRef.current?.classList.remove(styles.dragging);
    applyPos(next);
  };

  return (
    <section
      className={styles.section}
      ref={root}
      aria-label="Before and after interior transformation comparison"
    >
      <div
        className={styles.stage}
        ref={stageRef}
        style={{ "--pos": `${REST_POS}%` }}
      >
        <div className={`${styles.layer} ${styles.afterLayer}`}>
          <img src={AFTER_IMG} alt="Room after the M Prime transformation" draggable={false} />
          <span className={`${styles.tag} ${styles.tagAfter}`}>After</span>
        </div>

        <div className={`${styles.layer} ${styles.beforeLayer}`}>
          <img src={BEFORE_IMG} alt="The same room, before" draggable={false} />
          <span className={`${styles.tag} ${styles.tagBefore}`}>Before</span>
        </div>

        <div className={styles.scrimTop} aria-hidden="true" />
        <div className={styles.scrimBottom} aria-hidden="true" />

        <div className={styles.header}>
          <div className={styles.indexRow}>
            <span className={styles.headLine} />
            <span className={styles.eyebrow}>04 — The Transformation Moment</span>
            <span className={styles.headLine} />
          </div>
        </div>

        <div className={styles.handleLine} aria-hidden="true" />
        <button
          type="button"
          ref={handleRef}
          className={styles.handleKnob}
          role="slider"
          aria-label="Drag to compare before and after"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={REST_POS}
          onKeyDown={onHandleKeyDown}
        >
          <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
            <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <span className={styles.hint} aria-hidden="true">Drag to compare</span>

        <div className={styles.footer}>
          <h2 className={styles.tagline}>This is what we do.</h2>
          <p className={styles.sub}>
            The gap between the room you&apos;re standing in and the one you
            actually want — closed.
          </p>
          <button className={`btn-prime btn-prime-matcha ${styles.cta}`}>
            <span>Start Your Transformation</span>
            <span className="btn-prime-icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <path d="M100,44.896V55.104H94.82449A27.66327,27.66327,0,0,0,68.22692,81.70112v5.104H58.01937v-5.104A37.41244,37.41244,0,0,1,69.95209,55.104H.08V44.896H69.95209A37.41244,37.41244,0,0,1,58.01937,18.29888v-5.104H68.22692v5.104A27.67577,27.67577,0,0,0,94.89644,44.896Z" />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}