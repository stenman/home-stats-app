"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import { Star } from "lucide-react";

type InspectCelebrationProps = {
  open: boolean;
  userName: string;
  avatarSrc: string | null;
  emoji: string;
  points: number;
  onClose: () => void;
};

export function InspectCelebration({
  open,
  userName,
  avatarSrc,
  emoji,
  points,
  onClose,
}: InspectCelebrationProps) {
  useEffect(() => {
    if (!open) return;

    const fire = (originX: number) => {
      confetti({
        particleCount: 80,
        spread: 70,
        startVelocity: 45,
        origin: { x: originX, y: 0.6 },
      });
    };
    fire(0.3);
    fire(0.7);
    const burst = window.setTimeout(() => fire(0.5), 250);
    const dismiss = window.setTimeout(onClose, 2500);

    return () => {
      window.clearTimeout(burst);
      window.clearTimeout(dismiss);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex flex-col items-center gap-3 rounded-3xl border bg-card px-10 py-8 shadow-2xl animate-in zoom-in-90 duration-300">
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt={userName}
            className="size-24 rounded-full object-cover shadow-md"
          />
        ) : (
          <span className="text-7xl select-none">{emoji}</span>
        )}
        <span className="text-2xl font-bold">{userName}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-4 py-1.5 text-2xl font-bold text-amber-600 dark:text-amber-400">
          <Star className="size-6 fill-amber-500 text-amber-500" />
          +{points}p
        </span>
      </div>
    </div>
  );
}
