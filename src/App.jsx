import React, { useState } from "react";
import LoveSlideshow from "./components/LoveSlideshow";
import ValentineGate from "./components/ValentineGate";
import PacmanGame from "./components/PacmanGame";
import StartScreen from "./components/StartScreen";
import DialogueIntro from "./components/DialogueIntro";

export default function App() {
  const [step, setStep] = useState("start"); // start | gate | game | slideshow | dialogue
  const [fadeStartOut, setFadeStartOut] = useState(false);

  const start = () => {
    setFadeStartOut(true); // triggers 2s fade
    setTimeout(() => setStep("gate"), 2000);
  };

  if (step === "slideshow") return <LoveSlideshow />;
  if (step === "game") return <PacmanGame onWin={() => setStep("slideshow")} />;

  if (step === "gate") return <ValentineGate onYes={() => setStep("dialogue")} />;
  if (step === "dialogue") return <DialogueIntro onDone={() => setStep("game")} />;
  // step === "start"
  return <StartScreen onStart={start} fadingOut={fadeStartOut} />;
}
