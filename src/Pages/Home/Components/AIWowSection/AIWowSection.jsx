"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./AIWowSection.module.css";

gsap.registerPlugin(ScrollTrigger);

const STYLES = [
  { key: "proportion", label: "Proportion", note: "Balanced, tailored, deliberate." },
  { key: "light",      label: "Light",      note: "Sunlit whites, soft and airy." },
  { key: "material",   label: "Material",   note: "Walnut, marble, warm brass." },
  { key: "silence",    label: "Silence",    note: "Quiet tones, nothing extra." },
];

const MAX_BYTES = 15 * 1024 * 1024; // accept the original file up to this size — we compress it down below
const COMPRESS_MAX_DIM = 1600;      // longest edge, in px, after compression
const COMPRESS_QUALITY = 0.85;      // JPEG quality
const REVEAL_POS = 52; // where the result's before/after settles after its reveal sweep

// Vercel serverless functions cap request bodies at ~4.5MB — a hard
// platform limit, not something our own code controls. Phone photos are
// routinely 5–15MB, so instead of asking the user to pre-shrink their
// own photo, we resize + recompress it in the browser before it's ever
// sent. This runs on a canvas and returns a JPEG File well under the
// limit for virtually any input photo.
function compressImage(file, maxDim = COMPRESS_MAX_DIM, quality = COMPRESS_QUALITY) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height / width) * maxDim);
          width = maxDim;
        } else {
          width = Math.round((width / height) * maxDim);
          height = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error("Could not process that image.")); return; }
          resolve(new File([blob], "room.jpg", { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image file."));
    };
    img.src = url;
  });
}

export default function AIWowSection() {
  const root = useRef(null);

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [style, setStyle] = useState("material");
  const [phase, setPhase] = useState("idle"); // idle | uploaded | loading | done | error
  const [resultUrl, setResultUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef(null);

  // ── entrance reveal (header + tagline), matches the rest of the site ──
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const eyebrow = el.querySelector(`.${styles.eyebrow}`);
    const headLines = gsap.utils.toArray(`.${styles.headLine}`, el);
    const tagline = el.querySelector(`.${styles.tagline}`);
    const sub = el.querySelector(`.${styles.sub}`);
    const panel = el.querySelector(`.${styles.panel}`);

    if (reduce) {
      gsap.set([eyebrow, tagline, sub, panel], { autoAlpha: 1, y: 0 });
      gsap.set(headLines, { scaleX: 1 });
      return;
    }

    gsap.set([eyebrow, tagline, sub], { autoAlpha: 0, y: 24 });
    gsap.set(headLines, { scaleX: 0 });
    gsap.set(panel, { autoAlpha: 0, y: 36 });

    const tl = gsap.timeline({
      defaults: { ease: "power3.out" },
      scrollTrigger: {
        trigger: el,
        start: "top 70%",
        end: "bottom 40%",
        toggleActions: "play none none reverse",
      },
    });

    tl.to(eyebrow, { autoAlpha: 1, y: 0, duration: 0.55 }, 0)
      .to(headLines, { scaleX: 1, duration: 0.6, ease: "power2.out", stagger: 0.08 }, 0.08)
      .to(tagline, { autoAlpha: 1, y: 0, duration: 0.75 }, 0.2)
      .to(sub, { autoAlpha: 1, y: 0, duration: 0.6 }, 0.4)
      .to(panel, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out" }, 0.45);

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  const handleFile = useCallback(async (f) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setErrorMsg("Please upload an image file.");
      setPhase("error");
      return;
    }
    if (f.size > MAX_BYTES) {
      setErrorMsg("Please upload a photo under 15MB.");
      setPhase("error");
      return;
    }

    setPhase("compressing");
    setErrorMsg("");
    try {
      // Resize + recompress so the upload reliably fits under Vercel's
      // ~4.5MB request-body limit, regardless of the original photo size.
      const compressed = await compressImage(f);
      setFile(compressed);
      setPreviewUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(compressed);
      });
      setResultUrl(null);
      setPhase("uploaded");
    } catch (err) {
      setErrorMsg(err.message || "Could not process that photo. Try a different one.");
      setPhase("error");
    }
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const submit = async () => {
    if (!file || !style) return;
    setPhase("loading");
    setErrorMsg("");
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("style", style);

      const res = await fetch("/api/room-redesign", { method: "POST", body: formData });

      // A 413 (or other platform-level rejection) comes back from Vercel
      // itself as plain text, not our handler's JSON — guard against that
      // instead of letting res.json() throw a confusing parse error.
      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok || !data?.image) {
        const fallback =
          res.status === 413
            ? "That photo is still too large for the server to accept. Try a different photo."
            : `Something went wrong (${res.status}). Please try again.`;
        throw new Error(data?.error || fallback);
      }

      setResultUrl(data.image);
      setPhase("done");
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong. Please try again.");
      setPhase("error");
    }
  };

  const tryAnotherStyle = () => {
    setResultUrl(null);
    setPhase("uploaded");
  };

  const startOver = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setPhase("idle");
    setErrorMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <section className={styles.section} ref={root}>
      <div className={styles.head}>
        <div className={styles.indexRow}>
          <span className={styles.headLine} />
          <span className={styles.eyebrow}>05 — Your Room, Reimagined</span>
          <span className={styles.headLine} />
        </div>
        <h2 className={styles.tagline}>See YOUR room, redesigned.</h2>
        <p className={styles.sub}>
          Upload a photo of any room. Choose a principle of the M Prime
          standard. Watch it become the room you actually want to live in.
        </p>
      </div>

      <div className={styles.panel}>
        {phase !== "done" && (
          <UploadStage
            styles={styles}
            phase={phase}
            dragOver={dragOver}
            setDragOver={setDragOver}
            onDrop={onDrop}
            previewUrl={previewUrl}
            fileInputRef={fileInputRef}
            handleFile={handleFile}
            style={style}
            setStyle={setStyle}
            submit={submit}
            errorMsg={errorMsg}
            startOver={startOver}
          />
        )}

        {phase === "done" && resultUrl && previewUrl && (
          <ResultStage
            styles={styles}
            beforeUrl={previewUrl}
            afterUrl={resultUrl}
            styleLabel={STYLES.find((s) => s.key === style)?.label}
            onTryAnother={tryAnotherStyle}
            onStartOver={startOver}
          />
        )}
      </div>
    </section>
  );
}

