
import { test, expect, type Page } from "@playwright/test";

const loginUrl = "/login";

async function fillLoginForm(
  page: Page,
  email: string,
  password: string,
) {
  await page.getByLabel("Institutional or personal email").fill(email);
  await page.locator("#login-password").fill(password);
}

async function mockLoginResponse(
  page: Page,
  status: number,
  body: unknown,
) {
  await page.route("**/api/auth/login", async (route) => {
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
}

test("shows validation errors when both fields are empty", async ({
  page,
}) => {
  await page.goto(loginUrl);

  await page.getByRole("button", { name: /sign in|log in/i }).click();

  await expect(
    page.getByText("Please enter your email address.", { exact: true }),
  ).toBeVisible();

  await expect(
    page.getByText("Please enter your password.", { exact: true }),
  ).toBeVisible();

  await expect(page).toHaveURL(/\/login$/);
});

test("shows a validation error for an invalid email", async ({ page }) => {
  await page.goto(loginUrl);
  await fillLoginForm(page, "invalid-email", "ValidPassword123!");

  await page.getByRole("button", { name: /sign in|log in/i }).click();

  await expect(
    page.getByText("Enter a valid email address.", { exact: true }),
  ).toBeVisible();

  await expect(page).toHaveURL(/\/login$/);
});


test("shows an error when the login request fails", async ({ page }) => {
  await page.route("**/api/auth/login", async (route) => {
    await route.abort("failed");
  });

  await page.goto(loginUrl);

  await fillLoginForm(page, "student@example.com", "ValidPassword123!");

  await page.getByRole("button", { name: /sign in|log in/i }).click();

  const errorMessage = page.locator(".login-alert p");

  await expect(errorMessage).toContainText(
    "Unable to connect to the server. Check your connection and try again.",
  );
});

test("handles an expired session response", async ({ page }) => {
  await mockLoginResponse(page, 401, {
    code: "SESSION_EXPIRED",
    message: "Your session has expired. Please sign in again.",
  });

  await page.goto(loginUrl);

  await fillLoginForm(page, "student@example.com", "ValidPassword123!");

  await page.getByRole("button", { name: /sign in|log in/i }).click();

  const loginAlert = page.locator(".login-alert-info");

  await expect(loginAlert).toBeVisible();

  await expect(loginAlert).toContainText(
    "Your session has expired. Please sign in again.",
  );
});


test("shows a pending state while the login request is processing", async ({
  page,
}) => {
  let releaseResponse!: () => void;

  const responseGate = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });

  await page.route("**/api/auth/login", async (route) => {
    await responseGate;

    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        message: "Invalid email or password.",
      }),
    });
  });

  await page.goto(loginUrl);
  await fillLoginForm(page, "student@example.com", "ValidPassword123!");

  await page.getByRole("button", { name: /sign in|log in/i }).click();

  await expect(
    page.getByRole("button", { name: /signing in|please wait/i }),
  ).toBeVisible();

  releaseResponse();

  await expect(
    page.getByText(
      "The email address or password is incorrect.",
      { exact: true },
    ),
  ).toBeVisible();
});

test("redirects after successful login", async ({ page }) => {
  await mockLoginResponse(page, 200, {
    accessToken: "test-access-token",
    user: {
      id: "student-1",
      name: "Test Student",
      email: "student@example.com",
      role: "STUDENT",
    },
  });

  await page.goto(loginUrl);
  await fillLoginForm(page, "student@example.com", "ValidPassword123!");

  await page.getByRole("button", { name: /sign in|log in/i }).click();

  await expect(page).not.toHaveURL(/\/login$/);
});
