import React, { useLayoutEffect, useRef, useState } from "react";

export default function ValentineGate({ onYes }) {
  const playgroundRef = useRef(null);
  const yesRef = useRef(null);
  const noRef = useRef(null);

  const [noPos, setNoPos] = useState({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);

  const rectsOverlap = (a, b) => {
    return !(
      a.right <= b.left ||
      a.left >= b.right ||
      a.bottom <= b.top ||
      a.top >= b.bottom
    );
  };

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const getRects = () => {
    const playgroundEl = playgroundRef.current;
    const yesEl = yesRef.current;
    const noEl = noRef.current;
    if (!playgroundEl || !yesEl || !noEl) return null;

    const playground = playgroundEl.getBoundingClientRect();
    const yes = yesEl.getBoundingClientRect();
    const no = noEl.getBoundingClientRect();

    // yes rect in playground-coördinaten
    const yesLocal = {
      left: yes.left - playground.left,
      top: yes.top - playground.top,
      right: yes.right - playground.left,
      bottom: yes.bottom - playground.top,
      width: yes.width,
      height: yes.height,
    };

    return { playground, yesLocal, no };
  };

  const jumpNo = () => {
    const data = getRects();
    if (!data) return;

    const { playground, yesLocal, no } = data;

    const padding = 14; // marge binnen vakje
    const avoidPadding = 12; // extra zone om "Ja" heen

    const maxX = playground.width - no.width - padding;
    const maxY = playground.height - no.height - padding;

    // veiligheidszone rond Ja (in playground coords)
    const yesAvoid = {
      left: yesLocal.left - avoidPadding,
      top: yesLocal.top - avoidPadding,
      right: yesLocal.right + avoidPadding,
      bottom: yesLocal.bottom + avoidPadding,
    };

    let best = null;

    // probeer veel random posities tot hij NIET overlapt met Ja
    for (let i = 0; i < 80; i++) {
      const x = padding + Math.random() * (maxX - padding);
      const y = padding + Math.random() * (maxY - padding);

      const noLocal = {
        left: x,
        top: y,
        right: x + no.width,
        bottom: y + no.height,
      };

      if (!rectsOverlap(noLocal, yesAvoid)) {
        best = { x, y };
        break;
      }
    }

    // fallback: kies een hoek die het verst is van Ja
    if (!best) {
      const yesCx = (yesAvoid.left + yesAvoid.right) / 2;
      const yesCy = (yesAvoid.top + yesAvoid.bottom) / 2;

      const corners = [
        { x: padding, y: padding },
        { x: maxX, y: padding },
        { x: padding, y: maxY },
        { x: maxX, y: maxY },
      ];

      corners.sort((c1, c2) => {
        const d1 = (c1.x - yesCx) ** 2 + (c1.y - yesCy) ** 2;
        const d2 = (c2.x - yesCx) ** 2 + (c2.y - yesCy) ** 2;
        return d2 - d1;
      });

      best = corners[0];
    }

    setNoPos({
      x: clamp(best.x, padding, maxX),
      y: clamp(best.y, padding, maxY),
    });
  };

  // Startpositie: zet Nee ergens “netjes” rechts/boven, binnen playground
  useLayoutEffect(() => {
    const data = getRects();
    if (!data) return;

    const { playground, yesLocal, no } = data;
    const padding = 14;

    const x = clamp(yesLocal.right + 16, padding, playground.width - no.width - padding);
    const y = clamp(yesLocal.top, padding, playground.height - no.height - padding);

    setNoPos({ x, y });
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Op resize: force opnieuw binnen bounds
  useLayoutEffect(() => {
    const onResize = () => jumpNo();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={styles.stage}>
      <div style={styles.card}>
        <h1 style={styles.question}>Wil je mijn valentijn zijn? :D</h1>

        {/* Dit is het “vakje” waarbinnen Nee mag bewegen */}
        <div style={styles.playground} ref={playgroundRef}>
          <button ref={yesRef} style={styles.yes} onClick={onYes}>
            Ja :)
          </button>

          <button
            ref={noRef}
            style={{
              ...styles.no,
              transform: ready
                ? `translate(${noPos.x}px, ${noPos.y}px)`
                : "translate(0px, 0px)",
            }}
            onPointerDown={(e) => {
              e.preventDefault(); // voorkomt dubbele events op mobiel
              jumpNo();
            }}
          >
            Nee :(
          </button>
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
    padding: 18,
    background:
      "radial-gradient(circle at top, #ffc1da, #ff77b7 35%, #ff3c8a 70%, #ff2d73)",
  },
  card: {
    position: "relative",
    width: "min(96vw, 720px)",
    height: "min(86svh, 760px)",
    borderRadius: 28,
    padding: 22,
    background: "rgba(255,255,255,.16)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 18px 60px rgba(0,0,0,.28)",
    overflow: "hidden",
  },
  question: {
    margin: "6px 0 6px",
    color: "white",
    fontSize: "clamp(22px, 5vw, 34px)",
    textShadow: "0 8px 22px rgba(0,0,0,.25)",
    fontFamily: 'ui-serif, "Times New Roman", Georgia, serif',
  },
  sub: { margin: 0, color: "rgba(255,255,255,.9)" },

  // 👇 bounds voor Nee (NEE kan hier niet buiten)
  playground: {
    position: "relative",
    marginTop: 18,
    height: "calc(100% - 110px)", // genoeg ruimte voor titel/sub + hint
    borderRadius: 22,
    overflow: "hidden",
    background: "rgba(255,255,255,.08)",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,.20)",
  },

  yes: {
    position: "absolute",
    left: 18,
    bottom: 18,
    height: 52,
    padding: "0 22px",
    border: "none",
    borderRadius: 999,
    background: "rgba(255,255,255,.92)",
    color: "#ff2d73",
    fontWeight: 800,
    fontSize: 16,
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(0,0,0,.18)",
  },
  no: {
    position: "absolute",
    left: 0,
    top: 0,
    height: 52,
    padding: "0 22px",
    border: "none",
    borderRadius: 999,
    background: "rgba(255,255,255,.75)",
    color: "#ff2d73",
    fontWeight: 800,
    fontSize: 16,
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(0,0,0,.16)",
    transition: "transform 180ms ease",
    touchAction: "manipulation",
  },
  hint: {
    position: "absolute",
    right: 18,
    top: 18,
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,.12)",
    color: "rgba(255,255,255,.9)",
    fontSize: 12,
  },
};
