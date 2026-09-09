import { EmptyState } from "@/components/empty-state";
import { USER_ROLE_LABELS } from "@/lib/constants";
import { listStaff } from "@/lib/services/staff.service";
import { StaffCreateForm } from "@/components/admin/staff-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DataTable, StatusBadge } from "@/components/admin/ui";

export default async function AdminStaffPage() {
  const staff = await listStaff();

  return (
    <div>
      <AdminPageHeader
        eyebrow="Team"
        title="Staff"
        description="Manage admin, cashier, and delivery accounts."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        {staff.length === 0 ? (
          <EmptyState title="No staff yet" description="Create the first cashier, rider, or admin account." />
        ) : (
          <DataTable>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => (
                  <tr key={member.id}>
                    <td className="font-medium">{member.full_name}</td>
                    <td className="text-muted-foreground">{USER_ROLE_LABELS[member.role]}</td>
                    <td>
                      <StatusBadge variant={member.active ? "success" : "neutral"}>
                        {member.active ? "Active" : "Inactive"}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
        )}
        <StaffCreateForm />
      </div>
    </div>
  );
}
