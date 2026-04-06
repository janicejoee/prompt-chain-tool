import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-white px-6 py-10">
      <div className="mx-auto max-w-xl rounded-lg border border-amber-200 bg-amber-50 p-6">
        <h2 className="text-xl font-semibold text-amber-900">Access restricted</h2>
        <p className="mt-2 text-sm text-amber-900">
          You are signed in, but your account does not have admin permissions for this tool.
        </p>
        <p className="mt-1 text-sm text-amber-900">
          Ask an administrator to set <code>profiles.is_superadmin</code> or{" "}
          <code>profiles.is_matrix_admin</code> to <code>true</code>.
        </p>
        <div className="mt-4 flex gap-2">
          <Link
            href="/auth/logout?redirect=/"
            className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm"
          >
            Sign out
          </Link>
        </div>
      </div>
    </div>
  );
}
