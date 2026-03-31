import { liveQuery } from 'dexie';

export function useLiveQuery<T>(querier: () => T | Promise<T>) {
	let result = $state<T | undefined>(undefined);

	$effect(() => {
		const sub = liveQuery(querier).subscribe({
			next: (v) => {
				result = v;
			}
		});
		return () => sub.unsubscribe();
	});

	return {
		get value() {
			return result;
		}
	};
}
