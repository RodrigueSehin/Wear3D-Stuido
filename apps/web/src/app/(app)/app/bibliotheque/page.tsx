import type { Metadata } from "next";
import { AssetLibrary } from "@/components/app/asset-library";

export const metadata: Metadata = { title: "Bibliothèque" };

export default function Page() {
  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div>
        <h1 className="text-3xl font-extrabold">Bibliothèque</h1>
        <p className="text-muted-foreground text-sm">
          Vos logos et images importés, disponibles dans tous vos designs.
        </p>
      </div>
      <AssetLibrary />
    </div>
  );
}
