"use client";

import { Button, cn, Input } from "@wear3d/ui";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LayoutGrid,
  Loader2,
  Lock,
  LogIn,
  Mail,
  User,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
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
  required,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-semibold">
        {label}
        {required && <span className="text-danger"> *</span>}
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

/** Champ avec icône à gauche (maquettes Connexion / Inscription). */
function IconInput({
  icon: Icon,
  invalid,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: LucideIcon; invalid?: boolean }) {
  return (
    <div className="relative">
      <Icon
        className="text-action/70 pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2"
        aria-hidden
      />
      <Input
        {...props}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid && props.id ? `${props.id}-error` : undefined}
        className={cn("bg-surface/80 pl-11", className)}
      />
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

function Submit({
  pending,
  icon: Icon,
  children,
}: {
  pending: boolean;
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        Icon && <Icon aria-hidden />
      )}
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
      <IconInput
        icon={Lock}
        id={name}
        name={name}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        required
        invalid={invalid}
        {...(onChange ? { value, onChange: (e) => onChange(e.target.value) } : {})}
        className="pr-11"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        className="text-foreground/70 absolute right-3 top-1/2 -translate-y-1/2 rounded p-1"
      >
        {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
      </button>
    </div>
  );
}

/* Logos des fournisseurs (couleurs de marque). */
const GoogleLogo = () => (
  <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
    <path
      fill="#EA4335"
      d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.5 24.6c0-1.6-.1-3.1-.4-4.6H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.4z"
    />
    <path
      fill="#FBBC05"
      d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"
    />
  </svg>
);
const MicrosoftLogo = () => (
  <svg viewBox="0 0 23 23" className="size-5" aria-hidden>
    <path fill="#F25022" d="M1 1h10v10H1z" />
    <path fill="#7FBA00" d="M12 1h10v10H12z" />
    <path fill="#00A4EF" d="M1 12h10v10H1z" />
    <path fill="#FFB900" d="M12 12h10v10H12z" />
  </svg>
);
const AppleLogo = () => (
  <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
    <path
      fill="currentColor"
      d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
    />
  </svg>
);

const PROVIDERS = [
  { id: "google", label: "Google", logo: GoogleLogo },
  { id: "azure", label: "Microsoft", logo: MicrosoftLogo },
  { id: "apple", label: "Apple", logo: AppleLogo },
] as const;

