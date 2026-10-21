import * as React from "react";
import { cn } from "@/lib/utils";

/* Button ---------------------------------------------------------------- */
import { buttonVariants, type ButtonProps } from "@/components/ui/button-variants";
export { buttonVariants, type ButtonProps };
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
));
Button.displayName = "Button";

/* Pending submit button for server-action forms ----------------------- */
export { SubmitButton } from "@/components/ui/SubmitButton";

/* Card ------------------------------------------------------------------ */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-navy/10 bg-white shadow-card", className)} {...props} />;
}
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1 p-5 pb-3 sm:p-6 sm:pb-3", className)} {...props} />;
}
export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("font-display text-lg font-semibold text-navy-deep", className)} {...props} />;
}
export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-2 sm:p-6 sm:pt-2", className)} {...props} />;
}

/* Form controls --------------------------------------------------------- */
export const inputClass =
  "focus-ring block w-full rounded-xl border border-navy/20 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-400 disabled:bg-slate-50";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(inputClass, className)} {...props} />
));
Input.displayName = "Input";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn(inputClass, "pr-8", className)} {...props} />
));
Select.displayName = "Select";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(inputClass, "min-h-[96px]", className)} {...props} />
));
Textarea.displayName = "Textarea";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-sm font-medium text-ink", className)} {...props} />;
}

export function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p role="alert" className="mt-1 text-sm text-red-700">{message}</p>;
}

/* Badge ----------------------------------------------------------------- */
export function Badge({ className, tone = "navy", ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: "navy" | "sky" | "green" | "amber" | "red" | "slate" }) {
  const tones = {
    navy: "bg-navy/10 text-navy",
    sky: "bg-sky-soft text-navy",
    green: "bg-emerald-50 text-emerald-800",
    amber: "bg-gold-soft text-[#7a4f0c]",
    red: "bg-red-50 text-red-800",
    slate: "bg-slate-100 text-slate-700",
  } as const;
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)} {...props} />;
}

/* Notice banner (used with ?ok= / ?err= query flashes) ------------------ */
export function Notice({ tone = "success", children }: { tone?: "success" | "error" | "info"; children: React.ReactNode }) {
  const styles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    error: "border-red-200 bg-red-50 text-red-900",
    info: "border-sky/50 bg-sky-soft text-navy-deep",
  } as const;
  return <div role="status" className={cn("rounded-xl border px-4 py-3 text-sm", styles[tone])}>{children}</div>;
}
