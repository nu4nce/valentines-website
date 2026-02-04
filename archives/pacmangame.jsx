// 2/3 - 2.54pm original code and game functional
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

  // Video sprite (enemy)
  const videoRef = useRef(null);
  const [videoReady, setVideoReady] = useState(false);

  // A small, single-map layout (walls #, dots ., empty space ' ')
  // Make it bigger/smaller if you want.
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
    player: { x: 1, y: 1, dir: { x: 0, y: 0 }, nextDir: { x: 0, y: 0 } },
    enemy: { x: cols - 2, y: rows - 2, dir: { x: 0, y: 0 } },
    running: true,
    won: false,
    lost: false,
    lastMoveAt: 0,
  });

  // Init / reset
  useEffect(() => {
    stateRef.current.grid = initialGrid.map((r) => [...r]);
    stateRef.current.dotsLeft = initialDotCount;
    stateRef.current.player = { x: 1, y: 1, dir: { x: 0, y: 0 }, nextDir: { x: 0, y: 0 } };
    stateRef.current.enemy = { x: cols - 2, y: rows - 2, dir: { x: 0, y: 0 } };
    stateRef.current.running = true;
    stateRef.current.won = false;
    stateRef.current.lost = false;
    stateRef.current.lastMoveAt = performance.now();
  }, [initialGrid, initialDotCount, cols, rows]);

  // Build + load the enemy video
  useEffect(() => {
    const v = document.createElement("video");
    v.src = "/videos/dennis_talking.mp4";
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = "auto";
    v.crossOrigin = "anonymous";
    videoRef.current = v;

    const onCanPlay = async () => {
      try {
        // Some browsers require play() after user gesture.
        // We try anyway; if it fails, it's still ok: we draw last frame / blank.
        await v.play();
      } catch {}
      setVideoReady(true);
    };

    v.addEventListener("canplay", onCanPlay);
    v.load();

    return () => {
      v.pause();
      v.removeEventListener("canplay", onCanPlay);
      videoRef.current = null;
    };
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
    // stop if blocked
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

    // Prefer moves that reduce distance to player; keep some variety
    options.sort((a, b) => {
      const da = Math.abs((enemy.x + a.x) - player.x) + Math.abs((enemy.y + a.y) - player.y);
      const db = Math.abs((enemy.x + b.x) - player.x) + Math.abs((enemy.y + b.y) - player.y);
      return da - db;
    });

    // Sometimes pick 2nd best to avoid perfect unavoidable chase
    const pick = Math.random() < 0.2 && options[1] ? options[1] : options[0];
    enemy.dir = { x: pick.x, y: pick.y };
    moveOneStep(grid, enemy);
  };

  // Input: keyboard
  useEffect(() => {
    const onKeyDown = (e) => {
      const s = stateRef.current;
      if (!s.running) return;

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
    ctx.fillRect(0, 0, W, H);

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

    // player (heart)
    drawHeart(ctx, s.player.x * cell + cell / 2, s.player.y * cell + cell / 2, cell * 0.30);

    // enemy (video sprite)
    const v = videoRef.current;
    const ex = s.enemy.x * cell;
    const ey = s.enemy.y * cell;
    const pad = cell * 0.10;

    // enemy bubble
    ctx.fillStyle = "rgba(255,255,255,.16)";
    ctx.beginPath();
    ctx.roundRect(ex + pad, ey + pad, cell - pad * 2, cell - pad * 2, 10);
    ctx.fill();

    if (v && videoReady && v.readyState >= 2) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(ex + pad, ey + pad, cell - pad * 2, cell - pad * 2, 10);
      ctx.clip();
      ctx.drawImage(v, ex + pad, ey + pad, cell - pad * 2, cell - pad * 2);
      ctx.restore();
    } else {
      // fallback face
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

    const s = stateRef.current;

    const SPEED_PLAYER_MS = 140; // lower = faster
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

          // Attempt nextDir first (like Pacman)
          const grid = s.grid;
          if (s.player.nextDir.x !== 0 || s.player.nextDir.y !== 0) {
            trySetDir(grid, s.player, s.player.nextDir);
          }
          moveOneStep(grid, s.player);

          // Eat dot
          if (isDot(grid, s.player.x, s.player.y)) {
            grid[s.player.y][s.player.x] = " ";
            s.dotsLeft -= 1;

            if (s.dotsLeft <= 0) {
              s.running = false;
              s.won = true;

              // Small delay feels nicer
              setTimeout(() => onWin?.(), 600);
            }
          }
        }

        // Enemy movement
        if (t - lastEnemyMove >= SPEED_ENEMY_MS) {
          lastEnemyMove = t;
          enemyChaseStep(s.grid, s.enemy, s.player);

          // Collision
          if (s.enemy.x === s.player.x && s.enemy.y === s.player.y) {
            s.running = false;
            s.lost = true;
          }
        }
      }

      // Draw
      draw(ctx, s);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cell, videoReady, onWin]);

  // Restart if you lose
  const restart = () => {
    const s = stateRef.current;
    s.grid = initialGrid.map((r) => [...r]);
    s.dotsLeft = initialDotCount;
    s.player = { x: 1, y: 1, dir: { x: 0, y: 0 }, nextDir: { x: 0, y: 0 } };
    s.enemy = { x: cols - 2, y: rows - 2, dir: { x: 0, y: 0 } };
    s.running = true;
    s.won = false;
    s.lost = false;

    // Try to start the video again after user interaction
    const v = videoRef.current;
    if (v) {
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.play().catch(() => {});
    }
  };

  // Canvas size
  const width = cols * cell;
  const height = rows * cell;

  const dotsLeft = stateRef.current.dotsLeft;
  const lost = stateRef.current.lost;

  return (
    <div style={styles.stage}>
      <div style={styles.header}>
        <h1 style={styles.title}>Collect all the dots 💗</h1>
        <div style={styles.sub}>
          Dots left: <b>{dotsLeft}</b> • Dennis is coming… 😈
        </div>
      </div>

      <div style={styles.card}>
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
};
