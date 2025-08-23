import TimelineItem from './timeline-item';

// タイムラインデータ
const timelineData = [
  { year: '2003年', text: '石川県珠洲市に生まれる' },
  { year: '幼少期', text: '積み木などを組み立てて様々なものを作ることに夢中' },
  { year: '〃', text: 'パソコンに興味を持ち、テクノロジーに魅了される' },
  { year: '小学校', text: '休み時間にPowerPointを使った作品制作に熱中' },
  { year: '中学校', text: 'テックキャンプでHTML/CSSに出会う' },
  { year: '高校', text: '動画編集の勉強中、デザインと出会う' },
  { year: '大学', text: '授業にてFigmaと出会い、UI/UXデザインに興味を持つ' },
  { year: '〃', text: '様々な活動に挑戦し、デザイン力・技術力を磨く' },
];

export default function TimelineHome() {
  return (
    <div className="flex flex-col gap-0">
      <h1 className="pb-4 font-medium text-md md:text-xl text-amber-200/80">
        略歴
      </h1>
      {timelineData.map((item, index) => (
        <TimelineItem key={index} year={item.year} text={item.text} />
      ))}
    </div>
  );
}
