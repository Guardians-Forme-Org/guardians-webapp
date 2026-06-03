import { Search } from "lucide-react";

type Props = {
  placeholder?: string;
};

export default function SearchBar({ placeholder = "Find challenges and circles near you" }: Props) {
  return (
    <div className="mx-5 mb-3">
      <div className="flex items-center gap-2 bg-white shadow-sm rounded-full px-4 py-3">
        <Search size={15} className="text-text-muted shrink-0" />
        <input
          type="text"
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
        />
      </div>
    </div>
  );
}
