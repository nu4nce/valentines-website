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

      // Path 1
      meaning: {
        text: "Ik bedoel dat ik hier iets te veel moeite in heb gestoken",
        options: [{ label: "Je maakt me nieuwsgierig...", next: "purpose" }],
      },
      purpose: {
        text: "u better be fella.",
        options: [{ label: "Verder...", next: "beforeWeGo" }],
      },

      // Path 2
      whatMade: {
        text: "Iets wat ik niet in een appje kon stoppen.",
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

      // Merge point
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

      // End nodes (exactly what you requested)
      divaNoMercy: {
        text: "Ja. En ze kent geen genade Martyna.",
        end: true,
      },
      divaSilent: {
        text: 'Dat beslist ze zelf...\n"Diva kijkt je zwijgend aan..."',
        end: true,
      },
    }),
    []
  );

	const [divaIntroduced, setDivaIntroduced] = useState(false); // blijft true nadat Diva is verschenen
	const [avatarsPhase, setAvatarsPhase] = useState("solo");    // "solo" | "fadeOut" | "split"

	const tokensRef = useRef([]);      // array van stukjes: {type:"text", value:"..."} of {type:"pause", ms:650}
	const tokenIdxRef = useRef(0);
	const charIdxRef = useRef(0);

  const [nodeId, setNodeId] = useState("start");
  const node = script[nodeId];
  const [dennisMouthOpen, setDennisMouthOpen] = useState(false);
  const talkRef = useRef(null);

  // F
  const [typed, setTyped] = useState("");
  const [doneTyping, setDoneTyping] = useState(false);
  const [skipHint, setSkipHint] = useState(true);

  const fullText = node?.text ?? "";
  const idxRef = useRef(0);
  const timerRef = useRef(null);

	const parseTextWithPauses = (raw) => {
  // split op {p:NUMBER}
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
		setSkipHint(true);

		tokensRef.current = parseTextWithPauses(fullText);
		tokenIdxRef.current = 0;
		charIdxRef.current = 0;

		// start "talking" while typing
		setDennisMouthOpen(true);
		if (talkRef.current) clearInterval(talkRef.current);
		talkRef.current = setInterval(() => {
			setDennisMouthOpen((v) => !v);
		}, 120);

		const SPEED = 45; // ms per char

		const step = () => {
			const tokens = tokensRef.current;
			const ti = tokenIdxRef.current;

			if (ti >= tokens.length) {
				// done
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

			// build full typed from previous tokens + current partial
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

		// start
		timerRef.current = setTimeout(step, SPEED);

		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
			timerRef.current = null;

			if (talkRef.current) clearInterval(talkRef.current);
			talkRef.current = null;
		};
	}, [fullText]);

	useEffect(() => {
		// vóór Diva: Dennis blijft solo + centered
		if (!divaIntroduced && nodeId !== "divaIntro") {
			setAvatarsPhase("solo");
			return;
		}

		// zodra divaIntro start: doe één keer de “poof -> split” scene
		if (nodeId === "divaIntro" && !divaIntroduced) {
			setAvatarsPhase("fadeOut");

			const t = setTimeout(() => {
				setDivaIntroduced(true);

				// belangrijk: eerst renderen met Diva aanwezig,
				// daarna in de volgende frame naar split zodat transitions werken
				requestAnimationFrame(() => setAvatarsPhase("split"));
			}, 420);

			return () => clearTimeout(t);
		}

		// na introductie: altijd split blijven
		if (divaIntroduced) {
			setAvatarsPhase("split");
		}
	}, [nodeId, divaIntroduced]);

	useEffect(() => {
  // "meow" zodra divaIntro klaar is met typen
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

		setTyped(fullText.replace(/\{p:\d+\}/g, "")); // tokens niet tonen
		setDoneTyping(true);
		setSkipHint(false);
	};

	const goNext = (nextId) => {
		// bubble reset bij elke keuze (node change)
		if (nextId === "divaSilent") setDivaBubble("...");
		else setDivaBubble("");

		setNodeId(nextId);
	};



	// --- Diva "speech bubble" (blijft staan tot volgende keuze) ---
	const [divaBubble, setDivaBubble] = useState(""); // "meow" | "..." | ""
	const showBubble = (text) => {
		setDivaBubble(text);
	};



  const showOptions = doneTyping && !node?.end && node?.options?.length;
  const showEndButton = doneTyping && node?.end;

  return (
    <div style={styles.stage}>
			<div style={styles.card}>
				<div style={styles.scrollArea}>
					<div style={styles.avatarRow}>
						<div style={styles.avatars}>
							<div
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
									...(avatarsPhase === "split" ? styles.avatarDennisSplit : styles.avatarDennisSolo),

									opacity: avatarsPhase === "fadeOut" ? 0 : 1,
									transform: avatarsPhase === "fadeOut"
										? "translateY(6px) scale(.98)"
										: "translateY(0) scale(1)",
								}}
							/>

							{divaIntroduced && (
								<div style={styles.divaWrap}>
									{divaBubble && (
										<div style={styles.divaBubble} aria-hidden="true">
											{divaBubble}
										</div>
									)}

									<img
										src={"/images/diva_dicht.png"}
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
								</div>
							)}

						</div>
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
    height: "min(92svh, 760px)",      // 👈 card past op telefoon
    borderRadius: 28,
    padding: 0,                       // padding verhuisd naar scrollArea
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
	overflowY: "auto",                 // 👈 alleen scrollen als nodig
	WebkitOverflowScrolling: "touch",
	},

  titlePill: {
    justifySelf: "center",
    padding: "10px 16px",
    borderRadius: 999,
    background: "rgba(255,255,255,.12)",
    color: "rgba(255,255,255,.95)",
    fontFamily: 'ui-serif, "Times New Roman", Georgia, serif',
    textShadow: "0 8px 22px rgba(0,0,0,.25)",
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
  tapHint: {
    position: "absolute",
    right: 12,
    bottom: 10,
    fontSize: 12,
    color: "rgba(255,255,255,.8)",
    background: "rgba(255,255,255,.10)",
    padding: "6px 10px",
    borderRadius: 999,
  },
  options: {
    display: "grid",
    gap: 10,
    marginTop: "auto",                 // 👈 duw opties naar beneden als er ruimte is
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

	avatarRow: {
		display: "grid",
		placeItems: "center",
		marginTop: 2,
	},

	avatar: {
		width: "min(46vw, 230px)",   // was 38vw/170px
		height: "auto",
		objectFit: "contain",
		filter: "drop-shadow(0 12px 22px rgba(0,0,0,.25))",
		userSelect: "none",
		pointerEvents: "none",
		transition: "opacity 420ms ease, transform 420ms ease",
	},



	avatars: {
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
		gridTemplateColumns: "1fr 1fr 1fr", // Dennis op 1/3, Diva op 2/3
	},

	avatarDennisSolo: {
		gridColumn: 1, // centered (want 1 kolom)
	},

	avatarDennisSplit: {
		gridColumn: 1, // links (1/3)
	},

	avatarDivaSplit: {
		gridColumn: 3, // rechts (2/3)
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

	divaWrap: {
		position: "relative",
		gridColumn: 3,         // Diva blijft op 2/3
		justifySelf: "center",
		alignSelf: "end",
	},

	divaBubble: {
		position: "absolute",
		top: -14,              // omhoog boven hoofd
		left: "72%",           // <-- meer naar rechts (tweak gerust 65%-85%)
		transform: "translate(-50%, -100%)",
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




};
