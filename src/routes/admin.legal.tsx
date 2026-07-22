import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ManagerCard,
  ManagerHeader,
  TextAreaField,
  TextField,
  Visibility,
} from "@/components/admin/manager-ui";

export const Route = createFileRoute("/admin/legal")({ component: LegalPage });
function LegalPage() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin-legal"],
    queryFn: async () => {
      const { data, error } = await supabase.from("legal_documents").select("*");
      if (error) throw error;
      return data;
    },
  });
  return (
    <div className="space-y-6">
      <ManagerHeader
        title="Legal"
        description="Edit the Privacy Policy and Terms displayed in footer popups."
      />
      {["privacy", "terms"].map((slug) => (
        <LegalEditor
          key={`${slug}-${data.find((x) => x.slug === slug)?.updated_at ?? "new"}`}
          slug={slug}
          row={data.find((x) => x.slug === slug)}
          onSaved={() => qc.invalidateQueries({ queryKey: ["admin-legal"] })}
        />
      ))}
    </div>
  );
}
function LegalEditor({
  slug,
  row,
  onSaved,
}: {
  slug: string;
  row: { id: string; title: string; body_md: string; is_published: boolean } | undefined;
  onSaved: () => Promise<unknown>;
}) {
  const [title, setTitle] = useState(
    row?.title ?? (slug === "privacy" ? "Privacy Policy" : "Terms of Service"),
  );
  const [body, setBody] = useState(row?.body_md ?? "");
  const [published, setPublished] = useState(row?.is_published ?? true);
  useEffect(() => {
    if (row) {
      setTitle(row.title);
      setBody(row.body_md);
      setPublished(row.is_published);
    }
  }, [row]);
  const save = async () => {
    const payload = { slug, title, body_md: body, is_published: published };
    const result = row
      ? await supabase.from("legal_documents").update(payload).eq("id", row.id)
      : await supabase.from("legal_documents").insert(payload);
    if (result.error) return toast.error(result.error.message);
    toast.success(`${title} saved`);
    await onSaved();
  };
  return (
    <ManagerCard>
      <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <TextAreaField
        label="Content"
        rows={12}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <Visibility checked={published} onCheckedChange={setPublished} label="Published" />
      <Button className="bg-amber-300 text-black" onClick={save}>
        Save document
      </Button>
    </ManagerCard>
  );
}
