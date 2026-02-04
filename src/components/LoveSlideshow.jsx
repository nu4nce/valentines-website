import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Mobiel-vriendelijke slideshow met:
 * - auto-play + pause/play
 * - progress bar
 * - swipe links/rechts
 * - crossfade + "page-like" 3D tilt
 */
export default function LoveSlideshow() {
  // Pas hier je foto’s aan (uit public/images)
  const slides = useMemo(
    () => [
      { src: "/images/Kochanie1.jpeg", alt: "Kochanie 1" },
      { src: "/images/Kochanie2.jpeg", alt: "Kochanie 2" },
      { src: "/images/Kochanie3.jpeg", alt: "Kochanie 3" },
      { src: "/images/Kochanie4.jpeg", alt: "Kochanie 4" },
      { src: "/images/Kochanie5.jpeg", alt: "Kochanie 5" },
    ],
    []
  );

  const DURATION_MS = 2500; // tijd per foto
  const TICK_MS = 25;       // progress update

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1

  const rafRef = useRef(null);
  const startRef = useRef(null);

  const next = () => {
    setIndex((i) => (i + 1) % slides.length);
    setProgress(0);
    startRef.current = null;
  };

  const prev = () => {
    setIndex((i) => (i - 1 + slides.length) % slides.length);
    setProgress(0);
    startRef.current = null;
  };

  // Autoplay progress
  useEffect(() => {
    if (paused) return;

    let interval = setInterval(() => {
      if (!startRef.current) startRef.current = Date.now();
      const elapsed = Date.now() - startRef.current;
      const p = Math.min(1, elapsed / DURATION_MS);
      setProgress(p);

      if (p >= 1) {
        next();
      }
    }, TICK_MS);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, index, slides.length]);

  // Spacebar toggle (nice on desktop)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        setPaused((p) => !p);
      }
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swipe support
  const touch = useRef({ x: 0, y: 0, active: false });

  const onTouchStart = (e) => {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY, active: true };
  };

  const onTouchEnd = (e) => {
    if (!touch.current.active) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.current.x;
    const dy = t.clientY - touch.current.y;

    // alleen horizontale swipes
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next();
      else prev();
    }
    touch.current.active = false;
  };

  // “tilt” effect op desktop (subtiel)
  const cardRef = useRef(null);
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) / r.width;
      const dy = (e.clientY - cy) / r.height;

      el.style.setProperty("--rx", `${(-dy * 6).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${(dx * 8).toFixed(2)}deg`);
    };
    const onLeave = () => {
      el.style.setProperty("--rx", `0deg`);
      el.style.setProperty("--ry", `0deg`);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  const current = slides[index];
  const nextSlide = slides[(index + 1) % slides.length];

  return (
    <div style={styles.stage}>
      <div style={styles.header}>
        <h1 style={styles.title}>Dis us babe :DDDDDDD </h1>
      </div>

      <div
        style={styles.card}
        ref={cardRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* pre-load next for smoothness */}
        <img src={nextSlide.src} alt="" style={{ display: "none" }} />

        <div style={styles.imageWrap}>
          {/* crossfade by key */}
          <img
            key={current.src}
            src={current.src}
            alt={current.alt}
            style={styles.image}
            draggable={false}
          />
        </div>

        {/* Controls */}
        <div style={styles.controls}>
          <button style={styles.smallBtn} onClick={prev} aria-label="Vorige">
            ‹
          </button>

          <button
            style={styles.mainBtn}
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? "▶ Play" : "⏸ Pause"}
          </button>

          <button style={styles.smallBtn} onClick={next} aria-label="Volgende">
            ›
          </button>
        </div>

        {/* Progress */}
        <div style={styles.progressOuter} aria-hidden="true">
          <div
            style={{
              ...styles.progressInner,
              transform: `scaleX(${progress})`,
            }}
          />
        </div>

        <div style={styles.hint}>
          Swipe ↔︎ op telefoon • Spatie = pause/play
        </div>
      </div>
    </div>
  );
}

const styles = {
  stage: {
    minHeight: "100svh",
    display: "grid",
    placeItems: "center",
    padding: "24px",
    background:
      "radial-gradient(circle at top, #ffc1da, #ff77b7 35%, #ff3c8a 70%, #ff2d73)",
  },
  header: {
    position: "fixed",
    top: 18,
    left: 0,
    right: 0,
    display: "grid",
    placeItems: "center",
    pointerEvents: "none",
  },
  title: {
    margin: 0,
    padding: "10px 18px",
    borderRadius: 999,
    color: "white",
    fontSize: "clamp(16px, 4vw, 28px)",
    textShadow: "0 8px 22px rgba(0,0,0,.25)",
    fontFamily:
      'ui-serif, "Times New Roman", Georgia, serif',
    letterSpacing: 0.2,
    background: "rgba(255,255,255,.12)",
    backdropFilter: "blur(8px)",
  },
  card: {
    width: "min(92vw, 420px)",
    height: "min(74svh, 640px)",
    borderRadius: 28,
    padding: 16,
    background: "rgba(255,255,255,.16)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 18px 60px rgba(0,0,0,.28)",
    display: "grid",
    gridTemplateRows: "1fr auto auto auto",
    gap: 12,
    transform:
      "perspective(900px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))",
    transition: "transform .12s ease",
    userSelect: "none",
  },
  imageWrap: {
    borderRadius: 22,
    overflow: "hidden",
    background: "rgba(255,255,255,.18)",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,.25)",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    animation: "fadeIn .35s ease",
  },
  controls: {
    display: "grid",
    gridTemplateColumns: "48px 1fr 48px",
    gap: 10,
    alignItems: "center",
  },
  mainBtn: {
    height: 44,
    border: "none",
    borderRadius: 999,
    background: "rgba(255,255,255,.92)",
    color: "#ff2d73",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(0,0,0,.18)",
  },
  smallBtn: {
    height: 44,
    width: 48,
    border: "none",
    borderRadius: 999,
    background: "rgba(255,255,255,.75)",
    color: "#ff2d73",
    fontWeight: 900,
    fontSize: 22,
    cursor: "pointer",
  },
  progressOuter: {
    height: 6,
    borderRadius: 999,
    background: "rgba(255,255,255,.35)",
    overflow: "hidden",
  },
  progressInner: {
    height: "100%",
    transformOrigin: "left",
    background: "rgba(255,255,255,.95)",
  },
  hint: {
    textAlign: "center",
    color: "rgba(255,255,255,.9)",
    fontSize: 12,
    paddingBottom: 4,
  },
};
