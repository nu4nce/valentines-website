// diva is zichtbaar als enemy hier, big ass hell ook


import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Simple Pacman-like:
 * - Heart player collects dots
 * - Video "dennis_talking.mp4" chases you
 * - Win once (all dots) -> onWin()
 *
 * Controls:
 * - WASD / Arrow keys
 * - Mobile: swipe
 */
export default function PacmanGame({ onWin }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  // GIF sprite (enemy)

  // const enemyGifRef = useRef(null);
  // const [enemyGifReady, setEnemyGifReady] = useState(false);

  // Countdown overlay state
  const [countdown, setCountdown] = useState(5);
  const countdownTimerRef = useRef(null);

  const [dotsLeftUI, setDotsLeftUI] = useState(0);

  // Enemy sprite frames (open / closed)
  const divaOpenRef = useRef(null);
  const divaClosedRef = useRef(null);

  const divaFrameRef = useRef(0); // 0 = closed, 1 = open

  // Player sprite frames (open / closed)
  const martynaOpenRef = useRef(null);
  const martynaClosedRef = useRef(null);

  const martynaFrameRef = useRef(0); // 0 = closed, 1 = open

  // Death / zoom-in overlay state
  const [deathPhase, setDeathPhase] = useState("none");
  // "none" | "fade" | "zoom" | "text" | "button"


  // A small, single-map layout (walls #, dots ., empty space ' ')
  const mapLines = useMemo(
    () => [
      "####################",
      "#......######......#",
      "#.####.######.####.#",
      "#.####........####.#",
      "#.####.######.####.#",
      "#......#....#......#",
      "######...##...######",
      "#......#....#......#",
      "#.####.######.####.#",
      "#.####........####.#",
      "#.####.######.####.#",
      "#......######......#",
      "####################",
    ],
    []
  );

  const rows = mapLines.length;
  const cols = mapLines[0].length;

  // Convert to grid
  const initialGrid = useMemo(() => mapLines.map((r) => r.split("")), [mapLines]);

  // Count dots
  const initialDotCount = useMemo(() => {
    let c = 0;
    for (const r of initialGrid) for (const cell of r) if (cell === ".") c++;
    return c;
  }, [initialGrid]);

  // Responsive sizing
  const [cell, setCell] = useState(24); // will be recalculated
  const [scale, setScale] = useState(1);

  // Game state in refs (so animation loop doesn't re-render constantly)
  const stateRef = useRef({
    grid: null,
    dotsLeft: 0,
    player: {
      x: 1,
      y: 1,
      dir: { x: 0, y: 0 },
      nextDir: { x: 0, y: 0 },
      facing: { x: -1, y: 0 }, // kijkt standaard links
    },
    enemy: {
      x: cols - 2,
      y: rows - 2,
      dir: { x: 0, y: 0 },
      facing: { x: -1, y: 0 }, // 👈 start facing left (pas aan indien nodig)
    },
    running: false, // start paused; countdown will turn this on
    won: false,
    lost: false,
    lastMoveAt: 0,
  });

  const clearCountdownTimer = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  };

  const startCountdown = () => {
    clearCountdownTimer();

    const s = stateRef.current;
    s.running = false; // pause game during countdown
    setCountdown(1);

    countdownTimerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearCountdownTimer();
          stateRef.current.running = true; // GO!
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  // Init / reset game state + start countdown
  useEffect(() => {
    stateRef.current.grid = initialGrid.map((r) => [...r]);
    stateRef.current.dotsLeft = initialDotCount;
    setDotsLeftUI(initialDotCount);
    stateRef.current.player = {
      x: 1,
      y: 1,
      dir: { x: 0, y: 0 },
      nextDir: { x: 0, y: 0 },
      facing: { x: -1, y: 0 },
    };
    stateRef.current.enemy = {
      x: cols - 2,
      y: rows - 2,
      dir: { x: 0, y: 0 },
      facing: { x: -1, y: 0 },
    };
    stateRef.current.won = false;
    stateRef.current.lost = false;
    stateRef.current.lastMoveAt = performance.now();

    startCountdown();

    return () => {
      clearCountdownTimer();
    };
  }, [initialGrid, initialDotCount, cols, rows]);


  // Load diva sprites (open / closed)
  useEffect(() => {
    const openImg = new Image();
    const closedImg = new Image();

    openImg.src = "/images/diva_open.png";
    closedImg.src = "/images/diva_dicht.png";

    divaOpenRef.current = openImg;
    divaClosedRef.current = closedImg;
  }, []);

  // Diva chomping animation (independent of movement)
  useEffect(() => {
    const interval = setInterval(() => {
      divaFrameRef.current = divaFrameRef.current === 0 ? 1 : 0;
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Load player sprites (open / closed)
  useEffect(() => {
    const openImg = new Image();
    const closedImg = new Image();

    openImg.src = "/images/martyna_open.png";
    closedImg.src = "/images/martyna_dicht.png";

    martynaOpenRef.current = openImg;
    martynaClosedRef.current = closedImg;
  }, []);

  // Martyna chomping animation
  useEffect(() => {
    const interval = setInterval(() => {
      martynaFrameRef.current =
        martynaFrameRef.current === 0 ? 1 : 0;
    }, 120); // iets rustiger dan diva

    return () => clearInterval(interval);
  }, []);



  // Calculate canvas size based on viewport
  useEffect(() => {
    const resize = () => {
      const maxW = Math.min(window.innerWidth * 0.92, 520);
      const maxH = Math.min(window.innerHeight * 0.72, 520);

      const cellW = Math.floor(maxW / cols);
      const cellH = Math.floor(maxH / rows);
      const newCell = Math.max(16, Math.min(cellW, cellH));
      setCell(newCell);
      setScale(1);
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [cols, rows]);

  const isWall = (grid, x, y) => grid[y]?.[x] === "#";
  const isDot = (grid, x, y) => grid[y]?.[x] === ".";

  const trySetDir = (grid, obj, dir) => {
    const nx = obj.x + dir.x;
    const ny = obj.y + dir.y;
    if (!isWall(grid, nx, ny)) {
      obj.dir = dir;
      return true;
    }
    return false;
  };

  const moveOneStep = (grid, obj) => {
    const nx = obj.x + obj.dir.x;
    const ny = obj.y + obj.dir.y;
    if (!isWall(grid, nx, ny)) {
      obj.x = nx;
      obj.y = ny;
      return true;
    }
    obj.dir = { x: 0, y: 0 };
    return false;
  };

  // Very simple chase: choose a valid move that reduces manhattan distance
  const enemyChaseStep = (grid, enemy, player) => {
    const options = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ].filter((d) => !isWall(grid, enemy.x + d.x, enemy.y + d.y));

    if (options.length === 0) return;

    options.sort((a, b) => {
      const da = Math.abs(enemy.x + a.x - player.x) + Math.abs(enemy.y + a.y - player.y);
      const db = Math.abs(enemy.x + b.x - player.x) + Math.abs(enemy.y + b.y - player.y);
      return da - db;
    });

    const pick = Math.random() < 0.2 && options[1] ? options[1] : options[0];
    enemy.dir = { x: pick.x, y: pick.y };
    enemy.facing = { x: pick.x, y: pick.y }; // 👈 onthoud richting
    moveOneStep(grid, enemy);
  };

  // Input: keyboard
  useEffect(() => {
    const onKeyDown = (e) => {
      const s = stateRef.current;
      if (!s.running) return; // locked during countdown / game over

      const k = e.key;
      let dir = null;
      if (k === "ArrowUp" || k === "w" || k === "W") dir = { x: 0, y: -1 };
      if (k === "ArrowDown" || k === "s" || k === "S") dir = { x: 0, y: 1 };
      if (k === "ArrowLeft" || k === "a" || k === "A") dir = { x: -1, y: 0 };
      if (k === "ArrowRight" || k === "d" || k === "D") dir = { x: 1, y: 0 };

      if (dir) {
        e.preventDefault();
        s.player.nextDir = dir;
      }
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Input: swipe
  const touchRef = useRef({ x: 0, y: 0, active: false });
  const onTouchStart = (e) => {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY, active: true };
  };
  const onTouchEnd = (e) => {
    if (!touchRef.current.active) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;
    touchRef.current.active = false;

    if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;

    const s = stateRef.current;
    if (!s.running) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      s.player.nextDir = dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
    } else {
      s.player.nextDir = dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
    }
  };

  // Drawing helpers
  const drawHeart = (ctx, cx, cy, r) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.beginPath();
    const topCurveHeight = r * 0.3;
    ctx.moveTo(0, r * 0.25);
    ctx.bezierCurveTo(r * 0.5, -topCurveHeight, r, r * 0.2, 0, r);
    ctx.bezierCurveTo(-r, r * 0.2, -r * 0.5, -topCurveHeight, 0, r * 0.25);
    ctx.closePath();
    ctx.fillStyle = "rgba(255,255,255,.95)";
    ctx.fill();
    ctx.shadowColor = "rgba(0,0,0,.25)";
    ctx.shadowBlur = 10;
    ctx.restore();
  };

  const draw = (ctx, s) => {
    const grid = s.grid;
    const W = cols * cell;
    const H = rows * cell;

    // background
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,255,255,.10)";

    // walls + dots
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const c = grid[y][x];
        if (c === "#") {
          ctx.fillStyle = "rgba(255,255,255,.22)";
          ctx.fillRect(x * cell, y * cell, cell, cell);
        } else if (c === ".") {
          ctx.beginPath();
          ctx.fillStyle = "rgba(255,255,255,.85)";
          ctx.arc(x * cell + cell / 2, y * cell + cell / 2, cell * 0.12, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // player
    // player (sprite animation)
    const playerSprite =
      martynaFrameRef.current === 0
        ? martynaClosedRef.current
        : martynaOpenRef.current;

    const PLAYER_SCALE = 2;
    const pSize = cell * PLAYER_SCALE;

    const pcx = s.player.x * cell + cell / 2;
    const pcy = s.player.y * cell + cell / 2;

    if (playerSprite) {
      ctx.save();
      ctx.translate(pcx, pcy);

      const fx = s.player.facing.x;
      const fy = s.player.facing.y;

      let rotation = 0;
      let scaleX = 1;

      // ✅ Martyna sprite kijkt (in jouw geval) standaard naar RECHTS:
      // - Naar links = flip
      // - Omhoog/omlaag = alleen roteren (GEEN flip, anders wordt het inverted)

      if (fy !== 0) {
        // up/down
        rotation = fy < 0 ? -Math.PI / 2 : Math.PI / 2;
        scaleX = 1;
      } else {
        // left/right
        scaleX = fx < 0 ? -1 : 1;
      }

      ctx.rotate(rotation);
      ctx.scale(scaleX, 1);

      ctx.drawImage(
        playerSprite,
        -pSize / 2,
        -pSize / 2,
        pSize,
        pSize
      );

      ctx.restore();
    }

    // enemy (gif sprite)
    // enemy (PURE gif, no modifications)
    // enemy (sprite animation)
    const sprite =
      divaFrameRef.current === 0
        ? divaClosedRef.current
        : divaOpenRef.current;


    const DIVA_SCALE = 5;
    const size = cell * DIVA_SCALE;

    // centreer diva op enemy tile
    const cx = s.enemy.x * cell + cell / 2;
    const cy = s.enemy.y * cell + cell / 2;

    const ex = cx - size / 2;
    const ey = cy - size / 2;

    if (sprite) {
      ctx.save();

      // naar middelpunt
      ctx.translate(cx, cy);

      const fx = s.enemy.facing.x;
      const fy = s.enemy.facing.y;

      // 👉 BELANGRIJK:
      // diva sprite kijkt in de afbeelding STANDAARD NAAR LINKS
      // dus "links" = geen transformatie

      let rotation = 0;
      let scaleX = 1; // 👈 standaard: kijkt naar rechts

      // Links → flip horizontaal
      if (fx > 0) {
        scaleX = -1;
      }
      // Omhoog / omlaag (zelfde als bij diva, want canvas Y-as)
      else if (fy < 0) {
        rotation = Math.PI / 2;
      }
      else if (fy > 0) {
        rotation = -Math.PI / 2;
      }


      ctx.rotate(rotation);
      ctx.scale(scaleX, 1);

      ctx.drawImage(
        sprite,
        -size / 2,
        -size / 2,
        size,
        size
      );

      ctx.restore();
    }



    else {
      // fallback (only if gif fails)
      ctx.fillStyle = "rgba(255,255,255,.7)";
      ctx.font = `${Math.floor(cell * 0.5)}px ui-sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("😈", ex + cell / 2, ey + cell / 2);
    }
  };

  // Main loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;

    const SPEED_PLAYER_MS = 140;
    const SPEED_ENEMY_MS = 170;

    let lastPlayerMove = performance.now();
    let lastEnemyMove = performance.now();

    const tick = (t) => {
      const s = stateRef.current;
      if (!s.grid) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (s.running) {
        // Player movement
        if (t - lastPlayerMove >= SPEED_PLAYER_MS) {
          lastPlayerMove = t;

          const grid = s.grid;
          if (s.player.nextDir.x !== 0 || s.player.nextDir.y !== 0) {
            trySetDir(grid, s.player, s.player.nextDir);
          }
          const moved = moveOneStep(grid, s.player);
          if (moved && (s.player.dir.x !== 0 || s.player.dir.y !== 0)) {
            s.player.facing = { ...s.player.dir };
          }

          if (isDot(grid, s.player.x, s.player.y)) {
            grid[s.player.y][s.player.x] = " ";
            s.dotsLeft -= 1;
            setDotsLeftUI(s.dotsLeft);

            if (s.dotsLeft <= 0) {
              s.running = false;
              s.won = true;
              setTimeout(() => onWin?.(), 600);
            }
          }
        }

        // Enemy movement
        if (t - lastEnemyMove >= SPEED_ENEMY_MS) {
          lastEnemyMove = t;
          enemyChaseStep(s.grid, s.enemy, s.player);

          if (s.enemy.x === s.player.x && s.enemy.y === s.player.y) {
            s.running = false;
            s.lost = true;

            // start cinematic death sequence
            setDeathPhase("fade");

            setTimeout(() => setDeathPhase("zoom"), 400);
            setTimeout(() => setDeathPhase("text"), 900);
            setTimeout(() => setDeathPhase("button"), 1400);
          }

        }
      }

      draw(ctx, s);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cell, onWin]);

  // Restart if you lose
  const restart = () => {
    const s = stateRef.current;
    s.grid = initialGrid.map((r) => [...r]);
    s.dotsLeft = initialDotCount;
    setDotsLeftUI(initialDotCount);
    s.player = {
      x: 1,
      y: 1,
      dir: { x: 0, y: 0 },
      nextDir: { x: 0, y: 0 },
      facing: { x: -1, y: 0 },
    };
    s.enemy = {
      x: cols - 2,
      y: rows - 2,
      dir: { x: 0, y: 0 },
      facing: { x: -1, y: 0 },
    };
    s.won = false;
    s.lost = false;



    startCountdown(); // countdown again on retry
  };

  // Canvas size
  const width = cols * cell;
  const height = rows * cell;

  // const dotsLeft = stateRef.current.dotsLeft;
  const lost = stateRef.current.lost;

  return (
    <div style={styles.stage}>
      <div style={styles.header}>
        <h1 style={styles.title}>Verzamel alle punten!</h1>
        <div style={styles.sub}>
          Dots left: <b>{dotsLeftUI}</b> • Diva is op smoke... 😈
        </div>
      </div>

      <div style={styles.card}>
        {deathPhase !== "none" && (
          <div
            style={{
              ...styles.deathOverlay,
              opacity: deathPhase === "fade" ? 0.6 : 1,
            }}
          >
            <img
              src="/images/diva_talking3.gif"
              alt="Diva"
              style={{
                ...styles.deathDiva,
                transform:
                  deathPhase === "zoom" ||
                  deathPhase === "text" ||
                  deathPhase === "button"
                    ? "scale(1)"
                    : "scale(0.6)",
                opacity: deathPhase === "fade" ? 0 : 1,
              }}
            />

            {deathPhase === "text" || deathPhase === "button" ? (
              <div style={styles.deathText}>"Muahahahahaha." <br></br><br></br><br></br> Je hebt verloren…</div>
            ) : null}

            {deathPhase === "button" ? (
              <button
                style={styles.deathBtn}
                onClick={() => {
                  setDeathPhase("none");
                  restart();
                }}
              >
                Opnieuw Proberen?
              </button>
            ) : null}
          </div>
        )}

        {/* Countdown overlay */}
        {countdown > 0 && (
          <div style={styles.countdownOverlay}>
            <div style={styles.countdownNumber}>{countdown}</div>
            <div style={styles.countdownText}>Get ready…</div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={styles.canvas}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        />

        <div style={styles.controls}>
          <div style={styles.hint}>WASD / Arrows • Swipe on phone</div>

          {lost && (
            <button style={styles.btn} onClick={restart}>
              Retry 😤
            </button>
          )}
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
  header: {
    position: "fixed",
    top: 18,
    left: 0,
    right: 0,
    display: "grid",
    placeItems: "center",
    pointerEvents: "none",
    gap: 6,
  },
  title: {
    margin: 0,
    padding: "10px 18px",
    borderRadius: 999,
    color: "white",
    fontSize: "clamp(16px, 4vw, 28px)",
    textShadow: "0 8px 22px rgba(0,0,0,.25)",
    fontFamily: 'ui-serif, "Times New Roman", Georgia, serif',
    background: "rgba(255,255,255,.12)",
    backdropFilter: "blur(8px)",
  },
  sub: {
    color: "rgba(255,255,255,.9)",
    fontSize: 12,
  },
  card: {
    width: "min(92vw, 560px)",
    borderRadius: 28,
    padding: 16,
    background: "rgba(255,255,255,.16)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 18px 60px rgba(0,0,0,.28)",
    display: "grid",
    gap: 12,
    position: "relative", // needed so overlay covers canvas area
    overflow: "hidden",
  },
  canvas: {
    width: "100%",
    height: "auto",
    borderRadius: 22,
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,.25)",
    background: "rgba(255,255,255,.08)",
    touchAction: "none",
  },
  controls: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  hint: {
    color: "rgba(255,255,255,.9)",
    fontSize: 12,
  },
  btn: {
    height: 44,
    padding: "0 16px",
    border: "none",
    borderRadius: 999,
    background: "rgba(255,255,255,.92)",
    color: "#ff2d73",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(0,0,0,.18)",
  },

  // Countdown styles
  countdownOverlay: {
    position: "absolute",
    inset: 16, // matches card padding so it sits nicely over the canvas area
    zIndex: 5,
    display: "grid",
    placeItems: "center",
    borderRadius: 22,
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(6px)",
    textAlign: "center",
  },
  countdownNumber: {
    fontSize: "clamp(72px, 18vw, 140px)",
    fontWeight: 900,
    color: "white",
    textShadow: "0 10px 40px rgba(0,0,0,.6)",
    lineHeight: 1,
    animation: "pacPulse 1s ease-in-out infinite",
  },
  countdownText: {
    marginTop: 12,
    color: "rgba(255,255,255,.9)",
    fontSize: 14,
    letterSpacing: 1,
    textTransform: "uppercase",
  },

    deathOverlay: {
    position: "absolute",
    inset: 0,
    zIndex: 10,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 40,
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(6px)",
    transition: "opacity 0.4s ease",
  },

  deathDiva: {
    width: "220px",
    maxWidth: "70%",
    borderRadius: 18,
    transition: "transform 0.4s ease, opacity 0.4s ease",
  },

  deathText: {
    marginTop: 20,
    color: "white",
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: 1,
    opacity: 0.95,
    transition: "opacity 0.3s ease",
  },

  deathBtn: {
    marginTop: 24,
    padding: "12px 22px",
    fontSize: 16,
    fontWeight: 800,
    borderRadius: 999,
    border: "none",
    cursor: "pointer",
    background: "rgba(255,255,255,.95)",
    color: "#ff2d73",
    boxShadow: "0 10px 26px rgba(0,0,0,.35)",
    animation: "fadeInUp 0.4s ease",
  },
};