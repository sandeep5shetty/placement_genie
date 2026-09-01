import { expect, test } from "@playwright/test";

test.describe("Authentication Pages", () => {
  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: "Welcome back" })
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign up" })).toBeVisible();
  });

  test("register page renders correctly", async ({ page }) => {
    await page.goto("/register");
    await expect(
      page.getByRole("heading", { name: "Create account" })
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign up" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  });

  test("can navigate from login to register", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Sign up" }).click();
    await expect(page).toHaveURL("/register");
  });

  test("can navigate from register to login", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/login");
  });
});

test.describe("Landing page", () => {
  test("shows student and placement cell CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        name: "Know if you are ready. Show the campus why.",
      })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Get started" }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Placement Cell" }).first()
    ).toBeVisible();
  });
});

test.describe("Placement Cell Portal", () => {
  test("login page renders correctly", async ({ page }) => {
    await page.goto("/placement-cell/login");
    await expect(
      page.getByRole("heading", { name: "Placement Cell" })
    ).toBeVisible();
    await expect(page.getByLabel("Access code")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Enter dashboard" })
    ).toBeVisible();
  });

  test("unauthenticated dashboard redirects to login", async ({ page }) => {
    await page.goto("/placement-cell");
    await expect(page).toHaveURL(/\/placement-cell\/login$/);
  });
});
