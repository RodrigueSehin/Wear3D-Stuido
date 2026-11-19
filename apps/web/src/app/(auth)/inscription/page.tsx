import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Créer un compte" };

export default function Page() {
  return (
    <AuthShell
      variant="signup"
      title="Créer un compte"
      subtitle="Commencez gratuitement et donnez vie à vos idées textiles."
    >
      <SignUpForm />
    </AuthShell>
  );
}