/* ================================================================
   UPLOAD + STYLE PICK STAGE
   ================================================================ */
function UploadStage({
  styles,
  phase,
  dragOver,
  setDragOver,
  onDrop,
  previewUrl,
  fileInputRef,
  handleFile,
  style,
  setStyle,
  submit,
  errorMsg,
  startOver,
}) {
  return (
    <div className={styles.uploadGrid}>
      <div
        className={`${styles.dropzone} ${dragOver ? styles.dropzoneActive : ""} ${previewUrl ? styles.dropzoneFilled : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !previewUrl && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload a photo of your room"
      >
        {previewUrl ? (
          <>
            <img src={previewUrl} alt="Your uploaded room" className={styles.dropPreview} />
            {(phase === "loading" || phase === "compressing") && (
              <div className={styles.scanOverlay} aria-live="polite" aria-label={phase === "compressing" ? "Preparing your photo" : "Designing your room"}>
                <div className={styles.scanLine} />
                <span className={styles.scanText}>
                  {phase === "compressing" ? "Preparing your photo…" : "Designing your room…"}
                </span>
              </div>
            )}
            {phase !== "loading" && phase !== "compressing" && (
              <button
                type="button"
                className={styles.swapBtn}
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              >
                Change photo
              </button>
            )}
          </>
        ) : (
          <div className={styles.dropEmpty}>
            <span className={styles.dropIcon} aria-hidden="true">
              <svg viewBox="0 0 48 48" width="34" height="34" fill="none">
                <path d="M24 31V9M24 9l-8 8M24 9l8 8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 31v6a3 3 0 0 0 3 3h26a3 3 0 0 0 3-3v-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className={styles.dropTitle}>Drop a photo of your room</span>
            <span className={styles.dropSub}>or click to browse — any size, we'll resize it automatically</span>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className={styles.hiddenInput}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      <div className={styles.controls}>
        <span className={styles.controlsLabel}>Choose a direction</span>
        <div className={styles.chipGrid}>
          {STYLES.map((s) => (
            <button
              key={s.key}
              type="button"
              className={`${styles.chip} ${style === s.key ? styles.chipOn : ""}`}
              onClick={() => setStyle(s.key)}
              disabled={phase === "loading" || phase === "compressing"}
              aria-pressed={style === s.key}
            >
              <span className={styles.chipLabel}>{s.label}</span>
              <span className={styles.chipNote}>{s.note}</span>
            </button>
          ))}
        </div>

        {phase === "error" && errorMsg && (
          <p className={styles.errorMsg} role="alert">{errorMsg}</p>
        )}

        <button
          type="button"
          className={`btn-prime btn-prime-matcha ${styles.submitBtn}`}
          onClick={submit}
          disabled={!previewUrl || phase === "loading" || phase === "compressing"}
        >
          <span>
            {phase === "loading" ? "Designing…" : phase === "compressing" ? "Preparing…" : "Redesign My Room"}
          </span>
          {phase !== "loading" && phase !== "compressing" && (
            <span className="btn-prime-icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <path d="M100,44.896V55.104H94.82449A27.66327,27.66327,0,0,0,68.22692,81.70112v5.104H58.01937v-5.104A37.41244,37.41244,0,0,1,69.95209,55.104H.08V44.896H69.95209A37.41244,37.41244,0,0,1,58.01937,18.29888v-5.104H68.22692v5.104A27.67577,27.67577,0,0,0,94.89644,44.896Z" />
              </svg>
            </span>
          )}
        </button>

        <p className={styles.privacyNote}>
          Your photo is used only to generate this preview — it isn&apos;t stored.
        </p>

        {previewUrl && phase !== "loading" && phase !== "compressing" && (
          <button type="button" className={styles.resetLink} onClick={startOver}>
            Start over
          </button>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   RESULT STAGE — personal before/after, same drag-compare pattern as
   the site-wide Transformation section, now scoped to their own photo.
   ================================================================ */
function ResultStage({ styles, beforeUrl, afterUrl, styleLabel, onTryAnother, onStartOver }) {
  const compareRef = useRef(null);
  const draggingRef = useRef(false);

  const applyPos = (pct) => {
    const clamped = Math.min(100, Math.max(0, pct));
    compareRef.current?.style.setProperty("--pos", `${clamped}%`);
  };

  // reveal sweep the moment the result mounts — the "wow" beat
  useEffect(() => {
    const el = compareRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      applyPos(REVEAL_POS);
      return;
    }
    applyPos(0);
    el.classList.add(styles.revealing);
    const t = setTimeout(() => applyPos(REVEAL_POS), 60);
    const clear = setTimeout(() => el.classList.remove(styles.revealing), 1400);
    return () => { clearTimeout(t); clearTimeout(clear); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = compareRef.current;
    if (!el) return;
    let rect = null;

    const percentFromClientX = (clientX) => {
      if (!rect) return 50;
      return ((clientX - rect.left) / rect.width) * 100;
    };
    const onMove = (e) => {
      if (!draggingRef.current) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      applyPos(percentFromClientX(clientX));
    };
    const endDrag = () => {
      draggingRef.current = false;
      el.classList.remove(styles.dragging);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", endDrag);
    };
    const startDrag = (e) => {
      draggingRef.current = true;
      rect = el.getBoundingClientRect();
      el.classList.add(styles.dragging);
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      applyPos(percentFromClientX(clientX));
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerup", endDrag);
    };
    el.addEventListener("pointerdown", startDrag);
    return () => {
      el.removeEventListener("pointerdown", startDrag);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", endDrag);
    };
  }, [styles]);

  return (
    <div className={styles.resultWrap}>
      <div className={styles.resultCompare} ref={compareRef} style={{ "--pos": "0%" }}>
        <div className={`${styles.rLayer} ${styles.rAfter}`}>
          <img src={afterUrl} alt={`Your room redesigned in the ${styleLabel} direction`} draggable={false} />
          <span className={`${styles.rTag} ${styles.rTagAfter}`}>After</span>
        </div>
        <div className={`${styles.rLayer} ${styles.rBefore}`}>
          <img src={beforeUrl} alt="Your room, original" draggable={false} />
          <span className={`${styles.rTag} ${styles.rTagBefore}`}>Before</span>
        </div>
        <div className={styles.rHandleLine} aria-hidden="true" />
        <div className={styles.rHandleKnob} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="12" height="12"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <svg viewBox="0 0 24 24" width="12" height="12"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      </div>

      <div className={styles.resultActions}>
        <span className={styles.resultCaption}>Redesigned with {styleLabel}</span>
        <div className={styles.resultButtons}>
          <a href={afterUrl} download="m-prime-redesign.png" className={`btn-prime btn-prime-matcha ${styles.submitBtn}`}>
            <span>Download This Redesign</span>
            <span className="btn-prime-icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <path d="M100,44.896V55.104H94.82449A27.66327,27.66327,0,0,0,68.22692,81.70112v5.104H58.01937v-5.104A37.41244,37.41244,0,0,1,69.95209,55.104H.08V44.896H69.95209A37.41244,37.41244,0,0,1,58.01937,18.29888v-5.104H68.22692v5.104A27.67577,27.67577,0,0,0,94.89644,44.896Z" />
              </svg>
            </span>
          </a>
          <button type="button" className={styles.resetLink} onClick={onTryAnother}>
            Try another direction
          </button>
          <button type="button" className={styles.resetLink} onClick={onStartOver}>
            Upload a different room
          </button>
        </div>
      </div>
    </div>
  );
}