import { expect, test } from "@playwright/test";

const scenarios = ["overview", "chat", "library", "studio", "workflows"] as const;
const viewports = [
	{ name: "desktop", width: 1280, height: 800 },
	{ name: "widescreen", width: 1915, height: 873 },
	{ name: "mobile", width: 390, height: 844 },
];

for (const scenario of scenarios) {
	for (const viewport of viewports) {
		test(`${scenario} shell preview at ${viewport.name}`, async ({ page }, testInfo) => {
			await page.setViewportSize({ width: viewport.width, height: viewport.height });
			await page.goto(`/shell-preview/${scenario}`);

			await expect(page.getByTestId("shell-preview-root")).toBeVisible();
			await expect(page.locator("body")).toContainText("Acheulit");
			const pageOverflow = await page.evaluate(() => {
				const root = document.scrollingElement ?? document.documentElement;
				return root.scrollHeight - window.innerHeight;
			});
			expect(pageOverflow).toBeLessThanOrEqual(1);

			await page.screenshot({
				path: testInfo.outputPath(`${scenario}-${viewport.name}.png`),
				fullPage: true,
			});
		});
	}
}
