import type { Metadata } from "next";
import { AccountSettings } from "@/components/app/account-settings";

export const metadata: Metadata = { title: "Paramètres" };

export default function Page() {
  return (
    <div className="space-y-5 p-4 sm:p-6">
      <h1 className="text-3xl font-extrabold">Paramètres</h1>
      <AccountSettings />
    </div>
  );
}
