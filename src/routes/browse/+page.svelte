<script lang="ts">
	import { createQuery, createInfiniteQuery } from '@tanstack/svelte-query';
	import CatCard from '$lib/components/CatCard.svelte';
	import type { CatImage } from '$lib/types.js';

	const LIMIT = 20;

	interface Breed {
		id: string;
		name: string;
	}
	interface Category {
		id: number;
		name: string;
	}

	let selectedBreed = $state('');
	let selectedCategory = $state('');
	let order = $state<'ASC' | 'DESC' | 'RAND'>('RAND');
	let size = $state<'small' | 'med' | 'full'>('med');
	let hasBreeds = $state(false);

	const breedsQuery = createQuery<Breed[]>(() => ({
		queryKey: ['breeds'],
		queryFn: () => fetch('/api/cats/breeds').then((r) => r.json()),
		staleTime: Infinity
	}));

	const categoriesQuery = createQuery<Category[]>(() => ({
		queryKey: ['categories'],
		queryFn: () => fetch('/api/cats/categories').then((r) => r.json()),
		staleTime: Infinity
	}));

	const imagesQuery = createInfiniteQuery<CatImage[]>(() => ({
		queryKey: [
			'cats',
			{ breed: selectedBreed, category: selectedCategory, order, size, hasBreeds }
		],
		queryFn: async ({ pageParam }) => {
			const params = new URLSearchParams({
				page: String(pageParam),
				limit: String(LIMIT),
				order,
				size,
				...(hasBreeds && { hasBreeds: 'true' }),
				...(selectedBreed && { breedId: selectedBreed }),
				...(selectedCategory && { categoryId: String(selectedCategory) })
			});
			const res = await fetch(`/api/cats/images?${params}`);
			if (!res.ok) throw new Error('Failed to fetch images');
			return res.json() as Promise<CatImage[]>;
		},
		initialPageParam: 0,
		getNextPageParam: (lastPage, _allPages, lastPageParam) =>
			lastPage.length < LIMIT ? undefined : (lastPageParam as number) + 1
	}));

	const allImages = $derived(imagesQuery.data?.pages.flat() ?? []);

	function resetFilters() {
		selectedBreed = '';
		selectedCategory = '';
		order = 'RAND';
		size = 'med';
		hasBreeds = false;
	}
</script>

<div class="space-y-6">
	<h1 class="text-2xl font-bold">Browse Cats</h1>

	<!-- Filters -->
	<div class="card bg-base-200 p-4">
		<div class="flex flex-wrap items-end gap-3">
			<div class="form-control">
				<label for="filter-breed" class="label pb-1"
					><span class="label-text text-xs font-medium">Breed</span></label
				>
				<select
					id="filter-breed"
					class="select-bordered select min-w-36 select-sm"
					bind:value={selectedBreed}
				>
					<option value="">All breeds</option>
					{#if breedsQuery.data}
						{#each breedsQuery.data as breed (breed.id)}
							<option value={breed.id}>{breed.name}</option>
						{/each}
					{/if}
				</select>
			</div>

			<div class="form-control">
				<label for="filter-category" class="label pb-1"
					><span class="label-text text-xs font-medium">Category</span></label
				>
				<select
					id="filter-category"
					class="select-bordered select select-sm"
					bind:value={selectedCategory}
				>
					<option value="">All categories</option>
					{#if categoriesQuery.data}
						{#each categoriesQuery.data as cat (cat.id)}
							<option value={cat.id}>{cat.name}</option>
						{/each}
					{/if}
				</select>
			</div>

			<div class="form-control">
				<label for="filter-order" class="label pb-1"
					><span class="label-text text-xs font-medium">Order</span></label
				>
				<select id="filter-order" class="select-bordered select select-sm" bind:value={order}>
					<option value="RAND">Random</option>
					<option value="ASC">Ascending</option>
					<option value="DESC">Descending</option>
				</select>
			</div>

			<div class="form-control">
				<label for="filter-size" class="label pb-1"
					><span class="label-text text-xs font-medium">Size</span></label
				>
				<select id="filter-size" class="select-bordered select select-sm" bind:value={size}>
					<option value="small">Small</option>
					<option value="med">Medium</option>
					<option value="full">Full</option>
				</select>
			</div>

			<div class="form-control justify-end pb-1">
				<label class="label cursor-pointer gap-2">
					<span class="label-text text-xs font-medium">With breed info</span>
					<input type="checkbox" class="checkbox checkbox-sm" bind:checked={hasBreeds} />
				</label>
			</div>

			<button class="btn self-end btn-ghost btn-sm" onclick={resetFilters}>Reset</button>
		</div>
	</div>

	<!-- Results -->
	{#if imagesQuery.isPending}
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
			{#each Array(LIMIT) as _, i (i)}
				<div class="aspect-square skeleton rounded-xl"></div>
			{/each}
		</div>
	{:else if imagesQuery.isError}
		<div class="alert alert-error">
			<span>Failed to load cats. Please try again.</span>
			<button class="btn btn-sm" onclick={() => imagesQuery.refetch()}>Retry</button>
		</div>
	{:else if allImages.length === 0}
		<div class="alert">
			<span>No cats found with these filters. Try different settings.</span>
		</div>
	{:else}
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
			{#each allImages as image (image.id)}
				<CatCard {image} />
			{/each}
			{#if imagesQuery.isFetchingNextPage}
				{#each Array(LIMIT) as _, i (i)}
					<div class="aspect-square skeleton rounded-xl"></div>
				{/each}
			{/if}
		</div>

		<div class="flex justify-center py-6">
			{#if imagesQuery.hasNextPage}
				<button
					class="btn btn-primary"
					onclick={() => imagesQuery.fetchNextPage()}
					disabled={imagesQuery.isFetchingNextPage}
				>
					{imagesQuery.isFetchingNextPage ? 'Loading…' : 'Load More'}
				</button>
			{:else}
				<p class="text-sm text-base-content/50">All {allImages.length} cats loaded</p>
			{/if}
		</div>
	{/if}
</div>
