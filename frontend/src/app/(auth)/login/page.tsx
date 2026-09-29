"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { useLogin } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/authStore";
import { requiredEmail } from "@/lib/validation";

const schema = z.object({
  email: requiredEmail,
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  // Redirect a visitor who is already signed in; a fresh login is handled in useLogin.onSuccess.
  useEffect(() => {
    if (status === "authenticated" && login.isIdle) router.replace("/dashboard");
  }, [status, login.isIdle, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-[var(--radius-card)] border border-border bg-surface p-8 shadow-[var(--shadow-card)]">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src="/logo.png" alt="PhysioDesk" width={48} height={48} className="rounded-xl" priority />
          <h1 className="mt-4 font-display text-2xl font-semibold">Welcome back</h1>
          <p className="mt-1 text-sm text-muted">Sign in to your PhysioDesk account</p>
        </div>

        <form onSubmit={handleSubmit((values) => login.mutate(values))} className="flex flex-col gap-4" noValidate>
          <Input
            label="Email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@physiodesk.com"
            icon={<Mail className="size-4" />}
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            icon={<Lock className="size-4" />}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="flex items-center rounded transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            }
            error={errors.password?.message}
            {...register("password")}
          />
          <Button type="submit" className="mt-2 w-full" loading={login.isPending}>
            Sign in
          </Button>
        </form>

        <div className="mt-6 space-y-1 text-center text-xs text-muted">
          <p className="font-medium text-foreground">Demo accounts</p>
          <p>Admin — admin@physiodesk.com / Admin@123</p>
          <p>Staff — staff@physiodesk.com / Staff@123</p>
        </div>
        <Link
          href="/design-system"
          className="mt-3 block text-center text-xs font-medium text-primary hover:underline"
        >
          View the design system
        </Link>
      </div>
    </main>
  );
}
