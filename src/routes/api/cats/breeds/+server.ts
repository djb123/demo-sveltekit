import { CATAPIKEY } from '$env/static/private';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const res = await fetch('https://api.thecatapi.com/v1/breeds', {
		headers: { 'x-api-key': CATAPIKEY }
	});

	if (!res.ok) {
		error(502, 'Failed to fetch breeds from TheCatAPI');
	}

	const breeds = await res.json();
	return json(breeds);
};
