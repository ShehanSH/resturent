import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground mt-3">That page does not exist or the order token is invalid.</p>
      <Link href="/" className="mt-6 underline">
        Back home
      </Link>
    </div>
  );
}
