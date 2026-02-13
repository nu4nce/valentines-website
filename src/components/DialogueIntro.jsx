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
        text: "Dat was precies de bedoeling :)",
        options: [{ label: "Verder...", next: "beforeWeGo" }],
      },

      // Path 2
      whatMade: {
        text: "Iets wat ik niet in een appje kon stoppen",
        options: [
          {
            label: "Wauw Dennis je bent zo handsome en cool dit is zo vet gemaakt",
            next: "thanksIGuess",
          },
        ],
      },
      thanksIGuess: {
        text: "Ja klopt thanks I guess 😳😳\n(op een nonchalante manier)\n(ik ben 6'1 btw)",
        options: [{ label: "Verder...", next: "beforeWeGo" }],
      },

      // Merge point
      beforeWeGo: {
        text: "Voordat we verder gaan...\nWil ik dat je iemand ontmoet.",
        options: [{ label: "Oke...", next: "divaIntro" }],
      },
      divaIntro: {
        text: 'Maak kennis met... Diva.',
        options: [
          { label: "Is dat wat ik denk dat het is?", next: "divaNoMercy" },
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

  const [nodeId, setNodeId] = useState("start");
  const node = script[nodeId];
  const [dennisMouthOpen, setDennisMouthOpen] = useState(false);
  const talkRef = useRef(null);

  // Typewriter
  const [typed, setTyped] = useState("");
  const [doneTyping, setDoneTyping] = useState(false);
  const [skipHint, setSkipHint] = useState(true);

  const fullText = node?.text ?? "";
  const idxRef = useRef(0);
  const timerRef = useRef(null);

	useEffect(() => {
		// reset typing when node changes
		setTyped("");
		setDoneTyping(false);
		setSkipHint(true);
		idxRef.current = 0;

		// start "talking" while typing
		setDennisMouthOpen(true);
		if (talkRef.current) clearInterval(talkRef.current);
		talkRef.current = setInterval(() => {
			setDennisMouthOpen((v) => !v);
		}, 120);

		const SPEED = 50; // ms per char

		if (timerRef.current) clearInterval(timerRef.current);
		timerRef.current = setInterval(() => {
			idxRef.current += 1;
			const next = fullText.slice(0, idxRef.current);
			setTyped(next);

			if (idxRef.current >= fullText.length) {
				// stop typing
				clearInterval(timerRef.current);
				timerRef.current = null;
				setDoneTyping(true);

				// stop talking
				if (talkRef.current) clearInterval(talkRef.current);
				talkRef.current = null;
				setDennisMouthOpen(false);
			}
		}, SPEED);

		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
			timerRef.current = null;

			if (talkRef.current) clearInterval(talkRef.current);
			talkRef.current = null;
		};
	}, [fullText]);


	const skipTyping = () => {
		if (doneTyping) return;

		if (timerRef.current) clearInterval(timerRef.current);
		timerRef.current = null;

		if (talkRef.current) clearInterval(talkRef.current);
		talkRef.current = null;

		setDennisMouthOpen(false);
		setTyped(fullText);
		setDoneTyping(true);
		setSkipHint(false);
	};



  const goNext = (nextId) => {
    setNodeId(nextId);
  };

  const showOptions = doneTyping && !node?.end && node?.options?.length;
  const showEndButton = doneTyping && node?.end;

  return (
    <div style={styles.stage} onPointerDown={skipTyping}>
			<div style={styles.card}>
				<div style={styles.scrollArea}>
					<div style={styles.avatarRow}>
						<img
							src={
								doneTyping
									? "/images/dennis_dicht.png"
									: dennisMouthOpen
									? "/images/dennis_open.png"
									: "/images/dennis_dicht.png"
							}
							alt="Dennis"
							style={styles.avatar}
							draggable={false}
						/>
					</div>

					<div style={styles.textBox}>
						<div style={styles.text}>
							{typed.split("\n").map((line, i) => (
								<div key={i}>{line}</div>
							))}
						</div>

						{!doneTyping && skipHint && (
							<div style={styles.tapHint}>Tik om sneller te gaan ✨</div>
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
    width: "min(72vw, 340px)",         // 👈 veel groter op mobiel
    height: "auto",
    objectFit: "contain",
    filter: "drop-shadow(0 12px 22px rgba(0,0,0,.25))",
    userSelect: "none",
    pointerEvents: "none",
  },


};
