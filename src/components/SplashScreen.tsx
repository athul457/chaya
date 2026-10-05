import React, { useEffect, useState } from "react";

interface Props {
  onDone: () => void;
}

const EMOJIS = ["🍛", "🫓", "☕", "🥘", "🍜", "🍕"];

const SplashScreen: React.FC<Props> = ({ onDone }) => {
  const [progress, setProgress] = useState(0);
  const [hiding, setHiding] = useState(false);
  const [emojiIndex, setEmojiIndex] = useState(0);

  // Rotate emojis
  useEffect(() => {
    const interval = setInterval(() => {
      setEmojiIndex((i) => (i + 1) % EMOJIS.length);
    }, 300);
    return () => clearInterval(interval);
  }, []);

  // Progress bar fills over 1.8 s
  useEffect(() => {
    const start = performance.now();
    const duration = 1800;

    const tick = (now: number) => {
      const elapsed = now - start;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);

      if (pct < 100) {
        requestAnimationFrame(tick);
      } else {
        // Hold for 200 ms then fade out
        setTimeout(() => {
          setHiding(true);
          setTimeout(onDone, 500); // matches CSS transition
        }, 200);
      }
    };

    requestAnimationFrame(tick);
  }, [onDone]);

  return (
    <div className={`splash ${hiding ? "splash--hide" : ""}`}>
      {/* Decorative blobs */}
      <div className="splash-blob splash-blob--1" />
      <div className="splash-blob splash-blob--2" />
      <div className="splash-blob splash-blob--3" />

      <div className="splash-content">
        {/* Spinning ring + emoji */}
        <div className="splash-icon-wrap">
          <div className="splash-ring" />
          <div className="splash-ring splash-ring--2" />
          <span className="splash-emoji">{EMOJIS[emojiIndex]}</span>
        </div>

        {/* Brand */}
        <h1 className="splash-title">FoodCourt</h1>
        <p className="splash-tagline">Discover · Order · Enjoy</p>

        {/* Progress bar */}
        <div className="splash-progress-track">
          <div
            className="splash-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="splash-loading-text">Loading your courts…</p>
      </div>
    </div>
  );
};

export default SplashScreen;
