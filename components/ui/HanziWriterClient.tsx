"use client";

import React, { useEffect, useRef, useState } from "react";
import HanziWriter from "hanzi-writer";

interface HanziWriterClientProps {
  character: string;
}

export default function HanziWriterClient({ character }: HanziWriterClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Store the writer instance to call methods on it later
  const [writer, setWriter] = useState<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous SVG content to avoid duplicates during re-renders (e.g., React StrictMode)
    containerRef.current.innerHTML = "";

    const hw = HanziWriter.create(containerRef.current, character, {
      width: 250,
      height: 250,
      padding: 5,
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 50,
      strokeColor: "#1e40af", // Using the requested primary color
    });

    setWriter(hw);

    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [character]);

  const handleAnimate = () => {
    if (writer) {
      writer.animateCharacter();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-card rounded-2xl shadow-sm border border-border max-w-sm mx-auto">
      <div
        ref={containerRef}
        className="mb-6 rounded-xl flex items-center justify-center bg-background overflow-hidden"
        style={{ width: 250, height: 250 }}
      >
        {/* HanziWriter SVG gets mounted here */}
      </div>

      <button
        onClick={handleAnimate}
        className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-full font-medium transition-colors shadow-sm active:scale-95"
      >
        播放笔顺
      </button>
    </div>
  );
}
