import React from "react";

interface HanziCardProps {
  hanzi: string;
  pinyin: string;
  meaning: string;
  hskLevel: number;
}

export default function HanziCard({
  hanzi,
  pinyin,
  meaning,
  hskLevel,
}: HanziCardProps) {
  return (
    <div className="relative flex flex-col items-center justify-center p-6 bg-card rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-border cursor-pointer group">
      {/* HSK Level Badge - Top Right */}
      <div className="absolute top-3 right-3">
        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
          HSK {hskLevel}
        </span>
      </div>

      {/* Main Character */}
      <div className="mt-4 mb-2">
        <span className="text-7xl font-bold text-primary tracking-tight">
          {hanzi}
        </span>
      </div>

      {/* Pinyin and Meaning */}
      <div className="text-center mt-2 space-y-1">
        <p className="text-lg font-medium text-foreground">{pinyin}</p>
        <p className="text-sm text-muted-foreground">{meaning}</p>
      </div>
    </div>
  );
}
