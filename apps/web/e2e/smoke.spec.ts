import { expect, test } from "@playwright/test";

test("la page d'accueil s'affiche", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("vêtements en 3D");
});

test("le studio est accessible sans compte", async ({ page }) => {
  await page.goto("/studio/nouveau");
  await expect(page.getByText("Studio 3D")).toBeVisible();
});
