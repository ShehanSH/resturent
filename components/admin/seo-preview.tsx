import { FormSection } from "@/components/admin/ui";
import { FieldLabel } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function SeoPreview({ title, description }: { title: string; description: string }) {
  return (
    <FormSection title="SEO" description="Title and description update automatically from the details above.">
      <div className="admin-field">
        <FieldLabel htmlFor="seo_title">SEO title</FieldLabel>
        <Input
          id="seo_title"
          readOnly
          value={title}
          placeholder="Add a name to generate a search title"
          className="admin-input bg-muted/40"
        />
      </div>
      <div className="admin-field">
        <FieldLabel htmlFor="seo_description">SEO description</FieldLabel>
        <Textarea
          id="seo_description"
          readOnly
          value={description}
          placeholder="A search description will appear as you add details."
          className="min-h-24 rounded-lg bg-muted/40"
        />
      </div>
    </FormSection>
  );
}
