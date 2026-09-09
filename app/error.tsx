"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="admin-app flex min-h-full flex-col items-center justify-center bg-[#f6f4f1] px-4 text-center">
      <div className="admin-card max-w-md px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Please try again. If this keeps happening, contact the restaurant.
        </p>
        <button type="button" className="btn-admin mt-6" onClick={() => reset()}>
          Try again
        </button>
      </div>
    </div>
  );
}
