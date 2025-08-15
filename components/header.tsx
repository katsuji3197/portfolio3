'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import MusicConsentPopup from './music-consent-popup';

interface HeaderProps {
  title?: string;
  links?: Array<{
    href: string;
    label: string;
    subLabel: string;
  }>;
}

export default function Header({
  title = 'folio.paon.dev',
  links = [
    { href: '/', label: 'TOP', subLabel: 'このサイトのトップへ' },
    { href: '/projects', label: 'Projects', subLabel: '制作実績' },
    { href: '/profile', label: 'Profile', subLabel: '私について' },
    { href: '/contact', label: 'Contact', subLabel: 'お問い合わせ' },
  ],
}: HeaderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [showConsentPopup, setShowConsentPopup] = useState(true);
  const [hasConsented, setHasConsented] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.loop = true;
    }
  }, [volume]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleConsent = () => {
    setHasConsented(true);
    setShowConsentPopup(false);
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleDecline = () => {
    setHasConsented(false);
    setShowConsentPopup(false);
  };
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHeaderVisibleAfterScroll, setIsHeaderVisibleAfterScroll] =
    useState(false);
  const pathname = usePathname();
  const shouldApplyScrollHide = pathname === '/';

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // メニュー表示中は背景スクロールをロック
  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!shouldApplyScrollHide) {
      setIsHeaderVisibleAfterScroll(true);
      return;
    }
    const handleScroll = () => {
      const shouldShow = window.scrollY > 50;
      setIsHeaderVisibleAfterScroll(shouldShow);
    };
    // 初期判定
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [shouldApplyScrollHide]);

  const headerTranslateClass = isMenuOpen
    ? '-translate-y-full'
    : isHeaderVisibleAfterScroll
      ? 'translate-y-0'
      : '-translate-y-full';

  return (
    <>
      <audio
        ref={audioRef}
        src="/music/Letter_Home_by_Ikson.mp3"
        preload="metadata"
      />

      {showConsentPopup && (
        <MusicConsentPopup
          onConsent={handleConsent}
          onDecline={handleDecline}
          isHeaderVisible={isHeaderVisibleAfterScroll}
        />
      )}

      <header
        className={`fixed top-0 left-0 right-0 z-50 bg-neutral-900/40 backdrop-blur-xs border-b-[1px] border-neutral-500 transform transition-transform duration-300 ${headerTranslateClass}`}
      >
        <div className="pr-8 pl-4 sm:pl-24 xl:pl-48">
          <div className="flex justify-between items-center h-16">
            {/* 左側のタイトル */}
            <div className="flex-shrink-0 flex items-center gap-2 justify-center">
              <Link
                href="/"
                className="text-xl font-bold text-neutral-200 hover:text-neutral-400 transition-colors"
              >
                {title}
              </Link>
              <div className="text-xs text-neutral-400 font-medium px-1 py-0.5 bg-neutral-800/50 backdrop-blur-sm border-[1px] border-neutral-500 rounded-md">
                3.0
              </div>
            </div>

            {/* ハンバーガーメニューボタン（常時表示） */}
            <div>
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-neutral-200 hover:text-neutral-500 duration-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-expanded={isMenuOpen}
                aria-label="メニューを開く"
              >
                <span className="sr-only">メニューを開く</span>
                {/* ハンバーガーアイコン */}
                <svg
                  className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                {/* 閉じるアイコン */}
                <svg
                  className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* オーバーレイ */}
      <div
        className={`fixed inset-0 bg-neutral-900/20 z-60 transition-opacity backdrop-blur-xs duration-200 ease-in-out overscroll-none ${
          isMenuOpen ? '' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMenuOpen(false)}
        onWheel={e => {
          if (isMenuOpen) e.preventDefault();
        }}
        onTouchMove={e => {
          if (isMenuOpen) e.preventDefault();
        }}
      />

      {/* 右側ドロアメニュー */}
      <div
        className={`fixed top-0 right-0 h-full w-2/3 max-w-[300px] bg-neutral-900/60 backdrop-blur-lg border-l border-neutral-500 z-70 transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* ドロアヘッダー */}
          <div className="flex justify-end items-end p-4">
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2 text-neutral-200 hover:text-neutral-500 transition-colors"
              aria-label="メニューを閉じる"
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* ドロアコンテンツ */}
          <nav className="flex-1 p-4">
            <div className="space-y-4">
              <div className="flex-shrink-0 border-b border-neutral-500 pb-6">
                <Link
                  href="/"
                  className="text-2xl font-bold text-neutral-200 hover:text-neutral-400 transition-colors px-4"
                >
                  {title}
                </Link>
              </div>
              {links.map((link, index) => {
                const isCurrentPage = pathname === link.href;
                return (
                  <Link
                    key={index}
                    href={link.href}
                    className={`block py-3 px-4 h-18 text-lg rounded-md font-medium background-blur-sm opacity-200 duration-300 ${
                      isCurrentPage
                        ? 'text-purple-300 cursor-default'
                        : 'text-neutral-200 hover:text-neutral-300 hover:bg-neutral-800/50 hover:border-[1px] hover:border-neutral-500'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <p>{link.label}</p>
                    <p className="text-sm text-neutral-400">
                      {isCurrentPage
                        ? `現在${link.label}にいます。`
                        : link.subLabel}
                    </p>
                  </Link>
                );
              })}

              {/* 音楽プレイヤー */}
              <div className="border-t border-neutral-500 pt-6 mt-6">
                <div className="px-4 mb-3">
                  <p className="text-sm text-neutral-400">BGM</p>
                </div>
                <div className="flex items-center gap-3 px-4">
                  <button
                    onClick={togglePlay}
                    className="w-8 h-8 rounded-full bg-neutral-800/50 hover:bg-neutral-700/50 transition-colors flex items-center justify-center text-neutral-200 border border-neutral-500"
                    aria-label={isPlaying ? '音楽を停止' : '音楽を再生'}
                  >
                    {isPlaying ? (
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M6 4h2v12H6V4zm6 0h2v12h-2V4z" />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    )}
                  </button>

                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-neutral-400">音量</span>

                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-full h-1 bg-neutral-700/50 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${volume * 100}%, #374151 ${volume * 100}%, #374151 100%)`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
