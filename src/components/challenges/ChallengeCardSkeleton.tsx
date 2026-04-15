import { Skeleton } from "@/components/ui/skeleton";

export function ChallengeCardSkeleton() {
  return (
    <div className="flex flex-col rounded-lg border border-border overflow-hidden">
      <div className="h-1.5 w-full bg-muted" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-1/3 mt-2" />
        <div className="flex gap-1 pt-2 border-t border-border">
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-4 w-12 rounded" />
          <Skeleton className="h-4 w-8 rounded" />
        </div>
      </div>
    </div>
  );
}
