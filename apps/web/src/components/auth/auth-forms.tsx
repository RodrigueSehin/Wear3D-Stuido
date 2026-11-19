"use client";

import { Button, cn, Input } from "@wear3d/ui";
import { Check, Eye, EyeOff, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useActionState, useState, useTransition, type ReactNode } from "react";
import {
  requestPasswordReset,
  sendMagicLink,
  signIn,
  signInWithProvider,
  signUp,
} from "@/lib/auth/actions";
import { PASSWORD_RULES, USAGE_PROFILES, type FormState } from "@/lib/auth/schemas";

const initial: FormState = {};

function Field({
  label,
  name,
  error,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${name}-error`} role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}
    </div>
  );
}

function Message({ state }: { state: FormState }) {
  if (state.error)
    return (
      <p role="alert" className="bg-danger/10 text-danger rounded-lg px-3 py-2 text-sm">
        {state.error}
      </p>
    );
  if (state.ok)
    return (
      <p role="status" className="bg-success-soft text-success rounded-lg px-3 py-2 text-sm">
        {state.ok}
      </p>
    );
  return null;
}

function Submit({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </Button>
  );
}

function PasswordInput({
  name = "password",
  value,
  onChange,
  autoComplete,
  invalid,
}: {
  name?: string;
  value?: string;
  onChange?: (v: string) => void;
  autoComplete: string;
  invalid?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={name}
        name={name}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        required
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${name}-error` : undefined}
        {...(onChange ? { value, onChange: (e) => onChange(e.target.value) } : {})}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        className="text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 rounded p-1"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

const PROVIDERS = [
  { id: "google", label: "Google" },
  { id: "azure", label: "Microsoft" },
  { id: "apple", label: "Apple" },
] as const;

function SocialButtons({ next }: { next: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {PROVIDERS.map((p) => (
          <Button
            key={p.id}
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await signInWithProvider(p.id, next);
                if (r?.error) setError(r.error);
              })
            }
          >
            {p.label}
          </Button>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}
    </div>
  );
}

const Divider = () => (
  <div className="text-muted-foreground flex items-center gap-3 text-xs uppercase">
    <span className="bg-border h-px flex-1" /> ou <span className="bg-border h-px flex-1" />
  </div>
);

export function LoginForm({ next, linkError }: { next: string; linkError?: boolean }) {
  const [state, action, pending] = useActionState(signIn, initial);
  const [magic, magicAction, magicPending] = useActionState(sendMagicLink, initial);
  const [email, setEmail] = useState("");
  return (
    <div className="space-y-5">
      <form action={action} className="space-y-4" noValidate>
        <input type="hidden" name="suite" value={next} />
        {linkError && (
          <p role="alert" className="bg-danger/10 text-danger rounded-lg px-3 py-2 text-sm">
            Ce lien n&apos;est plus valide. Demandez-en un nouveau.
          </p>
        )}
        <Message state={state} />
        <Field label="Adresse e-mail" name="email" error={state.fieldErrors?.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(state.fieldErrors?.email) || undefined}
          />
        </Field>
        <Field label="Mot de passe" name="password" error={state.fieldErrors?.password}>
          <PasswordInput
            autoComplete="current-password"
            invalid={Boolean(state.fieldErrors?.password)}
          />
        </Field>
        <div className="flex justify-end">
          <Link href="/mot-de-passe" className="text-action text-sm hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>
        <Submit pending={pending}>Se connecter</Submit>
      </form>

      <Divider />
      <form action={magicAction} className="space-y-2">
        <input type="hidden" name="suite" value={next} />
        <input type="hidden" name="email" value={email} />
        <Button
          type="submit"
          variant="outline"
          className="w-full"
          disabled={magicPending || !email}
        >
          Recevoir un lien de connexion par e-mail
        </Button>
        <Message state={magic} />
      </form>
      <SocialButtons next={next} />

      <p className="text-muted-foreground text-center text-sm">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="text-action font-medium hover:underline">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, initial);
  const [password, setPassword] = useState("");
  const fe = state.fieldErrors ?? {};
  return (
    <div className="space-y-5">
      <form action={action} className="space-y-4" noValidate>
        <Message state={state} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prénom" name="firstName" error={fe.firstName}>
            <Input id="firstName" name="firstName" autoComplete="given-name" required />
          </Field>
          <Field label="Nom" name="lastName" error={fe.lastName}>
            <Input id="lastName" name="lastName" autoComplete="family-name" required />
          </Field>
        </div>
        <Field label="Adresse e-mail" name="email" error={fe.email}>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Mot de passe" name="password" error={fe.password}>
          <PasswordInput
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            invalid={Boolean(fe.password)}
          />
          <ul className="mt-2 space-y-1 text-sm" aria-label="Règles du mot de passe">
            {PASSWORD_RULES.map((r) => {
              const ok = r.test(password);
              return (
                <li
                  key={r.id}
                  className={cn(
                    "flex items-center gap-2",
                    ok ? "text-success" : "text-muted-foreground",
                  )}
                >
                  {ok ? (
                    <Check className="size-4" aria-hidden />
                  ) : (
                    <X className="size-4" aria-hidden />
                  )}
                  {r.label}
                </li>
              );
            })}
          </ul>
        </Field>
        <Field label="Profil d'utilisation" name="usage" error={fe.usage}>
          <select
            id="usage"
            name="usage"
            defaultValue="individual"
            className="border-border bg-surface h-10 w-full rounded-lg border px-3 text-sm"
          >
            {USAGE_PROFILES.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </Field>
        <div className="space-y-1">
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="terms" className="mt-1" required />
            <span>
              J&apos;accepte les conditions d&apos;utilisation et la politique de confidentialité.
            </span>
          </label>
          {fe.terms && (
            <p role="alert" className="text-danger text-sm">
              {fe.terms}
            </p>
          )}
        </div>
        <Submit pending={pending}>Créer mon compte</Submit>
      </form>
      <Divider />
      <SocialButtons next="/bienvenue" />
      <p className="text-muted-foreground text-center text-sm">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="text-action font-medium hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, initial);
  return (
    <form action={action} className="space-y-4" noValidate>
      <Message state={state} />
      <Field label="Adresse e-mail" name="email" error={state.fieldErrors?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Submit pending={pending}>Envoyer le lien</Submit>
      <p className="text-muted-foreground text-center text-sm">
        <Link href="/connexion" className="text-action font-medium hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </form>
  );
}
