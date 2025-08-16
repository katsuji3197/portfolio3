import TimelineItem from './timeline-item';

// タイムラインデータ
const timelineData = [
  { year: '2003年', text: '石川県珠洲市生まれ' },
  // 他のタイムラインアイテムもここに追加可能
];

export default function Timeline() {
  return (
    <div className="flex flex-col gap-0">
      {timelineData.map((item, index) => (
        <TimelineItem key={index} year={item.year} text={item.text} />
      ))}
    </div>
  );
}
