import { expect, test } from "@playwright/test";

test("chat panel preview exposes MCP tools and manual runner", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/shell-preview/chat");

	await expect(page.getByTestId("shell-preview-root")).toBeVisible();
	await page.getByRole("button", { name: "Expand tool rail" }).click();
	await expect(page.locator('label').filter({ hasText: 'generate_text' })).toBeVisible();
	await expect(page.locator('label').filter({ hasText: 'transcribe_audio' })).toBeVisible();
	await expect(page.getByText("Manual tool runner")).toBeVisible();
	await expect(page.getByRole("button", { name: /Run selected tool/i })).toBeVisible();
});
