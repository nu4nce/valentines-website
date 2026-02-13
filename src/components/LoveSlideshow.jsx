import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Mobiel-vriendelijke slideshow met:
 * - auto-play + pause/play
 * - progress bar
 * - swipe links/rechts
 * - crossfade + "page-like" 3D tilt
 * + aparte stats sectie onderaan (scroll)
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

  const DURATION_MS = 2500;
  const TICK_MS = 25;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);

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

  // ---------- Samen-sinds timer ----------
  // 26 juni 2025 (maand 0-indexed: 5 = juni)
  const sinceRef = useRef(new Date(2025, 5, 26, 0, 0, 0));

  const calcElapsed = (from, to) => {
    const diffMs = Math.max(0, to - from);
    const totalSec = Math.floor(diffMs / 1000);

    const days = Math.floor(totalSec / 86400);
    const rem1 = totalSec % 86400;

    const hours = Math.floor(rem1 / 3600);
    const rem2 = rem1 % 3600;

    const minutes = Math.floor(rem2 / 60);
    const seconds = rem2 % 60;

    return { days, hours, minutes, seconds };
  };

  const pad2 = (n) => String(n).padStart(2, "0");
  const [together, setTogether] = useState(() =>
    calcElapsed(sinceRef.current, new Date())
  );

  useEffect(() => {
    const id = setInterval(() => {
      setTogether(calcElapsed(sinceRef.current, new Date()));
    }, 1000);
    return () => clearInterval(id);
  }, []);
  // --------------------------------------

  // ---------- Compatibiliteit “fake calc” ----------
  const [compState, setCompState] = useState("idle"); // idle | calculating | done
  const compTimerRef = useRef(null);

  const startCompatibility = () => {
    if (compState === "calculating") return;
    setCompState("calculating");

    if (compTimerRef.current) clearTimeout(compTimerRef.current);
    compTimerRef.current = setTimeout(() => {
      setCompState("done");
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (compTimerRef.current) clearTimeout(compTimerRef.current);
    };
  }, []);
  // -----------------------------------------------

  // Autoplay progress
  useEffect(() => {
    if (paused) return;

    const interval = setInterval(() => {
      if (!startRef.current) startRef.current = Date.now();
      const elapsed = Date.now() - startRef.current;
      const p = Math.min(1, elapsed / DURATION_MS);
      setProgress(p);

      if (p >= 1) next();
    }, TICK_MS);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, index, slides.length]);

  // Keyboard
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

    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next();
      else prev();
    }
    touch.current.active = false;
  };

  // “tilt” effect op desktop
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
    <div style={styles.page}>
      {/* top section */}
      <div style={styles.stage}>
        <div style={styles.header}>
          <h1 style={styles.title}>Dis us babe 💗</h1>
          <div style={styles.scrollHint}>Scroll naar onder toe!</div>
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

          <div style={styles.hint}>Swipe ↔︎ • Spatie = pause/play</div>
        </div>
      </div>

      {/* stats section (scroll down) */}
      <div style={styles.statsSection}>
        <div style={styles.statsCard}>
          <h2 style={styles.statsTitle}>Stats ✨</h2>

          {/* Samen sinds */}
          <div style={styles.statBlock}>
            <div style={styles.statHead}>⏳ Samen sinds 26 juni 2025</div>
            <div style={styles.timerRow}>
              <div style={styles.timerCell}>
                <div style={styles.timerNum}>{together.days}</div>
                <div style={styles.timerLbl}>dagen</div>
              </div>
              <div style={styles.timerCell}>
                <div style={styles.timerNum}>{pad2(together.hours)}</div>
                <div style={styles.timerLbl}>uur</div>
              </div>
              <div style={styles.timerCell}>
                <div style={styles.timerNum}>{pad2(together.minutes)}</div>
                <div style={styles.timerLbl}>min</div>
              </div>
              <div style={styles.timerCell}>
                <div style={styles.timerNum}>{pad2(together.seconds)}</div>
                <div style={styles.timerLbl}>sec</div>
              </div>
            </div>
          </div>

          {/* FaceTime */}
          <div style={styles.statBlock}>
            <div style={styles.statHead}>💤 Wie eerder slaapt tijdens FaceTime</div>
            <div style={styles.statValue}>Martyna 🏆</div>
          </div>

          {/* Compatibiliteit */}
          <div style={styles.statBlock}>
            <div style={styles.statHead}>💘 Compatibiliteit</div>

            {compState === "idle" && (
              <button style={styles.calcBtn} onClick={startCompatibility}>
                Bereken compatibiliteit
              </button>
            )}

            {compState === "calculating" && (
              <div style={styles.calcBox}>
                <div style={styles.calcLine}>Calculating…</div>
                <div style={styles.calcSub}>Even kijken hoor…</div>
                <div style={styles.spinner} aria-hidden="true" />
              </div>
            )}

            {compState === "done" && (
              <div style={styles.statValue}>
                99.999%{" "}
                <span style={styles.smallNote}>(die 0.001% is Diva)</span>
              </div>
            )}
          </div>

          <div style={styles.footerNote}>
            (Deze pagina blijft tellen zolang je ‘m open hebt 😌)
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  // interne scroller (want body overflow hidden)
  page: {
    height: "100svh",
    width: "100vw",
    overflowY: "auto",
    overscrollBehavior: "none",
    WebkitOverflowScrolling: "touch",
    background:
      "radial-gradient(circle at top, #ffc1da, #ff77b7 35%, #ff3c8a 70%, #ff2d73)",
  },

  stage: {
    minHeight: "100svh",
    display: "grid",
    placeItems: "center",
    padding: "24px",
  },

  header: {
    position: "fixed",
    top: 18,
    left: 0,
    right: 0,
    display: "grid",
    placeItems: "center",
    pointerEvents: "none",
    gap: 8,
    zIndex: 5,
  },

  title: {
    margin: 0,
    padding: "10px 18px",
    borderRadius: 999,
    color: "white",
    fontSize: "clamp(16px, 4vw, 28px)",
    textShadow: "0 8px 22px rgba(0,0,0,.25)",
    fontFamily: 'ui-serif, "Times New Roman", Georgia, serif',
    letterSpacing: 0.2,
    background: "rgba(255,255,255,.12)",
    backdropFilter: "blur(8px)",
  },

  scrollHint: {
    color: "rgba(255,255,255,.9)",
    fontSize: 12,
    background: "rgba(255,255,255,.10)",
    padding: "6px 10px",
    borderRadius: 999,
    textShadow: "0 8px 18px rgba(0,0,0,.18)",
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

  // ---- stats section ----
  statsSection: {
    padding: "28px 18px 48px",
    display: "grid",
    placeItems: "center",
  },

  statsCard: {
    width: "min(94vw, 620px)",
    borderRadius: 28,
    padding: 18,
    background: "rgba(255,255,255,.16)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 18px 60px rgba(0,0,0,.28)",
    display: "grid",
    gap: 14,
  },

  statsTitle: {
    margin: "4px 0 2px",
    color: "white",
    fontSize: "clamp(18px, 4.2vw, 26px)",
    textShadow: "0 8px 22px rgba(0,0,0,.25)",
    fontFamily: 'ui-serif, "Times New Roman", Georgia, serif',
    textAlign: "center",
  },

  statBlock: {
    borderRadius: 22,
    padding: 14,
    background: "rgba(255,255,255,.10)",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,.20)",
    display: "grid",
    gap: 10,
  },

  statHead: {
    color: "rgba(255,255,255,.95)",
    fontWeight: 900,
    fontSize: 14,
  },

  statValue: {
    color: "rgba(255,255,255,.95)",
    fontSize: "clamp(16px, 4.2vw, 20px)",
    fontFamily: 'ui-serif, "Times New Roman", Georgia, serif',
    textShadow: "0 8px 18px rgba(0,0,0,.18)",
  },

  smallNote: {
    opacity: 0.95,
    fontSize: "0.95em",
  },

  timerRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 10,
  },

  timerCell: {
    borderRadius: 18,
    padding: "10px 8px",
    background: "rgba(255,255,255,.12)",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,.18)",
    textAlign: "center",
  },

  timerNum: {
    color: "rgba(255,255,255,.98)",
    fontWeight: 900,
    fontSize: "clamp(16px, 4.6vw, 22px)",
    lineHeight: 1,
  },

  timerLbl: {
    marginTop: 6,
    color: "rgba(255,255,255,.9)",
    fontSize: 11,
  },

  calcBtn: {
    height: 44,
    border: "none",
    borderRadius: 999,
    background: "rgba(255,255,255,.92)",
    color: "#ff2d73",
    fontWeight: 900,
    fontSize: 14,
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(0,0,0,.18)",
    justifySelf: "start",
    padding: "0 16px",
  },

  calcBox: {
    color: "rgba(255,255,255,.95)",
    display: "grid",
    gap: 4,
    alignItems: "center",
    justifyItems: "start",
  },

  calcLine: {
    fontWeight: 900,
    fontSize: 14,
  },

  calcSub: {
    opacity: 0.9,
    fontSize: 12,
  },

  spinner: {
    width: 18,
    height: 18,
    borderRadius: 999,
    border: "2px solid rgba(255,255,255,.35)",
    borderTopColor: "rgba(255,255,255,.95)",
    animation: "spin 0.8s linear infinite",
    marginTop: 6,
  },

  footerNote: {
    color: "rgba(255,255,255,.85)",
    fontSize: 12,
    textAlign: "center",
    paddingTop: 2,
  },
};

// tiny keyframes (inline style can't define keyframes, so we inject once)
if (typeof document !== "undefined" && !document.getElementById("love-slideshow-spin")) {
  const style = document.createElement("style");
  style.id = "love-slideshow-spin";
  style.innerHTML = `
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `;
  document.head.appendChild(style);
}
