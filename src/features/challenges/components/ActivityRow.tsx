type Props = {
  title: string;
  date: string;
  avatarCount: number;
};

function MiniAvatarStack({ count }: { count: number }) {
  return (
    <div className="flex items-center shrink-0">
      {Array.from({ length: Math.min(count, 2) }).map((_, i) => (
        <div
          key={i}
          className={`size-8 rounded-full bg-[#d9d9d9] border-2 border-white ${i > 0 ? "-ml-4" : ""}`}
        />
      ))}
    </div>
  );
}

export default function ActivityRow({ title, date, avatarCount }: Props) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col gap-1">
        <p className="text-[18px] font-semibold text-text-primary">{title}</p>
        <p className="text-[14px] text-text-secondary">{date}</p>
      </div>
      <MiniAvatarStack count={avatarCount} />
    </div>
  );
}
