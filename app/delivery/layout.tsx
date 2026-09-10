import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { StaffShell } from "@/components/staff/shell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["DELIVERY"], "/delivery/orders");
  return (
    <StaffShell role={profile.role} name={profile.full_name}>
      {children}
    </StaffShell>
  );
}
