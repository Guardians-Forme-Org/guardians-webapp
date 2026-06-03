import { type ReactNode } from "react";
import Text from "./Text";

type Props = {
  title: string;
  action?: ReactNode;
};

export default function PageHeader({ title, action }: Props) {
  return (
    <div className="flex items-center justify-between px-5 pt-12 pb-4">
      <Text variant="display">{title}</Text>
      {action}
    </div>
  );
}
