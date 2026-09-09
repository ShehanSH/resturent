import { OptionGroupForm } from "@/components/admin/option-group-form";
import { AdminPageHeader } from "@/components/admin/page-header";

export default function NewOptionGroupPage() {
  return (
    <div>
      <AdminPageHeader
        eyebrow="Menu"
        title="New option group"
        description="Define a set of choices, such as Drink size with Regular included and Large + extra price."
        backHref="/admin/options"
      />
      <OptionGroupForm />
    </div>
  );
}
