import Image from 'next/image';

type Skill = {
  name: string;
  level: number; // 0-100
  description?: string;
  icon?: string;
};

type SkillSet = {
  title: string;
  skills: Skill[];
};

const skillSets: SkillSet[] = [
  {
    title: 'Design',
    skills: [
      {
        name: 'UI Design',
        level: 80,
        description: '画面設計・ビジュアルデザイン',
        icon: '/icons/figma.svg',
      },
      {
        name: 'Illustrator',
        level: 60,
        description: 'ポスター・バナー制作',
        icon: '/icons/illustrator.svg',
      },
    ],
  },
  {
    title: 'Frontend',
    skills: [
      {
        name: 'HTML',
        level: 80,
        description: 'Webページの基本構造の構築',
        icon: '/icons/html.svg',
      },
      {
        name: 'CSS',
        level: 70,
        description: 'Webページのスタイリング',
        icon: '/icons/css.svg',
      },
      {
        name: 'Next.js',
        level: 70,
        description: 'SSG/SSRを使った実装',
        icon: '/icons/nextjs.svg',
      },
      {
        name: 'TypeScript',
        level: 70,
        description: '型を活かした実装',
        icon: '/icons/typescript.svg',
      },
      {
        name: 'Tailwind',
        level: 85,
        description: '柔軟かつ高速なスタイリング',
        icon: '/icons/tailwind.svg',
      },
    ],
  },
  {
    title: 'Other',
    skills: [
      {
        name: 'GitHub',
        level: 80,
        description: 'チーム開発・バージョン管理',
        icon: '/icons/github.svg',
      },
      {
        name: 'Python',
        level: 70,
        description: '簡単なデータ処理',
        icon: '/icons/python.svg',
      },
      {
        name: 'Cursor',
        level: 80,
        description: 'AIとの連携による爆発的な生産性',
        icon: '/icons/cursor.svg',
      },
    ],
  },
];

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full bg-neutral-800/30 h-1 rounded-full overflow-hidden">
      <div
        className="h-1 bg-neutral-200/70"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export default function SkillsSection() {
  return (
    <div className="flex flex-col gap-8">
      {skillSets.map((set, idx) => (
        <div key={idx} className="flex flex-col gap-4">
          <h3 className="text-md md:text-lg font-medium text-neutral-400 border-b border-neutral-700 pb-2 w-full">
            {set.title}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {set.skills.map((skill, sidx) => (
              <div
                key={sidx}
                className="flex flex-col gap-2 bg-neutral-900/10 backdrop-blur-xs px-4 py-2 rounded-lg border border-neutral-700"
              >
                <div className="flex items-center gap-3">
                  {skill.icon && (
                    <Image
                      src={skill.icon}
                      alt={skill.name}
                      width={24}
                      height={24}
                      className="opacity-80"
                    />
                  )}
                  <div className="flex flex-col gap-1">
                    <div className="text-sm md:text-base font-medium text-neutral-100">
                      {skill.name}
                    </div>
                    <div className="text-xs md:text-sm text-neutral-400">
                      {skill.description}
                    </div>
                  </div>
                </div>
                <div className="pt-1">
                  <ProgressBar value={skill.level} />
                </div>
                <div className="text-xs text-neutral-400 pt-1">
                  {skill.level}%の自信
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
