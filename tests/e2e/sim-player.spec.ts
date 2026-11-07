import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("empty sim player renders with a non-3D path and no serious accessibility violations", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "M0 simulation foundations" })).toBeVisible();
  await expect(page.getByTestId("webgl-shell").locator("canvas")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Structured scene summary" })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter((violation) =>
      ["serious", "critical"].includes(violation.impact ?? ""),
    ),
  ).toEqual([]);
});
