import { SettingsForm } from "@/components/admin/settings-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { getRestaurantSettings } from "@/lib/services/settings.service";

export default async function AdminSettingsPage() {
  const settings = await getRestaurantSettings();
  return (
    <div>
      <AdminPageHeader
        eyebrow="Restaurant"
        title="Settings"
        description="Update contact details, hours, delivery fees, and ordering rules."
      />
      <SettingsForm settings={settings} />
    </div>
  );
}
