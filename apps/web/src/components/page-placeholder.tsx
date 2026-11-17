import { Badge, Card } from "@wear3d/ui";
import { getTranslations } from "next-intl/server";

/** Écran squelette : sera remplacé dans la phase indiquée (PLAN.md §5). */
export async function PagePlaceholder({
  title,
  phase,
  description,
}: {
  title: string;
  phase: string;
  description?: string;
}) {
  const t = await getTranslations("placeholder");
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-foreground text-3xl font-extrabold">{title}</h1>
      <Card className="mt-6 flex flex-col items-start gap-3 p-6">
        <Badge variant="violet">{phase}</Badge>
        <p className="text-muted-foreground">{description ?? t("comingIn", { phase })}</p>
      </Card>
    </div>
  );
}
