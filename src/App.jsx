import React, { useState } from "react";
import LoveSlideshow from "./components/LoveSlideshow";
import ValentineGate from "./components/ValentineGate";
import PacmanGame from "./components/PacmanGame";
import StartScreen from "./components/StartScreen";
import DialogueIntro from "./components/DialogueIntro";

export default function App() {
  const [step, setStep] = useState("start");
  const [fadeStartOut, setFadeStartOut] = useState(false);

  const start = () => {
    setFadeStartOut(true);
    setTimeout(() => setStep("gate"), 2000);
  };

  if (step === "slideshow")
    return (
      <LoveSlideshow
        onRestart={() => setStep("start")}
      />
    );

  if (step === "game")
    return <PacmanGame onWin={() => setStep("slideshow")} />;

  if (step === "dialogue")
    return <DialogueIntro onDone={() => setStep("game")} />;

  if (step === "gate")
    return <ValentineGate onYes={() => setStep("dialogue")} />;

  return (
    <StartScreen
      onStart={start}
      onSkipToSlideshow={() => setStep("slideshow")}
      fadingOut={fadeStartOut}
    />
  );
}
