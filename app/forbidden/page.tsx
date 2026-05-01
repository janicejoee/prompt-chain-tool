import { LogoutButton } from "@/components/logout-button";

export const dynamic = "force-dynamic";

export default function ForbiddenPage() {
  return (
    <main className="min-h-screen px-6 py-14">
      <section className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/90 shadow-sm">
        <div className="border-b border-amber-200/70 bg-amber-100/60 px-6 py-4">
          <h2 className="text-2xl font-semibold tracking-tight text-amber-900">Access restricted</h2>
        </div>
        <div className="space-y-2 px-6 py-6">
          <p className="text-sm text-amber-900">
          You are signed in, but your account does not have admin permissions for this tool.
          </p>
          <p className="text-sm text-amber-900">
            Ask an administrator to set <code>profiles.is_superadmin</code> or{" "}
            <code>profiles.is_matrix_admin</code> to <code>true</code>.
          </p>
          <div className="pt-2">
            <LogoutButton
              redirect="/"
              className="cursor-pointer rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-100/50"
            >
              Sign out
            </LogoutButton>
          </div>
        </div>
      </section>
    </main>
  );
}
