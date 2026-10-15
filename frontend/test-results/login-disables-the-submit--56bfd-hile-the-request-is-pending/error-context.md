# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: login.spec.ts >> disables the submit button while the request is pending
- Location: tests\login.spec.ts:133:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /signing in/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('button', { name: /signing in/i }) with timeout 5000ms
  - waiting for getByRole('button', { name: /signing in/i })

```

```yaml
- main:
  - link "CareerSetu home":
    - /url: /
    - text: करियरसेतु CareerSetu Bridge to career opportunities
  - text: Learn. Build. Grow. YOUR CAREER JOURNEY STARTS HERE
  - heading "Your next opportunity starts here." [level=1]
  - paragraph: Build skills, discover learning paths, and move closer to your career goals with CareerSetu.
  - article:
    - text: "01"
    - heading "Personalized learning" [level=2]
    - paragraph: Explore learning paths that match your interests and career goals.
  - article:
    - text: "02"
    - heading "Practical skill building" [level=2]
    - paragraph: Strengthen your skills through focused practice and structured learning.
  - article:
    - text: "03"
    - heading "Career readiness" [level=2]
    - paragraph: Organize your progress and prepare for your next career step.
  - text: A personal learning companion for your next step.
  - heading "Welcome back" [level=2]
  - paragraph: Sign in to continue your learning journey.
  - text: Institutional or personal email
  - textbox "Institutional or personal email":
    - /placeholder: you@example.com
  - paragraph: Use the email address associated with your account.
  - text: Password
  - link "Forgot password?":
    - /url: /forgot-password
  - textbox "Password":
    - /placeholder: Enter your password
  - button "Show password"
  - checkbox "Keep me signed in" [checked]
  - text: Keep me signed in
  - button "Sign in to CareerSetu"
  - text: New to CareerSetu?
  - link "Create an account":
    - /url: /signup
  - paragraph: Your account is protected by the authentication configured for CareerSetu.
```

# Test source

```ts
  65  |     page.getByText("Enter a valid email address.")
  66  |   ).toBeVisible();
  67  | });
  68  | 
  69  | test("shows the invalid credentials alert", async ({ page }) => {
  70  |   await mockLoginResponse(page, 401, {
  71  |     code: "INVALID_CREDENTIALS",
  72  |     message: "Invalid credentials",
  73  |   });
  74  | 
  75  |   await fillLoginForm(page);
  76  | 
  77  |   await page.getByRole("button", {
  78  |     name: /sign in to careerSetu/i,
  79  |   }).click();
  80  | 
  81  |   await expect(
  82  |     page.getByText("Unable to sign in")
  83  |   ).toBeVisible();
  84  | 
  85  |   await expect(
  86  |     page.getByText(
  87  |       "The email address or password is incorrect."
  88  |     )
  89  |   ).toBeVisible();
  90  | });
  91  | 
  92  | test("shows a network error", async ({ page }) => {
  93  |   await page.route("**/api/auth/login", async (route) => {
  94  |     await route.abort("failed");
  95  |   });
  96  | 
  97  |   await fillLoginForm(page);
  98  | 
  99  |   await page.getByRole("button", {
  100 |     name: /sign in to careerSetu/i,
  101 |   }).click();
  102 | 
  103 |   await expect(
  104 |     page.getByText(
  105 |       "Unable to connect to the server. Check your connection and try again."
  106 |     )
  107 |   ).toBeVisible();
  108 | });
  109 | 
  110 | test("shows the expired session alert", async ({ page }) => {
  111 |   await mockLoginResponse(page, 401, {
  112 |     code: "SESSION_EXPIRED",
  113 |     message: "Session expired",
  114 |   });
  115 | 
  116 |   await fillLoginForm(page);
  117 | 
  118 |   await page.getByRole("button", {
  119 |     name: /sign in to careerSetu/i,
  120 |   }).click();
  121 | 
  122 |   await expect(
  123 |     page.getByText("Security session expired")
  124 |   ).toBeVisible();
  125 | 
  126 |   await expect(
  127 |     page.getByText(
  128 |       "Your session has expired. Please sign in again."
  129 |     )
  130 |   ).toBeVisible();
  131 | });
  132 | 
  133 | test("disables the submit button while the request is pending", async ({
  134 |   page,
  135 | }) => {
  136 |   let releaseRequest!: () => void;
  137 | 
  138 |   const requestCanFinish = new Promise<void>((resolve) => {
  139 |     releaseRequest = resolve;
  140 |   });
  141 | 
  142 |   await page.route("**/api/auth/login", async (route) => {
  143 |     await requestCanFinish;
  144 | 
  145 |     await route.fulfill({
  146 |       status: 401,
  147 |       contentType: "application/json",
  148 |       body: JSON.stringify({
  149 |         code: "INVALID_CREDENTIALS",
  150 |       }),
  151 |     });
  152 |   });
  153 | 
  154 |   try {
  155 |     await fillLoginForm(page);
  156 | 
  157 |     await page.getByRole("button", {
  158 |       name: /sign in to careerSetu/i,
  159 |     }).click();
  160 | 
  161 |     const submittingButton = page.getByRole("button", {
  162 |       name: /signing in/i,
  163 |     });
  164 | 
> 165 |     await expect(submittingButton).toBeVisible();
      |                                    ^ Error: expect(locator).toBeVisible() failed
  166 |     await expect(submittingButton).toBeDisabled();
  167 |   } finally {
  168 |     releaseRequest();
  169 |   }
  170 | });
  171 | 
  172 | test("follows the success flow after a successful API response", async ({
  173 |   page,
  174 | }) => {
  175 |   await mockLoginResponse(page, 200, {
  176 |     message: "Authenticated",
  177 |   });
  178 | 
  179 |   await fillLoginForm(page);
  180 | 
  181 |   await page.getByRole("button", {
  182 |     name: /sign in to careerSetu/i,
  183 |   }).click();
  184 | 
  185 |   await expect(page).toHaveURL(/\/dashboard$/);
  186 | });
  187 |     
```