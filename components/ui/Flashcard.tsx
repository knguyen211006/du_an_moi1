'use client';

import { useState } from 'react';
import PlayAudioButton from './PlayAudioButton';

interface FlashcardProps {
  hanzi: string;
  pinyin: string;
  meaning: string;
}

export default function Flashcard({ hanzi, pinyin, meaning }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="h-80 w-full max-w-sm mx-auto bg-white rounded-3xl border-2 border-gray-100 shadow-md cursor-pointer hover:shadow-lg transition-all flex flex-col items-center justify-center p-6 text-center select-none hover:rotate-1 active:rotate-0"
      onClick={() => setIsFlipped(!isFlipped)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsFlipped(!isFlipped);
        }
      }}
    >
{isFlipped ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 justify-center mb-2">
            <div className="text-3xl font-bold text-slate-800">{pinyin}</div>
            <PlayAudioButton text={hanzi} />
          </div>
          <div className="text-xl font-medium text-slate-700">{meaning}</div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="text-7xl font-extrabold text-slate-800 drop-shadow-md tracking-widest">{hanzi}</div>
          <PlayAudioButton text={hanzi} />
        </div>
      )}
    </div>
  );
}
