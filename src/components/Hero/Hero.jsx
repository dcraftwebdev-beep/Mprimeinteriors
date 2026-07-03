'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import styles from './Hero.module.css';

gsap.registerPlugin(SplitText);

export default function Hero() {
  const containerRef = useRef(null);
  const targetFrameRef = useRef(0);
  const renderedFrameRef = useRef(0);
  const rafRef = useRef(null);

  const titleRefs = useRef([useRef(null), useRef(null), useRef(null)]);
  const subRefs = useRef([useRef(null), useRef(null), useRef(null)]);
  const descRefs = useRef([useRef(null), useRef(null), useRef(null)]);
  const splitRefs = useRef([null, null, null]);

  const [currentFrame, setCurrentFrame] = useState(0);
  const [holdState, setHoldState] = useState({ index: 0, visible: true, key: 0 });

  const totalFrames = 301;
  const lerp = 0.18;   // Faster lerp for smoother tracking
  const maxStep = 8;   // Larger step to keep pace better

  // Segments: Each content gets full attention before transition
  const segments = [
    { p0: 0.00, p1: 0.20, hold: true,  frame: 0,   text: 0 },     // Content 1: 0-20%
    { p0: 0.20, p1: 0.33, hold: false, f0: 0,   f1: 100 },        // Transition 1: 20-33%
    { p0: 0.33, p1: 0.53, hold: true,  frame: 100, text: 1 },     // Content 2: 33-53%
    { p0: 0.53, p1: 0.67, hold: false, f0: 100, f1: 200 },        // Transition 2: 53-67%
    { p0: 0.67, p1: 0.87, hold: true,  frame: 200, text: 2 },     // Content 3: 67-87%
    { p0: 0.87, p1: 1.00, hold: false, f0: 200, f1: 300 },        // Transition 3: 87-100%
  ];

  const contentItems = [
    {
      eyebrow: 'M Prime Interiors',
      title: 'Luxury, Reimagined for Living',
      description:
        'Each space is composed, not decorated — precise material choices and considered light, built for the way you actually live.',
    },
    {
      eyebrow: 'Signature Craft',
      title: 'Detail Is the Whole Point',
      description:
        'From hand-finished surfaces to custom joinery, every element is sourced and built to a standard most projects never reach.',
    },
    {
      eyebrow: 'Your Vision, Realized',
      title: 'A Home That Feels Inevitable',
      description:
        'We take a space from first sketch to final styling, so the result feels like it could never have been any other way.',
    },
  ];

  // Preload frames
  useEffect(() => {
    for (let i = 1; i <= totalFrames; i++) {
      const img = new Image();
      img.src = `/frames/ezgif-frame-${String(i).padStart(3, '0')}.jpg`;
    }
  }, []);

  const prevHoldRef = useRef({ index: -1, visible: true });
  const warnedRef = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;

      if (scrollable <= 0) {
        if (!warnedRef.current) {
          warnedRef.current = true;
          console.warn(
            '[Hero] scroll track has no scrollable height yet ' +
              `(rect.height=${rect.height}, viewport=${window.innerHeight}). ` +
              'If this persists after load, a parent element is likely ' +
              'constraining .hero to viewport height instead of 700vh.'
          );
        }
        return;
      }

      let p = -rect.top / scrollable;
      p = Math.max(0, Math.min(1, p));

      // Find segment — strict less-than on p1 except last segment
      let seg = null;
      for (let i = 0; i < segments.length; i++) {
        const s = segments[i];
        const isLast = i === segments.length - 1;
        if (p >= s.p0 && (isLast ? p <= s.p1 : p < s.p1)) {
          seg = s;
          break;
        }
      }
      if (!seg) seg = segments[segments.length - 1];

      if (seg.hold) {
        targetFrameRef.current = seg.frame;
        const prev = prevHoldRef.current;
        if (prev.index !== seg.text || !prev.visible) {
          prevHoldRef.current = { index: seg.text, visible: true };
          setHoldState((s) => ({ index: seg.text, visible: true, key: s.key + 1 }));
        }
      } else {
        const t = (p - seg.p0) / (seg.p1 - seg.p0);
        const clampedT = Math.max(0, Math.min(1, t));
        targetFrameRef.current = seg.f0 + (seg.f1 - seg.f0) * clampedT;
        const prev = prevHoldRef.current;
        if (prev.visible) {
          prevHoldRef.current = { ...prev, visible: false };
          setHoldState((s) => ({ ...s, visible: false, key: s.key + 1 }));
        }
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('load', onScroll);
    onScroll();
    const t1 = setTimeout(onScroll, 100);
    const t2 = setTimeout(onScroll, 500);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('load', onScroll);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // rAF — smooth lerp, fast enough to track scroll over 700vh without stuttering
  useEffect(() => {
    const tick = () => {
      const target = targetFrameRef.current;
      const rendered = renderedFrameRef.current;
      const diff = target - rendered;

      if (Math.abs(diff) < 0.1) {
        renderedFrameRef.current = target;
      } else {
        const step = Math.max(-maxStep, Math.min(maxStep, diff * lerp));
        renderedFrameRef.current = rendered + step;
      }

      const frame = Math.round(renderedFrameRef.current);
      setCurrentFrame((prev) => (prev !== frame ? frame : prev));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // GSAP text animation
  useEffect(() => {
    const idx = holdState.index;
    const titleRef = titleRefs.current[idx];
    const subRef = subRefs.current[idx];
    const descRef = descRefs.current[idx];

    if (holdState.visible) {
      if (splitRefs.current[idx]) splitRefs.current[idx].revert();
      gsap.set(titleRef.current, { opacity: 1, y: 0 });

      const split = SplitText.create(titleRef.current, { type: 'words, chars' });
      splitRefs.current[idx] = split;

      gsap.from(split.chars, {
        duration: 0.8,
        y: 60,
        autoAlpha: 0,
        stagger: 0.025,
        ease: 'power3.out',
        overwrite: true,
      });

      gsap.fromTo(
        [subRef.current, descRef.current],
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.7, delay: 0.1, stagger: 0.1, ease: 'power2.out', overwrite: true }
      );
    } else {
      gsap.to([titleRef.current, subRef.current, descRef.current], {
        opacity: 0,
        y: -20,
        duration: 0.4,
        ease: 'power2.in',
        overwrite: true,
      });
    }
  }, [holdState.key]);

  useEffect(() => () => { splitRefs.current.forEach(r => { if (r) r.revert(); }); }, []);

  const frameNumber = String(Math.max(0, Math.min(totalFrames - 1, currentFrame)) + 1).padStart(3, '0');
  const frameSrc = `/frames/ezgif-frame-${frameNumber}.jpg`;
  const current = contentItems[holdState.index];

  return (
    <section ref={containerRef} className={styles.hero}>
      <div className={styles.pinned}>
        <div className={styles.frameContainer}>
          <img
            src={frameSrc}
            alt="Interior"
            className={styles.frame}
            onError={(e) => { e.target.src = '/frames/ezgif-frame-001.jpg'; }}
          />
          <div className={styles.scrim} />
        </div>

        <div className={styles.overlayContent}>
          {contentItems.map((item, i) => (
            <div
              key={i}
              className={styles.contentSection}
              style={{
                opacity: holdState.index === i && holdState.visible ? 1 : 0,
                pointerEvents: holdState.index === i && holdState.visible ? 'auto' : 'none',
                transition: 'opacity 0.4s ease',
              }}
            >
              <p ref={subRefs.current[i]} className={styles.mainSubtitle}>{item.eyebrow}</p>
              <h1 ref={titleRefs.current[i]} className={`${styles.mainTitle} split`}>{item.title}</h1>
              <p ref={descRefs.current[i]} className={styles.mainDescription}>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
