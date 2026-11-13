import Link from "next/link";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const base = `/projects/${key}`;
  return (
    <>
      <nav className="mb-6 flex gap-4 border-b border-current/15 pb-2 text-sm">
        <Link href={base}>Overview</Link>
        <Link href={`${base}/backlog`}>Backlog &amp; Sprints</Link>
        <Link href={`${base}/board`}>Board</Link>
      </nav>
      {children}
    </>
  );
}
