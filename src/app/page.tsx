"use client";
import { useState } from "react";
import HomePage from "../components/HomePage";
import UpdatedMultiStepForm from "../components/UpdatedMultiStepForm";

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
        <UpdatedMultiStepForm onBackToHome={handleBackToHome} />
      ) : (
        <HomePage onStartAppeal={handleStartAppeal} />
      )}
    </main>
  );
}
