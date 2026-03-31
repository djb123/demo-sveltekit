<script lang="ts">
	import type { FavoriteCat } from '$lib/types.js';
	import { db } from '$lib/db.js';

	let { cat }: { cat: FavoriteCat } = $props();

	const src = $derived(cat.imageDataUrl ?? cat.imageUrl ?? '');

	async function remove() {
		if (cat.id != null) {
			await db.favorites.delete(cat.id);
		}
	}
</script>

<div class="group card relative overflow-hidden bg-base-100 shadow-md">
	<figure class="aspect-square overflow-hidden bg-base-200">
		<img {src} alt={cat.name ?? 'cat'} class="h-full w-full object-cover" loading="lazy" />
	</figure>
	<button
		class="btn absolute top-2 right-2 btn-circle opacity-0 shadow transition-opacity btn-xs btn-error group-hover:opacity-100"
		onclick={remove}
		aria-label="Remove from favorites"
	>
		✕
	</button>
	{#if cat.name}
		<div class="px-3 py-2">
			<p class="truncate text-sm font-medium">{cat.name}</p>
		</div>
	{/if}
</div>
