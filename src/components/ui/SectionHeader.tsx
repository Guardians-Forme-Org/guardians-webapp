import Link from "next/link";
import Text from "./Text";

type Props = {
  title: string;
  href?: string;
};

export default function SectionHeader({ title, href }: Props) {
  return (
    <div className="flex items-center justify-between mb-4">
      <Text variant="heading">{title}</Text>
      {href && (
        <Link href={href} className="text-sm text-[#6B7280] hover:text-[#0A0A0A] transition-colors">
          See all
        </Link>
      )}
    </div>
  );
}
