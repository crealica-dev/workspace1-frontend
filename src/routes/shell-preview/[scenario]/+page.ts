import { dev } from "$app/environment";
import { error } from "@sveltejs/kit";

import type { PageLoad } from "./$types";
import { isShellPreviewScenario } from "$lib/design/index.js";

export const ssr = false;

export const load: PageLoad = ({ params }) => {
	if (!dev) {
		throw error(404, "Not found");
	}

	if (!isShellPreviewScenario(params.scenario)) {
		throw error(404, "Unknown shell preview scenario");
	}

	return {
		scenario: params.scenario,
	};
};