function SocialButtons({ next, layout }: { next: string; layout: "stack" | "row" }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      <div className={layout === "row" ? "grid grid-cols-3 gap-2" : "grid gap-2"}>
        {PROVIDERS.map((p) => (
          <Button
            key={p.id}
            type="button"
            variant="outline"
            disabled={pending}
            className={cn("h-12 gap-3", layout === "stack" && "relative justify-center")}
            onClick={() =>
              start(async () => {
                const r = await signInWithProvider(p.id, next);
                if (r?.error) setError(r.error);
              })
            }
          >
            <span className={layout === "stack" ? "absolute left-4" : undefined}>
              <p.logo />
            </span>
            {layout === "stack" ? `Continuer avec ${p.label}` : p.label}
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

const Divider = ({ children = "ou continuer avec" }: { children?: ReactNode }) => (
  <div className="text-muted-foreground flex items-center gap-3 text-sm">
    <span className="bg-border h-px flex-1" /> {children} <span className="bg-border h-px flex-1" />
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
          <IconInput
            icon={Mail}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="exemple@wear3dstudio.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            invalid={Boolean(state.fieldErrors?.email)}
          />
        </Field>
        <Field label="Mot de passe" name="password" error={state.fieldErrors?.password}>
          <PasswordInput
            autoComplete="current-password"
            invalid={Boolean(state.fieldErrors?.password)}
          />
        </Field>
        <div className="flex justify-end">
          <Link href="/mot-de-passe" className="text-action text-sm font-medium hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>
        <Submit pending={pending} icon={LogIn}>
          Se connecter
        </Submit>
      </form>

      <Divider />
      <SocialButtons next={next} layout="stack" />

      <form action={magicAction} className="space-y-2">
        <input type="hidden" name="suite" value={next} />
        <input type="hidden" name="email" value={email} />
        <Button
          type="submit"
          variant="ghost"
          className="text-action w-full"
          disabled={magicPending || !email}
        >
          Recevoir un lien de connexion par e-mail
        </Button>
        <Message state={magic} />
      </form>

      <p className="text-muted-foreground text-center">
        Vous n&apos;avez pas encore de compte ?
        <br />
        <Link
          href="/inscription"
          className="text-action mt-1 inline-flex items-center gap-1.5 font-semibold hover:underline"
        >
          Créer un compte gratuitement <ArrowRight className="size-4" aria-hidden />
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
    <div className="space-y-4">
      <form action={action} className="space-y-4" noValidate>
        <Message state={state} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prénom" name="firstName" error={fe.firstName} required>
            <IconInput
              icon={User}
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              placeholder="Votre prénom"
              required
              invalid={Boolean(fe.firstName)}
            />
          </Field>
          <Field label="Nom" name="lastName" error={fe.lastName} required>
            <IconInput
              icon={User}
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              placeholder="Votre nom"
              required
              invalid={Boolean(fe.lastName)}
            />
          </Field>
        </div>
        <Field label="Adresse e-mail" name="email" error={fe.email} required>
          <IconInput
            icon={Mail}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="exemple@wear3dstudio.com"
            required
            invalid={Boolean(fe.email)}
          />
        </Field>
        <Field label="Mot de passe" name="password" error={fe.password} required>
          <PasswordInput
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            invalid={Boolean(fe.password)}
          />
          <ul
            className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs"
            aria-label="Règles du mot de passe"
          >
            {PASSWORD_RULES.map((r) => {
              const ok = r.test(password);
              return (
                <li
                  key={r.id}
                  className={cn(
                    "flex items-center gap-1.5",
                    ok ? "text-success" : "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-4 place-items-center rounded-full",
                      ok ? "bg-success text-white" : "bg-muted-foreground/50 text-white",
                    )}
                  >
                    <Check className="size-3" aria-hidden />
                  </span>
                  {r.label}
                </li>
              );
            })}
          </ul>
        </Field>
        <Field label="Profil d'utilisation" name="usage" error={fe.usage} required>
          <div className="relative">
            <LayoutGrid
              className="text-action/70 pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2"
              aria-hidden
            />
            <select
              id="usage"
              name="usage"
              defaultValue=""
              required
              className="border-border bg-surface/80 h-12 w-full rounded-md border pl-11 pr-3 text-sm"
            >
              <option value="" disabled>
                Sélectionnez votre profil
              </option>
              {USAGE_PROFILES.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </Field>
        <div className="space-y-1">
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="terms" className="accent-action mt-1 size-4" required />
            <span>
              J&apos;accepte les <u className="text-action">Conditions d&apos;utilisation</u> et la{" "}
              <u className="text-action">Politique de confidentialité</u>.
            </span>
          </label>
          {fe.terms && (
            <p role="alert" className="text-danger text-sm">
              {fe.terms}
            </p>
          )}
        </div>
        <Submit pending={pending} icon={UserPlus}>
          Créer mon compte gratuitement
        </Submit>
      </form>
      <Divider />
      <SocialButtons next="/bienvenue" layout="row" />
      <p className="text-muted-foreground text-center">
        Vous avez déjà un compte ?{" "}
        <Link
          href="/connexion"
          className="text-action inline-flex items-center gap-1.5 font-semibold hover:underline"
        >
          Se connecter <ArrowRight className="size-4" aria-hidden />
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
        <IconInput
          icon={Mail}
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="exemple@wear3dstudio.com"
          required
          invalid={Boolean(state.fieldErrors?.email)}
        />
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
