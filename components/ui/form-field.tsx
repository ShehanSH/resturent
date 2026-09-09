import { cn } from "@/lib/utils";

export function FieldLabel({
  htmlFor,
  children,
  required = false,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium leading-none">
      {children}
      {required ? (
        <span className="text-destructive ml-0.5" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  );
}

export function FieldError({ message }: { message?: string | string[] | null }) {
  if (!message) return null;
  const text = Array.isArray(message) ? message[0] : message;
  if (!text) return null;
  return <p className="text-destructive text-xs font-medium">{text}</p>;
}

export function fieldMessage(
  fieldErrors: Record<string, string[]> | undefined,
  key: string,
): string | undefined {
  return fieldErrors?.[key]?.[0];
}

export function inputErrorClass(hasError: boolean, className?: string) {
  return cn(
    "admin-input",
    hasError && "border-destructive/60 focus-visible:border-destructive focus-visible:ring-destructive/20",
    className,
  );
}
