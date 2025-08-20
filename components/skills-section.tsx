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
        level: 75,
        description: '画面設計・ビジュアルデザイン',
        icon: '/icons/figma.svg',
      },
      {
        name: 'Illustration',
        level: 50,
        description: 'シンプルなキャラクターやアセット作成',
        icon: '/icons/illustrator.svg',
      },
    ],
  },
  {
    title: 'Frontend',
    skills: [
      {
        name: 'Next.js',
        level: 70,
        description: 'SSG/SSRを使った実装',
        icon: '/icons/nextjs.svg',
      },
      {
        name: 'TypeScript',
        level: 65,
        description: '型を活かした堅牢な実装',
        icon: '/icons/typescript.svg',
      },
      {
        name: 'Tailwind',
        level: 70,
        description: 'ユーティリティでの高速なスタイリング',
        icon: '/icons/tailwind.svg',
      },
    ],
  },
  {
    title: 'Other',
    skills: [
      {
        name: 'Git',
        level: 70,
        description: 'バージョン管理・PRフロー',
        icon: '/icons/github.svg',
      },
      {
        name: 'Python',
        level: 40,
        description: 'スクリプトやデータ処理',
        icon: '/icons/python.svg',
      },
    ],
  },
];

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full bg-neutral-800/30 h-2 rounded-full overflow-hidden">
      <div
        className="h-2 bg-neutral-200/70"
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
          <h3 className="text-md font-medium text-neutral-400 border-b border-neutral-700 pb-2 w-[240px]">
            {set.title}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {set.skills.map((skill, sidx) => (
              <div
                key={sidx}
                className="flex flex-col gap-2 bg-neutral-900/10 p-4 rounded-lg border border-neutral-700"
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
                  <div>
                    <div className="text-sm font-medium text-neutral-100">
                      {skill.name}
                    </div>
                    <div className="text-xs text-neutral-400">
                      {skill.description}
                    </div>
                  </div>
                </div>
                <div className="pt-2">
                  <ProgressBar value={skill.level} />
                </div>
                <div className="text-xs text-neutral-400 pt-1">
                  {skill.level}% の自信
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
