import Link from "next/link";
import { Pencil } from "lucide-react";

import { deleteOptionGroupAction } from "@/app/actions/catalog";
import { AdminDeleteButton } from "@/components/admin/delete-button";
import { AdminPageHeader, AdminPrimaryLink } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/ui";
import { EmptyState } from "@/components/empty-state";
import { adminOptionHref } from "@/lib/admin-paths";
import { formatPriceAdjustment } from "@/lib/format";
import { listOptionGroups } from "@/lib/services/catalog.service";
import { getRestaurantSettings } from "@/lib/services/settings.service";

export default async function AdminOptionsPage() {
  const [settings, groups] = await Promise.all([getRestaurantSettings(), listOptionGroups()]);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Menu"
        title="Item options"
        description="Create sizes, spice levels, and toppings, then attach them to dishes."
        action={<AdminPrimaryLink href="/admin/options/new">Add option group</AdminPrimaryLink>}
      />
      {groups.length === 0 ? (
        <EmptyState
          title="No option groups yet"
          description="Add groups like Drink size or Extra toppings, then turn them on for each dish."
          action={<AdminPrimaryLink href="/admin/options/new">Add option group</AdminPrimaryLink>}
        />
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <section key={group.id} className="admin-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold tracking-tight">{group.name}</h2>
                    <StatusBadge variant={group.is_required ? "brand" : "neutral"}>
                      {group.is_required ? "Required" : "Optional"}
                    </StatusBadge>
                    <StatusBadge variant={group.selection_type === "SINGLE" ? "info" : "success"}>
                      {group.selection_type === "SINGLE" ? "One choice" : "Several choices"}
                    </StatusBadge>
                    {group.is_active ? null : <StatusBadge variant="warning">Hidden</StatusBadge>}
                  </div>
                  {group.description ? (
                    <p className="text-muted-foreground mt-1 text-sm">{group.description}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={adminOptionHref(group.name, group.id)} className="btn-admin-outline h-9 px-3 text-xs">
                    <Pencil className="size-3.5" />
                    Edit
                  </Link>
                  <AdminDeleteButton
                    id={group.id}
                    label="Option group"
                    name={group.name}
                    description="It will be removed from every dish that uses it."
                    action={deleteOptionGroupAction}
                  />
                </div>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-muted-foreground pb-2 text-left text-xs font-medium">Choice</th>
                      <th className="text-muted-foreground pb-2 text-left text-xs font-medium">Extra price</th>
                      <th className="text-muted-foreground pb-2 text-left text-xs font-medium">Default</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.options.map((option) => (
                      <tr key={option.id} className="border-t border-border/70">
                        <td className="py-2.5 font-medium">{option.name}</td>
                        <td className="py-2.5">{formatPriceAdjustment(option.price_adjustment, settings)}</td>
                        <td className="text-muted-foreground py-2.5">{option.is_default ? "Yes" : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
