import { Bell } from "lucide-react";
import Text from "@/components/ui/Text";

type Props = {
  name: string;
  hasNotification?: boolean;
};

export default function HomeHeader({ name, hasNotification = false }: Props) {
  return (
    <div className="flex items-center justify-between px-5 pt-14 pb-4">
      <div className="flex items-center gap-3">
        <img
          src="/images/Guardians Logo-logo.png"
          alt="Guardians logo"
          className="w-9 h-9 object-contain shrink-0"
        />
        <span className="text-2xl text-text-primary">
          Hi, <span className="font-bold">{name}</span>
        </span>
      </div>
      <button className="relative p-1" aria-label="Notifications">
        <Bell size={22} strokeWidth={1.8} className="text-text-primary" />
        {hasNotification && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border border-white" />
        )}
      </button>
    </div>
  );
}
