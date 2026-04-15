import { AppNav } from "@/components/AppNav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppNav />
      <main>{children}</main>
    </>
  );
}
