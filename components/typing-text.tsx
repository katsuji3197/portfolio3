"use client";

import { useEffect, useMemo, useState } from "react";

type TypingTextProps = {
  lines: string[];
  speedMs?: number;
  startDelayMs?: number;
  className?: string;
  showCursor?: boolean;
};

export default function TypingText({
  lines,
  speedMs = 40,
  startDelayMs = 0,
  className,
  showCursor = true,
}: TypingTextProps) {
  const [displayedLines, setDisplayedLines] = useState<string[]>(
    () => lines.map(() => "")
  );
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const normalizedLines = useMemo(() => lines, [lines]);

  useEffect(() => {
    let cancelled = false;

    async function sleep(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function typeAll() {
      setDisplayedLines(normalizedLines.map(() => ""));
      setIsTyping(false);
      if (startDelayMs > 0) {
        await sleep(startDelayMs);
      }
      setIsTyping(true);

      for (let lineIndex = 0; lineIndex < normalizedLines.length; lineIndex += 1) {
        const currentLine = normalizedLines[lineIndex] ?? "";
        for (let charIndex = 0; charIndex < currentLine.length; charIndex += 1) {
          if (cancelled) return;
          setDisplayedLines((prev) => {
            const copy = [...prev];
            copy[lineIndex] = copy[lineIndex] + currentLine[charIndex];
            return copy;
          });
          await sleep(speedMs);
        }
        // 小さな間（行送りのための余韻）
        if (lineIndex < normalizedLines.length - 1) {
          await sleep(Math.max(80, speedMs));
        }
      }
      setIsTyping(false);
    }

    typeAll();
    return () => {
      cancelled = true;
    };
  }, [normalizedLines, speedMs, startDelayMs]);

  return (
    <span className={className} aria-live="polite" aria-atomic="true">
      {displayedLines.map((text, idx) => {
        const isLast = idx === displayedLines.length - 1;
        const showCaret = showCursor && isTyping && isLast;
        return (
          <span key={idx} className="block">
            <span
              className={
                showCaret
                  ? "after:ml-0.5 after:inline-block after:w-[1ch] after:animate-pulse after:text-current after:content-['|']"
                  : undefined
              }
            >
              {text}
            </span>
          </span>
        );
      })}
    </span>
  );
}


