import { Input, Label, SubmitButton } from "@/components/ui";

/** Password change form. The action is passed in so the same form works for students, teachers and admins. */
export function PasswordForm({ action }: { action: (fd: FormData) => Promise<void> }) {
  return (
    <form action={action} className="grid gap-4 md:grid-cols-3 md:items-end">
      <div>
        <Label htmlFor="current">Current password</Label>
        <Input id="current" name="current" type="password" autoComplete="current-password" required />
      </div>
      <div>
        <Label htmlFor="next">New password</Label>
        <Input id="next" name="next" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <div>
        <Label htmlFor="confirm">Confirm new password</Label>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <div className="md:col-span-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">At least 8 characters. Use a password you do not use anywhere else.</p>
        <SubmitButton pendingText="Updating…">Update password</SubmitButton>
      </div>
    </form>
  );
}
