'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TimelineHome from './timeline-home';

type TabType = 'comment' | 'skills' | 'history';

export default function ProfileTabs() {
  const [activeTab, setActiveTab] = useState<TabType>('comment');
  const [isMdScreen, setIsMdScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMdScreen(window.innerWidth >= 768); // Tailwind md breakpoint
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const tabs = [
    { id: 'comment' as TabType, label: 'Comment', jpLabel: 'コメント' },
    { id: 'skills' as TabType, label: 'Skills', jpLabel: 'スキル' },
    { id: 'history' as TabType, label: 'History', jpLabel: '履歴' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'comment':
        return (
          <div className="w-max text-start flex flex-col items-start gap-2 text-sm leading-relaxed">
            <p>お越しいただきありがとうございます。</p>
            <p>コメント</p>
            <p>コメント</p>
          </div>
        );
      case 'skills':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-neutral-200 mb-3">
                デザイン
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Figma</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Adobe XD</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Photoshop</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Illustrator</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-neutral-200 mb-3">
                フロントエンド
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>React</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Next.js</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>TypeScript</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Tailwind CSS</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>HTML/CSS</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>JavaScript</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-neutral-200 mb-3">
                その他
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Git</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>GitHub</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Vercel</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Netlify</span>
                </div>
              </div>
            </div>
          </div>
        );
      case 'history':
        return <TimelineHome />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 items-center max-w-[800px]">
      {/* タブヘッダー */}
      <div className="relative flex border-b border-neutral-700 mb-6 w-full items-center justify-center">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-4 py-2 text-sm font-medium transition-colors w-1/3 md:w-32 duration-200 ${
              activeTab === tab.id
                ? 'text-neutral-200'
                : 'text-neutral-400 hover:text-neutral-300'
            }`}
          >
            <div className="flex flex-col items-center">
              <span className="text-xs">{tab.label}</span>
              <span className="text-xs opacity-70">{tab.jpLabel}</span>
            </div>
          </button>
        ))}

        {/* アニメーション付きアンダーライン */}
        <motion.div
          className="absolute bottom-0 h-0.5 bg-neutral-200"
          initial={false}
          animate={
            isMdScreen
              ? {
                  // md以上: 固定幅128px (w-32) × 3タブ = 384px
                  // 中央揃えになるようコンテナ中央から計算
                  left: `calc(50% - 192px + ${tabs.findIndex(tab => tab.id === activeTab) * 128}px)`,
                  width: '128px',
                }
              : {
                  // md未満: 各タブ33.33%幅
                  left: `${tabs.findIndex(tab => tab.id === activeTab) * (100 / tabs.length)}%`,
                  width: `${100 / tabs.length}%`,
                }
          }
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
            duration: 0.3,
          }}
        />
      </div>

      {/* タブコンテンツ */}
      <div className="min-h-[500px] sm:min-h-[400px] md:min-h-[500px] px-4 md:px-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              duration: 0.3,
              ease: 'easeInOut',
            }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
