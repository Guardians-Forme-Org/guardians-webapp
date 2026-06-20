import type { CircleCommunicationChannel } from "@/lib/types/circles";

type Props = {
  channels: CircleCommunicationChannel[] | null | undefined;
  className?: string;
};

export default function JoinConversationButton({ channels, className }: Props) {
  const channel = channels?.[0];
  if (!channel) return null;

  return (
    <a
      href={channel.url}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ??
        "px-5 h-12 bg-[#1a1a1a] text-white text-base font-semibold rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.15)] flex items-center justify-center"
      }
    >
      Join Conversation
    </a>
  );
}
