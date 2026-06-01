import BottomNavBar from "@/components/nav/BottomNavBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-col min-h-full max-w-md mx-auto bg-white shadow-xl">
      <main className="flex-1 overflow-y-auto pb-safe-nav">{children}</main>
      <BottomNavBar />
    </div>
  );
}
