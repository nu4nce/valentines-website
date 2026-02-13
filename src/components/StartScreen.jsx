import React from "react";

export default function StartScreen({ onStart, fadingOut }) {
  return (
    <div
      style={{
        ...styles.stage,
        opacity: fadingOut ? 0 : 1,
        transition: "opacity 2000ms ease",
      }}
    >
      <div style={styles.card}>
        <h1 style={styles.title}>Dla mojego kochanie, najdroższa, skarbie. ❤️</h1>
        <p style={styles.sub}>Ik heb iets kleins voor je gemaakt… bakayuro.</p>

        <button style={styles.btn} onClick={onStart}>
          Start
        </button>

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
    width: "min(92vw, 520px)",
    borderRadius: 28,
    padding: 26,
    background: "rgba(255,255,255,.16)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 18px 60px rgba(0,0,0,.28)",
    textAlign: "center",
  },
  title: {
    margin: "6px 0 8px",
    color: "white",
    fontSize: "clamp(24px, 6vw, 38px)",
    textShadow: "0 8px 22px rgba(0,0,0,.25)",
    fontFamily: 'ui-serif, "Times New Roman", Georgia, serif',
  },
  sub: {
    margin: "0 0 18px",
    color: "rgba(255,255,255,.9)",
    fontSize: 14,
  },
  btn: {
    height: 52,
    padding: "0 26px",
    border: "none",
    borderRadius: 999,
    background: "rgba(255,255,255,.92)",
    color: "#ff2d73",
    fontWeight: 900,
    fontSize: 16,
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(0,0,0,.18)",
    transform: "translateY(0px)",
  },
  hint: {
    marginTop: 14,
    color: "rgba(255,255,255,.85)",
    fontSize: 12,
  },
};
