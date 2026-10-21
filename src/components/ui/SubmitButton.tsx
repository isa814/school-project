"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import { buttonVariants, type ButtonProps } from "@/components/ui/button-variants";

/** Submit button that shows pendingText and disables itself while its parent form is submitting. */
export function SubmitButton({ children, pendingText = "Saving…", variant, size, className, disabled, ...props }: ButtonProps & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {pending ? pendingText : children}
    </button>
  );
}
