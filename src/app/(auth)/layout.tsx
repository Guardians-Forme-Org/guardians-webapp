import { AppNav } from "@/components/AppNav";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppNav />
      <main>{children}</main>
    </>
  );
}
