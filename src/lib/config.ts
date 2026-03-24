import { env } from '$env/dynamic/public';

export const apiBaseUrl = env.PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
