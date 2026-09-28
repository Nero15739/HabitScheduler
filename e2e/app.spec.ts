import { expect, test, type Page } from "@playwright/test";

const stamp = Date.now();
const email = `e2e-${stamp}@example.com`;
const password = "correct-horse-battery";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/$/);
}

test.describe.configure({ mode: "serial" });

test("register, create habits, complete one, see it everywhere", async ({ page }, testInfo) => {
  const shots = `${testInfo.outputDir}/../../screenshots/${testInfo.project.name}`;

  // Register (first run creates the admin; later runs create a member)
  await page.goto("/register");
  await page.getByLabel("Name").fill("E2E Tester");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/\?welcome=1/);
  await expect(page.getByText("Welcome to HabitScheduler")).toBeVisible();

  // Create a habit via quick add
  await page.goto("/habits?new=1");
  await page.getByPlaceholder(/Read 10 pages every weekday/).fill("Meditate every day at 6:30am after I brush my teeth");
  await page.getByRole("button", { name: "Use" }).click();
  await expect(page.getByLabel("Name")).toHaveValue("Meditate");
  await page.getByRole("button", { name: "Create habit" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByRole("link", { name: /Meditate/ }).first()).toBeVisible();

  // Second habit from a template (weekly)
  await page.getByRole("button", { name: "New Habit" }).click();
  await page.getByRole("button", { name: /Gym/ }).click();
  await expect(page.getByLabel("Name")).toHaveValue("Gym");
  await page.getByRole("button", { name: "Create habit" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();

  // Complete Meditate for today from the grid
  const todayCell = page.getByRole("button", { name: /^Meditate \d+$/ }).filter({ hasNot: page.locator("[disabled]") });
  const cells = await page.getByRole("button", { name: /^Meditate \d+$/ }).all();
  let clicked = false;
  for (const c of cells.reverse()) {
    if (await c.isEnabled()) {
      await c.click();
      clicked = true;
      break;
    }
  }
  expect(clicked).toBe(true);
  void todayCell;
  await expect(page.getByRole("button", { name: /^Meditate \d+$/, pressed: true })).toHaveCount(1);
  await page.screenshot({ path: `${shots}/habits.png`, fullPage: true });

  // Weekly tab shows Gym
  await page.getByRole("tab", { name: "Weekly" }).click();
  await expect(page.getByRole("link", { name: /Gym/ }).first()).toBeVisible();

  // Today shows the streak + done state
  await page.goto("/");
  await expect(page.getByText("1/2 habits done")).toBeVisible();
  await page.getByLabel("New task").fill("Buy running shoes");
  await page.getByLabel("New task").press("Enter");
  await expect(page.getByText("Buy running shoes")).toBeVisible();
  await page.screenshot({ path: `${shots}/today.png`, fullPage: true });

  // Tasks board
  await page.goto("/tasks");
  await expect(page.getByText("Buy running shoes")).toBeVisible();
  await page.screenshot({ path: `${shots}/tasks.png`, fullPage: true });

  // Goals
  await page.goto("/goals");
  await page.getByRole("button", { name: "New goal" }).click();
  await page.getByLabel("Goal", { exact: true }).fill("Meditate 100 days in a row");
  await page.getByRole("button", { name: /Meditate/ }).click();
  await page.getByPlaceholder("Run 5k without stopping").fill("First 7-day streak");
  await page.getByPlaceholder("Run 5k without stopping").press("Enter");
  await page.getByRole("button", { name: "Create goal" }).click();
  await expect(page.getByRole("heading", { name: "Meditate 100 days in a row" })).toBeVisible();
  await page.getByRole("button", { name: "Complete milestone" }).click();
  await expect(page.getByText("1/1 milestones")).toBeVisible();
  await page.screenshot({ path: `${shots}/goals.png`, fullPage: true });

  // Insights
  await page.goto("/insights");
  await expect(page.getByText("Habit leaderboard")).toBeVisible();
  await expect(page.getByRole("link", { name: "Meditate" }).first()).toBeVisible();
  await page.screenshot({ path: `${shots}/insights.png`, fullPage: true });

  // Habit detail
  await page.goto("/habits");
  await page.getByRole("link", { name: /Meditate/ }).first().click();
  await expect(page.getByRole("heading", { name: "Meditate" })).toBeVisible();
  await expect(page.getByText("Done today")).toBeVisible();
  await page.screenshot({ path: `${shots}/habit-detail.png`, fullPage: true });

  // Settings: set location (mock geocoder) and theme
  await page.goto("/settings");
  await page.getByLabel("Search location").fill("Sydney");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByRole("button", { name: /Sydney/ }).click();
  await expect(page.getByText("Sydney, New South Wales, Australia")).toBeVisible();
  await page.getByRole("button", { name: "Light" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.screenshot({ path: `${shots}/settings-light.png`, fullPage: true });
  await page.getByRole("button", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  // Weather card now renders (mock provider)
  await page.goto("/");
  await expect(page.getByText("Partly cloudy")).toBeVisible();
  await expect(page.getByText("Open-Meteo")).toBeVisible();
  await page.screenshot({ path: `${shots}/today-weather.png`, fullPage: true });

  // API token + REST call
  await page.goto("/settings");
  await page.getByPlaceholder("Token name (e.g. iPhone shortcut)").fill("e2e");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  const token = (await page.locator("code", { hasText: /^hs_/ }).first().textContent())?.trim();
  expect(token).toMatch(/^hs_/);
  const res = await page.request.get("/api/v1/today", { headers: { Authorization: `Bearer ${token}` } });
  expect(res.ok()).toBe(true);
  const body = await res.json();
  const meditate = body.habits.find((h: { name: string; id: string }) => h.name === "Meditate");
  expect(meditate).toBeTruthy();
  // Setting a location switched the timezone, so "today" may have rolled over; check the completion log instead.
  const detail = await (await page.request.get(`/api/v1/habits/${meditate.id}`, { headers: { Authorization: `Bearer ${token}` } })).json();
  expect(detail.stats.total).toBe(1);
  expect(detail.completions.length).toBe(1);

  // Sign out -> redirected to login
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/habits");
  await expect(page).toHaveURL(/\/login\?next=%2Fhabits/);

  // Log back in
  await login(page);
});

test("unauthenticated API returns 401", async ({ request }) => {
  const res = await request.get("/api/v1/habits");
  expect(res.status()).toBe(401);
});
