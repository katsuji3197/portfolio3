'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TimelineHome from './timeline-home';
import Image from 'next/image';
import PrimaryButton from './primary-button';

type TabType = 'comment' | 'skills' | 'history';

// スキルデータの型定義
type SkillItem = {
  name: string;
  icon: string;
  alt: string;
};

type SkillCategory = {
  title: string;
  items: SkillItem[];
  gridCols?: string;
  gap?: string;
};

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
    { id: 'history' as TabType, label: 'History', jpLabel: '略歴' },
  ];

  // スキルデータの配列
  const skillsData: SkillCategory[] = [
    {
      title: 'デザイン',
      items: [
        { name: 'Figma', icon: '/icons/figma.svg', alt: 'Figma' },
        {
          name: 'Illustrator',
          icon: '/icons/illustrator.svg',
          alt: 'Illustrator',
        },
      ],
      gridCols: 'grid-cols-2',
      gap: 'gap-2',
    },
    {
      title: '言語',
      items: [
        { name: 'HTML', icon: '/icons/html.svg', alt: 'HTML' },
        {
          name: 'Typescript',
          icon: '/icons/typescript.svg',
          alt: 'Typescript',
        },
        { name: 'CSS', icon: '/icons/css.svg', alt: 'CSS' },
        { name: 'Python', icon: '/icons/python.svg', alt: 'Python' },
        { name: 'C', icon: '/icons/clang.svg', alt: 'C' },
      ],
      gridCols: 'grid-cols-2',
      gap: 'gap-4',
    },
    {
      title: '技術',
      items: [
        { name: 'GitHub', icon: '/icons/github.svg', alt: 'GitHub' },
        { name: 'Next.js', icon: '/icons/nextjs.svg', alt: 'Next.js' },
        { name: 'Vercel', icon: '/icons/vercel.svg', alt: 'Vercel' },
        { name: 'Tailwind', icon: '/icons/tailwind.svg', alt: 'Tailwind' },
      ],
      gridCols: 'grid-cols-2',
      gap: 'gap-2',
    },
    {
      title: 'その他ツール',
      items: [
        { name: 'Cursor', icon: '/icons/cursor.svg', alt: 'Cursor' },
        { name: 'Gemini', icon: '/icons/gemini.svg', alt: 'Gemini' },
        { name: 'Notion', icon: '/icons/notion.svg', alt: 'Notion' },
        { name: 'Shell', icon: '/icons/shell.svg', alt: 'Shell' },
      ],
      gridCols: 'grid-cols-2',
      gap: 'gap-2',
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'comment':
        return (
          <div className="text-xs md:text-sm w-full text-neutral-300 lg:w-[110%] text-start flex flex-col items-start leading-relaxed tracking-wider">
            <h1 className="pb-4 font-medium text-md md:text-xl text-amber-200/80">
              コメント
            </h1>
            <p>ご覧いただきありがとうございます。</p>
            <br />
            <p>
              飾りすぎない、わかりやすさとカッコよさの両立したデザインが好きです。
            </p>
            <p>
              製作を進める際は、使いやすさを第一に考えつつ、要望に合わせた雰囲気が出せるよう努めています。
            </p>
            <br />
            <p>
              技術もデザインも紙一重。技術はデザインであり、デザインは技術です。
            </p>
            <p>
              どちらも人に寄り添い、悩みや様々な問題を解決することも、感動を与えることもできます。
            </p>
            <p>
              こういった点で、両者に大きな違いはありません。このような考えを持っています。
            </p>
            <p>そのため私は、両者の境界を持たないようにしています。</p>
            <br />
            <p>まだまだ経験が浅いため、様々な経験を積みながら、</p>
            <p>さらなるスキルを磨いていきたいと思っています。</p>
            <br />
            <p>何か私にできることがありましたら、お気軽にご相談ください。</p>
            <div className="flex gap-6 mt-8">
              <PrimaryButton href="/contact">お問い合わせ</PrimaryButton>
            </div>
          </div>
        );
      case 'skills':
        return (
          <div>
            <h1 className="pb-4 font-medium text-md md:text-xl text-amber-200/80">
              スキル
            </h1>
            <div className="flex flex-col lg:grid grid-cols-2 gap-12">
              {skillsData.map((category, categoryIndex) => (
                <div key={categoryIndex}>
                  <h3 className="text-md font-medium text-neutral-500 mb-3 w-[280px] border-b border-neutral-700 pb-2">
                    {category.title}
                  </h3>
                  <div
                    className={`grid ${category.gridCols} ${category.gap} text-sm`}
                  >
                    {category.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center gap-2">
                        <Image
                          src={item.icon}
                          alt={item.alt}
                          width={20}
                          height={20}
                          className="opacity-70"
                        />
                        <span className="text-sm lg:text-base">
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
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
                ? 'text-neutral-200 cursor-none'
                : 'text-neutral-400 hover:text-neutral-300 cursor-pointer'
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
