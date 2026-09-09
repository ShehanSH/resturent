import { requireRole } from "@/lib/auth/session";
import { StaffShell } from "@/components/staff/shell";

export default async function CashierLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["ADMIN", "CASHIER"], "/cashier/orders");
  return (
    <StaffShell role={profile.role} name={profile.full_name}>
      {children}
    </StaffShell>
  );
}
