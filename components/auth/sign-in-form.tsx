"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useClerk, useSignIn } from "@clerk/nextjs";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Studio sign-in: email and password, submitted together.
 *
 * Requires Password to be enabled on the Clerk instance
 * (Configure → Email, phone, username → Password).
 */

/** Clerk expects the bare digits — pasted codes often carry spaces. */
function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

type ClerkishError = {
  longMessage?: string;
  message?: string;
  code?: string;
};

/**
 * Clerk's user-facing text is `longMessage`, but plenty of errors only carry
 * `message` and `code`. Falling back to the generic string in that case threw
 * away the one piece of information needed to act on the failure, so the code
 * is appended whenever no `longMessage` is supplied.
 */
function messageFrom(error: ClerkishError | null, fallback: string): string {
  if (!error) return fallback;

  const long = error.longMessage?.trim();
  if (long) return long;

  const short = error.message?.trim();
  const code = error.code?.trim();

  if (short && code) return `${short} (${code})`;
  if (short) return short;
  if (code) return `${fallback} (${code})`;
  return fallback;
}

/** Turns a non-complete sign-in status into something actionable. */
function describeStatus(status: string | null | undefined): string {
  switch (status) {
    case "needs_client_trust":
    case "needs_second_factor":
      return "This device needs to be verified before you can sign in.";
    case "needs_new_password":
      return "This password has expired and must be reset before signing in.";
    case "needs_identifier":
    case "needs_first_factor":
      return "That email or password wasn't right.";
    default:
      // Name the status: without it an unexpected state is undebuggable.
      return `Sign-in didn't complete${status ? ` (status: ${status})` : ""}. Please try again.`;
  }
}

