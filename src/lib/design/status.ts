import type { WorkspaceConnectionStatus } from "$lib/api/projects";

export type WorkspaceStatusTone = {
	label: string;
	description: string;
	badgeClass: string;
	panelClass: string;
	iconClass: string;
};

export function workspaceStatusTone(
	status: WorkspaceConnectionStatus,
	message = "",
): WorkspaceStatusTone {
	switch (status) {
		case "ready":
			return {
				label: "Connected",
				description: message || "Projects, sessions, and the assistant are ready.",
				badgeClass:
					"border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
				panelClass:
					"border-emerald-200 bg-emerald-50/80 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100",
				iconClass:
					"bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
			};
		case "checking":
			return {
				label: "Syncing",
				description: message || "Checking backend connection and loading project data.",
				badgeClass:
					"border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300",
				panelClass:
					"border-sky-200 bg-sky-50/80 text-sky-900 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100",
				iconClass:
					"bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
			};
		case "auth_error":
			return {
				label: "Auth issue",
				description: message || "The API rejected this sign-in session.",
				badgeClass:
					"border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
				panelClass:
					"border-amber-200 bg-amber-50/80 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100",
				iconClass:
					"bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
			};
		case "backend_down":
			return {
				label: "Backend down",
				description: message || "The app cannot reach the API right now.",
				badgeClass:
					"border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300",
				panelClass:
					"border-rose-200 bg-rose-50/80 text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100",
				iconClass:
					"bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
			};
		default:
			return {
				label: "Sync failed",
				description:
					message || "The backend responded, but Acheulit could not finish loading.",
				badgeClass:
					"border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300",
				panelClass:
					"border-orange-200 bg-orange-50/80 text-orange-900 dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-100",
				iconClass:
					"bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300",
			};
	}
}
