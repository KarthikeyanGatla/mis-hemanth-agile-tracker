import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { projectSchema } from "@/lib/validation";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  async function create(formData: FormData) {
    "use server";
    const user = await requireUser();
    const parsed = projectSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      redirect(`/projects/new?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
    }
    if (await db.project.findUnique({ where: { key: parsed.data.key } })) {
      redirect("/projects/new?error=Project%20key%20already%20in%20use");
    }
    const project = await db.project.create({
      data: {
        ...parsed.data,
        // The creator becomes Product Owner; they can reassign roles afterwards.
        members: { create: { userId: user.id, role: "PRODUCT_OWNER" } },
      },
    });
    redirect(`/projects/${project.key}`);
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold">New project</h1>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <form action={create} className="mt-6 space-y-3">
        <input name="key" placeholder="Key (e.g. ATLAS)" required className="input" />
        <input name="name" placeholder="Project name" required className="input" />
        <textarea name="description" placeholder="Description" rows={3} className="input" />
        <button className="btn">Create</button>
      </form>
    </div>
  );
}
