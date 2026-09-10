import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { StaffShell } from "@/components/staff/shell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["ADMIN"], "/admin");
  return (
    <StaffShell role={profile.role} name={profile.full_name}>
      {children}
    </StaffShell>
  );
}
