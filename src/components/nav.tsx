import Link from "next/link";
import { signOut } from "@/auth";

export function Nav({ name }: { name?: string | null }) {
  return (
    <header className="border-b border-current/15">
      <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
        <Link href="/projects" className="font-semibold">
          Agile Tracker
        </Link>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
          className="flex items-center gap-3 text-sm"
        >
          <span className="opacity-70">{name}</span>
          <button className="underline">Sign out</button>
        </form>
      </div>
    </header>
  );
}
