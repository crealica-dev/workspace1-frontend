import { isAccentId, isThemeId, getThemeMeta, type AccentId, type ThemeId } from "$lib/design/themes.js";

const STORAGE_KEY = "acheulit-theme";

class ThemeStore {
	theme = $state<ThemeId>("daylight");
	accent = $state<AccentId>("blue");

	constructor() {
		if (typeof window !== "undefined") {
			try {
				const raw = localStorage.getItem(STORAGE_KEY);
				if (raw) {
					const parsed = JSON.parse(raw);
					if (isThemeId(parsed.theme)) this.theme = parsed.theme;
					if (isAccentId(parsed.accent)) this.accent = parsed.accent;
				}
			} catch {
				// Ignore parse errors — use defaults
			}
		}
	}

	setTheme(id: ThemeId) {
		this.theme = id;
		this.persist();
	}

	setAccent(id: AccentId) {
		this.accent = id;
		this.persist();
	}

	/** Apply the current theme + accent to the document root. Call inside $effect for reactivity. */
	apply() {
		if (typeof document === "undefined") return;
		const html = document.documentElement;
		html.dataset.theme = this.theme;
		html.dataset.accent = this.accent;

		const meta = getThemeMeta(this.theme);
		if (meta.isDark) {
			html.classList.add("dark");
		} else {
			html.classList.remove("dark");
		}
	}

	private persist() {
		if (typeof localStorage === "undefined") return;
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: this.theme, accent: this.accent }));
	}
}

export const themeStore = new ThemeStore();
