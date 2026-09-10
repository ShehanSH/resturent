import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { OptionGroupForm } from "@/components/admin/option-group-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { adminOptionHref } from "@/lib/admin-paths";
import { slugify } from "@/lib/format";
import { getOptionGroupForAdmin } from "@/lib/services/catalog.service";
import { isUuid } from "@/lib/validations/common";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const group = await getOptionGroupForAdmin(slug);
  return {
    title: group ? `Edit ${group.name}` : "Edit option group",
    robots: { index: false, follow: false },
  };
}

export default async function EditOptionGroupPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const group = await getOptionGroupForAdmin(slug);
  if (!group) notFound();
  const pretty = slugify(group.name);
  if (isUuid(slug) && pretty && pretty !== "new") {
    redirect(adminOptionHref(group.name, group.id));
  }

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
