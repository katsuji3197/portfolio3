'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import MusicConsentPopup from './music-consent-popup';
import { useCursor } from '@/contexts/cursor-context';

interface HeaderProps {
  title?: string;
  links?: Array<{
    href: string;
    label: string;
    subLabel: string;
  }>;
}

// 音楽ファイルのリスト
const musicTracks = [
  '/music/Letter_Home_by_Ikson.mp3',
  '/music/River_by_Ikson.mp3',
  '/music/Tender_Wind_by_Ikson.mp3',
];

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
  const [volume, setVolume] = useState(0.6);
  const [showConsentPopup, setShowConsentPopup] = useState(true);
  const [hasConsented, setHasConsented] = useState(false);
  const [userExplicitlyConsented, setUserExplicitlyConsented] = useState(false); // ユーザーが明示的に同意したかどうか
  const [currentTrack, setCurrentTrack] = useState(musicTracks[0]); // 初期値は固定

  // 現在時刻の秒数を基準に曲を選択する関数
  const getTrackByTime = () => {
    const now = new Date();
    const seconds = now.getSeconds();
    return musicTracks[seconds % musicTracks.length];
  };
  const [autoplayAttempted, setAutoplayAttempted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.loop = false; // 曲が終わったら次の曲を流すためループを無効化
    }
  }, [volume]);

  // 曲が終了したときに次のランダムな曲を再生
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      // 時刻を基準に次の曲を選択（現在の曲と異なる場合のみ）
      let nextTrack = getTrackByTime();
      // もし同じ曲が選ばれた場合は、次のインデックスの曲を選択
      if (nextTrack === currentTrack) {
        const currentIndex = musicTracks.indexOf(currentTrack);
        const nextIndex = (currentIndex + 1) % musicTracks.length;
        nextTrack = musicTracks[nextIndex];
      }
      setCurrentTrack(nextTrack);
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [currentTrack]);

  // 曲が変更されたときにaudioのsrcを更新
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = currentTrack;
      audioRef.current.load();

      // 再生中だった場合は新しい曲も自動再生
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      }
    }
  }, [currentTrack, isPlaying]);

  // クライアントサイドでのみ時刻に基づく曲を選択し、ハイドレーション後に自動再生を試行
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const timeBasedTrack = getTrackByTime();
      setCurrentTrack(timeBasedTrack);

      // ハイドレーション後に自動再生を試行
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current
            .play()
            .then(() => {
              // 自動再生成功 - 暗黙的な同意として扱う
              setHasConsented(true);
              setUserExplicitlyConsented(true);
              setShowConsentPopup(false);
              setIsPlaying(true);
            })
            .catch(() => {
              // 自動再生失敗 - ユーザー操作が必要、ポップアップを表示
              setIsPlaying(false);
              setShowConsentPopup(true);
              setHasConsented(false);
              setUserExplicitlyConsented(false);
            });
        }
      }, 1000);
    }
  }, []);

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
    setUserExplicitlyConsented(true); // ユーザーが明示的に同意
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
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const shouldApplyScrollHide = pathname === '/';
  const { isCustomCursorEnabled, toggleCustomCursor } = useCursor();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleHeaderMouseEnter = () => {
    // タイマーをクリア
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHeaderHovered(true);
  };

  const handleHeaderMouseLeave = () => {
    // 1秒後にヘッダーを隠す
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHeaderHovered(false);
      hoverTimeoutRef.current = null;
    }, 2000);
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

  // ユーザーが明示的に同意した場合のみ、最初の操作で自動再生を試行
  useEffect(() => {
    if (
      !autoplayAttempted &&
      userExplicitlyConsented &&
      !isPlaying &&
      !showConsentPopup
    ) {
      const handleFirstInteraction = () => {
        if (audioRef.current && !isPlaying) {
          audioRef.current
            .play()
            .then(() => {
              setIsPlaying(true);
              setAutoplayAttempted(true);
            })
            .catch(() => {
              // まだ自動再生できない場合はそのまま
            });
        }
        // イベントリスナーを削除（一度だけ実行）
        document.removeEventListener('click', handleFirstInteraction);
        document.removeEventListener('keydown', handleFirstInteraction);
        document.removeEventListener('touchstart', handleFirstInteraction);
      };

      document.addEventListener('click', handleFirstInteraction);
      document.addEventListener('keydown', handleFirstInteraction);
      document.addEventListener('touchstart', handleFirstInteraction);

      return () => {
        document.removeEventListener('click', handleFirstInteraction);
        document.removeEventListener('keydown', handleFirstInteraction);
        document.removeEventListener('touchstart', handleFirstInteraction);
      };
    }
  }, [autoplayAttempted, userExplicitlyConsented, isPlaying, showConsentPopup]);

  // タイマーのクリーンアップ
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const headerTranslateClass = isMenuOpen
    ? '-translate-y-full'
    : isHeaderVisibleAfterScroll || isHeaderHovered
      ? 'translate-y-0'
      : '-translate-y-full';

  return (
    <>
      <audio ref={audioRef} src={currentTrack} preload="metadata" />

      {showConsentPopup && (
        <MusicConsentPopup
          onConsent={handleConsent}
          onDecline={handleDecline}
          isHeaderVisible={isHeaderVisibleAfterScroll}
        />
      )}

      {/* ヘッダーホバーエリア（隠れている時でもホバー検知用） */}
      <div
        className="fixed top-0 w-48 right-0 h-24 z-40"
        onMouseEnter={handleHeaderMouseEnter}
        onMouseLeave={handleHeaderMouseLeave}
      />
      <div
        className="fixed top-0 w-64 left-0 h-24 z-40"
        onMouseEnter={handleHeaderMouseEnter}
        onMouseLeave={handleHeaderMouseLeave}
      />

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
                className="inline-flex items-center cursor-pointer justify-center p-2 rounded-md text-neutral-200 hover:text-neutral-500 duration-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
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
        className={`fixed top-0 right-0 h-full w-2/3 max-w-[300px] bg-neutral-900/10 border-l border-neutral-500 z-70 transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* ドロアヘッダー */}
          <div className="flex justify-between items-center px-4 pt-8">
            <Link
              href="/"
              className="text-2xl font-bold text-neutral-200 hover:text-neutral-400 transition-colors pl-4"
            >
              {title}
            </Link>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2 text-neutral-200 hover:text-neutral-500 cursor-pointer transition-colors"
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
          <nav className="flex-1 p-4 ">
            <div className="space-y-1 border-t border-neutral-500 pt-4">
              {links.map((link, index) => {
                const isCurrentPage = pathname === link.href;
                return (
                  <Link
                    key={index}
                    href={link.href}
                    className={`flex flex-col justify-center px-4 h-16 text-md rounded-md font-medium background-blur-sm opacity-200 duration-100 ${
                      isCurrentPage
                        ? 'text-purple-300 cursor-default'
                        : 'text-neutral-200 hover:text-neutral-300 hover:bg-neutral-800/50 hover:border-[1px] hover:border-neutral-500'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <p>{link.label}</p>
                    <p className="text-sm text-neutral-400">
                      {isCurrentPage ? `現在閲覧中です。` : link.subLabel}
                    </p>
                  </Link>
                );
              })}

              {/* 音楽プレイヤー */}
              <div className="border-t border-neutral-500 pt-6 mt-6">
                <div className="px-4 mb-3">
                  <p className="text-sm text-neutral-200">BGM</p>
                </div>
                <div className="flex items-center justify-between px-4 mb-4">
                  <span className="text-sm text-neutral-400 pl-2">
                    {isPlaying ? '再生中' : '停止中'}
                  </span>
                  <button
                    onClick={togglePlay}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isPlaying ? 'bg-purple-500' : 'bg-neutral-600'
                    }`}
                    aria-label={isPlaying ? 'BGMを停止' : 'BGMを再生'}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isPlaying ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {isPlaying && (
                  <div className="flex items-center gap-1 px-4 pb-8">
                    <span className="text-sm text-neutral-400 w-28 pl-2">
                      音量
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-full h-1 bg-neutral-700/50 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${volume * 100}%, #373737 ${volume * 100}%, #373737 100%)`,
                      }}
                    />
                  </div>
                )}
              </div>

              {/* カスタムカーソル設定（md以上のみ表示） */}
              <div className="hidden md:block">
                <div className="px-4 mb-3">
                  <p className="text-sm text-neutral-200">カスタムカーソル</p>
                </div>
                <div className="flex items-center justify-between px-4">
                  <span className="text-sm text-neutral-400 pl-2">
                    {isCustomCursorEnabled ? '有効' : '無効'}
                  </span>
                  <button
                    onClick={toggleCustomCursor}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isCustomCursorEnabled ? 'bg-purple-500' : 'bg-neutral-600'
                    }`}
                    aria-label={
                      isCustomCursorEnabled
                        ? 'カスタムカーソルを無効化'
                        : 'カスタムカーソルを有効化'
                    }
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isCustomCursorEnabled
                          ? 'translate-x-6'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
