"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      expand
      richColors={false}
      icons={{
        success: <CircleCheckIcon className="size-5 text-emerald-700" />,
        info: <InfoIcon className="size-5 text-sky-700" />,
        warning: <TriangleAlertIcon className="size-5 text-amber-700" />,
        error: <OctagonXIcon className="size-5 text-red-700" />,
        loading: <Loader2Icon className="size-5 animate-spin text-primary" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast !rounded-2xl !border !px-4 !py-3.5 !shadow-[0_12px_40px_-16px_rgba(26,8,10,0.45)] !gap-3",
          title: "!text-sm !font-semibold",
          description: "!text-xs !opacity-90",
          success:
            "!bg-emerald-50 !text-emerald-950 !border-emerald-200/90 [&_[data-description]]:!text-emerald-900/75",
          error:
            "!bg-red-50 !text-red-950 !border-red-200/90 [&_[data-description]]:!text-red-900/75",
          warning:
            "!bg-amber-50 !text-amber-950 !border-amber-200/90 [&_[data-description]]:!text-amber-900/75",
          info: "!bg-sky-50 !text-sky-950 !border-sky-200/90 [&_[data-description]]:!text-sky-900/75",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
