export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-col min-h-full max-w-md mx-auto bg-white shadow-xl overflow-hidden">
      {children}
    </div>
  );
}
