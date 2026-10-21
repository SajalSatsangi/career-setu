import { test, expect } from "@playwright/test";

test("discovers a mentor and sends a mentorship request", async ({ page }) => {
  await page.route("**/api/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        accessToken: "test-access-token",
        user: { id: "student-1", name: "Test Student", email: "student@example.com", role: "STUDENT" },
      }),
    });
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
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
  await page.route("**/api/mentoring**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/requests") && route.request().method() === "POST") {
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ id: "request-1", status: "PENDING", mentor: { id: "mentor-1", name: "Mentor One" } }) });
      return;
    }
    if (path.endsWith("/requests")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ id: "profile-1", userId: "mentor-1", bio: "Guidance for early careers.", expertise: ["TypeScript", "React"], availability: "Weekday evenings", user: { id: "mentor-1", name: "Mentor One" } }]) });
  });

  await page.goto("/login");
  await page.getByLabel("Institutional or personal email").fill("student@example.com");
  await page.locator("#login-password").fill("ValidPassword123!");
  await page.getByRole("button", { name: /sign in|log in/i }).click();

  await expect(page.getByRole("heading", { name: "Mentor One" })).toBeVisible();
  await page.getByRole("button", { name: "Request mentor" }).click();

  await expect(page.getByText("pending", { exact: true })).toBeVisible();
  await expect(page.getByText("Mentorship request sent.", { exact: true })).toBeVisible();
});