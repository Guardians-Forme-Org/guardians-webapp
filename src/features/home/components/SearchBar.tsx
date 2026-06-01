import { Search } from "lucide-react";

type Props = {
  placeholder?: string;
};

export default function SearchBar({ placeholder = "Find challenges and circles near you" }: Props) {
  return (
    <div className="mx-5 mb-3">
      <div className="flex items-center gap-2 bg-[#F7F7F7] rounded-full px-4 py-3">
        <Search size={15} className="text-[#9CA3AF] shrink-0" />
        <input
          type="text"
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-[#0A0A0A] placeholder:text-[#9CA3AF] outline-none"
        />
      </div>
    </div>
  );
}
