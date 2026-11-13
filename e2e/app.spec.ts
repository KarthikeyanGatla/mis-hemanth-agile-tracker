import { expect, test, type Page } from "@playwright/test";

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "password123");
  await page.click("button:has-text('Sign in')");
  await expect(page).toHaveURL(/\/projects$/);
}

test("unauthenticated users are sent to login", async ({ page }) => {
  await page.goto("/projects/ATLAS");
  await expect(page).toHaveURL(/\/login/);
});

test("rejects bad credentials", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[name="email"]', "sam@example.com");
  await page.fill('input[name="password"]', "wrong-password");
  await page.click("button:has-text('Sign in')");
  await expect(page.getByText("Invalid email or password")).toBeVisible();
});

test("developers cannot see team management controls", async ({ page }) => {
  await login(page, "alex@example.com");
  await page.getByText("ATLAS · Atlas Mobile App").click();
  await expect(page.getByText("Your role: Developer")).toBeVisible();
  await expect(page.getByRole("button", { name: "Add / update" })).toHaveCount(0);
});

test("scrum master creates a backlog item", async ({ page }) => {
  await login(page, "sam@example.com");
  await page.goto("/projects/ATLAS/backlog");
  await page.fill('input[name="title"]', "E2E created story");
  await page.click("button:has-text('Add')");
  await expect(page.getByText("E2E created story")).toBeVisible();
});

test("dragging a card to another column persists", async ({ page }) => {
  await login(page, "alex@example.com");
  await page.goto("/projects/ATLAS/board");
  const card = page.getByText("Sort by price");
  const target = page.getByRole("heading", { name: /^In Progress/ });
  const from = await card.boundingBox();
  const to = await target.boundingBox();
  await page.mouse.move(from!.x + 10, from!.y + 10);
  await page.mouse.down();
  await page.mouse.move(to!.x + 20, to!.y + 120, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(800);
  await page.reload();
  const col = page
    .locator("div", { has: page.getByRole("heading", { name: /^In Progress/ }) })
    .last();
  await expect(col.getByText("Sort by price")).toBeVisible();
});

test("reports page renders charts and CSV export works", async ({ page }) => {
  await login(page, "priya@example.com");
  await page.goto("/projects/ATLAS/reports");
  await expect(page.getByText("Sprint summary")).toBeVisible();
  await expect(page.locator(".recharts-wrapper")).toHaveCount(3);
  const res = await page.request.get("/projects/ATLAS/reports/export?type=velocity");
  expect(res.headers()["content-type"]).toContain("text/csv");
  expect(await res.text()).toContain("Sprint 1,23,21");
});
