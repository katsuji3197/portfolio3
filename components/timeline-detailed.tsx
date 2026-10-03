import TimelineItem from './timeline-item';
import { timelineEntries } from '@/data/timeline';

export default function TimelineDetailed() {
  return (
    <div className="flex flex-col">
      {timelineEntries.map((item, idx) => (
        <TimelineItem key={idx} year={item.year} text={item.text} />
      ))}
    </div>
  );
}
