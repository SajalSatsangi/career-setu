
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

test("loads the authenticated dashboard after login", async ({ page }) => {
  await mockLoginResponse(page, 200, {
    accessToken: "test-access-token",
    user: {
      id: "student-1",
      name: "Test Student",
      email: "student@example.com",
      role: "STUDENT",
    },
  });

  await page.route("**/api/users/me**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/education")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
      return;
    }
    if (path.endsWith("/skills")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "student-1",
        name: "Test Student",
        email: "student@example.com",
        role: "STUDENT",
      }),
    });
  });

  await page.goto(loginUrl);
  await fillLoginForm(page, "student@example.com", "ValidPassword123!");
  await page.getByRole("button", { name: /sign in|log in/i }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Welcome back, Test." })).toBeVisible();
  await expect(page.getByText("student@example.com", { exact: true })).toBeVisible();
});

test("updates the profile name from the dashboard", async ({ page }) => {
  await mockLoginResponse(page, 200, {
    accessToken: "test-access-token",
    user: { id: "student-1", name: "Test Student", email: "student@example.com", role: "STUDENT" },
  });
  await page.route("**/api/users/me**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() === "PATCH") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: "student-1", name: "Updated Student", email: "student@example.com", role: "STUDENT" }),
      });
      return;
    }

    if (path.endsWith("/education") || path.endsWith("/skills")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: "student-1", name: "Test Student", email: "student@example.com", role: "STUDENT" }),
    });
  });

  await page.goto(loginUrl);
  await fillLoginForm(page, "student@example.com", "ValidPassword123!");
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await expect(page.getByRole("heading", { name: "Welcome back, Test." })).toBeVisible();

  await page.getByRole("button", { name: "Edit name" }).click();
  await page.getByLabel("Name", { exact: true }).fill("Updated Student");
  await page.getByRole("button", { name: "Save name" }).click();

  await expect(page.getByRole("heading", { name: "Welcome back, Updated." })).toBeVisible();
  await expect(page.getByText("Profile updated.", { exact: true })).toBeVisible();
});

test("adds education and skills from the dashboard", async ({ page }) => {
  await mockLoginResponse(page, 200, {
    accessToken: "test-access-token",
    user: { id: "student-1", name: "Test Student", email: "student@example.com", role: "STUDENT" },
  });

  await page.route("**/api/users/me**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path.endsWith("/education")) {
      const body = request.method() === "POST"
        ? { id: "education-1", degree: "B.Tech", institution: "Career University", fieldOfStudy: "Computer Science", startYear: 2024, endYear: null, isCurrent: true }
        : [];
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
      return;
    }
    if (path.endsWith("/skills")) {
      const body = request.method() === "POST"
        ? { id: "skill-1", name: "TypeScript", proficiency: "ADVANCED" }
        : [];
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: "student-1", name: "Test Student", email: "student@example.com", role: "STUDENT" }),
    });
  });

  await page.goto(loginUrl);
  await fillLoginForm(page, "student@example.com", "ValidPassword123!");
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await expect(page.getByRole("heading", { name: "Education" })).toBeVisible();

  await page.getByLabel("Degree").fill("B.Tech");
  await page.getByLabel("Institution", { exact: true }).fill("Career University");
  await page.getByLabel("Field of study", { exact: true }).fill("Computer Science");
  await page.getByLabel("Start year", { exact: true }).fill("2024");
  await page.getByRole("button", { name: "Add education" }).click();
  await expect(page.getByText("B.Tech", { exact: true })).toBeVisible();

  await page.getByLabel("Skill name").fill("TypeScript");
  await page.getByLabel("Skill proficiency").selectOption("ADVANCED");
  await page.getByRole("button", { name: "Add skill" }).click();
  await expect(page.getByText("TypeScript", { exact: true })).toBeVisible();
  await expect(page.getByText("Skill added.", { exact: true })).toBeVisible();
});

test("shows learning paths and enrolls in a course", async ({ page }) => {
  await mockLoginResponse(page, 200, {
    accessToken: "test-access-token",
    user: { id: "student-1", name: "Test Student", email: "student@example.com", role: "STUDENT" },
  });

  await page.route("**/api/users/me**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const body = path.endsWith("/education") || path.endsWith("/skills") ? [] : {
      id: "student-1", name: "Test Student", email: "student@example.com", role: "STUDENT",
    };
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });

  await page.route("**/api/courses**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const course = { id: "course-1", title: "Frontend Foundations", description: "Build accessible interfaces.", category: "Web development", level: "Beginner", published: true, activities: [{ id: "activity-1", title: "Semantic HTML", description: "Structure an accessible page.", position: 1 }] };
    if (path.endsWith("/enrollments")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
      return;
    }
    if (path.endsWith("/complete")) {
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ id: "enrollment-1", progress: 100, course, completions: [{ activityId: "activity-1" }] }) });
      return;
    }
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: "enrollment-1", progress: 0,
          course,
        }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([course]),
    });
  });

  await page.goto(loginUrl);
  await fillLoginForm(page, "student@example.com", "ValidPassword123!");
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await expect(page.getByRole("heading", { name: "Frontend Foundations" })).toBeVisible();

  await page.getByRole("button", { name: "Enroll" }).click();

  await expect(page.getByText("Enrolled · 0%", { exact: true })).toBeVisible();
  await expect(page.getByText("You are enrolled in this learning path.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Mark complete" }).click();
  await expect(page.getByText("Enrolled · 100%", { exact: true })).toBeVisible();
  await expect(page.getByText("Activity completed. Your progress is updated.", { exact: true })).toBeVisible();
});

test("shows open jobs and submits an application", async ({ page }) => {
  await mockLoginResponse(page, 200, {
    accessToken: "test-access-token",
    user: { id: "student-1", name: "Test Student", email: "student@example.com", role: "STUDENT" },
  });

  await page.route("**/api/users/me**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const body = path.endsWith("/education") || path.endsWith("/skills") ? [] : {
      id: "student-1", name: "Test Student", email: "student@example.com", role: "STUDENT",
    };
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.route("**/api/courses**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
  await page.route("**/api/jobs**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/applications")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
      return;
    }
    if (route.request().method() === "POST") {
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ id: "application-1", status: "APPLIED", job: { id: "job-1", companyName: "Career Co", title: "Frontend Engineer", description: "Build products.", location: "Remote", employmentType: "FULL_TIME", requiredSkills: ["TypeScript"], status: "OPEN" } }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ id: "job-1", companyName: "Career Co", title: "Frontend Engineer", description: "Build products.", location: "Remote", employmentType: "FULL_TIME", requiredSkills: ["TypeScript"], status: "OPEN" }]) });
  });

  await page.goto(loginUrl);
  await fillLoginForm(page, "student@example.com", "ValidPassword123!");
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await expect(page.getByRole("heading", { name: "Frontend Engineer" })).toBeVisible();

  await page.getByRole("button", { name: "Apply" }).click();

  await expect(page.getByText("applied", { exact: true })).toBeVisible();
  await expect(page.getByText("Application submitted.", { exact: true })).toBeVisible();
});
