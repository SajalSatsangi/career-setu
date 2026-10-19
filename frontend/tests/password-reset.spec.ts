import { test, expect } from "@playwright/test";

test("shows the development reset link after requesting recovery", async ({ page }) => {
  await page.route("**/api/auth/forgot-password", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        message: "If an account exists for this email, password reset instructions will be sent.",
        developmentToken: "a".repeat(64),
      }),
    });
  });

  await page.goto("/forgotPassword");
  await page.getByLabel("Email address").fill("student@example.com");
  await page.getByRole("button", { name: "Request password reset" }).click();

  await expect(page.getByRole("link", { name: "Continue to set a new password" })).toHaveAttribute(
    "href",
    `/reset-password?token=${"a".repeat(64)}`,
  );
});

test("resets the password with a valid token", async ({ page }) => {
  await page.route("**/api/auth/reset-password", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ message: "Password reset successful. You can now sign in." }),
    });
  });

  await page.goto(`/reset-password?token=${"b".repeat(64)}`);
  await page.getByLabel("New password", { exact: true }).fill("NewPassword123");
  await page.getByLabel("Confirm password", { exact: true }).fill("NewPassword123");
  await page.getByRole("button", { name: "Set new password" }).click();

  await expect(page.getByRole("status")).toHaveText("Password reset successful. You can now sign in.");
  await expect(page.getByRole("link", { name: "Return to sign in" })).toBeVisible();
});