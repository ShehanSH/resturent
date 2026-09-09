"use client";

import { whatsappHref } from "@/lib/brand";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";

export function WhatsAppFab({ number }: { number: string | null }) {
  const { itemCount } = useCart();
  if (!number) return null;
  const href = whatsappHref(number);
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "fixed right-4 z-50 flex items-center gap-2 rounded-full bg-white py-1.5 pr-1.5 pl-1.5 shadow-[0_10px_28px_-10px_rgba(90,18,28,0.45)] ring-1 ring-black/[0.08] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-12px_rgba(90,18,28,0.5)] md:pr-3.5",
        itemCount > 0
          ? "bottom-[calc(5.75rem+env(safe-area-inset-bottom))] md:bottom-6"
          : "bottom-[max(1.25rem,env(safe-area-inset-bottom))] md:bottom-6",
      )}
      aria-label="Chat with us on WhatsApp"
    >
      <span className="inline-flex size-11 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--primary),white_88%)] text-primary">
        <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden>
          <path d="M20.5 3.5A11 11 0 0 0 2.1 17.1L1 23l6.1-1.1A11 11 0 0 0 12 23a11 11 0 0 0 8.5-19.5ZM12 21a9 9 0 0 1-4.6-1.3l-.3-.2-3.6.7.7-3.5-.2-.3A9 9 0 1 1 12 21Zm5-6.7c-.3-.1-1.6-.8-1.8-.9s-.4-.1-.6.1-.7.9-.8 1-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.4-.5.1-.2a.5.5 0 0 0 0-.5c0-.1-.6-1.5-.8-2s-.4-.5-.6-.5h-.5a1 1 0 0 0-.7.3 2.9 2.9 0 0 0-.9 2.2 5 5 0 0 0 1.1 2.7 11.5 11.5 0 0 0 4.4 3.9 15 15 0 0 0 1.5.5 3.6 3.6 0 0 0 1.6.1 2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.6-.3Z" />
        </svg>
      </span>
      <span className="hidden pr-1 text-sm font-semibold tracking-wide text-primary md:inline">Chat</span>
    </a>
  );
}
