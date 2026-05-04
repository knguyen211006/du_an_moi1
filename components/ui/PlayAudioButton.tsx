'use client';

import { Volume2 } from 'lucide-react';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface PlayAudioButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
}

const PlayAudioButton = forwardRef<HTMLButtonElement, PlayAudioButtonProps>(
  ({ text, className = '', ...props }, ref) => {
    const playAudio = (e: React.MouseEvent) => {
      e.stopPropagation();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    };

    return (
      <button
        ref={ref}
        onClick={playAudio}
        className={`inline-flex items-center justify-center p-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm border border-primary/20 ${className}`}
        aria-label={`Phát âm cho "${text}"`}
        {...props}
      >
        <Volume2 className="h-5 w-5" />
      </button>
    );
  }
);

PlayAudioButton.displayName = 'PlayAudioButton';

export default PlayAudioButton;
