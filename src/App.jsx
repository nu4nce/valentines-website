import React, { useState } from "react";
import LoveSlideshow from "./components/LoveSlideshow";
import ValentineGate from "./components/ValentineGate";
import PacmanGame from "./components/PacmanGame";

export default function App() {
  const [step, setStep] = useState("gate"); // "gate" | "game" | "slideshow"

  if (step === "slideshow") return <LoveSlideshow />;
  if (step === "game") return <PacmanGame onWin={() => setStep("slideshow")} />;

  return <ValentineGate onYes={() => setStep("game")} />;
}
