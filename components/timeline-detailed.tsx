import TimelineItem from './timeline-item';

const detailedTimeline = [
  { year: '2003年', text: '石川県珠洲市に生まれる' },
  {
    year: '幼少期',
    text: '積み木や模型を作ることに熱中。ものづくりの原体験。',
  },
  {
    year: '小学校',
    text: 'PowerPointで作品制作。プレゼンを通じて表現に興味を持つ。',
  },
  {
    year: '中学校',
    text: 'テックキャンプでHTML/CSSに触れ、WEB制作に興味を持つ。',
  },
  { year: '高校', text: '動画編集とデザインに出会い、見せ方を学ぶ。' },
  {
    year: '大学',
    text: '授業でFigmaに触れ、UI/UXに傾倒。様々なプロジェクトに参加。',
  },
  {
    year: '現在',
    text: 'フロントエンド実装・デザインを行いながら経験を積んでいる。',
  },
];

export default function TimelineDetailed() {
  return (
    <div className="flex flex-col gap-4">
      {detailedTimeline.map((item, idx) => (
        <TimelineItem key={idx} year={item.year} text={item.text} />
      ))}
    </div>
  );
}
