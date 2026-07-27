"use client";

import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateEntityNote } from "@/lib/hooks/use-entity-notes";
import { NOTE_TYPES, type FlaggableEntityType } from "@/lib/types";
import { humanize } from "@/lib/utils/format";
import { ApiError } from "@/lib/api/client";

const schema = z.object({
  note_type: z.enum(["data_error", "missing_data", "outdated", "other"]),
  note_text: z
    .string()
    .min(3, "Please describe the issue (at least 3 characters).")
    .max(4000, "Note is too long (max 4000 characters)."),
});

type FormValues = z.infer<typeof schema>;

const ENTITY_LABELS: Record<FlaggableEntityType, string> = {
  company: "company",
  material: "material",
  company_material_exposure: "company exposure",
  hs_code_material_mapping: "HS-code mapping",
  regulation: "regulation",
  risk_event: "risk event",
  facility: "facility",
  battery_chemistry: "chemistry",
};

export interface EntityFlagIssueDialogProps {
  /** Which kind of entity is being flagged. */
  entityType: FlaggableEntityType;
  /** Entity primary key (UUIDs and ints both serialized as string). */
  entityId: string;
  /**
   * Required for nested note routes:
   * - ``hs_code_material_mapping`` (parent material id)
   * - ``company_material_exposure`` (parent company id)
   */
  parentId?: string;
  /** Human-readable name shown in the dialog header (e.g. "Lithium"). */
  entityLabel?: string;
  /**
   * Optional section/context label prepended to ``note_text`` in brackets,
   * e.g. ``"[Mappings]"`` so analysts skimming notes see where it came from.
   */
  sectionLabel?: string;
  /** Custom trigger element. Defaults to a small outline "Flag Issue" button. */
  trigger?: ReactNode;
  /** Controlled open state — useful when triggering from a kebab menu item. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EntityFlagIssueDialog({
  entityType,
  entityId,
  parentId,
  entityLabel,
  sectionLabel,
  trigger,
  open: openProp,
  onOpenChange,
}: EntityFlagIssueDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = openProp != null;
  const open = isControlled ? openProp : internalOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { note_type: "data_error", note_text: "" },
  });

  const mutation = useCreateEntityNote(entityType, entityId, parentId, {
    onSuccess: () => {
      toast.success("Issue flagged", {
        description: "Your note has been recorded.",
      });
      setOpen(false);
      form.reset();
    },
    onError: (err) => {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to record note";
      toast.error("Could not flag issue", { description: msg });
    },
  });

  const onSubmit = (values: FormValues) => {
    const text = sectionLabel
      ? `[${sectionLabel}] ${values.note_text}`
      : values.note_text;
    mutation.mutate({
      note_type: values.note_type,
      note_text: text,
    });
  };

  const entityNoun = ENTITY_LABELS[entityType];
  const headerSuffix = entityLabel ? ` "${entityLabel}"` : "";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) form.reset();
      }}
    >
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : isControlled ? null : (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Flag className="h-3.5 w-3.5" />
            Flag Issue
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Flag a data-quality issue</DialogTitle>
          <DialogDescription>
            {sectionLabel
              ? `Recording a note on the "${sectionLabel}" section of this ${entityNoun}${headerSuffix}.`
              : `Recording a note on this ${entityNoun}${headerSuffix}.`}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="note_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {NOTE_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {humanize(t)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="note_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what looks wrong, missing, or outdated..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Submit
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
