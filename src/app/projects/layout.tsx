import { Nav } from "@/components/nav";
import { requireUser } from "@/lib/session";

export default async function ProjectsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <>
      <Nav name={user.name} />
      <div className="mx-auto max-w-5xl p-6">{children}</div>
    </>
  );
}
