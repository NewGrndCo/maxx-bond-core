import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export function ManagerHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-neutral-400">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function ManagerCard({ children }: { children: ReactNode }) {
  return (
    <Card className="border-white/10 bg-white/[0.03] text-neutral-100">
      <CardContent className="space-y-4 p-5">{children}</CardContent>
    </Card>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-neutral-300">{label}</Label>
      {children}
    </div>
  );
}

export const managerInput = "border-white/10 bg-black/40";

export function TextField(props: React.ComponentProps<typeof Input> & { label: string }) {
  const { label, className, ...rest } = props;
  return (
    <Field label={label}>
      <Input {...rest} className={`${managerInput} ${className ?? ""}`} />
    </Field>
  );
}

export function TextAreaField(props: React.ComponentProps<typeof Textarea> & { label: string }) {
  const { label, className, ...rest } = props;
  return (
    <Field label={label}>
      <Textarea {...rest} className={`${managerInput} ${className ?? ""}`} />
    </Field>
  );
}

export function Visibility({
  checked,
  onCheckedChange,
  label = "Visible",
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  label?: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-neutral-300">
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
      {label}
    </label>
  );
}

export function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      className="border-red-500/30 text-red-300 hover:bg-red-500/10"
      onClick={onClick}
    >
      Delete
    </Button>
  );
}

export async function uploadPublicFile(bucket: string, folder: string, file: File) {
  const { supabase } = await import("@/integrations/supabase/client");
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${folder}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
