"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, FieldError, Input, Label, Notice } from "@/components/ui";
import { HOME_BY_ROLE } from "@/lib/auth";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});
type FormValues = z.infer<typeof schema>;

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    const res = await signIn("credentials", { email: values.email, password: values.password, redirect: false });
    if (!res || res.error) {
      setServerError(
        res?.error?.includes("TOO_MANY")
          ? "Too many failed attempts. Please wait 15 minutes and try again."
          : "Email or password is incorrect.",
      );
      return;
    }
    const sessionRes = await fetch("/api/auth/session", { cache: "no-store" });
    const session = (await sessionRes.json()) as { user?: { role?: keyof typeof HOME_BY_ROLE } };
    const role = session.user?.role;
    const target = callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : role ? HOME_BY_ROLE[role] : "/";
    router.replace(target);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5" aria-labelledby="login-title">
      <div>
        <h2 id="login-title" className="font-display text-3xl font-semibold text-navy-deep">Sign in</h2>
        <p className="mt-2 text-sm text-slate-600">Use the email and password issued by the school.</p>
      </div>
      {serverError && <Notice tone="error">{serverError}</Notice>}
      <div>
        <Label htmlFor="email">Email address</Label>
        <Input id="email" type="email" autoComplete="username" placeholder="you@school.ng" aria-invalid={!!errors.email} {...register("email")} />
        <FieldError message={errors.email?.message} />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" autoComplete="current-password" aria-invalid={!!errors.password} {...register("password")} />
        <FieldError message={errors.password?.message} />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
      <div className="flex justify-between text-sm">
        <a href="/forgot-password" className="focus-ring rounded font-medium text-navy hover:underline">Forgot password?</a>
        <a href="/admissions/status" className="focus-ring rounded font-medium text-navy hover:underline">Check admission status</a>
      </div>
      <p className="rounded-xl bg-sky-soft p-3 text-xs text-navy-deep">
        Demo accounts: admin@ansarruhul.demo, principal@ansarruhul.demo, accountant@ansarruhul.demo, teacher1@ansarruhul.demo, student01@ansarruhul.demo · password <strong>Demo@1234</strong>
      </p>
    </form>
  );
}
