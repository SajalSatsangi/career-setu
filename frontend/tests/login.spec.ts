
import { test, expect, type Page } from "@playwright/test";

const testEmail = "student@example.com";
const testPassword = "ExamplePassword123!";

async function fillLoginForm(page: Page) {
  await page.goto("/login");

  await page.getByLabel(
    "Institutional or personal email"
  ).fill(testEmail);

  await page.getByLabel("Password", {
    exact: true,
  }).fill(testPassword);
}

async function mockLoginResponse(
  page: Page,
  status: number,
  body: Record<string, string>
) {
  await page.route("**/api/auth/login", async (route) => {
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
}

test("validates empty login fields", async ({ page }) => {
  await page.goto("/login");

  await page.getByRole("button", {
    name: /sign in to careerSetu/i,
  }).click();

  await expect(
    page.getByText("Please enter your email address.")
  ).toBeVisible();

  await expect(
    page.getByText("Please enter your password.")
  ).toBeVisible();
});

test("validates an incorrectly formatted email", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel(
    "Institutional or personal email"
  ).fill("invalid-email");

  await page.getByLabel("Password", {
    exact: true,
  }).fill(testPassword);

  await page.getByRole("button", {
    name: /sign in to careerSetu/i,
  }).click();

  await expect(
    page.getByText("Enter a valid email address.")
  ).toBeVisible();
});

test("shows the invalid credentials alert", async ({ page }) => {
  await mockLoginResponse(page, 401, {
    code: "INVALID_CREDENTIALS",
    message: "Invalid credentials",
  });

  await fillLoginForm(page);

  await page.getByRole("button", {
    name: /sign in to careerSetu/i,
  }).click();

  await expect(
    page.getByText("Unable to sign in")
  ).toBeVisible();

  await expect(
    page.getByText(
      "The email address or password is incorrect."
    )
  ).toBeVisible();
});

test("shows a network error", async ({ page }) => {
  await page.route("**/api/auth/login", async (route) => {
    await route.abort("failed");
  });

  await fillLoginForm(page);

  await page.getByRole("button", {
    name: /sign in to careerSetu/i,
  }).click();

  await expect(
    page.getByText(
      "Unable to connect to the server. Check your connection and try again."
    )
  ).toBeVisible();
});

test("shows the expired session alert", async ({ page }) => {
  await mockLoginResponse(page, 401, {
    code: "SESSION_EXPIRED",
    message: "Session expired",
  });

  await fillLoginForm(page);

  await page.getByRole("button", {
    name: /sign in to careerSetu/i,
  }).click();

  await expect(
    page.getByText("Security session expired")
  ).toBeVisible();

  await expect(
    page.getByText(
      "Your session has expired. Please sign in again."
    )
  ).toBeVisible();
});

test("disables the submit button while the request is pending", async ({
  page,
}) => {
  let releaseRequest!: () => void;

  const requestCanFinish = new Promise<void>((resolve) => {
    releaseRequest = resolve;
  });

  await page.route("**/api/auth/login", async (route) => {
    await requestCanFinish;

    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        code: "INVALID_CREDENTIALS",
      }),
    });
  });

  try {
    await fillLoginForm(page);

    await page.getByRole("button", {
      name: /sign in to careerSetu/i,
    }).click();

    const submittingButton = page.getByRole("button", {
      name: /signing in/i,
    });

    await expect(submittingButton).toBeVisible();
    await expect(submittingButton).toBeDisabled();
  } finally {
    releaseRequest();
  }
});

test("follows the success flow after a successful API response", async ({
  page,
}) => {
  await mockLoginResponse(page, 200, {
    message: "Authenticated",
  });

  await fillLoginForm(page);

  await page.getByRole("button", {
    name: /sign in to careerSetu/i,
  }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
});
    