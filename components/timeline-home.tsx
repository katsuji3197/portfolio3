import TimelineItem from './timeline-item';
import { timelineEntries } from '@/data/timeline';

export default function TimelineHome() {
  return (
    <div className="flex flex-col gap-0">
      <h1 className="pb-4 font-medium text-md md:text-xl text-amber-200/80">
        略歴
      </h1>
      {timelineEntries.map((item, index) => (
        <TimelineItem key={index} year={item.year} text={item.text} />
      ))}
    </div>
  );
}