export function SignInForm({ redirectTo }: { redirectTo: string }) {
  const { signIn } = useSignIn();
  const clerk = useClerk();
  const router = useRouter();

  const [step, setStep] = React.useState<"credentials" | "code">("credentials");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  // Clerk rate-limits code sends; a visible cooldown stops a repeated tap
  // from turning into "we couldn't send another code".
  const [cooldown, setCooldown] = React.useState(0);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  const ready = Boolean(signIn);
  const canSubmit = ready && !busy && email.trim().length > 0 && password.length > 0;

  /** Activates the freshly created session and leaves the sign-in page. */
  async function complete() {
    const { error } = await signIn!.finalize();
    if (error) {
      setError(messageFrom(error, "We couldn't complete sign-in. Please try again."));
      return;
    }
    router.push(redirectTo);
  }

  /** Second step: the emailed device-trust code. */
  async function onSubmitCode(event: React.FormEvent) {
    event.preventDefault();
    if (!signIn) return;

    setBusy(true);
    setError(null);

    try {
      // Codes are often pasted with spaces; `.trim()` alone leaves interior
      // whitespace in place and Clerk then rejects a perfectly good code.
      const attempt = await signIn.mfa.verifyEmailCode({ code: digitsOnly(code) });
      if (attempt.error) {
        setError(messageFrom(attempt.error, "That code wasn't right. Try again."));
        return;
      }

      if (signIn.status !== "complete" || !signIn.createdSessionId) {
        setError(describeStatus(signIn.status));
        return;
      }

      await complete();
    } catch (caught) {
      console.error("Verification failed:", caught);
      setError(
        caught instanceof Error && caught.message
          ? caught.message
          : "We couldn't verify that code. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  async function resendCode() {
    if (!signIn || cooldown > 0) return;
    setBusy(true);
    setError(null);
    try {
      const { error } = await signIn.mfa.sendEmailCode();
      if (error) {
        setError(messageFrom(error, "We couldn't send another code."));
        return;
      }
      setCode("");
      setCooldown(30);
    } catch (caught) {
      console.error("Resend failed:", caught);
      setError(
        caught instanceof Error && caught.message
          ? caught.message
          : "We couldn't send another code."
      );
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!signIn) return;

    setBusy(true);
    setError(null);

    try {
      // Clear any half-finished attempt still held in local state, otherwise a
      // previous flow can leave the resource in a state where `password()`
      // succeeds but never produces a session.
      await signIn.reset();

      const attempt = await signIn.password({
        identifier: email.trim(),
        password,
      });

      if (attempt.error) {
        // Clerk deliberately doesn't reveal which half was wrong.
        setError(messageFrom(attempt.error, "That email or password wasn't right."));
        return;
      }

      // Clerk declines to mint a second session for an identifier that already
      // has one. That is a success, not a failure — adopt the session we have.
      const existing = signIn.existingSession?.sessionId;
      if (existing) {
        await clerk.setActive({ session: existing });
        router.push(redirectTo);
        return;
      }

      // Device Trust: a new device has to clear a second factor before Clerk
      // will issue a session. Email is the factor this instance offers.
      if (
        signIn.status === "needs_client_trust" ||
        signIn.status === "needs_second_factor"
      ) {
        const sent = await signIn.mfa.sendEmailCode();
        if (sent.error) {
          setError(messageFrom(sent.error, "We couldn't send a verification code."));
          return;
        }
        setCooldown(30);
        setStep("code");
        return;
      }

      if (signIn.status !== "complete" || !signIn.createdSessionId) {
        setError(describeStatus(signIn.status));
        return;
      }

      await complete();
    } catch (caught) {
      // Never let a thrown Clerk error surface as a Next.js runtime overlay.
      console.error("Sign-in failed:", caught);
      setError(
        caught instanceof Error && caught.message
          ? caught.message
          : "We couldn't complete sign-in. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  if (step === "code") {
    return (
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8 shadow-soft">
        <h1 className="font-serif text-2xl font-medium text-navy">Verify this device</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          You&apos;re signing in from a new device. We sent a code to {email}.
        </p>

        {error ? (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm leading-relaxed text-red-700"
          >
            {error}
          </p>
        ) : null}

        <form onSubmit={onSubmitCode} noValidate className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="code">Verification code</Label>
            <Input
              id="code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              required
              disabled={busy}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="123456"
              className="tracking-[0.3em]"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            loading={busy}
            disabled={busy || digitsOnly(code).length === 0}
          >
            {busy ? "Verifying..." : "Verify and sign in"}
          </Button>

          <button
            type="button"
            onClick={resendCode}
            disabled={busy || cooldown > 0}
            className="w-full text-sm text-royal underline-offset-4 hover:underline disabled:opacity-60 disabled:no-underline"
          >
            {cooldown > 0 ? `Send another code in ${cooldown}s` : "Send another code"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8 shadow-soft">
      <h1 className="font-serif text-2xl font-medium text-navy">Sign in</h1>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">
        Access the Mabs Studio dashboard.
      </p>

      {error ? (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm leading-relaxed text-red-700"
        >
          {error}
        </p>
      ) : null}

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            required
            disabled={busy}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <PasswordField
          value={password}
          disabled={busy}
          onChange={setPassword}
        />

        <Button type="submit" className="w-full" loading={busy} disabled={!canSubmit}>
          {busy ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </div>
  );
}

/**
 * Password field with a reveal toggle.
 *
 * The button sits inside the field, so the input reserves right padding for it
 * and the masked dots get a little tracking — otherwise they crowd together and
 * read as one blob.
 */
function PasswordField({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="space-y-1.5">
      <Label htmlFor="password">Password</Label>
      <div className="relative">
        <Input
          id="password"
          name="password"
          type={visible ? "text" : "password"}
          autoComplete="current-password"
          required
          disabled={disabled}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="••••••••"
          className={cn("pr-12", !visible && value.length > 0 && "tracking-[0.2em]")}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition-colors hover:bg-paper hover:text-navy disabled:opacity-50"
        >
          {visible ? (
            <EyeOff aria-hidden="true" className="size-4" />
          ) : (
            <Eye aria-hidden="true" className="size-4" />
          )}
        </button>
      </div>
    </div>
  );
}
