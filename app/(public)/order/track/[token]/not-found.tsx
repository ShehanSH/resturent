import Link from "next/link";

export default function TrackingNotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-semibold">Order not found</h1>
      <p className="text-muted-foreground mt-3">That tracking link is invalid or has expired.</p>
      <Link href="/" className="mt-6 underline">
        Back home
      </Link>
    </div>
  );
}
