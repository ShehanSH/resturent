import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="admin-app flex min-h-full flex-col items-center justify-center bg-[#f6f4f1] px-4 text-center">
      <div className="admin-card max-w-md px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">You cannot open this page</h1>
        <p className="text-muted-foreground mt-2 text-sm">Your staff role does not include this area.</p>
        <Link href="/auth/redirect" className="btn-admin mt-6 inline-flex">
          Go to my dashboard
        </Link>
      </div>
    </div>
  );
}
