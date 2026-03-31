<script lang="ts">
	import type { CatImage } from '$lib/types.js';
	import { db } from '$lib/db.js';
	import { useLiveQuery } from '$lib/utils/useLiveQuery.svelte.js';

	let { image }: { image: CatImage } = $props();

	const favQuery = useLiveQuery(() => db.favorites.where('catApiId').equals(image.id).first());
	const isFavorited = $derived(!!favQuery.value);

	async function toggleFavorite() {
		if (favQuery.value?.id != null) {
			await db.favorites.delete(favQuery.value.id);
		} else {
			await db.favorites.add({
				catApiId: image.id,
				imageUrl: image.url,
				isUploaded: false,
				addedAt: new Date()
			});
		}
	}
</script>

<div class="group card overflow-hidden bg-base-100 shadow-md transition-shadow hover:shadow-lg">
	<figure class="relative aspect-square overflow-hidden bg-base-200">
		<img
			src={image.url}
			alt="cat"
			class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
			loading="lazy"
		/>
	</figure>
	<div class="card-actions items-center justify-between px-3 py-2">
		{#if image.breeds?.length}
			<span class="badge max-w-24 truncate badge-ghost text-xs">{image.breeds[0].name}</span>
		{:else}
			<span></span>
		{/if}
		<button
			class="btn btn-circle btn-ghost btn-sm"
			onclick={toggleFavorite}
			aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
		>
			{#if isFavorited}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5 fill-current text-error"
					viewBox="0 0 24 24"
				>
					<path
						d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
					/>
				</svg>
			{:else}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
					/>
				</svg>
			{/if}
		</button>
	</div>
</div>
