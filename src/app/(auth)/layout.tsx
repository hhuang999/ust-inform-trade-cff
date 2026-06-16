export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* very subtle warm radial/gradient behind */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary-container/30 to-transparent"
      />
      <div className="relative w-full max-w-2xl">{children}</div>
    </main>
  );
}
