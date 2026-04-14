import Link from "next/link";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="px-4 py-3 border-b">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Home
        </Link>
      </header>
      {children}
    </>
  );
}
