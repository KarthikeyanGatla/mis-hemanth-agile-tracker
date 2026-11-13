import Link from "next/link";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { signIn } from "@/auth";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validation";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  async function register(formData: FormData) {
    "use server";
    const parsed = registerSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      redirect(`/register?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
    }
    const { name, email, password } = parsed.data;
    if (await db.user.findUnique({ where: { email } })) {
      redirect("/register?error=Email%20already%20registered");
    }
    await db.user.create({ data: { name, email, passwordHash: await bcrypt.hash(password, 10) } });
    await signIn("credentials", { email, password, redirectTo: "/projects" });
  }

  return (
    <main className="mx-auto max-w-sm p-8">
      <h1 className="text-2xl font-semibold">Create account</h1>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <form action={register} className="mt-6 space-y-3">
        <input name="name" placeholder="Full name" required className="input" />
        <input name="email" type="email" placeholder="Email" required className="input" />
        <input
          name="password"
          type="password"
          placeholder="Password (8+ chars)"
          required
          className="input"
        />
        <button className="btn w-full">Register</button>
      </form>
      <p className="mt-4 text-sm">
        Have an account?{" "}
        <Link href="/login" className="underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
