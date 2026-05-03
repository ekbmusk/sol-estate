// Root layout — html/body provided by [locale]/layout.tsx.
// This pass-through is required so Next.js has a root layout while
// the locale layout owns the document shell.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
