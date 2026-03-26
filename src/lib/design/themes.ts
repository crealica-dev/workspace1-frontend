/**
 * Acheulit Color Theme System
 *
 * Architecture:
 * - Each THEME provides a complete set of color tokens (backgrounds, text, borders, surfaces, sidebar).
 * - Each ACCENT rotates the hue of primary/ring/chart tokens via the CSS custom property `--accent-h`.
 * - Themes reference `var(--accent-h)` so accent changes are independent of theme selection.
 * - Dark themes also set `.dark` on <html> for Tailwind `dark:` variant compatibility.
 *
 * Guidelines:
 * - Surface lightness should form a visible ladder (hero < panel < elevated) so cards are distinct.
 * - Borders should be clearly visible: L ≤ 0.90 for light themes, L ≥ 0.28 for dark.
 * - Muted-foreground should have enough contrast against background (WCAG AA target: 4.5:1).
 * - Primary must be dark enough for white text in light themes (L ≤ 0.45).
 * - Sidebar in colored themes uses a dark tint of the theme hue for visual weight.
 * - The `--accent-h` variable is the single point of accent hue control.
 */

export const themeIds = ["daylight", "ocean", "forest", "dusk", "midnight"] as const;
export type ThemeId = (typeof themeIds)[number];

export const accentIds = ["blue", "violet", "teal", "rose", "amber"] as const;
export type AccentId = (typeof accentIds)[number];

export interface ThemeMeta {
	id: ThemeId;
	name: string;
	description: string;
	isDark: boolean;
	/** Approximate hex swatches for preview rendering (bg, sidebar, surface, border). */
	preview: { bg: string; sidebar: string; surface: string; border: string };
}

export interface AccentMeta {
	id: AccentId;
	name: string;
	/** Approximate hex swatch for the accent preview dot. */
	swatch: string;
	/** CSS hue angle used in oklch(). */
	hue: number;
}

export const themes: ThemeMeta[] = [
	{
		id: "daylight",
		name: "Daylight",
		description: "Warm ivory with comfortable contrast",
		isDark: false,
		preview: { bg: "#F6F5F0", sidebar: "#EFEDE7", surface: "#FDFCF9", border: "#DDD9D0" },
	},
	{
		id: "ocean",
		name: "Ocean",
		description: "Cool blue with deep navy sidebar",
		isDark: false,
		preview: { bg: "#E9EDF4", sidebar: "#1E293B", surface: "#F2F5F9", border: "#C8D0DE" },
	},
	{
		id: "forest",
		name: "Forest",
		description: "Sage green with earthy depth",
		isDark: false,
		preview: { bg: "#ECF0EB", sidebar: "#1A2E1E", surface: "#F4F7F3", border: "#CDD6CA" },
	},
	{
		id: "dusk",
		name: "Dusk",
		description: "Soft lavender with purple warmth",
		isDark: false,
		preview: { bg: "#EFECF4", sidebar: "#261E36", surface: "#F5F3F9", border: "#CFC9DC" },
	},
	{
		id: "midnight",
		name: "Midnight",
		description: "Deep charcoal dark mode",
		isDark: true,
		preview: { bg: "#181D2A", sidebar: "#121620", surface: "#1F2636", border: "#2E3548" },
	},
];

export const accents: AccentMeta[] = [
	{ id: "blue", name: "Blue", swatch: "#3B5BDB", hue: 255 },
	{ id: "violet", name: "Violet", swatch: "#7C3AED", hue: 285 },
	{ id: "teal", name: "Teal", swatch: "#0D9488", hue: 185 },
	{ id: "rose", name: "Rose", swatch: "#E11D48", hue: 10 },
	{ id: "amber", name: "Amber", swatch: "#D97706", hue: 70 },
];

export function isThemeId(value: string): value is ThemeId {
	return themeIds.includes(value as ThemeId);
}

export function isAccentId(value: string): value is AccentId {
	return accentIds.includes(value as AccentId);
}

export function getThemeMeta(id: ThemeId): ThemeMeta {
	return themes.find((t) => t.id === id)!;
}

export function getAccentMeta(id: AccentId): AccentMeta {
	return accents.find((a) => a.id === id)!;
}
