export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preload" as="image" href="/images/get-started.png" />
      <link rel="preload" as="image" href="/images/onb1.png" />
      <link rel="preload" as="image" href="/images/onb2.png" />
      <link rel="preload" as="image" href="/images/onb3.png" />
      <link rel="preload" as="image" href="/images/Guardians Logo-full-white.png" />
      <link rel="preload" as="image" href="/images/Guardians Logo-word-yellow.png" />
      <div className="relative flex flex-col min-h-full max-w-md mx-auto bg-white shadow-xl overflow-hidden">
        {children}
      </div>
    </>
  );
}
