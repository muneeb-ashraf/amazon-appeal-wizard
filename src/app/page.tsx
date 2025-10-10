"use client";
import { useState } from "react";
import HomePage from "../components/HomePage";
import LandingPage from "../components/LandingPage";

export default function Home() {
  const [showLandingPage, setShowLandingPage] = useState(false);

  const handleStartAppeal = () => {
    setShowLandingPage(true);
  };

  const handleBackToHome = () => {
    setShowLandingPage(false);
  };

  return (
    <main>
      {showLandingPage ? (
        <LandingPage onBackToHome={handleBackToHome} />
      ) : (
        <HomePage onStartAppeal={handleStartAppeal} />
      )}
    </main>
  );
}
