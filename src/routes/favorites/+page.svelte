<script lang="ts">
	import { db } from '$lib/db.js';
	import { liveQuery } from 'dexie';
	import FavoriteCard from '$lib/components/FavoriteCard.svelte';
	import { resolve } from '$app/paths';

	let activeTab = $state<'api' | 'uploads'>('api');

	const allFavorites = $derived(
		liveQuery(() => db.favorites.orderBy('addedAt').reverse().toArray())
	);

	const apiFavorites = $derived($allFavorites?.filter((f) => !f.isUploaded) ?? []);
	const uploadedFavorites = $derived($allFavorites?.filter((f) => f.isUploaded) ?? []);
	const displayed = $derived(activeTab === 'api' ? apiFavorites : uploadedFavorites);
</script>

<div class="space-y-6">
	<h1 class="text-2xl font-bold">Favorites</h1>

	<div role="tablist" class="tabs-bordered tabs">
		<button
			role="tab"
			class="tab {activeTab === 'api' ? 'tab-active' : ''}"
			onclick={() => (activeTab = 'api')}
		>
			Cat API ({apiFavorites.length})
		</button>
		<button
			role="tab"
			class="tab {activeTab === 'uploads' ? 'tab-active' : ''}"
			onclick={() => (activeTab = 'uploads')}
		>
			My Uploads ({uploadedFavorites.length})
		</button>
	</div>

	{#if $allFavorites === undefined}
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
			{#each Array(8) as _, i (i)}
				<div class="aspect-square skeleton rounded-xl"></div>
			{/each}
		</div>
	{:else if displayed.length === 0}
		<div class="alert">
			{#if activeTab === 'api'}
				<span>
					No favorited cats yet.
					<a href={resolve('/browse')} class="link">Browse cats</a> and click ❤ to save them here.
				</span>
			{:else}
				<span>
					No uploads yet.
					<a href={resolve('/upload')} class="link">Upload your cats</a> to get started.
				</span>
			{/if}
		</div>
	{:else}
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
			{#each displayed as cat (cat.id)}
				<FavoriteCard {cat} />
			{/each}
		</div>
	{/if}
</div>
