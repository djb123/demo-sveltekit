<script lang="ts">
	import type { FavoriteCat } from '$lib/types.js';
	import { db } from '$lib/db.js';
	import { liveQuery } from 'dexie';
	import { resolve } from '$app/paths';

	interface Props {
		open: boolean;
		monthName: string;
		onPick: (cat: FavoriteCat) => void;
		onClose: () => void;
	}

	let { open = $bindable(false), monthName, onPick, onClose }: Props = $props();

	let dialog = $state<HTMLDialogElement | undefined>();
	let searchTerm = $state('');

	const allFavorites = $derived(
		liveQuery(() => db.favorites.orderBy('addedAt').reverse().toArray())
	);

	const filtered = $derived(
		($allFavorites ?? []).filter((cat) => {
			if (!searchTerm.trim()) return true;
			return cat.name?.toLowerCase().includes(searchTerm.toLowerCase());
		})
	);

	$effect(() => {
		if (!dialog) return;
		if (open) {
			searchTerm = '';
			dialog.showModal();
		} else if (dialog.open) {
			dialog.close();
		}
	});

	function handleClose() {
		onClose();
	}

	function pick(cat: FavoriteCat) {
		onPick(cat);
		dialog?.close();
	}
</script>

<dialog bind:this={dialog} class="modal" onclose={handleClose}>
	<div class="modal-box w-full max-w-3xl">
		<h3 class="mb-4 text-lg font-bold">
			Choose photo for <span class="text-primary">{monthName}</span>
		</h3>

		<input
			type="text"
			placeholder="Search by name…"
			class="input-bordered input input-sm mb-4 w-full"
			bind:value={searchTerm}
		/>

		{#if ($allFavorites ?? []).length === 0}
			<div class="alert">
				<span>
					No favorites yet. <a href={resolve('/browse')} class="link">Browse</a> or
					<a href={resolve('/upload')} class="link">upload</a> cat photos first.
				</span>
			</div>
		{:else if filtered.length === 0}
			<div class="alert"><span>No cats match your search.</span></div>
		{:else}
			<div class="grid max-h-96 grid-cols-3 gap-3 overflow-y-auto pr-1 sm:grid-cols-4">
				{#each filtered as cat (cat.id)}
					<button
						class="aspect-square overflow-hidden rounded-lg transition-all hover:ring-2 hover:ring-primary focus:ring-2 focus:ring-primary"
						onclick={() => pick(cat)}
					>
						<img
							src={cat.imageDataUrl ?? cat.imageUrl ?? ''}
							alt={cat.name ?? 'cat'}
							class="h-full w-full object-cover"
						/>
					</button>
				{/each}
			</div>
		{/if}

		<div class="modal-action">
			<form method="dialog">
				<button class="btn btn-ghost">Cancel</button>
			</form>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
