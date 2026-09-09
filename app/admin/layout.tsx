import { requireRole } from "@/lib/auth/session";
import { StaffShell } from "@/components/staff/shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["ADMIN"], "/admin/dashboard");
  return (
    <StaffShell role={profile.role} name={profile.full_name}>
      {children}
    </StaffShell>
  );
}
