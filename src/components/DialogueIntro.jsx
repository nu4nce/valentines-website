import React, { useEffect, useMemo, useRef, useState } from "react";

export default function DialogueIntro({ onDone }) {
  const script = useMemo(
    () => ({
      start: {
        text: "YIPPIEEEEEEEE\nOke, je hebt ja gezegd\nMaar zo makkelijk kom je er niet vanaf...",
        options: [
          { label: "Wat bedoel je daarmee?", next: "meaning" },
          { label: "Dennis... Wat heb je gemaakt?", next: "whatMade" },
        ],
      },

      meaning: {
        text: "Ik bedoel dat ik hier iets te veel moeite in heb gestoken",
        options: [{ label: "Je maakt me nieuwsgierig... en je bent zo tuff dennis", next: "purpose" }],
      },
      purpose: {
        text: "Heh... ja klopt. Bakayuro.",
        options: [{ label: "Verder...", next: "beforeWeGo" }],
      },

      whatMade: {
        text: "Iets wat ik niet zomaar in een appje kon stoppen.",
        options: [
          {
            label: "Wauw Dennis je bent zo handsome en cool dit is zo vet gemaakt",
            next: "thanksIGuess",
          },
        ],
      },
      thanksIGuess: {
        text: "Ja klopt thanks I guess 🙄🙄\n(op een nonchalante manier)\n(ik ben 6'1 btw)",
        options: [{ label: "Verder...", next: "beforeWeGo" }],
      },

      beforeWeGo: {
        text: "Voordat we verder gaan...\nWil ik dat je iemand ontmoet.",
        options: [{ label: "Oke...", next: "divaIntro" }],
      },

      divaIntro: {
        text: "Maak kennis met{p:150}.{p:150}.{p:150}.{p:650} Diva.",
        options: [
          { label: "Is dat wie ik denk dat het is?", next: "divaNoMercy" },
          { label: "Mag ik haar aaien?", next: "divaSilent" },
        ],
      },

      divaNoMercy: {
        text: "Ja. En ze kent geen genade Martyna.",
        options: [{ label: "Verder →", next: "toGame" }],
      },
      divaSilent: {
        text: 'Dat beslist ze zelf...\n"Diva kijkt je zwijgend aan..."',
        options: [{ label: "Verder →", next: "toGame" }],
      },


			toGame: {
				text: "Je zult eerst Diva moeten verslaan om bij het einde te komen.\nVeel succes...",
				end: true,
			},

    }),
    []
  );

  // -----------------------
  // bubble state (MOET BOVEN goNext!)
  // -----------------------
  const [divaBubble, setDivaBubble] = useState(""); // "meow" | "..." | ""
  const showBubble = (text) => setDivaBubble(text);

  // -----------------------
  // Diva intro scene
  // -----------------------
  const [divaIntroduced, setDivaIntroduced] = useState(false);
  const [avatarsPhase, setAvatarsPhase] = useState("solo"); // solo | fadeOut | split

  // -----------------------
  // typing system with pauses
  // -----------------------
  const tokensRef = useRef([]);
  const tokenIdxRef = useRef(0);
  const charIdxRef = useRef(0);
  const timerRef = useRef(null);

  const [nodeId, setNodeId] = useState("start");
  const node = script[nodeId];

  const [typed, setTyped] = useState("");
  const [doneTyping, setDoneTyping] = useState(false);

  // Dennis mouth
  const [dennisMouthOpen, setDennisMouthOpen] = useState(false);
  const talkRef = useRef(null);

  const fullText = node?.text ?? "";

  const parseTextWithPauses = (raw) => {
    const parts = [];
    const re = /\{p:(\d+)\}/g;
    let last = 0;
    let m;

    while ((m = re.exec(raw)) !== null) {
      const before = raw.slice(last, m.index);
      if (before) parts.push({ type: "text", value: before });
      parts.push({ type: "pause", ms: Number(m[1]) || 0 });
      last = m.index + m[0].length;
    }

    const tail = raw.slice(last);
    if (tail) parts.push({ type: "text", value: tail });

    return parts.length ? parts : [{ type: "text", value: raw }];
  };

  useEffect(() => {
    // reset typing
    setTyped("");
    setDoneTyping(false);

    tokensRef.current = parseTextWithPauses(fullText);
    tokenIdxRef.current = 0;
    charIdxRef.current = 0;

    // start talking while typing
    setDennisMouthOpen(true);
    if (talkRef.current) clearInterval(talkRef.current);
    talkRef.current = setInterval(() => {
      setDennisMouthOpen((v) => !v);
    }, 120);

    const SPEED = 45;

    const step = () => {
      const tokens = tokensRef.current;
      const ti = tokenIdxRef.current;

      if (ti >= tokens.length) {
        if (talkRef.current) clearInterval(talkRef.current);
        talkRef.current = null;
        setDennisMouthOpen(false);
        setDoneTyping(true);
        return;
      }

      const token = tokens[ti];

      if (token.type === "pause") {
        tokenIdxRef.current += 1;
        timerRef.current = setTimeout(step, token.ms);
        return;
      }

      // token.type === "text"
      charIdxRef.current += 1;
      const currentChunk = token.value.slice(0, charIdxRef.current);

      let built = "";
      for (let i = 0; i < ti; i++) {
        if (tokens[i].type === "text") built += tokens[i].value;
      }
      built += currentChunk;
      setTyped(built);

      if (charIdxRef.current >= token.value.length) {
        tokenIdxRef.current += 1;
        charIdxRef.current = 0;
      }

      timerRef.current = setTimeout(step, SPEED);
    };

    timerRef.current = setTimeout(step, SPEED);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;

      if (talkRef.current) clearInterval(talkRef.current);
      talkRef.current = null;
    };
  }, [fullText]);

  // Diva intro “poof -> split” one-time
  useEffect(() => {
    if (!divaIntroduced && nodeId !== "divaIntro") {
      setAvatarsPhase("solo");
      return;
    }

    if (nodeId === "divaIntro" && !divaIntroduced) {
      setAvatarsPhase("fadeOut");

      const t = setTimeout(() => {
        setDivaIntroduced(true);
        requestAnimationFrame(() => setAvatarsPhase("split"));
      }, 420);

      return () => clearTimeout(t);
    }

    if (divaIntroduced) setAvatarsPhase("split");
  }, [nodeId, divaIntroduced]);

  // meow zodra divaIntro klaar is met typen
  useEffect(() => {
    if (nodeId === "divaIntro" && doneTyping) {
      showBubble("meow");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId, doneTyping]);

  const skipTyping = () => {
    if (doneTyping) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;

    if (talkRef.current) clearInterval(talkRef.current);
    talkRef.current = null;

    setDennisMouthOpen(false);
    setTyped(fullText.replace(/\{p:\d+\}/g, ""));
    setDoneTyping(true);
  };

  // -----------------------
  // bubble positioning (dynamic)
  // -----------------------
  const avatarsRef = useRef(null);
  const divaImgRef = useRef(null);
  const bubbleElRef = useRef(null);
  const [bubblePos, setBubblePos] = useState({ left: 0, top: 0 });

  useEffect(() => {
    const update = () => {
      if (!divaBubble) return;
      if (!avatarsRef.current || !divaImgRef.current || !bubbleElRef.current) return;

      const a = avatarsRef.current.getBoundingClientRect();
      const d = divaImgRef.current.getBoundingClientRect();
      const b = bubbleElRef.current.getBoundingClientRect();

      // anchor boven Diva hoofd (tweakbaar)
      const anchorX = d.left - a.left + d.width * 0.72; // iets meer rechts
      const anchorY = d.top - a.top + d.height * 0.08;  // bovenkant

      // we gebruiken translate(-50%, -100%) dus top = anchorY - offset
      let left = anchorX;
      let top = anchorY - 10;

      // clamp binnen avatars container
      const pad = 10;
      const minLeft = b.width / 2 + pad;
      const maxLeft = a.width - b.width / 2 - pad;
      left = Math.max(minLeft, Math.min(maxLeft, left));

      const minTop = b.height + pad;
      top = Math.max(minTop, top);

      setBubblePos({ left, top });
    };

    requestAnimationFrame(update);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, [divaBubble, avatarsPhase, divaIntroduced, typed]);

  // -----------------------
  // navigation (bubble moet blijven tot keuze, maar reset bij volgende keuze)
  // -----------------------
  const goNext = (nextId) => {
    // bubble reset bij elke keuze / schermwissel
    if (nextId === "divaSilent") setDivaBubble("...");
    else setDivaBubble("");

    setNodeId(nextId);
  };

  const showOptions = doneTyping && !node?.end && node?.options?.length;
  const showEndButton = doneTyping && node?.end;

  return (
    <div style={styles.stage}>
      <div style={styles.card}>
        <div style={styles.scrollArea}>
          <div style={styles.avatarRow}>
            <div
              ref={avatarsRef}
              style={{
                ...styles.avatars,
                ...(avatarsPhase === "split" ? styles.avatarsSplit : styles.avatarsSolo),
              }}
            >
              <img
                src={
                  doneTyping
                    ? "/images/dennis_dicht.png"
                    : dennisMouthOpen
                    ? "/images/dennis_open.png"
                    : "/images/dennis_dicht.png"
                }
                alt="Dennis"
                draggable={false}
                style={{
                  ...styles.avatar,
                  ...(avatarsPhase === "split"
                    ? styles.avatarDennisSplit
                    : styles.avatarDennisSolo),
                  opacity: avatarsPhase === "fadeOut" ? 0 : 1,
                  transform:
                    avatarsPhase === "fadeOut"
                      ? "translateY(6px) scale(.98)"
                      : "translateY(0) scale(1)",
                }}
              />

              {divaIntroduced && (
                <img
                  src={"/images/diva_dicht.png"}
                  ref={divaImgRef}
                  alt="Diva"
                  draggable={false}
                  style={{
                    ...styles.avatar,
                    ...styles.avatarDivaSplit,
                    opacity: avatarsPhase === "split" ? 1 : 0,
                    transform:
                      avatarsPhase === "split"
                        ? "translateY(0) scale(1)"
                        : "translateY(6px) scale(.98)",
                  }}
                />
              )}

              {divaIntroduced && divaBubble && (
                <div
                  ref={bubbleElRef}
                  style={{
                    ...styles.divaBubble,
                    left: bubblePos.left,
                    top: bubblePos.top,
                    transform: "translate(-50%, -100%)",
                  }}
                >
                  {divaBubble}
                </div>
              )}
            </div>
          </div>

          <div style={styles.textBox}>
            <div style={styles.text}>
              {typed.split("\n").map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>

            {!doneTyping && (
              <button
                style={styles.skipBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  skipTyping();
                }}
              >
                Skip ⏭
              </button>
            )}
          </div>

          {showOptions ? (
            <div style={styles.options}>
              {node.options.map((o) => (
                <button
                  key={o.label}
                  style={styles.optionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    goNext(o.next);
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          ) : null}

          {showEndButton ? (
            <div style={styles.endRow}>
              <button
                style={styles.mainBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onDone?.();
                }}
              >
                Verder →
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const styles = {
  stage: {
    height: "100svh",
    width: "100vw",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: "max(14px, env(safe-area-inset-left))",
    paddingRight: "max(14px, env(safe-area-inset-right))",
    paddingTop: "max(14px, env(safe-area-inset-top))",
    paddingBottom: "max(14px, env(safe-area-inset-bottom))",
    background:
      "radial-gradient(circle at top, #ffc1da, #ff77b7 35%, #ff3c8a 70%, #ff2d73)",
    overflow: "hidden",
  },

  card: {
    width: "min(96vw, 620px)",
    height: "min(92svh, 760px)",
    borderRadius: 28,
    padding: 0,
    background: "rgba(255,255,255,.16)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 18px 60px rgba(0,0,0,.28)",
    overflow: "hidden",
    margin: "0 auto",
  },

  scrollArea: {
    height: "100%",
    padding: 22,
    display: "flex",
    flexDirection: "column",
    gap: 14,
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
  },

  avatarRow: {
    display: "grid",
    placeItems: "center",
    marginTop: 2,
  },

  avatar: {
    width: "min(46vw, 230px)",
    height: "auto",
    objectFit: "contain",
    filter: "drop-shadow(0 12px 22px rgba(0,0,0,.25))",
    userSelect: "none",
    pointerEvents: "none",
    transition: "opacity 420ms ease, transform 420ms ease",
  },

  avatars: {
    position: "relative",
    width: "100%",
    display: "grid",
    alignItems: "end",
    justifyItems: "center",
    gap: 10,
    paddingTop: 6,
  },

  avatarsSolo: {
    gridTemplateColumns: "1fr",
  },

  avatarsSplit: {
    gridTemplateColumns: "1fr 1fr 1fr",
  },

  avatarDennisSolo: {
    gridColumn: 1,
  },

  avatarDennisSplit: {
    gridColumn: 1,
  },

  avatarDivaSplit: {
    gridColumn: 3,
  },

  divaBubble: {
    position: "absolute",
    padding: "8px 14px",
    borderRadius: 999,
    background: "rgba(255,255,255,.95)",
    color: "#ff2d73",
    fontWeight: 900,
    fontSize: 14,
    boxShadow: "0 10px 24px rgba(0,0,0,.18)",
    pointerEvents: "none",
    whiteSpace: "nowrap",
  },

  textBox: {
    borderRadius: 22,
    padding: 18,
    background: "rgba(255,255,255,.08)",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,.20)",
    minHeight: 180,
    position: "relative",
  },

  text: {
    color: "rgba(255,255,255,.95)",
    fontSize: "clamp(16px, 3.8vw, 20px)",
    lineHeight: 1.35,
    fontFamily: 'ui-serif, "Times New Roman", Georgia, serif',
    whiteSpace: "pre-wrap",
    userSelect: "none",
  },

  options: {
    display: "grid",
    gap: 10,
    marginTop: "auto",
    paddingBottom: 6,
  },

  optionBtn: {
    border: "none",
    borderRadius: 18,
    padding: "14px 14px",
    background: "rgba(255,255,255,.88)",
    color: "#ff2d73",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(0,0,0,.18)",
    textAlign: "left",
  },

  endRow: {
    display: "grid",
    placeItems: "center",
    marginTop: "auto",
    paddingBottom: 6,
  },

  mainBtn: {
    height: 46,
    padding: "0 22px",
    border: "none",
    borderRadius: 999,
    background: "rgba(255,255,255,.92)",
    color: "#ff2d73",
    fontWeight: 900,
    fontSize: 15,
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(0,0,0,.18)",
  },

  skipBtn: {
    position: "absolute",
    right: 12,
    bottom: 10,
    fontSize: 13,
    background: "rgba(255,255,255,.18)",
    color: "white",
    border: "none",
    padding: "8px 14px",
    borderRadius: 999,
    cursor: "pointer",
    backdropFilter: "blur(6px)",
    boxShadow: "0 6px 14px rgba(0,0,0,.18)",
  },
};
