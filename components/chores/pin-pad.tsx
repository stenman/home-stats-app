"use client";

import React, { useState, useEffect } from "react";
import { X, Delete } from "lucide-react";
import { Button } from "@/components/ui/button";

type PinPadProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title: string;
  cancelLabel: string;
  errorLabel: string;
};

export function PinPad({
  isOpen,
  onClose,
  onSuccess,
  title,
  cancelLabel,
  errorLabel,
}: PinPadProps) {
  const [pin, setPin] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin("");
      setShowError(false);
      setIsShaking(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeyPress = (num: string) => {
    if (isVerifying || showError) return;
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleClear = () => {
    if (isVerifying) return;
    setPin("");
    setShowError(false);
  };

  const handleBackspace = () => {
    if (isVerifying || showError) return;
    setPin(pin.slice(0, -1));
  };

  const verifyPin = async (enteredPin: string) => {
    setIsVerifying(true);
    try {
      const res = await fetch("/api/chores/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: enteredPin }),
      });
      const data = await res.json();
      if (data.valid) {
        onSuccess();
        onClose();
      } else {
        setIsShaking(true);
        setShowError(true);
        setTimeout(() => {
          setIsShaking(false);
        }, 500);
        setTimeout(() => {
          setPin("");
          setShowError(false);
        }, 1200);
      }
    } catch (err) {
      console.error(err);
      setIsShaking(true);
      setShowError(true);
      setTimeout(() => {
        setIsShaking(false);
      }, 500);
      setTimeout(() => {
        setPin("");
        setShowError(false);
      }, 1200);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
        .shake-anim {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>

      <div
        className={`w-full max-w-sm rounded-2xl border bg-card p-6 shadow-xl transition-all duration-200 ${
          isShaking ? "shake-anim border-destructive" : ""
        }`}
      >
        <div className="flex items-center justify-between border-b pb-3 mb-6">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full size-10 flex items-center justify-center"
            disabled={isVerifying}
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* PIN Indicators */}
        <div className="flex flex-col items-center justify-center gap-2 mb-8">
          <div className="flex gap-4">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`size-4 rounded-full border-2 transition-all duration-150 ${
                  showError
                    ? "bg-destructive border-destructive"
                    : pin.length > index
                    ? "bg-primary border-primary scale-110"
                    : "border-muted-foreground/30 bg-transparent"
                }`}
              />
            ))}
          </div>
          {showError && (
            <span className="text-sm font-medium text-destructive mt-2 animate-bounce">
              {errorLabel}
            </span>
          )}
        </div>

        {/* Numpad Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="flex h-16 items-center justify-center rounded-xl border bg-muted/30 text-2xl font-semibold shadow-sm active:bg-muted touch-manipulation hover:bg-muted/50 transition-colors"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="flex h-16 items-center justify-center rounded-xl border border-transparent bg-transparent text-sm font-medium text-muted-foreground hover:bg-muted/10 active:bg-muted/20 touch-manipulation"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress("0")}
            className="flex h-16 items-center justify-center rounded-xl border bg-muted/30 text-2xl font-semibold shadow-sm active:bg-muted touch-manipulation hover:bg-muted/50 transition-colors"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="flex h-16 items-center justify-center rounded-xl border border-transparent bg-transparent text-muted-foreground hover:bg-muted/10 active:bg-muted/20 touch-manipulation"
          >
            <Delete className="size-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
