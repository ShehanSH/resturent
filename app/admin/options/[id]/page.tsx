import { notFound } from "next/navigation";

import { OptionGroupForm } from "@/components/admin/option-group-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { getOptionGroupForAdmin } from "@/lib/services/catalog.service";

export default async function EditOptionGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const group = await getOptionGroupForAdmin(id);
  if (!group) notFound();

  return (
    <div>
      <AdminPageHeader
        eyebrow="Menu"
        title="Edit option group"
        description={`Update choices and extra prices for “${group.name}”.`}
        backHref="/admin/options"
      />
      <OptionGroupForm group={group} />
    </div>
  );
}
