import { toast } from "sonner";

export const REQUIRED_FIELDS_MESSAGE = "Please fill required fields";

function hasFieldErrors(fieldErrors?: Record<string, string[]>) {
  return Boolean(fieldErrors && Object.keys(fieldErrors).length > 0);
}

/** Consistent success / error toasts across the whole app. */
export const notify = {
  success(message: string, description?: string) {
    toast.success(message, {
      description,
      duration: 2800,
      className: "toast-success",
    });
  },
  error(message: string) {
    toast.error(message, {
      duration: 4500,
      className: "toast-error",
    });
  },
  formError(result: { error: string; fieldErrors?: Record<string, string[]> }) {
    if (hasFieldErrors(result.fieldErrors)) {
      const first = Object.values(result.fieldErrors ?? {}).flat()[0];
      toast.error(first || REQUIRED_FIELDS_MESSAGE, {
        duration: 4500,
        className: "toast-error",
      });
      return;
    }
    toast.error(result.error, {
      duration: 4500,
      className: "toast-error",
    });
  },
};
