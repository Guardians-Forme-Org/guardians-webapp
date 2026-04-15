import { AppNav } from "@/components/AppNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppNav section="Admin" />
      <main>{children}</main>
    </>
  );
}
