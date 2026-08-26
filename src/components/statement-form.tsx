import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PRACTICE_OPTIONS } from "@/lib/statement";

export interface StatementFormValues {
  siteName?: string;
  siteUrl?: string;
  contactEmail?: string;
  lastReviewDate?: string;
  language?: string;
  practices?: string[];
  knownLimits?: string;
}

/**
 * Plain GET form: submitting re-renders the page with the generated draft.
 * Used by the public preview and the in-app statement page.
 */
export function StatementForm({
  values,
  action,
  submitLabel = "Generate draft",
}: {
  values: StatementFormValues;
  action?: string;
  submitLabel?: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form method="GET" action={action} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="siteName">Site or company name</Label>
          <Input id="siteName" name="siteName" required defaultValue={values.siteName ?? ""} placeholder="Nordkette Outdoor" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="siteUrl">Site URL</Label>
          <Input id="siteUrl" name="siteUrl" type="url" required defaultValue={values.siteUrl ?? ""} placeholder="https://yourshop.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contactEmail">Contact email for accessibility issues</Label>
          <Input id="contactEmail" name="contactEmail" type="email" required defaultValue={values.contactEmail ?? ""} placeholder="access@yourshop.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastReviewDate">Last review date</Label>
          <Input id="lastReviewDate" name="lastReviewDate" type="date" required defaultValue={values.lastReviewDate ?? today} />
        </div>
      </div>

      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium">Language</legend>
        <div className="flex gap-4 pt-1">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="radio" name="language" value="en" defaultChecked={values.language !== "pl"} className="size-4 accent-foreground" />
            English
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="radio" name="language" value="pl" defaultChecked={values.language === "pl"} className="size-4 accent-foreground" />
            Polski
          </label>
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">What you already do</legend>
        <p className="text-sm text-muted-foreground">Only tick what is actually true — this text goes public under your name.</p>
        <div className="grid gap-2 pt-1 sm:grid-cols-2">
          {PRACTICE_OPTIONS.map((option) => (
            <label key={option.key} className="flex cursor-pointer items-start gap-2.5 rounded-lg border bg-card p-3 text-sm leading-5 hover:bg-accent">
              <input
                type="checkbox"
                name="practices"
                value={option.key}
                defaultChecked={values.practices?.includes(option.key)}
                className="mt-0.5 size-4 shrink-0 accent-foreground"
              />
              {option.en}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="knownLimits">Known limitations (free text)</Label>
        <Textarea
          id="knownLimits"
          name="knownLimits"
          rows={3}
          defaultValue={values.knownLimits ?? ""}
          placeholder="e.g. Older product videos have no captions yet. The store locator map has no list alternative."
        />
      </div>

      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
