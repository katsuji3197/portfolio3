interface TimelineItemProps {
  year: string;
  text: string;
}

export default function TimelineItem({ year, text }: TimelineItemProps) {
  return (
    <div className="flex gap-4 items-center">
      <div className="flex flex-col items-center">
        <div className="h-3 w-[1.5px] bg-neutral-600" />
        <div className="h-6 w-6 rounded-full border-[1.5px] border-neutral-400 flex items-center justify-center my-1">
          <div className="w-1 h-1 bg-neutral-500 rounded-full" />
        </div>
        <div className="h-3 w-[1.5px] bg-neutral-600" />
      </div>
      <div className="flex gap-2 items-center">
        <p className="text-xs lg:text-sm text-neutral-400 font-medium tracking-wider min-w-14 md:min-w-20">
          {year}
        </p>
        <p className="text-xs lg:text-sm text-neutral-200 font-medium tracking-wider">
          {text}
        </p>
      </div>
    </div>
  );
}
