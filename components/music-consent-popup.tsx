'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface MusicConsentPopupProps {
  onConsent: () => void;
  onDecline: () => void;
  isHeaderVisible: boolean;
}

export default function MusicConsentPopup({
  onConsent,
  onDecline,
  isHeaderVisible,
}: MusicConsentPopupProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [timeLeft, setTimeLeft] = useState(8);

  // 最新の onDecline を参照する ref（タイマー内で安全に呼ぶため）
  const onDeclineRef = useRef(onDecline);
  useEffect(() => {
    onDeclineRef.current = onDecline;
  }, [onDecline]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsFadingOut(true);
          setTimeout(() => {
            setIsVisible(false);
            // ref 経由で最新の onDecline を呼ぶ
            onDeclineRef.current();
          }, 300); // アニメーション時間に合わせる
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // onDeclineRef で最新値を参照するため依存配列は空に保つ
  }, []);

  const handleConsent = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      setIsVisible(false);
      onConsent();
    }, 300); // アニメーション時間に合わせる
  };

  const handleDecline = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      setIsVisible(false);
      onDecline();
    }, 300); // アニメーション時間に合わせる
  };

  if (!isVisible || pathname !== '/') return null;

  return (
    <div
      className={`fixed ${isHeaderVisible ? 'top-24' : 'top-6'} left-1/2 -translate-x-1/2 duration-200 w-screen max-w-[600px] px-6 z-50 ${isFadingOut ? 'animate-fade-out' : 'animate-fade-in'}`}
    >
      <div className="bg-neutral-900/10 backdrop-blur-xs border border-neutral-700 rounded-lg p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-neutral-200">BGMを再生しますか？</p>
            <div className="text-xs text-neutral-400">
              {timeLeft}秒後に自動で閉じます
            </div>
          </div>

          <div className="flex flex-col justify-between items-center h-full">
            <div className="flex gap-4">
              <button
                onClick={handleConsent}
                className="py-2 text-purple-200 text-xs font-medium rounded-md transition-colors flex items-center gap-1 cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                再生する
              </button>
              <button
                onClick={handleDecline}
                className="px-4 py-2  text-neutral-300 text-xs font-medium rounded-md transition-colors cursor-pointer"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
