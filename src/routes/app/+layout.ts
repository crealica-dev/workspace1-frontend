import { redirect } from '@sveltejs/kit';

import type { LayoutLoad } from './$types';
import { auth } from '$lib/auth';

export const ssr = false;

export const load: LayoutLoad = async () => {
	await auth.init();

	const session = auth.getSessionSnapshot();

	if (!session) {
		throw redirect(307, '/');
	}

	return {
		email: session.user.email ?? null,
	};
};
