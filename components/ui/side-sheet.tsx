"use client";

import * as React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const BASE_SIDE_SHEET_CONTENT_CLASSES =
  "right-0 left-auto top-0 h-dvh w-full max-w-xl translate-x-0 translate-y-0 overflow-x-hidden overflow-y-auto rounded-none border-l border-border p-0 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-xl";

export const SideSheet = Dialog;

export type SideSheetProps = React.ComponentProps<typeof Dialog>;
export type SideSheetContentProps = React.ComponentPropsWithoutRef<
  typeof DialogContent
>;

export const SideSheetContent = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  SideSheetContentProps
>(({ className, ...props }, ref) => (
  <DialogContent
    ref={ref}
    className={cn(BASE_SIDE_SHEET_CONTENT_CLASSES, className)}
    {...props}
  />
));

SideSheetContent.displayName = "SideSheetContent";

