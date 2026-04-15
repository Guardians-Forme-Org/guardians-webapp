import Link from "next/link";

type Props = {
  section?: string;
};

export function AppNav({ section }: Props) {
  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-5xl mx-auto flex items-center justify-between h-12 px-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs font-semibold tracking-widest uppercase text-foreground/60 hover:text-foreground transition-colors"
          >
            GOTF
          </Link>
          {section && (
            <>
              <span className="text-border">/</span>
              <span className="text-xs text-muted-foreground">{section}</span>
            </>
          )}
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/circles" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Circles
          </Link>
          <Link href="/challenges" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Challenges
          </Link>
        </nav>
      </div>
    </header>
  );
}
